// Direct official Cloudflare multipart deployment, without running a local bundler.
// Usage: node deploy-api.cjs <Wrangler default.toml path>
const fs=require('fs'),path=require('path');
async function main(){
 const auth=fs.readFileSync(process.argv[2],'utf8');
 const token=auth.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
 if(!token)throw new Error('Wrangler login required');
 const config=JSON.parse(fs.readFileSync(path.join(__dirname,'wrangler.jsonc'),'utf8'));
 const secrets=JSON.parse(fs.readFileSync(path.join(__dirname,'secrets/worker-secrets.json'),'utf8'));
 const base=`https://api.cloudflare.com/client/v4/accounts/${config.account_id}/workers`;
 async function api(route,options={}){
   const response=await fetch(base+route,{...options,headers:{Authorization:'Bearer '+token,...options.headers},signal:AbortSignal.timeout(60000)});
   const result=await response.json();
   if(!response.ok||!result.success)throw new Error(JSON.stringify({status:response.status,errors:result.errors}));
   return result.result;
 }
 const original=fs.readFileSync(path.join(__dirname,'worker.js'),'utf8');
 if(!original.includes('env.ASSETS.fetch(req)'))throw new Error('Asset adapter source changed');
 const assets={};
 for(const [file,type] of [['index.html','text/html; charset=utf-8'],['style.css','text/css; charset=utf-8'],['groups.css','text/css; charset=utf-8'],['panel.js','text/javascript; charset=utf-8'],['groups-panel.js','text/javascript; charset=utf-8']])assets['/'+file]={body:fs.readFileSync(path.join(__dirname,'public',file),'utf8'),type};
 assets['/']=assets['/index.html'];
 const source=`const bundledAssets=${JSON.stringify(assets)};\nfunction serveAsset(req){const a=bundledAssets[new URL(req.url).pathname];if(!['GET','HEAD'].includes(req.method))return new Response('Method not allowed',{status:405});return a?new Response(req.method==='HEAD'?null:a.body,{headers:{'Content-Type':a.type}}):new Response('Not found',{status:404});}\n`+original.replace('env.ASSETS.fetch(req)','serveAsset(req)');
 const metadata={main_module:'worker.js',compatibility_date:config.compatibility_date,bindings:[
  {type:'d1',name:'DB',id:config.d1_databases[0].database_id},
  ...config.ratelimits.map(r=>({type:'ratelimit',...r})),
  ...Object.entries(secrets).map(([name,text])=>({type:'secret_text',name,text}))
 ]};
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');form.set('worker.js',new Blob([source],{type:'application/javascript+module'}),'worker.js');
 const deployed=await api('/scripts/'+config.name,{method:'PUT',body:form});
 console.log('Worker uploaded:',deployed.id||config.name);
 const sub=await api('/subdomain');
 if(!sub.subdomain)throw new Error('Create the free workers.dev subdomain in the Cloudflare dashboard.');
 await api('/scripts/'+config.name+'/subdomain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,previews_enabled:false})});
 console.log('Published URL: https://'+config.name+'.'+sub.subdomain+'.workers.dev');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

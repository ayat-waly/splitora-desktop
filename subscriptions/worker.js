// Secrets belong in Cloudflare secrets, never in this repository or browser storage.
const enc = new TextEncoder();
const plans = { weekly: 7, monthly: 30, five_months: 150, yearly: 365, lifetime: 36500 };
const security = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...security, 'Content-Type': 'application/json' } });
const hash = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map(n => n.toString(16).padStart(2, '0')).join('');
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function fail(code, status = 400) { throw Object.assign(new Error(code), { status }); }
function expiry(data, base=Date.now()) {
  if(data.until){const value=Date.parse(data.until);if(!Number.isFinite(value)||value<=Date.now()||value>Date.now()+36600*86400000)fail('INVALID_INPUT');return value;}
  if(data.unit){const n=Number(data.amount);if(!Number.isInteger(n)||n<1||n>36500||!['days','months','years'].includes(data.unit))fail('INVALID_INPUT');
    const date=new Date(base);if(data.unit==='days')date.setUTCDate(date.getUTCDate()+n);
    else {const day=date.getUTCDate();date.setUTCDate(1);if(data.unit==='months')date.setUTCMonth(date.getUTCMonth()+n);else date.setUTCFullYear(date.getUTCFullYear()+n);const end=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,end));}
    if(date.getTime()>Date.now()+36600*86400000)fail('INVALID_INPUT');return date.getTime();}
  if(!Object.hasOwn(plans,data.plan))fail('INVALID_INPUT');return base+plans[data.plan]*86400000;
}
async function activeSubscription(env,sub){
 if(!sub)fail('INVALID_KEY',403);if(sub.suspended)fail('SUSPENDED',403);
 const group=await env.DB.prepare('SELECT g.* FROM subscription_groups g JOIN group_members m ON m.group_id=g.id WHERE m.subscription_id=?').bind(sub.id).first();
 if(group?.suspended)fail('SUSPENDED',403);
 const effective={...sub,expires:Math.min(sub.expires,group?.expires??Infinity)};
 if(effective.expires<=Date.now())fail('EXPIRED',403);return effective;
}
async function body(req) {
  if (!req.headers.get('content-type')?.startsWith('application/json')) fail('JSON_REQUIRED');
  const reader = req.body?.getReader(); if (!reader) fail('INVALID_BODY');
  const chunks = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 8192) { await reader.cancel(); fail('BODY_TOO_LARGE', 413); } chunks.push(value); }
  const data = new Uint8Array(size); let offset = 0; for (const c of chunks) { data.set(c, offset); offset += c.length; }
  try { const parsed=JSON.parse(new TextDecoder().decode(data)); if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) fail('INVALID_JSON'); return parsed; } catch { fail('INVALID_JSON'); }
}
async function admin(req, env) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 40) fail('NOT_CONFIGURED', 503);
  const token = req.headers.get('authorization') || '';
  if (await hash(token) !== await hash('Bearer ' + env.ADMIN_TOKEN)) fail('UNAUTHORIZED', 401);
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) fail('FORBIDDEN', 403);
}
async function lease(env, subscription, device) {
  if (!env.SIGNING_PRIVATE_KEY) fail('NOT_CONFIGURED', 503);
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.SIGNING_PRIVATE_KEY), { name: 'Ed25519' }, false, ['sign']);
  const now = Date.now();
  const payload = b64(enc.encode(JSON.stringify({ sub: subscription.id, device, plan: subscription.plan, exp: subscription.expires, issued: now, until: Math.min(subscription.expires, now + 86400000) })));
  const sig = await crypto.subtle.sign('Ed25519', key, enc.encode(payload));
  return payload + '.' + b64(new Uint8Array(sig));
}
export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url), route = url.pathname;
      if (!route.startsWith('/api/')) {
        const response = await env.ASSETS.fetch(req);
        const result = new Response(response.body, response); for (const [k, v] of Object.entries(security)) result.headers.set(k, v); return result;
      }
      if (!env.API_LIMITER) fail('NOT_CONFIGURED', 503);
      const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
      const allowed = await env.API_LIMITER.limit({key: (route==='/api/check'?'client:':'admin:')+ip});
      if (!allowed.success) fail('RATE_LIMITED', 429);
      if (route === '/api/check' && req.method === 'POST') {
        const data = await body(req);
        if (typeof data.key !== 'string' || !/^SP2-[a-f0-9]{48}$/.test(data.key) || !/^[a-f0-9]{64}$/.test(data.device || '')) fail('INVALID_KEY', 403);
        const sub = await env.DB.prepare('SELECT * FROM subscriptions WHERE key_hash=?').bind(await hash(data.key)).first();
        await activeSubscription(env,sub);
        if(await env.DB.prepare('SELECT 1 FROM blocked_devices WHERE subscription_id=? AND device_id=?').bind(sub.id,data.device).first())fail('DEVICE_BLOCKED',403);
        try {
          await env.DB.prepare('INSERT INTO devices(subscription_id,device_id,last_seen) VALUES(?,?,?) ON CONFLICT(subscription_id,device_id) DO UPDATE SET last_seen=excluded.last_seen').bind(sub.id, data.device, Date.now()).run();
        } catch (error) { if (String(error).includes('DEVICE_LIMIT')) fail('DEVICE_LIMIT', 403); throw error; }
        // Re-read after allocation so concurrent suspension/renewal is reflected.
        const current = await env.DB.prepare('SELECT * FROM subscriptions WHERE id=?').bind(sub.id).first();
        return json({ ok: true, lease: await lease(env, await activeSubscription(env,current), data.device) });
      }
      await admin(req, env);
      if(route==='/api/groups'&&req.method==='GET'){
        const {results}=await env.DB.prepare('SELECT g.*,(SELECT COUNT(*) FROM group_members WHERE group_id=g.id) AS customers,(SELECT COUNT(*) FROM devices d JOIN group_members m ON m.subscription_id=d.subscription_id WHERE m.group_id=g.id) AS devices FROM subscription_groups g ORDER BY created DESC').all();return json({groups:results});
      }
      if(route==='/api/groups'&&req.method==='POST'){
        const data=await body(req),name=String(data.name||'').trim();
        if(!name||name.length>120||!Number.isInteger(data.maxCustomers)||data.maxCustomers<1||data.maxCustomers>10000||!Number.isInteger(data.maxDevices)||data.maxDevices<1||data.maxDevices>100000)fail('INVALID_INPUT');
        const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO subscription_groups(id,name,expires,max_customers,max_devices,created) VALUES(?,?,?,?,?,?)').bind(id,name,expiry(data),data.maxCustomers,data.maxDevices,Date.now()).run();return json({id},201);
      }
      const groupMatch=route.match(/^\/api\/groups\/([a-f0-9-]{36})$/);
      if(groupMatch&&req.method==='POST'){
        const id=groupMatch[1],data=await body(req),group=await env.DB.prepare('SELECT * FROM subscription_groups WHERE id=?').bind(id).first();if(!group)fail('NOT_FOUND',404);
        let statement;
        if(['suspend','resume'].includes(data.action))statement=env.DB.prepare('UPDATE subscription_groups SET suspended=? WHERE id=?').bind(data.action==='suspend'?1:0,id);
        else if(data.action==='renew')statement=env.DB.prepare('UPDATE subscription_groups SET expires=? WHERE id=?').bind(expiry(data,Math.max(Date.now(),group.expires)),id);
        else if(data.action==='delete'){
          if(data.confirm!==id)fail('CONFIRM_REQUIRED');
          if(await env.DB.prepare('SELECT 1 FROM group_members WHERE group_id=? LIMIT 1').bind(id).first())fail('GROUP_NOT_EMPTY');
          await env.DB.batch([
            env.DB.prepare('DELETE FROM subscription_groups WHERE id=?').bind(id),
            env.DB.prepare('INSERT INTO audit(subscription_id,action,created) VALUES(?,?,?)').bind(id,'delete-group',Date.now())
          ]);return json({ok:true});
        }else fail('INVALID_ACTION');
        await env.DB.batch([statement,env.DB.prepare('INSERT INTO audit(subscription_id,action,created) VALUES(?,?,?)').bind(id,'group-'+data.action,Date.now())]);return json({ok:true});
      }
      const deviceMatch=route.match(/^\/api\/subscriptions\/([a-f0-9-]{36})\/devices$/);
      if(deviceMatch){
        const id=deviceMatch[1];
        if(req.method==='GET'){const {results}=await env.DB.prepare('SELECT device_id,last_seen,0 AS blocked FROM devices WHERE subscription_id=? UNION ALL SELECT device_id,NULL,1 FROM blocked_devices WHERE subscription_id=?').bind(id,id).all();return json({devices:results});}
        if(req.method==='POST'){
          const data=await body(req);if(!/^[a-f0-9]{64}$/.test(data.device||'')||!['block','unblock'].includes(data.action))fail('INVALID_INPUT');
          const statements=data.action==='block'?[env.DB.prepare('INSERT OR IGNORE INTO blocked_devices(subscription_id,device_id) VALUES(?,?)').bind(id,data.device),env.DB.prepare('DELETE FROM devices WHERE subscription_id=? AND device_id=?').bind(id,data.device)]:[env.DB.prepare('DELETE FROM blocked_devices WHERE subscription_id=? AND device_id=?').bind(id,data.device)];
          await env.DB.batch(statements.concat([env.DB.prepare('INSERT INTO audit(subscription_id,action,created) VALUES(?,?,?)').bind(id,data.action+'-device',Date.now())]));return json({ok:true});
        }
      }
      if (route === '/api/subscriptions' && req.method === 'GET') {
        const { results } = await env.DB.prepare('SELECT id,customer,plan,expires,max_devices,suspended,created,(SELECT group_id FROM group_members WHERE subscription_id=subscriptions.id) AS group_id,(SELECT COUNT(*) FROM devices WHERE subscription_id=subscriptions.id) AS devices FROM subscriptions ORDER BY created DESC LIMIT 10000').all();
        return json({ subscriptions: results });
      }
      if (route === '/api/subscriptions' && req.method === 'POST') {
        const data = await body(req), customer = String(data.customer || '').trim();
        if (!customer || customer.length > 120 || !Number.isInteger(data.maxDevices) || data.maxDevices < 1 || data.maxDevices > 20) fail('INVALID_INPUT');
        const expires=expiry(data);
        if(data.groupId&&!await env.DB.prepare('SELECT id FROM subscription_groups WHERE id=?').bind(data.groupId).first())fail('NOT_FOUND',404);
        const key = 'SP2-' + [...crypto.getRandomValues(new Uint8Array(24))].map(n => n.toString(16).padStart(2, '0')).join('');
        const id = crypto.randomUUID(), now = Date.now();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO subscriptions(id,key_hash,customer,plan,expires,max_devices,created) VALUES(?,?,?,?,?,?,?)').bind(id, await hash(key), customer, data.plan||'custom', expires, data.maxDevices, now),
          ...(data.groupId?[env.DB.prepare('INSERT INTO group_members(subscription_id,group_id) VALUES(?,?)').bind(id,data.groupId)]:[]),
          env.DB.prepare('INSERT INTO audit(subscription_id,action,created) VALUES(?,?,?)').bind(id, 'create', now)
        ]);
        return json({ id, key }, 201);
      }
      const match = route.match(/^\/api\/subscriptions\/([a-f0-9-]{36})$/);
      if (match && req.method === 'POST') {
        const data = await body(req), id = match[1];
        const sub = await env.DB.prepare('SELECT * FROM subscriptions WHERE id=?').bind(id).first(); if (!sub) fail('NOT_FOUND', 404);
        let stmt;
        if (data.action === 'suspend' || data.action === 'resume') stmt = env.DB.prepare('UPDATE subscriptions SET suspended=? WHERE id=?').bind(data.action === 'suspend' ? 1 : 0, id);
        else if (data.action === 'renew') stmt = env.DB.prepare('UPDATE subscriptions SET expires=?,plan=? WHERE id=?').bind(expiry(data,Math.max(Date.now(),sub.expires)),data.plan||'custom',id);
        else if(data.action==='delete'){
          if(data.confirm!==id)fail('CONFIRM_REQUIRED');
          await env.DB.batch(['devices','blocked_devices','group_members'].map(table=>env.DB.prepare(`DELETE FROM ${table} WHERE subscription_id=?`).bind(id)).concat([
            env.DB.prepare('DELETE FROM subscriptions WHERE id=?').bind(id),env.DB.prepare('INSERT INTO audit(subscription_id,action,created) VALUES(?,?,?)').bind(id,'delete',Date.now())]));return json({ok:true});
        }
        else if (data.action === 'limit' && Number.isInteger(data.maxDevices) && data.maxDevices >= 1 && data.maxDevices <= 20) {
          const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM devices WHERE subscription_id=?').bind(id).first();
          if (count.n > data.maxDevices) fail('REMOVE_DEVICES_FIRST');
          stmt = env.DB.prepare('UPDATE subscriptions SET max_devices=? WHERE id=?').bind(data.maxDevices, id);
        } else fail('INVALID_ACTION');
        await env.DB.batch([stmt, env.DB.prepare('INSERT INTO audit(subscription_id,action,created) VALUES(?,?,?)').bind(id, data.action, Date.now())]);
        return json({ ok: true });
      }
      return json({ error: 'NOT_FOUND' }, 404);
    } catch (error) { const limit=['GROUP_CUSTOMER_LIMIT','GROUP_DEVICE_LIMIT'].find(code=>String(error).includes(code));return json({ error: limit || (error.status ? error.message : 'SERVER_ERROR') }, limit?409:error.status || 500); }
  }
};

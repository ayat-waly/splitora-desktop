'use strict';
const $ = id => document.getElementById(id);
let token = '', rows = [];
const labels = { weekly:'أسبوع',monthly:'شهر',five_months:'5 شهور',yearly:'سنة',lifetime:'مدى الحياة' };
const errors = {UNAUTHORIZED:'مفتاح الإدارة غير صحيح.',NOT_CONFIGURED:'السيرفر لم يتم إعداده بعد.',REMOVE_DEVICES_FIRST:'لا يمكن تقليل العدد عن الأجهزة المفعلة حاليًا.',INVALID_INPUT:'راجعي اسم العميل والباقة وعدد الأجهزة.',SERVER_ERROR:'تعذّر إتمام الطلب. حاولي لاحقًا.'};
async function api(path, data) {
  const response = await fetch(path,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});
  const result = await response.json(); if (!response.ok) throw new Error(errors[result.error] || result.error); return result;
}
async function action(fn) { $('message').textContent=''; const buttons=[...document.querySelectorAll('button')]; buttons.forEach(b=>b.disabled=true); try {await fn();} catch(e){$('message').textContent=e.message;} finally {buttons.forEach(b=>b.disabled=false);} }
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
async function load(){rows=(await api('/api/subscriptions')).subscriptions;render();}
function render(){
  const list=$('list');list.replaceChildren();
  const filtered=rows.filter(r=>r.customer.toLowerCase().includes($('search').value.toLowerCase()));
  if(!filtered.length){list.append(node('p','لا توجد اشتراكات مطابقة.'));return;}
  for(const r of filtered){
    const card=node('article',undefined,'card'), title=node('h3',r.customer), inactive=r.suspended||r.expires<=Date.now();
    title.append(node('span',r.suspended?'موقوف':inactive?'منتهي':'نشط','badge'+(inactive?' muted':'')));
    card.append(title,node('div',`${labels[r.plan]||r.plan} · الأجهزة ${r.devices} / ${r.max_devices} · ينتهي ${new Date(r.expires).toLocaleDateString('ar-EG')}`,'meta'));
    const controls=node('div',undefined,'actions'),renew=node('select');renew.setAttribute('aria-label','مدة التجديد للعميل '+r.customer);
    for(const [value,label] of Object.entries(labels)){const option=node('option',label);option.value=value;renew.append(option);}renew.value=r.plan;
    const button=(text,fn,danger=false)=>{const b=node('button',text,danger?'danger':'');b.onclick=()=>action(fn);controls.append(b);};
    controls.append(renew);button('تجديد',async()=>{if(!confirm(`تأكيد تمديد اشتراك ${r.customer} لمدة ${labels[renew.value]}؟`))return;await api('/api/subscriptions/'+r.id,{action:'renew',plan:renew.value});await load();});
    button(r.suspended?'استئناف':'إيقاف',async()=>{if(!confirm((r.suspended?'استئناف':'إيقاف')+' اشتراك '+r.customer+'؟'))return;await api('/api/subscriptions/'+r.id,{action:r.suspended?'resume':'suspend'});await load();},!r.suspended);
    const limit=node('input');limit.type='number';limit.min=1;limit.max=20;limit.value=r.max_devices;limit.style.width='80px';limit.setAttribute('aria-label','عدد أجهزة '+r.customer);controls.append(limit);
    button('حفظ عدد الأجهزة',async()=>{await api('/api/subscriptions/'+r.id,{action:'limit',maxDevices:Number(limit.value)});await load();});card.append(controls);list.append(card);
  }
}
$('loginForm').onsubmit=e=>{e.preventDefault();action(async()=>{token=$('token').value.trim();await load();$('token').value='';$('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;});};
$('logout').onclick=()=>{token='';rows=[];$('list').replaceChildren();$('activationKey').value='';$('newKey').hidden=true;$('workspace').hidden=true;$('logout').hidden=true;$('login').hidden=false;};
$('createForm').onsubmit=e=>{e.preventDefault();action(async()=>{const result=await api('/api/subscriptions',{customer:$('customer').value,plan:$('plan').value,maxDevices:Number($('maxDevices').value)});$('activationKey').value=result.key;$('newKey').hidden=false;$('customer').value='';await load();});};
$('copy').onclick=()=>action(async()=>{await navigator.clipboard.writeText($('activationKey').value);$('message').textContent='تم نسخ كود العميل.';});
$('reload').onclick=()=>action(load);$('search').oninput=render;

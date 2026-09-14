'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./subscription-config.json');
let dir, pending;
const file = () => path.join(dir, 'subscription-v2.json');
const locked = reason => ({ mode:'locked',watermark:true,daysLeft:0,plan:null,reason });
function device() {
  const location=path.join(dir,'subscription-device');
  try { const value=fs.readFileSync(location,'utf8'); if(/^[a-f0-9]{64}$/.test(value)) return value; } catch {}
  const value=crypto.randomBytes(32).toString('hex');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(location,value,{flag:'wx'});return value;
}
function save(data) {
  fs.mkdirSync(dir,{recursive:true});
  const { safeStorage }=require('electron');
  if(!safeStorage.isEncryptionAvailable()) throw new Error('SECURE_STORAGE_UNAVAILABLE');
  const encrypted=safeStorage.encryptString(JSON.stringify(data));
  fs.writeFileSync(file()+'.tmp',encrypted);fs.renameSync(file()+'.tmp',file());
}
function read() { return JSON.parse(require('electron').safeStorage.decryptString(fs.readFileSync(file()))); }
function verify(raw) {
  try {
    const parts=raw.split('.');if(parts.length!==2)return null;
    if(!crypto.verify(null,Buffer.from(parts[0]),crypto.createPublicKey(config.publicKey),Buffer.from(parts[1],'base64url')))return null;
    const payload=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8')),now=Date.now();
    if(payload.device!==device()||!Number.isFinite(payload.issued)||!Number.isFinite(payload.until)||!Number.isFinite(payload.exp)||payload.issued>now+60000||payload.until>payload.issued+86400000||payload.until<=now||payload.exp<=now)return null;
    return payload;
  }catch{return null;}
}
async function check(data,activation=false) {
  let server;
  try{server=new URL(config.serverUrl);if(server.protocol!=='https:'||!config.publicKey)throw new Error();}catch{return {ok:false,reason:'NOT_CONFIGURED'};}
  let response;
  try {
    response=await fetch(new URL('/api/check',server),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:data.key,device:device()}),signal:AbortSignal.timeout(10000),redirect:'error'});
    if(response.status>=500||response.status===429)throw new Error('NETWORK');
    const result=await response.json();
    if(!response.ok){if(!activation)save({...data,lease:null});return {ok:false,reason:result.error||'INVALID_KEY'};}
    const payload=verify(result.lease);if(!payload)throw new Error('INVALID_LEASE');
    save({key:data.key,lease:result.lease});return {ok:true,payload};
  }catch{
    const payload=!activation&&verify(data.lease||'');
    return payload?{ok:true,payload,offline:true}:{ok:false,reason:'NETWORK'};
  }
}
async function status() {
  if(!fs.existsSync(file()))return null;
  let data;try{data=read();}catch{return locked('STORAGE');}
  const cached=verify(data.lease||'');
  let result;
  if(cached&&Date.now()-cached.issued<3600000)result={ok:true,payload:cached};
  else { if(!pending)pending=check(data).finally(()=>{pending=null;});result=await pending; }
  if(!result.ok)return locked(result.reason);
  return {mode:'licensed',watermark:false,daysLeft:null,plan:result.payload.plan,expiresAt:result.payload.exp,offline:!!result.offline};
}
module.exports={init:location=>{dir=location;},status,activate:async key=>{
  if(!/^SP2-[a-f0-9]{48}$/.test(key))return {ok:false,reason:'format'};
  const result=await check({key},true);return result.ok?{ok:true,plan:result.payload.plan,expiresAt:result.payload.exp}:result;
}};

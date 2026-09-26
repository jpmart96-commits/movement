// Shared fake Supabase + page helpers
const fs = require('fs'), path = require('path');
const ROOT = process.env.ROOT || require('path').join(__dirname, '..', '..');
const UID = '11111111-1111-1111-1111-111111111111';
function b64u(o){return Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');}
function jwt(expSec){return b64u({alg:'HS256'})+'.'+b64u({sub:UID,exp:expSec,role:'authenticated'})+'.sig';}
class FakeSB {
  constructor(){ this.tables={}; this.log=[]; this.now=()=>Date.now(); this.offline=false; }
  rows(t){ return this.tables[t]||(this.tables[t]=[]); }
  // Parse PostgREST-ish filters: col=eq.v, col=in.("a","b")
  filt(url){
    const fs=[];
    for(const [k,v] of url.searchParams){
      if(['select','order','limit','on_conflict'].includes(k)) continue;
      if(v.startsWith('eq.')) fs.push(r=>String(r[k])===decodeURIComponent(v.slice(3)));
      else if(v.startsWith('in.(')){ const vals=v.slice(4,-1).split(',').map(x=>decodeURIComponent(x).replace(/^"|"$/g,'')); fs.push(r=>vals.includes(String(r[k]))); }
    }
    return r=>fs.every(f=>f(r));
  }
  async handle(route, clockNow){
    const req=route.request(); const url=new URL(req.url()); const m=req.method();
    if(this.offline) return route.abort('internetdisconnected');
    const nowS=Math.floor((this.fakeNowMs||Date.now())/1000);
    if(url.pathname.startsWith('/auth/v1/token')){
      this.log.push('AUTH '+url.search);
      if(url.search.includes('refresh_token') && this.refreshStatus && this.refreshStatus!==200){
        if(this.refreshStatus===-1) return route.abort('internetdisconnected');
        return route.fulfill({status:this.refreshStatus,contentType:'application/json',body:'{"error":"invalid_grant"}'});
      }
      const tok={access_token:jwt(nowS+3600),refresh_token:'r'+(++this.rt||(this.rt=1)),user:{id:UID,email:'jpmart96@gmail.com'}};
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(tok)});
    }
    if(url.pathname.startsWith('/auth/v1/logout')) return route.fulfill({status:204,body:''});
    const auth=(req.headers()['authorization']||'').replace('Bearer ','');
    try{const p=JSON.parse(Buffer.from(auth.split('.')[1],'base64').toString()); if(p.exp && p.exp<nowS){ this.log.push(`401 ${m} ${url.pathname}`); return route.fulfill({status:401,contentType:'application/json',body:'{"message":"JWT expired"}'});}}catch{}
    const t=url.pathname.replace('/rest/v1/','');
    if(this.failTables && this.failTables.includes(t)){ this.log.push(`500 ${m} ${t}`); return route.fulfill({status:500,body:'boom'}); }
    const f=this.filt(url);
    if(m==='GET'){
      let r=this.rows(t).filter(f);
      const order=url.searchParams.get('order'); const limit=url.searchParams.get('limit');
      if(order){const [c,dir]=order.split('.'); r.sort((a,b)=>(a[c]>b[c]?1:-1)*(dir==='desc'?-1:1));}
      if(limit) r=r.slice(0,+limit);
      this.log.push(`GET ${t} -> ${r.length}`);
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(r)});
    }
    if(m==='POST'){
      const parsed=JSON.parse(req.postData()); const oc=(url.searchParams.get('on_conflict')||'').split(',');
      const bodies=Array.isArray(parsed)?parsed:[parsed];
      (this.payloads=this.payloads||[]).push({table:t,body:parsed});
      const rs=this.rows(t);
      for(const body of bodies){ const i=rs.findIndex(x=>oc.every(c=>x[c]===body[c]));
        if(i>=0) rs[i]={...rs[i],...body}; else rs.push(body);
        this.log.push(`UPSERT ${t} ${oc.slice(1).map(c=>body[c]).join('|')}`); }
      return route.fulfill({status:201,body:''});
    }
    if(m==='DELETE'){
      const before=this.rows(t).length; this.tables[t]=this.rows(t).filter(r=>!f(r));
      this.log.push(`DELETE ${t} ${before-this.tables[t].length}`);
      return route.fulfill({status:204,body:''});
    }
    return route.fulfill({status:400,body:'?'});
  }
}
async function newDevice(browser, sb, {tz='Europe/Lisbon', time, session=true, storage=null}={}){
  const ctx=await browser.newContext({timezoneId:tz, viewport:{width:420,height:900}});
  const page=await ctx.newPage();
  page.on('dialog', d=>{ page._dialogs=(page._dialogs||[]); page._dialogs.push(d.message()); d.accept(); });
  page.on('pageerror', e=>{ (page._errors=page._errors||[]).push(String(e)); });
  page.on('console', m=>{ if(m.type()==='error') (page._cerrors=page._cerrors||[]).push(m.text()); });
  if(time) await page.clock.install({time:new Date(time)});
  await page.route('https://smaxfmxcxsmtjnwlysiv.supabase.co/**', r=>sb.handle(r, ()=>page.evaluate(()=>Date.now()).catch(()=>Date.now())));
  await page.route('https://fonts.googleapis.com/**', r=>r.fulfill({status:200,body:''}));
  await page.route('https://fonts.gstatic.com/**', r=>r.fulfill({status:200,body:''}));
  await page.route('http://app.local/**', r=>{
    let p=new URL(r.request().url()).pathname.replace(/^\//,'')||'index.html';
    const f=path.join(ROOT,p); if(!fs.existsSync(f)) return r.fulfill({status:404,body:''});
    const ct=p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html':'application/octet-stream';
    r.fulfill({status:200,contentType:ct,body:fs.readFileSync(f)});
  });
  // preload storage
  await page.addInitScript(({session, storage, jwtTok})=>{
    if(sessionStorage.getItem('__init')) return; sessionStorage.setItem('__init','1');
    if(session && !localStorage.getItem('sb_session')) localStorage.setItem('sb_session', JSON.stringify({access_token:jwtTok, refresh_token:'r', user:{id:'11111111-1111-1111-1111-111111111111'}}));
    if(storage) for(const [k,v] of Object.entries(storage)) localStorage.setItem(k, typeof v==='string'?v:JSON.stringify(v));
  }, {session, storage, jwtTok: jwt(Math.floor((time?new Date(time).getTime():Date.now())/1000)+3600)});
  return {ctx,page};
}
module.exports={FakeSB,newDevice,jwt,UID};

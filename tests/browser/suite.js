// Sync-layer regression suite. ROOT=/path/to/tree node suite.js [filter]
const {chromium}=require('playwright');
const {FakeSB,newDevice,jwt,UID}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
const only=process.argv[2];
const out=[];
function rep(name, ok, detail){ out.push({name,ok,detail}); console.log((ok?'PASS':'FAIL')+' '+name+' :: '+JSON.stringify(detail)); }
const T=(iso)=>new Date(iso).getTime();
const authShown=p=>p.evaluate(()=>getComputedStyle(document.getElementById('auth-screen')).display!=='none');
const pending=p=>p.evaluate(()=>typeof DB.pendingCount==='function'?DB.pendingCount():'n/a');
async function settle(p,ms=2000){ await p.clock.runFor(ms); await W(600); await p.clock.runFor(ms); await W(400); }

const tests={
  // 1.1 token expiry mid-session: open 08:50, finish 11:05
  async tokenExpiry(browser){
    const sb=new FakeSB(); sb.fakeNowMs=T('2026-09-26T08:50:00+01:00');
    const A=await newDevice(browser,sb,{time:'2026-09-26T08:50:00+01:00'});
    await A.page.goto('http://app.local/index.html'); await settle(A.page);
    await A.page.evaluate(()=>History.saveSession({date:'2026-09-25',theme:'x',themes:['weights'],duration:60,blocks:[]}));
    await settle(A.page);
    await A.page.evaluate(()=>startScaffoldToday());
    await A.page.clock.runFor(135*60*1000); sb.fakeNowMs=T('2026-09-26T11:05:00+01:00');
    await A.page.evaluate(()=>{ const s=LiveSession.getSession(); s.blocks.forEach(b=>b.exercises.forEach(e=>e.completed=true)); finishSession(true); });
    await settle(A.page);
    const n401=sb.log.filter(l=>l.startsWith('401')).length, refreshes=sb.log.filter(l=>l.includes('refresh_token')).length;
    const localIdx=await A.page.evaluate(()=>History.getIndex().length);
    await A.page.reload(); await settle(A.page);
    const idx=await A.page.evaluate(()=>History.getIndex().length);
    const st=await A.page.evaluate(()=>DB.get('daily_instance_2026-09-26')?.status);
    const srv=sb.rows('daily_instances').map(r=>r.data.status), srvSess=sb.rows('sessions').length;
    rep('1.1 token expiry 08:50->11:05', idx===2 && st==='completed' && srvSess===2 && srv[0]==='completed',
      {localIdxBeforeReload:localIdx, idxAfterReload:idx, instanceAfterReload:st, serverSessions:srvSess, serverInstance:srv, n401, refreshes, pending:await pending(A.page)});
    await A.ctx.close();
  },
  // 1.4 offline open after expiry
  async offlineStart(browser){
    for (const mode of ['network','500','400']) {
      const sb=new FakeSB(); sb.fakeNowMs=T('2026-09-26T08:00:00+01:00');
      const A=await newDevice(browser,sb,{time:'2026-09-26T08:00:00+01:00'});
      await A.page.goto('http://app.local/index.html'); await settle(A.page);
      await A.page.evaluate(()=>{startScaffoldToday(); LiveSession.logSet(4,0,{weight:60,reps:5});});
      await A.page.clock.runFor(90*60*1000); sb.fakeNowMs=T('2026-09-26T09:30:00+01:00');
      if(mode==='network') sb.offline=true; else sb.refreshStatus=+mode;
      await A.page.reload(); await settle(A.page);
      const r={auth:await authShown(A.page), sb_session:await A.page.evaluate(()=>!!localStorage.getItem('sb_session')), active:await A.page.evaluate(()=>!!localStorage.getItem('pb_active_session')), errs:A.page._errors||[]};
      if(mode==='network'){
        // back online: 'online' event flushes queued work with a fresh token
        await A.page.evaluate(()=>DB.set('probe_override',{x:1}));
        sb.offline=false; await A.page.evaluate(()=>window.dispatchEvent(new Event('online'))); await settle(A.page);
        r.afterOnlinePending=await pending(A.page); r.serverProbe=sb.rows('overrides').some(x=>x.store_key==='probe_override');
      }
      const ok = mode==='400' ? (r.auth && !r.sb_session && r.active) : (!r.auth && r.sb_session && r.active && (mode!=='network'||r.serverProbe));
      rep('1.4 offline open, refresh='+mode, ok, r);
      await A.ctx.close();
    }
  },
  // 1.3 two devices session_index + delete propagation
  async twoDeviceIndex(browser){
    const sb=new FakeSB();
    const P=await newDevice(browser,sb,{}); await P.page.goto('http://app.local/index.html'); await W(1500);
    const D=await newDevice(browser,sb,{}); await D.page.goto('http://app.local/index.html'); await W(1500);
    await P.page.evaluate(()=>History.saveSession({date:'2026-09-26',theme:'phone',themes:['weights'],duration:60,blocks:[]})); await W(1500);
    await D.page.evaluate(()=>History.saveSession({date:'2026-09-26',theme:'desktop',themes:['cardio'],duration:30,blocks:[]})); await W(1500);
    await P.page.reload(); await W(2000);
    const pIdx=await P.page.evaluate(()=>History.getIndex().map(e=>e.theme));
    await D.page.reload(); await W(2000);
    const dIdx=await D.page.evaluate(()=>History.getIndex().map(e=>e.theme));
    rep('1.3 two-device session_index union', pIdx.length===2 && dIdx.length===2, {phone:pIdx, desktop:dIdx, serverIndex:(sb.rows('session_index')[0]?.data||[]).map(e=>e.theme)});
    // index missing an entry that exists in sessions table (old LWW damage)
    sb.rows('sessions').push({user_id:UID,session_key:'session_1790000000000',date:'2026-09-20',theme:'orphan',duration:45,data:{date:'2026-09-20',theme:'orphan',themes:['run'],duration:45,status:'completed',blocks:[]}});
    await P.page.reload(); await W(2000);
    const p2=await P.page.evaluate(()=>History.getIndex().map(e=>e.theme+':'+String(e.date).slice(0,10)));
    rep('1.3 orphan sessions row gets an index entry (sorted newest first)', p2.length===3 && p2[2]==='orphan:2026-09-20', {phone:p2});
    // delete on phone propagates, doesn't resurrect on desktop
    await P.page.evaluate(()=>{ const e=History.getIndex().find(e=>e.theme==='phone'); History.deleteSession(e.id); }); await W(1500);
    await D.page.reload(); await W(2000); await P.page.reload(); await W(2000);
    const d3=await D.page.evaluate(()=>History.getIndex().map(e=>e.theme)), p3=await P.page.evaluate(()=>History.getIndex().map(e=>e.theme));
    rep('1.3 session delete propagates', !d3.includes('phone') && !p3.includes('phone') && !sb.rows('sessions').some(r=>r.data.theme==='phone'), {desktop:d3, phone:p3, serverSessions:sb.rows('sessions').map(r=>r.data.theme)});
    await P.ctx.close(); await D.ctx.close();
  },
  // 1.2 custom list union + delete
  async customList(browser){
    const sb=new FakeSB();
    const local=Array.from({length:16},(_,i)=>({id:'custom_ex_'+i,name:'Mine '+i,category:'Gym',logType:'reps',isCustom:true}));
    const A=await newDevice(browser,sb,{storage:{pb_custom_exercises:local}});
    await A.page.goto('http://app.local/index.html'); await W(1500);
    const B=await newDevice(browser,sb,{}); await B.page.goto('http://app.local/index.html'); await W(1500);
    await B.page.evaluate(()=>Custom.addExercise({name:'Phone one',category:'Gym'})); await W(1500);
    await A.page.reload(); await W(2000);
    const a1=await A.page.evaluate(()=>Custom.getExercises().length);
    await W(1500);
    rep('1.2 local-only list survives + unions', a1===17 && sb.rows('custom_exercises').length===17, {deviceA:a1, serverRows:sb.rows('custom_exercises').length});
    await A.page.evaluate(()=>Custom.deleteExercise('custom_ex_0')); await W(1500);
    const srvAfterDel=sb.rows('custom_exercises').length;
    await B.page.reload(); await W(2000); await A.page.reload(); await W(2000);
    const a2=await A.page.evaluate(()=>Custom.getExercises().map(e=>e.id)), b2=await B.page.evaluate(()=>Custom.getExercises().map(e=>e.id));
    rep('1.2 delete propagates, no resurrection', srvAfterDel===16 && a2.length===16 && b2.length===16 && !a2.includes('custom_ex_0') && !b2.includes('custom_ex_0'), {serverAfterDelete:srvAfterDel, deviceA:a2.length, deviceB:b2.length, aHasDeleted:a2.includes('custom_ex_0'), bHasDeleted:b2.includes('custom_ex_0')});
    // server wiped (20 Sep): local items are pushed back, nothing lost
    sb.tables={}; await A.page.reload(); await W(2500);
    rep('1.2 server wiped -> local re-pushed', (await A.page.evaluate(()=>Custom.getExercises().length))===16 && sb.rows('custom_exercises').length===16, {local:await A.page.evaluate(()=>Custom.getExercises().length), server:sb.rows('custom_exercises').length});
    await A.ctx.close(); await B.ctx.close();
  },
  // 1.6 quota
  async quota(browser){
    const sb=new FakeSB();
    const A=await newDevice(browser,sb,{}); await A.page.goto('http://app.local/index.html'); await W(1500);
    await A.page.evaluate(()=>{ let i=0; const chunk='x'.repeat(100000); try{ for(;;i++) localStorage.setItem('filler_'+i, chunk);}catch(e){} localStorage.removeItem('filler_0'); localStorage.removeItem('filler_1'); });
    sb.rows('sessions').push({user_id:UID,session_key:'session_1790000000001',date:'2026-09-25',theme:'big',data:{date:'2026-09-25',theme:'big',big:'y'.repeat(600000),blocks:[]}});
    await A.page.reload(); await W(2000);
    const r1={auth:await authShown(A.page), sb_session:await A.page.evaluate(()=>!!localStorage.getItem('sb_session')), errs:A.page._errors||[]};
    rep('1.6 quota error during pull does not show login', !r1.auth && r1.sb_session, r1);
    const r2=await A.page.evaluate(async()=>{ const ev=[]; window.addEventListener('sync-status',e=>ev.push(e.detail));
      for(let i=2;i<400;i++){ try{localStorage.setItem('filler_x'+i,'x'.repeat(100000));}catch(e){break;} }
      const ret=DB.set('session_1790000000002',{date:'2026-09-26',theme:'quota',big:'z'.repeat(300000),blocks:[]});
      const pend=typeof DB.pendingCount==='function'?DB.pendingCount():'n/a';
      return {ret, pend, quotaEvent:ev.some(d=>d.quota)}; });
    await W(2000);
    r2.uploaded=sb.rows('sessions').some(r=>r.session_key==='session_1790000000002');
    rep('1.6 DB.set under quota still uploads', r2.ret===false && r2.uploaded && r2.quotaEvent, r2);
    await A.ctx.close();
  },
  // profile: API key never pushed; local-only fields kept
  async apiKey(browser){
    const sb=new FakeSB();
    sb.rows('profile').push({user_id:UID,data:{exerciseStates:{},goalMilestones:{a:2},settings:{weightUnit:'kg',anthropicApiKey:'sk-ant-LEGACY'}}});
    const A=await newDevice(browser,sb,{storage:{pb_profile:{exerciseStates:{},localOnlyField:{keep:true},settings:{weightUnit:'lb',anthropicApiKey:'sk-ant-LOCAL'}}}});
    await A.page.goto('http://app.local/index.html'); await W(2000);
    const p1=await A.page.evaluate(()=>DB.get('profile'));
    await A.page.evaluate(()=>{ const p=Profile.load(); p.settings.anthropicApiKey='sk-ant-NEW'; Profile.save(p); }); await W(1500);
    const leaked=(sb.payloads||[]).filter(x=>JSON.stringify(x.body).includes('sk-ant-')).length;
    const serverHas=JSON.stringify(sb.rows('profile')).includes('sk-ant-');
    rep('API key never pushed; legacy remote scrubbed; local kept', leaked===0 && !serverHas && p1.settings.anthropicApiKey==='sk-ant-LOCAL',
      {pushedPayloadsWithKey:leaked, serverStillHasKey:serverHas, localKeyAfterPull:p1.settings.anthropicApiKey, localOnlyFieldKept:!!p1.localOnlyField, remoteMilestonesApplied:p1.goalMilestones?.a});
    await A.ctx.close();
  },
  // pending survives reload, flushes on next boot
  async outboxPersist(browser){
    const sb=new FakeSB();
    const A=await newDevice(browser,sb,{}); await A.page.goto('http://app.local/index.html'); await W(1500);
    sb.offline=true;
    await A.page.evaluate(()=>History.saveSession({date:'2026-09-26',theme:'offline',themes:['weights'],duration:60,blocks:[]})); await W(1500);
    const p1=await pending(A.page);
    await A.page.reload(); await W(2000);
    const p2=await pending(A.page), auth=await authShown(A.page);
    const status=await A.page.evaluate(async()=>{ await manualSync(); return document.getElementById('sync-status').textContent; });
    sb.offline=false;
    await A.page.reload(); await W(2000);
    const p3=await pending(A.page);
    const up=sb.rows('sessions').some(r=>r.data.theme==='offline');
    const exported=await A.page.evaluate(()=>Object.keys(DB.exportAll()).filter(k=>/outbox|tombstone/.test(k)));
    rep('outbox survives reload and flushes on next boot', p1>0 && p2>0 && !auth && p3===0 && up && exported.length===0 && /not yet synced/.test(status),
      {pendingOffline:p1, pendingAfterOfflineReload:p2, manualSyncMsgOffline:status, pendingAfterOnlineReload:p3, serverHasSession:up, outboxInExport:exported});
    await A.ctx.close();
  },
  // 1.5 month plan seed reaches the phone on a normal boot
  async seed(browser){
    const sb=new FakeSB();
    const A=await newDevice(browser,sb,{storage:{pb_month_plan:{seedVersion:1,title:'old',days:[]}}});
    await A.page.goto('http://app.local/index.html'); await W(2000);
    const r=await A.page.evaluate(()=>({local:DB.get('month_plan')?.seedVersion, shipped:MONTH_PLAN_SEED.seedVersion}));
    rep('1.5 boot applies shipped seedVersion', r.local===r.shipped, r);
    await A.ctx.close();
  },
  // daily instance: more logged work wins over a stale remote copy
  async dailyInstance(browser){
    const sb=new FakeSB();
    const ex=(c)=>[{key:'m',exercises:[{id:'a',completed:c,sets:c?[{reps:5},{reps:5}]:[]}]}];
    sb.rows('daily_instances').push({user_id:UID,date:'2026-09-25',weekday:'friday',data:{date:'2026-09-25',weekday:'friday',status:'active',blocks:ex(false)}});
    const A=await newDevice(browser,sb,{storage:{'pb_daily_instance_2026-09-25':{date:'2026-09-25',weekday:'friday',status:'completed',blocks:ex(true)}}});
    await A.page.goto('http://app.local/index.html'); await W(2500);
    const r={local:await A.page.evaluate(()=>DB.get('daily_instance_2026-09-25')?.status), server:sb.rows('daily_instances')[0].data.status};
    rep('daily_instance: completed local beats stale remote', r.local==='completed' && r.server==='completed', r);
    await A.ctx.close();
  },
  // single-flight refresh: boot with an expired token fires ~12 parallel requests
  async singleFlight(browser){
    const sb=new FakeSB(); sb.fakeNowMs=T('2026-09-26T08:00:00+01:00');
    const A=await newDevice(browser,sb,{time:'2026-09-26T08:00:00+01:00'});
    await A.page.goto('http://app.local/index.html'); await settle(A.page);
    await A.page.clock.runFor(2*3600*1000); sb.fakeNowMs=T('2026-09-26T10:00:00+01:00'); sb.log=[];
    await A.page.reload(); await settle(A.page);
    const r={refreshes:sb.log.filter(l=>l.includes('refresh_token')).length, n401:sb.log.filter(l=>l.startsWith('401')).length, gets:sb.log.filter(l=>l.startsWith('GET')).length, auth:await authShown(A.page)};
    rep('token refresh is single-flight', r.refreshes===1 && r.n401===0 && r.gets>=10 && !r.auth, r);
    await A.ctx.close();
  },
  // one table failing server-side (e.g. month_plans missing) doesn't break boot or lie
  async partialFail(browser){
    const sb=new FakeSB(); sb.failTables=['month_plans'];
    const A=await newDevice(browser,sb,{}); await A.page.goto('http://app.local/index.html'); await W(2000);
    const msg=await A.page.evaluate(async()=>{ await manualSync(); return document.getElementById('sync-status').textContent; });
    rep('partial server failure: boots, reports honestly', !(await authShown(A.page)) && /not yet synced/.test(msg), {msg, pending:await pending(A.page), errs:A.page._errors||[]});
    await A.ctx.close();
  },
  // re-adding a deleted id (fixed-id DLC) is not re-deleted by the tombstone
  async revive(browser){
    const sb=new FakeSB();
    const item={id:'dlc_fixed_1',name:'DLC one',category:'Gym',isCustom:true};
    const A=await newDevice(browser,sb,{storage:{pb_custom_exercises:[item]}}); await A.page.goto('http://app.local/index.html'); await W(2000);
    await A.page.evaluate(()=>Custom.deleteExercise('dlc_fixed_1')); await W(1500);
    const B=await newDevice(browser,sb,{}); await B.page.goto('http://app.local/index.html'); await W(2000);
    await B.page.evaluate(it=>Custom.saveExercises([...Custom.getExercises(), it]), item); await W(1500);
    await A.page.reload(); await W(2000); await B.page.reload(); await W(2000);
    const r={a:await A.page.evaluate(()=>Custom.getExercises().map(e=>e.id)), b:await B.page.evaluate(()=>Custom.getExercises().map(e=>e.id)), server:sb.rows('custom_exercises').map(x=>x.exercise_id)};
    rep('re-added id survives on both devices', r.a.length===1 && r.b.length===1 && r.server.length===1, r);
    await A.ctx.close(); await B.ctx.close();
  },
  // steady state: a second boot with nothing changed uploads nothing
  async steady(browser){
    const sb=new FakeSB();
    const A=await newDevice(browser,sb,{storage:{pb_custom_exercises:[{id:'c1',name:'c',isCustom:true}]}}); await A.page.goto('http://app.local/index.html'); await W(1500);
    await A.page.evaluate(()=>{ History.saveSession({date:'2026-09-24',theme:'a',themes:['weights'],duration:60,blocks:[]}); DB.set('daily_instance_2026-09-24',{date:'2026-09-24',weekday:'thursday',status:'completed',blocks:[]}); }); await W(1500);
    await A.page.reload(); await W(2500);
    sb.log=[]; await A.page.reload(); await W(2500);
    const ups=sb.log.filter(l=>/UPSERT|DELETE/.test(l));
    rep('steady state: no redundant uploads on reboot', ups.length===0, {writesOnThirdBoot:ups, pending:await pending(A.page)});
    await A.ctx.close();
  },
  // clean boots
  async cleanBoot(browser){
    for (const session of [false,true]) {
      const sb=new FakeSB(); const A=await newDevice(browser,sb,{session}); await A.page.goto('http://app.local/index.html'); await W(2000);
      const r={auth:await authShown(A.page), pageErrors:A.page._errors||[], consoleErrors:A.page._cerrors||[]};
      rep('clean boot '+(session?'signed-in':'signed-out')+' empty storage', r.auth===!session && !r.pageErrors.length && !r.consoleErrors.length, r);
      await A.ctx.close();
    }
  },
};
(async()=>{
  const browser=await chromium.launch();
  for (const [n,f] of Object.entries(tests)) { if(only && !n.includes(only)) continue; try{ await f(browser);}catch(e){ rep(n+' (threw)', false, String(e).slice(0,300)); } }
  await browser.close();
  console.log(`\n${out.filter(x=>x.ok).length}/${out.length} passed (ROOT=${process.env.ROOT})`);
})();

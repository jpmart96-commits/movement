// Nov–Dec plan on Today: ~75–90 min days, and the weekly skill counter
// (handstand x3, pancake x3, hang x2) filling from logged sessions in any
// order. node tests/browser/skill-week.js   (SHOTS=dir writes screenshots)
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-11-11T08:30:00+00:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-11-11T08:30:00+00:00'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message));
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>navTo('today')); await W(400);
  const st=()=>A.page.evaluate(()=>({
    theme: document.querySelector('#today-body .mv-display')?.textContent,
    head: document.querySelector('#today-body .mv-eyebrow')?.textContent,
    pills: [...document.querySelectorAll('#today-body .mv-skillwk')].map(x=>x.textContent.trim()),
    oks: document.querySelectorAll('#today-body .mv-skillwk.ok').length,
    blocks: [...document.querySelectorAll('#today-body .mv-blk-label')].map(x=>x.textContent),
  }));
  let s=await st(); console.log(JSON.stringify(s));
  ok(/WED 11 NOV/.test(s.head||''),'Wednesday 11 Nov');
  ok(/(\d+) MIN/.test(s.head) && +s.head.match(/(\d+) MIN/)[1] <= 90,'day is 90 min or less: '+s.head);
  ok(s.blocks.some(b=>/Handstand/.test(b)),'handstand is the skill block');
  ok(JSON.stringify(s.pills)===JSON.stringify(['Handstand 0/3','Pancake 0/3','Hang 0/2']),'counter starts at zero');
  // Mon: Strength A logged as planned; Tue: the bike day done as handstand instead
  await A.page.evaluate(()=>{
    const mon=Generator.generateFromScaffold({date:new Date('2026-11-09T12:00:00'),profile:App.profile});
    History.saveSession({...mon,date:'2026-11-09',status:'completed'});
    const tue=Generator.generateFromScaffold({date:new Date('2026-11-13T12:00:00'),profile:App.profile});   // Friday's bike = handstand
    History.saveSession({...tue,date:'2026-11-10',status:'completed'});
    const last=Generator.generateFromScaffold({date:new Date('2026-11-08T12:00:00'),profile:App.profile});  // the week before: not counted
    History.saveSession({...last,date:'2026-11-08',status:'completed'});
    renderToday();
  }); await W(300);
  s=await st(); console.log(JSON.stringify(s.pills));
  ok(JSON.stringify(s.pills)===JSON.stringify(['Handstand 1/3','Pancake 0/3','Hang 1/2']),'counts this week only, by the skill each session carried');
  if(process.env.SHOTS){ await A.page.setViewportSize({width:390,height:900}); await W(200); await A.page.screenshot({path:process.env.SHOTS+'/today-nov11.png'}); }
  await A.page.emulateMedia({colorScheme:'dark'}); await W(200);
  if(process.env.SHOTS) await A.page.screenshot({path:process.env.SHOTS+'/today-nov11-dark.png'});
  const e2=errs.filter(e=>!/ERR_TUNNEL|net::/.test(e));
  ok(!e2.length,'no page errors '+JSON.stringify(e2));
  await browser.close();
  console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})();

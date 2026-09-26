// Home week slider: three Mon–Sun weeks (previous, current, next), opens on
// the current one, arrows/dots move it, and it recovers when rendered hidden.
// node tests/browser/week-slider.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-26T08:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-26T08:30:00+01:00'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message));
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>navTo('home')); await W(300);
  const state=()=>A.page.evaluate(()=>{
    const t=document.querySelector('[data-wks-track]');
    const pages=[...t.querySelectorAll('.mv-wks-page')].map(p=>({
      label:p.querySelector('.mv-eyebrow').textContent, range:p.querySelector('.mv-wks-range').textContent,
      days:[...p.querySelectorAll('.mv-day')].map(d=>d.querySelector('.mv-day-dow').textContent+d.querySelector('.mv-day-num').textContent+(d.classList.contains('today')?'*':'')).join(' ')}));
    return {pages, page:Math.round(t.scrollLeft/t.clientWidth), dot:[...document.querySelectorAll('.mv-wks-dots i')].findIndex(i=>i.classList.contains('on')),
      prevDis:document.querySelector('[data-wks-go="-1"]').disabled, nextDis:document.querySelector('[data-wks-go="1"]').disabled};
  });
  let s=await state(); console.log(JSON.stringify(s.pages,null,1));
  ok(s.pages.length===3,'three pages');
  ok(s.pages.every(p=>p.days.split(' ').length===7),'seven days each');
  ok(s.pages[1].days.startsWith('M21')&&s.pages[1].days.includes('S26*'),'current week Mon 21 with today 26');
  ok(s.page===1&&s.dot===1,'opens on current week');
  await A.page.screenshot({path:'/tmp/wk-current.png',clip:await A.page.locator('.mv-wks').boundingBox()});
  await A.page.click('[data-wks-go="1"]'); await A.page.clock.runFor(1000); await W(700);
  s=await state(); ok(s.page===2&&s.dot===2&&s.nextDis,'next arrow → next week, next disabled');
  await A.page.screenshot({path:'/tmp/wk-next.png',clip:await A.page.locator('.mv-wks').boundingBox()});
  await A.page.click('.mv-wks-dots i[data-wks-to="0"]'); await A.page.clock.runFor(1000); await W(700);
  s=await state(); ok(s.page===0&&s.prevDis,'dot → previous week, prev disabled');
  await A.page.screenshot({path:'/tmp/wk-prev.png',clip:await A.page.locator('.mv-wks').boundingBox()});
  // swipe-like: scroll the track directly
  await A.page.evaluate(()=>{const t=document.querySelector('[data-wks-track]'); t.scrollLeft=t.clientWidth;}); await W(300);
  s=await state(); ok(s.dot===1&&!s.prevDis&&!s.nextDis,'manual scroll updates dots');
  // rendered while hidden → shows current week once visible
  await A.page.evaluate(()=>navTo('log')); await W(200);
  await A.page.evaluate(()=>renderHome()); await W(100);
  await A.page.evaluate(()=>navTo('home')); await W(400);
  s=await state(); ok(s.page===1,'hidden render recovers to current week');
  // desktop width
  await A.page.setViewportSize({width:1400,height:900}); await W(400);
  s=await state(); ok(s.page===1,'resize keeps current page');
  await A.page.screenshot({path:'/tmp/wk-desktop.png'});
  ok(errs.length===0,'no page errors '+JSON.stringify(errs));
  await browser.close(); process.exit(fails?1:0);
})();

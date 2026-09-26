// Day sheet: timeline layout — one line per block, Main Focus open, tap to
// open a block, tap an exercise for its note, Open all / Close all.
// node tests/browser/day-sheet.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-26T08:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-26T08:30:00+01:00'});
  await A.page.emulateMedia({colorScheme:'dark'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message));
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>navTo('home')); await W(300);
  // Sun 27 Sep: test day, no Main Focus → all blocks closed
  await A.page.evaluate(()=>openDaySheet('2026-09-27')); await W(300);
  const st=()=>A.page.evaluate(()=>{const b=document.getElementById('day-sheet-body');return{
    blocks:[...b.querySelectorAll('.ds-blk')].map(x=>({label:x.querySelector('.mv-blk-label').textContent,open:x.classList.contains('open'),sumVisible:getComputedStyle(x.querySelector('.mv-blk-summary')).display!=='none',bodyVisible:getComputedStyle(x.querySelector('.mv-blk-body')).display!=='none'})),
    tag:!!b.querySelector('.ds-tag'), chips:[...b.querySelectorAll('.ds-chips .mv-chip')].map(c=>c.textContent),
    noteH:b.querySelector('.ds-note-text')?.getBoundingClientRect().height, tests:b.querySelectorAll('.ds-test').length}});
  let s=await st(); console.log(JSON.stringify(s));
  ok(s.tag,'test tag'); ok(s.chips.length>=3,'chips row');
  ok(s.blocks.length>=4 && s.blocks.every(b=>!b.open && b.sumVisible && !b.bodyVisible),'all blocks collapsed with summaries');
  ok(s.noteH<70,'note clamped ('+s.noteH+'px)');
  await A.page.screenshot({path:'/tmp/ds-27-closed.png',clip:await A.page.locator('#day-sheet-backdrop .modal').boundingBox()});
  await A.page.locator('.ds-blk .mv-blk-head').nth(1).click(); await W(150);
  const firstNote=A.page.locator('.ds-blk.open .ds-ex.has-note').first();
  await firstNote.click(); await W(150);
  ok(await firstNote.evaluate(x=>x.classList.contains('open')&&getComputedStyle(x.querySelector('.ds-ex-note')).display==='block'),'exercise note opens on tap');
  ok((await st()).tests>0,'test doses shown as chips');
  await A.page.screenshot({path:'/tmp/ds-27-open.png',clip:await A.page.locator('#day-sheet-backdrop .modal').boundingBox()});
  await A.page.click('.ds-note--long'); await W(100);
  ok((await st()).noteH>70,'note expands');
  await A.page.click('.ds-all'); await W(100);
  s=await st(); ok(s.blocks.every(b=>b.open&&b.bodyVisible),'open all');
  await A.page.click('.ds-all'); await W(100);
  s=await st(); ok(s.blocks.every(b=>!b.open),'close all');
  await A.page.evaluate(()=>closeDaySheet());
  // Mon 28 Sep: a strength day → Main Focus open
  await A.page.evaluate(()=>openDaySheet('2026-09-28')); await W(300);
  s=await st(); console.log(JSON.stringify(s.blocks.map(b=>b.label+(b.open?'*':''))));
  ok(s.blocks.filter(b=>b.open).length===1,'one block (Main Focus) open on a training day');
  await A.page.screenshot({path:'/tmp/ds-28.png',clip:await A.page.locator('#day-sheet-backdrop .modal').boundingBox()});
  ok(errs.length===0,'no page errors '+JSON.stringify(errs));
  await browser.close(); process.exit(fails?1:0);
})();

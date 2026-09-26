// Settings end to end: tabs, library browse / search / filter, the exercise
// sheet (state, tracked, edit refresh), steppers saving, zone ordering,
// equipment chips, and sync-status still reachable. node tests/browser/settings.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
const out=process.env.SHOTS||'/tmp';
let fails=0; const ok=(c,m)=>{ console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++; };
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); const T='2026-09-26T19:30:00+01:00'; sb.fakeNowMs=new Date(T).getTime();
  const A=await newDevice(browser,sb,{time:T}); const p=A.page;
  await p.route(/img\.youtube\.com|githubusercontent/, r=>r.fulfill({status:404,body:''}));
  await p.goto('http://app.local/index.html'); await p.clock.runFor(3000); await W(800);
  await p.click('.nav-btn[data-screen="settings"]'); await W(200);

  ok(await p.isVisible('[data-set-panel="library"].on'), 'Library tab is the landing tab');
  const tiles=await p.$$('.lib-cat'); ok(tiles.length>=8, `category tiles (${tiles.length})`);
  ok(!(await p.isVisible('#fab')), 'no floating + on Settings');

  await p.click('.lib-cat >> text=Gym'); await W(150);
  ok(/Gym/.test(await p.textContent('.lib-crumb-t')), 'tile opens its category');
  const gymRows=(await p.$$('.lib-row')).length; ok(gymRows>10, `category rows (${gymRows})`);
  await p.click('.lib-subs >> text=Prehab'); await W(100);
  ok((await p.$$('.lib-row')).length<gymRows, 'subcategory chip narrows');
  await p.click('.lib-back'); await W(100);
  ok((await p.$$('.lib-cat')).length===tiles.length, 'back to tiles');

  await p.fill('#lib-q','box breathing'); await W(150);
  ok(await p.isVisible('#lib-q'), 'search field keeps focus position');
  const rows=await p.$$('.lib-row'); ok(rows.length>=1, 'search finds box breathing');
  await rows[0].click(); await W(150);
  ok(await p.isVisible('#lib-sheet'), 'row opens the sheet');
  await p.click('#lib-sheet .lib-state >> text=Excluded'); await W(100);
  const st=await p.evaluate(()=>Profile.getExerciseState(Profile.load(),'box-breathing'));
  ok(st==='excluded', 'state saved from the sheet');
  ok(await p.isVisible('.lib-row.is-excluded'), 'row shows excluded behind the sheet');
  await p.click('#lib-sheet .mv-sheet-foot >> text=Edit'); await W(150);
  ok(await p.isVisible('#ex-edit-backdrop'), 'Edit opens the editor above the sheet');
  await p.fill('#exe-notes','Soft belly.'); await p.click('#ex-edit-body >> text=Save'); await W(150);
  ok(/Soft belly/.test(await p.textContent('#lib-sheet')), 'sheet refreshes after edit');
  await p.click('#lib-sheet .lib-state >> text=Active'); await p.click('.mv-sheet-x >> nth=-1').catch(()=>{});
  await p.evaluate(()=>closeLibSheet());
  await p.fill('#lib-q',''); await W(100);
  await p.click('.lib-filters >> text=No how-to'); await W(100);
  const nohow=await p.$$eval('.lib-row .lib-miss',e=>e.length), all=await p.$$eval('.lib-row',e=>e.length);
  ok(all>0 && nohow===all, `No how-to filter (${all})`);

  // chip on Block still opens the sheet
  await p.evaluate(()=>openExView('squat'));
  ok(await p.isVisible('#lib-sheet'), 'openExView → library sheet'); await p.evaluate(()=>closeLibSheet());

  await p.click('[data-set-tab="training"]'); await W(100);
  await p.click('#rest-heavy >> xpath=../../button[2]'); await W(50);
  ok(await p.evaluate(()=>Profile.load().settings.defaultRestHeavy)===195, 'rest + saves');
  await p.click('#set-bw >> xpath=../../button[2]'); await W(50);
  ok(await p.evaluate(()=>Profile.load().settings.bodyweightKg)===75, 'empty bodyweight steps from base');
  await p.fill('#hrz-z2','170'); await p.dispatchEvent('#hrz-z2','change'); await W(80);
  const z=await p.evaluate(()=>Profile.load().settings.hrZones);
  ok(z.z2===170 && z.z3>170 && z.z4>z.z3, `zones stay ordered ${JSON.stringify(z)}`);
  const eqBefore=await p.evaluate(()=>!!Profile.load().equipment.barbell);
  await p.click('.set-eq >> text=Barbell'); await W(50);
  ok(await p.evaluate(()=>!!Profile.load().equipment.barbell)!==eqBefore, 'equipment chip toggles');

  await p.click('[data-set-tab="app"]'); await W(100);
  await p.click('[data-theme-opt="light"]'); await W(50);
  ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='light', 'theme switch');
  const s=await p.evaluate(async()=>{ await manualSync(); return document.getElementById('sync-status').textContent; });
  ok(/Sync/i.test(s), 'sync status line updates: '+s);
  await p.screenshot({path:out+'/settings-app.png',fullPage:true});
  ok(!(p._errors||[]).length, 'no page errors '+JSON.stringify(p._errors||[]));
  await browser.close(); process.exit(fails?1:0);
})();

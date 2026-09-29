// ─────────────────────────────────────────────────────────────
// MEALS — built-in data (ingredients, components, recipes)
//
// Ported from the Meals prototype (claude.ai artifact "M0vement · Meals
// prototype", 27 Sep 2026). Plain data; js/meals.js does the planning.
//
// Ingredient rows: [id, name, class, aisle, kcal, protein, carbs, fat,
//   fibre (per 100 g), € per kg (or per piece), allergens, grams per piece
//   (0 = sold by weight), pantry staple]
// Components are the unit of cooking:
//   prep 'batch'    keeps well, made ahead on a batch day
//        'fresh'    quick and better fresh, cooked on the day in hybrid mode
//        'assemble' no cooking, put together on the day
//   keeps: fridge days once cooked · freezes · mins: active time per batch
//   ahead (fresh only): in hybrid mode, cook it on the batch day too when it
//     is eaten within this many days (reheats well: chicken, pork, tofu…);
//     later uses are frozen if it freezes. 0/absent = always on the day.
//   pre: the prep that can be done on the batch day for something still
//     cooked on the day (washing, chopping). m: mins on the batch day,
//     save: mins it takes off the day, days: how long the prepped veg keeps.
// Recipes combine components (portions of each) plus finishing ingredients.
// ─────────────────────────────────────────────────────────────
const MEALS_DATA = (() => {
const ING_ROWS = [
 ['chicken','Chicken breast','meat','Butcher & fish',110,23,0,1.5,0,7.5,'',0,0],
 ['thigh','Chicken thighs, boneless','meat','Butcher & fish',120,19,0,4.5,0,6,'',0,0],
 ['beef','Beef mince 5%','meat','Butcher & fish',137,21,0,5.5,0,9,'',0,0],
 ['turkey','Turkey mince','meat','Butcher & fish',140,20,0,7,0,8,'',0,0],
 ['pork','Pork loin','meat','Butcher & fish',143,21,0,6,0,7,'',0,0],
 ['salmon','Salmon fillet','fish','Butcher & fish',208,20,0,13,0,16,'fish',0,0],
 ['cod','Cod loin','fish','Butcher & fish',82,18,0,0.7,0,11,'fish',0,0],
 ['shrimp','Prawns, peeled','fish','Frozen',85,20,0,0.5,0,13,'shellfish',0,0],
 ['tuna','Tuna in water (drained)','fish','Tins & jars',116,26,0,1,0,12,'fish',0,0],
 ['sardines','Sardines in olive oil','fish','Tins & jars',208,25,0,11,0,10,'fish',0,0],
 ['eggs','Eggs','egg','Dairy & eggs',143,12.6,0.7,9.5,0,0.25,'eggs',55,0],
 ['greek','Greek yoghurt 2%','dairy','Dairy & eggs',73,10,4,2,0,4,'lactose',0,0],
 ['skyr','Skyr','dairy','Dairy & eggs',63,11,4,0.2,0,4.5,'lactose',0,0],
 ['cottage','Cottage cheese','dairy','Dairy & eggs',98,11,3.4,4.3,0,5,'lactose',0,0],
 ['feta','Feta','dairy','Dairy & eggs',264,14,4,21,0,11,'lactose',0,0],
 ['parmesan','Parmesan','dairy','Dairy & eggs',431,38,4,29,0,20,'lactose',0,0],
 ['whey','Whey protein powder','dairy','Pantry',380,75,8,6,0,25,'lactose',0,0],
 ['peaprot','Pea protein powder','plant','Pantry',380,80,4,6,2,22,'',0,0],
 ['milk','Semi-skimmed milk','dairy','Dairy & eggs',46,3.4,4.8,1.6,0,0.9,'lactose',0,0],
 ['oatmilk','Oat drink','plant','Dairy & eggs',45,1,6.5,1.5,0.8,1.6,'gluten',0,0],
 ['tofu','Firm tofu','plant','Dairy & eggs',144,15,2,9,1,7,'soy',0,0],
 ['chickpeas','Chickpeas (tinned, drained)','plant','Tins & jars',120,7,17,2.5,6,3,'',0,0],
 ['blackbeans','Black beans (tinned, drained)','plant','Tins & jars',120,8,16,0.5,7,3,'',0,0],
 ['lentils','Red lentils, dry','plant','Grains & bread',350,24,50,1.5,11,3,'',0,0],
 ['rice','Basmati rice, dry','plant','Grains & bread',350,8,78,0.8,1,2.5,'',0,0],
 ['quinoa','Quinoa, dry','plant','Grains & bread',368,14,57,6,7,7,'',0,0],
 ['pasta','Pasta, dry','plant','Grains & bread',355,12.5,71,1.5,3,2,'gluten',0,0],
 ['oats','Rolled oats','plant','Grains & bread',379,13,60,7,10,2,'gluten',0,0],
 ['bread','Wholemeal bread','plant','Grains & bread',247,13,41,3.4,7,3.5,'gluten',0,0],
 ['wrap','Tortilla wraps','plant','Grains & bread',300,8,50,7,3,0.3,'gluten',60,0],
 ['potato','Potatoes','plant','Produce',77,2,17,0.1,2,1.2,'',0,0],
 ['sweetpot','Sweet potato','plant','Produce',86,1.6,20,0.1,3,2,'',0,0],
 ['onion','Onion','plant','Produce',40,1.1,9,0.1,1.7,1.3,'',0,0],
 ['garlic','Garlic','plant','Produce',149,6,33,0.5,2,6,'',0,1],
 ['tomato','Tomatoes','plant','Produce',18,0.9,3.9,0.2,1.2,2,'',0,0],
 ['tintom','Chopped tomatoes (tin)','plant','Tins & jars',24,1.2,4,0.2,1,1.8,'',0,0],
 ['pepper','Bell pepper','plant','Produce',31,1,6,0.3,2,3,'',0,0],
 ['zucchini','Courgette','plant','Produce',17,1.2,3.1,0.3,1,1.8,'',0,0],
 ['broccoli','Broccoli','plant','Produce',34,2.8,7,0.4,2.6,2.5,'',0,0],
 ['spinach','Spinach','plant','Produce',23,2.9,3.6,0.4,2.2,5,'',0,0],
 ['carrot','Carrots','plant','Produce',41,0.9,10,0.2,2.8,1,'',0,0],
 ['cucumber','Cucumber','plant','Produce',15,0.7,3.6,0.1,0.5,1.5,'',0,0],
 ['leaves','Salad leaves','plant','Produce',17,1.4,3,0.2,1.5,6,'',0,0],
 ['mushroom','Mushrooms','plant','Produce',22,3.1,3.3,0.3,1,4,'',0,0],
 ['cabbage','Cabbage (couve)','plant','Produce',25,1.3,6,0.1,2.5,1.2,'',0,0],
 ['avocado','Avocado','plant','Produce',160,2,9,15,7,5,'',0,0],
 ['lemon','Lemon','plant','Produce',29,1.1,9,0.3,2.8,2,'',0,0],
 ['banana','Banana','plant','Produce',89,1.1,23,0.3,2.6,1.3,'',0,0],
 ['berries','Mixed berries (frozen)','plant','Frozen',50,1,10,0.3,4,6,'',0,0],
 ['peas','Peas (frozen)','plant','Frozen',81,5.4,14,0.4,5,2.5,'',0,0],
 ['pb','Peanut butter','plant','Tins & jars',588,25,20,50,6,8,'peanuts',0,0],
 ['almonds','Almonds','plant','Pantry',579,21,22,50,12,12,'nuts',0,0],
 ['walnuts','Walnuts','plant','Pantry',654,15,14,65,7,14,'nuts',0,0],
 ['honey','Honey','plant','Pantry',304,0.3,82,0,0,10,'',0,1],
 ['soy','Soy sauce','plant','Pantry',53,8,5,0.5,0,5,'soy gluten',0,1],
 ['coconut','Coconut milk (tin)','plant','Tins & jars',197,2,3,21,0,4,'',0,0],
 ['pesto','Pesto','plant','Tins & jars',450,5,6,45,1,12,'nuts lactose',0,0],
 ['oil','Olive oil','plant','Pantry',884,0,0,100,0,8,'',0,1],
 ['spices','Spices & dried herbs','plant','Pantry',250,10,40,5,20,25,'',0,1]
];
const AISLES=['Produce','Butcher & fish','Dairy & eggs','Grains & bread','Tins & jars','Frozen','Pantry'];
const CONS=[['gluten','Gluten-free'],['lactose','Lactose-free'],['eggs','No eggs'],['nuts','No tree nuts'],['peanuts','No peanuts'],['soy','No soy'],['sesame','No sesame'],['fish','No fish'],['shellfish','No shellfish'],['pork','No pork'],['redmeat','No red meat'],['vegan','Vegan']];
const C=(id,name,prep,keeps,freezes,mins,ing,steps,verb)=>({id,name,prep,keeps,freezes,mins,ing,steps,verb:verb||'Cook'});
const BUILTIN_COMPS=[
 C('quinoa','Quinoa','batch',4,true,15,[['quinoa',60]],'Rinse, simmer 12 min in twice the water, rest 5 min covered, spread out to cool.'),
 C('rice','Basmati rice','batch',4,true,15,[['rice',70]],'Rinse, cook 10 min, rest 5 min. Cool quickly and refrigerate within an hour.'),
 C('roastveg','Roast courgette and pepper','batch',4,false,30,[['zucchini',120],['pepper',100],['oil',8],['spices',1]],'Chop, toss with oil and spices, roast 25 min at 210°C.','Roast'),
 C('roastsweet','Roast sweet potato','batch',4,true,35,[['sweetpot',220],['oil',5]],'Cut into wedges, roast 30 min at 200°C.','Roast'),
 C('roastpot','Roast potatoes','batch',4,false,35,[['potato',230],['oil',8],['spices',1]],'Cut, parboil 6 min, roast 30 min at 210°C.','Roast'),
 C('boiledeggs','Boiled eggs','batch',5,false,12,[['eggs',2]],'Boil 8 min, cool in cold water, keep in their shells.','Boil'),
 C('chickpeas','Spiced chickpeas','batch',4,true,25,[['chickpeas',130],['oil',5],['spices',1]],'Drain, pat dry, toss with oil and spices, roast 20 min at 210°C.','Roast'),
 C('dal','Red lentil dal','batch',4,true,30,[['lentils',70],['coconut',60],['tintom',100],['onion',60],['garlic',4],['spices',4]],'Soften onion and garlic, add spices, lentils, tomatoes, coconut milk and water. Simmer 20 min.','Simmer'),
 C('chili','Beef chili','batch',4,true,40,[['beef',130],['blackbeans',120],['tintom',150],['onion',60],['pepper',80],['spices',3],['oil',5]],'Brown the mince with onion and pepper, add spices, tomatoes and beans. Simmer 25 min.','Simmer'),
 C('vegchili','Sweet potato and bean chili','batch',4,true,40,[['blackbeans',180],['sweetpot',150],['tintom',150],['onion',60],['pepper',80],['spices',3]],'Simmer diced sweet potato with onion, pepper, spices, tomatoes and beans for 30 min.','Simmer'),
 C('tomsauce','Tomato sauce','batch',5,true,25,[['tintom',150],['onion',40],['garlic',3],['oil',5]],'Soften onion and garlic in oil, add tomatoes, simmer 20 min.','Simmer'),
 C('meatballs','Turkey meatballs','batch',3,true,25,[['turkey',140],['parmesan',10]],'Mix, roll into balls, bake 18 min at 200°C.','Bake'),
 C('traybake','Chicken thigh tray bake','batch',4,true,40,[['thigh',180],['carrot',100],['onion',60],['oil',6],['spices',3]],'Toss with oil and spices, roast 40 min at 210°C, turning once.','Roast'),
 C('salmon','Grilled salmon','fresh',2,false,12,[['salmon',140]],'Season, grill or pan-fry skin side down 5 min, flip for 3.','Grill'),
 C('chicken','Soy-garlic chicken','fresh',4,true,12,[['chicken',160],['oil',5],['garlic',2],['soy',8]],'Dice, sear in oil 6 min, add garlic and soy for the last minute.','Sear'),
 C('cod','Poached cod','fresh',2,false,12,[['cod',170],['oil',6],['garlic',3]],'Poach 8 min in barely simmering water, finish with garlic olive oil.','Poach'),
 C('prawns','Garlic prawns','fresh',2,false,6,[['shrimp',130],['garlic',2],['oil',5]],'Sauté in oil with garlic 3–4 min until pink.','Sauté'),
 C('tofu','Crispy tofu','fresh',4,false,12,[['tofu',170],['oil',6],['soy',10]],'Press, cube, fry until golden, splash of soy at the end.','Fry'),
 C('pork','Pan-roast pork loin','fresh',3,false,20,[['pork',160],['oil',4],['spices',1]],'Sear on all sides, finish 8 min in the oven or covered pan, rest 5 min.','Sear'),
 C('omelette','Mushroom and spinach omelette','fresh',1,false,10,[['eggs',3],['mushroom',80],['spinach',40],['oil',5]],'Fry mushrooms, wilt spinach, pour over beaten eggs, fold.','Make'),
 C('pasta','Pasta','fresh',3,false,12,[['pasta',85]],'Boil in salted water to the time on the pack.','Boil'),
 C('stirveg','Stir-fried vegetables','fresh',2,false,8,[['broccoli',100],['pepper',80],['carrot',60],['oil',5]],'Stir-fry on high heat 5 min.','Stir-fry'),
 C('broccoli','Steamed broccoli','fresh',4,false,8,[['broccoli',150]],'Steam 5 min.','Steam'),
 C('greens','Garlic greens','fresh',3,false,4,[['spinach',80],['garlic',2],['oil',4]],'Wilt in oil with garlic, 2 min.','Wilt'),
 C('salad','Side salad','assemble',1,false,5,[['leaves',60],['tomato',100],['cucumber',80],['oil',8]],'Chop and dress just before eating.','Toss'),
 C('tuna','Tuna','assemble',2,false,1,[['tuna',120]],'Drain.','Open'),
 // breakfasts
 C('oats','Overnight oats','batch',3,false,5,[['oats',60],['skyr',150],['berries',80],['walnuts',10],['honey',8]],'Mix oats and skyr with a splash of water, top with berries, walnuts and honey. Portion into jars.','Mix'),
 C('eggtoast','Eggs on toast','fresh',0,false,10,[['eggs',2],['bread',70],['spinach',50],['tomato',100],['oil',5]],'Wilt spinach, fry or scramble eggs, serve on toast with tomato.','Make'),
 C('yogbowl','Yoghurt bowl','assemble',0,false,3,[['greek',200],['banana',100],['oats',30],['pb',15]],'Layer yoghurt, banana and oats, top with peanut butter.','Make'),
 C('tofuwrap','Tofu scramble wraps','batch',3,true,15,[['tofu',150],['wrap',1],['spinach',40],['pepper',60],['oil',5],['spices',2]],'Crumble tofu into hot oil with pepper and spices, add spinach, roll into wraps.','Make'),
 C('pancakes','Banana oat pancakes','batch',3,true,20,[['eggs',2],['oats',50],['banana',100],['skyr',100]],'Blend eggs, oats and banana, cook small pancakes. Serve with skyr.','Make'),
 C('shake','Whey shake','assemble',0,false,2,[['whey',30],['milk',300],['banana',100],['oats',40]],'Blend 20 seconds.','Blend'),
 C('plantshake','Plant protein shake','assemble',0,false,2,[['peaprot',30],['oatmilk',300],['banana',100],['pb',10]],'Blend 20 seconds.','Blend')
];
// What can move to the batch day in hybrid mode (see header).
const AHEAD={chicken:3,pork:3,tofu:3,broccoli:4,greens:3};
const PRE={
 stirveg:{t:'Wash and chop the broccoli, pepper and carrot into one box.',m:6,save:4,days:3},
 salad:{t:'Wash and spin the leaves, slice the cucumber; box them with kitchen paper. Keep tomatoes whole.',m:5,save:3,days:3},
 omelette:{t:'Slice the mushrooms and wash the spinach.',m:4,save:4,days:3},
 broccoli:{t:'Cut into florets.',m:3,save:2,days:4},
};
BUILTIN_COMPS.forEach(c=>{ if(AHEAD[c.id]) c.ahead=AHEAD[c.id]; if(PRE[c.id]) c.pre=PRE[c.id]; });
const M=(id,name,type,parts,finish,x)=>Object.assign({id,name,type,parts,finish:finish||[]},x||{});
const BUILTIN=[
 M('m-salmonquinoa','Salmon quinoa bowl with roast veg','main',[['quinoa',1],['roastveg',1],['salmon',1]],[['lemon',15],['spinach',30]]),
 M('m-chickrice','Soy-garlic chicken, rice and broccoli','main',[['rice',1],['chicken',1],['broccoli',1]]),
 M('m-chickquinoa','Chicken, quinoa and chickpea bowl','main',[['quinoa',0.8],['chickpeas',0.5],['chicken',1]],[['feta',25],['spinach',40]]),
 M('m-chili','Beef chili with rice','main',[['chili',1],['rice',0.8]]),
 M('m-dal','Red lentil dal with rice and greens','main',[['dal',1],['rice',0.8],['greens',0.6]]),
 M('m-vegchili','Sweet potato and black bean chili','main',[['vegchili',1],['rice',0.8]],[['avocado',50]]),
 M('m-cod','Cod with roast potatoes, egg and greens','main',[['roastpot',1],['cod',1],['greens',1],['boiledeggs',0.5]]),
 M('m-meatballs','Turkey meatballs with tomato pasta','main',[['meatballs',1],['tomsauce',1],['pasta',1]]),
 M('m-tofustir','Tofu stir-fry with rice','main',[['rice',1],['tofu',1],['stirveg',1]]),
 M('m-prawnpasta','Prawn pesto pasta','main',[['pasta',1],['prawns',1]],[['pesto',25],['lemon',10]]),
 M('m-pork','Pork loin, roast potatoes and salad','main',[['roastpot',1],['pork',1],['salad',1]]),
 M('m-tunasalad','Tuna, chickpea and egg salad','main',[['chickpeas',0.9],['tuna',1],['salad',1],['boiledeggs',0.5]],[['lemon',10]]),
 M('m-traybake','Chicken thigh tray bake with potatoes','main',[['traybake',1],['roastpot',0.8]]),
 M('m-omelette','Mushroom omelette, potatoes and salad','main',[['omelette',1],['roastpot',0.7],['salad',0.8]]),
 M('m-sweetbowl','Sweet potato, chickpea and egg bowl','main',[['roastsweet',1],['chickpeas',0.7],['boiledeggs',1],['greens',0.6]],[['feta',25]]),
 M('m-salmonsweet','Salmon, sweet potato and greens','main',[['roastsweet',1],['salmon',1],['greens',1]],[['lemon',15]]),
 M('m-tofuquinoa','Crispy tofu quinoa bowl','main',[['quinoa',1],['roastveg',1],['tofu',0.8]]),
 M('m-chickpeaquinoa','Chickpea quinoa bowl with feta','main',[['quinoa',0.9],['roastveg',1],['chickpeas',1]],[['feta',40],['lemon',15]]),
 M('m-chickroast','Chicken, sweet potato and roast veg','main',[['roastsweet',0.8],['roastveg',1],['chicken',1]],[['lemon',10]]),
 M('m-porkrice','Pork loin, rice and broccoli','main',[['rice',0.9],['pork',1],['broccoli',1]],[['soy',6]]),
 M('b-oats','Overnight oats with skyr and berries','breakfast',[['oats',1]]),
 M('b-eggtoast','Eggs on toast with spinach and tomato','breakfast',[['eggtoast',1]]),
 M('b-yogbowl','Greek yoghurt bowl with banana','breakfast',[['yogbowl',1]]),
 M('b-tofuwrap','Tofu scramble wraps','breakfast',[['tofuwrap',1]]),
 M('b-pancakes','Banana oat pancakes','breakfast',[['pancakes',1]]),
 M('b-shake','Whey shake with banana and oats','breakfast',[['shake',1]],[],{shake:true,fixed:true}),
 M('b-plantshake','Plant protein shake with banana','breakfast',[['plantshake',1]],[],{shake:true,fixed:true})
];

  return { ING_ROWS, AISLES, CONS, COMPONENTS: BUILTIN_COMPS, RECIPES: BUILTIN };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { MEALS_DATA };

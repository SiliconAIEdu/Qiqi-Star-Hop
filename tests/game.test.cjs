const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../dist/game.js'),'utf8');
function setup(save=null){const elements=new Map();function el(){return {textContent:'',innerHTML:'',hidden:false,appendChild(){},focus(){},blur(){},addEventListener(){},setAttribute(){},getContext(){return {}},dataset:{}}}const document={getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,querySelectorAll(){return []},addEventListener(){}};const context={document,window:{addEventListener(){}},localStorage:{getItem(){return save},setItem(){}},requestAnimationFrame(){},console};vm.createContext(context);new vm.Script(source).runInContext(context);return s=>vm.runInContext(s,context)}
const run=setup();
run('load(0,true);p.x=140;p.y=395;update(1/120)');assert(run('p.vy')<-600,'spring launches');assert.equal(run('p.ground'),false);
run('load(1,true);p.x=245;p.y=350;update(1/120);var offset=p.x-tiles[1].x;for(let i=0;i<60;i++)update(1/120)');assert(Math.abs(run('p.x-tiles[1].x-offset'))<.001,'moving platform carries player');
run('load(3,true);p.x=235;p.y=350;update(1/120);for(let i=0;i<115;i++)update(1/120)');assert.equal(run('tiles[1].active'),false,'crumble disappears');run('advanceTiles(3)');assert.equal(run('tiles[1].active'),true,'crumble returns');
run('load(4,true);p.x=131;p.y=395;update(1/120)');assert.equal(run('p.x'),521,'portal transports');assert(run('portalCooldown')>0);
run('load(5,true);p.x=260;p.y=350;update(1/120);var bx=p.x;for(let i=0;i<30;i++)update(1/120)');assert(run('p.x-bx')>15,'conveyor pushes without keys');
run('load(0,true);p.x=480;p.y=375;update(1/120);stars[0].got=true');assert.equal(run('checkpoint'),true);run('p.y=600;update(1/120);respawn()');assert.equal(run('p.x'),490);assert.equal(run('stars[0].got'),true);assert.equal(run('state'),'playing');run('load(0,true)');assert.equal(run('checkpoint'),false,'restart clears checkpoint');
run('load(4,true);p.x=430;p.y=345;keys.right=true;for(let i=0;i<90;i++)update(1/120)');assert.equal(run('state'),'playing');assert.equal(run('p.x'),442,'solid spike side');run('keys.right=false;keys.left=true;update(1/120)');assert(run('p.x')<442);
run('load(4,true);p.x=470;p.y=318;p.vy=300;update(1/120)');assert.equal(run('state'),'dead','spike tip kills on downward crossing');
run('load(6,true);var h=hammerPositions()[0];p.x=h.x-14;p.y=h.y-18;update(1/120)');assert.equal(run('state'),'dead','hammer collision');
run('load(1,true);pause();var frozen=t;update(1)');assert.equal(run('t'),run('frozen'));
for(let i=0;i<8;i++){run(`load(${i},true);p.x=levels[index].goal[0]-14;p.y=levels[index].goal[1]-35;update(1/120)`);assert.equal(run('state'),'won');}
assert.equal(run('saved.completed.filter(Boolean).length'),8);
const migrated=setup(JSON.stringify({unlocked:6,best:[3,2,1,3,2],completed:[true,true,true,true,true]}));assert.equal(migrated('saved.unlocked'),6);assert.equal(migrated('saved.best[0]'),3);
// Every checkpoint and portal exit must be above a stable landing surface.
assert(run('levels.every(l=>[l.checkpoint,...(l.portals||[]).map(q=>q.slice(2))].every(([x,y])=>l.platforms.some(q=>!q[3]&&q[1]===y&&x>=q[0]&&x+28<=q[0]+q[2])))'));
assert.equal(run('levels.length'),30);
console.log('PASS: springs, moving-platform carry, crumble/restore, portals, conveyors, checkpoint respawn, spike rules, hammers, pause, all exits, save migration and safe respawn locations.');
// Seeded input-only simulations find a full playable route from the real spawn.
const routes=run(`(()=>{let seed=9821;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);let results=[];for(let level=0;level<levels.length-1;level++){let success=false;for(let attempt=0;attempt<450&&!success;attempt++){load(level,true);keys.right=true;for(let frame=0;frame<2400&&state==='playing';frame++){if(frame%12===0){keys.right=random()>.13;keys.left=!keys.right&&random()<.3;if(random()<(p.ground?.60:.22))jump();}update(1/120);}if(state==='won'){success=true;results.push({level:level+1,attempts:attempt+1,seconds:Math.round(t)});}}if(!success)results.push({level:level+1,failed:true});}return results;})()`);
console.log(JSON.stringify(routes));assert(routes.every(r=>!r.failed),'all 29 obstacle levels have a successful input-only route');

run('load(29,true);p.x=846;p.y=405;update(1/120)');assert.equal(run('state'),'playing','boss blocks exit');
run('load(29,true);p.x=45;p.y=405;update(1/120)');assert.equal(run('checkpoint'),true);
run('stars[0].got=true;boss.hp=3;fail();respawn()');assert.equal(run('boss.hp'),3,'checkpoint keeps boss damage');assert.equal(run('boss.shots.length'),0);
for(let hit=0;hit<3;hit++){run('boss.cooldown=0;p.x=680+Math.sin((t+1/120)*.8)*70-14;p.y=333;p.vy=300;p.riding=null;p.ground=false;update(1/120)');assert.equal(run('boss.hp'),2-hit);assert.equal(run('state'),'playing');}
run('p.x=846;p.y=405;p.vy=0;update(1/120)');assert.equal(run('state'),'won','defeated boss opens exit');assert.equal(run('saved.unlocked'),30);
run('load(29,true);boss.clock=2.79;p.x=40;p.y=405;update(1/120);update(1/120)');assert.equal(run('boss.shots.length'),1,'phase one projectile');
run('boss.hp=2;boss.clock=1.895;boss.shots=[];update(1/120)');assert.equal(run('boss.shots.length'),2,'phase two double shot');
run('load(29,true);p.x=665;p.y=390;update(1/120)');assert.equal(run('state'),'dead','boss body dangerous');
run('load(29,true);boss.shots=[{x:59,y:408,vx:0,vy:0}];p.x=45;p.y=390;update(1/120)');assert.equal(run('state'),'dead','projectile collision');
run('load(15,true);p.x=levels[index].goal[0]-14;p.y=levels[index].goal[1]-35;update(1/120)');assert.equal(run('state'),'playing','key locks exit');run('collectedKey=true;update(1/120)');assert.equal(run('state'),'won');
console.log('PASS: 30 levels, locked boss exit, five-hit boss health model, phases, damage persistence, body/projectile danger and key gates.');
const battle=run(`(()=>{load(29,true);let retries=0;for(let frame=0;frame<18000;frame++){if(state==='dead'){respawn();retries++;}if(state==='won')return {won:true,retries,seconds:Math.round(t)};let target=boss.hp>0?boss.x:860;keys.right=p.x+14<target-5;keys.left=p.x+14>target+5;if(frame%10===0&&p.ground)jump();update(1/120);}return {won:false,hp:boss.hp,x:p.x,y:p.y,state,retries};})()`);console.log('Input-only boss battle:',JSON.stringify(battle));assert(battle.won,'Boss can be defeated using ordinary controls');
// Crouch keeps feet planted and changes actual collision bounds, not only the sprite.
run('load(29,true);p.x=45;p.y=405;update(1/120);var feet=p.y+p.h;setCrouchInput("ArrowDown",true);update(1/120)');assert.equal(run('p.h'),18);assert.equal(run('p.y+p.h'),run('feet'));assert.equal(run('p.crouched'),true);
run('setCrouchInput("KeyS",true);setCrouchInput("ArrowDown",false);update(1/120)');assert.equal(run('p.h'),18,'other crouch input still held');
run('setCrouchInput("KeyS",false);update(1/120)');assert.equal(run('p.h'),35);assert.equal(run('p.y+p.h'),run('feet'));
run('setCrouchInput("pointer-12",true);keys.right=true;update(1/120)');assert.equal(run('p.vx'),125,'crouch walk');assert.equal(run('p.h'),18);run('setCrouchInput("pointer-12",false);update(1/120)');assert.equal(run('p.h'),35);
run('load(29,true);p.x=45;p.y=405;setCrouchInput("KeyS",true);boss.shots=[{x:59,y:410,vx:0,vy:0}];update(1/120)');assert.equal(run('state'),'playing','duck beneath overhead projectile');
run('setCrouchInput("KeyS",false);update(1/120)');assert.equal(run('state'),'dead','standing into same projectile hits');
run('load(29,true);p.x=45;p.y=405;setCrouchInput("KeyS",true);boss.shots=[{x:59,y:432,vx:0,vy:0}];update(1/120)');assert.equal(run('state'),'dead','low projectile still hits crouching player');
run('load(0,true);p.x=45;p.y=395;setCrouchInput("ArrowDown",true);update(1/120);jump();update(1/120)');assert(run('p.vy')<0,'jump works while crouched');assert.equal(run('p.h'),18);
run('load(1,true);p.x=245;p.y=350;setCrouchInput("KeyS",true);update(1/120);var crouchOffset=p.x-tiles[1].x;for(let i=0;i<60;i++)update(1/120)');assert(Math.abs(run('p.x-tiles[1].x-crouchOffset'))<.001,'crouch rides moving platform');
run('load(4,true);p.x=131;p.y=395;setCrouchInput("KeyS",true);update(1/120)');assert.equal(run('p.y+p.h'),235,'crouch portal preserves landing height');
run('load(29,true);p.x=45;p.y=405;update(1/120);setCrouchInput("KeyS",true);update(1/120);fail();respawn()');assert.equal(run('keys.crouch'),false);assert.equal(run('p.h'),35);
run('setCrouchInput("pointer-1",true);load(0,true)');assert.equal(run('keys.crouch'),false);assert.equal(run('crouchInputs.size'),0);
console.log('PASS: crouch posture, feet anchoring, combined inputs, slow movement, actual projectile evasion, jumping, moving platforms, portals and respawn/reset.');
// Ignore names, colors and global vertical shifts: no repeated terrain layouts.
const layouts=run('levels.map(l=>JSON.stringify(l.platforms.map(q=>[q[0],q[1]-l.platforms[0][1],q[2]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])))');assert.equal(new Set(layouts).size,30,'30 independently shaped courses');
run('load(8,true);p.x=230;p.y=tiles[1].y-35;p.ground=true;p.riding=1;var liftFeet=p.y+p.h;for(let i=0;i<60;i++)update(1/120)');assert.equal(run('state'),'playing');assert(Math.abs(run('p.y+p.h-tiles[1].y'))<.001,'lift carries vertically');assert(Math.abs(run('p.y+p.h-liftFeet'))>20,'lift actually moves');
run('load(9,true);t=3.1;advanceTiles(0)');assert.equal(run('tiles[1].active'),false,'phase cloud disappears independently of touch');run('t=4.1;advanceTiles(0)');assert.equal(run('tiles[1].active'),true,'phase cloud reappears');
run('load(21,true);p.x=841;p.y=355;update(1/120)');assert.equal(run('state'),'playing','collection gate blocks with no stars');run('stars[0].got=stars[1].got=true;update(1/120)');assert.equal(run('state'),'playing','two stars are insufficient');run('stars[2].got=true;update(1/120)');assert.equal(run('state'),'won','three stars open the gate');
run('load(26,true);p.x=165;p.y=405;keys.right=true;for(let i=0;i<30;i++)update(1/120)');assert.equal(run('p.x'),177,'standing blocked by low beam');
run('setCrouchInput("KeyS",true);for(let i=0;i<60;i++)update(1/120)');assert(run('p.x')>230,'crouch enters tunnel');assert.equal(run('p.h'),18);
run('setCrouchInput("KeyS",false);update(1/120)');assert.equal(run('p.h'),18,'cannot stand into ceiling');
run('for(let i=0;i<130;i++)update(1/120)');assert.equal(run('p.h'),35,'stands after leaving tunnel');assert(run('p.x')>=360);
run('load(26,true);p.x=245;p.y=422;p.h=18;p.crouched=true;setCrouchInput("KeyS",true);jump();update(1/120)');assert(run('p.y')>=419,'jump cannot pass through beam underside');
run('load(8,true);pause();var ly=tiles[1].y;update(1)');assert.equal(run('tiles[1].y'),run('ly'),'pause freezes elevator');
console.log('PASS: all 30 terrain layouts differ; lift carry, timed clouds, star-locked gate, crouch tunnel and solid ceilings.');

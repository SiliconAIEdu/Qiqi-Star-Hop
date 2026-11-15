const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const source=['courses.js','game.js'].map(f=>fs.readFileSync(path.join(__dirname,'../dist',f),'utf8')).join('\n');
function setup(save=null){const elements=new Map();const context2d=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});function el(){return {textContent:'',innerHTML:'',hidden:false,appendChild(){},focus(){},blur(){},addEventListener(){},setAttribute(){},getContext(){return context2d},dataset:{}}}const document={getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,querySelectorAll(){return []},addEventListener(){}};const context={document,window:{addEventListener(){}},localStorage:{getItem(k){return k==='star-hop-v1'?save:null},setItem(){}},requestAnimationFrame(){},console};vm.createContext(context);new vm.Script(source).runInContext(context);return s=>vm.runInContext(s,context)}
const run=setup();run('smartEnabled=false');
assert.equal(run('levels.length'),100);assert(run('levels.every(l=>l.worldWidth>3000&&l.requiredStars>=5&&l.requiredStars<=l.stars.length)'));
assert.equal(new Set(run('levels.map(l=>JSON.stringify(l.platforms))')).size,100);
assert(run('levels.every(l=>l.doors.some(d=>!d.real)&&l.doors.at(-1).exit&&l.doors.at(-1).real)'));
assert(run('levels.every(l=>[...l.checkpoints,...l.doors.map(d=>[d.x,d.y])].every(([x,y])=>l.platforms.some(q=>!q[3]&&q[1]===y&&x>=q[0]&&x+14<=q[0]+q[2])))'),'safe checkpoint/door landings');
// Retain the existing physics regression coverage using the unchanged opening sections.
run('load(0,true);p.x=140;p.y=395;update(1/120)');assert(run('p.vy')<-600);
run('load(1,true);p.x=245;p.y=350;update(1/120);var offset=p.x-tiles[1].x;for(let i=0;i<100;i++)update(1/120)');assert(Math.abs(run('p.x-tiles[1].x-offset'))<.001);
run('load(3,true);p.x=235;p.y=350;update(1/120);for(let i=0;i<115;i++)update(1/120)');assert.equal(run('tiles[1].active'),false);run('advanceTiles(3)');assert.equal(run('tiles[1].active'),true);
run('load(4,true);p.x=131;p.y=395;update(1/120)');assert.equal(run('p.x'),521);
run('load(5,true);p.x=260;p.y=350;update(1/120);var bx=p.x;for(let i=0;i<30;i++)update(1/120)');assert(run('p.x-bx')>15);
run('load(4,true);p.x=430;p.y=345;keys.right=true;for(let i=0;i<90;i++)update(1/120)');assert.equal(run('state'),'playing');assert.equal(run('p.x'),442);
run('load(4,true);p.x=470;p.y=318;p.vy=300;update(1/120)');assert.equal(run('state'),'dead');
run('load(26,true);p.x=165;p.y=405;keys.right=true;for(let i=0;i<30;i++)update(1/120)');assert.equal(run('p.x'),177);
run('setCrouchInput("KeyS",true);for(let i=0;i<100;i++)update(1/120)');assert(run('p.x')>230);assert.equal(run('p.h'),18);
run('setCrouchInput("KeyS",false);update(1/120)');assert.equal(run('p.h'),18);run('for(let i=0;i<130;i++)update(1/120)');assert.equal(run('p.h'),35);
run('load(8,true);p.x=230;p.y=tiles[1].y-35;p.ground=true;p.riding=1;var liftFeet=p.y+p.h;for(let i=0;i<100;i++)update(1/120)');assert(Math.abs(run('p.y+p.h-tiles[1].y'))<.001);
run('load(9,true);t=3.1;advanceTiles(0)');assert.equal(run('tiles[1].active'),false);
// Ordered doors cannot be skipped even with all stars. Hidden discovery is proximity based.
for(let i=0;i<100;i++){
 run(`load(${i},true);collectedKey=true;if(boss)boss.hp=0;stars.forEach(s=>s.got=true);p.x=levels[index].goal[0]-14;p.y=levels[index].goal[1]-35;updateDoors()`);
 assert.equal(run('state'),'playing');assert.equal(run('doorCursor'),0);
 run(`for(let n=0;n<doors.length-1;n++){const d=doors[n];p.x=d.x-14;p.y=d.y-35;updateDoors();}`);
 assert.equal(run('doorCursor'),run('doors.length-1'));
 run('stars.forEach((s,i)=>s.got=i<levels[index].requiredStars-1);p.x=levels[index].goal[0]-14;p.y=levels[index].goal[1]-35;updateDoors()');assert.equal(run('state'),'playing');
 run('stars[levels[index].requiredStars-1].got=true;updateDoors()');assert.equal(run('state'),'won');
}
run('load(3,true);var hidden=doors.find(d=>d.hidden);p.x=hidden.x-114;p.y=hidden.y-35;updateDoors()');assert.equal(run('hidden.revealed'),false);run('p.x+=50;updateDoors()');assert.equal(run('hidden.revealed'),true);
run('stars[0].got=true;doors[0].verified=true;doorCursor=1;saveCheckpoint(doors[0].x-14,doors[0].y);fail();respawn()');assert.equal(run('doorCursor'),1);assert.equal(run('stars[0].got'),true);assert.equal(run('hidden.revealed'),true);
run('load(0,true);p.x=2000;updateCamera(0,true)');assert(run('camera.x')>1500);run('p.x=100;updateCamera(1)');assert(run('camera.x')<5);run('p.x=levels[0].worldWidth-28;updateCamera(0,true)');assert.equal(run('camera.x'),run('levels[0].worldWidth-900'));
run('p.y=-100;updateCamera(0,true)');assert(run('camera.y')<0);run('pause();var oldTime=t;update(1)');assert.equal(run('t'),run('oldTime'));
run('load(59,true);updateBoss(5,0)');assert.equal(run('boss.shots.length'),0,'distant boss waits');assert.equal(run('boss.hp'),8);
run('p.x=levels[index].bossX-140;p.y=405;p.ground=true;boss.clock=bossInterval();updateBoss(0,440)');assert.equal(run('boss.shots.length'),1);run('boss.hp=2;boss.clock=bossInterval();boss.shots=[];updateBoss(0,440)');assert.equal(run('boss.shots.length'),2);
run('boss.cooldown=0;p.x=boss.x-14;p.y=333;p.vy=300;update(1/120)');assert.equal(run('boss.hp'),1);
run('saveCheckpoint(levels[index].bossX-550,440);fail();respawn()');assert.equal(run('boss.hp'),1);assert.equal(run('boss.shots.length'),0);
const migrated=setup(JSON.stringify({unlocked:30,best:Array(30).fill(3),completed:Array(30).fill(true)}));assert.equal(migrated('saved.unlocked'),31);assert.equal(migrated('saved.best.length'),100);assert.equal(migrated('saved.best[29]'),3);
run('smartEnabled=true;load(3,true);failures[3]=3');assert(run('assisted()'));assert(run('crumbleWindow()')>1);run('toggleSmart()');assert(!run('assisted()'));
for(let i=0;i<100;i++)run(`load(${i},true);draw(0);p.x=levels[index].worldWidth-200;updateCamera(0,true);draw(0)`);
console.log('PASS: 100 unique long courses, safe gates/checkpoints, physics regression, star quotas, ordered/hidden doors, checkpoint retention, camera, Boss, save migration and rendering.');
module.exports={setup};

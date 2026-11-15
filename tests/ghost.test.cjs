const {setup}=require('./expedition.test.cjs'),assert=require('node:assert/strict');
const run=setup(null,true),fresh=()=>run('load(26,true);for(let i=0;i<40;i++)update(1/120)');
const key=(code,pressed)=>run(`handleGameKey({code:'${code}',target:{tagName:'CANVAS'},preventDefault(){},repeat:false},${pressed})`);
fresh();run('fail();p.x=500;p.y=200;var deadline=p.downUntil;var hx=p2.x');key('KeyW',true);key('KeyD',true);run('update(.1)');assert(Math.abs(run('Math.hypot(p.vx,p.vy)')-285)<1e-8);assert(run('p.x>500&&p.y<200'));assert.equal(run('p2.x'),run('hx'));assert.equal(run('p.downUntil'),run('deadline'));key('KeyW',false);key('KeyD',false);run('update(.1)');assert.equal(run('p.vx+p.vy'),0);key('KeyS',true);run('update(.1)');assert.equal(run('p.vy'),285);key('KeyS',false);
// Multiple upward bindings remain held until the last binding releases.
key('KeyW',true);key('Space',true);key('KeyW',false);assert.equal(run('keys.flyUp'),true);key('Space',false);assert.equal(run('keys.flyUp'),false);
fresh();run('withSecond(()=>fail());p2.x=500;p2.y=200');key('ArrowUp',true);key('ArrowLeft',true);run('update(.1)');assert(run('p2.x<500&&p2.y<200'));assert.equal(run('keys.flyUp'),false);key('ArrowUp',false);key('ArrowLeft',false);key('ArrowDown',true);run('update(.1)');assert.equal(run('p2.vy'),285);key('ArrowDown',false);
// Ghosts cross solid tunnel walls without interacting with collectibles or doors.
fresh();run('fail();p.x=170;p.y=410;keys.right=true;for(let i=0;i<50;i++)update(1/120)');assert(run('p.x>280'));assert.equal(run('p.life'),'down');run('keys.right=false;p.x=stars[0].x;p.y=stars[0].y;updatePlayer(.01,0)');assert.equal(run('stars[0].got'),false);run('p.x=doors[0].x;p.y=doors[0].y-p.h;updatePlayer(.01,0)');assert.equal(run('doorCursor'),0);
// Pausing freezes flight and countdown, and timeout disables flight permanently.
key('KeyW',true);run('pause();var py=p.y,clock=t;update(.5)');assert.equal(run('p.y'),run('py'));assert.equal(run('t'),run('clock'));run('state="playing";t=p.downUntil;updateRescue(0);var expiredY=p.y;update(.1)');assert.equal(run('p.life'),'out');assert.equal(run('p.y'),run('expiredY'));
// A ghost approaching through the floor revives on the helper's safe surface.
fresh();run('fail();p.x=p2.x+25;p.y=p2.y+p2.h-p.h+20;p.vx=100;updateRescue(1.3)');assert.equal(run('p.life'),'down','must stop flying to be rescued');run('p.vx=p.vy=0;var rescueFeet=p2.y+p2.h;updateRescue(1.3)');assert.equal(run('p.life'),'active');assert.equal(run('p.y+p.h'),run('rescueFeet'));assert.equal(run('p.x'),run('p2.x'));assert(run('p.invulnerable>0'));
fresh();run('fail();draw(0);withSecond(drawPlayer);resetControls()');assert.equal(run('keys.flyUp||keys2.flyUp'),false);
console.log('PASS: both ghosts fly independently, normalized speed, held/released keys, obstacle passage, no progression interactions, paused flight, expiration, safe teammate revival and rendering.');

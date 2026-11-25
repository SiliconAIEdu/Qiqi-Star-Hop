const {setup}=require('./expedition.test.cjs');
const assert=require('node:assert/strict');
const run=setup(null,true);

for(let i=0;i<100;i++){
 run(`load(${i},true);update(1/120)`);
 assert(run('p.armed && p2.armed'), 'both players can pick up the starting wand');
 assert(run('monster.hp===2 && monster.x>levels[index].worldWidth*.2 && !monster.chasing'),'a living monster waits in the middle of every level');
 assert.doesNotThrow(()=>run('draw(0)'));
}
assert(run("$('item-status').textContent.includes('1P 已装备 · 2P 已装备')"));
run('draw(0)');
run('load(0,true);doorCursor=doors.length-1;stars.forEach(s=>s.got=true);p.x=monster.x-14;p.y=monster.y-16;attackMonster()');
assert.equal(run('monster.hp'),2,'unarmed players cannot attack');
assert.equal(run('canExit()'),false,'a living monster blocks the exit');
run('t=.25;p2.armed=true;p2.x=p.x;p2.y=p.y;withSecond(attackMonster);withSecond(attackMonster);updateShots(0)');
assert.equal(run('monster.hp'),1,'second player can attack but cannot bypass the cooldown');
run('saveCheckpoint(p.x,p.y+p.h);respawn()');
assert(run('p2.armed && monster.hp===1'),'checkpoint preserves weapon and combat progress');
run('t+=.36;p2.x=monster.x-14;p2.y=monster.y-17;withSecond(attackMonster);updateShots(0)');
assert.equal(run('monster.hp'),0);
assert.equal(run('canExit()'),true);
run('p.x=levels[0].goal[0]-14;p.y=levels[0].goal[1]-35;p2.x=p.x;p2.y=p.y;update(1/120)');
assert.equal(run('state'),'won','both players can finish after defeating the monster');

run('chooseMode(false);weaponPickups=[];p.x=monster.x+90;p.y=monster.y-17;var before=monster.x;t=.7;updateMonster(.1)');
assert(run('monster.chasing && monster.x>before'),'living monster pursues a player');
run('p.x=monster.x+300;before=monster.x;updateMonster(.1)');
assert(run('monster.x>before'),'an alerted monster continues chasing past its initial detection range');
run('p.x=monster.x-14;p.y=monster.y-17;t=monster.attackAt;monsterContact()');
assert.equal(run('p.hp'),2,'monster contact removes one heart');
assert.equal(run('state'),'playing');
run('monsterContact()');
assert.equal(run('p.hp'),2,'invulnerability prevents repeated contact damage');
run('p.invulnerable=0;t+=1.3;monsterContact()');
assert.equal(run('p.hp'),1);
run('p.invulnerable=0;t+=1.3;monsterContact()');
assert.equal(run('state'),'dead','zero hearts causes death');
run('state="playing";monster.hp=0;before=monster.x;updateMonster(.1);monsterContact()');
assert(run('monster.x===before && state==="playing"'),'defeated monsters stop chasing and attacking');

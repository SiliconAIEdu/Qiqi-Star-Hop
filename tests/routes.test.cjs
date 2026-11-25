const {setup}=require('./expedition.test.cjs');const assert=require('node:assert/strict');const run=setup();
run('smartEnabled=false');
let results=[];
for(let level=0;level<100;level++){
 const result=run(`(()=>{load(${level},true);let seed=9821+index*177,retries=0,stuck=0,prev=0,targetFrames=0,priorTarget=null;const skipped=new Set();const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);for(let frame=0;frame<160000;frame++){
 if(state==='dead'){respawn();retries++;}if(state==='won')return {level:index+1,won:true,retries,seconds:Math.round(t)};
 if(monster.hp&&monster.chasing){
  p.facing=monster.x>=p.x+14?1:-1;attackMonster();
  keys.right=!p.armed&&p.x<65;keys.left=!p.armed&&p.x>65;
  update(1/120);continue;
 }
 const L=levels[index],d=doors[doorCursor];let target={x:d.x,y:d.y-25};
 const missing=starCount()<L.requiredStars;
 if(missing){const options=stars.filter(s=>!s.got&&!skipped.has(s)&&s.x<d.x+70).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));if(options.length)target=options[0];}
 if(L.key&&!collectedKey&&(L.key[0]<d.x||doorCursor===doors.length-1))target={x:L.key[0],y:L.key[1]};
 if(boss&&boss.hp>0&&p.x>levels[index].bossX-590&&doorCursor===doors.length-1)target={x:boss.x+Math.cos(t*.8)*20,y:boss.y-50};
 if(target===priorTarget)targetFrames++;else{priorTarget=target;targetFrames=0;}if(targetFrames>800&&stars.includes(target)){skipped.add(target);targetFrames=0;}
 if(frame%10===0){keys.right=p.x+14<target.x-6;keys.left=p.x+14>target.x+6;
 const beam=(L.beams||[]).some(([x,y,w,h])=>p.x+p.w>x-40&&p.x<x+w+5&&p.y+p.h>y+h-10);
 setCrouchInput('bot',beam||(boss&&boss.hp>0&&boss.plan?.type==='sweep'&&p.ground&&p.y+p.h>425));
 if(!keys.crouch&&random()<(p.ground?.7:.27))jump();
 if(Math.abs(p.x-prev)<3)stuck++;else stuck=0;prev=p.x;
 if(stuck>30&&random()<.3){keys.right=random()>.5;keys.left=!keys.right;}
 }update(1/120);
 }return {level:index+1,won:false,retries,x:Math.round(p.x),y:Math.round(p.y),door:doorCursor+1,stars:starCount(),remaining:stars.filter(s=>!s.got).map(s=>[s.x,s.y]),key:collectedKey,hp:boss?.hp};})()`);
 results.push(result);console.log(JSON.stringify(result));
}
assert(results.every(r=>r.won),'all 100 courses must have an input-only completion');

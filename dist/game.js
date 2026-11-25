
'use strict';
const $=id=>document.getElementById(id),c=$('canvas'),ctx=c.getContext('2d');
let saved={unlocked:1,best:levels.map(()=>0),completed:levels.map(()=>false)};try{const d=JSON.parse(localStorage.getItem('star-hop-v1'));if(d&&Array.isArray(d.best)&&Array.isArray(d.completed)){saved.unlocked=Math.max(1,Math.min(levels.length,Number(d.unlocked)||1));saved.best=levels.map((_,i)=>Math.max(0,Math.min(levels[i].stars.length,Number(d.best[i])||0)));saved.completed=levels.map((_,i)=>!!d.completed[i]);for(let i=0;i<levels.length-1;i++)if(saved.completed[i])saved.unlocked=Math.max(saved.unlocked,i+2);}}catch{}
let index=0,state='ready',p,stars,t=0,deaths=0,particles=[],last=0,acc=0,keys={left:false,right:false,crouch:false},muted=true,audioCtx;
let tiles=[],checkpoint=false,portalCooldown=0,notice='',noticeUntil=0,boss=null,collectedKey=false;
let smartEnabled=true;try{const pref=JSON.parse(localStorage.getItem('star-hop-smart-v1'));if(typeof pref?.enabled==='boolean')smartEnabled=pref.enabled;}catch{}
const failures=levels.map(()=>0);let coach={idle:0,markUntil:0,target:null},lastFailure='';let goalRevealed=true,doors=[],doorCursor=0,doorMessageUntil=0,spawnPoint=null,visitedCheckpoints=new Set();
let camera={x:0,y:0,zoom:1};
let duo=true,p2=null,keys2={left:false,right:false,crouch:false},portal2=0,activePlayer=1;
function readOutfits(){let raw;try{raw=JSON.parse(localStorage.getItem('star-hop-outfits-v1'))}catch{}return [0,1].map(i=>({character:characterRoster.some(a=>a.id===raw?.[i]?.character)?raw[i].character:'poop',pet:petRoster.some(a=>a.id===raw?.[i]?.pet)?raw[i].pet:i?'chick':'slime'}));}
let outfits=readOutfits(),followers=[],wardrobeResume=false;
function characterAbility(){return outfits[activePlayer-1].character;}
function outfitName(i){return characterRoster.find(a=>a.id===outfits[i].character).name;}
function chooseOutfit(player,kind,id){if(![0,1].includes(player)||!['character','pet'].includes(kind)||(kind==='character'?characterRoster:petRoster).every(a=>a.id!==id))return;outfits[player][kind]=id;if(kind==='character'&&id!=='poop'){const q=player===0?p:p2;if(q)q.size=1;}try{localStorage.setItem('star-hop-outfits-v1',JSON.stringify(outfits))}catch{}refreshWardrobe();say((player+1)+'P 换上了'+(kind==='character'?outfitName(player):petRoster.find(a=>a.id===id).name)+'！');}
function refreshWardrobe(){
 $('outfit-summary').textContent='1P '+outfitName(0)+(duo?' · 2P '+outfitName(1):' · 单人冒险');$('wardrobe-two').hidden=!duo;
 for(let i=0;i<2;i++){$('outfit-status-'+i).textContent=outfitName(i)+' ＋ '+petRoster.find(a=>a.id===outfits[i].pet).name;}
 document.querySelectorAll('[data-outfit]').forEach(b=>b.setAttribute('aria-pressed',String(outfits[Number(b.dataset.player)][b.dataset.kind]===b.dataset.outfit)));
 document.querySelectorAll('[data-avatar-preview]').forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.save();g.translate(c.width/2,49);g.scale(1.35,1.35);paintCharacter(g,c.dataset.avatarPreview,{player:Number(c.dataset.player)+1});g.restore();});
 document.querySelectorAll('[data-pet-preview]').forEach(c=>{const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.save();g.translate(20,23);paintPet(g,c.dataset.petPreview);g.restore();});
}
function initWardrobe(){for(let i=0;i<2;i++){
 $('character-options-'+i).innerHTML=characterRoster.map(a=>`<button type="button" data-player="${i}" data-kind="character" data-outfit="${a.id}" aria-pressed="false" aria-label="${i+1}P 选择${a.name}"><canvas width="100" height="80" data-player="${i}" data-avatar-preview="${a.id}" aria-hidden="true"></canvas><b>${a.name}</b><small>${a.tag}</small></button>`).join('');
 $('pet-options-'+i).innerHTML=petRoster.map(a=>`<button type="button" data-player="${i}" data-kind="pet" data-outfit="${a.id}" aria-pressed="false" aria-label="${i+1}P 跟宠：${a.name}">${a.id==='none'?'<span class="no-pet">○</span>':`<canvas width="40" height="40" data-pet-preview="${a.id}" aria-hidden="true"></canvas>`}<span>${a.name}</span></button>`).join('');}
 document.querySelectorAll('[data-outfit]').forEach(b=>b.onclick=()=>chooseOutfit(Number(b.dataset.player),b.dataset.kind,b.dataset.outfit));
 $('wardrobe').addEventListener('toggle',()=>{if($('wardrobe').open){wardrobeResume=state==='playing';if(wardrobeResume)pause();}else{if(wardrobeResume&&state==='paused'){state='playing';$('overlay').hidden=true;$('pause').textContent='Ⅱ';c.focus({preventScroll:true});}wardrobeResume=false;}});
 $('wardrobe-done').onclick=()=>{$('wardrobe').open=false;$('canvas').scrollIntoView({block:'center',behavior:'smooth'});};refreshWardrobe();}
function resetFollowers(){followers=[p,p2].map(q=>q?{x:Math.max(12,q.x-20),y:q.y+q.h-8,trail:[],facing:q.facing}:null);}
function updateFollowers(dt){[p,duo?p2:null].forEach((q,i)=>{const f=followers[i];if(!q||!f||q.life==='out')return;const target={time:t,x:q.x+q.w/2,y:q.y+q.h-8,facing:q.facing,ground:q.ground};
 if(Math.hypot(f.x-target.x,f.y-target.y)>350){f.x=target.x;f.y=target.y;f.trail=[];}
 f.trail.push(target);while(f.trail.length>1&&f.trail[1].time<t-.22)f.trail.shift();if(f.trail.length>60)f.trail.shift();const past=f.trail[0],blend=1-Math.exp(-dt*12);f.x+=(Math.max(12,past.x-past.facing*34)-f.x)*blend;f.y+=(past.y-f.y)*blend;f.facing=past.facing;});}
function drawFollowers(){[p,duo?p2:null].forEach((q,i)=>{const f=followers[i],id=outfits[i].pet;if(!q||!f||q.life==='out'||id==='none')return;ctx.save();ctx.translate(f.x,f.y+Math.sin(t*7+i*2)*2);if(q.life==='down'){ctx.globalAlpha=.6;ctx.shadowColor='#b7f5ff';ctx.shadowBlur=12;}ctx.scale(f.facing,1);paintPet(ctx,id,t);ctx.restore();});}

function withSecond(fn){const first={p,keys,camera,portalCooldown};teamFirst=p;p=p2;keys=keys2;portalCooldown=portal2;activePlayer=2;try{return fn();}finally{p2=p;portal2=portalCooldown;p=first.p;keys=first.keys;camera=first.camera;portalCooldown=first.portalCooldown;activePlayer=1;}}
function initPartner(){p2=duo?newPlayer(p.x,p.y):null;portal2=0;if(p2){const floor=levels[index].platforms.find(q=>!q[3]&&q[1]>=p.y+p.h-2&&q[1]<=p.y+p.h+20&&p.x>=q[0]&&p.x+p.w<=q[0]+q[2]);if(floor){const clamp=x=>Math.max(floor[0]+2,Math.min(floor[0]+floor[2]-30,x));p2.x=clamp(p.x+42);if(Math.abs(p2.x-p.x)<22)p2.x=clamp(p.x-42);}}resetFollowers();}
function chooseMode(value){$('wardrobe').open=false;duo=value;refreshWardrobe();$("solo-mode").setAttribute("aria-pressed",String(!duo));$("duo-mode").setAttribute("aria-pressed",String(duo));$("mode-help").textContent=duo?"两个角色同一张地图 · 1P：A/D 移动，W 跳，S 蹲 · 2P：←/→ 移动，↑ 跳，↓ 蹲 · 两人到出口通关":"单人 · A/D 或 ←/→ 移动，W / ↑ / 空格跳，S / ↓ 蹲";$("touch-two").hidden=!duo;load(index,true);}

let gagClouds=[];
let weaponPickups=[];
let peppers=[];
function makePeppers(){
 const L=levels[index];
 const points=[...L.checkpoints,...weaponPickups.map(q=>[q.x,q.y+22])];
 peppers=points.filter(([x,y],i)=>x>180&&points.findIndex(q=>Math.hypot(q[0]-x,q[1]-y)<55)===i)
  .map(([x,y])=>({x,y:y-20,readyAt:0}));
}
function collectPeppers(){
 if(p.life!=='active'||(p.hp>=p.maxHp&&p.size===1))return;
 for(const pepper of peppers){
  if(t<pepper.readyAt||Math.hypot(p.x+p.w/2-pepper.x,p.y+p.h/2-pepper.y)>30)continue;
  const before=p.hp;
  p.hp=Math.min(p.maxHp,p.hp+(characterAbility()==='pig'?2:1));p.size=1;p.healUntil=t+1.4;if(characterAbility()==='pig')p.invulnerable=Math.max(p.invulnerable,2);pepper.readyAt=t+12;
  burst(pepper.x,pepper.y,'#ffb68c',14);tone(850,.12);
  say(activePlayer+'P 吃到小大便！恢复 '+(p.hp-before)+' 格血，身体变大了！');
 }
}
function drawPeppers(){
 for(const pepper of peppers){
  if(t<pepper.readyAt)continue;
  const y=pepper.y+Math.sin(t*3)*2;
  ctx.save();ctx.translate(pepper.x,y);
  round(-12,1,24,9,5,'#a87348');
  round(-9,-5,18,10,5,'#bd8b59');
  round(-5,-12,11,11,5,'#d5a16a');
  ctx.fillStyle='#fff4dd';ctx.fillRect(-6,-1,4,5);ctx.fillRect(3,-1,4,5);
  ctx.fillStyle='#4c3528';ctx.fillRect(-4,1,2,3);ctx.fillRect(4,1,2,3);
  ctx.restore();ctx.save();
  ctx.fillStyle='#ffe1ad';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('小大便 +♥',pepper.x,y-22);ctx.restore();
 }
}

let easterEggs=[];
function makeEasterEggs(){
 const L=levels[index];
 const candidates=L.platforms.filter(([x,y,w,kind])=>!kind&&w>=85&&x>600&&x<L.goal[0]-300&&!L.spikes.some(([sx,sy])=>sy===y&&sx>x-25&&sx<x+w+25));
 const selected=candidates.filter((q,i)=>i===Math.floor(candidates.length*.3)||i===Math.floor(candidates.length*.7));
 easterEggs=selected.map(([x,y,w],i)=>({x:x+w/2,y:y-24,found:false,name:['云朵小精灵','银河小蘑菇'][i%2]}));
}
function discoverEggs(){
 for(const egg of easterEggs){
  if(egg.found||Math.hypot(p.x+p.w/2-egg.x,p.y+p.h/2-egg.y)>48)continue;
  egg.found=true;p.hp=Math.min(p.maxHp,p.hp+1);p.size=1;p.healUntil=t+1.4;
  burst(egg.x,egg.y,'#f6b8ff',30);tone(1100,.2);
  say('发现隐藏彩蛋：'+egg.name+'！恢复 1 格血和正常大小。');
 }
}
function drawEggs(){
 for(const egg of easterEggs){
  if(!egg.found){star(egg.x,egg.y+Math.sin(t*3)*3,4,'#d7c5ff88');continue;}
  ctx.save();ctx.fillStyle='#d7b7ff';ctx.beginPath();ctx.ellipse(egg.x,egg.y,13,17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#5b4679';ctx.fillRect(egg.x-5,egg.y-3,3,4);ctx.fillRect(egg.x+3,egg.y-3,3,4);
  ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f3dcff';ctx.fillText(egg.name+' ✓',egg.x,egg.y-24);ctx.restore();
 }
}
let fireballChoice='course';
try{const value=localStorage.getItem('star-hop-fireballs');if(['course','on','off'].includes(value))fireballChoice=value;}catch{}
function hasFireballs(level=index){
 return fireballChoice==='on'||(fireballChoice==='course'&&level%3!==0);
}
let shelters=[],fireballs=[],nextFireball=0;
function makeShelters(){
 const L=levels[index];
 shelters=L.checkpoints.filter(([x])=>x>400&&x<L.goal[0]-150).filter((q,i)=>i%2===0)
  .map(([x,y])=>({x:x-10,y,w:68}));
 fireballs=[];nextFireball=2;
}
function inShelter(q){
 if(!hasFireballs())return false;
 return shelters.some(h=>q.x+q.w/2>h.x+5&&q.x+q.w/2<h.x+h.w-5&&q.y+q.h<=h.y+8&&q.y>h.y-70);
}
function updateFireballs(dt){
 if(!hasFireballs()){fireballs=[];return;}
 if(t>=nextFireball){
  const target=(duo?[p,p2]:[p]).find(q=>q.life==='active'&&q.x>400);
  if(target){
   const dir=Math.floor(t/3)%2?1:-1;
   fireballs.push({x:target.x-dir*420,y:target.y+target.h/2,vx:dir*(230+index),life:5});
  }
  nextFireball=t+Math.max(1.4,3-index*.012);
 }
 for(const ball of fireballs){
  const oldX=ball.x;ball.x+=ball.vx*dt;ball.life-=dt;ball.oldX=oldX;
  if(shelters.some(h=>ball.y>h.y-70&&ball.y<h.y+8&&Math.max(oldX,ball.x)>h.x&&Math.min(oldX,ball.x)<h.x+h.w))ball.life=0;
 }
 fireballs=fireballs.filter(ball=>ball.life>0);
}
function fireballContact(){
 if(inShelter(p))return;
 for(const ball of fireballs){
  if(ball.life<=0||p.invulnerable>0||Math.abs(ball.y-p.y-p.h/2)>p.h/2+10)continue;
  if(Math.max(ball.oldX??ball.x,ball.x)<p.x-10||Math.min(ball.oldX??ball.x,ball.x)>p.x+p.w+10)continue;
  ball.life=0;p.hp=Math.max(0,p.hp-1);
  if(!p.hp){fail('projectile');return;}
  p.invulnerable=1.2;say('被火球击中！还剩 '+p.hp+' 格血，跑进躲避屋！');
 }
}
function drawFireballsAndShelters(){
 if(!hasFireballs())return;
 for(const h of shelters){
  round(h.x,h.y-63,h.w,63,5,'#334e67');
  round(h.x+7,h.y-55,h.w-14,55,3,'#182d46');
  round(h.x-8,h.y-72,h.w+16,12,4,'#8bd1c7');
  ctx.save();ctx.fillStyle='#c4fff2';ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillText('躲避屋',h.x+h.w/2,h.y-80);ctx.restore();
 }
 for(const ball of fireballs){
  if(ball.life<=0)continue;
  ctx.save();ctx.shadowColor='#ff7744';ctx.shadowBlur=20;
  star(ball.x-Math.sign(ball.vx)*13,ball.y,15,'#ff7840');
  ctx.fillStyle='#ffe69a';ctx.beginPath();ctx.arc(ball.x,ball.y,9,0,Math.PI*2);ctx.fill();ctx.restore();
 }
}
function addMovingPlatforms(){
 const L=levels[index];
 const safeSpots=[...L.checkpoints,L.goal];
 const candidates=tiles.filter(q=>q.kind==='normal'&&q.x>350&&q.x<L.goal[0]-250&&q.w>=70&&q.w<=160
  &&!safeSpots.some(([x,y])=>Math.abs(y-q.y)<60&&x>q.x-65&&x<q.x+q.w+65)
  &&!L.spikes.some(([x,y])=>Math.abs(y-q.y)<50&&x>q.x-45&&x<q.x+q.w+45)
  &&!hiddenSpikes.some(trap=>Math.abs(trap.y-q.y)<50&&trap.x>q.x-45&&trap.x<q.x+q.w+45));
 const count=Math.min(candidates.length,6+Math.floor(index/25));
 for(let i=0;i<count;i++){
  const tile=candidates[Math.floor(i*candidates.length/count)];
  tile.kind=i%2===0?'move':'lift';
  tile.amount=18+Math.floor(index/25)*2;
  tile.speed=.7+index*.003;
 }
}
function addCourseTraps(){
 const L=levels[index];
 const safeSpots=[...L.checkpoints,L.goal];
 const candidates=tiles.filter(q=>q.kind==='normal'&&q.x>400&&q.x<L.goal[0]-250&&q.w>=70&&q.w<=180
  &&!safeSpots.some(([x,y])=>Math.abs(y-q.y)<45&&x>q.x-50&&x<q.x+q.w+50)
  &&!L.spikes.some(([x,y])=>Math.abs(y-q.y)<30&&x>q.x-30&&x<q.x+q.w+30));
 const count=Math.min(candidates.length,8);
 const chosen=[];
 for(let i=0;i<count;i++){
  const q=candidates[Math.floor(i*candidates.length/count)];
  if(!q||chosen.includes(q))continue;
  chosen.push(q);
  const x=q.x+q.w/2,y=q.y;
  const variant=(i+index)%8;
  if(variant===0){q.kind='crumble';}
  else if(variant===1){hiddenSpikes.push({x:x-14,y,delay:0,triggeredAt:null});}
  else if(variant===2){fallingTraps.push({x,floor:y,y:y-300,triggeredAt:null,done:false});}
  else if(variant===3||variant===4){
   q.kind=variant===3?'move':'lift';q.sudden=true;q.shifted=false;q.amount=variant===3?q.w+55:55;q.escapeFloor=variant===3;
  }else if(variant===5){q.kind='belt';q.amount=index%2?145:-145;}
  else if(variant===6){q.kind='spring';}
  else{q.kind='phase';q.amount=index%3;q.speed=3.5;}

 }
}
let fallingTraps=[];
function makeFallingTraps(){
 const L=levels[index];
 const points=L.checkpoints.filter(([x])=>x>500&&x<L.goal[0]-200);
 fallingTraps=points.filter((q,i)=>i===Math.floor(points.length/2)).map(([x,y])=>({x:x+45,floor:y,y:y-300,triggeredAt:null,done:false}));
}
function updateFallingTraps(dt){
 for(const trap of fallingTraps){
  if(trap.done)continue;
  const players=(duo?[p,p2]:[p]).filter(q=>q.life==='active');
  if(trap.triggeredAt===null&&players.some(q=>Math.abs(q.x+q.w/2-trap.x)<135&&Math.abs(q.y+q.h-trap.floor)<130))trap.triggeredAt=t;
  if(trap.triggeredAt===null)continue;
  trap.previousY=trap.y;trap.y+=(1100+index*3)*dt;
  if(trap.y>trap.floor+100)trap.done=true;
 }
 for(const tile of tiles){
  if(tile.kind!=='crumble'||tile.trigger>=0)continue;
  if((duo?[p,p2]:[p]).some(q=>q.life==='active'&&Math.abs(q.x+q.w/2-tile.x-tile.w/2)<75&&Math.abs(q.y+q.h-tile.y)<75)){tile.trigger=crumbleWindow();tile.active=false;}
 }
}
function fallingTrapContact(){
 for(const trap of fallingTraps){
  if(trap.done||trap.previousY===undefined)continue;
  if(Math.abs(p.x+p.w/2-trap.x)<p.w/2+17&&p.y<trap.y+18&&p.y+p.h>trap.previousY-18){fail('fallingTrap');return;}
 }
}
function drawFallingTraps(){
 for(const trap of fallingTraps){
  if(trap.done||trap.triggeredAt===null)continue;
  if(trap.previousY===undefined)continue;
  ctx.save();
  ctx.fillStyle='#8f9cae';ctx.beginPath();ctx.moveTo(trap.x,trap.y-20);ctx.lineTo(trap.x+20,trap.y-5);ctx.lineTo(trap.x+12,trap.y+18);ctx.lineTo(trap.x-15,trap.y+15);ctx.lineTo(trap.x-21,trap.y-7);ctx.closePath();ctx.fill();ctx.restore();
 }
}
let hiddenSpikes=[];
function activeSpikes(){
 return [...levels[index].spikes,...hiddenSpikes.filter(q=>q.triggeredAt!==null&&true).map(q=>[q.x,q.y])];
}
function triggerHiddenSpikes(){
 for(const trap of hiddenSpikes){
  if(trap.triggeredAt!==null||Math.abs(p.x+p.w/2-trap.x-14)>45||Math.abs(p.y+p.h-trap.y)>100)continue;
  trap.triggeredAt=t;
 }
}

let monster;
function makeWeaponPickups(){const L=levels[index],candidates=[];
 for(const [x,y,w,kind]of L.platforms){if(kind||w<85)continue;for(const offset of [w/2,24,w-24]){const bx=x+offset,by=y-22;if(bx<155||bx>L.goal[0]-100||bx-x<24||x+w-bx<24)continue;
 if(L.spikes.some(([sx,sy])=>Math.abs(sy-y)<55&&Math.abs(sx+14-bx)<65))continue;
 if((L.beams||[]).some(([sx,sy,sw,sh])=>bx+24>sx&&bx-24<sx+sw&&by+18>sy&&by-26<sy+sh))continue;
 if(L.platforms.some(([sx,sy,sw,sk])=>sk==='spring'&&Math.abs(sy-y)<5&&bx>sx-35&&bx<sx+sw+35))continue;
 if(L.doors.some(d=>Math.abs(d.x-bx)<48&&Math.abs(d.y-y)<90)||(L.portals||[]).some(([px,py,tx,ty])=>Math.hypot(px-bx,py-y)<60||Math.hypot(tx-bx,ty-y)<60))continue;
 if(L.stars.some(([sx,sy])=>Math.hypot(sx-bx,sy-by)<24))continue;
 candidates.push({x:bx,y:by});}}
 const chosen=[{x:80,y:L.platforms[0][1]-22}],count=L.worldWidth>5800?5:4;for(let i=1;i<count;i++){const target=L.worldWidth*(.15+.7*i/(count-1));const options=candidates.filter(q=>chosen.every(b=>Math.abs(b.x-q.x)>420)).sort((a,b)=>Math.abs(a.x-target)-Math.abs(b.x-target)||b.y-a.y);if(options.length)chosen.push(options[0]);}
 weaponPickups=chosen.sort((a,b)=>a.x-b.x);
}
function collectWeapon(){
 if(p.armed)return;
 const pickup=weaponPickups.find(q=>Math.abs(p.x+p.w/2-q.x)<=38&&Math.abs(p.y+p.h/2-q.y)<=34);
 if(!pickup)return;
 p.armed=true;
 burst(pickup.x,pickup.y,'#ffe399',18);
 tone(920,.12);
 say(activePlayer+'P 拿到了星光杖！按 J（2P 回车）发射炮弹。');
}
function updateMonster(dt){
 if(!monster.hp)return;
 const players=(duo?[p,p2]:[p]).filter(q=>q.life==='active');
 const distance=q=>Math.hypot(q.x+q.w/2-monster.x,q.y+q.h/2-monster.y);
 const target=players.reduce((nearest,q)=>!nearest||distance(q)<distance(nearest)?q:nearest,null);
 if(!target)return;
 if(!monster.chasing){
  if(t<.6||distance(target)>220)return;
  monster.chasing=true;
  monster.attackAt=t+.6;
 }
 const dx=target.x+target.w/2-monster.x,dy=target.y+target.h/2-monster.y;
 const step=Math.min(Math.max(0,Math.hypot(dx,dy)-12),(165+Math.min(index,99)*.35)*dt);
 const scale=step/Math.max(1,Math.hypot(dx,dy));
 monster.x+=dx*scale;
 monster.y+=dy*scale;
}
function monsterContact(){
 if(!monster.hp||!monster.chasing||t<monster.attackAt||p.invulnerable>0)return;
 if(Math.hypot(p.x+p.w/2-monster.x,p.y+p.h/2-monster.y)>27)return;
 monster.attackAt=t+.85;
 burst(monster.x,monster.y,'#ffb2a4',12);
 if(characterAbility()==='dino'&&!p.armorUsed){p.armorUsed=true;p.invulnerable=2.2;say('恐龙护甲挡住了这次攻击！');return;}
 p.hp=Math.max(0,p.hp-1);
 if(p.hp===0){fail('monster');return;}
 p.invulnerable=characterAbility()==='dino'?2.2:1.2;
 tone(180,.12);
 say(activePlayer+'P 受伤了！还剩 '+p.hp+' 格血，快发射炮弹反击！');
}
let shots=[];
function attackMonster(){
 if(state!=='playing'||p.life!=='active'||!p.armed||t<(p.nextShot||0))return;
 p.nextShot=t+(characterAbility()==='fish'?.22:.35);
 const x=p.x+p.w/2,y=p.y+p.h/2;
 const target=monster.hp?monster:index===99&&boss?.hp?{x:boss.x,y:boss.y+35}:null;
 const dx=target?target.x-x:p.facing,dy=target?target.y-y:0;
 const aimed=target&&dx*p.facing>=0;
 const length=Math.max(1,Math.hypot(dx,dy));
 shots.push({x,y,vx:aimed?dx/length*460:p.facing*460,vy:aimed?dy/length*460:0,life:1.8,damage:characterAbility()==='poop'?2:1});
 tone(600,.08);
}
function updateShots(dt){
 for(const shot of shots){
  const oldX=shot.x,oldY=shot.y;
  shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
  if(index===99&&boss?.hp){
   const vx=shot.x-oldX,vy=shot.y-oldY,length=vx*vx+vy*vy;
   const fraction=length?Math.max(0,Math.min(1,((boss.x-oldX)*vx+(boss.y+35-oldY)*vy)/length)):0;
   if(Math.abs(oldX+vx*fraction-boss.x)<=45&&Math.abs(oldY+vy*fraction-boss.y-35)<=43){
    shot.life=0;boss.hp--;burst(boss.x,boss.y+35,'#ffe399',20);tone(900,.12);
    say(boss.hp?'大魔王已命中 '+(5-boss.hp)+' / 5 颗！':'五颗命中！大魔王被打败了！');
    if(!boss.hp){boss.shots=[];boss.plan=null;}
    continue;
   }
  }
  if(!monster.hp||Math.abs(shot.y-monster.y)>25)continue;
  if(monster.x<Math.min(oldX,shot.x)-23||monster.x>Math.max(oldX,shot.x)+23)continue;
  shot.life=0;monster.hp=Math.max(0,monster.hp-shot.damage);
  burst(monster.x,monster.y,'#ffe399',monster.hp?8:22);
  say(monster.hp?'炮弹命中！再打一下。':'小怪兽已击败！');
 }
 shots=shots.filter(shot=>shot.life>0);
}
function drawShots(){
 for(const shot of shots)star(shot.x,shot.y,8,'#fff0a2');
}
function drawWand(x,y,angle,size=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size,size);
 round(-3,-4,6,27,3,'#eaac64');star(0,-8,10,'#fff0a2');
 ctx.restore();
}
function drawWeaponPickups(){
 const firstNeedsWand=p.life!=='out'&&!p.armed;
 const secondNeedsWand=duo&&p2.life!=='out'&&!p2.armed;
 if(!firstNeedsWand&&!secondNeedsWand)return;
 for(const {x,y} of weaponPickups){
  const bob=y+Math.sin(t*4)*3;
  drawWand(x,bob,.5);
  ctx.fillStyle='#fff0a2';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
  const label=duo&&firstNeedsWand!==secondNeedsWand?(firstNeedsWand?'1P 拾取':'2P 拾取'):'碰到即可拾取';
  ctx.fillText(label,x,bob-24);
 }
}
function drawMonster(){
 const {x,y,hp,flash}=monster;
 if(hp){
  const bob=Math.sin(t*5)*4;
  round(x-18,y+bob-16,36,32,14,'#c5756f');
  round(x-10,y+bob-5,6,8,3,'#fff');
  round(x+4,y+bob-5,6,8,3,'#fff');
  for(let i=0;i<hp;i++)round(x-12+i*13,y-27,11,5,2,'#ffd0ca');
  ctx.save();ctx.fillStyle='#ffd0ca';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
  ctx.fillText(monster.chasing?'小怪兽 · 追击中':'小怪兽',x,y-34);ctx.restore();
 }
 if(flash&&t-flash.time<.18){
  ctx.save();ctx.globalAlpha=1-(t-flash.time)/.18;
  ctx.strokeStyle='#ffe399';ctx.lineWidth=4;ctx.beginPath();
  ctx.moveTo(flash.x,flash.y);ctx.lineTo(x,y);ctx.stroke();ctx.restore();
 }
}

function updateCamera(dt=0,snap=false){const L=levels[index],blend=snap?1:1-Math.exp(-dt*7);if(!duo||!p2){camera.zoom=1;const tx=Math.max(0,Math.min(L.worldWidth-900,p.x+p.w/2-380)),ty=Math.max(-230,Math.min(0,p.y-120));camera.x+=(tx-camera.x)*blend;camera.y+=(ty-camera.y)*blend;return;}
const a=activePlayer===2?teamFirst:p,b=activePlayer===2?p:p2,first=a.life==='out'?b:a,second=b.life==='out'?first:b,left=Math.min(first.x,second.x),right=Math.max(first.x+first.w,second.x+second.w),top=Math.min(first.y,second.y)-35,bottom=Math.max(first.y+first.h,second.y+second.h);
const targetZoom=Math.min(1,900/(right-left+180),510/(bottom-top+150));camera.zoom=targetZoom<camera.zoom||snap?targetZoom:camera.zoom+(targetZoom-camera.zoom)*blend;const z=camera.zoom,tx=Math.max(0,Math.min(Math.max(0,L.worldWidth-900/z),(left+right)/2-450/z)),ty=(top+bottom)/2-255/z;
camera.x+=(tx-camera.x)*blend;camera.y+=(ty-camera.y)*blend;
// Keep both characters inside the shared view even after a portal or a long jump.
camera.x=Math.max(0,Math.min(camera.x,left-35/z));camera.x=Math.max(camera.x,right-865/z);camera.y=Math.min(camera.y,top-20/z);camera.y=Math.max(camera.y,bottom-490/z);}
function saveCheckpoint(x,y){if(spawnPoint&&x<spawnPoint[0])return;checkpoint=true;spawnPoint=[x,y];}
function assisted(){return smartEnabled&&failures[index]>=3;}
function crumbleWindow(){return (levels[index].crumbleDelay||.9)+(assisted()?.45:0);}
function bossInterval(){return (boss&&boss.hp<=2?1.9:2.8)+(assisted()?.5:0);}
function bossWarning(){return assisted()?1:.7;}
function directionTo(x,y){return (x<p.x?'左':'右')+(y<p.y-40?'上方':y>p.y+p.h+45?'下方':'侧');}
function coachAdvice(){const L=levels[index],feet=p.y+p.h,center=p.x+p.w/2;
if(index===99&&boss?.hp&&Math.abs(center-boss.x)<560)return {text:'面向大魔王按 J（2P 回车）发射，命中五颗即可击败！',target:{x:boss.x,y:boss.y+35}};
if(boss&&boss.hp>0&&Math.abs(center-boss.x)<560){if(boss.plan)return {text:boss.plan.message,target:boss.plan.type==='aim'?{x:boss.plan.x,y:boss.plan.y}:null};return {text:boss.cooldown>0?'刚刚命中了！保持在头顶附近，等闪烁结束再踩。':'金色头顶是弱点。先躲开攻击，再从上方落到它头上。',target:{x:boss.x,y:boss.y-14}};}
if(monster.hp&&Math.abs(center-monster.x)<260)return {text:p.armed?'靠近路线中段的小怪兽，按 J（2P 回车）发射炮弹。':'先碰一下起点的星光杖，再向右靠近小怪兽。',target:p.armed?monster:weaponPickups[0]};
if(Math.abs(center-L.goal[0])<110){if(L.hiddenGoal&&!goalRevealed)return {text:'这附近有微弱星光，靠近不同位置找找，隐藏出口可能就在附近。',target:null};if(L.key&&!collectedKey)return {text:'终点还锁着：先去'+directionTo(...L.key)+'拿金钥匙。',target:{x:L.key[0],y:L.key[1]}};if(stars.filter(q=>q.got).length<L.requiredStars){const q=stars.filter(q=>!q.got).sort((a,b)=>Math.hypot(center-a.x,feet-a.y)-Math.hypot(center-b.x,feet-b.y))[0];return {text:'还差 '+(L.requiredStars-stars.filter(q=>q.got).length)+' 颗星，先找'+directionTo(q.x,q.y)+'闪光的位置。',target:q};}if(monster.hp)return {text:'返回路线中段，用星光杖发射炮弹击败小怪兽。',target:monster};return {text:'终点已开放，进入金色门即可过关。',target:{x:L.goal[0],y:L.goal[1]-35}};}
for(const [x,y,w,h]of L.beams||[])if(center>x-80&&center<x+w+20&&feet>y+h-10)return {text:'前面是低矮通道：按住 ↓ / S 蹲下走，出去后再站起。',target:{x:x+w+20,y:feet-15}};
for(const [x,y]of activeSpikes())if(Math.abs(center-x-14)<70&&Math.abs(feet-y)<40)return {text:'尖刺挡住了路，先跳起来再向前；不要落在尖端上。',target:null};
if(p.riding!==null){const q=tiles[p.riding];if(q.kind==='lift')return {text:q.dy<0?'升降梯正在上升，站稳，靠近高台时再跳。':'升降梯正在下降，可以等下一轮上升。',target:null};if(q.kind==='move')return {text:'平台正在载你移动，靠近对岸后再起跳。',target:null};if(q.kind==='belt')return {text:q.amount>0?'传送带正在推你向右，跳跃前留出刹车距离。':'这段传送带向左，按住向右前进，必要时跳过去。',target:null};}
const near=tiles.filter(q=>q.x>center+15&&q.x<center+250&&Math.abs(q.y-feet)<160).sort((a,b)=>Math.abs(a.x-center)+Math.abs(a.y-feet)*.5-Math.abs(b.x-center)-Math.abs(b.y-feet)*.5)[0];
if(near){if(near.kind==='move'||near.kind==='lift')return {text:'前方是移动平台，等它靠近且高度合适时再跳上去。',target:null};if(!near.active)return {text:'前方云桥还没出现，先等它变实心，不要踩半透明平台。',target:{x:near.x+near.w/2,y:near.y-12}};if(near.kind==='spring')return {text:'踩粉色垫会自动弹起，空中再调整左右方向。',target:{x:near.x+near.w/2,y:near.y-12}};if(coach.idle>3||t<coach.markUntil){const landing=[near.x+near.w/2,near.x+22,near.x+near.w-22].find(x=>!(L.spikes||[]).some(q=>Math.abs(q[1]-near.y)<2&&Math.abs(q[0]+14-x)<32));if(landing!==undefined)return {text:'试着跳向亮圈位置；距离不够时，再按一次跳跃。',target:{x:landing,y:near.y-14}};}}
return {text:L.hint,target:null};}
function requestHint(){coach.markUntil=t+8;const advice=coachAdvice();coach.target=advice.target;say(advice.text);noticeUntil=t+8;}
function toggleSmart(){smartEnabled=!smartEnabled;if(!smartEnabled){coach.markUntil=0;noticeUntil=0;}try{localStorage.setItem('star-hop-smart-v1',JSON.stringify({enabled:smartEnabled}))}catch{}hud();c.focus({preventScroll:true});}
function refreshSmart(){const button=$('smart-toggle');button.textContent='贴心辅助：'+(smartEnabled?'开':'关');button.setAttribute('aria-pressed',String(smartEnabled));$('assist-state').textContent=assisted()?'辅助生效 · 跳跃更宽容 / Boss 出招更慢':smartEnabled?'连续失败 3 次后提供帮助':'标准挑战';}
const crouchInputs=new Set();
const flightInputs=[new Set(),new Set()];
function setFlightInput(source,pressed,second=false){const inputs=flightInputs[second?1:0];if(pressed)inputs.add(source);else inputs.delete(source);(second?keys2:keys).flyUp=inputs.size>0;}

function setCrouchInput(source,pressed){if(pressed)crouchInputs.add(source);else crouchInputs.delete(source);keys.crouch=crouchInputs.size>0;$('crouch').setAttribute('aria-pressed',String(keys.crouch));}
function resetControls(){keys.flyUp=keys2.flyUp=false;flightInputs.forEach(s=>s.clear());keys.left=keys.right=keys.crouch=false;keys2.left=keys2.right=keys2.crouch=false;crouchInputs.clear();$('crouch').setAttribute('aria-pressed','false');}
function updatePosture(){let height=keys.crouch?18:35;const feet=p.y+p.h;if(height>p.h){for(const [x,y,w,h] of levels[index].beams||[]){if(p.x+p.w>x&&p.x<x+w&&feet-height<y+h&&feet>y){height=p.h;break;}}for(const [x,y] of levels[index].spikes){const bounds=spikeBounds(x,y,feet-height,p.y);if(bounds&&p.x+p.w>bounds[0]&&p.x<bounds[1]){height=p.h;break;}}}p.y=feet-height;p.h=height;p.crouched=height<35;}
function circleHitsPlayer(x,y,radius){if(!p.crouched)return Math.hypot(p.x+p.w/2-x,p.y+18-y)<radius+13;const nx=Math.max(p.x,Math.min(x,p.x+p.w)),ny=Math.max(p.y,Math.min(y,p.y+p.h));return (x-nx)**2+(y-ny)**2<radius**2;}
function tone(freq,duration=.1){if(muted)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audioCtx.currentTime);g.gain.setValueAtTime(.07,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch{}}
function map(){ $('levels').innerHTML='';levels.forEach((l,i)=>{if(i%10===0){let h=document.createElement('div');h.className='chapter';h.textContent=['01–10 · 云端长途赛','11–20 · 秘境寻门','21–30 · 魔王前哨','31–40 · 迷雾远征','41–50 · 星河险路','51–60 · 星空挑战','61–70 · 噗噗森林','71–80 · 怪诞远征','81–90 · 银河奇旅','91–100 · 百关决战'][i/10];$('levels').appendChild(h);}let b=document.createElement('button');b.className='level'+(i===index?' active':'');b.disabled=false;b.innerHTML=`<span class="num">${String(i+1).padStart(2,'0')}</span><span><span class="level-name">${l.name}</span><span class="level-sub">${l.sub} · ${l.requiredStars}★开门</span></span><span class="level-end">${saved.completed[i]?'★ '+saved.best[i]:'→'}</span>`;b.title=hasFireballs(i)?'本关有小火球':'本关无小火球';
b.innerHTML+='<span style="display:block;font-size:11px">'+(hasFireballs(i)?'🔥 有小火球':'无小火球')+'</span>';
b.onclick=()=>load(i,true);$('levels').appendChild(b)});$('progress').textContent=saved.completed.filter(Boolean).length+' / '+levels.length+' 完成';}
function makeTiles(){tiles=levels[index].platforms.map(([x,y,w,kind='normal',amount=0,speed=1])=>({x,y,w,kind,amount,speed,baseX:x,baseY:y,active:true,trigger:-1,dx:0,dy:0}));advanceTiles(0);}
function advanceTiles(dt){for(const tile of tiles){const ox=tile.x,oy=tile.y;if(tile.kind==='move')tile.x=tile.baseX+Math.sin(t*tile.speed)*tile.amount;if(tile.kind==='lift')tile.y=tile.baseY-Math.sin(t*tile.speed)*tile.amount;if(tile.sudden){
 if(!tile.shifted&&(duo?[p,p2]:[p]).some(q=>q&&q.life==='active'&&(tile.escapeFloor?q.ground&&q.riding===tiles.indexOf(tile):Math.abs(q.x+q.w/2-tile.baseX-tile.w/2)<95&&Math.abs(q.y+q.h-tile.baseY)<90)))tile.shifted=true;
 tile.x=tile.baseX+(tile.kind==='move'&&tile.shifted?tile.amount:0);
 tile.y=tile.baseY-(tile.kind==='lift'&&tile.shifted?tile.amount:0);
}
tile.dx=tile.x-ox;tile.dy=tile.y-oy;if(tile.kind==='phase')tile.active=((t+tile.amount)%tile.speed)<tile.speed*.7;if(tile.kind==='crumble'&&tile.trigger>=0){tile.trigger+=dt;tile.active=tile.trigger<crumbleWindow();if(tile.trigger>=crumbleWindow()+3){tile.trigger=-1;tile.active=true;}}}}
function newPlayer(x=45,y=380){return {x,y,w:28,h:35,crouched:false,vx:0,vy:0,jumps:0,ground:false,coyote:0,riding:null,jumpBuffer:0,facing:1,gait:0,puffDistance:0,life:'active',downUntil:0,rescueProgress:0,invulnerable:0,hp:5,maxHp:5,size:1,armed:false,lastSafe:[x,y+35]};}
function load(i,play=false){index=i;p=newPlayer(45,levels[i].platforms[0][1]-50);boss=levels[i].boss?{hp:i===99?5:levels[i].bossHP,max:i===99?5:levels[i].bossHP,cooldown:0,clock:0,shots:[],x:levels[i].bossX,y:370,plan:null,lastAttack:null}:null;collectedKey=false;goalRevealed=true;doors=[{x:levels[i].goal[0],y:levels[i].goal[1],exit:true,revealed:true,verified:false}];doorCursor=0;spawnPoint=null;visitedCheckpoints=new Set();doorMessageUntil=0;stars=levels[i].stars.map(([x,y])=>({x,y,got:false}));t=0;shots=[];particles=[];gagClouds=[];checkpoint=false;portalCooldown=0;notice='';noticeUntil=0;coach={idle:0,markUntil:0,target:null};hiddenSpikes=(levels[i].hiddenSpikes||[]).map(q=>({...q,triggeredAt:null}));makeTiles();makeWeaponPickups();makePeppers();makeEasterEggs();makeFallingTraps();makeShelters();addCourseTraps();addMovingPlatforms();const middleDoor=levels[i].doors[Math.floor((levels[i].doors.length-1)/2)];monster={x:middleDoor.x-35,y:middleDoor.y-20,hp:2,nextHit:.25,flash:null,chasing:false,attackAt:0};resetControls();state=play?'playing':'ready';if(play)c.focus({preventScroll:true});$('overlay').hidden=play;$('levelNo').textContent=String(i+1).padStart(2,'0')+' / '+String(levels.length).padStart(2,'0');$('levelName').textContent=levels[i].name;$('route').textContent='难度 '+(i+1)+' / 100 · 留意隐藏倒刺与消失地板';$('bossbar').hidden=!boss;$('bossname').textContent=levels[i].name;$('checkpoint').textContent=checkpoint?'⚑ 检查点已激活':'⚑ 检查点未激活';$('pause').textContent='Ⅱ';initPartner();updateCamera(0,true);hud();map();}
function respawn(){if(!checkpoint){load(index,true);return;}const [x,y]=spawnPoint;const armed=p.armed,partnerArmed=p2?.armed;p=newPlayer(x,y-35);p.armed=armed;shots=[];fireballs=[];nextFireball=t+2;makeTiles();const savedGround=hiddenSpikes,savedRocks=fallingTraps;hiddenSpikes=[];fallingTraps=[];addCourseTraps();hiddenSpikes=savedGround;fallingTraps=savedRocks;addMovingPlatforms();portalCooldown=1;particles=[];gagClouds=[];if(boss){boss.shots=[];boss.clock=0;boss.cooldown=1;boss.plan=null;}initPartner();if(p2)p2.armed=partnerArmed;state='playing';resetControls();$('overlay').hidden=true;c.focus({preventScroll:true});updateCamera(0,true);say('从休息点继续！星星、钥匙和战斗进度都保留。');hud();}
function say(message){notice=message;noticeUntil=t+3;}
function healthStatus(){return [p,duo?p2:null].filter(Boolean).map((q,i)=>(i+1)+'P '+'♥'.repeat(q.hp)+'♡'.repeat(q.maxHp-q.hp)).join(' ｜ ');}
function hud(){$('health-status').textContent=healthStatus();$('item-status').textContent='✦ 星光杖 '+(p.armed?'1P 已装备':'1P 待拾取')+(duo?(p2.armed?' · 2P 已装备':' · 2P 待拾取'):'')+' ｜ 小怪兽 '+(monster.hp?'♥'.repeat(monster.hp):'已击败');$('rescue-status').hidden=!duo;$('rescue-status').textContent=rescueStatus();refreshSmart();const count=stars.filter(s=>s.got).length;$('star-goal').textContent=count>=levels[index].requiredStars?'★ 星星已达标':'★ 开门需要 '+levels[index].requiredStars+' 颗，还差 '+(levels[index].requiredStars-count)+' 颗';$('door-status').textContent=canExit()?'出口已开放':'收集星星 · 击败怪兽 · 到达出口';$('journey').textContent='镜头自动跟随 · 路程 '+Math.min(100,Math.round((p.x+14)/levels[index].goal[0]*100))+'%';$('checkpoint').textContent=checkpoint?'⚑ 休息点已保存':'⚑ 寻找休息点';if(boss){$('bosshealth').textContent=index===99?'炮弹命中 '+(5-boss.hp)+' / 5':boss.hp>0?'♥'.repeat(boss.hp)+'♡'.repeat(boss.max-boss.hp):'已击败！收星后通关';$('bossphase').textContent=boss.hp<=0?'胜利':boss.hp<=2?'第二阶段 · 双弹连发':'第一阶段 · 躲避反击';}$('hint').textContent=t<noticeUntil?notice:smartEnabled?coachAdvice().text:levels[index].hint;$('stars').textContent=stars.filter(s=>s.got).length+' / '+stars.length;let sec=Math.floor(t);$('timer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function modal(title,text,action,label){$('modalTitle').textContent=title;$('modalText').textContent=text;$('action').textContent=label;$('action').onclick=action;$('extra').hidden=true;$('overlay').hidden=false;resetControls();}
function jump(){if(state!=='playing'||p.life!=='active')return;if(p.jumps>=(characterAbility()==='rabbit'?3:2)){p.jumpBuffer=smartEnabled?(assisted()?.18:.1):0;return;}if(p.jumps<(characterAbility()==='rabbit'?3:2)){p.jumpBuffer=0;p.vy=characterAbility()==='rabbit'?-510:-470;p.jumps++;p.ground=false;p.riding=null;p.coyote=0;tone(p.jumps===1?440:590,.09);fartBurst(p.jumps===2?'double':'jump');}}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.7)*180,life:.6,color});}
const failureTips={fallingTrap:'被落石击中了！重新挑战，注意躲避落石。',monster:'刚才被小怪兽追上了。先捡星光杖，靠近它让按 J（2P 回车）发射炮弹。',fall:'刚才没有落到平台上。靠近边缘再起跳，空中还可以再跳一次。',spike:'刚才踩中了尖端。侧面碰到不会死，但需要跳过尖刺再落地。',hammer:'刚才碰到了摆锤。等它摆开后再走，也可以尝试另一条路线。',projectile:'刚才被弹丸击中了。看清预警：横扫可蹲下，低弹要跳起，瞄准弹要移动躲开。',body:'刚才撞到了 Boss 身体。要从上方踩中金色头顶才能反击。'};
function fail(reason='fall'){if(state!=='playing'||p.life!=='active'||p.invulnerable>0)return;
if(reason!=='fall'&&p.hp>0){
 p.hp=Math.max(0,p.hp-1);
 if(p.hp>0){p.invulnerable=1.2;say(activePlayer+'P 受伤，还剩 '+p.hp+' 格血！');return;}
}
if(reason==='fall')p.hp=0;
if(duo){downPlayer(reason);return;}state='dead';deaths++;failures[index]++;lastFailure=reason;tone(160,.2);const tip=failureTips[reason]||failureTips.fall;modal(duo?activePlayer+'P 失误了，一起再试！':'再试一次，有办法！',tip+(checkpoint?'\n绿旗已激活，从检查点继续。':'')+(assisted()?'\n贴心辅助已开启：给你更宽松的反应时间。':''),respawn,checkpoint?'从检查点继续 →':'重新挑战 ↻');refreshSmart();}
function downPlayer(reason){deaths++;failures[index]++;lastFailure=reason;const [x,feet]=p.lastSafe;p.x=x;p.h=18;p.y=feet-p.h;p.crouched=true;p.vx=p.vy=0;p.jumps=0;p.jumpBuffer=0;p.riding=null;p.ground=false;p.life='down';p.downUntil=t+20;p.rescueProgress=0;keys.left=keys.right=keys.crouch=keys.flyUp=false;flightInputs[activePlayer-1].clear();tone(160,.15);say(activePlayer+'P 变成幽灵了！上下左右飞去找队友，20 秒内碰到队友即可复活。');}
function teamDefeated(){if(state!=='playing')return;p.life=p2.life='out';state='dead';modal('两个人都倒下了，一起复活！',checkpoint?'从检查点继续，已收集的星星和战斗进度保留。':'这次没有到达检查点，一起从起点重新出发。',respawn,'两人一起复活 →');}
function updateRescue(dt){if(!duo||state!=='playing')return;const players=[p,p2];
for(const [i,q]of players.entries()){if(q.life!=='down')continue;if(t>=q.downUntil){q.life='out';q.rescueProgress=0;say((i+1)+'P 救援超时，暂时淘汰。等待伙伴倒下后一起复活。');continue;}
const helper=players[1-i],near=helper.life==='active'&&Math.abs(helper.x+helper.w/2-q.x-q.w/2)<(helper.w+q.w)/2+4&&Math.abs(helper.y+helper.h/2-q.y-q.h/2)<(helper.h+q.h)/2+4;
q.rescueProgress=0;if(near){const x=helper.x,feet=helper.y+helper.h,safe=helper.lastSafe.slice();Object.assign(q,newPlayer(x,feet-18),{h:18,crouched:true,invulnerable:2,lastSafe:safe});const control=i?keys2:keys;control.left=control.right=control.crouch=control.flyUp=false;flightInputs[i].clear();burst(x+14,feet-12,'#bafa9b',20);tone(880,.2);say((i+1)+'P 被救起来了！获得 2 秒保护。');}}
if(players.every(q=>q.life!=='active'))teamDefeated();}
function rescueStatus(){if(!duo)return '';const first=activePlayer===2?teamFirst:p,second=activePlayer===2?p:p2;return [first,second].map((q,i)=>(i+1)+'P '+(q.life==='active'?'行动中':q.life==='out'?'已淘汰，等待全队复活':'幽灵待救 '+Math.max(0,Math.ceil(q.downUntil-t))+' 秒'+(q.rescueProgress>0?' · 救援 '+Math.min(100,Math.floor(q.rescueProgress/1.2*100))+'%':''))).join(' ｜ ');}
function win(){state='won';failures[index]=0;let count=stars.filter(s=>s.got).length;saved.best[index]=Math.max(saved.best[index],count);saved.completed[index]=true;saved.unlocked=Math.max(saved.unlocked,Math.min(levels.length,index+2));try{localStorage.setItem('star-hop-v1',JSON.stringify(saved))}catch{}tone(880,.3);map();modal(index===levels.length-1?'你点亮了整片星空！':'漂亮！又向星空近了一步',index===levels.length-1?`${levels.length} 关全部通关 · 最佳收集 ${saved.best.reduce((a,b)=>a+b,0)} / ${levels.reduce((total,l)=>total+l.stars.length,0)} 颗星\n回到任意关卡，继续挑战满星吧。`:`${levels[index].name} 已完成 · 收集 ${count} / ${stars.length} 颗星\n用时 ${$('timer').textContent}，下一段冒险正在等你。`,()=>load(index===levels.length-1?0:index+1,true),index===levels.length-1?'重新出发 →':'下一关 →');$('extra').hidden=false;$('extra').onclick=()=>load(index,true);}
function pause(){if(state==='playing'){state='paused';modal('让冒险歇一会儿','准备好后，继续向星星出发。',()=>{state='playing';$('overlay').hidden=true;$('pause').textContent='Ⅱ';c.focus({preventScroll:true})},'继续冒险 →');$('pause').textContent='▶'}else if(state==='paused'){$('action').click()}}
function spikeBounds(x,y,top,bottom){if(bottom<=y-25||top>=y)return null;const half=14*Math.min(1,(bottom-(y-25))/25);return [x+14-half,x+14+half];}
function hammerPositions(){return (levels[index].hammers||[]).map(([x,y,length,speed])=>{const angle=Math.sin(t*speed)*1.05;return {anchorX:x,anchorY:y,x:x+Math.sin(angle)*length,y:y+Math.cos(angle)*length};});}
function planBossAttack(){const type=p.crouched?'low':!p.ground&&p.y+p.h<390&&Math.abs(p.x+14-boss.x)>85&&Math.abs(p.x+14-boss.x)<240?'aim':'sweep';return {type,x:Math.max(30,Math.min(levels[index].worldWidth-30,p.x+p.w/2+p.vx*.3)),y:Math.max(100,Math.min(430,p.y+p.h/2)),message:type==='low'?'低弹预警：准备跳起来！':type==='aim'?'瞄准预警：离开标记位置！':'横扫预警：可以蹲下躲避。'};}
function updateBoss(dt,previousBottom){if(!boss||boss.hp<=0||p.x<levels[index].bossX-590)return;boss.cooldown=Math.max(0,boss.cooldown-dt);boss.x=levels[index].bossX+Math.sin(t*.8)*70;boss.clock+=dt;const interval=bossInterval();
if(!boss.plan&&boss.clock>=interval-bossWarning())boss.plan=planBossAttack();
if(boss.clock>=interval){boss.clock=0;const plan=boss.plan||planBossAttack();boss.plan=null;boss.lastAttack=plan.type;const direction=plan.x<boss.x?-1:1;const speed=(plan.type==='aim'?(boss.hp<=2?150:130):(boss.hp<=2?210:175))*(assisted()?.78:1);let shot;if(plan.type==='aim'){const dx=plan.x-boss.x,dy=plan.y-395,distance=Math.max(1,Math.hypot(dx,dy));shot={x:boss.x,y:395,vx:dx/distance*speed,vy:dy/distance*speed};}else shot={x:boss.x,y:plan.type==='low'?430:410,vx:direction*speed,vy:0};boss.shots.push(shot);if(boss.hp<=2)boss.shots.push({...shot,x:shot.x-direction*35,y:shot.y-75});tone(180,.1);}
for(const shot of boss.shots){shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;}boss.shots=boss.shots.filter(q=>q.x>-25&&q.x<levels[index].worldWidth+25&&q.y>-30&&q.y<550);
const onHead=p.x+p.w>boss.x-35&&p.x<boss.x+35&&previousBottom<=boss.y+3&&p.y+p.h>=boss.y&&p.vy>0;
if(onHead){p.y=boss.y-p.h;p.vy=-540;p.jumps=0;p.ground=false;p.riding=null;if(index!==99&&boss.cooldown===0){boss.hp--;boss.cooldown=1;burst(boss.x,boss.y,'#f0ce71',24);tone(900,.15);say(boss.hp?'命中！再踩 '+boss.hp+' 次。':'Boss 已击败，前往右侧金色门！');if(boss.hp===0){boss.shots=[];return;}}}
if(boss.cooldown===0&&p.x+p.w>boss.x-37&&p.x<boss.x+37&&p.y+p.h>boss.y+6&&p.y<440){fail('body');return;}
if(boss.cooldown===0)for(const q of boss.shots)if(circleHitsPlayer(q.x,q.y,10)){fail('projectile');return;}}
function touchingDoor(x,y){return Math.abs(p.x+p.w/2-x)<26&&p.y+p.h<=y+4&&p.y+p.h>y-70;}
function starCount(){return stars.filter(s=>s.got).length;}
function canExit(){const L=levels[index];return starCount()>=L.requiredStars&&(!L.key||collectedKey)&&monster.hp===0&&(!boss||boss.hp===0);}
function updateDoors(){
 const d=doors[0];
 if(!touchingDoor(d.x,d.y))return;
 if(!canExit()){
  if(t>=doorMessageUntil){say(monster.hp?'先击败路线中段的小怪兽。':boss&&boss.hp?'先击败 Boss。':levels[index].key&&!collectedKey?'先拿到金钥匙。':'还需要收集星星。');doorMessageUntil=t+3;}
  return;
 }
 if(duo){
  const other=activePlayer===1?p2:teamFirst;
  if(!other||other.life!=='active'||Math.abs(other.x+other.w/2-d.x)>60||Math.abs(other.y+other.h-d.y)>75){say('等队友一起到达出口！');return;}
 }
 win();
}
let teamFirst=null;
function update(dt){if(state!=='playing')return;t+=dt;advanceTiles(dt);updateFallingTraps(dt);updateFireballs(dt);updateMonster(dt);updateShots(dt);teamFirst=p;updatePlayer(dt,true);if(duo&&state==='playing')withSecond(()=>updatePlayer(dt,false));if(state==='playing'){updateRescue(dt);updateFollowers(dt);advanceEffects(dt);}hud();}
function updateGhost(dt){const dx=(keys.right?1:0)-(keys.left?1:0),dy=(keys.crouch?1:0)-(keys.flyUp?1:0),length=Math.max(1,Math.hypot(dx,dy));p.vx=dx/length*285;p.vy=dy/length*285;p.x=Math.max(0,Math.min(levels[index].worldWidth-p.w,p.x+p.vx*dt));p.y=Math.max(-210,Math.min(490-p.h,p.y+p.vy*dt));if(dx)p.facing=dx;}
function updatePlayer(dt,worldTick){if(state!=='playing')return;if(p.life==='down'){updateGhost(dt);return;}if(p.life!=='active')return;collectWeapon();collectPeppers();discoverEggs();triggerHiddenSpikes();p.invulnerable=Math.max(0,p.invulnerable-dt);updatePosture();p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);portalCooldown=Math.max(0,portalCooldown-dt);const L=levels[index];
if(p.riding!==null){const tile=tiles[p.riding];if(tile.active&&p.ground&&!(tile.escapeFloor&&tile.shifted)){p.x+=tile.dx;p.y+=tile.dy;}else{p.riding=null;p.ground=false;p.jumps=Math.max(1,p.jumps);}}
const oldX=p.x,oldY=p.y;const belt=p.riding!==null&&tiles[p.riding].kind==='belt'?tiles[p.riding].amount:0;const wind=!p.ground?(L.wind||0):0;p.vx=((keys.right?1:0)-(keys.left?1:0))*(p.crouched?(characterAbility()==='cat'?170:125):characterAbility()==='cat'?295:235)+belt+wind;p.x=Math.max(0,Math.min(L.worldWidth-p.w,p.x+p.vx*dt));
for(const [x,y] of activeSpikes()){const bounds=spikeBounds(x,y,p.y,p.y+p.h);if(!bounds)continue;const [left,right]=bounds;if(p.vx>0&&oldX+p.w<=left+.001&&p.x+p.w>left){p.x=left-p.w;p.vx=0;}else if(p.vx<0&&oldX>=right-.001&&p.x<right){p.x=right;p.vx=0;}}
for(const [x,y,w,h]of L.beams||[]){if(p.y+p.h>y&&p.y<y+h){if(oldX+p.w<=x&&p.x+p.w>x){p.x=x-p.w;p.vx=0;}else if(oldX>=x+w&&p.x<x+w){p.x=x+w;p.vx=0;}}}
const bottom=p.y+p.h;p.vy+=1150*dt;p.y+=p.vy*dt;const nextBottom=p.y+p.h,was=p.ground;p.ground=false;p.riding=null;
// Pick the first crossed surface, independent of route/platform declaration order.
let landing=-1,top=Infinity;for(let i=0;i<tiles.length;i++){const q=tiles[i];if(q.active&&p.vy>=0&&bottom<=q.y+1&&p.y+p.h>=q.y&&p.x+p.w>q.x+2&&p.x<q.x+q.w-2&&q.y<top){landing=i;top=q.y;}}
if(landing>=0){const q=tiles[landing];p.y=q.y-p.h;p.vy=0;p.ground=true;p.jumps=0;p.riding=landing;if(q.kind==='crumble'&&q.trigger<0)q.trigger=0;}
for(const [x,y,w,h]of L.beams||[]){if(p.x+p.w>x&&p.x<x+w){if(p.vy<0&&oldY>=y+h&&p.y<y+h){p.y=y+h;p.vy=0;}else if(p.vy>=0&&bottom<=y&&p.y+p.h>=y){p.y=y-p.h;p.vy=0;p.ground=true;p.jumps=0;}}}
if(!p.ground){if(was)p.coyote=assisted()?.17:.09;p.coyote-=dt;if(p.coyote<=0&&p.jumps===0)p.jumps=1;}
for(const [x,y]of activeSpikes()){const tipX=x+14,tipY=y-25;if(nextBottom>bottom&&bottom<=tipY&&p.y+p.h>=tipY&&p.x<tipX&&p.x+p.w>tipX){fail('spike');return;}if(oldY>=y&&p.y<y&&p.x+p.w>x&&p.x<x+28){p.y=y;p.vy=0;continue;}const bounds=spikeBounds(x,y,p.y,p.y+p.h);if(bounds&&p.x+p.w>bounds[0]&&p.x<bounds[1]){p.x=p.x+p.w/2<tipX?bounds[0]-p.w:bounds[1];p.vx=0;}}
// Spring pads may sit on a larger normal platform; detect them separately.
if(p.ground){for(const q of tiles)if(q.kind==='spring'&&Math.abs(p.y+p.h-q.y)<1&&p.x+p.w>q.x+3&&p.x<q.x+q.w-3){p.vy=-690;p.jumps=0;p.ground=false;p.riding=null;burst(p.x+14,q.y,'#f0a0c6');tone(540,.18);fartBurst('spring');break;}}
for(const h of hammerPositions())if(circleHitsPlayer(h.x,h.y,18)){fail('hammer');return;}
if(p.y>560){fail();return;}
for(const [x,y,tx,ty] of L.portals||[])if(portalCooldown===0&&Math.abs(p.x+14-x)<23&&Math.abs(p.y+p.h-y)<45){p.x=tx-14;p.y=ty-p.h;p.vx=p.vy=0;p.jumps=0;p.ground=false;p.riding=null;portalCooldown=1.2;burst(tx,ty-25,'#b8a0e7');say('传送成功！也可以重玩试试另一条路线。');tone(780,.16);updateCamera(0,true);break;}
for(const [i,[cx,cy]]of L.checkpoints.entries())if(!visitedCheckpoints.has(i)&&p.ground&&Math.abs(p.x+14-cx)<35&&Math.abs(p.y+p.h-cy)<2){visitedCheckpoints.add(i);saveCheckpoint(cx,cy);say('休息点已保存！星星和战斗进度会保留。');tone(650,.15);}
if(L.key&&!collectedKey&&Math.hypot(p.x+14-L.key[0],p.y+p.h/2-L.key[1])<28){collectedKey=true;say('钥匙拿到了！继续收星，前往终点。');$('route').textContent=L.route+' ✓';tone(820,.2);}
updateBoss(worldTick||teamFirst.life!=='active'||teamFirst.x<levels[index].bossX-590?dt:0,bottom);if(state!=='playing'||p.life!=='active')return;
for(const s of stars)if(!s.got&&Math.hypot(p.x+14-s.x,p.y+p.h/2-s.y)<30){s.got=true;burst(s.x,s.y,'#e3b64f');tone(720,.14);}
fireballContact();if(state!=='playing'||p.life!=='active')return;fallingTrapContact();if(state!=='playing'||p.life!=='active')return;monsterContact();if(state!=='playing'||p.life!=='active')return;
updateDoors();if(state!=='playing')return;
if(p.ground&&p.jumpBuffer>0)jump();
if((keys.left||keys.right)&&Math.hypot(p.x-oldX,p.y-oldY)<.3)coach.idle+=dt;else coach.idle=Math.max(0,coach.idle-dt*2);if(smartEnabled&&coach.idle>3&&t>=coach.markUntil){requestHint();coach.idle=0;}
const walked=Math.abs(p.x-oldX);if(p.vx) p.facing=Math.sign(p.vx);if(p.ground&&(keys.left||keys.right)&&walked>.1&&walked<15){p.gait+=walked*.24;p.puffDistance+=walked;if(p.puffDistance>30){p.puffDistance%=30;fartBurst('walk');}}
if(p.ground&&p.riding!==null){const tile=tiles[p.riding];if(tile.kind==='normal'&&p.x>=tile.x+2&&p.x+p.w<=tile.x+tile.w-2&&!L.spikes.some(([x,y])=>Math.abs(y-(p.y+p.h))<5&&Math.abs(x+14-p.x-14)<55)&&(!boss||Math.abs(p.x-boss.x)>100))p.lastSafe=[p.x,p.y+p.h];}
}
function advanceEffects(dt){gagClouds.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy-=a.kind==='cloud'?12*dt:0;a.life-=dt;});gagClouds=gagClouds.filter(a=>a.life>0);
particles.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt});particles=particles.filter(a=>a.life>0);}
function round(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function cloud(x,y,s=1){ctx.fillStyle='#b6ddff18';ctx.beginPath();ctx.ellipse(x,y,48*s,12*s,0,0,Math.PI*2);ctx.ellipse(x-17*s,y-10*s,20*s,18*s,0,0,Math.PI*2);ctx.ellipse(x+8*s,y-13*s,25*s,22*s,0,0,Math.PI*2);ctx.fill();}
function star(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.46:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fill();}
function drawDoor(x,y){ctx.save();
ctx.strokeStyle='#f9d47d75';ctx.lineWidth=2;ctx.setLineDash([8,9]);ctx.beginPath();ctx.ellipse(x,y-32,30,42,Math.sin(t)*.08,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.shadowColor='#f5d37d';ctx.shadowBlur=22;round(x-22,y-66,44,66,[22,22,0,0],'#f9e5a2');ctx.shadowBlur=0;round(x-15,y-58,30,58,[15,15,0,0],'#ffffe4');star(x,y-34+Math.sin(t*3)*3,10,'#d7ae55');if((starCount()<levels[index].requiredStars||monster.hp||(boss&&boss.hp>0)||(levels[index].key&&!collectedKey))){round(x-12,y-44,24,22,5,'#7d7891');ctx.fillStyle='white';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(starCount()<levels[index].requiredStars?String(levels[index].requiredStars-starCount())+'★':'×',x,y-28);}ctx.restore();}
const mapThemes=[
 {name:'星空群岛',hue:225,kind:'stars'},
 {name:'翡翠森林',hue:155,kind:'forest'},
 {name:'落日沙漠',hue:25,kind:'desert'},
 {name:'冰雪山谷',hue:200,kind:'snow'},
 {name:'樱花秘境',hue:310,kind:'petals'},
 {name:'熔岩峡谷',hue:5,kind:'lava'}
];
let mapChoice='auto';
try{const savedTheme=localStorage.getItem('star-hop-theme');if(savedTheme==='auto'||mapThemes.some((_,i)=>String(i)===savedTheme))mapChoice=savedTheme;}catch{}
function currentMapTheme(){
 const theme=mapThemes[mapChoice==='auto'?index%mapThemes.length:Number(mapChoice)];
 return {...theme,hue:theme.hue+(index*7%23),variant:index};
}
function drawMapBackground(){
 const theme=currentMapTheme(),h=theme.hue;
 const sky=ctx.createLinearGradient(0,0,0,510);
 sky.addColorStop(0,'hsl('+h+' 43% 15%)');sky.addColorStop(1,'hsl('+h+' 42% 39%)');
 ctx.fillStyle=sky;ctx.fillRect(0,0,900,510);
 ctx.fillStyle=theme.kind==='lava'?'#ffb05e':'#ffe8bf';
 ctx.beginPath();ctx.arc(130+(index*137)%640,65+(index*19)%65,25+index%20,0,Math.PI*2);ctx.fill();
 for(let layer=0;layer<3;layer++){
  ctx.fillStyle='hsla('+((h+layer*9)%360)+' 35% '+(28-layer*6)+'% / .8)';
  ctx.beginPath();ctx.moveTo(0,510);
  for(let x=0;x<=930;x+=15){
   const y=310+layer*50+Math.sin((x+camera.x*(.08+layer*.04)+index*91)*(.006+layer*.002))*42+Math.cos(x*.019+index)*14;
   ctx.lineTo(x,y);
  }
  ctx.lineTo(930,510);ctx.fill();
 }
 for(let i=0;i<20;i++){
  const x=((i*157+index*53-camera.x*.18)%980+980)%980-40;
  const y=260+(i*61+index*17)%180;
  if(theme.kind==='forest'){
   ctx.fillStyle='#153f38';ctx.fillRect(x-4,y,8,90);
   ctx.beginPath();ctx.moveTo(x,y-70);ctx.lineTo(x-30,y+20);ctx.lineTo(x+30,y+20);ctx.fill();
  }else if(theme.kind==='snow'){
   star(x,30+(i*41)%410,3,'#e8faff99');
  }else if(theme.kind==='petals'){
   ctx.fillStyle='#ffc4dd99';ctx.beginPath();ctx.ellipse(x,y+Math.sin(t+i)*12,5,2,.6,0,Math.PI*2);ctx.fill();
  }else if(theme.kind==='lava'){
   star(x,y+Math.sin(t*2+i)*18,3,'#ffab5777');
  }else if(theme.kind==='desert'){
   ctx.strokeStyle='#cfad6677';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y+40);ctx.lineTo(x,y);ctx.moveTo(x,y+20);ctx.lineTo(x+12,y+20);ctx.lineTo(x+12,y+5);ctx.stroke();
  }else star(x,20+(i*47)%260,2,'#d9eaff99');
 }
}
function drawScene(now){now=t;const L=levels[index];drawMapBackground();
ctx.save();ctx.scale(camera.zoom||1,camera.zoom||1);ctx.translate(-camera.x,-camera.y);
for(const q of tiles){if(q.kind==='crumble'&&!q.active)continue;const {x,y,w,kind}=q;ctx.save();if(!q.active)ctx.globalAlpha=.15;const color=q.sudden?'#6d946b':{normal:'#6d946b',move:'#6b9fc4',lift:'#598fbc',phase:'#9e9bd2',spring:'#d987b3',crumble:'#6d946b',belt:'#4faaa3'}[kind];round(x+4,y+8,w,25,10,'#7591741b');round(x,y,w,22,8,color);round(x+4,y+4,w-8,4,2,'#ffffff99');if(q.active){ctx.shadowColor=color;ctx.shadowBlur=12;round(x+8,y+20,w-16,2,1,color);ctx.shadowBlur=0;}round(x+9,y+11,4,4,1,'#ffffff65');round(x+w-13,y+11,4,4,1,'#ffffff65');ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';if(!q.sudden&&kind!=='normal'&&kind!=='crumble')ctx.fillText({move:'↔',lift:'↕',phase:q.active?'◷':'·',spring:'↑↑',crumble:q.trigger>=0&&q.active?Math.max(0,crumbleWindow()-q.trigger).toFixed(1):'···',belt:q.amount>0?'› › ›':'‹ ‹ ‹'}[kind],x+w/2,y+18);if(kind==='crumble'&&q.trigger>=0&&q.active){round(x,y-5,w*Math.max(0,1-q.trigger/crumbleWindow()),3,1,'#df8c53');}ctx.restore();}
for(const [x,y,w,h]of L.beams||[]){round(x,y,w,h,8,'#829889');round(x,y+h-8,w,8,3,'#c7d6b9');ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText('↓ 蹲下通过',x+15,y+h-20);}
// Gates, checkpoint flags and swinging hazards are drawn in world coordinates.
for(const [pair,[x,y,tx,ty]]of (L.portals||[]).entries()){const suffix=L.portals.length>1?String(pair+1):'';for(const [px,py,label]of [[x,y,'A'+suffix+' →'],[tx,ty,'B'+suffix]]){ctx.save();ctx.strokeStyle='#a28acf';ctx.lineWidth=4;ctx.setLineDash([6,3]);ctx.beginPath();ctx.ellipse(px,py-28,20,29,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#a28acf';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(label,px,py-66);ctx.restore();}}
for(const [i,[cx,cy]]of L.checkpoints.entries()){ctx.strokeStyle='#6b8971';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-50);ctx.stroke();ctx.fillStyle=visitedCheckpoints.has(i)?'#4aaf7b':'#a5bbae';ctx.beginPath();ctx.moveTo(cx,cy-50);ctx.lineTo(cx+27,cy-40);ctx.lineTo(cx,cy-30);ctx.fill();}
for(const h of hammerPositions()){ctx.strokeStyle='#8d7d98';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(h.anchorX,h.anchorY);ctx.lineTo(h.x,h.y);ctx.stroke();ctx.fillStyle='#cf7b8e';ctx.beginPath();ctx.arc(h.x,h.y,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff88';ctx.beginPath();ctx.arc(h.x-5,h.y-5,5,0,Math.PI*2);ctx.fill();}
if(L.wind){ctx.fillStyle='#688c8a';ctx.font='12px sans-serif';ctx.fillText(L.wind>0?'风向 →':'风向 ←',35,55);}
for(const[x,y]of activeSpikes()){ctx.fillStyle='#bf7872';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+14,y-25);ctx.lineTo(x+28,y);ctx.closePath();ctx.fill();ctx.fillStyle='#ead2bd';ctx.beginPath();ctx.moveTo(x+14,y-25);ctx.lineTo(x+8,y-14);ctx.lineTo(x+19,y-14);ctx.fill()}
if(L.key&&!collectedKey){ctx.strokeStyle='#ce9c37';ctx.lineWidth=4;const[kx,ky]=L.key;ctx.beginPath();ctx.arc(kx,ky,7,0,Math.PI*2);ctx.moveTo(kx+7,ky);ctx.lineTo(kx+24,ky);ctx.lineTo(kx+24,ky+6);ctx.moveTo(kx+18,ky);ctx.lineTo(kx+18,ky+5);ctx.stroke();}
if(boss&&boss.hp>0){ctx.save();if(boss.cooldown>0)ctx.globalAlpha=.55+.45*Math.sin(t*25)**2;round(boss.x-38,boss.y,76,70,22,'#9271b5');round(boss.x-30,boss.y-7,60,14,6,'#f5cf72');ctx.fillStyle='#ffe7a2';ctx.beginPath();ctx.moveTo(boss.x-29,boss.y-4);ctx.lineTo(boss.x-36,boss.y-26);ctx.lineTo(boss.x-8,boss.y-7);ctx.lineTo(boss.x,boss.y-28);ctx.lineTo(boss.x+8,boss.y-7);ctx.lineTo(boss.x+36,boss.y-26);ctx.lineTo(boss.x+29,boss.y-4);ctx.fill();round(boss.x-47,boss.y+10,17,26,6,'#5f4c86');round(boss.x+30,boss.y+10,17,26,6,'#5f4c86');round(boss.x-23,boss.y+20,12,13,4,'#fff5eb');round(boss.x+11,boss.y+20,12,13,4,'#fff5eb');round(boss.x-19,boss.y+25,5,8,2,'#453657');round(boss.x+14,boss.y+25,5,8,2,'#453657');round(boss.x-14,boss.y+48,28,5,2,'#624678');ctx.restore();if(boss.plan){ctx.fillStyle='#ca6477';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText(boss.plan.message,boss.x,boss.y-25);ctx.textAlign='start';if(boss.plan.type==='aim'){ctx.strokeStyle='#d37a8c';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(boss.x,395);ctx.lineTo(boss.plan.x,boss.plan.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(boss.plan.x,boss.plan.y,17,0,Math.PI*2);ctx.stroke();}}for(const q of boss.shots){ctx.fillStyle='#db768b';ctx.beginPath();ctx.arc(q.x,q.y,10,0,Math.PI*2);ctx.fill();}}
for(const [i,d]of doors.entries()){
 if(d.revealed){drawDoor(d.x,d.y);ctx.fillStyle='#ffe3a2';ctx.textAlign='center';ctx.font='bold 15px sans-serif';ctx.fillText('终点',d.x,d.y-78);ctx.textAlign='start';}
 else if(Math.hypot(p.x+14-d.x,p.y+p.h-d.y)<230){ctx.save();ctx.globalAlpha=.45+.2*Math.sin(t*4);ctx.shadowColor='#8be7ff';ctx.shadowBlur=18;star(d.x,d.y-25,7,'#a5edff');ctx.font='12px sans-serif';ctx.fillStyle='#b8ecff';ctx.textAlign='center';ctx.fillText('✧ 微光',d.x,d.y-50);ctx.restore();}
}
for(const s of stars)if(!s.got){ctx.save();ctx.shadowColor='#e7c66a';ctx.shadowBlur=12;star(s.x,s.y+Math.sin(now*3+s.x)*4,12,'#e0ad3d');ctx.restore();star(s.x-2,s.y-2+Math.sin(now*3+s.x)*4,4,'#fff1b3')}
if(t<coach.markUntil&&coach.target){ctx.save();ctx.strokeStyle='#e1b44b';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(coach.target.x,coach.target.y,20+Math.sin(t*4)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}
drawFireballsAndShelters();drawFallingTraps();drawWeaponPickups();drawPeppers();drawEggs();drawShots();drawMonster();drawFarts();drawFollowers();drawPlayer();if(duo)withSecond(drawPlayer);
for(const a of particles){ctx.globalAlpha=Math.max(0,a.life/.6);round(a.x,a.y,4,4,2,a.color)}ctx.globalAlpha=1;ctx.fillStyle='#c3e5e2aa';ctx.font='10px sans-serif';ctx.fillText('START',35,levels[index].platforms[0][1]+34);ctx.restore();}
// Cartoon costume and gas clouds are visual only; physics keeps its existing body.
function fartBurst(mode){if((mode==='jump'||mode==='double')&&characterAbility()==='poop')p.size=Math.max(.55,p.size-.025);const big=mode!=='walk',n=big?12:3,dir=p.facing||1,x=p.x+p.w/2-(big?0:dir*18),y=p.y+p.h-5;
const colors=mode==='double'?['#c4ff7c','#f8a3dc','#b3ddff','#ffe58c']:['#c4ef8c','#a0e0b1','#e1f6a9'];
for(let i=0;i<n;i++){const life=(big?.8:.55)+Math.random()*.3;gagClouds.push({kind:'cloud',x:x+(Math.random()-.5)*10,y,vx:big?(Math.random()-.5)*140:-dir*(25+Math.random()*35),vy:big?35+Math.random()*65:-10-Math.random()*15,life,maxLife:life,size:big?8+Math.random()*9:5+Math.random()*5,color:colors[i%colors.length],face:big&&i%5===0});}
if(big){for(let i=0;i<5;i++)gagClouds.push({kind:'glyph',x,y,vx:(i-2)*38,vy:30+Math.random()*65,life:.8,maxLife:.8,size:13,color:colors[i%colors.length],text:['✦','?','6','✧','!'][i]});gagClouds.push({kind:'glyph',x:x+22,y:y+12,vx:12,vy:25,life:.65,maxLife:.65,size:17,color:'#e5ffac',text:mode==='double'?'噗噗!!':mode==='spring'?'芜湖～':'噗！'});}
// Bound the cost even when repeatedly jumping on springs.
if(gagClouds.length>140)gagClouds.splice(0,gagClouds.length-140);
}
function drawFarts(){for(const a of gagClouds){ctx.save();const age=1-a.life/a.maxLife;ctx.globalAlpha=Math.min(1,a.life/a.maxLife*1.4)*.65;ctx.translate(a.x,a.y);ctx.fillStyle=a.color;
if(a.kind==='cloud'){const r=a.size*(.6+age*.75);ctx.beginPath();ctx.ellipse(0,0,r,r*.65,0,0,Math.PI*2);ctx.ellipse(-r*.6,-r*.25,r*.6,r*.55,0,0,Math.PI*2);ctx.ellipse(r*.55,-r*.2,r*.65,r*.6,0,0,Math.PI*2);ctx.fill();if(a.face){ctx.fillStyle='#437354';ctx.fillRect(-4,-3,2,3);ctx.fillRect(3,-3,2,3);ctx.beginPath();ctx.arc(0,2,2,0,Math.PI*2);ctx.fill();}}
else{ctx.rotate(Math.sin(age*6)*.15);ctx.font='bold '+a.size+'px sans-serif';ctx.textAlign='center';ctx.fillText(a.text,0,0);}ctx.restore();}}
function drawGhost(){ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2+Math.sin(t*5)*2);ctx.shadowColor=activePlayer===1?'#c7ffbf':'#b8e7ff';ctx.shadowBlur=14;ctx.globalAlpha=.8;ctx.fillStyle=activePlayer===1?'#d7ffe7':'#dbeeff';ctx.beginPath();ctx.moveTo(-15,13);ctx.lineTo(-15,-2);ctx.bezierCurveTo(-15,-23,15,-23,15,-2);ctx.lineTo(15,13);for(let i=3;i>=-3;i--)ctx.lineTo(i*5,13+(i%2?4:0));ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#466b77';ctx.beginPath();ctx.ellipse(-5,-3,2.5,4,0,0,Math.PI*2);ctx.ellipse(5,-3,2.5,4,0,0,Math.PI*2);ctx.ellipse(0,7,3,4,0,0,Math.PI*2);ctx.fill();round(-11,-22,22,9,[7,7,0,0],activePlayer===1?'#3bb768':'#438bdd');round(-14,-15,28,3,2,activePlayer===1?'#187d44':'#235b9c');ctx.globalAlpha=.35;ctx.fillStyle='#d7ffdf';ctx.beginPath();ctx.ellipse(-p.facing*22,9,5,3,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawPlayer(){if(t<(p.healUntil||0)){
 ctx.save();ctx.strokeStyle='#9affac';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x+p.w/2,p.y+p.h/2,32+(p.healUntil-t)*8,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#baffbc';ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillText('回血！恢复大小 ↑',p.x+p.w/2,p.y-35);ctx.restore();
}if(p.life==='out')return;if(p.life==='down'){ctx.save();const x=p.x+p.w/2,y=p.y-24;round(x-26,y-18,52,18,5,'#71444d');ctx.fillStyle='#fff0c5';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('救我 '+Math.max(0,Math.ceil(p.downUntil-t))+'s',x,y-5);round(x-24,y+1,48,4,2,'#334d42');round(x-24,y+1,48*Math.min(1,p.rescueProgress/1.2),4,2,'#acffa4');ctx.restore();}if(duo){ctx.save();ctx.fillStyle=activePlayer===1?'#c6ff9c':'#9ce4ff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(activePlayer+'P',p.x+p.w/2,p.y-(p.life==='down'?54:29));ctx.restore();}if(p.life==='down'){drawGhost();return;}ctx.save();if(p.invulnerable>0)ctx.globalAlpha=.55+.45*Math.sin(t*20)**2;const low=p.crouched,bob=p.ground?Math.sin(p.gait)*1.4:0;
ctx.translate(p.x+p.w/2,p.y+p.h/2+bob);ctx.rotate(p.ground?Math.sin(p.gait)*.06:p.vx*.00017);ctx.translate(0,p.h*(1-p.size)/2);ctx.scale((low?1.1:1)*p.size,(low?.5:1)*p.size);
paintCharacter(ctx,outfits[activePlayer-1].character,{time:t,gait:p.gait,facing:p.facing,player:activePlayer});ctx.restore();
if(p.armed)drawWand(p.x+p.w/2+p.facing*19,p.y+p.h/2+bob-3,p.facing*.48,.65);}
function draw(now){drawScene(now);if(duo){ctx.save();ctx.font='bold 14px sans-serif';ctx.textAlign='left';ctx.fillStyle='#baffb0';ctx.fillText('1P '+outfitName(0)+' · A/D/W/S',15,25);ctx.fillStyle='#b2e9ff';ctx.fillText('2P '+outfitName(1)+' · 方向键',280,25);ctx.restore();}}
function loop(ms){let dt=Math.min((ms-last)/1000,.05);last=ms;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120;}updateCamera(dt);draw(ms/1000);requestAnimationFrame(loop)}
function handleGameKey(e,pressed){const controls=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyR','KeyP','Escape','KeyJ','Enter'];if(!controls.includes(e.code))return;if(['BUTTON','SUMMARY','SELECT','INPUT'].includes(e.target.tagName))return;e.preventDefault();const second=duo&&e.code.startsWith('Arrow'),k=second?keys2:keys;const left=duo?(second?'ArrowLeft':'KeyA'):null;if(['KeyW','ArrowUp','Space'].includes(e.code))setFlightInput(e.code,pressed,second);
if(e.code===(left||'ArrowLeft')||(!duo&&e.code==='KeyA'))k.left=pressed;
if(e.code===(duo?(second?'ArrowRight':'KeyD'):'ArrowRight')||(!duo&&e.code==='KeyD'))k.right=pressed;
if(e.code==='ArrowDown'||e.code==='KeyS'){if(second)k.crouch=pressed;else setCrouchInput(e.code,pressed);}
if(pressed&&!e.repeat){if(e.code==='KeyJ')attackMonster();if(e.code==='Enter'){if(duo)withSecond(attackMonster);else attackMonster();}if(['Space','ArrowUp','KeyW'].includes(e.code)){if(second)withSecond(jump);else jump();}if(e.code==='KeyR')load(index,true);if(e.code==='KeyP'||e.code==='Escape')pause();}}
document.addEventListener('keydown',e=>handleGameKey(e,true));document.addEventListener('keyup',e=>handleGameKey(e,false));
window.addEventListener('blur',()=>{resetControls();if(state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){resetControls();if(state==='playing')pause()}});
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(b.dataset.key==='jump'){setFlightInput('touch-'+e.pointerId,true);jump();}else if(b.dataset.key==='crouch')setCrouchInput('pointer-'+e.pointerId,true);else keys[b.dataset.key]=true;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{if(b.dataset.key==='crouch')setCrouchInput('pointer-'+e.pointerId,false);else if(b.dataset.key==='jump')setFlightInput('touch-'+e.pointerId,false);else keys[b.dataset.key]=false})});document.querySelectorAll('[data-duo-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!duo)return;const k=b.dataset.duoKey;if(k==='jump'){setFlightInput('touch-'+e.pointerId,true,true);withSecond(jump);}else keys2[k]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{if(b.dataset.duoKey==='jump')setFlightInput('touch-'+e.pointerId,false,true);else keys2[b.dataset.duoKey]=false;});});$('fire-one').onclick=()=>{attackMonster();c.focus({preventScroll:true})};$('fire-two').onclick=()=>{if(duo)withSecond(attackMonster);c.focus({preventScroll:true})};$('solo-mode').onclick=()=>chooseMode(false);$('duo-mode').onclick=()=>chooseMode(true);$('smart-toggle').onclick=toggleSmart;$('hint-button').onclick=()=>{requestHint();hud();c.focus({preventScroll:true})};$('pause').onclick=pause;$('restart').onclick=()=>load(index,true);$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'♪ ×':'♪';$('sound').setAttribute('aria-label',muted?'开启音效':'关闭音效');tone(600)};$('action').onclick=()=>{load(index,true);$('action').blur()};$('fireball-choice').value=fireballChoice;
$('fireball-choice').onchange=e=>{fireballChoice=e.target.value;fireballs=[];nextFireball=t+2;try{localStorage.setItem('star-hop-fireballs',fireballChoice)}catch{}map();say(hasFireballs()?'本关已开启小火球':'本关已关闭小火球');};
$('map-theme').value=mapChoice;$('map-theme').onchange=e=>{mapChoice=e.target.value;try{localStorage.setItem('star-hop-theme',mapChoice)}catch{}say('地图背景已切换为 '+(mapChoice==='auto'?'每关不同':currentMapTheme().name));};
initWardrobe();load(0,true);$('wardrobe').open=true;requestAnimationFrame(loop);

// Course recipes are deterministic; each later expedition combines a different
// opening, terrain profile, mechanic order, door trail and optional star route.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const originals=JSON.parse(fs.readFileSync(path.join(root,'source/original-courses.json')));
const profiles=[
 [400,345,295,345,390,345,390], [300,365,430,375,310,365,410],
 [420,410,345,285,345,405,440], [280,335,395,435,375,320,365],
 [440,375,425,360,410,345,400], [350,290,350,410,350,290,350],
 [420,355,290,235,300,365,420], [230,285,350,415,365,305,360],
 [390,390,390,390,390,390,390], [450,400,350,300,350,400,450]
];
const themes={
 ferry:['摆渡海湾','move'], lift:['升降山城','lift'], candy:['碎糖长桥','crumble'],
 rhythm:['节拍云海','phase'], belt:['逆行工厂','belt'], bounce:['弹射群岛','spring'],
 tunnel:['蹲行密道','tunnel'], hammer:['钟摆长廊','hammer'], spike:['尖刺山脊','spike'],
 plain:['高低踏石','normal']
};
const recipes=[
 ['晨雾寻门记',0,'ferry','tunnel','candy','spike'],['月牙双峰',5,'lift','spike','rhythm','belt'],
 ['糖霜远征',4,'candy','bounce','hammer','ferry'],['风车港口',1,'belt','ferry','tunnel','lift'],
 ['隐秘钟楼',6,'hammer','lift','rhythm','spike'],['云底小径',7,'tunnel','candy','ferry','bounce'],
 ['极光渡船',3,'ferry','rhythm','belt','hammer'],['倒计时雪岭',9,'candy','spike','lift','tunnel'],
 ['星光观测站',2,'lift','hammer','bounce','rhythm'],['迷雾邮局',8,'tunnel','belt','candy','ferry'],
 ['彗星弹跳赛',6,'bounce','spike','ferry','hammer'],['碎片群岛',5,'candy','rhythm','tunnel','lift'],
 ['旧城寻钥',1,'belt','lift','hammer','candy'],['紫云时钟',7,'rhythm','ferry','spike','bounce'],
 ['长夜灯塔',0,'lift','tunnel','candy','rhythm'],['空中钟摆阵',4,'hammer','bounce','belt','ferry'],
 ['深谷回声',9,'spike','candy','lift','tunnel'],['银河转运站',3,'ferry','belt','rhythm','hammer'],
 ['秘密温室',8,'tunnel','lift','bounce','spike'],['流星峡谷',2,'bounce','hammer','candy','rhythm'],
 ['机械星环',4,'belt','rhythm','ferry','tunnel'],['遗落天桥',6,'rhythm','spike','lift','candy'],
 ['镜像山谷',1,'spike','ferry','hammer','bounce'],['晚霞糖城',5,'candy','tunnel','belt','rhythm'],
 ['雾海高塔',7,'lift','candy','spike','ferry'],['四季巡游',0,'tunnel','bounce','rhythm','hammer'],
 ['星门迷踪',3,'rhythm','hammer','lift','belt'],['无尽跃迁',9,'bounce','ferry','candy','spike'],
 ['王城外环',2,'hammer','tunnel','belt','lift'],['星河终极魔王',8,'spike','rhythm','hammer','bounce']
];
function section(L,x,entryY,profileId,kind,n,opening=false){
 const ys=profiles[profileId%profiles.length];const step=142+(n%4)*7, width=106-Math.floor(n/20)*8;
 // The first step stays within a single jump of the preceding rest platform.
 const actual=[entryY];for(let k=1;k<=6;k++)actual[k]=Math.max(actual[k-1]-65,Math.min(actual[k-1]+65,ys[k]));
 if(opening)L.platforms.push([0,entryY,160]);
 for(let k=1;k<6;k++){
  const px=x+k*step,py=actual[k];let tile=[px,py,width];
  const mechanic=themes[kind][1];if(k%2===1){
   if(mechanic==='move')tile.push('move',24+n%9,.8+(n%4)*.12);
   if(mechanic==='lift')tile.push('lift',30,.9+(n%3)*.12);
   if(mechanic==='crumble')tile.push('crumble');
   if(mechanic==='phase')tile.push('phase',k*.7,4.3);
   if(mechanic==='belt')tile.push('belt',k===3?100:-95);
  }
  L.platforms.push(tile);
  if(mechanic==='spring'&&k===2)L.platforms.push([px+20,py,42,'spring']);
  if(mechanic==='spike'&&k===2)L.spikes.push([px+width-32,py]);
  if(mechanic==='hammer'&&k===3)L.hammers.push([px+width/2,py-165,95,1.2+(n%4)*.13]);
  if(mechanic==='tunnel'&&k===2){tile[2]=140;L.beams.push([px+30,py-130,65,109]);}
  // Main-route stars are close to the landing surface, with a spare upper route.
  if(k===1||k===3||k===5)L.stars.push([px+width/2,py-32]);
  if(k===2){if(mechanic==='tunnel')L.stars.push([px+72,py-10]);else{L.platforms.push([px+30,py-125,85]);L.stars.push([px+72,py-157]);}}
 }
 const end=x+6*step,y=actual[6];L.platforms.push([end,y,180]);L.checkpoints.push([end+25,y]);
 return [end+90,y];
}
const levels=[];
for(let n=0;n<60;n++){
 let L,gate;
 if(n<30){L=structuredClone(originals[n]);gate=L.goal.slice();}
 else{const r=recipes[n-30];L={name:r[0],sub:themes[r[2]][0]+' · '+themes[r[3]][0],color:originals[n-30].color,platforms:[],stars:[],spikes:[],hammers:[],beams:[],hint:'观察落点，连续跳跃。更远的路段藏着编号门。',route:'',checkpoint:[45,profiles[r[1]][0]]};}
 L.hammers??=[];L.beams??=[];L.checkpoints=[L.checkpoint];L.doors=[];L.crumbleDelay=n<30?.7:.55;
 if(n>=30){const r=recipes[n-30];gate=section(L,0,profiles[r[1]][0],r[1],r[2],n,true);if(n%4===0){L.key=[gate[0]-40,gate[1]-32];}}
 // Preserve the original opening and make all later sections traversable both ways.
 L.doors.push({x:gate[0],y:gate[1],real:n%2===0,hidden:false,clue:'沿着第一段路线向前探索。'});
 L.checkpoints.push([gate[0]-25,gate[1]]);
 const count=n<30?2:3;
 for(let s=0;s<count;s++){
  const kind=n<30?Object.keys(themes)[(n*3+s*4)%10]:recipes[n-30][s+3];
  const start=gate[0]+65;
  // Safe connecting ledge between the previous door and the next stretch.
  L.platforms.push([gate[0]+22,gate[1],65]);
  gate=section(L,start,gate[1],n+s*3,kind,n+s);
  const hidden=n>=3&&(n+s)%3===0;
  let doorY=gate[1],doorX=gate[0];
  if(hidden){L.platforms.push([gate[0]-50,gate[1]-100,100]);doorY-=100;}
  L.doors.push({x:doorX,y:doorY,real:s===0?n%2!==0:n%3===0,hidden,clue:hidden?'休息台上方也许有微光，跳上小平台找找。':'沿'+themes[kind][0]+'前进。'});
 }
 if(n===29||n===59){
  L.boss=true;L.bossHP=n===59?8:5;const arena=gate[0]+180;
  L.platforms.push([gate[0]+22,gate[1],100],[arena-20,Math.min(440,gate[1]+60),135],[arena+110,440,900],[arena+250,350,110],[arena+445,290,100],[arena+650,325,110]);
  for(let k=1;k<=3;k++){const sy=Math.min(440,gate[1]+k*65);L.platforms.push([arena-20+k*80,sy,90]);}
  L.checkpoints.push([arena+150,440]);L.bossX=arena+700;
  L.stars.push([arena+300,315],[arena+495,255],[arena+700,290]);L.goal=[arena+950,440];
  L.hint='先完成编号门的验真，再到竞技场踩中 Boss 金色头顶 '+L.bossHP+' 次。';
 }else{L.boss=false;L.platforms.push([gate[0]+135,gate[1],160]);L.goal=[gate[0]+215,gate[1]];}
 L.hiddenGoal=n%5===3;L.doors.push({x:L.goal[0],y:L.goal[1],real:true,hidden:L.hiddenGoal,exit:true,clue:'最后一段路的安静角落里有微光。'});
 L.worldWidth=L.goal[0]+90;L.requiredStars=n<10?5:n<30?6:n<50?9:10;
 if(n<29){L.hint=L.hint.replaceAll('终点','1 号门');L.route=L.route.replaceAll('终点','1 号门');}
 if(n===21){L.hint='这次需要 6 颗星。探索后面的路段，收够星星再开最后的门。';L.route='收集六颗星 → 依次验门';}
 L.route=(n<30?L.route+' → ':'')+L.doors.length+' 道编号门 · 自动跟随镜头';
 L.sub+=(n===29?' · 中途 Boss':n===59?' · 最终 Boss':'');
 levels.push(L);
}
fs.writeFileSync(path.join(root,'dist/courses.js'),'// Generated by scripts/build-courses.cjs\nconst levels='+JSON.stringify(levels)+';\n');
console.log('Built',levels.length,'courses;',Math.min(...levels.map(l=>l.worldWidth)),'–',Math.max(...levels.map(l=>l.worldWidth)),'world pixels.');

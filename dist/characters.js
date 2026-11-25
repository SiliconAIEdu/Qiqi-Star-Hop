'use strict';
const characterRoster=[
 {id:'poop',name:'翡翠游侠',tag:'强力炮弹伤害翻倍 · 跳跃变小'},
 {id:'pig',name:'赤焰医师',tag:'小大便恢复 2 血 · 获得 2 秒保护'},
 {id:'cat',name:'暗夜刺客',tag:'疾跑与蹲行加速'},
 {id:'rabbit',name:'银翼剑客',tag:'三段跳 · 跳得更高'},
 {id:'fish',name:'苍蓝枪手',tag:'速射炮弹 · 适合连续攻击'},
 {id:'dino',name:'黄金骑士',tag:'护甲挡一次攻击 · 受伤保护更久'}
];
const petRoster=[{id:'slime',name:'芽芽团'},{id:'fish',name:'小鱼骨'},{id:'chick',name:'云朵鸡'},{id:'none',name:'暂不带宠物'}];
// Human avatars share the established movement and collision body.
function paintCharacter(g,id,{time=0,gait=0,facing=1,player=1}={}){
 const styles={
  poop:{coat:'#257c62',trim:'#b8f7c1',hair:'#21382c',skin:'#efc4a1'},
  pig:{coat:'#a33d4f',trim:'#ffd697',hair:'#563c34',skin:'#e9b494'},
  cat:{coat:'#34354f',trim:'#c4b0ff',hair:'#202331',skin:'#d9b397'},
  rabbit:{coat:'#c1cbd9',trim:'#ffffff',hair:'#e9e8ee',skin:'#f3ccb4'},
  fish:{coat:'#285c9c',trim:'#a1eaff',hair:'#213047',skin:'#dca887'},
  dino:{coat:'#a17b35',trim:'#ffe5a1',hair:'#47352d',skin:'#b98465'}
 };
 const c=styles[id]||styles.poop;
 const box=(x,y,w,h,r,color)=>{g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
 const polygon=(points,color)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const stride=Math.sin(gait)*3;
 g.save();g.scale(facing,1);
 // Tailored coats, high boots and flowing scarves distinguish the six adventurers.
 polygon([[-8,-2],[-15,15],[-22,10+Math.sin(time*6)*3],[-15,-4]],c.coat);
 box(-8,8,7,13+stride,2,'#263044');box(2,8,7,13-stride,2,'#263044');
 box(-9,17+stride,9,5,2,'#151e2e');box(2,17-stride,10,5,2,'#151e2e');
 box(-10,-5,20,18,4,c.coat);box(-2,-4,4,13,1,c.trim);
 box(-14,-3,5,14,2,c.coat);box(9,-3,5,14,2,c.coat);
 box(-14,8,5,4,2,c.skin);box(9,8,5,4,2,c.skin);
 box(-10,8,20,3,1,'#263044');box(-2,8,4,3,1,c.trim);
 box(-3,-10,6,6,2,c.skin);box(-9,-25,18,19,6,c.skin);
 polygon([[-10,-16],[-11,-26],[-5,-31],[5,-30],[12,-24],[9,-15],[5,-23],[-2,-19],[-3,-25]],c.hair);
 g.strokeStyle='#3b2e35';g.lineWidth=1.4;g.beginPath();g.moveTo(1,-17);g.lineTo(7,-18);g.stroke();
 box(3,-16,3,2,1,'#243447');box(2,-11,4,1,1,'#a56b60');
 box(-10,-7,19,4,2,c.trim);
 if(id==='poop'){box(-11,-29,22,6,3,c.coat);box(0,-25,15,3,1,c.trim);}
 if(id==='pig'){box(-13,-3,8,7,2,c.trim);box(-10,-2,2,5,0,'#fff');box(-12,0,6,2,0,'#fff');}
 if(id==='cat')polygon([[-10,-7],[-23,-12+Math.sin(time*8)*3],[-20,-5],[-8,-3]],c.trim);
 if(id==='rabbit'){g.strokeStyle=c.trim;g.lineWidth=2;g.beginPath();g.moveTo(-12,15);g.lineTo(-18,-13);g.stroke();}
 if(id==='fish'){box(8,4,12,5,2,'#334b68');box(17,3,7,3,1,c.trim);}
 if(id==='dino'){box(-15,-6,11,8,3,c.trim);box(5,-6,11,8,3,c.trim);box(-17,2,8,13,3,c.coat);}
 box(-9,3,3,3,1,player===2?'#81c4ff':'#a6ffb0');
 g.restore();
}
function paintPet(g,id,time=0){
 const oval=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};g.save();
 if(id==='fish'){g.strokeStyle='#f3e3be';g.lineWidth=2;g.beginPath();g.moveTo(-10,0);g.lineTo(5,0);for(let x=-6;x<=0;x+=4){g.moveTo(x-2,-5);g.lineTo(x,0);g.lineTo(x-2,5);}g.stroke();oval(7,0,5,6,'#fff1cf');oval(8,-1,1.8,2.3,'#385063');}
 else if(id==='chick'){oval(-7,1,6,4,'#e3f2ff');oval(7,1,6,4,'#e3f2ff');oval(0,0,9,7,'#fff0af');oval(-4,-5,4,3,'#fff7ce');oval(-3,-1,1,1.7,'#485169');oval(3,-1,1,1.7,'#485169');oval(0,2,2,1.5,'#e5a459');}
 else if(id==='slime'){oval(0,1,10,7,'#a8ecb6');oval(-3,-1,1.4,2,'#3b6861');oval(3,-1,1.4,2,'#3b6861');oval(0,3,2,1.2,'#ef9daa');g.strokeStyle='#71bc7b';g.lineWidth=2;g.beginPath();g.moveTo(0,-5);g.lineTo(0,-11);g.stroke();oval(-3,-11,4,2,'#9bdb75');oval(3,-13,4,2,'#c3ef8c');}
 g.restore();
}

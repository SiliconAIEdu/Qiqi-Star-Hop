'use strict';
const characterRoster=[
 {id:'poop',name:'绿帽便便',tag:'经典噗噗选手'},
 {id:'pig',name:'噗噗小猪',tag:'鼻孔负责卖萌'},
 {id:'cat',name:'歪嘴猫咪',tag:'猫猫有点离谱'},
 {id:'rabbit',name:'复活兔兔',tag:'缝缝补补又活了'},
 {id:'fish',name:'蹦跶鱼骨',tag:'只剩骨头也要跳'},
 {id:'dino',name:'发芽恐龙',tag:'化石醒来长草了'}
];
const petRoster=[{id:'slime',name:'芽芽团'},{id:'fish',name:'小鱼骨'},{id:'chick',name:'云朵鸡'},{id:'none',name:'暂不带宠物'}];
// Every costume uses the same collision body; these drawings never affect difficulty.
function paintCharacter(g,id,{time=0,gait=0,facing=1,player=1}={}){
 const oval=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
 const box=(x,y,w,h,r,color)=>{g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
 const line=(points,color,width=2)=>{g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
 const tri=(points,color)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const eye=(x,y)=>{oval(x,y,4.4,5.3,'#fffdec');oval(x+facing*.9,y+.5,1.8,2.6,'#293a44');};
 const feet=()=>{box(-15,15+Math.sin(gait)*2,10,4,2,'#f5a7cb');box(5,15-Math.sin(gait)*2,10,4,2,'#9feae5');};
 const sprout=(x,y)=>{line([[x,y+6],[x,y-5]],'#70b877');oval(x-4,y-6,5,2.5,'#b8f77e');oval(x+4,y-9,5,2.5,'#79d67c');};
 g.save();
 if(id==='pig'){
  tri([[-16,-8],[-18,-22],[-4,-14]],'#ed8faa');tri([[16,-8],[18,-22],[4,-14]],'#ed8faa');tri([[-14,-12],[-15,-18],[-8,-14]],'#ffc5d2');tri([[14,-12],[15,-18],[8,-14]],'#ffc5d2');
  oval(0,1,17,18,'#f6afbc');oval(-6,9,8,7,'#ffcbd3');eye(-7,-4);eye(6,-4);oval(0,5,9,6,'#e77c9d');oval(-4,5,1.5,2,'#995069');oval(4,5,1.5,2,'#995069');
  g.strokeStyle='#f6afbc';g.lineWidth=3;g.beginPath();g.arc(-19,7,4,0,Math.PI*1.7);g.stroke();feet();
 }else if(id==='cat'){
  tri([[-16,-5],[-17,-26],[-3,-15]],'#f4c076');tri([[16,-5],[17,-26],[3,-15]],'#f4c076');tri([[-13,-12],[-14,-21],[-7,-15]],'#f2a0ac');tri([[13,-12],[14,-21],[7,-15]],'#f2a0ac');
  g.strokeStyle='#e5a252';g.lineWidth=6;g.beginPath();g.moveTo(-12,12);g.quadraticCurveTo(-28,13,-22,-3);g.stroke();oval(0,2,16,17,'#f4c076');oval(0,9,10,9,'#fff0ce');eye(-6,-4);eye(6,-4);tri([[-3,3],[3,3],[0,6]],'#a75e76');line([[0,6],[3,9],[7,6]],'#654c51',1.5);
  for(const side of [-1,1]){line([[side*10,2],[side*21,0]],'#e4d6c0',1);line([[side*11,5],[side*22,7]],'#e4d6c0',1);}line([[-2,-14],[0,-9],[3,-14]],'#ce8b43');feet();
 }else if(id==='rabbit'){
  oval(-8,-22,5,13,'#9fcab5');oval(9,-20,5,11,'#c4b6e4');oval(-8,-23,2,8,'#df9eaa');oval(9,-21,2,6,'#e5c8ec');oval(0,2,16,17,'#b6d3bf');box(1,-10,12,13,3,'#d2c0e6');eye(-6,-3);line([[4,-6],[10,0]],'#68566f');line([[10,-6],[4,0]],'#68566f');
  line([[-8,8],[8,8]],'#617967',1.4);for(let x=-5;x<=7;x+=4)line([[x,5],[x,11]],'#617967',1);box(-2,8,4,6,1,'#fff6df');sprout(-3,-17);feet();
 }else if(id==='fish'){
  tri([[-10,0],[-26,-12],[-23,13]],'#e9ddc2');line([[-22,0],[7,0]],'#fff1cf',4);
  for(let x=-12;x<=0;x+=6){line([[x,-1],[x-3,-10]],'#e9ddc2',3);line([[x,1],[x-3,10]],'#e9ddc2',3);}oval(11,-2,10,13,'#fff0d6');oval(12,-4,4,5,'#3e5360');oval(14,-5,1.5,2,'#97ecd1');tri([[20,1],[14,5],[22,6]],'#385360');box(4,14,10,4,2,'#f3aac9');box(-12,14+Math.sin(gait)*3,10,4,2,'#9feae5');sprout(9,-14);
 }else if(id==='dino'){
  g.strokeStyle='#c8bda6';g.lineWidth=7;g.beginPath();g.moveTo(-8,9);g.quadraticCurveTo(-23,12,-24,-1);g.stroke();oval(0,5,12,13,'#bcbaa9');box(-1,-15,23,20,6,'#ddd5be');oval(7,-7,4,4.5,'#526c66');oval(8,-8,1.6,1.7,'#b5f497');oval(18,-5,1.4,1.4,'#6d786a');line([[5,1],[20,1]],'#787d6c');for(let x=7;x<20;x+=5)box(x,1,2,4,0,'#fff4dc');for(let y=3;y<14;y+=4)line([[-7,y],[4,y]],'#ece7d2',2);sprout(5,-17);tri([[-10,-4],[-16,-8],[-13,2]],'#8bb796');feet();
 }else{
  const skin=g.createLinearGradient(-15,-16,14,19);skin.addColorStop(0,'#e4ad68');skin.addColorStop(.5,'#a96536');skin.addColorStop(1,'#704023');
  oval(0,10,17,8,skin);oval(-1,0,13,8,skin);oval(1,-9,9,7,skin);g.fillStyle=skin;g.beginPath();g.moveTo(-5,-10);g.bezierCurveTo(-8,-20,8,-16,4,-24);g.bezierCurveTo(16,-17,10,-8,3,-5);g.fill();eye(-6,-2);eye(5,-4);box(-4,5,10,6,3,'#4a2a29');box(0,8,5,5,2,'#f594a7');feet();
 }
 // Player colors remain recognizable even when both choose the same creature.
 const cap=player===2?'#438bdd':'#3bb768',brim=player===2?'#235b9c':'#187d44';
 if(id==='poop'){g.save();g.translate(1,-17);g.rotate(-.16+Math.sin(time*3)*.06);box(-11,-9,23,12,8,cap);box(-14,0,31,4,2,brim);line([[0,-9],[0,-15]],'#a7ee8c');g.save();g.translate(0,-15);g.scale(Math.cos(time*15),1);oval(-6,0,7,2.6,'#bbf37e');oval(6,0,7,2.6,'#bbf37e');g.restore();g.restore();}
 else{box(-11,10,22,4,2,cap);tri([[-9,12],[-15,19],[-6,17]],brim);}
 g.restore();
}
function paintPet(g,id,time=0){
 const oval=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};g.save();
 if(id==='fish'){g.strokeStyle='#f3e3be';g.lineWidth=2;g.beginPath();g.moveTo(-10,0);g.lineTo(5,0);for(let x=-6;x<=0;x+=4){g.moveTo(x-2,-5);g.lineTo(x,0);g.lineTo(x-2,5);}g.stroke();oval(7,0,5,6,'#fff1cf');oval(8,-1,1.8,2.3,'#385063');}
 else if(id==='chick'){oval(-7,1,6,4,'#e3f2ff');oval(7,1,6,4,'#e3f2ff');oval(0,0,9,7,'#fff0af');oval(-4,-5,4,3,'#fff7ce');oval(-3,-1,1,1.7,'#485169');oval(3,-1,1,1.7,'#485169');oval(0,2,2,1.5,'#e5a459');}
 else if(id==='slime'){oval(0,1,10,7,'#a8ecb6');oval(-3,-1,1.4,2,'#3b6861');oval(3,-1,1.4,2,'#3b6861');oval(0,3,2,1.2,'#ef9daa');g.strokeStyle='#71bc7b';g.lineWidth=2;g.beginPath();g.moveTo(0,-5);g.lineTo(0,-11);g.stroke();oval(-3,-11,4,2,'#9bdb75');oval(3,-13,4,2,'#c3ef8c');}
 g.restore();
}

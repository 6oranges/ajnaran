"use strict";
const btnAdd=document.getElementById('btnAdd');
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnAdd.style.display = 'inline-block';
});
btnAdd.querySelector('button').addEventListener('click', () => {
    btnAdd.style.display = null;
    deferredPrompt.prompt();
    deferredPrompt.userChoice
    .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('Added to home screen');
        }
        deferredPrompt = null;
    });
});
function wait(t){
return new Promise((a)=>setTimeout(()=>a()),t*1000);
}
function openFullscreen(elem) {
  let val,o={ navigationUI: "show" };
  if (elem.requestFullscreen) {
    val=elem.requestFullscreen(o);
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    val=elem.mozRequestFullScreen(o);
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    val=elem.webkitRequestFullscreen(o);
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    val=elem.msRequestFullscreen(o);
  }
  else{
    return wait(1);
  }
  if (val){
    return val;
  }
  else{
    return wait(1);
  }
}
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen();
  }
}
let SUPPORTEDEXTENSION='.svg';
// --general--
function tab(name){
    if (!['news','play','creators'].includes(name)){
        name='news'; // Default page
    }
    document.querySelectorAll("main").forEach(element=>{
        element.style.display="";
    })
    document.getElementById(name).style.display="block";
}
tab(location.hash.slice(2));
window.addEventListener('hashchange',(event)=>{
    tab(new URL(event.newURL).hash.slice(2));
})

function furtherThan(posA,posB,dis){
    return (posA[0]-posB[0])*(posA[0]-posB[0])+(posA[1]-posB[1])*(posA[1]-posB[1])>dis*dis;
}
function vectorToPoles(vector,poles){
    const p2=Math.PI*2;
    return Math.round((Math.atan2(vector[1],vector[0])%p2+p2)%p2*poles/p2)%poles
}

var unique = function(array1, array2) {
    var result = [];
    var arr = array1.concat(array2);
    var len = arr.length;
    var assoc = new Set();

    while(len--) {
        var itm = arr[len];

        if(!assoc.has(itm)) { // Eliminate the indexOf
            result.push(itm);
            assoc.add(itm);
        }
    }

    return result;
};
function hex(int){
	let t=int.toString(16);
	if (t.length==1){
    	t="0"+t;
    }
	return t;
}
function readTextFile( file ){
    return fetch(file).then(response=>response.text());
}
// --specific--
class Drawable {
    constructor( sx,sy,sWidth,sHeight,spritesheet ) {
        this.sx=sx;
        this.sy=sy;
        this.sWidth=sWidth;
        this.sHeight=sHeight;
        this.spritesheet=spritesheet;
    }
    blit( context,dx,dy,dWidth,dHeight ){
        if (!dWidth){
            dWidth=this.sWidth;
        }
        if (!dHeight){
            dHeight=this.sHeight;
        }
        context.drawImage(this.spritesheet, this.sx, this.sy, this.sWidth, this.sHeight, dx, dy, dWidth, dHeight);
    }
}
class GamePiece {
    constructor( x, y, width, height, color ) {
        this.x = x;
        this.y = y;
        this.width = width; // width
        this.height = height; // height
        this.vx = 0; // velocityx
        this.vy = 0; // velocityy
        this.grounded = -1; // onground (-1)-unset 0-no 1-yes
        this.color = color; // if filled color of fill
        this.collidesx=[]; // things collided into from x
        this.collidesy=[]; // things collided into from y
        this.collides=[]; // things collided into
        this.xoff=0; // image offset x
        this.yoff=0; // image offset y
        this.dir="u"; // up direction
        this.type=""; // type of GamePiece
        this.orientation="right"; // facing direction
        this.bounce=0;
    }
    setx( x, maxx ){
        this.x=x+this.width/2;
        this.x%=maxx;
        this.x+=maxx;
        this.x%=maxx;
        this.x-=this.width/2;
    }
    sety( y, maxy ){
        this.y=y+this.height/2;
        this.y%=maxy;
        this.y+=maxy;
        this.y%=maxy;
        this.y-=this.height/2;
    }
    physics( collidables, gravityx, gravityy, frictionair, frictionground, maxx, maxy ){
        this.grounded=0;
        this.setx(this.x+this.vx,maxx);
        this.collidesx=colliding_any(this,collidables);
        if (this.collidesx.length>0){
            this.setx(this.x-this.vx,maxx);
            if (Math.sign(gravityx) == Math.sign(this.vx)){
                this.grounded=1;
            }
            this.vx=-this.bounce*this.vx;
        }
        this.sety(this.y+this.vy,maxy);
        this.collidesy=colliding_any(this,collidables);
        if (this.collidesy.length>0){
            this.sety(this.y-this.vy,maxy);
            if (Math.sign(gravityy) == Math.sign(this.vy)){
                this.grounded=1;
            }
            this.vy=-this.bounce*this.vy;
        }
        this.collides=unique(this.collidesx,this.collidesy);
        if (this.grounded==1){
            this.vx*=frictionground;
            this.vy*=frictionground;
        } else {
            this.vx*=frictionair;
            this.vy*=frictionair;
        }
        this.vx+=gravityx;
        this.vy+=gravityy;
    }
    draw( camerax, cameray, ctx, drawable ){
        if (undefined !== drawable){
            drawable.blit(ctx,this.x-camerax+this.xoff, this.y-cameray+this.yoff);
        } else{
            if (undefined !== this.color){
                ctx.fillStyle=this.color;
                ctx.fillRect(this.x-camerax+this.xoff,this.y-cameray+this.yoff,this.width,this.height);
            }
        }
    }
}
class Particle extends GamePiece {
    constructor( x, y, width, height, lifetime, color, fades ) {
    // lifetime in ticks, color in hex no transparency
        super( x, y, width, height );
        this.lifetime=lifetime;
        this.drawticks=0;
        this.fades=fades;
        this.color=color;
        this.bounce=.5;
        this.type="p";
        this.gx=0;
        this.gy=0;
    }
    draw( camerax, cameray, ctx, drawable ){
        if (undefined !== drawable){
            drawable.blit(ctx,this.x-camerax+this.xoff, this.y-cameray+this.yoff);
        } else{
            if (undefined !== this.color){
            	if (this.fades){
                	ctx.fillStyle=this.color+hex(255-Math.floor((this.drawticks/this.lifetime)*255));
                } else{
                	ctx.fillStyle=this.color;
                }
                ctx.fillRect(this.x-camerax+this.xoff,this.y-cameray+this.yoff,this.width,this.height);
            }
        }
        this.drawticks+=1;
        if (this.drawticks>=this.lifetime){
        	return false;
        }
        return true;
    }
}
function colliding( obj1, obj2 ){
    if (obj1.x<obj2.x+obj2.width && obj2.x<obj1.x+obj1.width && obj1.y<obj2.y+obj2.height && obj2.y<obj1.y+obj1.height){
        return true;
    }
    return false;
}
function colliding_any( obj, others ){
    let collides=[];
    for (let i=0;i<others.length;i++){
        if (obj!=obj[i] && colliding(obj,others[i])){
            collides.push(others[i]);
        }
    }
    return collides;
}
function parse_map( text, tilesize ){
    let x=0,y=0;
    let entities={};
    let newobj;
    let sx=-1,sy=-1,mx=-1,my=-1;
    for (let i=0;i<text.length;i++){
      switch (text[i]){
        case " ":
          x+=tilesize;
          break;
        case "\n":
          if (x>mx){
            mx=x;
          }
          x=0;
          y+=tilesize;
          break;
        case "s":
          sx=x;
          sy=y;
          x+=tilesize;
          break;
        default:
          newobj=new GamePiece(x,y,tilesize,tilesize);
          newobj.type=text[i];
          if (!(text[i] in entities)){
            entities[text[i]]=[];
          }
          entities[text[i]].push(newobj);
          x+=tilesize;
          break;
      }
    }
    if (x>mx){
        mx=x;
    }
    my=y+tilesize;
    return [entities,sx,sy,mx,my];
}
function open_map( map, tilesize ){
    return readTextFile(map).then((text)=>{
        let e,sx,sy,mx,my;
        let m=parse_map(text,tilesize);
        e=m[0];
        sx=m[1];
        sy=m[2];
        mx=m[3];
        my=m[4];
        return (e,sx,sy,mx,my);
    });
}
function parse_level_set( levelset, prefix ){
    const levels=levelset.split(/\r?\n/);
    const files = Array(levels.length);
    for (let i=0;i<levels.length;i++){
        files[i]=readTextFile( prefix+levels[i] );
    }
    return Promise.all(files);
}
function open_level_set( levelset, prefix ){
    return readTextFile(levelset).then((text)=>parse_level_set(text,prefix));
}
function loadSource(src){
    return new Promise(resolve=>{
        src.onload=()=>{
            resolve();
        }
    })
}
async function readSpriteSheet(source,imageorder,tilesize,images,xoff){
    if (undefined===xoff){
        xoff=0;
    }
    source=source+SUPPORTEDEXTENSION;
    let imagesource = new Image(); // tile spritesheet
    imagesource.src = source;
    await loadSource(imagesource);
    // resize tile spritesheet
    let canvassource = document.createElement("canvas");
    canvassource.width = tilesize*imageorder.length;
    canvassource.height = tilesize;
    let ctxsource = canvassource.getContext("2d");
    ctxsource.drawImage(imagesource, 0, 0, tilesize*imageorder.length, tilesize);
    let texture = new Image();
    texture.src = canvassource.toDataURL(imageorder);
    await loadSource(texture);
    for (let i=0;i<imageorder.length;i++){
        images[imageorder[i]] = new Drawable( tilesize*i+xoff,0,tilesize,tilesize,texture );
    }
}
function restartAudio(audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}
function getDir(x,y,dirletters){ // return dirletters at direction order up,down,right,left
    if (Math.sign(y)==1){
        return dirletters[0];
    }
    if (Math.sign(y)==-1){
        return dirletters[1];
    }
    if (Math.sign(x)==1){
        return dirletters[2];
    }
    if (Math.sign(x)==-1){
        return dirletters[3];
    }
}

function doNothing(){}
function main () {

    // window
    let canvaswindow = document.getElementById("gamearea").querySelector("canvas");
    let ctx = canvaswindow.getContext("2d");
    let width=720;
    let height=720;
    let proposedwidth=width;
    let proposedheight=height;
    let fullscreen=false;
    canvaswindow.width=width;
    canvaswindow.height=height;

    // multipliers & constants
    let gv=1; // gravity acceleration
    let ms=0.707; // movement speed
    let ams=0.25; // air movement speed
    //let jv=20; // jump velocity
    let jv = 21;
    let tilesize = 60;
    let friction = 0.90;
    let airfriction = 0.95;
    let urlprefix="";

    // --current state--
    let Camerax=0;
    let Cameray=0;
    let framecount=0;
    let mode="playing";

    let maxx,maxy; // size of level
    let blocks,gravities,wins,dies,checkpoints,glasses,tnts,ices; // blocks
    let particles;
    let lastcheckpoint=null; // last checkpoint

    let lastx;
    let lasty;
    let lastgx=0;
    let lastgy=gv;
    let lastd="u";
    let lastglasses;

    let character=new GamePiece(0,0,40,40);
    let startx,starty;
    let startglasses;
    let gravityx = 0;
    let gravityy = gv;

    let level=0;
    let leveltext;
    async function resize(){
    await wait(1);
        if (fullscreen){
            proposedwidth=window.innerWidth;
            proposedheight=window.innerHeight;
        }
        mainloop();
    }
    window.addEventListener("resize", resize);

    // --sounds--
    let audiogravity = new Audio(urlprefix+"audio/Gravity.wav");
    let audiojump = new Audio(urlprefix+"audio/Jump.wav");
    // music
    let backgroundmusic = new Audio(urlprefix+"audio/Fall.mp3");
    backgroundmusic.oncanplaythrough =function (){
        backgroundmusic.addEventListener("ended", function() { // repeat
            this.currentTime = 0;
            this.play();
        }, false);
        var firstinteraction=function (event){ // wait until interaction before playing music
            canvaswindow.removeEventListener("touchend",firstinteraction);
            canvaswindow.removeEventListener("click",firstinteraction);
            backgroundmusic.play();
        }
        canvaswindow.addEventListener("touchend",firstinteraction);
        canvaswindow.addEventListener("click",firstinteraction);
    }

    // images
    let images={};
    Promise.all([
        readSpriteSheet(urlprefix+"images/Tiles"," bgrkqlud",tilesize,images),
        readSpriteSheet(urlprefix+"images/Checkpoint",
        ["ct0","ct1","ct2","ct3",
        "ct4","ct5","ct6","ct7",
        "ct8","ct9","ct10","ct11",
        "ct12","ct13","ct14","ct15"],tilesize,images),
        readSpriteSheet(urlprefix+"images/GravityCharacter",
        ["uright","uleft",
        "lright","lleft",
        "rright","rleft",
        "dleft","dright"],50,images),
        readSpriteSheet(urlprefix+"images/Gravity",
        ["g0","g1"],tilesize,images),
        readSpriteSheet(urlprefix+"images/Ice",
        "i",tilesize,images),
        open_level_set(urlprefix+"levels/tutorial_level_set.txt",urlprefix+"levels/").then(lset=>{
            leveltext=lset;
            read_map( leveltext[level] );
        })
    ]).then(()=>setInterval(mainloop,16.5));
    // levels
    function read_map( text ){
    	particles=[];
        let m=parse_map(text,tilesize);
        let entities=m[0];
        let sx=m[1];
        let sy=m[2];
        let mx=m[3];
        let my=m[4];
        blocks=entities.b||[];
        gravities=entities.g||[];
        glasses=entities.q||[];
        ices=entities.i||[];
        tnts=entities.n||[];
        for (let i=0; i<tnts.length;i++){
            tnts[i].color="#00FF00";
        }
        startglasses=glasses.slice();
        lastglasses=glasses.slice();
        wins=[].concat(entities.u,entities.d,entities.l,entities.r).filter(function (e){return e != null;});
        checkpoints=[].concat(entities.t,entities.v,entities.f,entities.h).filter(function (e){return e != null;});
        if ("k" in entities){
            dies=entities.k;
        }
        else {
            dies=[];
        }
        startx=sx;
        starty=sy;
        lastx=sx;
        lasty=sy;
        gravityx=0;
        gravityy=gv;
        lastgx=0;
        lastgy=gv;
        lastd="u";
        lastcheckpoint=null;
        maxx=mx;
        maxy=my;
        character.x=sx;
        character.y=sy;
        character.dir="u";
        character.yoff=-5;
        character.xoff=-5;
        character.type="character";
        character.vx=0;
        character.vy=0;
    }
    

    // --input--
    const raw_input = {
        'left':new Set(),
        'right':new Set(),
        'jump':new Set(),
        'fullscreen':new Set(),
        'checkpoint':new Set(),
        'reset':new Set(),
        'load':new Set(),
        'gravityup':new Set(),
        'gravitydown':new Set(),
        'gravityleft':new Set(),
        'gravityright':new Set(),
    }
    const lookup={
        ' ':'jump',
        'f':'fullscreen',
        'p':'checkpoint',
        'r':'reset',
        'o':'load',
        'ArrowUp':'gravityup',
        'ArrowDown':'gravitydown',
        'ArrowLeft':'gravityleft',
        'ArrowRight':'gravityright',
        'i':'gravityup',
        'j':'gravityleft',
        'k':'gravitydown',
        'l':'gravityright'
    }
    const lookup2={'u':{'a':'left','d':'right'},'d':{'d':'left','a':'right'},'l':{'s':'left','w':'right'},'r':{'w':'left','s':'right'}};
    const reskeys=['w','a','s','d','ArrowUp','ArrowLeft','ArrowDown','ArrowRight',' ','f'];
    function getInput(){
        const clookup2=lookup2[character.dir];
        for (let key of Object.keys(raw_input)){
            raw_input[key].delete("keyboard");
        }
        for (let key of keys){
            if (key in lookup){
                raw_input[lookup[key]].add("keyboard");
            }
            if (key in clookup2){
                raw_input[clookup2[key]].add("keyboard");
            }
        }
        if (!('oldinput' in getInput)){
            getInput.oldinput={};
        }
        const input = {};
        const newinput={};
        for (let key of Object.keys(raw_input)){
            input[key]=raw_input[key].size>0;
            newinput[key]=input[key]&&!getInput.oldinput[key];
        }
        getInput.oldinput=input;
        return {current:input,new:newinput};
    }
    const keys=new Set();
    document.addEventListener("keydown", (event)=>{
        keys.add(event.key);
        if (event.target==document.body&&reskeys.includes(event.key)){
            event.preventDefault();
        }
    });
    document.addEventListener("keyup", (event)=>{
        keys.delete(event.key);
        if (event.target==document.body&&reskeys.includes(event.key)){
            event.preventDefault();
        }
    });
    // touch
    const touchListener=TouchListener(canvaswindow);
    const TOUCHPADSIZE=100;
    let showPad=false;
    canvaswindow.addEventListener('mousemove',()=>{
        showPad=false;
    })
    touchListener.addEventListener('new',touch=>{
        showPad=true;
    })
    touchListener.addEventListener('update',touch=>{
        for (let key of Object.keys(raw_input)){
            raw_input[key].delete(touch.identifier);
        }
        const inertia=touch.getInertia();
        if (!furtherThan([touch.startX,touch.startY],[TOUCHPADSIZE,height-TOUCHPADSIZE],TOUCHPADSIZE)){
            const clookup2=lookup2[character.dir];
            if (touch.currentX>TOUCHPADSIZE){
                if ('d' in clookup2){
                    raw_input[clookup2['d']].add(touch.identifier);
                }
            }
            else{
                if ('a' in clookup2){
                    raw_input[clookup2['a']].add(touch.identifier);
                }
            }
            if (touch.currentY>height-TOUCHPADSIZE){
                if ('s' in clookup2){
                    raw_input[clookup2['s']].add(touch.identifier);
                }
            }
            else{
                if ('w' in clookup2){
                    raw_input[clookup2['w']].add(touch.identifier);
                }
            }
        }
        else if (furtherThan(inertia,[0,0],100)){
            raw_input[["gravityright","gravitydown","gravityleft","gravityup"][vectorToPoles(inertia,4)]].add(touch.identifier);
        }
        else if (touch.distance<5&&new Date().getTime()-touch.startTime>25){
            raw_input.jump.add(touch.identifier);
        }
    })
    touchListener.addEventListener('end',touch=>{
        const inertia=touch.getInertia();
        for (let key of Object.keys(raw_input)){
            raw_input[key].delete(touch.identifier);
        }
        if (touch.distance<5&&furtherThan([touch.startX,touch.startY],[TOUCHPADSIZE,height-TOUCHPADSIZE],TOUCHPADSIZE)&&!furtherThan(inertia,[0,0],100)){
            raw_input.jump.add(touch.identifier);
            setTimeout(()=>{raw_input.jump.delete(touch.identifier)},100);
        }
    })
    touchListener.addEventListener('taps',touch=>{
        if (touch.taps===3){
            raw_input.fullscreen.add(touch.identifier);
            setTimeout(()=>{raw_input.fullscreen.delete(touch.identifier)},100);
        }
        if (touch.taps===4){
            raw_input.checkpoint.add(touch.identifier);
            setTimeout(()=>{raw_input.checkpoint.delete(touch.identifier)},100);
        }
        if (touch.taps===5){
            raw_input.reset.add(touch.identifier);
            setTimeout(()=>{raw_input.reset.delete(touch.identifier)},100);
        }
    })
    //main loop
    function mainloop(){
        const input=getInput();
        if (width!==proposedwidth||height!==proposedheight){
            width=proposedwidth;
            height=proposedheight;
            canvaswindow.width=width;
            canvaswindow.height=height;
        }
        if (input.new.fullscreen){
            if (fullscreen){
                canvaswindow.style.removeProperty("width");
                canvaswindow.style.removeProperty("height");
                canvaswindow.style.removeProperty("object-fit");
                canvaswindow.style.removeProperty("z-index");
                canvaswindow.style.removeProperty("display");
                let game=document.getElementById("gamearea");
                let cmd=document.getElementById("cmd");
                if (!cmd){
                    cmd=document.getElementById("command-prompt");
                }
                game.appendChild(canvaswindow);
                game.appendChild(cmd);
                document.getElementsByTagName("header")[0].style.display="block";
                document.getElementById("play").style.display="block";
                document.getElementsByTagName("footer")[0].style.display="block";
                closeFullscreen();
                proposedwidth=720;
                proposedheight=720;
            }else{
                canvaswindow.style.width="100%";
                canvaswindow.style.height="100%";
                canvaswindow.style.display="block";
                canvaswindow.style.objectFit="contain";
                canvaswindow.style.zIndex="1";
                document.getElementById("content").appendChild(canvaswindow);
                document.getElementsByTagName("header")[0].style.display="none";
                document.getElementById("play").style.display="none";
                document.getElementsByTagName("footer")[0].style.display="none";
                openFullscreen(document.body).then(()=>{
                    proposedwidth=window.innerWidth;
            	    proposedheight=window.innerHeight;
                });
            }
            fullscreen=!fullscreen;
        }
        if (mode=="playing"){
            // camera follow character
            Camerax=character.x-width/2+character.width/2;
            Cameray=character.y-height/2+character.height/2;

            // camera stay within level
            if (Camerax<0){
                Camerax=0;
            }
            else if (Camerax+width>maxx){
                Camerax=maxx-width;
            }
            if (width>maxx){
                Camerax=maxx/2-width/2;
            }
            if (Cameray<0){
                Cameray=0;
            }
            else if (Cameray+height>maxy){
                Cameray=maxy-height;
            }
            if (height>maxy){
                Cameray=maxy/2-height/2;
            }
            // clear
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle="#000"; //background color of level
            if (fullscreen){
                ctx.fillRect(-Camerax, -Cameray, maxx, maxy); // fill only level in fullscreen
            }
            else{
                ctx.fillRect(0, 0, width, height); // fill entire canvas if not in fullscreen
            }
            if (document.getElementById("level")){
                document.getElementById("level").innerHTML="Level: "+level;
            }
            

            // draw level
            for (let i=0;i<blocks.length;i++){
                blocks[i].draw(Camerax, Cameray, ctx, images.b);
            }
            for (let i=0;i<ices.length;i++){
                ices[i].draw(Camerax, Cameray, ctx, images.i);
            }
            var collidedgravities=colliding_any(character,gravities);
            for (let i=0;i<gravities.length;i++){
                if (collidedgravities.includes(gravities[i])){
                    gravities[i].draw(Camerax, Cameray, ctx, images["g1"]);
                }
                else{
                    gravities[i].draw(Camerax, Cameray, ctx, images["g0"]);
                }
            }
            for (let i=0;i<wins.length;i++){
                wins[i].draw(Camerax, Cameray, ctx, images[wins[i].type]);
            }
            let pi = 0;
            while (pi < particles.length){
            	particles[pi].physics(blocks.concat(glasses).concat(dies).concat(ices), particles[pi].gx, particles[pi].gy, 1, 1,maxx,maxy);
                for (let i=0;i<particles[pi].collidesx.length;i++){
                	if (particles[pi].collidesx[i].type=="k"){
                    	let h = Math.floor(Math.random()*128+128);
                        particles[pi].color = "#"+hex(h)+hex(Math.floor(Math.random()*h))+hex(0);
                    }
                }
                for (let i=0;i<particles[pi].collidesy.length;i++){
                	if (particles[pi].collidesy[i].type=="k"){
                    	let h = Math.floor(Math.random()*128+128);
                        particles[pi].color = "#"+hex(h)+hex(Math.floor(Math.random()*h))+hex(0);
                    }
                }
                if (!particles[pi].draw(Camerax, Cameray, ctx)){
                    if (particles.length==1||pi == particles.length-1){
                        particles.pop();
                    }else{
                        particles[pi]=particles.pop();
                    }
                }
                else{
                    pi+=1;
                }
            }
            for (let i=0;i<checkpoints.length;i++){
                if (checkpoints[i]==lastcheckpoint){
                    checkpoints[i].draw(Camerax, Cameray, ctx, images["c"+checkpoints[i].type+ Math.floor(framecount/8*1.2)%16]);
                }else{
                    checkpoints[i].draw(Camerax, Cameray, ctx, images["c"+checkpoints[i].type+"0"]);
                }
            }
            for (let i=0;i<dies.length;i++){
                dies[i].draw(Camerax, Cameray, ctx, images.k);
            }
			for (let i=0;i<glasses.length;i++){
                glasses[i].draw(Camerax, Cameray, ctx, images.q);
            }
            let dofriction=true;
            for (let i=0;i<character.collides.length;i++){
            	if (character.collides[i].type=="i"){
                	dofriction=false;
                }
            }
            let ti = 0;
            while (ti < tnts.length){
            	tnts[ti].draw(Camerax, Cameray, ctx)
                if (colliding_any(tnts[ti],particles.concat([character])).length>0){
                    for (let j=0;j<10;j++){
                    	let h = Math.floor(Math.random()*128+128);
                        let o = new Particle(
                            Math.floor(tnts[ti].x+(tilesize-10)*Math.random()),
                            Math.floor(tnts[ti].y+(tilesize-10)*Math.random()),
                            10, 10, 
                            Math.floor(40+Math.random()*60),
                            "#"+
                            	hex(h)+
                                hex(Math.floor(Math.random()*h))+
                                hex(0)
                            , true);
                        let d = Math.random()*2*Math.PI;
                        o.vx=Math.cos(d)*2+Math.random();
                        o.vy=Math.sin(d)*2+Math.random();

                        particles.push(o);
                    }
                    if (tnts.length==1||ti == tnts.length-1){
                        tnts.pop();
                    }else{
                        tnts[ti]=tnts.pop();
                    }
                }
                else{
                   ti+=1;
                }
            }
            let ovx=character.vx,ovy=character.vy;
            if (dofriction){
            	character.physics(blocks.concat(glasses).concat(ices), gravityx, gravityy, airfriction, friction,maxx,maxy);
            } else{
            	character.physics(blocks.concat(glasses).concat(ices), gravityx, gravityy, .99, .99,maxx,maxy);
            }
            character.draw(Camerax, Cameray, ctx, images[character.dir+character.orientation]);
            if (Math.abs(ovx)>15){
            	for (let i=0;i<character.collidesx.length;i++){
                	if (character.collidesx[i].type=="q"){
                        for (let j=0;j<10;j++){
                        	let h = hex(Math.floor(Math.random()*256));
                            let o = new Particle(
                            	Math.floor(character.collidesx[i].x+(tilesize-10)*Math.random()),
                            	Math.floor(character.collidesx[i].y+(tilesize-10)*Math.random()),
                                10, 10, 
                                Math.floor(40+Math.random()*60), "#"+h+h+h, true);
                            let d = Math.random()*2*Math.PI;
                            o.vx=Math.cos(d)*2+Math.random();
                            o.vy=Math.sin(d)*2+Math.random();
							o.gx=gravityx/2;
                            o.gy=gravityy/2;
                            particles.push(o);
                        }
                        glasses[glasses.indexOf(character.collidesx[i])]=glasses[glasses.length-1];
                        glasses.pop();
                    }
                }
            }
            if (Math.abs(ovy)>15){
            	for (let i=0;i<character.collidesy.length;i++){
                	if (character.collidesy[i].type=="q"){
                    	for (let j=0;j<10;j++){
                        	let h = hex(Math.floor(Math.random()*256));
                            let o = new Particle(
                            	Math.floor(character.collidesy[i].x+(tilesize-10)*Math.random()),
                            	Math.floor(character.collidesy[i].y+(tilesize-10)*Math.random()),
                                10, 10, 
                                Math.floor(40+Math.random()*60), "#"+h+h+h, true);
                            let d = Math.random()*2*Math.PI;
                            o.vx=Math.cos(d)*2+Math.random();
                            o.vy=Math.sin(d)*2+Math.random();
                            o.gx=gravityx/2;
                            o.gy=gravityy/2;

                            particles.push(o);
                        }
                        glasses[glasses.indexOf(character.collidesy[i])]=glasses[glasses.length-1];
                        glasses.pop();
                    }
                }
            }
            if (character.grounded==1 && input.current.jump){
                character.vx+=gravityx*-jv;
                character.vy+=gravityy*-jv;
                restartAudio(audiojump);
            }
            let dir = Math.atan2(gravityy, gravityx),mscurrent=character.grounded*ms+!character.grounded*ams;
            if (input.current.left){
                character.vx+=Math.cos(dir+Math.PI/2)*mscurrent;
                character.vy+=Math.sin(dir+Math.PI/2)*mscurrent;
                character.orientation="left";
            }
            if (input.current.right){
                character.vx+=Math.cos(dir-Math.PI/2)*mscurrent;
                character.vy+=Math.sin(dir-Math.PI/2)*mscurrent;
                character.orientation="right";
            }
            if (input.new.load){
                read_map( document.getElementById("map").value );
            }
            if (input.new.checkpoint || colliding_any(character,dies).length>0){
                character.vx=0;
                character.vy=0;
                character.x=lastx;
                character.y=lasty;
                character.dir=lastd;
                gravityx=lastgx;
                gravityy=lastgy;
                glasses=lastglasses.slice();
            }
            if (input.new.reset){
                character.vx=0;
                character.vy=0;
                character.x=startx;
                character.y=starty;
                character.dir="u";
                gravityx=0;
                gravityy=gv;
                lastx=startx;
                lasty=starty;
                lastgx=0;
                lastgy=gv;
                lastd="u";
                lastcheckpoint=null;
                glasses=startglasses.slice();
            }
            let collidedcheckpoints=colliding_any(character,checkpoints);
            let type = getDir(gravityx,gravityy,"tvfh")
            for (let i=0;i<collidedcheckpoints.length;i++){
                if (collidedcheckpoints[i]!=lastcheckpoint&&collidedcheckpoints[i].type==type){
                    lastcheckpoint=collidedcheckpoints[i];
                    lastx=lastcheckpoint.x;
                    lasty=lastcheckpoint.y;
                    lastd=character.dir;
                    lastgx=gravityx;
                    lastgy=gravityy;
                    lastglasses=glasses.slice();
                }
            }
            let collidedwins =colliding_any(character,wins);
            type = getDir(gravityx,gravityy,"udlr");
            for (let i=0;i<collidedwins.length;i++){
                if (collidedwins[i].type==type){
                    level+=1;
                    if (level<leveltext.length){
                        read_map( leveltext[level] );
                    } else{
                        console.log("To bad no more levels :(");
                    }
                }
            }
            if (collidedgravities.length>0){
                if (input.current.gravityup) {
                    gravityx=0;
                    gravityy=-gv;
                    character.dir="d";
                    raw_input.left.delete('keyboard');
                    raw_input.right.delete('keyboard');
                    restartAudio(audiogravity);
                }
                else if (input.current.gravitydown) {
                    gravityx=0;
                    gravityy=gv;
                    character.dir="u";
                    raw_input.left.delete('keyboard');
                    raw_input.right.delete('keyboard');
                    restartAudio(audiogravity);
                }
                else if (input.current.gravityleft) {
                    gravityx=-gv;
                    gravityy=0;
                    character.dir="r";
                    raw_input.left.delete('keyboard');
                    raw_input.right.delete('keyboard');
                    restartAudio(audiogravity);
                }
                else if (input.current.gravityright) {
                    gravityx=gv;
                    gravityy=0;
                    character.dir="l";
                    raw_input.left.delete('keyboard');
                    raw_input.right.delete('keyboard');
                    restartAudio(audiogravity);
                }
            }
        }
        else if (mode=="title"){
            // clear
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle="#FA0"; //background color of title=
            if (fullscreen){
                ctx.fillRect(-Camerax, -Cameray, maxx, maxy); // fill only level in fullscreen
            }
            else{
                ctx.fillRect(0, 0, width, height); // fill entire canvas if not in fullscreen
            }
            let x = canvaswindow.width / 2;
            let y = canvaswindow.height / 2;

            ctx.font = "40pt Calibri";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            ctx.fillText("Title Screen!", x, y);
        }
        if (showPad){
            ctx.beginPath();
            ctx.arc(TOUCHPADSIZE,height-TOUCHPADSIZE,TOUCHPADSIZE,0,2*Math.PI);
            ctx.fillStyle = "rgba(128,128,128,.25)";
            ctx.fill();
        }
        framecount+=1;
    }
    return touchListener;
}
console.log("SIGO");
const touchListener=main();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,firefox}=require(process.env.DUCK_PLAYWRIGHT_MODULE || '@playwright/test');
const out=process.env.DUCK_EVIDENCE_DIRECTORY || path.resolve(__dirname, '../browser-results');fs.mkdirSync(out,{recursive:true});
const tag=process.argv[2]||'baseline';
async function silence(context){
 await context.route('**/*',route=>route.request().resourceType()==='media'||/\.(mp3|wav|ogg|m4a|webm)(\?|$)/i.test(route.request().url())?route.abort():route.continue());
 await context.addInitScript(()=>{window.__duckSteps=[];HTMLMediaElement.prototype.play=function(){this.muted=true;return Promise.resolve()};for(const name of['AudioContext','webkitAudioContext'])if(window[name]){const Original=window[name];window[name]=class extends Original{constructor(...a){super(...a);void this.suspend()}resume(){return Promise.resolve()}}}});
}
async function instrument(page){
 await page.route('**/src/main.ts*',async route=>{const r=await route.fetch();let body=await r.text();assert.ok(body.includes('new Phaser.Game(config);'),'visible game constructor seam');body=body.replace('new Phaser.Game(config);','window.taskGame = new Phaser.Game(config);');await route.fulfill({response:r,body})});
 await page.route('**/src/lib/PhaserBox2D.js*',async route=>{const r=await route.fetch();let body=await r.text();const marker='function b2World_Step(worldId, timeStep, subStepCount) {';assert.ok(body.includes(marker),'pinned Box2D step seam');body=body.replace(marker,marker+'\n globalThis.__duckSteps?.push({timeStep, subStepCount});');await route.fulfill({response:r,body})});
}
(async()=>{const report={scope:'Isolated copied source with observation-only game/step seams, actual pinned Box2D and Phaser. Desktop browsers at mobile/desktop viewports; no physical-mobile timing or performance gain claim.',tag,cases:[],silentBeforeNavigation:true};
for(const [engine,browserType]of Object.entries({chromium,...(process.env.DUCK_FIREFOX==='1'?{firefox}:{})})){
 const browser=await browserType.launch({headless:true,...(engine==='chromium'?{args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{firefoxUserPrefs:{'media.volume_scale':'0.0','media.autoplay.default':5}})});
 try{for(const width of[390,1280])for(const hz of[30,60,120]){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:true});await silence(context);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await instrument(page);await page.goto(process.env.DUCK_SOURCE_URL || 'http://127.0.0.1:4297/');await page.waitForFunction(()=>window.taskGame?.scene.scenes.some(s=>s.player&&s.mobileControls));
  const data=await page.evaluate(async({hz})=>{
   const b=await import('/src/lib/PhaserBox2D.js');const {gameState}=await import('/src/lib/gameState.ts');const game=window.taskGame,scene=game.scene.scenes.find(s=>s.player&&s.mobileControls);game.loop.stop();scene.startGame();
   function setup(){
    const def=b.b2DefaultWorldDef();def.gravity=new b.b2Vec2(0,-50);def.maximumLinearVelocity=4000;const world=b.b2CreateWorld(def);gameState.setWorldId(world);
    const groundDef=b.b2DefaultBodyDef();groundDef.position=new b.b2Vec2(0,0);const ground=b.b2CreateBody(world,groundDef);const shape=b.b2DefaultShapeDef();shape.friction=1.5;shape.enableContactEvents=true;shape.userData={type:'platform'};b.b2CreatePolygonShape(ground,shape,b.b2MakeBox(100,0.2));
    scene.mobileControls.rightButton.emit('pointerup');scene.mobileControls.leftButton.emit('pointerup');scene.mobileControls.jumpButton.emit('pointerup');scene.player.setPosition(0,-300);scene.player.playerState.isGrounded=false;scene.player.playerState.isDead=false;scene.player.initPhysics();scene.physicsClock.reset();scene.playerInput?.reset();scene.controls.up.reset();scene.groundContacts.reset();for(let i=0;i<180;i++)scene.update(i*1000/60,1000/60);scene.physicsClock.reset();return world;
   }
   window.__setupDuckPhysics=setup;window.__duckScene=scene;
   setup();const grounded=scene.player.playerState.isGrounded;const initial=b.b2Body_GetPosition(scene.player.bodyId).clone();window.__duckSteps=[];scene.mobileControls.rightButton.emit('pointerdown');let maximumCallsPerFrame=0;
   for(let i=0;i<hz;i++){const before=window.__duckSteps.length;scene.update(i*1000/hz,1000/hz);maximumCallsPerFrame=Math.max(maximumCallsPerFrame,window.__duckSteps.length-before)}scene.mobileControls.rightButton.emit('pointerup');const movement={x:(b.b2Body_GetPosition(scene.player.bodyId).x-initial.x)*30,steps:window.__duckSteps.length,maximumCallsPerFrame,allStepsFixed:window.__duckSteps.every(s=>s.timeStep===1/60&&s.subStepCount===4),grounded};
   setup();const startY=b.b2Body_GetPosition(scene.player.bodyId).y;let apex=startY,takeoff=false;scene.mobileControls.jumpButton.emit('pointerdown');for(let i=0;i<hz*3;i++){if(i===Math.round(hz/10))scene.mobileControls.jumpButton.emit('pointerup');scene.update(i*1000/hz,1000/hz);const p=b.b2Body_GetPosition(scene.player.bodyId);apex=Math.max(apex,p.y);takeoff ||= !scene.player.playerState.isGrounded;}const jump={height:(apex-startY)*30,takeoff,landed:scene.player.playerState.isGrounded,finalY:b.b2Body_GetPosition(scene.player.bodyId).y};
   const tunneling=[];for(const speed of[100,500,2000]){setup();b.b2Body_SetTransform(scene.player.bodyId,new b.b2Vec2(0,5),new b.b2Rot(1,0));b.b2Body_SetLinearVelocity(scene.player.bodyId,new b.b2Vec2(0,-speed));scene.player.playerState.isGrounded=false;scene.groundContacts.reset();scene.physicsClock.reset();window.__duckSteps=[];scene.update(5000,5000);const p=b.b2Body_GetPosition(scene.player.bodyId);tunneling.push({speed,y:p.y,bottom:p.y-scene.player.height*0.8/2/30,steps:window.__duckSteps.length,grounded:scene.player.playerState.isGrounded,velocity:b.b2Body_GetLinearVelocity(scene.player.bodyId).y});}
   return{movement,jump,tunneling};
  },{hz});
  data.jumpEdges=[];
  for(const input of ['touch','keyboard'])for(const mode of ['zero-tick','catch-up']){
   await page.evaluate(()=>{window.__setupDuckPhysics();const scene=window.__duckScene;window.__originalDuckJump ||= scene.player.jump.bind(scene.player);window.__duckJumpSuccesses=0;window.__duckJumpCalls=0;scene.player.jump=()=>{window.__duckJumpCalls++;const result=window.__originalDuckJump();if(result)window.__duckJumpSuccesses++;return result};window.__duckSteps=[]});
   if(input==='keyboard')await page.keyboard.down('ArrowUp');else await page.evaluate(()=>window.__duckScene.mobileControls.jumpButton.emit('pointerdown'));
   let zeroSteps;
   if(mode==='zero-tick'){
    zeroSteps=await page.evaluate(()=>{window.__duckScene.update(0,1000/120);return window.__duckSteps.length});
    if(input==='keyboard')await page.keyboard.up('ArrowUp');else await page.evaluate(()=>window.__duckScene.mobileControls.jumpButton.emit('pointerup'));
    await page.evaluate(()=>window.__duckScene.update(1000/120,1000/120));
   }else await page.evaluate(()=>window.__duckScene.update(5000,5000));
   const first=await page.evaluate(()=>({successfulJumps:window.__duckJumpSuccesses,attempts:window.__duckJumpCalls,steps:window.__duckSteps.length}));
   if(mode==='catch-up'){if(input==='keyboard')await page.keyboard.up('ArrowUp');else await page.evaluate(()=>window.__duckScene.mobileControls.jumpButton.emit('pointerup'));}
   const after=await page.evaluate(()=>{window.__duckScene.update(6000,5000);return{successfulJumps:window.__duckJumpSuccesses,steps:window.__duckSteps.length}});
   if(mode==='zero-tick')assert.equal(zeroSteps,0);assert.equal(first.successfulJumps,1,input+' '+mode+' must deliver one jump');assert.equal(first.steps,mode==='zero-tick'?1:4);assert.equal(after.successfulJumps,1);assert.equal(after.steps-first.steps,4);data.jumpEdges.push({input,mode,zeroSteps,first,after});
  }
  assert.equal(data.movement.steps,60);assert.equal(data.movement.allStepsFixed,true);assert.equal(data.movement.grounded,true);assert.equal(data.jump.takeoff,true);assert.equal(data.jump.landed,true);for(const t of data.tunneling){assert.equal(t.steps,4);assert.ok(t.bottom>=0.15,'fast body must remain above platform: '+JSON.stringify(t))}assert.deepEqual(errors,[]);report.cases.push({engine,width,hz,...data});console.log(JSON.stringify({engine,width,hz,movement:data.movement.x,jump:data.jump.height}));await context.close();
 }}finally{await browser.close()}}
 report.equivalence=Object.entries(Object.groupBy(report.cases,r=>r.engine+'-'+r.width)).map(([group,rows])=>({group,movementSpread:Math.max(...rows.map(r=>r.movement.x))-Math.min(...rows.map(r=>r.movement.x)),jumpSpread:Math.max(...rows.map(r=>r.jump.height))-Math.min(...rows.map(r=>r.jump.height))}));report.passed=report.equivalence.every(g=>g.movementSpread<0.01&&g.jumpSpread<1);fs.writeFileSync(path.join(out,tag+'-physics.json'),JSON.stringify(report,null,2)+'\n');if(tag!=='baseline')assert.equal(report.passed,true,'render-rate movement and jump equivalence');console.log(JSON.stringify({tag,passed:report.passed,equivalence:report.equivalence},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

// Run against a disposable browser profile and a loopback-only static server.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';

const requests=[], violations=[], exceptions=[], backend=[];
const server=http.createServer(async (req,res)=>{
  if(req.url==='/contract'){
    let body=''; for await(const chunk of req) body+=chunk;
    backend.push(JSON.parse(body));
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify({status:'answer',answer:'Audited excerpt',citations:[{doc:'Audit.pdf',location:'p. 4',excerpt:'Audited excerpt'}]}));
    return;
  }
  const file=path.resolve('dist','.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(path.resolve('dist')+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('content-type',({'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'synoptik-ui-'));
const exe=process.env.CHROME_BIN || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':'google-chrome');
const browser=spawn(exe,['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;
try {
  const portFile=path.join(profile,'DevToolsActivePort');
  for(let i=0;i<150&&!fs.existsSync(portFile);i++) await delay(100);
  const port=fs.readFileSync(portFile,'utf8').split(/\s/)[0];
  console.log('Browser debugging port',port);
  const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await once(socket,'open',{signal:AbortSignal.timeout(8000)});
  console.log('Browser connected');
  let id=0;
  const pending=new Map();
  socket.onmessage=({data})=>{
    const m=JSON.parse(data);
    if(m.id){const cb=pending.get(m.id);if(!cb)return;pending.delete(m.id);return m.error?cb.reject(Error(m.error.message)):cb.resolve(m.result);}
    if(m.method==='Network.requestWillBeSent') requests.push(m.params.request.url);
    if(m.method==='Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    if(m.method==='Log.entryAdded'&&m.params.entry.source==='security') violations.push(m.params.entry.text);
  };
  const send=(method,params={})=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('CDP timed out: '+method)),process.argv.includes('--ocr') ? 90000 : 10000);pending.set(++id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const wait=async expr=>{for(let i=0;i<100;i++){if(await evaluate(expr))return;await delay(80);}throw Error('Timed out: '+expr);};
  for(const domain of ['Page','Runtime','Network','Log'])await send(domain+'.enable');
  await send('Page.navigate',{url:origin+'/app.html'});
  await wait("!!document.querySelector('#onboard-next')");
  await evaluate("document.querySelector('[data-act=onboard-skip]').click()");
  await evaluate("import('./assets/app/state.js').then(m=>{m.state.settings.scripted=false;m.save()})");
  await evaluate("document.querySelector('[data-qa=q-price-x5]').click()");
  await wait("!!document.querySelector('.answer-direct')");
  assert.match(await evaluate("document.querySelector('.answer-direct').textContent"),/42[ ,]800/);
  const bullets=await evaluate("[...document.querySelectorAll('.answer-details li')].map(el=>el.textContent.trim())");
  assert.ok(bullets.length && bullets.every(Boolean));assert.equal(new Set(bullets).size,bullets.length);
  fs.mkdirSync('artifacts',{recursive:true});
  const shot=async name=>fs.writeFileSync('artifacts/'+name+'.png',Buffer.from((await send('Page.captureScreenshot')).data,'base64'));
  await shot('live-answer');
  await evaluate("document.querySelector('[data-act=source]').click()");
  assert.equal(await evaluate("document.querySelector('#app').inert"),true);
  const key=async (k,modifiers=0)=>{for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:k,modifiers,windowsVirtualKeyCode:k==='Tab'?9:27});};
  await key('Tab');await key('Escape');
  assert.equal(await evaluate("document.activeElement.dataset.act"),'source');
  await evaluate("document.querySelector('[data-act=clear-thread]').click();document.querySelector('[data-qa=q-diff]').click()");
  await wait("!!document.querySelector('.answer.refused')");
  await shot('live-refusal');
  for(const i of [1,2,0]){
    await evaluate("document.querySelectorAll('.lang-switch button')["+i+"].click()")
    assert.equal(await evaluate('document.documentElement.lang'),['en','ru','kk'][i]);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await evaluate("document.querySelector('.menu-btn').click()");await key('Escape');
  assert.equal(await evaluate("document.querySelector('.menu-btn').getAttribute('aria-expanded')"),'false');
  for(const file of ['thermal.pdf','scan.pdf']){
    const data=fs.readFileSync('eval/independent/'+file).toString('base64');
    const result=await evaluate("(async()=>{const p=await import('./assets/app/parsers.js');try{return (await p.parseFile(new File([Uint8Array.from(atob('"+data+"'),c=>c.charCodeAt(0))],'document.pdf'),'pdf')).chunks}catch(e){return e.message}})()");
    if(file==='scan.pdf')assert.equal(result,'pdf-text');else assert.equal(result[0].loc.page,1);
  }
  assert.deepEqual(requests.filter(u=>/^https?:/.test(u)&&!u.startsWith(origin+'/')),[]);
  assert.equal(backend.length,0);
  const remote=await evaluate("(async()=>{const m=await import('./assets/app/state.js');m.state.settings.endpoint=location.origin+'/contract';const a=await import('./assets/app/ask.js');const r=await a.remoteAsk('contract test');return m.citeStr(r.evidence[0].chunk)})()");
  assert.match(remote,/Audit.pdf.*p. 4/);
  assert.deepEqual(Object.keys(backend[0]).sort(),['language','question','threshold']);
  if (process.argv.includes('--ocr')) {
    const data=fs.readFileSync('eval/independent/scan.pdf').toString('base64');
    const result=await evaluate("(async()=>{const m=await import('./assets/ai/local.js');return m.AI.ocrPDF(Uint8Array.from(atob('"+data+"'),c=>c.charCodeAt(0)).buffer)})()");
    assert.match(result.texts.join(' '),/density/i);
  }
  assert.deepEqual(exceptions,[]);assert.deepEqual(violations,[]);
  console.log('Browser passed: live answer, refusal, PDF, citations, locales, focus, mobile, network contract.');
} catch(error){console.error(error);throw error;} finally {socket?.close();browser.kill();server.closeAllConnections();server.close();try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200});}catch{}}

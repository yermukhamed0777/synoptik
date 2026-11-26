import fs from 'node:fs';
import {parseFile} from '../src/app/parsers.js';
import {buildIndex,search,lineText} from '../src/domain/engine.js';
import {realFloor} from '../eval/floors.mjs';
const dir = new URL('../eval/independent/',import.meta.url);
const truth = JSON.parse(fs.readFileSync(new URL('truth.json',dir)));
const chunks = [], failures = [];
let parsed = 0;
const initialRss = process.memoryUsage().rss;
for (const [name, expectation] of Object.entries(truth.files)) {
  const file = new File([fs.readFileSync(new URL(name,dir))],name);
  try {
    const type = name.split('.').at(-1);
    const result = await parseFile(file,type === 'md' ? 'txt' : type);
    if (!result.chunks.some(c => c.lines.some(line => line.includes(expectation.text)) &&
      Object.entries(expectation.loc || {}).every(([key,value]) => c.loc[key] === value))) throw Error('missing passage or locator');
    chunks.push(...result.chunks.map((c,i) => ({...c,id:name+'#'+i,doc:name,docName:name})));
    parsed++;
  } catch(e) { if (expectation.error === e.message) parsed++; else failures.push({name,error:e.message}); }
}
const index = buildIndex(chunks);
let answerable=0, supported=0, recalled=0, refusals=0, correctRefusals=0, answered=0, cited=0;
const times=[];
for (const [q,doc,needle] of truth.questions) {
  const start=performance.now();
  const r=search(index,q,{threshold:0.6,maxSources:3});
  times.push(performance.now()-start);
  if (doc) answerable++; else refusals++;
  if (r.status !== 'answer') {
    if (!doc) correctRefusals++; else failures.push({q,reason:r.reason});
    continue;
  }
  answered++;
  const hit=r.hits[0], direct=lineText(hit.chunk,hit.best.i);
  if (doc && r.hits.slice(0,3).some(h=>h.chunk.doc===doc)) recalled++;
  if (doc===hit.chunk.doc && direct.includes(needle) && hit.evidenceLines.includes(hit.best.i)) { supported++; cited++; }
  else failures.push({q,actual:direct,doc:hit.chunk.doc});
}
times.sort((a,b)=>a-b);
const metrics={parsing:[parsed,Object.keys(truth.files).length],recallAt3:[recalled,answerable],supported:[supported,answerable],abstention:[correctRefusals,refusals],citations:[cited,answered],p95ms:times[Math.ceil(times.length*.95)-1],processRssDeltaMiB:(process.memoryUsage().rss-initialRss)/1048576,processPeakRssMiB:process.resourceUsage().maxRSS/1024};
console.log(JSON.stringify({mode:'live lexical',metrics,failures},null,2));
if (parsed!==Object.keys(truth.files).length || supported/answerable<realFloor.answered || (answered-supported)/Math.max(1,answered)>realFloor.wrong || correctRefusals/refusals<realFloor.refusal) process.exitCode=1;

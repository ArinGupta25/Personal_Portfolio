import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {root,build,validate,visible,esc} from './build.mjs';
const data=JSON.parse(await readFile(path.join(root,'content/site.json'),'utf8'));
test('draft content cannot be published by default',()=>{assert.deepEqual(visible([{title:'secret'},{title:'draft',published:false},{title:'approved',published:true}]),[{title:'approved',published:true}])});
test('reject unsafe links, invalid paths and duplicate slugs',()=>{
 for(const entry of [{slug:'ok',demo:'javascript:alert(1)'},{slug:'../secret'},{slug:'ok',image:'assets/images/../../secret',alt:'x'}])assert.throws(()=>validate({...data,projects:[entry]}));
 assert.throws(()=>validate({...data,projects:[{slug:'same'},{slug:'same'}]}));
 assert.throws(()=>validate({...data,travel:[{slug:'trip',lat:91,lon:0}]}));
 assert.equal(esc('<script>'), '&lt;script&gt;');
});
test('approved content generates detail pages while drafts stay out of deployment',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'personal-home-test-'));
 try{
 const entry={published:true,slug:'fixture',title:'Test entry',summary:'Preview only',body:'First paragraph.\n\nSecond paragraph.',category:'Creative',date:'2026-01-01'};
 await build({...data,projects:[entry,{...entry,slug:'private-draft',published:false}],writeups:[entry],travel:[{...entry,country:'Fixture only',lat:0,lon:0}],organisations:[{...entry,role:'Test role'}],education:[{...entry,indicators:[{label:'Test',value:'Approved'}]}],services:[entry],timeline:[entry]},dir);
 for(const type of ['projects','writeups','travel'])assert.match(await readFile(path.join(dir,type,'fixture.html'),'utf8'),/Second paragraph\./);
 await assert.rejects(stat(path.join(dir,'projects/private-draft.html')));
 assert.doesNotMatch(await readFile(path.join(dir,'projects.html'),'utf8'),/private-draft/);
 const points=JSON.parse(await readFile(path.join(dir,'assets/travel.json'),'utf8'));assert.equal(points[0].lat,0);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('build all eight pages with resolvable local links and assets',async()=>{
 await build();
 const dir=path.join(root,'dist');let count=0;
 async function walk(folder){for(const file of await readdir(folder)){const full=path.join(folder,file);if((await stat(full)).isDirectory()){await walk(full);continue}if(!file.endsWith('.html')||file==='404.html')continue;count++;const html=await readFile(full,'utf8');assert.match(html,/<main id="main">/);assert.match(html,/aria-current="page"/);for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){const url=match[1];if(/^(https?:|mailto:|#)/.test(url))continue;const target=path.resolve(folder,url.split('#')[0]);await assert.doesNotReject(stat(target),`Broken link ${url} in ${file}`)}}}
 await walk(dir);assert.ok(count>=8);
});


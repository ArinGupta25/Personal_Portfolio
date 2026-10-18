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
 assert.throws(()=>validate({...data,library:[{slug:'unsafe',sources:[{title:'Bad',url:'javascript:alert(1)'}]}]}));
 assert.throws(()=>validate({...data,projects:[{slug:'unsafe',sections:[{photos:[{image:'assets/images/../../secret.png',alt:'x'}]}]}]}));
 assert.throws(()=>validate({...data,library:[{slug:'rating',rating:6}]}));
 assert.throws(()=>validate({...data,travel:[{slug:'trip',lat:0,lon:0,countryCode:'wrong'}]}));
});
test('approved content generates detail pages while drafts stay out of deployment',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'personal-home-test-'));
 try{
 const entry={published:true,slug:'fixture',title:'Test entry',summary:'Preview only',body:'First paragraph.\n\nSecond paragraph.',category:'Creative',date:'2026-01-01',sections:[{heading:'Full chapter',body:'Complete section text.',bullets:['One','Two'],quote:'A thought.'}],sources:[{title:'Source example',url:'https://example.com/reference',annotation:'Supporting reference.'}]};
 await build({...data,projects:[entry,{...entry,slug:'private-draft',published:false}],writeups:[entry],library:[{...entry,author:'Fixture author',rating:4}],travel:[{...entry,country:'Fixture only',countryCode:'NLD',lat:0,lon:0}],organisations:[{...entry,role:'Test role'}],education:[{...entry,indicators:[{label:'Test',value:'Approved'}]}],services:[entry],timeline:[entry]},dir);
 for(const type of ['projects','writeups','travel','library']){
   const page=await readFile(path.join(dir,type,'fixture.html'),'utf8');
   assert.match(page,/Second paragraph\./);assert.match(page,/Complete section text\./);assert.match(page,/https:\/\/example.com\/reference/);assert.match(page,/href="#section-0"/);
 }
 await assert.rejects(stat(path.join(dir,'projects/private-draft.html')));
 assert.doesNotMatch(await readFile(path.join(dir,'projects.html'),'utf8'),/private-draft/);
 const points=JSON.parse(await readFile(path.join(dir,'assets/travel.json'),'utf8'));assert.equal(points[0].lat,0);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('build all nine pages with resolvable local links and assets',async()=>{
 await build();
 const dir=path.join(root,'dist');let count=0;
 async function walk(folder){for(const file of await readdir(folder)){const full=path.join(folder,file);if((await stat(full)).isDirectory()){await walk(full);continue}if(!file.endsWith('.html')||file==='404.html')continue;count++;const html=await readFile(full,'utf8');assert.match(html,/<main id="main">/);assert.match(html,/aria-current="page"/);for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){const url=match[1];if(/^(https?:|mailto:|#)/.test(url))continue;const target=path.resolve(folder,url.split('#')[0]);await assert.doesNotReject(stat(target),`Broken link ${url} in ${file}`)}}}
 await walk(dir);assert.ok(count>=9);
 const home=await readFile(path.join(dir,'index.html'),'utf8');assert.doesNotMatch(home,/brand-flower/);assert.match(home,/profile-avatar/);assert.match(home,/library.html/);
});
test('country map has unique country identifiers and real polygons',async()=>{
 const map=JSON.parse((await readFile(path.join(root,'assets/countries.geojson'),'utf8')).replace(/^\uFEFF/,''));
 const codes=map.features.map(f=>f.properties.code);assert.equal(new Set(codes).size,codes.length);assert.ok(codes.includes('NLD'));assert.ok(codes.includes('IND'));assert.ok(map.features.length>150);
});



test('library preserves individual entries and exceptional rating semantics',async()=>{
 const {libraryShelf,libraryDetail}=await import('./library.mjs');
 const read=data.library.filter(b=>b.status==='read');
 for(const b of read){assert.ok([1,2,3,4,5,7].includes(b.rating));assert.ok(b.summary.length>60);assert.ok(b.authorNote);if(!b.identityUnconfirmed)assert.ok(b.sources.length>0);}
 const exceptional={title:'Exceptional fixture',author:'Example author',rating:7,summary:'A synopsis'};
 const page=libraryDetail(exceptional);
 assert.match(page,/7 stars/);assert.match(page,/Exceptional/);assert.doesNotMatch(page,/7 \/ 5/);assert.match(page,/Book summary/);assert.doesNotMatch(page,/My reflections/);
 const reading=libraryDetail({title:'Reading fixture',author:'Example author',status:'reading',summary:'In progress'});
 assert.match(reading,/not yet rated/);assert.doesNotMatch(reading,/rating-standard/);
 const shelf=libraryShelf(data.library);assert.equal((shelf.match(/class="book-entry /g)||[]).length,read.length);
 for(const id of ['collection-search','section-filter','rating-filter','book-sort'])assert.ok(shelf.includes(`id="${id}"`));
 assert.equal(new Set(read.map(b=>b.slug)).size,read.length);
});

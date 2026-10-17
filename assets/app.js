const menu=document.querySelector('.menu-toggle');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.querySelector('nav').classList.toggle('open',open)});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))});
 document.querySelectorAll('[data-category]').forEach(item=>item.hidden=button.dataset.filter!=='all'&&item.dataset.category!==button.dataset.filter);
}));
document.querySelector('#search')?.addEventListener('input',event=>{let count=0;document.querySelectorAll('[data-search]').forEach(item=>{item.hidden=!item.dataset.search.includes(event.target.value.trim().toLowerCase());if(!item.hidden)count++});document.querySelector('#no-results').hidden=count>0||!event.target.value});
const dialog=document.querySelector('#lightbox');
document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{dialog.querySelector('img').src=button.dataset.photo;dialog.querySelector('img').alt=button.dataset.alt;dialog.querySelector('p').textContent=button.dataset.alt;dialog.showModal()}));
dialog?.querySelector('button').addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
document.querySelector('#inquiry')?.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);const note=`Hello,\n\n${data.get('idea')}\n\nFrom: ${data.get('sender')}\nReply to: ${data.get('reply')}`;document.querySelector('#prepared').value=note;document.querySelector('#inquiry-result').hidden=false;if(form.dataset.email)location.href=`mailto:${form.dataset.email}?subject=${encodeURIComponent('An idea to explore together')}&body=${encodeURIComponent(note)}`});
const map=document.querySelector('#world-map');
if(map){
 let zoom=1;const layer=document.querySelector('#map-land');
 const update=()=>{layer.setAttribute('transform',`translate(${480-480*zoom} ${240-240*zoom}) scale(${zoom})`);document.querySelector('#zoom-in').disabled=zoom>=3;document.querySelector('#zoom-out').disabled=zoom<=1};
 document.querySelector('#zoom-in').onclick=()=>{zoom=Math.min(3,zoom+.5);update()};document.querySelector('#zoom-out').onclick=()=>{zoom=Math.max(1,zoom-.5);update()};document.querySelector('#reset-map').onclick=()=>{zoom=1;update()};update();
 try{
  const [geo,places]=await Promise.all(['assets/land.geojson','assets/travel.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Map unavailable');return r.json()}));
  const svgNS='http://www.w3.org/2000/svg';
  const project=([lon,lat])=>[(lon+180)*960/360,(90-lat)*480/180];
  for(const f of geo.features){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;const path=document.createElementNS(svgNS,'path');path.setAttribute('d',polys.map(poly=>poly.map(ring=>ring.map((point,i)=>`${i?'L':'M'}${project(point).join(',')}`).join(' ')+'Z').join(' ')).join(' '));layer.append(path)}
  map.setAttribute('aria-label',`World map. ${places.length? 'Visited places are linked to their journals.':'No visited places added yet.'}`);
  if(places.length)map.setAttribute('role','group');
  for(const p of places){const link=document.createElementNS(svgNS,'a');link.setAttribute('href',`travel/${p.slug}.html`);link.setAttribute('aria-label',`Read ${p.title}`);const pin=document.createElementNS(svgNS,'circle');const [x,y]=project([p.lon,p.lat]);pin.setAttribute('cx',x);pin.setAttribute('cy',y);pin.setAttribute('r',6);pin.setAttribute('class','map-pin');const title=document.createElementNS(svgNS,'title');title.textContent=p.title;link.append(title,pin);layer.append(link)}
 }catch{document.querySelector('.atlas-bottom span').textContent='The map could not load. Travel journals remain available below.'}
}

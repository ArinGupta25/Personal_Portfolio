import {readFile, writeFile, mkdir, cp, rm, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {esc, visible, nav, pageInfo, shell, home, contents, detail, icon} from './templates.mjs';
export {esc, visible};
export const root = fileURLToPath(new URL('../', import.meta.url));

export function validate(d) {
  for (const key of ['photos','socials','interests','projects','organisations','writeups','library','timeline','travel','services','education']) if (!Array.isArray(d[key])) throw Error(`${key} must be an array`);
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) throw Error('Invalid email');
  for (const key of ['projects','writeups','travel','library']) {
    const seen = new Set();
    for (const item of d[key]) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || seen.has(item.slug)) throw Error(`Invalid or duplicate ${key} slug`);
      seen.add(item.slug);
    }
  }
  // Sources and photos may be nested inside article sections.
  function inspect(item) {
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item)) return item.forEach(inspect);
    for (const field of ['url','demo','repository']) if (item[field]) {
      let url;
      try { url = new URL(item[field]); } catch { throw Error(`${field} requires a valid HTTPS URL`); }
      if (url.protocol !== 'https:' || url.username || url.password) throw Error(`${field} requires HTTPS without credentials`);
    }
    if (item.image && (!/^assets\/images\/[\w./-]+\.(?:png|jpe?g|webp|avif)$/i.test(item.image) || item.image.includes('..'))) throw Error('Images must be local raster files in assets/images');
    if (item.image && !item.alt?.trim()) throw Error('Images need alt text');
    if (item.rating !== undefined && (!Number.isFinite(item.rating) || item.rating < 0 || (item.rating > 5 && item.rating !== 7))) throw Error('Rating must be between 0 and 5, or 7 for exceptional books');
    for (const key of ['photos','sections','sources','bullets','indicators']) if (item[key] !== undefined && !Array.isArray(item[key])) throw Error(`${key} must be an array`);
    Object.values(item).forEach(inspect);
  }
  inspect(d);
  for (const p of d.projects) if (p.caseStudy) {
    const c=p.caseStudy;
    if (!p.image || !p.repository || !c.goal || !c.code?.text || !c.headings) throw Error('Project case study requires an image, repository, goal, headings and code');
    for (const field of ['stack','facts','milestones','next']) if (!Array.isArray(c[field])) throw Error(`Project case study ${field} must be an array`);
    for (const date of [c.updated,...c.milestones.map(m=>m.date)]) if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw Error('Project case study dates must be ISO');
  }
  for (const t of d.travel) {
    if (!Number.isFinite(t.lat) || !Number.isFinite(t.lon) || Math.abs(t.lat)>90 || Math.abs(t.lon)>180) throw Error('Invalid coordinates');
    if (!/^[A-Z]{3}$/.test(t.countryCode || '')) throw Error('Travel needs an ISO alpha-3 countryCode');
  }
  for (const t of d.timeline) if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date) || Number.isNaN(Date.parse(t.date))) throw Error('Timeline date must be ISO');
}

export async function build(input, output) {
  const d = input || JSON.parse(await readFile(path.join(root,'content/site.json'),'utf8'));
  validate(d);
  const dist = path.resolve(output || path.join(root,'dist'));
  const isDefault = dist === path.resolve(root,'dist');
  const isTest = path.dirname(dist) === path.resolve(os.tmpdir()) && path.basename(dist).startsWith('personal-home-test-');
  const isFixture = dist === path.resolve(root,'../../work/interactive-preview');
  if (!isDefault && !isTest && !isFixture) throw Error('Refusing to replace an output directory outside the approved build locations');
  async function checkImages(item) {
    if (!item || typeof item !== 'object') return;
    if (item.image) await stat(path.join(root,item.image));
    await Promise.all(Object.values(item).map(checkImages));
  }
  await checkImages({...d, ...Object.fromEntries(Object.entries(d).filter(([,v]) => Array.isArray(v)).map(([k,v]) => [k,k==='interests'?v:visible(v)]))});
  await rm(dist,{recursive:true,force:true});
  await mkdir(dist,{recursive:true});
  await cp(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});
  await writeFile(path.join(dist,'.nojekyll'),'');
  await writeFile(path.join(dist,'assets/travel.json'),JSON.stringify(visible(d.travel).map(({slug,title,lat,lon,country,countryCode}) => ({slug,title,lat,lon,country,countryCode}))));
  for (const [page] of nav) {
    const info = pageInfo[page];
    const body = page === 'index' ? home(d) : `<section class="page-heading"><div class="page-title"><p class="eyebrow">${info[3]} / ${info[0]}</p><h1>${info[1]}</h1><p class="lede">${info[2]}</p></div><div class="page-emblem" aria-hidden="true">${icon(page)}<span class="emblem-orbit"></span><span class="emblem-dot"></span></div></section><section class="page-content">${contents(d,page)}</section>`;
    await writeFile(path.join(dist,`${page}.html`),shell(d,page,body));
  }
  for (const type of ['projects','writeups','travel','library']) {
    await mkdir(path.join(dist,type),{recursive:true});
    for (const item of visible(d[type])) await writeFile(path.join(dist,type,`${item.slug}.html`),shell(d,type,detail(item,type),'../',item.title));
  }
  await writeFile(path.join(dist,'404.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found</title><body style="font:20px Georgia;background:#f7f4ed;color:#273d35;padding:12vw"><h1>A small detour.</h1><p>This page has wandered off. Please use your browser’s Back button to return to the archive.</p></body></html>');
  console.log('Built 9 pages and all published detail pages.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();

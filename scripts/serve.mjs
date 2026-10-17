import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {root} from './build.mjs';
const dir=path.resolve(process.env.SITE_DIR || path.join(root,'dist'));
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.geojson':'application/geo+json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
http.createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(dir,'.'+pathname);if(file!==dir&&!file.startsWith(dir+path.sep)){res.writeHead(403);return res.end()};if((await stat(file)).isDirectory())file=path.join(file,'index.html');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Page not found')}
}).listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${process.env.PORT || 4173}`));

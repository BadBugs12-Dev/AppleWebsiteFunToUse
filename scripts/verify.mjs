import fs from 'node:fs';
import {CATALOG,CATEGORIES} from '../dist/model.js';
for(const f of ['index.html','app.js','styles.css','model.js'])if(!fs.existsSync('dist/'+f))throw new Error('Missing '+f);
const assets=new Set([...CATALOG.flatMap(p=>[p.image,p.thumb,p.card,...p.colors.map(c=>c.image)]),...CATEGORIES.map(c=>c.image)].filter(Boolean));
for(const asset of assets)if(!fs.existsSync('dist/assets/'+asset))throw new Error('Missing product asset: '+asset);
console.log(`Static build verified: ${CATALOG.length} products, ${assets.size} product assets. Ready for Vercel.`);

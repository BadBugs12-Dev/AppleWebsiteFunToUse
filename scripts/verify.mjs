import fs from 'node:fs';
import {CATALOG,CATEGORIES} from '../dist/model.js';
import {STORE_SHELVES,STORE_CATEGORIES} from '../dist/store-data.js';
for(const f of ['index.html','app.js','styles.css','model.js','replica.js','replica.css','store-data.js'])if(!fs.existsSync('dist/'+f))throw new Error('Missing '+f);
const assets=new Set(['specialist-avatar.png','sf-pro-text_regular.woff2','sf-pro-text_semibold.woff2','sf-pro-display_semibold.woff2','sf-pro-icons_regular.woff2',...STORE_SHELVES.flatMap(s=>s.cards.flatMap(c=>[c.image,c.videoFile,...c.swatches])),...STORE_CATEGORIES.map(c=>c.image),...CATALOG.flatMap(p=>[p.image,p.thumb,p.card,...p.colors.map(c=>c.image)]),...CATEGORIES.map(c=>c.image)].filter(Boolean));
for(const asset of assets)if(!fs.existsSync('dist/assets/'+asset))throw new Error('Missing product asset: '+asset);
console.log(`Static build verified: ${CATALOG.length} products, ${assets.size} product assets. Ready for Vercel.`);

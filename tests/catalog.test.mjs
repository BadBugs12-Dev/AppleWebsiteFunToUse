import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATALOG,selection,itemPrice,initialState,placeOrder,restoreState,totals} from '../dist/model.js';
import {renderStore,renderProduct} from '../dist/replica.js';
import {STORE_SHELVES,STORE_CATEGORIES} from '../dist/store-data.js';
const ctx=()=>({state:initialState(),draft:{color:0,option:0,care:false,choices:{},gallery:0},now:()=>new Date(2026,9,28,12),icon:()=>'',modal:()=>{}});
test('all Store shelves and all ten categories render with local media and valid product routes',()=>{
  assert.equal(STORE_SHELVES.length,7);assert.equal(STORE_CATEGORIES.length,10);
  const html=renderStore(undefined,ctx());
  for(const [,id] of html.matchAll(/href="#product\/([^"]+)"/g))assert.ok(CATALOG.some(p=>p.id===id),'Missing route: '+id);
  for(const [,asset] of html.matchAll(/(?:src|poster)="\/assets\/([^"]+)"/g))assert.ok(fs.existsSync('dist/assets/'+asset),'Missing asset: '+asset);
  assert.ok(!html.includes('Personal Store'));
});
test('every catalog product and every category has a working page with a purchase action',()=>{
  assert.ok(CATALOG.length>=36);
  for(const p of CATALOG){const html=renderProduct(p.id,ctx());assert.ok(html.includes('data-action="add-to-bag" data-id="'+p.id+'"'),p.id);assert.ok(html.includes('<h1>'),p.id);for(const [,asset] of html.matchAll(/src="\/assets\/([^"]+)"/g))assert.ok(fs.existsSync('dist/assets/'+asset),p.id+': '+asset);}
  for(const c of STORE_CATEGORIES)assert.ok(renderStore(c.name,ctx()).includes('<h1>'));
});
test('every additional configuration selection is priced and survives an order and reload',()=>{
  for(const p of CATALOG){for(const g of p.groups||[]){if(g.options.length<2)continue;const item={...selection(p.id,0,0,false,{[g.id]:1}),qty:1,id:'configuration-test'};assert.equal(itemPrice(item),p.price+p.options[0][1]+g.options[1].add);const state=initialState();state.balance=100000000;state.bag=[item];const placed=placeOrder(state,'standard','You',new Date(2026,9,28,12)).state;const restored=restoreState(JSON.stringify(placed));assert.equal(restored.orders[0].items[0].choices[g.id],1);assert.equal(restored.orders[0].items[0].unitPrice,itemPrice(item));assert.equal(placed.balance,state.balance-totals([item]).total);}}
});
test('bad extra configuration indices cannot create an order',()=>{
  const p=CATALOG.find(p=>p.groups?.length);assert.ok(p);
  assert.throws(()=>selection(p.id,0,0,false,{[p.groups[0].id]:9999}),/valid/);
  assert.throws(()=>selection(p.id,0,0,false,{invented:0}),/valid/);
});

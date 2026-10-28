import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,initialState,selection,itemPrice,totals,addBusinessDays,deliveryWindow,placeOrder,stages,orderStatus,cancelOrder,restoreState} from '../dist/model.js';
const bagItem=(id='iphone',option=0,care=false,qty=1)=>({...selection(id,0,option,care),id:'test-item',qty});
test('configuration, protection, quantity, tax, and shipping use exact cents',()=>{
  const items=[bagItem('iphone',1,true,2),bagItem('airpods')];
  assert.equal(itemPrice(items[0]),159800);
  assert.deepEqual(totals(items,'express'),{subtotal:332500,tax:27431,delivery:1500,total:361431});
  assert.equal(totals(items).delivery,0);
});
test('checkout debits wallet once, clears bag, and preserves immutable order snapshot',()=>{
  const state=initialState();state.bag=[bagItem('duo',3,true)];
  const bill=totals(state.bag,'express');const {state:after,order}=placeOrder(state,'express','  Alex  ',new Date('2026-10-28T10:00:00'),'PSTEST');
  assert.equal(after.balance,state.balance-bill.total);assert.deepEqual(after.bag,[]);assert.equal(after.orders.length,1);
  assert.equal(order.shippingCost,1500);assert.equal(order.nickname,'Alex');assert.equal(order.total,bill.total);
  state.bag[0].qty=9;assert.equal(order.items[0].qty,1);
  assert.throws(()=>placeOrder(after),/empty/);
});
test('insufficient funds and invalid configurations cannot produce an order',()=>{
  const state=initialState();state.balance=0;state.bag=[bagItem()];assert.throws(()=>placeOrder(state),/top-up/);
  assert.equal(state.orders.length,0);assert.equal(state.bag.length,1);
  assert.throws(()=>selection('missing'),/valid/);assert.throws(()=>selection('iphone',7),/valid/);
  assert.throws(()=>totals([{...bagItem(),qty:-1}]),/quantity/);assert.throws(()=>totals([bagItem()],'teleport'),/delivery/);
});
test('weekday delivery skips a weekend and preserves local calendar time',()=>{
  const friday=new Date(2026,9,30,15,30);const monday=addBusinessDays(friday,1);
  assert.equal(monday.getDay(),1);assert.equal(monday.getDate(),2);assert.equal(monday.getHours(),15);
  const standard=deliveryWindow([bagItem('mac')],'standard',friday);const express=deliveryWindow([bagItem('mac')],'express',friday);
  assert.equal(new Date(standard.start).getDay(),3);assert.equal(new Date(standard.end).getDay(),5);
  assert.equal(new Date(express.start).getDay(),2);assert.ok(new Date(express.end)<new Date(standard.end));
});
test('mixed bags use the longest product lead time',()=>{
  const date=new Date(2026,9,28,12);const combo=deliveryWindow([bagItem('duo'),bagItem('airpods')],'standard',date);
  assert.deepEqual(combo,deliveryWindow([bagItem('duo')],'standard',date));
});
test('every product has ordered milestones, delivery, and stable recorded dates',()=>{
  for(const p of CATALOG){for(const shipping of ['standard','express']){
    const state=initialState();state.bag=[bagItem(p.id)];const {order}=placeOrder(state,shipping,'You',new Date(2026,9,30,23,59));const timeline=stages(order);
    for(let i=1;i<timeline.length;i++)assert.ok(new Date(timeline[i].date)>new Date(timeline[i-1].date),`${p.id} ${shipping} ${i}`);
    timeline.forEach((s,i)=>assert.equal(orderStatus(order,new Date(s.date)).index,i));
    assert.equal(orderStatus(order,new Date(2027,0,1)).name,'Delivered');assert.equal(new Date(timeline.at(-1).date).getDay(),new Date(order.delivery.end).getDay());
  }}
});
test('cancellation refunds all costs once and stops after shipment',()=>{
  const state=initialState();state.bag=[bagItem()];const date=new Date(2026,9,28,12);const {state:placed,order}=placeOrder(state,'express','You',date,'PSTEST');
  const cancelled=cancelOrder(placed,order.id,date);assert.equal(cancelled.balance,state.balance);assert.equal(orderStatus(cancelled.orders[0],date).name,'Cancelled');
  assert.throws(()=>cancelOrder(cancelled,order.id,date),/already/);
  assert.throws(()=>cancelOrder(placed,order.id,new Date(stages(order)[2].date)),/shipped/);
});
test('wallet, bag, saves, order dates and clock survive storage; corrupted data recovers',()=>{
  const state=initialState();state.bag=[bagItem('mac')];state.saved=['mac'];state.clockOffset=86400000;
  const placed=placeOrder(state,'standard','You',new Date(2026,9,28,12)).state;
  assert.deepEqual(restoreState(JSON.stringify(placed)),placed);
  assert.deepEqual(restoreState('broken JSON'),initialState());assert.deepEqual(restoreState(null),initialState());
  assert.deepEqual(restoreState(JSON.stringify({...initialState(),balance:-100})),initialState());
  const dirty={...initialState(),bag:[{...bagItem(),qty:-1}],saved:['nope']};assert.equal(restoreState(JSON.stringify(dirty)).bag.length,0);
});
test('old order receipts keep their original prices when the catalog changes',()=>{
  const state=initialState();state.orders=[{id:'PSLEGACY',created:'2026-10-28T12:00:00.000Z',items:[bagItem('duo',3,true)],shipping:'standard',subtotal:299800,tax:24734,total:324534,delivery:{start:'2026-11-03T08:00:00.000Z',end:'2026-11-06T19:00:00.000Z'},cancelled:false}];
  const restored=restoreState(JSON.stringify(state));
  assert.equal(restored.orders[0].items[0].unitPrice,299800);
  assert.equal(restored.orders[0].total,324534);
  assert.notEqual(restored.orders[0].items[0].unitPrice,itemPrice(restored.orders[0].items[0]));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,selection,addWalletFunds,resetWalletBalance,placeOrder,restoreState,MAX_BALANCE} from '../dist/model.js';

test('custom wallet amounts use exact cents and reject invalid values without changing the balance',()=>{
  const state=initialState();
  assert.equal(addWalletFunds(state,'12.34').balance,state.balance+1234);
  assert.equal(addWalletFunds(state,'0.01').balance,state.balance+1);
  assert.equal(addWalletFunds(state,' 005.5 ').balance,state.balance+550);
  for(const amount of ['','0','-4','1.234','Infinity','1e3','abc','1,000'])assert.throws(()=>addWalletFunds(state,amount));
  assert.equal(state.balance,2500000);
  assert.equal(addWalletFunds({...state,balance:MAX_BALANCE-1},'0.01').balance,MAX_BALANCE);
  assert.throws(()=>addWalletFunds({...state,balance:MAX_BALANCE},'0.01'),/up to/);
});

test('reset clears only the balance and persists without losing orders, bag, saves or settings',()=>{
  const state=initialState();state.bag=[{...selection('airpods'),id:'a',qty:1}];state.saved=['duo'];state.sound=false;
  const order=placeOrder(state).state.orders[0];state.orders=[order];
  const reset=resetWalletBalance(state);
  assert.equal(reset.balance,0);assert.equal(state.balance,2500000);
  assert.equal(reset.bag,state.bag);assert.equal(reset.orders,state.orders);assert.equal(reset.saved,state.saved);assert.equal(reset.sound,false);
  assert.deepEqual(restoreState(JSON.stringify(reset)),reset);
});

test('arbitrary delivery addresses snapshot and survive reload independently of future edits',()=>{
  const state=initialState();state.bag=[{...selection('airpods'),id:'a',qty:1}];
  const address={street:' 42 Moonbeam Lane ',apartment:'Cloud 9',city:'Star City',region:'Orbit',postalCode:'ABCDE',country:'Wonderland'};
  const placed=placeOrder(state,'express','Ella',new Date(2026,9,28),'PSADDRESS',address);
  assert.deepEqual(placed.order.address,{...address,street:'42 Moonbeam Lane'});
  address.street='Something else';
  assert.equal(placed.order.address.street,'42 Moonbeam Lane');
  assert.deepEqual(restoreState(JSON.stringify(placed.state)).orders[0].address,placed.order.address);
});

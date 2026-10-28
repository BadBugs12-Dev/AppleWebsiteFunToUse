import {EXTRA_PRODUCTS,PRODUCT_DETAILS} from './store-data.js';
export const CATALOG = [
  {id:'duo',name:'iPhone Duo',category:'iPhone',tag:'A whole new world opens up.',badge:'NEW',price:199900,card:'card-duo.webp',image:'duo-white.jpg',thumb:'duo-front.png',dark:true,lead:[4,7],description:'Two sides. So many possibilities. Make room for something extraordinary.',colors:[{name:'Star White',hex:'#e5e2dc',image:'duo-white.jpg'},{name:'Night Sky',hex:'#303d4b',image:'duo-night.jpg'}],optionName:'Storage',options:[['256GB',0],['512GB',20000],['1TB',40000],['2TB',80000]],care:19900},
  {id:'iphone',name:'iPhone 18 Pro',category:'iPhone',tag:'Pro further.',badge:'NEW',price:119900,card:'card-iphone.webp',image:'iphone-burgundy.jpg',thumb:'iphone-burgundy.jpg',dark:true,lead:[2,4],description:'Pick your finish. Find your space. Meet your next favorite thing.',colors:[{name:'Burgundy',hex:'#66363f',image:'iphone-burgundy.jpg'},{name:'Silver',hex:'#d8d8d6',image:'iphone-silver.jpg'},{name:'Glacier',hex:'#a4bdcc',image:'iphone-glacier.jpg'}],optionName:'Storage',options:[['256GB',0],['512GB',20000],['1TB',40000]],care:19900},
  {id:'mac',name:'MacBook Pro',category:'Mac',tag:'Built for your next big thing.',badge:'JUST UPDATED',price:199900,card:'card-mac.webp',image:'detail-mac.jpg',thumb:'nav-mac.webp',dark:true,lead:[3,5],description:'An incredible canvas for everything you want to create. Choose your dream configuration.',colors:[{name:'Space Black',hex:'#333436'},{name:'Silver',hex:'#dadbdb'}],optionName:'Storage',options:[['512GB SSD',0],['1TB SSD',20000],['2TB SSD',60000]],care:27900},
  {id:'ipad',name:'iPad mini',category:'iPad',tag:'More than a little awesome.',badge:'JUST UPDATED',price:69900,card:'card-ipad.webp',image:'detail-ipad.jpg',thumb:'nav-ipad.webp',dark:false,lead:[2,4],description:'A little inspiration you can take everywhere. Now make it yours.',colors:[{name:'Space Gray',hex:'#747578'},{name:'Starlight',hex:'#e8e1d4'},{name:'Purple',hex:'#c8bedb'},{name:'Blue',hex:'#b1c1cc'}],optionName:'Storage',options:[['128GB',0],['256GB',10000],['512GB',30000]],care:7900},
  {id:'watch',name:'Apple Watch Series 12',category:'Watch',tag:'A little motivation. Every day.',badge:'NEW',price:39900,card:'card-watch.webp',image:'detail-watch.jpg',thumb:'nav-watch.webp',dark:false,lead:[2,3],description:'A fresh face for your everyday. Choose a finish and a connection that feels like you.',colors:[{name:'Dark Bronze',hex:'#665647'},{name:'Jet Black',hex:'#303033'},{name:'Silver',hex:'#d5d6d6'}],optionName:'Connectivity',options:[['GPS',0],['GPS + Cellular',10000]],care:7900},
  {id:'airpods',name:'AirPods 5',category:'AirPods',tag:'Your world. A little quieter.',badge:'NEW',price:12900,card:'card-airpods.webp',image:'nav-airpods.webp',thumb:'nav-airpods.webp',dark:false,lead:[1,3],description:'The little things that make every playlist, walk, and quiet moment better.',colors:[{name:'White',hex:'#f4f4f4'}],optionName:'Model',options:[['AirPods 5',0],['With Active Noise Cancellation',5000]],care:2900},
  {id:'vision',name:'Apple Vision Pro',category:'Vision',tag:'A space for your imagination.',badge:'EXPLORE',price:349900,card:null,image:'nav-vision.webp',thumb:'nav-vision.webp',dark:false,lead:[4,6],description:'Dream a little bigger. Create your own space for the things you love.',colors:[{name:'Silver',hex:'#d6d8d9'}],optionName:'Storage',options:[['256GB',0],['512GB',20000],['1TB',40000]],care:49900}
];
export const CATEGORIES = [{name:'Mac',image:'nav-mac.webp'},{name:'iPhone',image:'nav-iphone.webp'},{name:'iPad',image:'nav-ipad.webp'},{name:'Watch',label:'Apple Watch',image:'nav-watch.webp'},{name:'AirPods',image:'nav-airpods.webp'},{name:'Vision',label:'Apple Vision Pro',image:'nav-vision.webp'}];
for(const p of CATALOG){const d=PRODUCT_DETAILS[p.id];if(d){p.gallery=d.gallery;p.colorGalleries=d.colorGalleries;p.groups=d.groups.filter(g=>!(p.optionName==='Connectivity'&&g.id.includes('connection'))&&!(p.optionName==='Model'&&g.id.includes('model')));if(d.options.length>1){p.options=d.options;p.optionName=d.optionName;}if(p.id==='vision'){p.price=d.price;p.image=d.image;}for(const color of d.colors){if(!p.colors.some(c=>c.name===color.name))p.colors.push(color);}p.tag=d.tag||p.tag;p.badge=d.badge;p.card=d.card||p.card;p.dark=d.dark;p.monthly=d.monthly;p.lease=d.lease;}}
CATALOG.push(...EXTRA_PRODUCTS);
const duo=CATALOG.find(p=>p.id==='duo');duo.options=[['256GB',0],['512GB',20000],['1TB',60000],['2TB',120000]];
for(const p of CATALOG)if(!p.groups)p.groups=[];
export const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
export const initialState = () => ({version:1,balance:2500000,bag:[],saved:[],orders:[],clockOffset:0,sound:true});
export const MAX_BALANCE = 100000000000;
export function addWalletFunds(state, amount) {
  const value=String(amount).trim();
  if(!/^(?:\d+)(?:\.\d{1,2})?$/.test(value))throw new Error('Enter an amount with up to two decimal places.');
  const [whole,fraction='']=value.split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents)||cents<=0)throw new Error('Enter an amount greater than $0.00.');
  if(cents>MAX_BALANCE-state.balance)throw new Error('Your balance can be up to $1,000,000,000.00.');
  return {...state,balance:state.balance+cents};
}
export const resetWalletBalance = state => ({...state,balance:0});
export function deliveryAddress(value={}) {
  const fields={street:120,apartment:80,city:80,region:80,postalCode:24,country:80};
  return Object.fromEntries(Object.entries(fields).map(([key,max])=>[key,String(value?.[key]||'').trim().slice(0,max)]));
}
export function selection(id,color=0,option=0,care=false,choices={}) {
  const p=CATALOG.find(p=>p.id===id);
  if(!p || !p.colors[color] || !p.options[option])throw new Error('Choose a valid product configuration.');
  const chosen={};
  for(const group of p.groups||[]){if(choices[group.id]!==undefined){const value=choices[group.id];if(!Number.isInteger(value)||!group.options[value])throw new Error('Choose a valid product configuration.');chosen[group.id]=value;}}
  if(Object.keys(choices).some(key=>!p.groups?.some(g=>g.id===key)))throw new Error('Choose a valid product configuration.');
  return {productId:id,color,option,care:!!care,...(Object.keys(chosen).length?{choices:chosen}:{})};
}
export function itemPrice(item) {
  const clean=selection(item.productId,item.color,item.option,item.care,item.choices||{});
  const p=CATALOG.find(p=>p.id===clean.productId);
  return p.price+p.options[clean.option][1]+(clean.care?p.care:0)+Object.entries(clean.choices||{}).reduce((sum,[key,value])=>sum+p.groups.find(g=>g.id===key).options[value].add,0);
}
export function totals(items,shipping='standard') {
  if(!['standard','express'].includes(shipping))throw new Error('Choose a delivery option.');
  const subtotal=items.reduce((sum,item)=>{const qty=item.qty??1;if(!Number.isInteger(qty)||qty<1||qty>10)throw new Error('Choose a quantity between 1 and 10.');return sum+itemPrice(item)*qty;},0);
  const tax=Math.round(subtotal*0.0825);
  const delivery=items.length&&shipping==='express'?1500:0;
  return {subtotal,tax,delivery,total:subtotal+tax+delivery};
}
// Calendar arithmetic preserves local wall time through daylight-saving changes.
export function addBusinessDays(date,count) {
  const d=new Date(date);
  while(count>0){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)count--;}
  return d;
}
export function deliveryWindow(items,shipping='standard',date=new Date()) {
  const leads=items.map(i=>CATALOG.find(p=>p.id===i.productId).lead);
  const min=Math.max(1,...leads.map(l=>l[0]))-(shipping==='express'?1:0);
  const max=Math.max(2,...leads.map(l=>l[1]))-(shipping==='express'?1:0);
  const start=addBusinessDays(date,Math.max(1,min));start.setHours(8,0,0,0);
  const end=addBusinessDays(date,Math.max(2,max));end.setHours(19,0,0,0);
  return {start:start.toISOString(),end:end.toISOString()};
}
export const dateLabel = (date,full=false) => new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',...(full?{year:'numeric'}:{})}).format(new Date(date));
export const windowLabel = window => `${dateLabel(window.start)} – ${dateLabel(window.end)}`;
export function placeOrder(state,shipping='standard',nickname='You',date=new Date(),id='PS'+Date.now().toString(36).toUpperCase(),address={}) {
  if(!state.bag.length)throw new Error('Your bag is empty. Find something you love first.');
  const bill=totals(state.bag,shipping);
  if(state.balance<bill.total)throw new Error('Your wallet needs a top-up. Add some funds and try again.');
  const order={id,created:new Date(date).toISOString(),items:structuredClone(state.bag).map(i=>({...i,unitPrice:itemPrice(i)})),shipping,address:deliveryAddress(address),nickname:String(nickname||'You').trim().slice(0,40)||'You',...bill,shippingCost:bill.delivery,delivery:deliveryWindow(state.bag,shipping,date),cancelled:false,opened:false};
  return {state:{...state,balance:state.balance-bill.total,bag:[],orders:[order,...state.orders]},order};
}
export function stages(order) {
  const created=new Date(order.created);
  const received={name:'Order placed',date:created.toISOString(),detail:'Your order is in. Let the anticipation begin.'};
  const processing=addBusinessDays(created,1);processing.setHours(10,0,0,0);
  const arrival=new Date(order.delivery.end);
  const shipped=addBusinessDays(created,Math.max(1,Math.max(...order.items.map(i=>CATALOG.find(p=>p.id===i.productId).lead[0]))-(order.shipping==='express'?2:1)));shipped.setHours(15,0,0,0);
  const out=new Date(arrival);out.setHours(8,0,0,0);
  const delivered=new Date(arrival);delivered.setHours(16,30,0,0);
  return [received,{name:'Processing',date:processing.toISOString(),detail:'Getting your order ready. Every detail, just right.'},{name:'Shipped',date:shipped.toISOString(),detail:'Your package is on its way to your doorstep.'},{name:'Out for delivery',date:out.toISOString(),detail:'Today is the day. Your delivery is getting close.'},{name:'Delivered',date:delivered.toISOString(),detail:'A little box. A big moment. Ready when you are.'}].map((stage,i,list)=>i&&new Date(stage.date)<=new Date(list[i-1].date)?{...stage,date:new Date(new Date(list[i-1].date).getTime()+3600000).toISOString()}:stage);
}
export function orderStatus(order,date=new Date()) {
  if(order.cancelled)return {name:'Cancelled',index:-1};
  const timeline=stages(order);let index=0;
  timeline.forEach((s,i)=>{if(new Date(s.date)<=new Date(date))index=i;});
  return {...timeline[index],index};
}
export function cancelOrder(state,id,date=new Date()) {
  const order=state.orders.find(o=>o.id===id);
  if(!order||order.cancelled)throw new Error('This order has already been cancelled.');
  if(orderStatus(order,date).index>=2)throw new Error('This order has already shipped.');
  return {...state,balance:state.balance+order.total,orders:state.orders.map(o=>o.id===id?{...o,cancelled:true}:o)};
}
function legacyUnitPrice(item){const old={duo:[199900,[0,20000,40000,80000],19900],iphone:[119900,[0,20000,40000],19900],mac:[199900,[0,20000,60000],27900],ipad:[69900,[0,10000,30000],7900],watch:[39900,[0,10000],7900],airpods:[12900,[0,5000],2900],vision:[349900,[0,20000,40000],49900]}[item.productId];return old?old[0]+(old[1][item.option]||0)+(item.care?old[2]:0):itemPrice(item);}
export function restoreState(raw) {
  const fresh=initialState();
  try {
    const s=JSON.parse(raw);
    if(s.version!==1||!Number.isSafeInteger(s.balance)||s.balance<0||!Array.isArray(s.bag)||!Array.isArray(s.orders))return fresh;
    const valid=i=>{try{return itemPrice(i)>0&&Number.isInteger(i.qty)&&i.qty>0&&i.qty<=10;}catch{return false;}};
    return {...fresh,...s,balance:Math.min(s.balance,100000000000),bag:s.bag.filter(valid),saved:Array.isArray(s.saved)?s.saved.filter(id=>CATALOG.some(p=>p.id===id)):[],orders:s.orders.filter(o=>Array.isArray(o.items)&&o.items.length&&o.items.every(valid)&&Number.isSafeInteger(o.total)&&o.total>=0&&Number.isFinite(Date.parse(o.created))&&Number.isFinite(Date.parse(o.delivery?.end))&&Number.isFinite(Date.parse(o.delivery?.start))).map(o=>({...o,...(o.address?{address:deliveryAddress(o.address)}:{}),items:o.items.map(i=>({...i,unitPrice:Number.isSafeInteger(i.unitPrice)?i.unitPrice:legacyUnitPrice(i)}))})),clockOffset:Number.isFinite(s.clockOffset)&&s.clockOffset>=0?Math.min(s.clockOffset,315360000000):0,sound:typeof s.sound==='boolean'?s.sound:true};
  }catch{return fresh;}
}

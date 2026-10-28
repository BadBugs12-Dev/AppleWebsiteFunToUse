import {renderStore,renderProduct,renderCatalogCard,renderInfo,initPresentation,refreshPresentation,closeNav} from './replica.js';
import {CATALOG,CATEGORIES,money,initialState,selection,itemPrice,totals,deliveryWindow,dateLabel,windowLabel,placeOrder,orderStatus,stages,cancelOrder,restoreState,addWalletFunds,resetWalletBalance} from './model.js';

const KEY='apple-shopping-playground-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
 bag:'<path d="M6 7h12l1 14H5L6 7Zm3 0V5a3 3 0 0 1 6 0v2"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 arrow:'<path d="m9 5 7 7-7 7"/>',
 heart:'<path d="M20.5 5.5a5 5 0 0 0-7.1 0L12 7l-1.4-1.5a5 5 0 0 0-7.1 7.1L12 21l8.5-8.4a5 5 0 0 0 0-7.1Z"/>',
 truck:'<path d="M2 5h12v13H2V5Zm12 5h4l4 4v4h-8"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 box:'<path d="m3 7 9-5 9 5v11l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v11M7.5 4.5l9 5"/>',
 wallet:'<rect x="2" y="5" width="20" height="15" rx="3"/><path d="M17 10h5v6h-5a3 3 0 0 1 0-6ZM4 5l13-3v3"/>',
 return:'<path d="m8 4-5 5 5 5M3 9h12a6 6 0 0 1 0 12h-3"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 menu:'<path d="M5 8h14M5 16h14"/>',
 sparkle:'<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z"/>'
};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.box}</svg>`;
const image=(file,alt,cls='',lazy=true)=>`<img src="/assets/${file}" alt="${esc(alt)}" class="${cls}" ${lazy?'loading="lazy"':''} decoding="async">`;
const product=id=>CATALOG.find(p=>p.id===id);
const now=()=>new Date(Date.now()+state.clockOffset);
let storageAvailable=true;
let state;
try{state=restoreState(localStorage.getItem(KEY));}catch{state=initialState();storageAvailable=false;}
let draft={color:0,option:0,care:false,choices:{},gallery:0};
let checkoutDraft={shipping:'standard',nickname:'You',street:'',apartment:'',city:'',region:'',postalCode:'',country:'United States'};
let processing=false;
let toastTimer;
let audioContext;
let lastRoute='';

function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageAvailable=false;toast('Browser storage is unavailable. Keep this tab open to retain this session.');}updateHeader();}
function updateHeader(){
  $('#wallet-balance').textContent=money(state.balance);
  const count=state.bag.reduce((n,i)=>n+i.qty,0);
  $('#bag-count').textContent=count;$('#bag-count').hidden=!count;
  $('#bag-link').setAttribute('aria-label',`Shopping bag, ${count} ${count===1?'item':'items'}`);
}
function toast(message,bag=false){clearTimeout(toastTimer);$('#toast').innerHTML=`${icon('check')}<span>${esc(message)}</span>${bag?'<a href="#bag">View bag ›</a>':''}`;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000);}
function modal(title,html){$('#modal-title').textContent=title;$('#modal-content').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();}
function closeModal(){$('#modal').close();}
function sound(){
  if(!state.sound)return;
  try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();[523.25,659.25,783.99,1046.5].forEach((f,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+i*.09;osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.065,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.8);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.85);});}catch{}
}
function celebrate(){
  sound();if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  $('#confetti').innerHTML=Array.from({length:42},(_,i)=>`<i style="--x:${Math.random()*100}vw;--r:${Math.random()*600-300}deg;--delay:${Math.random()*.35}s;--c:${['#0071e3','#a9c9ee','#b1a5e5','#ddc495','#dfadbd'][i%5]}"></i>`).join('');setTimeout(()=>$('#confetti').replaceChildren(),4000);
}
function details(item){const p=product(item.productId);const extra=Object.entries(item.choices||{}).map(([key,value])=>p.groups?.find(g=>g.id===key)?.options[value]?.label).filter(Boolean).join(' · ');return `${p.colors[item.color].name} · ${p.options[item.option][0]}${item.care?' · AppleCare+':''}${extra?' · '+extra:''}${item.engraving?' · Engraving: '+item.engraving:''}`;}
function uiContext(){return {state,draft,now,icon,image,money,modal};}
function card(p){return renderCatalogCard(p);}
function storeView(category){return renderStore(category,uiContext());}
function productView(id){return renderProduct(id,uiContext());}
function lineItem(item,editable=false){const p=product(item.productId);return `<article class="bag-item">${image(p.colors[item.color].image||p.thumb,p.name,'bag-image')}<div class="bag-item-content"><a href="#product/${p.id}"><h2>${p.name}</h2></a><p>${esc(details(item))}</p>${item.care?'<span class="care-tag">AppleCare+ included</span>':''}<span class="item-delivery">${icon('truck')} Free delivery</span>${editable?`<button class="text-button remove-item" data-action="remove" data-id="${item.id}">Remove</button>`:''}</div><div class="bag-item-price"><strong>${money((!editable&&item.unitPrice!==undefined?item.unitPrice:itemPrice(item))*item.qty)}</strong>${editable?`<div class="quantity-control"><button data-action="quantity" data-id="${item.id}" data-delta="-1" aria-label="Decrease ${p.name} quantity" ${item.qty===1?'disabled':''}>−</button><span aria-label="Quantity">${item.qty}</span><button data-action="quantity" data-id="${item.id}" data-delta="1" aria-label="Increase ${p.name} quantity" ${item.qty===10?'disabled':''}>+</button></div>`:`<small>Quantity: ${item.qty}</small>`}</div></article>`;}
function billRows(bill){const delivery=typeof bill.delivery==='number'?bill.delivery:(bill.shippingCost||0);return `<div class="bill-row"><span>Subtotal</span><span>${money(bill.subtotal)}</span></div><div class="bill-row"><span>Shipping</span><span>${delivery?money(delivery):'FREE'}</span></div><div class="bill-row muted"><span>Estimated tax (8.25%)</span><span>${money(bill.tax)}</span></div><div class="bill-total"><span>Total</span><strong>${money(bill.total)}</strong></div>`;}
function bagView(){
  if(!state.bag.length)return emptyView('Your bag is empty.','A little browsing could change that.',icon('bag'));
  const bill=totals(state.bag);
  return `<div class="page-width bag-page"><header class="page-heading"><h1>Your bag. <span>A great choice.</span></h1><p>Free delivery on everything in your bag.</p></header><div class="bag-layout"><section aria-label="Items in your bag">${state.bag.map(i=>lineItem(i,true)).join('')}<a href="#store" class="text-button continue-shopping">Continue shopping ›</a></section><aside class="bill-card"><h2>Bag summary</h2>${billRows(bill)}<p class="balance-line">Wallet balance <strong>${money(state.balance)}</strong></p><a href="#checkout" class="button full-width">Check Out</a><p class="secure-note">${icon('lock')} Paid from your store wallet</p></aside></div><div class="bag-footnote">${icon('box')} Beautiful things. Carefully packed. Something to look forward to.</div></div>`;
}
function addressFields(){return `<div class="delivery-address-fields">${[['street','Street address',120],['apartment','Apartment, suite, etc. (optional)',80],['city','City',80],['region','State / Province',80],['postalCode','ZIP / Postal code',24],['country','Country / Region',80]].map(([key,label,max])=>`<div class="address-field address-${key}"><label for="address-${key}">${label}</label><input id="address-${key}" name="${key}" data-address="${key}" maxlength="${max}" autocomplete="off" value="${esc(checkoutDraft[key])}" ${key==='apartment'?'':'required'}></div>`).join('')}</div>`;}
function addressMarkup(address){if(!address?.street)return '<p>Delivery address on file</p>';return `<p>${[address.street,address.apartment,[address.city,address.region,address.postalCode].filter(Boolean).join(', '),address.country].filter(Boolean).map(esc).join('<br>')}</p>`;}
function checkoutView(){
  if(!state.bag.length)return emptyView('Your bag is empty.','Choose something you love before checking out.');
  const bill=totals(state.bag,checkoutDraft.shipping),delivery=deliveryWindow(state.bag,checkoutDraft.shipping,now());
  return `<div class="checkout-header"><div class="page-width"><h1>Checkout</h1><a href="#bag" class="text-button">Show order summary: ${money(bill.total)} ${icon('bag')}</a></div></div><div class="page-width checkout-page"><form id="checkout-form"><div class="checkout-layout"><div class="checkout-steps"><section class="checkout-section"><span class="step-number">1</span><div><h2>Where should we send it?</h2><div class="address-card"><label for="nickname">Name on your package</label><input id="nickname" name="nickname" maxlength="40" autocomplete="off" value="${esc(checkoutDraft.nickname)}" placeholder="Your name or nickname">${addressFields()}</div></div></section><section class="checkout-section"><span class="step-number">2</span><div><h2>How would you like to get it?</h2><div class="shipping-options">${['standard','express'].map(s=>{const win=deliveryWindow(state.bag,s,now());return `<label class="shipping-option ${checkoutDraft.shipping===s?'active':''}"><input type="radio" name="shipping" value="${s}" ${checkoutDraft.shipping===s?'checked':''}><span><strong>${s==='standard'?'Standard delivery':'Express delivery'}</strong><small>${windowLabel(win)}</small></span><strong>${s==='standard'?'FREE':money(1500)}</strong></label>`;}).join('')}</div><p class="small muted">Delivery estimates use weekdays and update with your order.</p></div></section><section class="checkout-section"><span class="step-number">3</span><div><h2>How would you like to pay?</h2><div class="payment-card"><div class="payment-logo">${icon('wallet')}</div><div><strong>Store Wallet</strong><small>•••• 0420 · ${money(state.balance)} available</small></div>${icon('check','blue')}</div><button type="button" data-action="wallet" class="text-button">Add to your balance ›</button></div></section><section class="checkout-section review-section"><span class="step-number">4</span><div><h2>One last look.</h2>${state.bag.map(i=>lineItem(i)).join('')}</div></section></div><aside class="bill-card checkout-summary"><h2>Your order</h2>${billRows(bill)}<div class="arrival-summary">${icon('truck')}<span>Arriving<br><strong>${windowLabel(delivery)}</strong></span></div>${state.balance<bill.total?`<div class="insufficient"><p>Your wallet needs ${money(bill.total-state.balance)} more.</p><button type="button" data-action="wallet" class="text-button">Top up your wallet ›</button></div>`:''}<button type="submit" class="button full-width" id="place-order" ${state.balance<bill.total?'disabled':''}>Place your order</button><p class="secure-note">${icon('lock')} Pay ${money(bill.total)} with your store wallet</p><a href="#bag" class="text-button">Return to bag</a></aside></div></form></div>`;
}
function confirmationView(id){const order=state.orders.find(o=>o.id===id);if(!order)return emptyView('Order not found.','Your orders are saved in the browser where you placed them.');return `<div class="page-width confirmation-page"><div class="success-circle">${icon('check')}</div><p class="eyebrow">ORDER CONFIRMED</p><h1>Good things<br>are on their way.</h1><p class="confirmation-subtitle">Thank you${order.nickname==='You'?'':', '+esc(order.nickname)}. We’re getting your order ready.</p><div class="confirmation-arrival">${icon('truck')}<div><span>Look forward to</span><strong>${windowLabel(order.delivery)}</strong></div></div><div class="confirmation-products">${order.items.map(i=>image(product(i.productId).colors[i.color].image||product(i.productId).thumb,product(i.productId).name)).join('')}</div><div class="confirmation-meta"><span>Order number <strong>${order.id}</strong></span><span>Total <strong>${money(order.total)}</strong></span></div><div class="confirmation-buttons"><a href="#order/${order.id}" class="button">Track your order</a><a href="#store" class="text-button">Keep exploring ›</a></div><p class="small muted">Your confirmation is saved in Orders. No email needed.</p></div>`;}
function orderCard(order){const status=orderStatus(order,now()),p=product(order.items[0].productId);return `<article class="order-card"><div class="order-card-top"><div><strong>${order.id}</strong><span>Placed ${dateLabel(order.created,true)}</span></div><span class="status-badge ${status.index===4?'delivered':''} ${order.cancelled?'cancelled':''}">${status.name}</span></div><div class="order-card-body">${image(p.colors[order.items[0].color].image||p.thumb,p.name)}<div><h2>${p.name}${order.items.length>1?` <span>+ ${order.items.length-1} more</span>`:''}</h2><p>${order.cancelled?'Refunded to your wallet':status.index===4?'Delivered '+dateLabel(order.delivery.end):'Arrives '+windowLabel(order.delivery)}</p><strong>${money(order.total)}</strong></div><a href="#order/${order.id}" class="text-button">View order ${icon('arrow')}</a></div></article>`;}
function clockBanner(){return state.clockOffset?`<div class="clock-banner">${icon('sparkle')} Your store clock is ${dateLabel(now())}. <button data-action="reset-clock" class="text-button">Return to today</button></div>`:'';}
function ordersView(){if(!state.orders.length)return emptyView('Your next chapter is waiting.','When you find something you love, your orders will be right here.',icon('box'));return `<div class="page-width orders-page"><header class="page-heading"><h1>Your orders.</h1><p>A little anticipation. All in one place.</p></header>${clockBanner()}<div class="orders-list">${state.orders.map(orderCard).join('')}</div></div>`;}
function orderView(id){
  const order=state.orders.find(o=>o.id===id);if(!order)return emptyView('Order not found.','Your orders are saved in the browser where you placed them.');
  const status=orderStatus(order,now()),timeline=stages(order),next=timeline[status.index+1];
  return `<div class="page-width order-detail"><a href="#orders" class="text-button">‹ All orders</a><header class="order-detail-heading"><div><span class="eyebrow">ORDER ${order.id}</span><h1>${order.cancelled?'Order cancelled.':status.index===4?'It’s here. Enjoy the moment.':status.index>=2?'A little closer to yours.':'We’re on it.'}</h1><p>${order.cancelled?'Your balance has been refunded. Something else might catch your eye.':status.detail}</p></div><span class="status-badge ${status.index===4?'delivered':''}">${status.name}</span></header>${clockBanner()}${!order.cancelled?`<section class="tracking-panel"><div class="tracking-arrival"><div><span>${status.index===4?'Delivered':'Estimated delivery'}</span><h2>${status.index===4?dateLabel(order.delivery.end):windowLabel(order.delivery)}</h2><p>${order.shipping==='express'?'Express':'Standard'} delivery · Your doorstep</p></div>${icon(status.index===4?'check':'truck')}</div><ol class="timeline">${timeline.map((step,i)=>`<li class="${i<=status.index?'complete':''} ${i===status.index?'current':''}"><span class="timeline-dot">${i<status.index?icon('check'):''}</span><strong>${step.name}</strong><span>${i<=status.index?dateLabel(step.date):'Coming up'}</span></li>`).join('')}</ol>${status.index>=2?`<div class="tracking-number"><span>Tracking number</span><strong>1Z${order.id.slice(2)}US</strong></div>`:''}${status.index===4?`<a href="#unbox/${order.id}" class="button">${order.opened?'Relive the unboxing':'Open your package'}</a>`:next?`<div class="fast-forward"><span>${icon('sparkle')} Can’t wait?</span><button data-action="advance" data-id="${order.id}" class="text-button">Skip ahead to “${next.name}” ›</button></div>`:''}</section>`:''}<div class="order-detail-grid"><section class="order-items"><h2>What’s in your order</h2>${order.items.map(i=>lineItem(i)).join('')}</section><aside class="bill-card"><h2>Order details</h2><p class="small muted">Placed ${dateLabel(order.created,true)}</p>${billRows(order)}<div class="order-address"><strong>Shipping to ${esc(order.nickname)}</strong>${addressMarkup(order.address)}</div><p class="payment-info">${icon('wallet')} Paid with Store Wallet</p>${!order.cancelled&&status.index<2?`<button data-action="cancel-prompt" data-id="${order.id}" class="text-button">Cancel order</button>`:''}<button data-action="buy-again" data-id="${order.id}" class="text-button buy-again">Buy again ›</button></aside></div></div>`;
}
function unboxView(id){const o=state.orders.find(o=>o.id===id);if(!o)return emptyView('Package not found.','Check your orders to find your next delivery.');if(orderStatus(o,now()).index!==4)return `<div class="page-width empty-state"><h1>A little more anticipation.</h1><p>Your package will be ready to open after delivery.</p><a class="button" href="#order/${o.id}">Track your order</a></div>`;const p=product(o.items[0].productId);return `<div class="unbox-page"><a href="#order/${o.id}" class="text-button">‹ Back to your order</a><p class="eyebrow">THE MOMENT IS YOURS</p><h1>${o.opened?'Hello, '+p.name+'.':'Something wonderful is inside.'}</h1><p>${o.opened?'Take a moment. You picked a good one.':'One little lid. A whole lot to look forward to.'}</p><button class="unbox-stage ${o.opened?'opened':''}" data-action="unbox" data-id="${o.id}" aria-label="${o.opened?'Celebrate your new '+p.name:'Lift the lid of your package'}"><span class="package-base"></span><span class="package-product">${image(p.colors[o.items[0].color].image||p.thumb,p.name)}</span><span class="package-lid">${image(p.thumb,p.name)}<span>${p.name}</span></span></button><button class="button" data-action="unbox" data-id="${o.id}">${o.opened?'That new Apple feeling. Again.':'Lift the lid'}</button><a href="#store" class="text-button unbox-explore">Find your next favorite ›</a></div>`;}
function savedView(){const saved=CATALOG.filter(p=>state.saved.includes(p.id));return saved.length?`<div class="store-content saved-page"><header class="page-heading"><h1>Your saves.</h1><p>Good taste. Great possibilities.</p></header><div class="saved-grid">${saved.map(card).join('')}</div></div>`:emptyView('Keep the things you love.','Tap the heart on any product to save it for later.',icon('heart'));}
function emptyView(title,text,art=icon('bag')){return `<div class="page-width empty-state"><div class="empty-art">${art}</div><h1>${title}</h1><p>${text}</p><a href="#store" class="button">Explore the store</a></div>`;}
function render(){
  const route=location.hash.slice(1)||'store';const [page,id]=route.split('/');
  if(page==='product'&&lastRoute!==route)draft={color:0,option:0,care:false,choices:{},gallery:0};
  if(page!=='checkout')processing=false;
  const views={info:()=>renderInfo(id,uiContext()),store:()=>storeView(),category:()=>storeView(decodeURIComponent(id||'')),product:()=>productView(id),bag:bagView,checkout:checkoutView,confirmation:()=>confirmationView(id),orders:ordersView,order:()=>orderView(id),unbox:()=>unboxView(id),saved:savedView};
  $('#main').innerHTML=(views[page]||views.store)();
  document.body.dataset.page=page;document.title=page==='product'&&product(id)?`Buy ${product(id).name} - Apple Store`:`${({bag:'Bag',checkout:'Checkout',orders:'Your Orders',order:'Order Details',confirmation:'Thank You',saved:'Your Saves',unbox:'Hello'}[page])||'Store'} - Apple`;
  document.querySelectorAll('.nav-category').forEach(a=>a.classList.toggle('current',a.hash===location.hash));
  updateHeader();lastRoute=route;refreshPresentation();
}
function showWallet(){modal('Your wallet.',`<div class="wallet-card"><span>STORE WALLET</span><strong>${money(state.balance)}</strong><small>•••• 0420</small></div><form id="wallet-funds-form" class="wallet-funds-form"><label for="wallet-amount">Add to your balance</label><div class="wallet-amount-row"><span class="wallet-currency" aria-hidden="true">$</span><input id="wallet-amount" name="amount" type="text" inputmode="decimal" autocomplete="off" maxlength="16" placeholder="0.00" aria-describedby="wallet-error" required><button class="button" type="submit">Add funds</button></div><p id="wallet-error" class="wallet-error" role="alert"></p></form><div class="wallet-settings"><label><input type="checkbox" id="sound-toggle" ${state.sound?'checked':''}> A little sound when your order is confirmed</label><div class="wallet-bottom-row"><a href="#orders" class="text-button" data-action="close-link">View your orders ›</a><button type="button" data-action="reset-balance" class="wallet-reset" aria-label="Reset balance to zero" title="Reset balance to $0.00">Reset</button></div></div>${state.clockOffset?`<button data-action="reset-clock" class="text-button">Return to today</button>`:''}`);}
function latestState(){if(storageAvailable){const raw=localStorage.getItem(KEY);if(raw)return restoreState(raw);}return state;}
function showSearch(){modal('Find your next favorite.',`<label class="search-field">${icon('search')}<input id="search-input" placeholder="Search products" aria-label="Search products" autocomplete="off"></label><div class="search-results">${searchResults('')}</div>`);setTimeout(()=>$('#search-input')?.focus(),0);}
function searchResults(q){const results=CATALOG.filter(p=>(p.name+' '+p.category+' '+p.tag).toLowerCase().includes(q.trim().toLowerCase()));return results.length?results.map(p=>`<a href="#product/${p.id}" class="search-result" data-action="close-link">${image(p.thumb,p.name)}<span><strong>${p.name}</strong><small>From ${money(p.price)}</small></span>${icon('arrow')}</a>`).join(''):'<p class="no-results">No matches yet. Try iPhone, Mac, or AirPods.</p>';}

document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-action]');if(!trigger)return;
  const {action,id,index}=trigger.dataset;
  if(action==='close-link'){closeModal();return;}
  if(trigger.tagName!=='A')e.preventDefault();
  if(action==='close-modal'){closeModal();return;}
  if(action==='wallet'){showWallet();return;}
  if(action==='search'){showSearch();return;}
  if(action==='about'){modal('Shopping help.',`<div class="help-content"><h3>Your next favorite.</h3><p>Choose your product, finish, and configuration, then review your bag and check out.</p><h3>Your balance.</h3><p>Open Account from the bag menu to add a custom amount or reset your balance.</p><h3>Your orders.</h3><p>Find your delivery estimate, shipment updates, and order details in Orders.</p></div>`);return;}
  if(action==='menu'){modal('Explore the store.',`<div class="mobile-links"><a href="#store" data-action="close-link">Store</a>${CATEGORIES.map(c=>`<a href="#category/${c.name}" data-action="close-link">${c.label||c.name}</a>`).join('')}<a href="#orders" data-action="close-link">Your Orders</a><a href="#saved" data-action="close-link">Your Saves</a></div>`);return;}
  if(action==='save'){state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];save();render();toast(state.saved.includes(id)?'Saved for another little moment.':'Removed from your saves.');return;}
  if(action==='color'||action==='option'){draft[action]=Number(index);if(action==='color'){draft.gallery=0;draft.galleryColor=draft.color;}const scroll=window.scrollY;render();window.scrollTo(0,scroll);return;}
  if(['extra','gallery-prev','gallery-next','gallery-dot','payment-choice','carrier','care-select'].includes(action)){
    if(action==='extra'){draft.choices||={};draft.choices[trigger.dataset.key]=Number(index);}
    if(action==='gallery-prev')draft.gallery=Math.max(0,(draft.gallery||0)-1);
    if(action==='gallery-next')draft.gallery=Math.min(Number(trigger.dataset.count)-1,(draft.gallery||0)+1);
    if(action==='gallery-dot')draft.gallery=Number(index);
    if(action==='payment-choice')draft.payment=trigger.dataset.value;
    if(action==='carrier')draft.carrier=Number(index);
    if(action==='care-select')draft.care=trigger.dataset.value==='yes';
    const scroll=window.scrollY;render();window.scrollTo(0,scroll);return;
  }
  if(action==='engraving-open'){modal('Make it yours.',`<p class="small muted">Add a little something that is unmistakably you.</p><label class="engraving-label" for="engraving-input">Your engraving</label><input id="engraving-input" maxlength="24" autocomplete="off" value="${esc(draft.engraving||'')}" placeholder="A name, emoji, or a little inspiration"><button class="button full-width" data-action="engraving-apply">Save engraving</button><p class="small muted">Free engraving. Saved with your order.</p>`);return;}
  if(action==='engraving-apply'){draft.engraving=$('#engraving-input').value.trim().slice(0,24);closeModal();const scroll=window.scrollY;render();window.scrollTo(0,scroll);return;}
  if(action==='care'){draft.care=!draft.care;const scroll=window.scrollY;render();window.scrollTo(0,scroll);return;}
  if(action==='add-to-bag'){
    const item={...selection(id,draft.color,draft.option,draft.care,draft.choices||{}),carrier:draft.carrier||0,payment:draft.payment||'buy',engraving:draft.engraving||''};const existing=state.bag.find(i=>i.productId===id&&i.color===draft.color&&i.option===draft.option&&i.care===draft.care&&JSON.stringify(i.choices||{})===JSON.stringify(item.choices||{})&&(i.carrier||0)===(item.carrier||0)&&(i.payment||'buy')===item.payment&&(i.engraving||'')===item.engraving);
    if(existing&&existing.qty>=10){toast('You can add up to 10 of each configuration.');return;}
    if(existing)existing.qty++;else state.bag.push({...item,id:crypto.randomUUID(),qty:1});save();
    modal('A great choice.',`<div class="added-product">${image(product(id).colors[draft.color].image||product(id).thumb,product(id).name)}<h3>${product(id).name} is in your bag.</h3><p>${esc(details(item))}</p></div><a href="#bag" data-action="close-link" class="button full-width">Review Bag (${state.bag.reduce((n,i)=>n+i.qty,0)})</a><button class="text-button full-width added-continue" data-action="close-modal">Continue shopping</button>`);return;
  }
  if(action==='quantity'){const item=state.bag.find(i=>i.id===id);if(item)item.qty=Math.max(1,Math.min(10,item.qty+Number(trigger.dataset.delta)));save();render();return;}
  if(action==='remove'){state.bag=state.bag.filter(i=>i.id!==id);save();render();return;}
  if(action==='reset-balance'){state=resetWalletBalance(latestState());save();render();showWallet();toast('Balance reset to $0.00.');return;}
  if(action==='reset-clock'){state.clockOffset=0;save();if($('#modal').open)closeModal();render();toast('Your store clock is back to today.');return;}
  if(action==='advance'){const o=state.orders.find(o=>o.id===id);if(!o||o.cancelled)return;const next=stages(o)[orderStatus(o,now()).index+1];if(next){state.clockOffset=Math.max(state.clockOffset,new Date(next.date).getTime()-Date.now()+60000);save();render();toast(`Delivery update: ${next.name}`);}return;}
  if(action==='cancel-prompt'){modal('Cancel this order?',`<p>Your order ${esc(id)} will be cancelled, and the full amount will return to your Store Wallet.</p><div class="modal-buttons"><button class="button" data-action="cancel-order" data-id="${id}">Cancel order</button><button class="text-button" data-action="close-modal">Keep my order</button></div>`);return;}
  if(action==='cancel-order'){try{state=cancelOrder(state,id,now());save();closeModal();render();toast('Order cancelled. Your wallet has been refunded.');}catch(err){toast(err.message);}return;}
  if(action==='buy-again'){const o=state.orders.find(o=>o.id===id);if(!o)return;for(const item of o.items){const existing=state.bag.find(i=>i.productId===item.productId&&i.color===item.color&&i.option===item.option&&i.care===item.care);if(existing)existing.qty=Math.min(10,existing.qty+item.qty);else state.bag.push({...item,id:crypto.randomUUID()});}save();location.hash='bag';return;}
  if(action==='unbox'){const o=state.orders.find(o=>o.id===id);if(o&&orderStatus(o,now()).index===4){o.opened=true;save();render();celebrate();}return;}
});
document.addEventListener('change',e=>{
  if(e.target.name==='shipping'){checkoutDraft.shipping=e.target.value;render();}
  if(e.target.id==='sound-toggle'){state.sound=e.target.checked;save();}
});
document.addEventListener('input',e=>{if(e.target.id==='search-input')$('.search-results').innerHTML=searchResults(e.target.value);if(e.target.id==='nickname')checkoutDraft.nickname=e.target.value;if(e.target.dataset.address)checkoutDraft[e.target.dataset.address]=e.target.value;});
document.addEventListener('submit',async e=>{
  if(e.target.id==='wallet-funds-form'){e.preventDefault();try{state=addWalletFunds(latestState(),$('#wallet-amount').value);save();render();showWallet();toast('Your balance has been updated.');}catch(error){$('#wallet-error').textContent=error.message;$('#wallet-amount').setAttribute('aria-invalid','true');$('#wallet-amount').focus();}return;}
  if(e.target.id!=='checkout-form')return;e.preventDefault();if(processing)return;
  processing=true;const btn=$('#place-order');btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Placing your order…';
  await new Promise(resolve=>setTimeout(resolve,1100));
  try{let latest=state;if(storageAvailable){const saved=localStorage.getItem(KEY);if(saved)latest=restoreState(saved);}const result=placeOrder(latest,checkoutDraft.shipping,checkoutDraft.nickname,new Date(Date.now()+latest.clockOffset),'PS'+crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase(),checkoutDraft);state=result.state;save();location.hash='confirmation/'+result.order.id;celebrate();}catch(error){toast(error.message);render();}finally{processing=false;}
});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
window.addEventListener('hashchange',()=>{if($('#modal').open)closeModal();render();window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});});
window.addEventListener('storage',e=>{if(e.key===KEY){state=restoreState(e.newValue);if(!processing)render();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&['orders','order'].includes((location.hash.slice(1)||'').split('/')[0]))render();});
initPresentation(uiContext);
render();if(!storageAvailable)setTimeout(()=>toast('Browser storage is unavailable. This session will not persist after closing the page.'),1000);
setInterval(()=>{if(!document.hidden&&['orders','order'].includes((location.hash.slice(1)||'').split('/')[0])&&!$('#modal').open)render();},60000);

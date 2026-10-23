// Data + business rules (service layer). Replace `act` bodies with REST calls to Spring Boot later.
import {createContext,useContext,useState,ReactNode} from 'react';
export type Line={item:string;qty:number;price:number;disc?:number;recv?:number};
export type Party={code:string;name:string;phone:string;email:string;gst:string;terms:string;status:string};
export type Item={code:string;name:string;cat:string;uom:string;buy:number;sell:number;reorder:number;status:string};
export interface DB{items:Item[];customers:Party[];vendors:Party[];users:any[];stock:Record<string,number>;moves:any[];pos:any[];grns:any[];bills:any[];invs:any[];audits:any[];seq:Record<string,number>;perms:Record<string,Record<string,string[]>>}
export const WH=[{id:'W1',name:'Main Warehouse'},{id:'W2',name:'Production Store'},{id:'W3',name:'Dispatch Store'}];
export const ROLES=['Admin','Purchase Manager','Warehouse Staff','Sales Executive','Accounts','Viewer'];
export const MODS=['dashboard','items','customers','vendors','pos','direct','grn','stock','audit','bills','invoices','reports','users'];
export const ACTS=['view','create','edit','approve','export'];
export const r2=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export const lineAmt=(l:Line)=>r2(l.qty*l.price*(1-(l.disc||0)/100)*1.18);
export const docTotal=(L:Line[])=>r2(L.reduce((s,l)=>s+lineAmt(l),0));
const today=()=>new Date().toISOString().slice(0,10),sk=(i:string,w:string)=>i+'|'+w,bad=(m:string)=>{throw new Error(m)};
const next=(d:DB,p:string)=>`${p}-${new Date().getFullYear()}-${String(d.seq[p]=(d.seq[p]||0)+1).padStart(4,'0')}`;
const mv=(d:DB,item:string,wh:string,qty:number,type:string,ref:string)=>{const k=sk(item,wh),n=r2((d.stock[k]||0)+qty);if(n<0)bad(`Insufficient stock for ${item} in ${wh}`);d.stock[k]=n;d.moves.unshift({date:today(),item,wh,qty,type,ref})};
export const onHand=(d:DB,item:string)=>WH.reduce((s,w)=>s+(d.stock[sk(item,w.id)]||0),0);
export const stockOf=(d:DB,item:string,wh:string)=>d.stock[sk(item,wh)]||0;
const chk=(L:Line[])=>{if(!L.length)bad('Add at least one line');L.forEach(l=>{if(!l.item||!(l.qty>0)||l.price<0)bad('Every line needs an item, a positive quantity and a valid price')})};
const find=(a:any[],no:string)=>a.find(x=>x.no==no)||bad('Record not found');
export const ops={
 save:(d:DB,kind:'items'|'customers'|'vendors',rec:any,edit:boolean)=>{const a:any[]=d[kind];if(!rec.code||!rec.name)bad('Code and name are required');const i=a.findIndex(x=>x.code==rec.code);
  if(edit){a[i]=rec}else{if(i>=0)bad('Duplicate code '+rec.code);a.push(rec);if(kind=='items')mv(d,rec.code,'W1',Number(rec.opening)||0,'Opening','OPEN')}},
 po:(d:DB,vendor:string,L:Line[])=>{if(!vendor)bad('Select a vendor');chk(L);d.pos.unshift({no:next(d,'PO'),date:today(),vendor,status:'Draft',lines:L.map(l=>({...l,recv:0}))})},
 poStatus:(d:DB,no:string,s:string)=>{find(d.pos,no).status=s},
 grn:(d:DB,poNo:string,wh:string,rows:any[],override:boolean)=>{const po=find(d.pos,poNo);if(!['Approved','Partial'].includes(po.status))bad('PO must be approved');
  if(!rows.some(r=>r.rec>0))bad('Enter received quantities');
  rows.forEach(r=>{const l=po.lines.find((x:Line)=>x.item==r.item),pend=l.qty-l.recv;if(r.rec<0||r.acc<0||r.acc>r.rec)bad('Accepted cannot exceed received');if(r.rec>pend&&!override)bad(`${r.item}: received exceeds pending (${pend})`);
   if(r.acc>0){mv(d,r.item,wh,r.acc,'GRN',poNo);l.recv+=r.acc}});
  po.status=po.lines.every((l:Line)=>l.recv>=l.qty)?'Received':'Partial';d.grns.unshift({no:next(d,'GRN'),date:today(),po:poNo,wh,rows:rows.filter(r=>r.rec>0)})},
 direct:(d:DB,vendor:string,wh:string,ref:string,L:Line[])=>{if(!vendor)bad('Select a vendor');chk(L);if(ref&&d.bills.some(b=>b.vendor==vendor&&b.ref==ref))bad('Duplicate invoice reference for this vendor');
  L.forEach(l=>mv(d,l.item,wh,l.qty,'Direct Purchase',ref||'DP'));d.bills.unshift({no:next(d,'PB'),date:today(),vendor,ref,po:'',total:docTotal(L),paid:0,src:'Direct'})},
 bill:(d:DB,poNo:string)=>{const po=find(d.pos,poNo);if(d.bills.some(b=>b.po==poNo))bad('A bill already exists for this PO');const t=docTotal(po.lines.map((l:Line)=>({...l,qty:l.recv})));if(t<=0)bad('Nothing received yet');
  d.bills.unshift({no:next(d,'PB'),date:today(),vendor:po.vendor,ref:'',po:poNo,total:t,paid:0,src:'PO/GRN'})},
 pay:(d:DB,kind:'bills'|'invs',no:string,amt:number)=>{const x=find(d[kind],no);if(kind=='invs'&&x.status!='Confirmed')bad('Confirm the invoice first');if(!(amt>0))bad('Enter a valid amount');if(amt>r2(x.total-x.paid))bad('Payment exceeds outstanding balance');x.paid=r2(x.paid+amt)},
 inv:(d:DB,customer:string,wh:string,L:Line[])=>{if(!customer)bad('Select a customer');chk(L);d.invs.unshift({no:next(d,'SI'),date:today(),customer,wh,status:'Draft',lines:L,total:docTotal(L),paid:0})},
 confirm:(d:DB,no:string)=>{const v=find(d.invs,no);if(v.status!='Draft')bad('Already confirmed');v.lines.forEach((l:Line)=>mv(d,l.item,v.wh,-l.qty,'Sale',no));v.status='Confirmed'},
 transfer:(d:DB,item:string,from:string,to:string,qty:number)=>{if(!item||from==to)bad('Choose an item and two different warehouses');if(!(qty>0))bad('Enter a positive quantity');mv(d,item,from,-qty,'Transfer Out',to);mv(d,item,to,qty,'Transfer In',from)},
 audit:(d:DB,wh:string)=>{d.audits.unshift({no:next(d,'SA'),date:today(),wh,status:'Draft',lines:d.items.map(i=>({item:i.code,sys:stockOf(d,i.code,wh),cnt:stockOf(d,i.code,wh),reason:''}))})},
 auditSubmit:(d:DB,no:string,L:any[])=>{const a=find(d.audits,no);a.lines=L;a.status='Pending'},
 auditApprove:(d:DB,no:string,ok:boolean)=>{const a=find(d.audits,no);if(a.status!='Pending')bad('Audit is not pending');
  if(ok)a.lines.forEach((l:any)=>{const v=r2(l.cnt-stockOf(d,l.item,a.wh));if(v)mv(d,l.item,a.wh,v,'Audit Adj',no)});a.status=ok?'Applied':'Rejected'}};
const NAMES=['MS Plate','SS Pipe','Nut Bolt','Copper Wire','Packing Box','Hydraulic Pump','Bearing 6204','Welding Rod','Paint 20L','Rubber Gasket','Steel Rod','Aluminium Sheet','Lubricant Oil','Control Panel','Cable Tie'];
const party=(p:string,n:string[])=>n.map((x,i)=>({code:p+String(i+1).padStart(3,'0'),name:x,phone:'98765'+(10000+i*111),email:x.split(' ')[0].toLowerCase()+'@mail.com',gst:'27AAAA'+i+'000A1Z5',terms:'Net 30',status:'Active'}));
function seed():DB{const d:DB={items:NAMES.map((n,i)=>({code:'ITM'+String(i+1).padStart(3,'0'),name:n,cat:i<5?'Raw Material':i<10?'Component':'Consumable',uom:i%3?'PCS':'KG',buy:50+i*13,sell:70+i*17,reorder:100,status:'Active'})),
 customers:party('C',['ABC Traders','Shree Enterprises','Om Industries','Global Solutions','Metro Mart']),vendors:party('V',['Steel Corporation','Power Tools Ltd','Electro Supplies','PackWell','Bharat Metals']),
 users:ROLES.map((r,i)=>({id:'U'+i,name:r+' User',email:r.split(' ')[0].toLowerCase()+'@mini-erp.com',role:r,status:'Active',last:'2026-10-2'+i})),stock:{},moves:[],pos:[],grns:[],bills:[],invs:[],audits:[],seq:{},perms:{}};
 d.items.forEach((it,i)=>{mv(d,it.code,'W1',i==3?40:300+i*20,'Opening','OPEN');mv(d,it.code,'W2',i%2?80:0,'Opening','OPEN')});
 ops.po(d,'Steel Corporation',[{item:'ITM001',qty:500,price:90}]);ops.poStatus(d,d.pos[0].no,'Approved');ops.po(d,'Electro Supplies',[{item:'ITM004',qty:200,price:60}]);ops.poStatus(d,d.pos[0].no,'Pending');
 ops.inv(d,'ABC Traders','W1',[{item:'ITM002',qty:20,price:150}]);ops.confirm(d,d.invs[0].no);
 ROLES.forEach(r=>{d.perms[r]={};MODS.forEach(m=>d.perms[r][m]=r=='Admin'?[...ACTS]:r=='Viewer'?['view']:({'Purchase Manager':['dashboard','items','vendors','pos','direct','grn','bills','reports'],'Warehouse Staff':['dashboard','items','grn','stock','audit'],'Sales Executive':['dashboard','items','customers','invoices','reports'],'Accounts':['dashboard','bills','invoices','reports','customers','vendors']} as any)[r].includes(m)?['view','create','edit','export',...(r=='Purchase Manager'&&m=='pos'?['approve']:[])]:[])});return d}
const KEY='mini-erp-db-v1',load=():DB=>{try{return JSON.parse(localStorage.getItem(KEY)||'')}catch{return seed()}};
const Ctx=createContext<any>(null);export const useDB=()=>useContext(Ctx);
export function Provider({children}:{children:ReactNode}){
 const [db,setDb]=useState<DB>(load),[role,setRole]=useState('Admin'),[toast,setToast]=useState<any>(null);
 const save=(d:DB)=>{setDb(d);try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}};
 // act(): runs one atomic, validated transaction; on error nothing changes (no partial stock updates)
 const act=(fn:(d:DB)=>void,ok='Saved')=>{try{const d=structuredClone(db);fn(d);save(d);setToast({m:ok,s:'success'});return true}catch(e:any){setToast({m:e.message,s:'error'});return false}};
 const can=(m:string,a='view')=>(db.perms[role]?.[m]||[]).includes(a);
 return <Ctx.Provider value={{db,act,role,setRole,can,toast,setToast,reset:()=>{const d=seed();save(d);setToast({m:'Demo data reset',s:'info'})}}}>{children}</Ctx.Provider>}

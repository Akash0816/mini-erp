import {useState,useMemo,ReactNode} from 'react';
import {Table,TableHead,TableRow,TableCell,TableBody,TablePagination,TableSortLabel,TextField,Chip,Box,Typography,Button,Dialog,DialogTitle,DialogContent,DialogActions,Paper,MenuItem,IconButton,Stack} from '@mui/material';
import {useDB,Line,lineAmt,docTotal,WH} from './store';
export const money=(n:number)=>'₹ '+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const C:any={Draft:'default',Pending:'warning',Approved:'success',Completed:'success',Received:'success',Confirmed:'success',Paid:'success',Applied:'success',Active:'success',Partial:'info',Open:'info',Rejected:'error',Cancelled:'error',Overdue:'error',Unpaid:'warning'};
export const Status=({s}:{s:string})=><Chip size="small" label={s} color={C[s]||'default'}/>;
export const Head=({t,d,children}:{t:string;d?:string;children?:ReactNode})=><Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}><Box><Typography variant="h5" fontWeight={700}>{t}</Typography><Typography color="text.secondary" variant="body2">{d}</Typography></Box><Stack direction="row" gap={1}>{children}</Stack></Stack>;
export const Kpi=({l,v}:{l:string;v:any})=><Paper variant="outlined" sx={{p:2,flex:'1 1 180px'}}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography variant="h6" fontWeight={700}>{v}</Typography></Paper>;
export const Empty=({m}:{m:string})=><Typography color="text.secondary" p={3} textAlign="center">{m}</Typography>;
export function DataTable({cols,rows,csv}:{cols:{k:string;l:string;r?:(x:any)=>any}[];rows:any[];csv?:string}){
 const {can}=useDB(),[q,setQ]=useState(''),[sk,setSk]=useState(''),[dir,setDir]=useState(1),[pg,setPg]=useState(0);
 const data=useMemo(()=>{let a=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));if(sk)a=[...a].sort((x,y)=>(x[sk]>y[sk]?1:-1)*dir);return a},[rows,q,sk,dir]);
 const exp=()=>{const t=[cols.map(c=>c.l),...data.map(r=>cols.map(c=>r[c.k]))].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download=(csv||'export')+'.csv';a.click()};
 return <Paper variant="outlined"><Stack direction="row" gap={1} p={1.5}><TextField size="small" placeholder="Search..." value={q} onChange={e=>{setQ(e.target.value);setPg(0)}} sx={{flex:1,maxWidth:320}}/>{csv&&<Button onClick={exp} disabled={!can('reports','export')&&!can('items','export')}>Export CSV</Button>}</Stack>
 <Box sx={{overflowX:'auto'}}><Table size="small"><TableHead><TableRow>{cols.map(c=><TableCell key={c.k} sx={{fontWeight:700}}><TableSortLabel active={sk==c.k} direction={dir>0?'asc':'desc'} onClick={()=>{setDir(sk==c.k?-dir:1);setSk(c.k)}}>{c.l}</TableSortLabel></TableCell>)}</TableRow></TableHead>
 <TableBody>{data.slice(pg*8,pg*8+8).map((r,i)=><TableRow key={i} hover>{cols.map(c=><TableCell key={c.k}>{c.r?c.r(r):r[c.k]}</TableCell>)}</TableRow>)}</TableBody></Table>{!data.length&&<Empty m="No records found"/>}</Box>
 <TablePagination component="div" count={data.length} page={pg} rowsPerPage={8} rowsPerPageOptions={[8]} onPageChange={(_,p)=>setPg(p)}/></Paper>}
export function Dlg({open,title,onClose,onOk,okText='Save',children,wide}:{open:boolean;title:string;onClose:()=>void;onOk?:()=>void;okText?:string;children:ReactNode;wide?:boolean}){
 const [busy,setBusy]=useState(false);
 return <Dialog open={open} onClose={onClose} fullWidth maxWidth={wide?'md':'sm'}><DialogTitle>{title}</DialogTitle><DialogContent><Stack gap={2} pt={1}>{children}</Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button>{onOk&&<Button variant="contained" disabled={busy} onClick={()=>{setBusy(true);onOk();setTimeout(()=>setBusy(false),400)}}>{okText}</Button>}</DialogActions></Dialog>}
export const Sel=({l,v,set,o}:{l:string;v:any;set:(x:any)=>void;o:{v:string;l:string}[]})=><TextField select size="small" label={l} value={v} onChange={e=>set(e.target.value)} fullWidth>{o.map(x=><MenuItem key={x.v} value={x.v}>{x.l}</MenuItem>)}</TextField>;
export const Num=({l,v,set}:{l:string;v:any;set:(x:number)=>void})=><TextField size="small" type="number" label={l} value={v} onChange={e=>set(Math.max(0,Number(e.target.value)))} fullWidth/>;
export function Lines({L,set,wh,price}:{L:Line[];set:(l:Line[])=>void;wh?:string;price:'buy'|'sell'}){
 const {db}=useDB(),io=db.items.filter((i:any)=>i.status=='Active').map((i:any)=>({v:i.code,l:`${i.code} · ${i.name}`}));
 const up=(i:number,p:Partial<Line>)=>set(L.map((l,j)=>j==i?{...l,...p}:l));
 return <Box>{L.map((l,i)=><Stack key={i} direction="row" gap={1} mb={1} alignItems="center" flexWrap="wrap"><Box flex="2 1 200px"><Sel l="Item" v={l.item} set={v=>up(i,{item:v,price:db.items.find((x:any)=>x.code==v)[price]})} o={io}/></Box>
 {wh&&<Typography variant="caption" flex="0 0 70px">Avail: {l.item?(db.stock[l.item+'|'+wh]||0):'-'}</Typography>}
 <Box flex="1 1 80px"><Num l="Qty" v={l.qty} set={v=>up(i,{qty:v})}/></Box><Box flex="1 1 90px"><Num l="Price" v={l.price} set={v=>up(i,{price:v})}/></Box><Box flex="1 1 70px"><Num l="Disc %" v={l.disc||0} set={v=>up(i,{disc:v})}/></Box>
 <Typography flex="1 1 100px" variant="body2">{money(lineAmt(l))}</Typography><IconButton size="small" onClick={()=>set(L.length>1?L.filter((_,j)=>j!=i):L)}>✕</IconButton></Stack>)}
 <Button size="small" onClick={()=>set([...L,{item:'',qty:1,price:0}])}>+ Add line</Button><Typography align="right" fontWeight={700}>Subtotal + 18% GST: {money(docTotal(L))}</Typography></Box>}
export const WHopts=WH.map(w=>({v:w.id,l:w.name}));

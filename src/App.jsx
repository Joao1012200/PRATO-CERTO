import React, { useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import {
  LayoutDashboard, Utensils, WalletCards, Calculator, MessagesSquare, Sprout,
  CircleHelp, Settings, Bell, CalendarDays, Package, PieChart, Plus, Search,
  MoreHorizontal, ArrowRight, ArrowLeft, Check, Pencil, ShieldCheck, Store,
  ClipboardCheck, BarChart3, Lightbulb, Video, Handshake, CalendarCheck,
  Camera, Gift, MessageCircle, X, Save, Trash2, Menu, ChevronDown, LogOut, Eye, EyeOff, Boxes, TriangleAlert, CircleCheck, PackagePlus, History, ArrowUpRight, PanelLeftClose, PanelLeftOpen, Minus, Receipt, PackageMinus
} from 'lucide-react'

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

const placeholderImage='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#EEF2F6"/><circle cx="60" cy="60" r="32" fill="none" stroke="#B9D9E6" stroke-width="8"/><circle cx="60" cy="60" r="14" fill="none" stroke="#B9D9E6" stroke-width="6"/></svg>')
const productImages={'bolo-chocolate':'/images/bolo-chocolate.png','bolo-ninho':'/images/bolo-ninho.png','bolo-morango':'/images/bolo-morango.png','brigadeiro':'/images/brigadeiro.png','pudim':'/images/pudim.png','brownie':'/images/brownie.png'}
const imageOf=p=>productImages[p?.image]||p?.image||placeholderImage
const item=(id,name,type,unit,packageName,packageSize,price,qty,min)=>({id,name,type,unit,packageName,packageSize,price,stock:{qty,min}})
const initialItems=[
  item(1,'Farinha de trigo','Ingrediente','g','pacote',1000,6,3000,2000),
  item(2,'Açúcar','Ingrediente','g','pacote',1000,5,4000,2000),
  item(3,'Ovos','Ingrediente','un','dúzia',12,12,30,24),
  item(4,'Leite integral','Ingrediente','ml','caixa',1000,6,4000,2000),
  item(5,'Chocolate em pó','Ingrediente','g','pacote',1000,40,800,500),
  item(6,'Leite condensado','Ingrediente','g','lata',395,7,3950,2370),
  item(7,'Creme de leite','Ingrediente','g','caixinha',200,4,2000,1200),
  item(8,'Chocolate meio amargo','Ingrediente','g','barra',1000,70,1500,1000),
  item(9,'Leite em pó','Ingrediente','g','lata',400,24,400,600),
  item(10,'Manteiga','Ingrediente','g','tablete',200,13,600,400),
  item(11,'Morango','Ingrediente','g','bandeja',250,8,0,1000),
  item(12,'Chocolate branco','Ingrediente','g','barra',1000,70,500,500),
  item(13,'Granulado','Ingrediente','g','pacote',500,20,500,300),
  item(14,'Cacau em pó','Ingrediente','g','pacote',1000,40,300,200),
  item(15,'Pote 200 ml + tampa','Embalagem','un','pacote',50,40,120,60),
  item(16,'Kit colher + etiqueta','Embalagem','un','pacote',100,20,150,60),
  item(17,'Pote 150 ml + tampa','Embalagem','un','pacote',50,30,80,40),
  item(18,'Colher','Embalagem','un','pacote',100,20,100,40),
  item(19,'Pote 120 ml + tampa','Embalagem','un','pacote',50,35,30,24),
  item(20,'Embalagem individual','Embalagem','un','pacote',50,60,40,20),
  item(21,'Etiqueta','Embalagem','un','pacote',100,20,200,50)
]
const use=(itemId,used)=>({itemId,used})
const box=(itemId,qty)=>({itemId,qty})
const withIds=list=>list.map((x,i)=>({id:i+1,...x}))
const seed=(id,name,category,yieldQty,price,image,ingredients,packages)=>({id,name,category,yield:yieldQty,price,image,status:'Ativo',ingredients:withIds(ingredients),packages:withIds(packages)})
const baseBatter=[use(1,500),use(2,400),use(3,6),use(4,500)]
const potPack=n=>[box(15,n),box(16,n)]
const initialProducts=[
  seed(1,'Bolo de pote de chocolate','Bolos de pote',30,8,'bolo-chocolate',[...baseBatter,use(5,200),use(6,1185),use(7,600),use(8,500)],potPack(30)),
  seed(2,'Bolo de pote de ninho','Bolos de pote',30,7.47,'bolo-ninho',[...baseBatter,use(9,300),use(6,1185),use(7,600),use(10,200)],potPack(30)),
  seed(3,'Bolo de pote de morango','Bolos de pote',30,9.07,'bolo-morango',[...baseBatter,use(6,1185),use(7,600),use(11,1000),use(12,500)],potPack(30)),
  seed(4,'Brigadeiro de colher','Doces',40,6.94,'brigadeiro',[use(6,1975),use(5,400),use(10,200),use(7,1000),use(13,300)],[box(17,40),box(18,40)]),
  seed(5,'Pudim individual','Sobremesas',24,7.2,'pudim',[use(6,1580),use(4,1000),use(3,12),use(2,400),use(7,600)],[box(19,24),box(16,24)]),
  seed(6,'Brownie com brigadeiro','Sobremesas',20,11.2,'brownie',[use(8,600),use(10,400),use(2,500),use(3,8),use(1,300),use(6,790),use(14,150)],[box(20,20),box(21,20)])
]
const num=v=>Number(v)||0
const round2=v=>Math.round(v*100)/100
const pct=v=>(Number.isFinite(v)?v:0).toFixed(1).replace('.',',')+'%'
// preço por unidade de medida (por g, ml ou un.) a partir da embalagem de compra
const itemUnitPrice=it=>it&&num(it.packageSize)>0?num(it.price)/num(it.packageSize):0
const lineCost=(line,itemMap,key)=>num(line?.[key])*itemUnitPrice(itemMap?.get(line?.itemId))
const recipeTotals=(p,itemMap)=>{const ingredients=(p?.ingredients||[]).reduce((t,x)=>t+lineCost(x,itemMap,'used'),0),packaging=(p?.packages||[]).reduce((t,x)=>t+lineCost(x,itemMap,'qty'),0),y=Math.max(1,num(p?.yield));return {ingredients,packaging,ingredientsUnit:ingredients/y,packagingUnit:packaging/y,variableUnit:(ingredients+packaging)/y}}
const unitCost=(p,share,itemMap)=>recipeTotals(p,itemMap).variableUnit+share
const marginOf=(price,cost)=>price>0?(price-cost)/price*100:0
const TARGET_MARGIN=25
const suggestedPrice=cost=>cost/(1-TARGET_MARGIN/100)
const hasRecipe=(p,itemMap)=>(p?.ingredients||[]).some(x=>lineCost(x,itemMap,'used')>0)
const statusOf=p=>p?.status||'Ativo'
const stockLevel=it=>{const q=num(it?.stock?.qty),m=num(it?.stock?.min);if(q<=0)return 'Sem estoque';if(m>0&&q<m)return 'Baixo';return 'Normal'}
const stockClass={'Normal':'ok','Baixo':'warn','Sem estoque':'danger'}
const UNIT_LABEL={g:'g',ml:'ml',un:'un.'}
const UNIT_NAME={g:'gramas (g)',ml:'mililitros (ml)',un:'unidades (un.)'}
const fmtNum=(v,max=2)=>(Number(v)||0).toLocaleString('pt-BR',{maximumFractionDigits:max})
const fmtQty=(q,unit)=>{const v=num(q);if(unit==='g'&&Math.abs(v)>=1000)return `${fmtNum(v/1000)} kg`;if(unit==='ml'&&Math.abs(v)>=1000)return `${fmtNum(v/1000)} L`;return `${fmtNum(v)} ${UNIT_LABEL[unit]||unit||''}`.trim()}
const pluralize=w=>/s$/i.test(w)?w:`${w}s`
const fmtPkgs=(n,it)=>{const name=it?.packageName||'embalagem',r=Math.round(num(n)*10)/10;return `${fmtNum(r,1)} ${Math.abs(r)===1?name:pluralize(name)}`}
const describePackage=it=>`${it.packageName||'embalagem'} de ${fmtQty(it.packageSize,it.unit)} • ${money(it.price)}`
const itemValue=it=>Math.max(0,num(it?.stock?.qty))*itemUnitPrice(it)
const usedIn=(itemId,products)=>products.filter(p=>[...(p.ingredients||[]),...(p.packages||[])].some(l=>l.itemId===itemId))
// quanto de cada item um lote consome
const batchNeeds=p=>{const need=new Map();for(const l of p?.ingredients||[])if(l.itemId)need.set(l.itemId,(need.get(l.itemId)||0)+num(l.used));for(const l of p?.packages||[])if(l.itemId)need.set(l.itemId,(need.get(l.itemId)||0)+num(l.qty));return need}
function productIssues(p,share,itemMap){
  const issues=[],cost=unitCost(p,share,itemMap)
  if(!hasRecipe(p,itemMap)) issues.push({type:'recipe',text:'Ficha técnica sem ingredientes com custo',action:'Abrir ficha'})
  if(num(p.price)<=0) issues.push({type:'price',text:'Sem preço de venda',action:'Abrir ficha'})
  else if(hasRecipe(p,itemMap)&&num(p.price)<=cost) issues.push({type:'loss',text:`Preço de ${money(p.price)} não cobre o custo de ${money(cost)}`,action:'Abrir ficha'})
  return issues
}
// converte os dados da versão anterior (ingredientes digitados em cada ficha + estoque de produtos prontos)
const normName=t=>String(t||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ')
function migrateLegacy(d){
  const items=[],byKey=new Map(),conflicts=[];let next=1
  const getItem=(name,type,unit,packageSize,price)=>{const key=`${type}|${normName(name)}|${unit}`;let it=byKey.get(key);const size=packageSize>0?packageSize:1
    if(!it){it={id:next++,name:String(name||'').trim()||type,type,unit,packageName:size===1?'unidade':(type==='Embalagem'?'pacote':'embalagem'),packageSize:size,price:num(price),stock:{qty:0,min:0}};byKey.set(key,it);items.push(it)}
    else if(Math.abs(itemUnitPrice(it)-num(price)/size)>1e-6&&!conflicts.includes(it.name)) conflicts.push(it.name)
    return it}
  const products=(d.products||[]).map(p=>{
    const ingredients=(p.ingredients||[]).filter(x=>String(x.name||'').trim()||num(x.used)).map((x,i)=>{const unit=['g','ml','un'].includes(x.boughtUnit)?x.boughtUnit:['g','ml','un'].includes(x.usedUnit)?x.usedUnit:'g';return {id:i+1,itemId:getItem(x.name,'Ingrediente',unit,num(x.bought),x.price).id,used:num(x.used)}})
    const packages=(p.packages||[]).filter(x=>String(x.item||'').trim()||num(x.qty)).map((x,i)=>({id:i+1,itemId:getItem(x.item,'Embalagem','un',1,x.cost).id,qty:num(x.qty)}))
    const {stock,...rest}=p;return {...rest,ingredients,packages}})
  return {version:2,products,items,expenses:d.expenses,production:d.production,movements:[],migrationNotes:{created:items.length,conflicts}}
}
const DATA_KEY='prato-data'
const loadData=()=>{try{const d=JSON.parse(localStorage.getItem(DATA_KEY)||'null');if(d&&Array.isArray(d.products))return d.version===2&&Array.isArray(d.items)?d:migrateLegacy(d)}catch{}return null}
const monthLabel=()=>{const t=new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return t[0].toUpperCase()+t.slice(1)}

const initialExpenses = [
  { id: 1, name: 'Aluguel do espaço', category: 'Estrutura', value: 1000 },
  { id: 2, name: 'Salários e pró-labore', category: 'Pessoas', value: 900 },
  { id: 3, name: 'Energia elétrica', category: 'Consumo', value: 250 },
  { id: 4, name: 'Água', category: 'Consumo', value: 80 },
  { id: 5, name: 'Internet e telefone', category: 'Serviços', value: 70 },
  { id: 6, name: 'Limpeza e outras despesas', category: 'Operação', value: 100 }
]

const navItems = [
  ['dashboard', 'Visão geral', LayoutDashboard], ['products', 'Produtos', Utensils], ['stock', 'Estoque', Boxes],
  ['costs', 'Custos fixos', WalletCards], ['simulator', 'Simulador de preços', Calculator],
  ['consulting', 'Planos', Sprout]
]

const LOGO={icon:'/images/logo-icone.png',word:'/images/logo-texto.png',wordWhite:'/images/logo-texto-branco.png',full:'/images/logo-completa.png'}
// tone="dark": logo sobre fundo azul (Prato em branco); tone="light": sobre fundo claro (cores originais)
function Logo({ tone='dark', className='' }) {
  return <span className={`logo ${className}`}><img className="logo-icon" src={LOGO.icon} alt=""/><img className="logo-word" src={tone==='dark'?LOGO.wordWhite:LOGO.word} alt="Prato Certo"/></span>
}
function Brand() {
  return <Logo tone="dark" className="sidebar-logo"/>
}

function Sidebar({ page, setPage, profile, onSettings, onLogout, collapsed, onClose }) {
  const tip=text=>collapsed?text:undefined
  return <aside className="sidebar" id="menu-principal" aria-label="Menu principal">
    <div><div className="sidebar-head"><Brand/><button className="drawer-close" onClick={onClose} aria-label="Fechar menu"><X size={20}/></button></div><button className="business-switch" onClick={onSettings}><span><b>{profile.business}</b><small>{profile.segment}</small></span><ChevronDown size={15}/></button>
      <nav>{navItems.map(([id, label, Icon]) => <button key={id} title={tip(label)} aria-label={label} onClick={() => setPage(id)} className={page === id || (page === 'recipe' && id === 'products') || (page === 'consulting-detail' && id === 'consulting') ? 'active' : ''}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <button className="support-card" onClick={() => setPage('consulting')}><Sprout size={24}/><b>Seu negócio pode crescer com leveza.</b><span>Um passo de cada vez. A gente te ajuda.</span><strong>Conheça os planos →</strong></button>
    </div>
    <div className="account-area"><button className="profile" onClick={onSettings} title={tip('Minha conta')}><span className="avatar">{profile.owner.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><span><b>{profile.owner}</b><small>Minha conta</small></span><Settings size={16}/></button><button className="logout" onClick={onLogout} title={tip('Sair')} aria-label="Sair"><LogOut size={17}/><span>Sair</span></button></div>
  </aside>
}


function Topbar({ page, saveState, onMenu, collapsed, drawer }) {
  const label = navItems.find(x => x[0] === page)?.[1] || (page === 'recipe' ? 'Ficha técnica' : page === 'consulting-detail' ? 'Detalhe da consultoria' : 'Visão geral')
  const saved={ok:['saved','Tudo salvo'],dirty:['saved dirty','Alterações não salvas'],error:['saved error','Não foi possível salvar neste navegador']}[saveState]
  return <header className="topbar"><div className="topbar-left"><button className="menu-toggle" onClick={onMenu} aria-controls="menu-principal" aria-expanded={drawer} title={collapsed?'Mostrar menu':'Guardar menu'} aria-label="Mostrar ou guardar o menu"><span className="desk-icon">{collapsed?<PanelLeftOpen size={20}/>:<PanelLeftClose size={20}/>}</span><span className="mob-icon"><Menu size={22}/></span></button><span className="crumbs"><span className="crumb-root">Meu negócio <b>›</b></span> <strong>{label}</strong></span></div><div><span className={saved[0]}>● {saved[1]}</span><i></i><span>{monthLabel()}</span></div></header>
}

function Shell({ children, page, setPage, profile, onSettings, onLogout, saveState }) {
  const [collapsed,setCollapsed]=useState(()=>{try{return localStorage.getItem('prato-menu')==='guardado'}catch{return false}})
  const [drawer,setDrawer]=useState(false)
  useEffect(()=>{try{localStorage.setItem('prato-menu',collapsed?'guardado':'aberto')}catch{}},[collapsed])
  useEffect(()=>{if(!drawer)return;const onKey=e=>{if(e.key==='Escape')setDrawer(false)};document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow=''}},[drawer])
  useEffect(()=>{const mq=window.matchMedia('(min-width:1051px)');const close=()=>mq.matches&&setDrawer(false);mq.addEventListener?.('change',close);return()=>mq.removeEventListener?.('change',close)},[])
  const toggleMenu=()=>window.matchMedia('(max-width:1050px)').matches?setDrawer(d=>!d):setCollapsed(c=>!c)
  const go=id=>{setDrawer(false);setPage(id)}; const settings=()=>{setDrawer(false);onSettings()}
  return <div className={`app-shell${collapsed?' menu-collapsed':''}${drawer?' drawer-open':''}`}><Sidebar page={page} setPage={go} profile={profile} onSettings={settings} onLogout={onLogout} collapsed={collapsed} onClose={()=>setDrawer(false)}/>{drawer&&<div className="drawer-backdrop" onClick={()=>setDrawer(false)}/>}<div className="workspace"><Topbar page={page} saveState={saveState} onMenu={toggleMenu} collapsed={collapsed} drawer={drawer}/><main>{children}</main></div></div>
}

function PageTitle({ kicker, title, subtitle, action }) {
  return <div className="page-title"><div>{kicker&&<span className="page-kicker">{kicker}</span>}<h1>{title}</h1><p>{subtitle}</p></div>{action}</div>
}

function PrimaryButton({ children, onClick, icon: Icon = Plus, className='' }) { return <button onClick={onClick} className={`btn primary ${className}`}><Icon size={17}/>{children}</button> }
function SecondaryButton({ children, onClick, icon: Icon }) { return <button onClick={onClick} className="btn secondary">{Icon&&<Icon size={17}/>} {children}</button> }

function Toast({ text, onClose }) {
  useEffect(()=>{const t=setTimeout(onClose,2800);return()=>clearTimeout(t)},[onClose])
  return <div className="toast"><Check size={18}/>{text}</div>
}

function Modal({ title, children, onClose, footer }) { return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal"><button className="modal-x" onClick={onClose}><X/></button><h2>{title}</h2>{children}{footer&&<div className="modal-footer">{footer}</div>}</section></div> }

function ConfirmDialog({ title='Confirmação', message, confirmLabel, cancelLabel='Cancelar', danger=false, onConfirm, onCancel }) { return <Modal title={title} onClose={onCancel}><p className="confirm-message">{message}</p><div className="modal-actions"><button className="btn cancel" onClick={onCancel}>{cancelLabel}</button><button className={`btn ${danger?'danger':'primary'}`} onClick={onConfirm}>{confirmLabel}</button></div></Modal> }
function ActionButtons({ onEdit, onDelete, editTitle='Editar produto', deleteTitle='Excluir produto' }) { return <div className="action-buttons"><button className="action-button edit" title={editTitle} aria-label={editTitle} onClick={onEdit}><Pencil/></button><button className="action-button delete" title={deleteTitle} aria-label={deleteTitle} onClick={onDelete}><Trash2/></button></div> }

// Formulário que funciona mesmo quando o arquivo é aberto numa pré-visualização que bloqueia o envio nativo de formulários
function SafeForm({ onSubmit, children, ...rest }) {
  const run=()=>onSubmit()
  return <form {...rest} noValidate onSubmit={e=>{e.preventDefault();run()}} onKeyDown={e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'&&!e.nativeEvent.isComposing){e.preventDefault();run()}}} onClickCapture={e=>{const b=e.target.closest?.('button');if(b&&b.type==='submit'&&!b.disabled&&e.currentTarget.contains(b)){e.preventDefault();run()}}}>{children}</form>
}

function Onboarding({ initial, onSave, onCancel }) {
  const original=initial || {owner:'',business:'',segment:'Confeitaria artesanal',city:''}
  const [form,setForm]=useState(original); const [discardOpen,setDiscardOpen]=useState(false)
  const update=(key,val)=>setForm({...form,[key]:val})
  const [formError,setFormError]=useState('')
  const submit=e=>{e?.preventDefault?.(); if(!form.owner.trim()||!form.business.trim()) return setFormError('Preencha o nome da responsável e o nome do negócio.'); onSave({...form,owner:form.owner.trim(),business:form.business.trim()})}
  const dirty=JSON.stringify(form)!==JSON.stringify(original); const requestCancel=()=>dirty?setDiscardOpen(true):onCancel()
  return <div className="ob">
    <AuthPanel/>
    <section className="ob-side">
      <div className="ob-form-wrap">
        <span className="ob-kicker dark">MINHA CONTA</span>
        <h1 className="ob-title">Dados do{' '}<br/>seu negócio.</h1>
        <p className="ob-sub">Esses dados aparecem no menu e na saudação do painel.</p>
        <SafeForm onSubmit={submit} className="ob-form">
          <label>Nome da responsável<input value={form.owner} onChange={e=>update('owner',e.target.value)} placeholder="Ex.: Ana Souza" autoFocus/></label>
          <label>Nome da empresa / negócio<input value={form.business} onChange={e=>update('business',e.target.value)} placeholder="Ex.: Doce da Ana"/></label>
          <div className="ob-row"><label>Segmento / nicho<select value={form.segment} onChange={e=>update('segment',e.target.value)}><option>Confeitaria artesanal</option><option>Bolos de pote</option><option>Salgados</option><option>Doces finos</option><option>Restaurante</option><option>Marmitas</option></select></label><label>Cidade / região<input value={form.city} onChange={e=>update('city',e.target.value)} placeholder="Ex.: Araranguá - SC"/></label></div>
          {formError&&<p className="ob-error" role="alert">{formError}</p>}<button className="ob-submit"><span>Salvar alterações</span><ArrowRight size={22}/></button>
          {onCancel&&<button type="button" className="ob-cancel" onClick={requestCancel}>Cancelar e voltar</button>}
        </SafeForm>
        <small className="ob-note"><ShieldCheck size={15}/> Seus dados ficam salvos somente neste navegador.</small>
      </div>
    </section>
    {discardOpen&&<ConfirmDialog title="Descartar alterações?" message="Você possui alterações não salvas. Deseja descartá-las?" cancelLabel="Continuar editando" confirmLabel="Descartar alterações" danger onCancel={()=>setDiscardOpen(false)} onConfirm={()=>{setDiscardOpen(false);onCancel()}}/>}
  </div>
}

const toHex=buf=>Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')
const newSalt=()=>{try{const a=new Uint8Array(16);crypto.getRandomValues(a);return toHex(a)}catch{return Math.random().toString(16).slice(2)+Date.now().toString(16)}}
async function hashPassword(password,salt){
  const text=salt+':'+password
  if(window.crypto?.subtle) return toHex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))
  let h=5381; for(const ch of text) h=((h<<5)+h+ch.charCodeAt(0))|0; return 'f'+(h>>>0).toString(16)
}
// MODO DE TESTE: login e senha já preenchidos. Troque TEST_MODE para false antes de usar de verdade.
const TEST_MODE=true
const TEST_LOGIN={email:'teste@pratocerto.com.br',password:'teste123'}
const TEST_SIGNUP={name:'Teste Prato Certo',email:TEST_LOGIN.email,phone:'(48) 99999-9999',password:TEST_LOGIN.password}
const readAccount=()=>{try{return JSON.parse(localStorage.getItem('prato-account')||'null')}catch{return null}}

const PLANS={crescimento:{id:'crescimento',name:'Plano Crescimento',price:'R$ 159,99',period:'/mês'}}
const readPlan=()=>{try{const id=sessionStorage.getItem('prato-plano');return PLANS[id]?id:null}catch{return null}}

function PlanSelect({ onSelect }) {
  const benefits=['Fichas técnicas, custos fixos e simulador de preços','Controle de estoque com relatório em PDF','Diagnóstico dos seus custos e preços','Acompanhamento com especialista em gestão e marketing']
  return <div className="plans-page">
    <header className="plans-top"><Logo tone="light" className="plans-logo"/></header>
    <main className="plans-main">
      <div className="plans-intro"><span className="ob-kicker dark">NOSSOS PLANOS</span><h1 className="plans-title">Escolha seu <em>plano.</em></h1><p>Custo claro e preço certo para o seu negócio de alimentação. Escolha um plano para acessar o sistema.</p></div>
      <div className="plans-grid">
        <section className="plan-card featured" aria-labelledby="plano-crescimento"><div className="plan-card-head"><h2 id="plano-crescimento">Plano Crescimento</h2><span className="plan-tag">Atual</span></div><div className="plan-price"><strong>R$ 159,99</strong><span>/mês</span></div><ul>{benefits.map(b=><li key={b}><Check size={18}/>{b}</li>)}</ul><button className="plan-choose" onClick={()=>onSelect('crescimento')}><span>Escolher este plano</span><ArrowRight size={22}/></button></section>
        <section className="plan-card upcoming" aria-labelledby="plano-novo"><div className="plan-card-head"><h2 id="plano-novo">Novo plano</h2><span className="plan-tag soon">Em desenvolvimento</span></div><div className="plan-price muted"><strong>R$ —</strong></div><p>Novos recursos para acompanhar o crescimento do seu negócio.</p><button className="plan-choose" disabled><span>Em breve</span></button></section>
      </div>
    </main>
  </div>
}

function AuthPanel() {
  return <section className="ob-panel">
    <Logo tone="dark" className="ob-logo"/>
    <div className="ob-panel-copy">
      <span className="ob-kicker">CUSTOS E PREÇOS</span>
      <h2 className="ob-display">Custo claro,<br/>preço <em>certo.</em></h2>
      <p>Fichas técnicas, custos fixos e preço por canal.{' '}<br/>Tudo no mesmo lugar, sem planilha.</p>
    </div>
    <svg className="ob-plate" viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="178"/><circle cx="200" cy="200" r="122"/><circle cx="200" cy="200" r="66"/></svg>
  </section>
}

const maskPhone=v=>{const d=v.replace(/\D/g,'').slice(0,11);if(!d)return '';if(d.length<=2)return `(${d}`;if(d.length<=6)return `(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=10)return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`}

function Signup({ plan, onChangePlan, onCreated, onGoLogin }) {
  const [form,setForm]=useState(TEST_MODE?{...TEST_SIGNUP}:{name:'',email:'',phone:'',password:''}),[show,setShow]=useState(false),[errors,setErrors]=useState({}),[busy,setBusy]=useState(false)
  const set=(key,value)=>{setForm(f=>({...f,[key]:value}));setErrors(e=>e[key]||e.form?{...e,[key]:undefined,form:undefined}:e)}
  const submit=async()=>{
    const name=form.name.trim().replace(/\s+/g,' '),mail=form.email.trim().toLowerCase(),digits=form.phone.replace(/\D/g,''),e={}
    if(name.length<2) e.name='Informe seu nome.'
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) e.email='Digite um e-mail válido, como nome@email.com.'
    if(digits.length<10||digits.length>11) e.phone='Informe o telefone com DDD, como (48) 99999-9999.'
    if(form.password.length<6) e.password='A senha precisa ter pelo menos 6 caracteres.'
    setErrors(e); if(Object.keys(e).length) return
    setBusy(true)
    try{const salt=newSalt(),hash=await hashPassword(form.password,salt);try{localStorage.setItem('prato-account',JSON.stringify({email:mail,salt,hash,name,phone:form.phone}))}catch{} onCreated({name,email:mail,phone:form.phone})}
    catch{setBusy(false);setErrors({form:'Não foi possível criar a conta agora. Tente de novo.'})}
  }
  const err=key=>errors[key]&&<small className="ob-field-error" id={`erro-${key}`}>{errors[key]}</small>
  const aria=key=>errors[key]?{'aria-invalid':true,'aria-describedby':`erro-${key}`}:{}
  return <div className="ob ob-login ob-signup">
    <AuthPanel/>
    <section className="ob-side">
      <div className="ob-form-wrap">
        {plan&&<div className="ob-plan"><span>{PLANS[plan].name} • {PLANS[plan].price}{PLANS[plan].period}</span>{onChangePlan&&<button type="button" className="ob-link" onClick={onChangePlan}>Trocar plano</button>}</div>}
        <span className="ob-kicker dark">CRIAR CONTA</span>
        <h1 className="ob-title">Crie sua conta.</h1>
        <p className="ob-sub">{TEST_MODE?'Ambiente de teste: os dados já estão preenchidos. É só clicar em Criar minha conta.':'Preencha seus dados para começar a usar o Prato Certo.'}</p>
        <SafeForm onSubmit={submit} className="ob-form">
          <label>Nome<input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Seu nome completo" autoComplete="name" {...aria('name')}/>{err('name')}</label>
          <label>E-mail<input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="seu@email.com" autoComplete="email" {...aria('email')}/>{err('email')}</label>
          <label>Telefone<input type="tel" inputMode="tel" value={form.phone} onChange={e=>set('phone',maskPhone(e.target.value))} placeholder="(00) 00000-0000" autoComplete="tel" {...aria('phone')}/>{err('phone')}</label>
          <div className="ob-field"><label htmlFor="cadastro-senha">Senha</label><div className="ob-password"><input id="cadastro-senha" type={show?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete="new-password" {...aria('password')}/><button type="button" className="ob-show" onClick={()=>setShow(!show)} aria-label={show?'Ocultar senha':'Mostrar senha'}>{show?'Ocultar':'Mostrar'}</button></div>{err('password')}</div>
          {errors.form&&<p className="ob-error" role="alert">{errors.form}</p>}
          <button className="ob-submit" disabled={busy}><span>{busy?'Criando sua conta…':'Criar minha conta'}</span><ArrowRight size={22}/></button>
        </SafeForm>
        <p className="ob-switch">Já tem uma conta? <button type="button" className="ob-link" onClick={onGoLogin}>Entrar</button></p>
        <small className="ob-note"><ShieldCheck size={15}/> Seus dados ficam salvos somente neste navegador.</small>
      </div>
    </section>
  </div>
}

function Login({ onLogin, plan, onChangePlan, onGoSignup, createdEmail }) {
  const [account,setAccount]=useState(readAccount)
  const [email,setEmail]=useState(createdEmail||(TEST_MODE?TEST_LOGIN.email:'')),[password,setPassword]=useState(TEST_MODE&&(!createdEmail||createdEmail===TEST_LOGIN.email)?TEST_LOGIN.password:''),[show,setShow]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[resetOpen,setResetOpen]=useState(false)
  const submit=async e=>{e?.preventDefault?.(); setError('')
    const mail=email.trim().toLowerCase()
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setError('Digite um e-mail válido, como nome@email.com.')
    if(password.length<6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    if(TEST_MODE&&mail===TEST_LOGIN.email&&password===TEST_LOGIN.password) return onLogin(mail)
    setBusy(true)
    try{
      if(!account){setBusy(false);return setError('Não encontramos uma conta neste navegador. Crie sua conta primeiro.')}
      const hash=await hashPassword(password,account.salt); if(mail!==account.email||hash!==account.hash){setBusy(false);return setError('E-mail ou senha incorretos. Confira e tente de novo.')} onLogin(mail)
    }catch{setBusy(false);setError('Não foi possível entrar agora. Tente de novo.')}
  }
  const resetAccess=()=>{try{localStorage.removeItem('prato-account')}catch{} setAccount(null);setResetOpen(false);setPassword('');setError('')}
  return <div className="ob ob-login">
    <AuthPanel/>
    <section className="ob-side">
      <div className="ob-form-wrap">
        {createdEmail&&<p className="ob-success" role="status"><Check size={18}/>Conta criada com sucesso. Agora entre com seu e-mail e senha.</p>}{plan&&<div className="ob-plan"><span>{PLANS[plan].name} • {PLANS[plan].price}{PLANS[plan].period}</span>{onChangePlan&&<button type="button" className="ob-link" onClick={onChangePlan}>Trocar plano</button>}</div>}<span className="ob-kicker dark">SUA CONTA</span>
        <h1 className="ob-title">Acesse o{' '}<br/>Prato Certo.</h1>
        <p className="ob-sub">{TEST_MODE&&(!createdEmail||createdEmail===TEST_LOGIN.email)?'Ambiente de teste: o e-mail e a senha já estão preenchidos. É só clicar em Entrar.':'Entre com seu e-mail e senha para continuar.'}</p>
        <SafeForm onSubmit={submit} className="ob-form">
          <label>E-mail<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" autoFocus/></label>
          <div className="ob-field">
            <div className="ob-label-row"><label htmlFor="ob-password">Senha</label>{account&&!TEST_MODE&&<button type="button" className="ob-link" onClick={()=>setResetOpen(true)}>Esqueci minha senha</button>}</div>
            <div className="ob-password"><input id="ob-password" type={show?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Digite sua senha"/><button type="button" className="ob-show" onClick={()=>setShow(!show)} aria-label={show?'Ocultar senha':'Mostrar senha'}>{show?'Ocultar':'Mostrar'}</button></div>
          </div>
          {error&&<p className="ob-error" role="alert">{error}</p>}
          <button className="ob-submit" disabled={busy}><span>{busy?'Entrando…':'Entrar'}</span><ArrowRight size={22}/></button>
        </SafeForm>
        {onGoSignup&&<p className="ob-switch">Ainda não tem conta? <button type="button" className="ob-link" onClick={onGoSignup}>Criar conta</button></p>}
        <small className="ob-note"><ShieldCheck size={15}/> Seus dados ficam salvos somente neste navegador.</small>
      </div>
    </section>
    {resetOpen&&<ConfirmDialog title="Esqueceu a senha?" message="A senha fica guardada só neste navegador, então não há como recuperá-la. Você pode apagar o acesso atual e criar um novo. Os dados do negócio salvos continuam aqui." cancelLabel="Voltar" confirmLabel="Criar novo acesso" onCancel={()=>setResetOpen(false)} onConfirm={resetAccess}/>}
  </div>
}

function StatCard({ label, value, helper, icon: Icon }) { return <div className="stat-card"><Icon/><span>{label}</span><strong>{value}</strong><small>{helper}</small></div> }

function Dashboard({ profile, setPage, products, expenses, fixedTotal, production, share, items, itemMap }) {
  const hour=new Date().getHours(); const greet=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite'
  const active=products.filter(p=>statusOf(p)==='Ativo'); const complete=products.filter(p=>hasRecipe(p,itemMap))
  const featured=active.find(p=>hasRecipe(p,itemMap))||products.find(p=>hasRecipe(p,itemMap))
  const t=featured?recipeTotals(featured,itemMap):null; const fCost=featured?t.variableUnit+share:0
  const low=items.filter(it=>stockLevel(it)!=='Normal')
  // custo geral do mês = custos fixos + ingredientes (custo médio de ingredientes por unidade × produção estimada)
  const withRecipe=active.filter(p=>hasRecipe(p,itemMap)); const avgIngredients=withRecipe.length?withRecipe.reduce((t,p)=>t+recipeTotals(p,itemMap).ingredientsUnit,0)/withRecipe.length:0; const ingredientsMonth=avgIngredients*production; const generalCost=fixedTotal+ingredientsMonth
  const allComplete=products.length>0&&complete.length===products.length
  const steps=[['Cadastre seus produtos',allComplete?`${complete.length} fichas técnicas completas`:`${products.length-complete.length} ficha(s) técnica(s) pendente(s)`,allComplete,'products'],['Organize seus custos fixos',`${money(fixedTotal)} por mês • ${money(share)} por unidade`,fixedTotal>0,'costs'],['Confira o estoque',low.length?`${low.length} item(ns) do estoque abaixo do mínimo`:'Ingredientes acima do mínimo',low.length===0,'stock'],['Revise o preço por canal','Simule antes de começar a vender',false,'simulator']]
  return <>
    <PageTitle kicker="VISÃO GERAL" title={`${greet}, ${profile.owner.split(' ')[0]}.`} subtitle="Vamos cuidar dos números para você continuar criando coisas deliciosas."/>
    <section className="hero"><div><span>UM BOM PREÇO COMEÇA COM CLAREZA</span><h2>Custo claro, preço <em>certo.</em></h2><p>Compare os canais e venda sem deixar nenhum custo de fora.</p><button onClick={()=>setPage('simulator')}>Simular meus preços <ArrowRight size={18}/></button></div>{featured&&<img src={imageOf(featured)} alt={featured.name}/>}</section>
    <div className="stats-grid five"><StatCard icon={Utensils} label="Produtos cadastrados" value={products.length} helper={`${complete.length} com ficha técnica completa`}/><StatCard icon={WalletCards} label="Custos fixos / mês" value={money(fixedTotal)} helper={`${expenses.length} despesas no planejamento`}/><StatCard icon={Receipt} label="Custo geral / mês" value={money(generalCost)} helper={`${money(fixedTotal)} fixos + ${money(ingredientsMonth)} em ingredientes`}/><StatCard icon={Package} label="Produção estimada" value={`${production.toLocaleString('pt-BR')} un.`} helper="Total de produtos por mês"/><StatCard icon={PieChart} label="Rateio por unidade" value={money(share)} helper="Custos fixos ÷ produção estimada"/></div>
    <div className="dashboard-grid">{featured?<section className="card cost-origin"><h3>De onde vem o custo?</h3><p>{featured.name} • lote com {featured.yield} unidades</p><div className="cost-total"><strong>{money(fCost)}</strong><small>custo total por unidade</small></div><div className="stacked" style={{gridTemplateColumns:`${Math.max(t.ingredientsUnit,.01)}fr ${Math.max(t.packagingUnit,.01)}fr ${Math.max(share,.01)}fr`}}><i/><i/><i/></div><div className="legend"><span><b>■ Ingredientes</b><strong>{money(t.ingredientsUnit)}</strong></span><span><b>■ Embalagem</b><strong>{money(t.packagingUnit)}</strong></span><span><b>■ Rateio fixo</b><strong>{money(share)}</strong></span></div></section>:<section className="card cost-origin"><h3>De onde vem o custo?</h3><p>Preencha a ficha técnica de um produto para ver o custo por unidade aqui.</p><button className="text-link" onClick={()=>setPage('products')}>Ir para produtos</button></section>}<section className="card next-step"><h3>Seu próximo passo</h3><p>Uma gestão simples, na ordem certa.</p>{steps.map(([title,helper,done,target])=><button key={title} onClick={()=>setPage(target)}><span className={done?'':'go'}>{done?<Check size={14}/>:<ArrowRight size={14}/>}</span><b>{title}</b><small>{helper}</small></button>)}</section></div>
    {featured&&<ChannelTable setPage={setPage} product={featured} cost={fCost}/>}
  </>
}

function ChannelTable({ setPage, product, cost }) {
  const rows=[['Venda direta',0],['iFood',25],['99',15]].map(([name,rate])=>{const price=cost/(1-rate/100-TARGET_MARGIN/100);return [name,rate,price,price*TARGET_MARGIN/100]})
  return <section className="card channel-table"><div className="section-head"><div><h3>Um produto, preços diferentes</h3><p>{product.name} • margem desejada de {TARGET_MARGIN}% sobre a venda</p></div><button onClick={()=>setPage('simulator')}>Abrir simulador</button></div><div className="table-wrap"><table><thead><tr><th>Canal de venda</th><th>Taxa do canal</th><th>Custo unitário</th><th>Preço recomendado</th><th>Lucro líquido / un.</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}%</td><td>{money(cost)}</td><td><b>{money(r[2])}</b></td><td className="positive">{money(r[3])}</td></tr>)}</tbody></table></div></section>
}

function SortHeader({ label, column, sort, onSort }) { const active=sort.key===column; return <button className={`sort-header ${active?'active':''}`} onClick={()=>onSort(column)}>{label}<span>{active?(sort.dir==='asc'?'↑':'↓'):'↕'}</span></button> }
function Products({ products, setProducts, openProduct, showToast, share, itemMap }) {
  const emptyDraft={name:'',category:'Bolos de pote',yield:20,status:'Ativo'}; const [query,setQuery]=useState(''); const [category,setCategory]=useState('Todas'); const [status,setStatus]=useState('Todos'); const [sort,setSort]=useState({key:'name',dir:'asc'}); const [open,setOpen]=useState(false); const [draft,setDraft]=useState(emptyDraft); const [deleteTarget,setDeleteTarget]=useState(null); const [discardNew,setDiscardNew]=useState(false); const [addError,setAddError]=useState('')
  const categories=[...new Set(products.map(p=>p.category))].sort((a,b)=>a.localeCompare(b,'pt-BR'))
  const value=(p,key)=>key==='margin'?(num(p.price)>0?marginOf(num(p.price),unitCost(p,share,itemMap)):-Infinity):key==='cost'?unitCost(p,share,itemMap):key==='price'?num(p.price):key==='status'?statusOf(p):p[key]
  const visible=useMemo(()=>products.filter(p=>{const term=query.trim().toLocaleLowerCase('pt-BR');return(!term||p.name.toLocaleLowerCase('pt-BR').includes(term)||p.category.toLocaleLowerCase('pt-BR').includes(term))&&(category==='Todas'||p.category===category)&&(status==='Todos'||statusOf(p)===status)}).sort((a,b)=>{let av=value(a,sort.key),bv=value(b,sort.key);const dir=sort.dir==='asc'?1:-1;if(typeof av==='string')return dir*av.localeCompare(String(bv),'pt-BR',{sensitivity:'base'});return dir*(av-bv)}),[products,query,category,status,sort,share,itemMap])
  const changeSort=key=>setSort(current=>({key,dir:current.key===key&&current.dir==='asc'?'desc':'asc'})); const selectSort=v=>{const [key,dir]=v.split(':');setSort({key,dir})}
  const isDraftDirty=draft.name!==''||draft.category!==emptyDraft.category||draft.yield!==emptyDraft.yield; const requestClose=()=>isDraftDirty?setDiscardNew(true):(setOpen(false),setDraft(emptyDraft))
  const add=e=>{e?.preventDefault?.();if(!draft.name.trim())return setAddError('Informe o nome do produto.');setAddError('');const p={...draft,name:draft.name.trim(),yield:Math.max(1,num(draft.yield)),id:Date.now(),price:0,image:null,ingredients:[],packages:[]};setProducts([...products,p]);setOpen(false);setDraft(emptyDraft);showToast('Produto criado. Agora preencha a ficha técnica.');openProduct(p)}
  const checks=products.map(p=>({p,issues:productIssues(p,share,itemMap)})).filter(x=>x.issues.length)
  const remove=()=>{setProducts(products.filter(p=>p.id!==deleteTarget.id));setDeleteTarget(null);showToast('Produto excluído.')}
  return <><PageTitle kicker="PRODUTOS" title="Seus produtos" subtitle="Cadastre, filtre e acompanhe a rentabilidade de cada item." action={<PrimaryButton onClick={()=>{setDraft(emptyDraft);setOpen(true)}}>Novo produto</PrimaryButton>}/>
  {checks.length>0&&<section className="card check-card"><div className="section-head"><div><h3>Verificação dos cadastros</h3><p>Produtos que precisam de atenção antes de vender.</p></div></div><ul className="check-list">{checks.map(({p,issues})=><li key={p.id}><img src={imageOf(p)} alt="" style={{filter:photoFilters[p.photoFilter]||'none'}}/><div><b>{p.name}</b><span className={`status-text ${statusOf(p)==='Inativo'?'off':'ok'}`}>{statusOf(p)}</span></div><ul>{issues.map(i=><li key={i.type}><span className={`issue-dot ${i.type==='loss'?'danger':'warn'}`}/>{i.text}<button className="text-link" onClick={()=>openProduct(p)}>{i.action}</button></li>)}</ul></li>)}</ul></section>}
  <section className="card products-card"><div className="product-filters"><label className="search product-search"><span>Buscar produto</span><div><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome ou categoria"/></div></label><label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}><option>Todas</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option><option>Ativo</option><option>Inativo</option></select></label><label>Ordenar por<select value={`${sort.key}:${sort.dir}`} onChange={e=>selectSort(e.target.value)}><option value="name:asc">Nome (A–Z)</option><option value="name:desc">Nome (Z–A)</option><option value="cost:asc">Menor custo</option><option value="cost:desc">Maior custo</option><option value="price:asc">Menor preço</option><option value="price:desc">Maior preço</option><option value="margin:asc">Menor margem</option><option value="margin:desc">Maior margem</option></select></label></div><div className="table-wrap"><table className="products-table"><thead><tr><th><SortHeader label="Nome" column="name" {...{sort}} onSort={changeSort}/></th><th><SortHeader label="Categoria" column="category" {...{sort}} onSort={changeSort}/></th><th className="numeric"><SortHeader label="Custo" column="cost" {...{sort}} onSort={changeSort}/></th><th className="numeric"><SortHeader label="Preço" column="price" {...{sort}} onSort={changeSort}/></th><th className="numeric"><SortHeader label="Margem" column="margin" {...{sort}} onSort={changeSort}/></th><th><SortHeader label="Status" column="status" {...{sort}} onSort={changeSort}/></th><th>Ações</th></tr></thead><tbody>{visible.map(p=>{const cost=unitCost(p,share,itemMap),price=num(p.price),m=marginOf(price,cost),recipe=hasRecipe(p,itemMap);return <tr key={p.id}><td><button className="product-name" onClick={()=>openProduct(p)}><img src={imageOf(p)} alt="" style={{filter:photoFilters[p.photoFilter]||'none'}}/><span><b>{p.name}</b>{recipe?<small>{p.yield} unidades por lote</small>:<small className="pending-text">Ficha técnica pendente</small>}</span></button></td><td>{p.category}</td><td className="numeric"><b>{recipe?money(cost):'—'}</b></td><td className="numeric"><b>{price>0?money(price):'—'}</b></td><td className={`numeric ${recipe&&price>0&&m<=0?'negative':''}`}><b>{recipe&&price>0?pct(m):'—'}</b></td><td><span className={`status-text ${statusOf(p)==='Inativo'?'off':'ok'}`}>{statusOf(p)}</span></td><td><ActionButtons onEdit={()=>openProduct(p)} onDelete={()=>setDeleteTarget(p)}/></td></tr>})}</tbody></table>{visible.length===0&&<div className="empty-results">Nenhum produto encontrado com os filtros selecionados.</div>}</div><div className="table-foot">Mostrando {visible.length} de {products.length} produtos • custo inclui o rateio fixo de {money(share)} por unidade</div></section>
  {open&&<Modal title="Cadastrar produto" onClose={requestClose}><SafeForm className="form-stack" onSubmit={add}><label>Nome do produto<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Ex.: Torta de limão" autoFocus/></label><label>Categoria<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option>Bolos de pote</option><option>Doces</option><option>Sobremesas</option><option>Salgados</option></select></label><label>Rendimento do lote (unidades)<input type="number" min="1" value={draft.yield} onChange={e=>setDraft({...draft,yield:+e.target.value})}/></label>{addError&&<p className="form-error" role="alert">{addError}</p>}<div className="modal-actions"><button type="button" className="btn cancel" onClick={requestClose}>Cancelar</button><button className="btn primary">Criar e abrir ficha<ArrowRight size={18}/></button></div></SafeForm></Modal>}
  {deleteTarget&&<ConfirmDialog title="Excluir produto" message={`Deseja realmente excluir “${deleteTarget.name}”? A ficha técnica deste produto também será apagada. Os ingredientes continuam no estoque.`} confirmLabel="Excluir" danger onCancel={()=>setDeleteTarget(null)} onConfirm={remove}/>} {discardNew&&<ConfirmDialog title="Descartar cadastro?" message="Você possui alterações não salvas. Deseja descartá-las?" cancelLabel="Continuar editando" confirmLabel="Descartar alterações" danger onCancel={()=>setDiscardNew(false)} onConfirm={()=>{setDiscardNew(false);setOpen(false);setDraft(emptyDraft)}}/>}</>
}


const photoFilters={Original:'none',Quente:'sepia(.28) saturate(1.25)',Frio:'contrast(1.05) saturate(.82) hue-rotate(8deg)','Preto e branco':'grayscale(1)',Vibrante:'saturate(1.55) contrast(1.06)'}

function Recipe({ product, share, items, itemMap, saveItem, setPage, navigate, showToast, saveProduct, setPageDirty }) {
  const newIngredient=()=>({id:Date.now()+Math.random(),itemId:'',used:''})
  const newPackage=()=>({id:Date.now()+Math.random(),itemId:'',qty:num(product?.yield)||1})
  const initialIngredients=()=>product?.ingredients?.length?product.ingredients:[newIngredient()]
  const initialPackages=()=>product?.packages?.length?product.packages:[newPackage()]
  const [form,setForm]=useState(product?{...product,status:statusOf(product)}:null); const [ingredients,setIngredients]=useState(initialIngredients); const [packages,setPackages]=useState(initialPackages); const [dirty,setDirty]=useState(false); const [discardOpen,setDiscardOpen]=useState(false); const [error,setError]=useState(''); const [newItem,setNewItem]=useState(null)
  useEffect(()=>{setForm(product?{...product,status:statusOf(product)}:null);setIngredients(initialIngredients());setPackages(initialPackages());setDirty(false);setError('');setPageDirty(false)},[product?.id])
  useEffect(()=>()=>setPageDirty(false),[])
  if(!form) return null
  const markDirty=()=>{setDirty(true);setPageDirty(true)}; const updateForm=(key,value)=>{markDirty();setForm({...form,[key]:value})}
  const t=recipeTotals({yield:form.yield,ingredients,packages},itemMap); const cost=t.variableUnit+share; const price=num(form.price); const suggested=round2(suggestedPrice(cost)); const recipeOk=ingredients.some(x=>lineCost(x,itemMap,'used')>0)
  const choosePhoto=e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const k=Math.min(1,600/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);markDirty();setForm(f=>({...f,image:c.toDataURL('image/jpeg',.82)}))};img.src=reader.result};reader.readAsDataURL(file);e.target.value=''}
  const save=()=>{
    if(!form.name.trim()) return setError('Dê um nome ao produto antes de salvar.')
    const cleanIngredients=ingredients.filter(x=>x.itemId&&num(x.used)>0).map(x=>({id:x.id,itemId:+x.itemId,used:num(x.used)}))
    const cleanPackages=packages.filter(x=>x.itemId&&num(x.qty)>0).map(x=>({id:x.id,itemId:+x.itemId,qty:num(x.qty)}))
    const autoPrice=price<=0&&recipeOk; const finalPrice=autoPrice?suggested:round2(price)
    const {isNew,...rest}=form
    saveProduct({...rest,name:form.name.trim(),yield:Math.max(1,num(form.yield)),price:finalPrice,ingredients:cleanIngredients,packages:cleanPackages})
    setDirty(false);setPageDirty(false);showToast(autoPrice?`Ficha salva. Preço sugerido de ${money(finalPrice)} aplicado.`:'Ficha técnica salva.');setPage('products')
  }
  const cancel=()=>dirty?setDiscardOpen(true):setPage('products')
  const createItem=data=>{const saved=saveItem(data);markDirty();if(newItem.kind==='ingredients')setIngredients(list=>list.map(x=>x.id===newItem.lineId?{...x,itemId:saved.id}:x));else setPackages(list=>list.map(x=>x.id===newItem.lineId?{...x,itemId:saved.id}:x));setNewItem(null);showToast(`${saved.name} cadastrado no estoque.`)}
  return <><div className="crumb">Produtos / {form.name||'Novo produto'}</div><PageTitle kicker="FICHA TÉCNICA" title={form.name||'Novo produto'} subtitle="Escolha os ingredientes e embalagens do lote. Os preços vêm do cadastro do estoque."/><div className="recipe-layout"><div><section className="card form-card product-details-card"><div><h3>Sobre o produto</h3><div className="form-grid compact"><label>Nome<input value={form.name} onChange={e=>updateForm('name',e.target.value)}/></label><label>Categoria<select value={form.category} onChange={e=>updateForm('category',e.target.value)}><option>Bolos de pote</option><option>Doces</option><option>Sobremesas</option><option>Salgados</option></select></label><label>Rendimento do lote<div className="suffix-input"><input type="number" min="1" value={form.yield} onChange={e=>updateForm('yield',+e.target.value)}/><span>unid.</span></div></label><label>Status<select value={form.status} onChange={e=>updateForm('status',e.target.value)}><option>Ativo</option><option>Inativo</option></select></label><label className="price-field">Preço de venda (venda direta)<div className="suffix-input prefix"><span className="prefix-label">R$</span><input type="number" min="0" step=".01" value={form.price||''} placeholder="0,00" onChange={e=>updateForm('price',e.target.value)}/></div>{recipeOk&&<button type="button" className="text-link" onClick={()=>updateForm('price',suggested)}>Usar preço sugerido: {money(suggested)} (margem de {TARGET_MARGIN}%)</button>}</label></div></div><div className="editable-photo"><img src={imageOf(form)} style={{filter:photoFilters[form.photoFilter]||'none'}} alt={form.name}/><div><label className="photo-button">Alterar foto<input type="file" accept="image/*" onChange={choosePhoto}/></label><label>Filtro<select value={form.photoFilter||'Original'} onChange={e=>updateForm('photoFilter',e.target.value)}>{Object.keys(photoFilters).map(x=><option key={x}>{x}</option>)}</select></label></div></div></section>
  <SupplyTable kind="ingredients" lines={ingredients} setLines={setIngredients} items={items} itemMap={itemMap} markDirty={markDirty} total={t.ingredients} newLine={newIngredient} onCreateItem={lineId=>setNewItem({kind:'ingredients',lineId})}/>
  <SupplyTable kind="packages" lines={packages} setLines={setPackages} items={items} itemMap={itemMap} markDirty={markDirty} total={t.packaging} newLine={newPackage} onCreateItem={lineId=>setNewItem({kind:'packages',lineId})}/></div>
  <aside className="recipe-aside"><section className="cost-summary"><h3>Custo por unidade</h3><p><span>Ingredientes</span><b>{money(t.ingredientsUnit)}</b></p><p><span>Embalagem</span><b>{money(t.packagingUnit)}</b></p><p><span>Rateio do custo fixo</span><b>{money(share)}</b></p><div className="total-box"><span>Custo total</span><strong>{money(cost)}</strong><small>{price>0?`Preço ${money(price)} • margem de ${pct(marginOf(price,cost))}`:'Defina o preço de venda'}</small></div><button className="price-channel" onClick={()=>navigate('simulator')}><Calculator/>Ver preço por canal</button></section></aside></div>
  <div className="form-footer">{error&&<p className="form-error" role="alert">{error}</p>}<div className="action-row"><button className="btn cancel" onClick={cancel}>Cancelar</button><PrimaryButton icon={Check} onClick={save}>Salvar</PrimaryButton></div></div>
  {newItem&&<ItemForm items={items} lockedType={newItem.kind==='ingredients'?'Ingrediente':'Embalagem'} onClose={()=>setNewItem(null)} onSave={createItem}/>}
  {discardOpen&&<ConfirmDialog title="Descartar alterações?" message="Você possui alterações não salvas. Deseja descartá-las?" cancelLabel="Continuar editando" confirmLabel="Descartar alterações" danger onCancel={()=>setDiscardOpen(false)} onConfirm={()=>{setDirty(false);setPageDirty(false);setDiscardOpen(false);setPage('products')}}/>}</>
}

// tabela da ficha técnica: cada linha escolhe um item do estoque e informa quanto o lote usa
function SupplyTable({ kind, lines, setLines, items, itemMap, markDirty, total, newLine, onCreateItem }) {
  const isIng=kind==='ingredients', key=isIng?'used':'qty', type=isIng?'Ingrediente':'Embalagem'
  const options=items.filter(it=>it.type===type).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
  const update=(id,field,value)=>{markDirty();setLines(lines.map(x=>x.id===id?{...x,[field]:value}:x))}
  return <section className="card list-card editable-table supply-table"><div className="section-head"><div><h3>{isIng?'Ingredientes do lote':'Embalagem'}</h3><p>{isIng?'Quanto de cada ingrediente o lote usa.':'Embalagens usadas no lote.'}</p></div></div><div className="table-wrap"><table><thead><tr><th>{isIng?'Ingrediente':'Embalagem'}</th><th>Quantidade no lote</th><th>Preço de compra</th><th className="numeric">Custo no lote</th><th className="numeric">Em estoque</th><th></th></tr></thead><tbody>{lines.map(x=>{const it=itemMap.get(+x.itemId);return <tr key={x.id}>
    <td><select value={x.itemId||''} onChange={e=>{const v=e.target.value;if(v==='__new'){onCreateItem(x.id);return}update(x.id,'itemId',v?+v:'')}} aria-label={isIng?'Ingrediente':'Embalagem'}><option value="">{isIng?'Escolha o ingrediente':'Escolha a embalagem'}</option>{options.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}<option value="__new">+ Cadastrar {isIng?'novo ingrediente':'nova embalagem'}…</option></select></td>
    <td><div className="suffix-input qty-input"><input type="number" min="0" step="any" value={x[key]} placeholder="0" onChange={e=>update(x.id,key,e.target.value)} aria-label="Quantidade no lote"/><span>{it?UNIT_LABEL[it.unit]:''}</span></div></td>
    <td className="muted-cell">{it?describePackage(it):'—'}</td>
    <td className="numeric"><b>{money(lineCost(x,itemMap,key))}</b></td>
    <td className="numeric muted-cell">{it?fmtQty(it.stock?.qty,it.unit):'—'}</td>
    <td><button className="icon-btn" title={isIng?'Tirar ingrediente da ficha':'Tirar embalagem da ficha'} aria-label="Tirar da ficha" onClick={()=>{markDirty();setLines(lines.filter(i=>i.id!==x.id))}}><Trash2/></button></td></tr>})}</tbody></table></div><div className="list-total"><button className="inline-add" onClick={()=>{markDirty();setLines([...lines,newLine()])}}>+ Adicionar {isIng?'ingrediente':'embalagem'}</button><span>Total <b>{money(total)}</b></span></div></section>
}
function EmptyTab({ tab }) { return <section className="card empty-tab"><BarChart3/><h2>{tab}</h2><p>Esta visualização está pronta para receber os dados históricos do seu negócio.</p></section> }

function Costs({ expenses,setExpenses,production,setProduction,showToast,setPageDirty }) {
  const blank={name:'',category:'Operação',value:100}; const [mode,setMode]=useState(null); const [draft,setDraft]=useState(blank); const [originalDraft,setOriginalDraft]=useState(blank); const [deleteTarget,setDeleteTarget]=useState(null); const [discardExpense,setDiscardExpense]=useState(false); const [discardPlan,setDiscardPlan]=useState(false); const [expenseError,setExpenseError]=useState(''); const [draftProduction,setDraftProduction]=useState(production)
  const total=expenses.reduce((a,x)=>a+Number(x.value),0); const share=total/Math.max(1,draftProduction); const planDirty=draftProduction!==production; const expenseDirty=JSON.stringify(draft)!==JSON.stringify(originalDraft)
  useEffect(()=>setDraftProduction(production),[production]); useEffect(()=>{setPageDirty(planDirty);return()=>setPageDirty(false)},[planDirty])
  const openAdd=()=>{setDraft(blank);setOriginalDraft(blank);setExpenseError('');setMode('add')}; const openEdit=x=>{const copy={...x};setDraft(copy);setOriginalDraft(copy);setMode('edit')}; const requestExpenseClose=()=>expenseDirty?setDiscardExpense(true):setMode(null)
  const saveExpense=e=>{e?.preventDefault?.();if(!String(draft.name).trim())return setExpenseError('Informe a descrição da despesa.');if(draft.value===''||!(Number(draft.value)>=0))return setExpenseError('Informe um valor mensal válido.');setExpenseError('');const saved={...draft,value:Number(draft.value)};if(mode==='edit'){setExpenses(expenses.map(x=>x.id===saved.id?saved:x));showToast('Despesa atualizada e rateio recalculado.')}else{setExpenses([...expenses,{...saved,id:Date.now()}]);showToast('Despesa adicionada ao planejamento.')}setMode(null)}
  const removeExpense=()=>{setExpenses(expenses.filter(x=>x.id!==deleteTarget.id));setDeleteTarget(null);showToast('Despesa excluída e rateio recalculado.')}; const savePlan=()=>{setProduction(draftProduction);setPageDirty(false);showToast('Planejamento salvo e rateio atualizado.')}; const cancelPlan=()=>planDirty?setDiscardPlan(true):setDraftProduction(production)
  return <><PageTitle kicker="CUSTOS FIXOS" title="Todo custo tem seu lugar." subtitle="Inclua as despesas que existem mesmo quando a cozinha está parada." action={<PrimaryButton onClick={openAdd}>Adicionar despesa</PrimaryButton>}/><div className="month-row"><b>{monthLabel()}</b><span className="status">Planejamento mensal</span><small>Valores recorrentes • revisão em 01 nov.</small></div><div className="costs-layout"><div><section className="card list-card"><div className="section-head"><div><h3>Despesas do mês</h3><p>Valores previstos para manter seu negócio funcionando.</p></div></div><div className="table-wrap"><table><thead><tr><th>Despesa</th><th>Categoria</th><th>Valor mensal</th><th>Ações</th></tr></thead><tbody>{expenses.map(x=><tr key={x.id}><td><b>{x.name}</b></td><td>{x.category}</td><td><b>{money(x.value)}</b></td><td><ActionButtons editTitle="Editar despesa" deleteTitle="Excluir despesa" onEdit={()=>openEdit(x)} onDelete={()=>setDeleteTarget(x)}/></td></tr>)}</tbody></table></div><div className="total-row"><b>Total de custos fixos</b><strong>{money(total)}</strong></div></section><section className="card scenarios"><h3>E se a produção mudar?</h3><p>O mesmo custo mensal, dividido por quantidades diferentes.</p><div>{[1000,1200,1500].map(n=><button className={n===draftProduction?'active':''} onClick={()=>setDraftProduction(n)} key={n}><span>{n.toLocaleString('pt-BR')} un. / mês</span><strong>{money(total/n)}</strong><small>{n===draftProduction?'Cenário selecionado':'por unidade'}</small></button>)}</div></section></div><aside><section className="card allocation"><h3>Como vamos dividir?</h3><p>Critério de rateio dos custos fixos</p><label>Método de rateio<select><option>Por unidade produzida</option></select></label><label>Produção mensal estimada<div className="suffix-input wide"><input type="number" value={draftProduction} onChange={e=>setDraftProduction(Math.max(1,+e.target.value))}/><span>unidades / mês</span></div></label><hr/><small>{money(total)} ÷ {draftProduction.toLocaleString('pt-BR')} unidades</small><strong>{money(share)}</strong><span>de custo fixo em cada unidade</span><div className="plan-actions"><button className="btn cancel" onClick={cancelPlan}>Cancelar</button><PrimaryButton icon={Check} onClick={savePlan}>Salvar planejamento</PrimaryButton></div></section><div className="info-banner"><BarChart3/><div><b>Um critério simples para começar.</b><p>Todos os produtos recebem o mesmo rateio por unidade.</p></div></div><div className="yellow-card"><h3>Seus preços acompanham.</h3><p>Ao salvar, o rateio entra nas fichas técnicas e no simulador.</p></div></aside></div>{mode&&<Modal title={mode==='edit'?'Editar despesa':'Adicionar despesa'} onClose={requestExpenseClose}><SafeForm onSubmit={saveExpense} className="form-stack"><label>Descrição<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Ex.: Gás de cozinha"/></label><label>Categoria<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option>Operação</option><option>Estrutura</option><option>Pessoas</option><option>Consumo</option><option>Serviços</option></select></label><label>Valor mensal<input type="number" min="0" step=".01" value={draft.value} onChange={e=>setDraft({...draft,value:e.target.value})}/></label>{expenseError&&<p className="form-error" role="alert">{expenseError}</p>}<div className="modal-actions"><button type="button" className="btn cancel" onClick={requestExpenseClose}>Cancelar</button><button className="btn primary"><Save/>{mode==='edit'?'Salvar alterações':'Adicionar ao planejamento'}</button></div></SafeForm></Modal>}{deleteTarget&&<ConfirmDialog title="Excluir despesa" message={`Deseja realmente excluir “${deleteTarget.name}”? O total e o rateio serão recalculados.`} confirmLabel="Excluir" danger onCancel={()=>setDeleteTarget(null)} onConfirm={removeExpense}/>} {discardExpense&&<ConfirmDialog title="Descartar alterações?" message="Você possui alterações não salvas. Deseja descartá-las?" cancelLabel="Continuar editando" confirmLabel="Descartar alterações" danger onCancel={()=>setDiscardExpense(false)} onConfirm={()=>{setDiscardExpense(false);setMode(null)}}/>} {discardPlan&&<ConfirmDialog title="Descartar alterações?" message="Você possui alterações não salvas. Deseja descartá-las?" cancelLabel="Continuar editando" confirmLabel="Descartar alterações" danger onCancel={()=>setDiscardPlan(false)} onConfirm={()=>{setDraftProduction(production);setPageDirty(false);setDiscardPlan(false)}}/>}</>
}

const RATES_KEY='prato-taxas-canais'
const DEFAULT_RATES={direct:'0',ifood:'',ninenine:''}
const loadRates=()=>{try{const saved=JSON.parse(localStorage.getItem(RATES_KEY)||'null');if(saved&&typeof saved==='object'){const out={...DEFAULT_RATES};for(const k of Object.keys(DEFAULT_RATES))if(typeof saved[k]==='string')out[k]=saved[k];return out}}catch{}return {...DEFAULT_RATES}}
const RATE_INVALID='A soma da taxa do canal com a margem precisa ser menor que 100%.'
// Avalia a taxa digitada: vazia, inválida (negativa, ≥ 100% ou taxa + margem ≥ 100%) ou válida
const rateState=(raw,margin)=>{const text=String(raw??'').trim().replace(',','.');if(text==='')return {status:'empty'};const rate=Number(text);if(!Number.isFinite(rate)||rate<0||rate>=100||rate+margin>=100)return {status:'invalid'};return {status:'ok',rate}}
const ratePct=r=>`${String(round2(r)).replace('.',',')}%`
function Simulator({ products, share, saveProduct, showToast, setPage, itemMap }) {
  const options=products.filter(p=>statusOf(p)==='Ativo'&&hasRecipe(p,itemMap))
  const [productId,setProductId]=useState(options[0]?.id); const [margin,setMargin]=useState(TARGET_MARGIN); const [rates,setRates]=useState(loadRates)
  useEffect(()=>{try{localStorage.setItem(RATES_KEY,JSON.stringify(rates))}catch{}},[rates])
  const product=options.find(p=>p.id===+productId)||options[0]
  if(!product) return <><PageTitle kicker="SIMULADOR DE PREÇOS" title="Preço justo. Lucro de verdade." subtitle="Compare canais com os mesmos custos e a margem que você quer conquistar."/><section className="card empty-tab"><Calculator/><h2>Nenhum produto pronto para simular</h2><p>O simulador usa produtos ativos com ficha técnica preenchida.</p><button className="btn primary" onClick={()=>setPage('products')}>Ir para produtos<ArrowRight size={18}/></button></section></>
  const t=recipeTotals(product,itemMap); const cost=t.variableUnit+share
  const channels=[['direct','Venda direta','Balcão, WhatsApp ou retirada',Store],['ifood','iFood','Pedidos via aplicativo',Package],['ninenine','99','Pedidos via aplicativo',Calculator]]
  const calc=rate=>{const d=1-rate/100-margin/100;return d>0?cost/d:null}
  const directState=rateState(rates.direct,margin); const direct=directState.status==='ok'?calc(directState.rate):null; const markup=cost*(1+margin/100)
  const apply=()=>{if(!direct)return;saveProduct({...product,price:round2(direct)});showToast(`Preço de ${product.name} atualizado para ${money(round2(direct))}.`)}
  return <><PageTitle kicker="SIMULADOR DE PREÇOS" title="Preço justo. Lucro de verdade." subtitle="Compare canais com os mesmos custos e a margem que você quer conquistar." action={<PrimaryButton icon={Check} onClick={apply}>Usar preço da venda direta</PrimaryButton>}/><section className="card simulator-top"><label>Produto para simular<select value={product.id} onChange={e=>setProductId(+e.target.value)}>{options.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>Margem desejada<div className="suffix-input"><input type="number" min="1" max="70" value={margin} onChange={e=>setMargin(Math.min(70,Math.max(1,+e.target.value||1)))}/><span>%</span></div></label><div><span>Ingredientes</span><b>{money(t.ingredientsUnit)}</b></div><div><span>Embalagem</span><b>{money(t.packagingUnit)}</b></div><div><span>Rateio fixo</span><b>{money(share)}</b></div><div><span>Custo total / un.</span><strong>{money(cost)}</strong></div></section><div className="section-title"><div><h2>Quanto cobrar em cada canal?</h2><small className="current-price">Preço atual de venda direta: {num(product.price)>0?money(product.price):'não definido'}</small></div><span>Informe as taxas reais cobradas em cada canal.</span></div><p className="rates-disclaimer">As taxas são informadas pelo usuário. O Prato Certo não fornece nem garante taxas oficiais dos aplicativos.</p><div className="channel-grid">{channels.map(([id,name,desc,Icon])=>{const state=rateState(rates[id],margin),isApp=id!=='direct',rate=state.rate,price=state.status==='ok'?calc(rate):null;return <section className="card channel-card" key={id}><div className="channel-heading"><span><Icon/></span><div><h3>{name}</h3><p>{desc}</p></div></div><label>Taxa total do canal<div className={`suffix-input${state.status==='invalid'?' rate-invalid':''}`}><input type="number" min="0" max="99.99" step="0.01" inputMode="decimal" placeholder="Informe a taxa" value={rates[id]} aria-invalid={state.status==='invalid'||undefined} aria-describedby={isApp?`dica-${id}`:undefined} onChange={e=>setRates(r=>({...r,[id]:e.target.value}))}/><span>%</span></div>{isApp&&<small className="rate-hint" id={`dica-${id}`}>Consulte a taxa no contrato ou painel do aplicativo.</small>}</label>{state.status==='empty'?<div className="price-box pending"><span>Informe a taxa do canal para calcular.</span></div>:state.status==='invalid'?<div className="price-box invalid" role="alert"><span>{RATE_INVALID}</span></div>:<><div className="price-box"><span>Preço recomendado / unidade</span><strong>{money(price)}</strong><small>para uma margem líquida de {margin}%</small></div><p><span>Custo do produto</span><b>{money(cost)}</b></p><p><span>Taxa do canal ({ratePct(rate)})</span><b>{money(price*rate/100)}</b></p><hr/><p><b>Lucro líquido / un.</b><strong>{money(price-cost-price*rate/100)}</strong></p><div className="profit-bar"><i style={{width:`${100-rate-margin}%`}}/><i style={{width:`${rate}%`}}/><i style={{width:`${margin}%`}}/></div></>}</section>})}</div><div className="dashboard-grid formula"><section className="card"><h3>A conta, sem mistério.</h3><div className="formula-box">Preço = custo unitário ÷ (1 − taxa − margem)</div><p>As taxas e a margem são percentuais sobre o preço de venda. A soma precisa ser menor que 100%.</p></section><section className="yellow-card"><Lightbulb/><h3>Margem não é markup.</h3><p>Somar {margin}% ao custo daria {money(markup)}, que é só {pct(marginOf(markup,cost))} de margem sobre a venda.</p>{direct&&<b>Para margem de {margin}%, o preço direto é {money(direct)}.</b>}</section></div></>
}

function Consulting({ setPage }) { return <><PageTitle kicker="PLANOS" title="Planos" subtitle="Acompanhamento para o seu negócio crescer."/><div className="current-plans-grid"><section className="card current-plan"><div className="plan-title-row"><h2>Plano Crescimento</h2><span className="status current">Plano atual</span></div><div className="monthly-price"><strong>R$ 159,99</strong><small>/mês</small></div><div className="plan-benefit"><Check/>Diagnóstico dos seus custos e preços</div><button onClick={()=>setPage('consulting-detail')}>Agendar meu encontro<ArrowRight size={18}/></button></section><section className="card future-plan"><div className="plan-title-row"><h2><ShieldCheck/>Novo plano</h2><span className="development-badge">Em desenvolvimento</span></div><div className="future-content"><strong>R$ —</strong><span>Novos recursos para acompanhar o crescimento do seu negócio.</span></div><button disabled><Bell/>Você será avisada</button></section></div></> }

function ConsultingDetail({ setPage, showToast, profile }) {
  const [date,setDate]=useState(12),[time,setTime]=useState('14:00'); const days=[9,10,12,16,17,19,23,24,26,30]
  return <><div className="crumb">Consultorias / Crescimento</div><PageTitle kicker="PLANO CRESCIMENTO" title="Crescimento, com direção." subtitle="Um plano possível para sua cozinha, seus números e seus próximos clientes." action={<SecondaryButton icon={ArrowLeft} onClick={()=>setPage('consulting')}>Voltar aos planos</SecondaryButton>}/><section className="card consultant"><img src="/images/marina-costa.png"/><div><h3>Marina Costa</h3><p>Marketing e gestão para pequenos negócios de alimentação</p><span>✓ Especialista Prato Certo</span></div><i></i><div><span>Plano Crescimento</span><strong>R$ 159,99</strong><small>por mês • plano atual</small></div><span className="status">Aguardando agendamento</span></section><div className="booking-grid"><section className="card booking"><h3>Escolha seu primeiro encontro</h3><p>Diagnóstico do negócio • 60 minutos • online por videochamada</p><div className="booking-body"><div className="calendar"><b>Novembro de 2026</b><div className="week"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div><div className="days">{Array.from({length:30},(_,i)=>i+1).map(d=><button disabled={!days.includes(d)} className={d===date?'active':''} onClick={()=>setDate(d)} key={d}>{d}</button>)}</div><small>Datas destacadas têm horários disponíveis.</small></div><div className="times"><b>{date} de novembro</b><span>Selecione um horário</span><div>{['09:00','10:30','14:00','16:00'].map(x=><button className={x===time?'active':''} onClick={()=>setTime(x)} key={x}>{x}</button>)}</div><small>Horário de Brasília (UTC−3)</small></div></div></section><aside className="next-booking"><h3>Seu próximo passo</h3><div><CalendarCheck/><b>{date} nov. 2026 • {time}</b><small>Diagnóstico com Marina • até {time==='14:00'?'15:00':'próxima hora'}</small></div><hr/>{['1 diagnóstico de 60 min','1 encontro de marketing de 60 min','Plano de conteúdo + 2 campanhas','2 retornos de 30 min em 30 dias'].map(x=><p key={x}>✓ {x}</p>)}<button onClick={()=>showToast('Agendamento confirmado! Enviaremos os próximos passos.')}><Check/>Confirmar agendamento</button><small>Os demais encontros serão combinados com a especialista.</small></aside></div><section className="card goals"><h2>O que você quer conquistar?</h2><p>Essas respostas ajudam a preparar uma conversa focada no seu negócio.</p><div><label>Meu principal objetivo<select><option>Atrair mais clientes no bairro</option><option>Melhorar a margem dos produtos</option></select></label><label>Minha meta para os próximos 30 dias<input defaultValue="20 novos pedidos no mês"/></label></div><label>Meu desafio hoje<textarea defaultValue="Vendo bolos de pote pelo WhatsApp, mas ainda dependo dos conhecidos. Quero divulgar melhor sem fazer promoção que tire meu lucro."/></label></section><h2 className="ideas-title">Primeiras ideias para a {profile.business}</h2><div className="ideas-grid">{[[Camera,'PRESENÇA DIGITAL','Seja encontrada no bairro','Coloque seu bairro na bio e publique 3 conteúdos por semana.'],[Gift,'OFERTA DE ENTRADA','Crie uma oferta com margem','Teste um combo que preserve 25% de lucro na venda direta.'],[MessageCircle,'ATRAÇÃO E RECOMPRA','Transforme contato em pedido','Monte um catálogo no WhatsApp com fotos e retirada.']].map(([Icon,tag,title,text])=><section className="card" key={tag}><span><Icon/>{tag}</span><h3>{title}</h3><p>{text}</p><b>Primeira ação: começar hoje</b></section>)}</div></>
}

// ===== Estoque de ingredientes e embalagens =====
const QUICK_TYPES=['Entrada','Saída']
function ItemForm({ initial, items, products=[], lockedType, onClose, onSave }) {
  const editing=!!initial?.id; const usedBy=editing?usedIn(initial.id,products):[]
  const [form,setForm]=useState(()=>initial?{name:initial.name,type:initial.type,unit:initial.unit,packageName:initial.packageName||'',packageSize:String(initial.packageSize),price:String(initial.price),qty:String(num(initial.stock?.qty)),min:String(num(initial.stock?.min))}:{name:'',type:lockedType||'Ingrediente',unit:lockedType==='Embalagem'?'un':'g',packageName:'',packageSize:'',price:'',qty:'0',min:'0'})
  const [errors,setErrors]=useState({})
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setErrors(e=>({...e,[k]:undefined}))}
  const submit=()=>{const e={},name=form.name.trim().replace(/\s+/g,' ')
    if(!name) e.name='Informe o nome.'
    else if(items.some(it=>it.id!==initial?.id&&normName(it.name)===normName(name))) e.name='Já existe um item com esse nome no estoque.'
    if(!(num(form.packageSize)>0)) e.packageSize='Informe quanto vem na embalagem (maior que zero).'
    if(form.price===''||num(form.price)<0) e.price='Informe o preço pago pela embalagem.'
    if(!editing&&(form.qty===''||num(form.qty)<0)) e.qty='Informe a quantidade em estoque (0 ou mais).'
    if(form.min===''||num(form.min)<0) e.min='Informe o estoque mínimo (0 ou mais).'
    setErrors(e); if(Object.keys(e).length) return
    onSave({...(initial||{}),name,type:form.type,unit:form.unit,packageName:form.packageName.trim()||'embalagem',packageSize:num(form.packageSize),price:round2(num(form.price)),stock:{qty:editing?num(initial.stock?.qty):num(form.qty),min:num(form.min)}})}
  const u=UNIT_LABEL[form.unit]; const err=k=>errors[k]&&<small className="field-error">{errors[k]}</small>
  return <Modal title={editing?`Editar ${initial.name}`:lockedType==='Embalagem'?'Nova embalagem':lockedType==='Ingrediente'?'Novo ingrediente':'Novo item do estoque'} onClose={onClose}><SafeForm className="form-stack" onSubmit={submit}>
    <label>Nome<input value={form.name} onChange={e=>set('name',e.target.value)} placeholder={form.type==='Embalagem'?'Ex.: Pote 200 ml + tampa':'Ex.: Leite condensado'} aria-invalid={!!errors.name||undefined}/>{err('name')}</label>
    <div className="field-grid"><label>Tipo<select value={form.type} disabled={!!lockedType||usedBy.length>0} onChange={e=>set('type',e.target.value)}><option>Ingrediente</option><option>Embalagem</option></select></label><label>Unidade de medida<select value={form.unit} disabled={usedBy.length>0} onChange={e=>set('unit',e.target.value)}>{Object.entries(UNIT_NAME).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
    {usedBy.length>0&&<small className="form-hint">Tipo e unidade não podem mudar porque o item é usado em {usedBy.length} ficha(s) técnica(s).</small>}
    <div className="field-grid"><label>Embalagem de compra<input value={form.packageName} onChange={e=>set('packageName',e.target.value)} placeholder="lata, pacote, caixa…"/></label><label>Quanto vem na embalagem<div className="suffix-input"><input type="number" min="0" step="any" value={form.packageSize} onChange={e=>set('packageSize',e.target.value)} aria-invalid={!!errors.packageSize||undefined}/><span>{u}</span></div>{err('packageSize')}</label></div>
    <label>Preço pago pela embalagem<div className="suffix-input prefix"><span className="prefix-label">R$</span><input type="number" min="0" step=".01" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0,00" aria-invalid={!!errors.price||undefined}/></div>{err('price')}</label>
    <div className="field-grid">{!editing&&<label>Quantidade em estoque<div className="suffix-input"><input type="number" min="0" step="any" value={form.qty} onChange={e=>set('qty',e.target.value)} aria-invalid={!!errors.qty||undefined}/><span>{u}</span></div>{err('qty')}</label>}<label>Estoque mínimo<div className="suffix-input"><input type="number" min="0" step="any" value={form.min} onChange={e=>set('min',e.target.value)} aria-invalid={!!errors.min||undefined}/><span>{u}</span></div>{err('min')}</label></div>
    {editing&&<small className="form-hint">Para mudar a quantidade em estoque, use Registrar compra ou Movimentar.</small>}
    <div className="modal-actions"><button type="button" className="btn cancel" onClick={onClose}>Cancelar</button><button className="btn primary"><Check size={17}/>{editing?'Salvar alterações':'Cadastrar'}</button></div>
  </SafeForm></Modal>
}

function PurchaseModal({ items, initial, onClose, onSave }) {
  const sorted=[...items].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
  const first=items.find(it=>it.id===initial?.itemId)||sorted[0]
  const [form,setForm]=useState({itemId:first?.id,packs:String(initial?.packs||1),price:String(first?.price??'')}); const [error,setError]=useState('')
  const it=items.find(x=>x.id===+form.itemId); const add=num(form.packs)*num(it?.packageSize); const before=num(it?.stock?.qty)
  const changeItem=id=>{const n=items.find(x=>x.id===+id);setForm({...form,itemId:+id,price:String(n?.price??'')});setError('')}
  const submit=()=>{if(!(num(form.packs)>0))return setError('Informe quantas embalagens foram compradas.');if(form.price===''||num(form.price)<0)return setError('Informe o preço pago por embalagem.');onSave({itemId:it.id,packs:num(form.packs),price:round2(num(form.price))})}
  return <Modal title="Registrar compra" onClose={onClose}><SafeForm className="form-stack" onSubmit={submit}>
    <label>Item<select value={form.itemId} onChange={e=>changeItem(e.target.value)}>{sorted.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <div className="field-grid"><label>Quantidade comprada<div className="suffix-input wide-suffix"><input type="number" min="0" step="any" value={form.packs} onChange={e=>{setForm({...form,packs:e.target.value});setError('')}}/><span>{pluralize(it?.packageName||'embalagem')}</span></div></label><label>Preço por {it?.packageName||'embalagem'}<div className="suffix-input prefix"><span className="prefix-label">R$</span><input type="number" min="0" step=".01" value={form.price} onChange={e=>{setForm({...form,price:e.target.value});setError('')}}/></div></label></div>
    {it&&<div className="move-preview"><span>Entram <b>{fmtQty(add,it.unit)}</b></span><span>Estoque <b>{fmtQty(before,it.unit)}</b></span><ArrowRight size={16}/><b>{fmtQty(before+add,it.unit)}</b><span className="preview-total">Total <b>{money(num(form.packs)*num(form.price))}</b></span></div>}
    {it&&num(form.price)!==num(it.price)&&form.price!==''&&<small className="form-hint">O preço por {it.packageName} muda de {money(it.price)} para {money(num(form.price))}, e o custo das fichas técnicas que usam {it.name} é atualizado.</small>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="btn cancel" onClick={onClose}>Cancelar</button><button className="btn primary"><Check size={17}/>Registrar compra</button></div>
  </SafeForm></Modal>
}

function ProductionModal({ products, itemMap, initialProductId, onClose, onSave }) {
  const options=products.filter(p=>statusOf(p)==='Ativo'&&batchNeeds(p).size>0).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
  const [productId,setProductId]=useState(options.find(p=>p.id===initialProductId)?.id||options[0]?.id); const [batches,setBatches]=useState('1'); const [error,setError]=useState('')
  const product=options.find(p=>p.id===+productId); const n=num(batches)
  const rows=product?[...batchNeeds(product)].map(([id,q])=>{const it=itemMap.get(id);return it&&{it,need:q*n,have:num(it.stock?.qty)}}).filter(Boolean):[]
  const missing=rows.filter(r=>r.need>r.have)
  const submit=()=>{if(!product)return;if(!Number.isInteger(n)||n<1)return setError('Informe quantos lotes foram feitos (número inteiro, 1 ou mais).');if(missing.length)return setError(`Não há estoque suficiente de: ${missing.map(r=>r.it.name).join(', ')}. Registre a compra ou ajuste o estoque antes.`);onSave({productId:product.id,batches:n})}
  return <Modal title="Registrar produção" onClose={onClose}>{!product?<><p className="confirm-message">Nenhum produto ativo tem ficha técnica com ingredientes do estoque.</p><div className="modal-actions"><button className="btn primary" onClick={onClose}>Entendi</button></div></>:<SafeForm className="form-stack" onSubmit={submit}>
    <div className="field-grid"><label>Produto<select value={productId} onChange={e=>{setProductId(+e.target.value);setError('')}}>{options.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Lotes produzidos<input type="number" min="1" step="1" value={batches} onChange={e=>{setBatches(e.target.value);setError('')}}/></label></div>
    <p className="form-hint">{n>=1?`${fmtNum(n,0)} lote(s) rendem ${fmtNum(n*num(product.yield),0)} unidades. `:''}Estes itens saem do estoque:</p>
    <div className="table-wrap consume-wrap"><table className="consume-table"><thead><tr><th>Item</th><th className="numeric">Usa</th><th className="numeric">Em estoque</th><th className="numeric">Depois</th></tr></thead><tbody>{rows.map(r=><tr key={r.it.id} className={r.need>r.have?'short':''}><td>{r.it.name}</td><td className="numeric">{fmtQty(r.need,r.it.unit)}</td><td className="numeric">{fmtQty(r.have,r.it.unit)}</td><td className={`numeric ${r.need>r.have?'negative':''}`}><b>{r.need>r.have?`Faltam ${fmtQty(r.need-r.have,r.it.unit)}`:fmtQty(r.have-r.need,r.it.unit)}</b></td></tr>)}</tbody></table></div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="btn cancel" onClick={onClose}>Cancelar</button><button className="btn primary"><Check size={17}/>Registrar produção</button></div>
  </SafeForm>}</Modal>
}

function AdjustModal({ item, onClose, onSave }) {
  const [form,setForm]=useState({type:'Perda ou descarte',qty:'',min:String(num(item.stock?.min))}); const [error,setError]=useState('')
  const current=num(item.stock?.qty); const q=num(form.qty); const after=form.type==='Ajuste de contagem'?q:current-q
  const submit=()=>{if(form.qty===''||q<0||(form.type!=='Ajuste de contagem'&&q===0))return setError('Informe uma quantidade maior que zero.');if(form.min===''||num(form.min)<0)return setError('O estoque mínimo precisa ser 0 ou mais.');if(after<0)return setError(`Só há ${fmtQty(current,item.unit)} em estoque.`);onSave({itemId:item.id,type:form.type,qty:q,min:num(form.min)})}
  const u=UNIT_LABEL[item.unit]
  return <Modal title={`Movimentar ${item.name}`} onClose={onClose}><SafeForm className="form-stack" onSubmit={submit}>
    <div className="field-grid"><label>Movimento<select value={form.type} onChange={e=>{setForm({...form,type:e.target.value,qty:e.target.value==='Ajuste de contagem'?String(current):''});setError('')}}><option>Perda ou descarte</option><option>Ajuste de contagem</option></select></label><label>{form.type==='Ajuste de contagem'?'Quantidade contada':'Quantidade perdida'}<div className="suffix-input"><input type="number" min="0" step="any" value={form.qty} onChange={e=>{setForm({...form,qty:e.target.value});setError('')}}/><span>{u}</span></div></label></div>
    <label>Estoque mínimo<div className="suffix-input"><input type="number" min="0" step="any" value={form.min} onChange={e=>setForm({...form,min:e.target.value})}/><span>{u}</span></div></label>
    <div className="move-preview"><span>Em estoque agora <b>{fmtQty(current,item.unit)}</b></span><ArrowRight size={16}/><span>Depois <b className={after<0?'negative':''}>{fmtQty(after,item.unit)}</b></span></div>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="btn cancel" onClick={onClose}>Cancelar</button><button className="btn primary"><Check size={17}/>Registrar</button></div>
  </SafeForm></Modal>
}

const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const brDate=iso=>iso.split('-').reverse().join('/')
function buildStockReport(items,movements,from,to){
  const start=new Date(from+'T00:00:00'),end=new Date(to+'T23:59:59.999')
  const inPeriod=m=>{const d=new Date(m.date);return d>=start&&d<=end}
  const rows=items.map(it=>{const own=movements.filter(m=>m.itemId===it.id);const after=own.filter(m=>new Date(m.date)>end).reduce((t,m)=>t+m.change,0);const final=Math.max(0,num(it.stock?.qty)-after);const min=num(it.stock?.min);const level=final<=0?'Sem estoque':min>0&&final<min?'Baixo':'Normal';return {id:it.id,name:it.name,type:it.type,unit:it.unit,pkg:describePackage(it),final,value:final*itemUnitPrice(it),level}}).sort((a,b)=>(a.type==='Ingrediente'?0:1)-(b.type==='Ingrediente'?0:1)||a.name.localeCompare(b.name,'pt-BR'))
  const inside=movements.filter(inPeriod)
  return {from,to,generatedAt:new Date().toISOString(),rows,value:rows.reduce((t,r)=>t+r.value,0),low:rows.filter(r=>r.level!=='Normal').length,purchases:inside.filter(m=>m.type==='Compra').reduce((t,m)=>t+num(m.value),0),consumption:inside.filter(m=>m.type==='Produção').reduce((t,m)=>t+num(m.value),0)}
}

function DateField({ id, label, value, onChange, invalid }) {
  const ref=useRef(null)
  const open=()=>{const el=ref.current;if(!el)return;el.focus();try{el.showPicker()}catch{}}
  return <div className="date-field"><label htmlFor={id}>{label}</label><div className={`date-input${invalid?' invalid':''}`}><input ref={ref} id={id} type="date" value={value} onChange={e=>onChange(e.target.value)} aria-invalid={invalid||undefined}/><button type="button" onClick={open} aria-label={`Abrir calendário: ${label}`} title="Abrir calendário"><CalendarDays size={18}/></button></div></div>
}

const imageData=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{try{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);resolve({data:c.toDataURL('image/png'),w:img.naturalWidth,h:img.naturalHeight})}catch(e){reject(e)}};img.onerror=reject;img.src=src})
async function downloadStockPdf(report,business){
  const logo=await imageData(LOGO.full).catch(()=>null)
  const doc=new jsPDF({unit:'mm',format:'a4'})
  const W=210,M=16,blue=[11,79,108],ink=[19,33,43],muted=[95,107,118],line=[225,230,236]
  const colors={'Normal':[15,122,79],'Baixo':[181,71,8],'Sem estoque':[180,35,24]}
  const generated=new Date(report.generatedAt).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
  let y=18
  if(logo){const h=13;doc.addImage(logo.data,'PNG',M,y-9.5,h*logo.w/logo.h,h)}else{doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(...blue);doc.text('Prato Certo',M,y)}
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...muted);doc.text(`Gerado em ${generated}`,W-M,y,{align:'right'})
  y+=15;doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(...blue);doc.setCharSpace(.6);doc.text('RELATÓRIO DE ESTOQUE DE INGREDIENTES',M,y);doc.setCharSpace(0)
  y+=9;doc.setFontSize(20);doc.setTextColor(...ink);doc.text(doc.splitTextToSize(business,W-2*M)[0],M,y)
  y+=7;doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.setTextColor(...muted);doc.text(`Período: ${brDate(report.from)} a ${brDate(report.to)}`,M,y)
  y+=9
  const boxes=[['Valor em estoque',money(report.value)],['Compras no período',money(report.purchases)],['Abaixo do mínimo',`${report.low} ite${report.low===1?'m':'ns'}`]],gap=5,bw=(W-2*M-2*gap)/3
  boxes.forEach(([label,val],i)=>{const x=M+i*(bw+gap);doc.setDrawColor(...line);doc.setLineWidth(.3);doc.roundedRect(x,y,bw,20,2.5,2.5,'S');doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...muted);doc.text(label,x+5,y+7.5);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(...ink);doc.text(val,x+5,y+15.5)})
  y+=30
  const cols=[['Item',M+3,'left'],['Em estoque',128,'right'],['Valor em estoque',162,'right'],['Situação',168,'left']]
  const header=()=>{doc.setFillColor(244,246,249);doc.rect(M,y,W-2*M,9,'F');doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor(...muted);cols.forEach(([t,x,align])=>doc.text(t,x,y+6,{align}));y+=9}
  header()
  report.rows.forEach(r=>{
    if(y>262){doc.addPage();y=20;header()}
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...ink);doc.text(doc.splitTextToSize(r.name,90)[0],M+3,y+6)
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);doc.text(doc.splitTextToSize(`${r.type} • ${r.pkg}`,92)[0],M+3,y+10.3)
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...ink);doc.text(fmtQty(r.final,r.unit),128,y+7.6,{align:'right'})
    doc.setFont('helvetica','normal');doc.text(money(r.value),162,y+7.6,{align:'right'})
    doc.setFont('helvetica','bold');doc.setTextColor(...colors[r.level]);doc.text(r.level,168,y+7.6)
    y+=13;doc.setDrawColor(...line);doc.setLineWidth(.25);doc.line(M,y,W-M,y)
  })
  if(y>262){doc.addPage();y=20}
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...ink);doc.text('Total',M+3,y+7.6);doc.text(money(report.value),162,y+7.6,{align:'right'})
  y+=11;doc.setDrawColor(...ink);doc.setLineWidth(.4);doc.line(M,y,W-M,y)
  const pages=doc.getNumberOfPages()
  for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);doc.text(`Valores pelo preço de compra atual de cada item. Consumo em produção no período: ${money(report.consumption)}.`,M,287);doc.text(`Página ${i} de ${pages}`,W-M,287,{align:'right'})}
  doc.save(`relatorio-estoque-ingredientes_${report.from}_a_${report.to}.pdf`)
}

function Stock({ items, products, movements, itemMap, saveItem, deleteItem, recordPurchase, recordProduction, adjustItem, quickMove, showToast, profile, migrationNotes, dismissNotes }) {
  const [query,setQuery]=useState(''); const [typeFilter,setTypeFilter]=useState('Todos'); const [level,setLevel]=useState('Todas')
  const [form,setForm]=useState(null); const [purchase,setPurchase]=useState(null); const [production,setProduction]=useState(null); const [adjust,setAdjust]=useState(null); const [deleteTarget,setDeleteTarget]=useState(null)
  const [reportFrom,setReportFrom]=useState(()=>{const d=new Date();return isoDate(new Date(d.getFullYear(),d.getMonth(),1))}); const [reportTo,setReportTo]=useState(()=>{const d=new Date();return isoDate(new Date(d.getFullYear(),d.getMonth()+1,0))}); const [reportError,setReportError]=useState(''); const [confirmReport,setConfirmReport]=useState(false)
  const generateReport=()=>{if(!reportFrom||!reportTo)return setReportError('Preencha as duas datas para gerar o relatório.');if(reportFrom>reportTo)return setReportError('A data inicial precisa ser igual ou anterior à data final.');setReportError('');setConfirmReport(true)}
  const createReportPdf=async()=>{setConfirmReport(false);try{await downloadStockPdf(buildStockReport(items,movements,reportFrom,reportTo),profile?.business||'Meu negócio');showToast('Relatório em PDF gerado.')}catch{setReportError('Não foi possível gerar o PDF. Tente de novo.')}}
  const value=items.reduce((t,it)=>t+itemValue(it),0)
  const toBuy=items.filter(it=>stockLevel(it)!=='Normal').map(it=>{const gap=Math.max(num(it.stock?.min)-num(it.stock?.qty),0);const packs=Math.max(1,Math.ceil(gap/Math.max(num(it.packageSize),1e-9)));return {it,packs,cost:packs*num(it.price)}}).sort((a,b)=>(stockLevel(a.it)==='Sem estoque'?0:1)-(stockLevel(b.it)==='Sem estoque'?0:1)||a.it.name.localeCompare(b.it.name,'pt-BR'))
  const empty=items.filter(it=>stockLevel(it)==='Sem estoque').length
  const list=items.filter(it=>{const term=query.trim().toLocaleLowerCase('pt-BR');return(!term||it.name.toLocaleLowerCase('pt-BR').includes(term))&&(typeFilter==='Todos'||(typeFilter==='Ingredientes'?it.type==='Ingrediente':it.type==='Embalagem'))&&(level==='Todas'||stockLevel(it)===level)}).sort((a,b)=>(a.type==='Ingrediente'?0:1)-(b.type==='Ingrediente'?0:1)||a.name.localeCompare(b.name,'pt-BR'))
  const when=d=>new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
  const saveForm=data=>{const saved=saveItem(data);setForm(null);showToast(data.id?`${saved.name} atualizado.`:`${saved.name} cadastrado.`)}
  const savePurchase=d=>{recordPurchase(d);setPurchase(null);showToast('Compra registrada.')}
  const saveProduction=d=>{const p=products.find(x=>x.id===d.productId);recordProduction(d);setProduction(null);showToast(`Produção de ${d.batches} lote(s) de ${p?.name} registrada.`)}
  const saveAdjust=d=>{adjustItem(d);setAdjust(null);showToast('Movimentação registrada.')}
  const askDelete=it=>{const users=usedIn(it.id,products);if(users.length)return showToast(`${it.name} é usado em: ${users.map(p=>p.name).join(', ')}. Tire das fichas antes de excluir.`);setDeleteTarget(it)}
  return <><PageTitle kicker="ESTOQUE" title="Estoque de ingredientes" subtitle="Veja o que tem em casa, o que está acabando e registre compras e produções." action={<div className="action-row stock-head-actions"><SecondaryButton icon={Plus} onClick={()=>setForm({})}>Novo item</SecondaryButton><SecondaryButton icon={Utensils} onClick={()=>setProduction({})}>Registrar produção</SecondaryButton><PrimaryButton icon={PackagePlus} onClick={()=>setPurchase({})}>Registrar compra</PrimaryButton></div>}/>
  {migrationNotes&&<div className="info-banner migration-banner"><Boxes/><div><b>O estoque agora é de ingredientes.</b><p>Criamos {migrationNotes.created} item(ns) a partir das suas fichas técnicas. As quantidades começam em zero: registre as compras ou ajuste a contagem de cada item.{migrationNotes.conflicts?.length?` Estes itens tinham preços diferentes entre fichas e ficaram com o primeiro preço encontrado; confira: ${migrationNotes.conflicts.join(', ')}.`:''}</p><button className="text-link" onClick={dismissNotes}>Entendi</button></div></div>}
  <div className="stats-grid"><StatCard icon={Boxes} label="Itens cadastrados" value={items.length} helper={`${items.filter(i=>i.type==='Ingrediente').length} ingredientes • ${items.filter(i=>i.type==='Embalagem').length} embalagens`}/><StatCard icon={WalletCards} label="Valor em estoque" value={money(value)} helper="Pelo preço de compra de cada item"/><StatCard icon={TriangleAlert} label="Abaixo do mínimo" value={toBuy.length} helper={toBuy.length?'Itens para repor':'Tudo acima do mínimo'}/><StatCard icon={PackageMinus} label="Sem estoque" value={empty} helper={empty?'Itens zerados':'Nenhum item zerado'}/></div>
  <section className="card check-card"><div className="section-head"><div><h3>Lista de compras</h3><p>Itens abaixo do mínimo, com a quantidade sugerida para voltar ao mínimo.</p></div>{toBuy.length>0&&<b className="buy-total">Estimativa: {money(toBuy.reduce((t,x)=>t+x.cost,0))}</b>}</div>{toBuy.length===0?<div className="check-ok"><CircleCheck/>Nada para comprar agora: todos os itens estão acima do mínimo.</div>:<ul className="buy-list">{toBuy.map(({it,packs,cost})=><li key={it.id}><span className={`issue-dot ${stockLevel(it)==='Sem estoque'?'danger':'warn'}`}/><div><b>{it.name}</b><small>Tem {fmtQty(it.stock?.qty,it.unit)} • mínimo {fmtQty(it.stock?.min,it.unit)}</small></div><span className="buy-qty">Comprar {fmtPkgs(packs,it)} <small>≈ {money(cost)}</small></span><button className="btn secondary small" onClick={()=>setPurchase({itemId:it.id,packs})}>Registrar compra</button></li>)}</ul>}</section>
  <section className="card products-card"><div className="product-filters stock-filters"><label className="search product-search"><span>Buscar item</span><div><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nome do ingrediente ou embalagem"/></div></label><label>Tipo<select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>Todos</option><option>Ingredientes</option><option>Embalagens</option></select></label><label>Situação do estoque<select value={level} onChange={e=>setLevel(e.target.value)}><option>Todas</option><option>Normal</option><option>Baixo</option><option>Sem estoque</option></select></label><div className="report-inline"><DateField id="relatorio-de" label="De" value={reportFrom} onChange={v=>{setReportFrom(v);setReportError('')}} invalid={!!reportError&&(!reportFrom||reportFrom>reportTo)}/><DateField id="relatorio-ate" label="Até" value={reportTo} onChange={v=>{setReportTo(v);setReportError('')}} invalid={!!reportError&&(!reportTo||reportFrom>reportTo)}/><button className="btn primary report-btn" onClick={generateReport}>Gerar relatório</button></div></div>{reportError&&<p className="form-error report-error" role="alert">{reportError}</p>}
  <div className="table-wrap"><table className="stock-table items-table"><thead><tr><th>Item</th><th>Tipo</th><th className="numeric">Em estoque</th><th className="numeric">Mínimo</th><th className="numeric">Valor em estoque</th><th>Situação do estoque</th><th>Ações</th></tr></thead><tbody>{list.map(it=>{const lvl=stockLevel(it),users=usedIn(it.id,products).length,q=num(it.stock?.qty);return <tr key={it.id}><td><div className="item-cell"><b>{it.name}</b><small>{describePackage(it)}{users?` • usado em ${users} produto${users===1?'':'s'}`:' • não usado em fichas'}</small></div></td><td>{it.type}</td><td className="numeric"><b>{fmtQty(q,it.unit)}</b><small className="sub-qty">≈ {fmtPkgs(q/num(it.packageSize),it)}</small></td><td className="numeric">{num(it.stock?.min)?fmtQty(it.stock.min,it.unit):'—'}</td><td className="numeric">{money(itemValue(it))}</td><td><span className={`status-text ${stockClass[lvl]}`}>{lvl}</span></td><td><div className="stock-actions"><div className="qty-stepper"><button className="step-btn" onClick={()=>quickMove(it,'Saída')} disabled={q<=0} aria-label={`Tirar 1 ${it.packageName} de ${it.name}`} title={`Tirar 1 ${it.packageName} (${fmtQty(it.packageSize,it.unit)})`}><Minus size={16}/></button><button className="step-btn" onClick={()=>quickMove(it,'Entrada')} aria-label={`Adicionar 1 ${it.packageName} de ${it.name}`} title={`Adicionar 1 ${it.packageName} (${fmtQty(it.packageSize,it.unit)})`}><Plus size={16}/></button></div><button className="btn secondary small" onClick={()=>setAdjust(it)}>Movimentar</button><ActionButtons editTitle={`Editar ${it.name}`} deleteTitle={`Excluir ${it.name}`} onEdit={()=>setForm(it)} onDelete={()=>askDelete(it)}/></div></td></tr>})}</tbody></table>{list.length===0&&<div className="empty-results">{items.length?'Nenhum item encontrado com os filtros selecionados.':'Nenhum item cadastrado. Use “Novo item” para começar.'}</div>}</div><div className="table-foot">Mostrando {list.length} de {items.length} itens • os botões − e + tiram ou adicionam uma embalagem de compra</div></section>
  <section className="card list-card"><div className="section-head"><div><h3>Movimentações recentes</h3><p>Compras, produções, perdas e ajustes registrados neste navegador.</p></div></div>{movements.length===0?<div className="empty-results"><History/> Nenhuma movimentação registrada ainda.</div>:<div className="table-wrap"><table><thead><tr><th>Data</th><th>Item</th><th>Movimento</th><th className="numeric">Quantidade</th><th className="numeric">Saldo</th></tr></thead><tbody>{movements.slice(0,15).map(m=><tr key={m.id}><td>{when(m.date)}</td><td><b>{m.itemName}</b></td><td>{m.type}{m.detail?<small className="move-detail">{m.detail}</small>:null}</td><td className={`numeric ${m.change>0?'positive':'negative'}`}><b>{m.change>0?'+':'−'}{fmtQty(Math.abs(m.change),m.unit)}</b></td><td className="numeric">{fmtQty(m.balance,m.unit)}</td></tr>)}</tbody></table></div>}</section>
  {form&&<ItemForm initial={form.id?form:null} items={items} products={products} onClose={()=>setForm(null)} onSave={saveForm}/>}
  {purchase&&items.length>0&&<PurchaseModal items={items} initial={purchase} onClose={()=>setPurchase(null)} onSave={savePurchase}/>}
  {production&&<ProductionModal products={products} itemMap={itemMap} initialProductId={production.productId} onClose={()=>setProduction(null)} onSave={saveProduction}/>}
  {adjust&&<AdjustModal item={adjust} onClose={()=>setAdjust(null)} onSave={saveAdjust}/>}
  {deleteTarget&&<ConfirmDialog title="Excluir item" message={`Deseja realmente excluir “${deleteTarget.name}” do estoque?`} confirmLabel="Excluir" danger onCancel={()=>setDeleteTarget(null)} onConfirm={()=>{deleteItem(deleteTarget.id);setDeleteTarget(null);showToast('Item excluído.')}}/>}
  {confirmReport&&<ConfirmDialog title="Gerar relatório em PDF?" message={`Será gerado um PDF com o estoque de ingredientes de ${brDate(reportFrom)} a ${brDate(reportTo)}. Deseja continuar?`} cancelLabel="Cancelar" confirmLabel="Gerar PDF" onCancel={()=>setConfirmReport(false)} onConfirm={createReportPdf}/>}</>
}

export default function App() {
  const [session,setSession]=useState(()=>{try{return sessionStorage.getItem('prato-session')}catch{return null}})
  const [plan,setPlan]=useState(readPlan)
  const choosePlan=id=>{try{sessionStorage.setItem('prato-plano',id);sessionStorage.setItem('prato-tela','signup')}catch{} setAuthView('signup'); setPlan(id); window.scrollTo(0,0)}
  const changePlan=()=>{try{sessionStorage.removeItem('prato-plano')}catch{} setPlan(null); window.scrollTo(0,0)}
  const [authView,setAuthView]=useState(()=>{try{return sessionStorage.getItem('prato-tela')==='login'?'login':'signup'}catch{return 'signup'}})
  const showAuth=view=>{try{sessionStorage.setItem('prato-tela',view)}catch{} setAuthView(view); window.scrollTo(0,0)}
  const [profile,setProfile]=useState(()=>{try{return JSON.parse(localStorage.getItem('prato-profile')||'null')}catch{return null}})
  const [stored]=useState(loadData)
  const [products,setProducts]=useState(()=>stored?.products||initialProducts),[expenses,setExpenses]=useState(()=>stored?.expenses||initialExpenses),[production,setProduction]=useState(()=>stored?.production||1200),[movements,setMovements]=useState(()=>stored?.movements||[]),[items,setItems]=useState(()=>stored?.items||initialItems),[migrationNotes,setMigrationNotes]=useState(()=>stored?.migrationNotes||null)
  const [editingProfile,setEditingProfile]=useState(false),[page,setPage]=useState('dashboard'),[selectedProductId,setSelectedProductId]=useState(null),[toast,setToast]=useState(''),[pageDirty,setPageDirty]=useState(false),[pendingPage,setPendingPage]=useState(null),[saveError,setSaveError]=useState(false)
  useEffect(()=>{ window.scrollTo({top:0,behavior:'smooth'}) },[page])
  useEffect(()=>{try{localStorage.setItem(DATA_KEY,JSON.stringify({version:2,products,items,expenses,production,movements,migrationNotes}));setSaveError(false)}catch{setSaveError(true)}},[products,items,expenses,production,movements,migrationNotes])
  const itemMap=useMemo(()=>new Map(items.map(it=>[it.id,it])),[items])
  const saveProfile=p=>{try{localStorage.setItem('prato-profile',JSON.stringify(p))}catch{} setProfile(p);setEditingProfile(false);setPage('dashboard');setToast('Dados do negócio salvos.')}
  const nameFromEmail=mail=>mail.split('@')[0].split(/[._-]+/).filter(Boolean).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')||'Minha conta'
  const login=mail=>{try{sessionStorage.setItem('prato-session',mail)}catch{} if(!profile){const p={owner:nameFromEmail(mail),business:'Meu negócio',segment:'Confeitaria artesanal',city:''};try{localStorage.setItem('prato-profile',JSON.stringify(p))}catch{} setProfile(p)} setPage('dashboard'); setSession(mail)}
  const [createdEmail,setCreatedEmail]=useState(null)
  const createAccount=({name,email,phone})=>{const p={owner:name,business:'Meu negócio',segment:'Confeitaria artesanal',city:'',email,phone};try{localStorage.setItem('prato-profile',JSON.stringify(p))}catch{} setProfile(p);setCreatedEmail(email);showAuth('login')}
  const logout=()=>{try{sessionStorage.removeItem('prato-session');sessionStorage.setItem('prato-tela','login')}catch{} setAuthView('login'); setPageDirty(false); setPendingPage(null); setEditingProfile(false); setSession(null)}
  if(!session||!profile){if(!plan) return <PlanSelect onSelect={choosePlan}/>; return authView==='login'?<Login key={createdEmail||'login'} onLogin={mail=>{setCreatedEmail(null);login(mail)}} plan={plan} onChangePlan={changePlan} onGoSignup={()=>{setCreatedEmail(null);showAuth('signup')}} createdEmail={createdEmail}/>:<Signup plan={plan} onChangePlan={changePlan} onCreated={createAccount} onGoLogin={()=>showAuth('login')}/>}
  if(editingProfile) return <Onboarding initial={profile} onSave={saveProfile} onCancel={()=>setEditingProfile(false)}/>
  const navigate=target=>{if(pageDirty&&target!==page)setPendingPage(target);else if(target==='settings')setEditingProfile(true);else setPage(target)}; const forceNavigate=target=>{setPageDirty(false);setPage(target)}; const confirmNavigation=()=>{const target=pendingPage;setPageDirty(false);setPendingPage(null);if(target==='settings')setEditingProfile(true);else setPage(target)}
  const fixedTotal=expenses.reduce((a,x)=>a+num(x.value),0); const share=fixedTotal/Math.max(1,production); const showToast=t=>setToast(t)
  const openProduct=p=>{setSelectedProductId(p.id);setPage('recipe')}; const saveProduct=updated=>setProducts(list=>list.map(p=>p.id===updated.id?updated:p)); const selectedProduct=products.find(p=>p.id===selectedProductId)
  // ----- estoque de ingredientes e embalagens
  const logMoves=entries=>setMovements(list=>[...entries,...list].slice(0,300))
  const moveEntry=(it,type,change,balance,extra={})=>({id:Date.now()+Math.random(),date:new Date().toISOString(),itemId:it.id,itemName:it.name,unit:it.unit,type,change,balance,...extra})
  const saveItem=data=>{if(data.id){const saved={...data};setItems(list=>list.map(it=>it.id===saved.id?saved:it));return saved}const saved={...data,id:Math.max(0,...items.map(i=>i.id))+1+Math.floor(Math.random()*1000)};setItems(list=>[...list,saved]);if(num(saved.stock?.qty)>0)logMoves([moveEntry(saved,'Estoque inicial',num(saved.stock.qty),num(saved.stock.qty))]);return saved}
  const deleteItem=id=>setItems(list=>list.filter(it=>it.id!==id))
  const recordPurchase=({itemId,packs,price})=>{const it=itemMap.get(itemId);if(!it)return;const add=packs*num(it.packageSize),after=num(it.stock?.qty)+add;setItems(list=>list.map(x=>x.id===itemId?{...x,price,stock:{...x.stock,qty:after}}:x));logMoves([moveEntry(it,'Compra',add,after,{value:packs*price,detail:`${fmtPkgs(packs,it)} a ${money(price)}`})])}
  const recordProduction=({productId,batches})=>{const p=products.find(x=>x.id===productId);if(!p)return;const needs=[...batchNeeds(p)].map(([id,q])=>[itemMap.get(id),q*batches]).filter(([it])=>it);if(needs.some(([it,q])=>q>num(it.stock?.qty)))return;const after=new Map(needs.map(([it,q])=>[it.id,num(it.stock?.qty)-q]));setItems(list=>list.map(x=>after.has(x.id)?{...x,stock:{...x.stock,qty:after.get(x.id)}}:x));logMoves(needs.map(([it,q])=>moveEntry(it,'Produção',-q,after.get(it.id),{value:q*itemUnitPrice(it),detail:`${batches} lote(s) de ${p.name}`})))}
  const adjustItem=({itemId,type,qty,min})=>{const it=itemMap.get(itemId);if(!it)return;const before=num(it.stock?.qty),after=type==='Ajuste de contagem'?qty:Math.max(0,before-qty);setItems(list=>list.map(x=>x.id===itemId?{...x,stock:{qty:after,min}}:x));if(after!==before)logMoves([moveEntry(it,type,after-before,after,{value:Math.abs(after-before)*itemUnitPrice(it)})])}
  const quickMove=(it,type)=>{const step=num(it.packageSize),before=num(it.stock?.qty),after=type==='Entrada'?before+step:Math.max(0,before-step);if(after===before)return;setItems(list=>list.map(x=>x.id===it.id?{...x,stock:{...x.stock,qty:after}}:x));const now=Date.now();setMovements(list=>{const last=list[0];if(last&&last.itemId===it.id&&last.type===type&&now-new Date(last.date).getTime()<60000)return [{...last,date:new Date(now).toISOString(),change:last.change+(after-before),balance:after},...list.slice(1)];return [moveEntry(it,type,after-before,after),...list].slice(0,300)})}
  const screens={dashboard:<Dashboard {...{profile,products,expenses,fixedTotal,production,share,items,itemMap}} setPage={navigate}/>,products:<Products {...{products,setProducts,openProduct,showToast,share,itemMap}}/>,stock:<Stock {...{items,products,movements,itemMap,saveItem,deleteItem,recordPurchase,recordProduction,adjustItem,quickMove,showToast,profile,migrationNotes}} dismissNotes={()=>setMigrationNotes(null)}/>,recipe:selectedProduct?<Recipe product={selectedProduct} share={share} items={items} itemMap={itemMap} saveItem={saveItem} setPage={forceNavigate} navigate={navigate} {...{showToast,saveProduct,setPageDirty}}/>:<Products {...{products,setProducts,openProduct,showToast,share,itemMap}}/>,costs:<Costs {...{expenses,setExpenses,production,setProduction,showToast,setPageDirty}}/>,simulator:<Simulator {...{products,share,saveProduct,showToast,itemMap}} setPage={navigate}/>,consulting:<Consulting setPage={navigate}/>,'consulting-detail':<ConsultingDetail setPage={navigate} {...{showToast,profile}}/>}
  const saveState=saveError?'error':pageDirty?'dirty':'ok'
  return <Shell page={page} setPage={navigate} profile={profile} onSettings={()=>navigate('settings')} onLogout={logout} saveState={saveState}>{screens[page]}{toast&&<Toast text={toast} onClose={()=>setToast('')}/>} {pendingPage&&<ConfirmDialog title="Descartar alterações?" message="Você possui alterações não salvas. Deseja descartá-las?" cancelLabel="Continuar editando" confirmLabel="Descartar alterações" danger onCancel={()=>setPendingPage(null)} onConfirm={confirmNavigation}/>}</Shell>
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients, useCreateOrder } from '../hooks/useData'
import { formatCurrencyInput, formatCPF } from '../utils/formatters'
import { validateIMEI } from '../utils/validators'
import { ArrowLeft, ChevronRight, Check, Smartphone, Wrench, Zap, CreditCard, Banknote, Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', borderS:'rgba(0,0,0,0.12)',
  text:'#0C0C0E', t2:'#6B7280', t3:'#9CA3AF', bg:'#F7F7F8',
  accent:'#0A66FF', accentL:'#EEF4FF', green:'#16A34A', greenL:'#F0FDF4',
  red:'#DC2626', redL:'#FEF2F2', amber:'#D97706', amberL:'#FFFBEB',
  shadow:'0 1px 2px rgba(0,0,0,0.05),0 0 0 1px rgba(0,0,0,0.06)',
}

const IPHONE_MODELS = [
  { s:'iPhone 16', m:['iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max'] },
  { s:'iPhone 15', m:['iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max'] },
  { s:'iPhone 14', m:['iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max'] },
  { s:'iPhone 13', m:['iPhone 13 mini','iPhone 13','iPhone 13 Pro','iPhone 13 Pro Max'] },
  { s:'iPhone 12', m:['iPhone 12 mini','iPhone 12','iPhone 12 Pro','iPhone 12 Pro Max'] },
  { s:'iPhone 11', m:['iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max'] },
  { s:'iPhone SE', m:['iPhone SE (1ª gen)','iPhone SE (2ª gen)','iPhone SE (3ª gen)'] },
  { s:'iPhone X/XS', m:['iPhone X','iPhone XR','iPhone XS','iPhone XS Max'] },
  { s:'Antigos', m:['iPhone 8','iPhone 8 Plus','iPhone 7','iPhone 7 Plus','iPhone 6s','iPhone 6s Plus','iPhone 6','iPhone 6 Plus'] },
]

const PAY_OPTS = [
  { v:'pix',           l:'Pix',            icon:Zap },
  { v:'dinheiro',      l:'Dinheiro',        icon:Banknote },
  { v:'cartao_credito',l:'Crédito',         icon:CreditCard },
  { v:'cartao_debito', l:'Débito',          icon:CreditCard },
  { v:'iphone_entrada',l:'iPhone Entrada',  icon:Smartphone },
]

const PARCELAS_OPTS = [1,2,3,4,5,6,7,8,9,10,11,12]

const TRADE_CAPACITIES = ['16GB','32GB','64GB','128GB','256GB','512GB','1TB']

// Converte string formatada "1.000,00" para número
const parseVal = (str) => parseFloat((str || '0').replace(/\./g,'').replace(',','.')) || 0

// Formata número para string de moeda "1.000,00"
const fmtNum = (num) => num.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })

export default function NewOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const { data: clientsData } = useClients({ limit:100 })
  const clients = clientsData?.data || []

  const [step, setStep] = useState(1)
  const [modelSearch, setModelSearch] = useState('')
  const [modelOpen, setModelOpen] = useState(false)
  const [tradeModelOpen, setTradeModelOpen] = useState(false)
  const [tradeModelSearch, setTradeModelSearch] = useState('')
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    client_id:'', type:'venda', iphone_model:'', capacity:'', color:'',
    imei:'', price:'', warranty_months:'12', notes:'', payment_methods:[],
  })

  // Detalhes de pagamento por método
  const [pd, setPdState] = useState({
    pix:           { value:'' },
    dinheiro:      { value:'' },
    cartao_credito:{ value:'', parcelas:'1' },
    cartao_debito: { value:'' },
    iphone_entrada:{ value:'', model:'', capacity:'', color:'', imei:'' },
  })

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }

  const setPd = (method, field, val) => {
    setPdState(p => ({ ...p, [method]: { ...p[method], [field]: val } }))
    setErrors(e => ({ ...e, [`pd_${method}_${field}`]: '' }))
  }

  const togglePay = (v) => {
    set('payment_methods',
      form.payment_methods.includes(v)
        ? form.payment_methods.filter(x=>x!==v)
        : [...form.payment_methods, v]
    )
  }

  // ─── Cálculos de pagamento ────────────────────────────────────
  const totalPrice   = parseVal(form.price)
  const tradeInValue = form.payment_methods.includes('iphone_entrada') ? parseVal(pd.iphone_entrada.value) : 0
  const cashTotal    = Math.max(0, totalPrice - tradeInValue)
  const cashMethods  = form.payment_methods.filter(m => m !== 'iphone_entrada')

  // Método "auto": último cash method sem valor digitado (se só 1 sem valor)
  const filledCash = cashMethods.filter(m => parseVal(pd[m].value) > 0)
  const unfilledCash = cashMethods.filter(m => parseVal(pd[m].value) === 0)
  const autoMethod = unfilledCash.length === 1 ? unfilledCash[0] : null

  const getEffectiveValue = (method) => {
    if (method === 'iphone_entrada') return tradeInValue
    if (method === autoMethod) {
      const sumOthers = cashMethods
        .filter(m => m !== autoMethod)
        .reduce((s,m) => s + parseVal(pd[m].value), 0)
      return Math.max(0, cashTotal - sumOthers)
    }
    return parseVal(pd[method].value)
  }

  const cashAllocated = cashMethods.reduce((s,m) => s + getEffectiveValue(m), 0)
  const remainder     = cashTotal - cashAllocated
  const isBalanced    = Math.abs(remainder) < 0.01
  const isOver        = remainder < -0.01

  // Filtros de busca de modelo
  const filteredModels = IPHONE_MODELS
    .map(g=>({ ...g, m:g.m.filter(m=>m.toLowerCase().includes(modelSearch.toLowerCase())) }))
    .filter(g=>g.m.length>0)

  const filteredTradeModels = IPHONE_MODELS
    .map(g=>({ ...g, m:g.m.filter(m=>m.toLowerCase().includes(tradeModelSearch.toLowerCase())) }))
    .filter(g=>g.m.length>0)

  // ─── Validação por step ───────────────────────────────────────
  const validate = () => {
    const e = {}
    if (step===1 && !form.client_id) e.client_id = 'Selecione um cliente'
    if (step===2 && !form.iphone_model) e.iphone_model = 'Selecione o modelo'
    if (step===2 && form.imei && !validateIMEI(form.imei)) e.imei = 'IMEI inválido'
    if (step===3) {
      if (!form.price) e.price = 'Informe o valor'
      if (!form.payment_methods.length) e.payment_methods = 'Selecione ao menos uma forma'
      if (form.payment_methods.includes('iphone_entrada')) {
        if (!pd.iphone_entrada.model)  e.pd_iphone_entrada_model = 'Informe o modelo'
        if (!pd.iphone_entrada.value || parseVal(pd.iphone_entrada.value) === 0)
          e.pd_iphone_entrada_value = 'Informe o valor'
        if (parseVal(pd.iphone_entrada.value) >= totalPrice)
          e.pd_iphone_entrada_value = 'Valor de entrada não pode ser maior ou igual ao total'
        if (pd.iphone_entrada.imei && !validateIMEI(pd.iphone_entrada.imei))
          e.pd_iphone_entrada_imei = 'IMEI inválido'
      }
      if (isOver) e.payment_methods = 'Total dos pagamentos excede o valor do produto'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s=>s+1) }

  // ─── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return

    const priceNum = parseVal(form.price)

    // Monta notas de pagamento automaticamente
    const paymentLines = []
    if (form.payment_methods.includes('iphone_entrada')) {
      const d = pd.iphone_entrada
      paymentLines.push(
        `iPhone de Entrada: ${d.model}${d.capacity ? ' '+d.capacity : ''}${d.color ? ' '+d.color : ''}` +
        `${d.imei ? ' | IMEI: '+d.imei : ''} | Valor: R$ ${d.value}`
      )
    }
    cashMethods.forEach(m => {
      const label = PAY_OPTS.find(p=>p.v===m)?.l || m
      const val = getEffectiveValue(m)
      let line = `${label}: R$ ${fmtNum(val)}`
      if (m === 'cartao_credito' && pd.cartao_credito.parcelas !== '1')
        line += ` em ${pd.cartao_credito.parcelas}x`
      paymentLines.push(line)
    })

    const paymentNote = paymentLines.join(' | ')
    const userNotes   = form.notes?.trim()
    const combinedNotes = [paymentNote, userNotes].filter(Boolean).join('\n')

    await createOrder.mutateAsync({
      ...form,
      price: priceNum,
      warranty_months: parseInt(form.warranty_months) || 0,
      imei: form.imei || undefined,
      notes: combinedNotes || undefined,
    })
  }

  // ─── Helpers de estilo ────────────────────────────────────────
  const inp = (err) => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${err?T.red:T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box',
  })

  const lbl = (txt, required) => (
    <label style={{ fontSize:12, fontWeight:500, color:T.t2, display:'block', marginBottom:6 }}>
      {txt}{required && <span style={{ color:T.red }}> *</span>}
    </label>
  )

  const errTip = (key) => errors[key] && (
    <span style={{ fontSize:11, color:T.red, marginTop:3, display:'flex', alignItems:'center', gap:3 }}>
      <AlertCircle size={10}/>{errors[key]}
    </span>
  )

  const steps = [{n:1,l:'Cliente & Tipo'},{n:2,l:'Produto'},{n:3,l:'Pagamento'}]

  return (
    <div style={{ maxWidth:660, margin:'0 auto', display:'flex', flexDirection:'column', gap:16, fontFamily:'Instrument Sans,sans-serif' }}>

      {/* Steps indicator */}
      <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, padding:'16px 22px', display:'flex', alignItems:'center' }}>
        {steps.map((s,i)=>(
          <div key={s.n} style={{ display:'flex', alignItems:'center', flex:i<steps.length-1?1:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, transition:'all .2s', background:step>s.n?T.green:step===s.n?T.text:T.bg, color:step>s.n?'#fff':step===s.n?'#fff':T.t3 }}>
                {step>s.n ? <Check size={13}/> : s.n}
              </div>
              <span style={{ fontSize:13, fontWeight:step===s.n?600:400, color:step===s.n?T.text:T.t3 }}>{s.l}</span>
            </div>
            {i<steps.length-1 && <div style={{ flex:1, height:1, background:T.border, margin:'0 14px' }}/>}
          </div>
        ))}
      </div>

      <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, padding:28 }}>

        {/* ── STEP 1 ─────────────────────────────────────────── */}
        {step===1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Cliente e tipo de atendimento</div>
            <div>
              {lbl('Cliente', true)}
              <div style={{ position:'relative' }}>
                <select value={form.client_id} onChange={e=>set('client_id',e.target.value)}
                  style={{ ...inp(errors.client_id), appearance:'none', cursor:'pointer', paddingRight:32, color:form.client_id?T.text:T.t3 }}>
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.cpf_formatted||formatCPF(c.cpf)}</option>)}
                </select>
                <ChevronRight size={12} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%) rotate(90deg)', color:T.t3, pointerEvents:'none' }}/>
              </div>
              {errTip('client_id')}
            </div>
            <div>
              {lbl('Tipo de atendimento', true)}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[{v:'venda',l:'Venda',icon:Smartphone,d:'iPhone novo ou usado'},{v:'manutencao',l:'Manutenção',icon:Wrench,d:'Reparo ou serviço técnico'}].map(t=>(
                  <button key={t.v} onClick={()=>set('type',t.v)}
                    style={{ padding:'14px 16px', borderRadius:8, cursor:'pointer', textAlign:'left', border:`1.5px solid ${form.type===t.v?T.text:T.border}`, background:form.type===t.v?T.text:T.surface, transition:'all .15s', display:'flex', flexDirection:'column', gap:6 }}>
                    <t.icon size={18} style={{ color:form.type===t.v?'#fff':T.t2 }}/>
                    <div style={{ fontSize:14, fontWeight:600, color:form.type===t.v?'#fff':T.text }}>{t.l}</div>
                    <div style={{ fontSize:11, color:form.type===t.v?'rgba(255,255,255,0.55)':T.t3 }}>{t.d}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ─────────────────────────────────────────── */}
        {step===2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Informações do produto</div>
            <div style={{ position:'relative' }}>
              {lbl('Modelo do iPhone', true)}
              <input value={form.iphone_model||modelSearch}
                onChange={e=>{ setModelSearch(e.target.value); set('iphone_model',''); setModelOpen(true) }}
                onFocus={()=>setModelOpen(true)} onBlur={()=>setTimeout(()=>setModelOpen(false),200)}
                placeholder="Buscar modelo..." autoComplete="off" style={inp(errors.iphone_model)}/>
              {errTip('iphone_model')}
              {modelOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.surface, border:`1px solid ${T.borderS}`, borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:200, maxHeight:220, overflowY:'auto', marginTop:2 }}>
                  {filteredModels.map(g=>(
                    <div key={g.s}>
                      <div style={{ padding:'6px 12px 3px', fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'0.5px', background:T.bg }}>{g.s}</div>
                      {g.m.map(m=>(
                        <div key={m} onMouseDown={()=>{ set('iphone_model',m); setModelSearch(m); setModelOpen(false) }}
                          style={{ padding:'9px 14px', fontSize:13, cursor:'pointer', color:T.text }}
                          onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          {m}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                {lbl('Capacidade')}
                <div style={{ position:'relative' }}>
                  <select value={form.capacity} onChange={e=>set('capacity',e.target.value)}
                    style={{ ...inp(), appearance:'none', paddingRight:32, cursor:'pointer' }}>
                    <option value="">Selecionar...</option>
                    {['64GB','128GB','256GB','512GB','1TB'].map(c=><option key={c}>{c}</option>)}
                  </select>
                  <ChevronRight size={12} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%) rotate(90deg)', color:T.t3, pointerEvents:'none' }}/>
                </div>
              </div>
              <div>
                {lbl('Cor')}
                <input value={form.color} onChange={e=>set('color',e.target.value)} placeholder="Ex: Titânio Natural" style={inp()}/>
              </div>
            </div>
            <div>
              {lbl('IMEI (opcional)')}
              <input value={form.imei} onChange={e=>set('imei',e.target.value.replace(/\D/g,'').slice(0,15))}
                placeholder="15 dígitos" style={{ ...inp(errors.imei), fontFamily:'JetBrains Mono,monospace', letterSpacing:'1px' }}/>
              {errTip('imei')}
            </div>
          </div>
        )}

        {/* ── STEP 3 ─────────────────────────────────────────── */}
        {step===3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Pagamento e garantia</div>

            {/* Valor + Garantia */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                {lbl('Valor total (R$)', true)}
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:T.t3, fontWeight:500 }}>R$</span>
                  <input value={form.price} onChange={e=>set('price',formatCurrencyInput(e.target.value))}
                    placeholder="0,00" style={{ ...inp(errors.price), paddingLeft:32, fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}/>
                </div>
                {errTip('price')}
              </div>
              <div>
                {lbl('Garantia (meses)')}
                <input type="number" min="0" max="60" value={form.warranty_months}
                  onChange={e=>set('warranty_months',e.target.value)} style={inp()}/>
              </div>
            </div>

            {/* Seleção de formas de pagamento */}
            <div>
              {lbl('Formas de pagamento', true)}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {PAY_OPTS.map(p=>{
                  const active = form.payment_methods.includes(p.v)
                  return (
                    <button key={p.v} onClick={()=>togglePay(p.v)}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999, fontSize:13, fontWeight:500,
                        border:`1.5px solid ${active?T.text:T.border}`, background:active?T.text:'transparent',
                        color:active?'#fff':T.t2, cursor:'pointer', transition:'all .15s', fontFamily:'Instrument Sans,sans-serif' }}>
                      <p.icon size={13}/>{p.l}{active&&<Check size={12}/>}
                    </button>
                  )
                })}
              </div>
              {errTip('payment_methods')}
            </div>

            {/* ── Detalhes por método de pagamento ─────────── */}
            {form.payment_methods.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

                {/* iPhone Entrada — sempre primeiro */}
                {form.payment_methods.includes('iphone_entrada') && (
                  <div style={{ border:`1.5px solid ${T.text}`, borderRadius:10, overflow:'hidden' }}>
                    {/* Header */}
                    <div style={{ background:T.text, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Smartphone size={14} style={{ color:'#fff' }}/>
                        <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>iPhone de Entrada (Troca)</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>Valor de entrada:</span>
                        <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                          R$ {pd.iphone_entrada.value || '0,00'}
                        </span>
                      </div>
                    </div>
                    {/* Fields */}
                    <div style={{ padding:14, display:'flex', flexDirection:'column', gap:12, background:'#fafafa' }}>
                      {/* Modelo trade-in */}
                      <div style={{ position:'relative' }}>
                        {lbl('Modelo do iPhone de entrada', true)}
                        <input
                          value={pd.iphone_entrada.model || tradeModelSearch}
                          onChange={e=>{ setTradeModelSearch(e.target.value); setPd('iphone_entrada','model',''); setTradeModelOpen(true) }}
                          onFocus={()=>setTradeModelOpen(true)}
                          onBlur={()=>setTimeout(()=>setTradeModelOpen(false),200)}
                          placeholder="Buscar modelo..." autoComplete="off"
                          style={inp(errors.pd_iphone_entrada_model)}/>
                        {errTip('pd_iphone_entrada_model')}
                        {tradeModelOpen && (
                          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.surface, border:`1px solid ${T.borderS}`, borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:300, maxHeight:200, overflowY:'auto', marginTop:2 }}>
                            {filteredTradeModels.map(g=>(
                              <div key={g.s}>
                                <div style={{ padding:'6px 12px 3px', fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', background:T.bg }}>{g.s}</div>
                                {g.m.map(m=>(
                                  <div key={m} onMouseDown={()=>{ setPd('iphone_entrada','model',m); setTradeModelSearch(m); setTradeModelOpen(false) }}
                                    style={{ padding:'9px 14px', fontSize:13, cursor:'pointer', color:T.text }}
                                    onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                    {m}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Memória + Cor */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div>
                          {lbl('Memória')}
                          <div style={{ position:'relative' }}>
                            <select value={pd.iphone_entrada.capacity}
                              onChange={e=>setPd('iphone_entrada','capacity',e.target.value)}
                              style={{ ...inp(), appearance:'none', paddingRight:32, cursor:'pointer' }}>
                              <option value="">Selecionar...</option>
                              {TRADE_CAPACITIES.map(c=><option key={c}>{c}</option>)}
                            </select>
                            <ChevronRight size={12} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%) rotate(90deg)', color:T.t3, pointerEvents:'none' }}/>
                          </div>
                        </div>
                        <div>
                          {lbl('Cor')}
                          <input value={pd.iphone_entrada.color}
                            onChange={e=>setPd('iphone_entrada','color',e.target.value)}
                            placeholder="Ex: Preto" style={inp()}/>
                        </div>
                      </div>

                      {/* IMEI + Valor entrada */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div>
                          {lbl('IMEI (opcional)')}
                          <input value={pd.iphone_entrada.imei}
                            onChange={e=>setPd('iphone_entrada','imei',e.target.value.replace(/\D/g,'').slice(0,15))}
                            placeholder="15 dígitos"
                            style={{ ...inp(errors.pd_iphone_entrada_imei), fontFamily:'JetBrains Mono,monospace', letterSpacing:'1px' }}/>
                          {errTip('pd_iphone_entrada_imei')}
                        </div>
                        <div>
                          {lbl('Valor do iPhone entrada', true)}
                          <div style={{ position:'relative' }}>
                            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:T.t3 }}>R$</span>
                            <input value={pd.iphone_entrada.value}
                              onChange={e=>setPd('iphone_entrada','value',formatCurrencyInput(e.target.value))}
                              placeholder="0,00"
                              style={{ ...inp(errors.pd_iphone_entrada_value), paddingLeft:28, fontWeight:600 }}/>
                          </div>
                          {errTip('pd_iphone_entrada_value')}
                        </div>
                      </div>

                      {/* Info: restante a pagar após entrada */}
                      {tradeInValue > 0 && totalPrice > 0 && (
                        <div style={{ background:T.amberL, border:`1px solid #FDE68A`, borderRadius:8, padding:'8px 12px', fontSize:12, color:T.amber, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span>Restante a pagar após entrada:</span>
                          <span style={{ fontWeight:700, fontSize:13 }}>R$ {fmtNum(cashTotal)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cash methods */}
                {cashMethods.length > 0 && (
                  <div style={{ border:`1px solid ${T.borderS}`, borderRadius:10, overflow:'hidden' }}>
                    {cashMethods.map((m, idx) => {
                      const opt     = PAY_OPTS.find(p=>p.v===m)
                      const isAuto  = m === autoMethod
                      const effVal  = getEffectiveValue(m)
                      const isLast  = idx === cashMethods.length - 1
                      return (
                        <div key={m} style={{ borderBottom: isLast ? 'none' : `1px solid ${T.border}` }}>
                          {/* Row header */}
                          <div style={{ padding:'10px 14px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                              <opt.icon size={13} style={{ color:T.t2 }}/>
                              <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{opt.l}</span>
                              {m === 'cartao_credito' && pd.cartao_credito.parcelas !== '1' && (
                                <span style={{ fontSize:11, background:T.accentL, color:T.accent, padding:'1px 7px', borderRadius:999, fontWeight:500 }}>
                                  {pd.cartao_credito.parcelas}x
                                </span>
                              )}
                            </div>
                            {isAuto && cashMethods.length > 1 && (
                              <span style={{ fontSize:10, color:T.green, fontWeight:500, background:T.greenL, padding:'2px 8px', borderRadius:999 }}>
                                calculado automaticamente
                              </span>
                            )}
                          </div>

                          {/* Value input */}
                          <div style={{ padding:'8px 14px', display:'grid', gridTemplateColumns: m==='cartao_credito' ? '1fr auto' : '1fr', gap:10, alignItems:'end' }}>
                            <div>
                              <div style={{ position:'relative' }}>
                                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:T.t3 }}>R$</span>
                                <input
                                  value={isAuto && cashMethods.length > 1 ? fmtNum(effVal) : pd[m].value}
                                  onChange={e => isAuto ? undefined : setPd(m,'value',formatCurrencyInput(e.target.value))}
                                  readOnly={isAuto && cashMethods.length > 1}
                                  placeholder={cashMethods.length === 1 ? fmtNum(effVal) : '0,00'}
                                  style={{
                                    ...inp(), paddingLeft:28, fontWeight:600,
                                    background: isAuto && cashMethods.length > 1 ? T.greenL : T.surface,
                                    color: isAuto && cashMethods.length > 1 ? T.green : T.text,
                                  }}/>
                              </div>
                            </div>

                            {/* Parcelas — só crédito */}
                            {m === 'cartao_credito' && (
                              <div style={{ display:'flex', gap:4, flexWrap:'wrap', maxWidth:240 }}>
                                {PARCELAS_OPTS.map(n => {
                                  const active = pd.cartao_credito.parcelas === String(n)
                                  return (
                                    <button key={n} onClick={()=>setPd('cartao_credito','parcelas',String(n))}
                                      style={{ width:36, height:30, borderRadius:6, border:`1px solid ${active?T.text:T.border}`,
                                        background:active?T.text:'transparent', color:active?'#fff':T.t2,
                                        fontSize:12, fontWeight:active?600:400, cursor:'pointer', fontFamily:'Instrument Sans,sans-serif' }}>
                                      {n}x
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Balance bar */}
                    {cashMethods.length > 0 && totalPrice > 0 && (
                      <div style={{
                        padding:'10px 14px', background: isOver ? T.redL : isBalanced ? T.greenL : T.amberL,
                        borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {isBalanced
                            ? <CheckCircle2 size={14} style={{ color:T.green }}/>
                            : <AlertCircle size={14} style={{ color: isOver ? T.red : T.amber }}/>
                          }
                          <span style={{ fontSize:12, fontWeight:500, color: isOver ? T.red : isBalanced ? T.green : T.amber }}>
                            {isBalanced ? 'Pagamento completo' : isOver ? `Excede em R$ ${fmtNum(Math.abs(remainder))}` : `Faltam R$ ${fmtNum(remainder)}`}
                          </span>
                        </div>
                        <span style={{ fontSize:12, color:T.t2 }}>
                          <b style={{ color:T.text }}>R$ {fmtNum(cashAllocated)}</b> de R$ {fmtNum(cashTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            <div>
              {lbl('Observações')}
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
                rows={3} placeholder="Condições do aparelho, defeitos, acordos..."
                style={{ ...inp(), resize:'vertical' }}/>
            </div>

            {/* Resumo final */}
            {form.price && (
              <div style={{ background:T.text, borderRadius:8, padding:'16px 18px', color:'#fff' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, fontWeight:600 }}>Resumo do atendimento</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{form.iphone_model} {form.capacity}</span>
                  <span style={{ fontSize:16, fontWeight:700 }}>R$ {form.price}</span>
                </div>
                {tradeInValue > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>
                      iPhone entrada ({pd.iphone_entrada.model})
                    </span>
                    <span style={{ fontSize:12, color:'#86EFAC' }}>− R$ {pd.iphone_entrada.value}</span>
                  </div>
                )}
                {tradeInValue > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, paddingTop:6, borderTop:'1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Total a pagar</span>
                    <span style={{ fontSize:14, fontWeight:700, color:'#86EFAC' }}>R$ {fmtNum(cashTotal)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Garantia: {form.warranty_months||0} meses</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>
                    {form.payment_methods.map(m => PAY_OPTS.find(p=>p.v===m)?.l).join(' + ') || '—'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'flex', gap:10, marginTop:28, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
          <button onClick={()=>step>1?setStep(s=>s-1):navigate('/orders')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', border:`1px solid ${T.borderS}`, borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:T.t2, fontFamily:'Instrument Sans,sans-serif' }}>
            <ArrowLeft size={14}/> {step>1?'Voltar':'Cancelar'}
          </button>
          <button onClick={step<3?next:handleSubmit} disabled={createOrder.isPending}
            style={{ flex:1, padding:'10px 24px', background:T.text, color:'#fff', border:'none', borderRadius:8, cursor:createOrder.isPending?'not-allowed':'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'Instrument Sans,sans-serif', opacity:createOrder.isPending?0.8:1 }}>
            {createOrder.isPending
              ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Registrando...</>
              : step<3
                ? <>Próximo ({step}/3)<ChevronRight size={14}/></>
                : <><Send size={14}/> Registrar Atendimento</>
            }
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

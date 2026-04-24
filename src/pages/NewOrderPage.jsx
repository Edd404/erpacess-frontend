import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients, useCreateOrder } from '../hooks/useData'
import { formatCurrencyInput, formatCPF } from '../utils/formatters'
import { validateIMEI } from '../utils/validators'
import { ArrowLeft, ChevronRight, Check, Smartphone, Wrench, Zap, CreditCard, Banknote, Loader2, Send } from 'lucide-react'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', borderS:'rgba(0,0,0,0.12)',
  text:'#0C0C0E', t2:'#6B7280', t3:'#9CA3AF', bg:'#F7F7F8',
  accent:'#0A66FF', accentL:'#EEF4FF', green:'#16A34A', red:'#DC2626',
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

export default function NewOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const { data: clientsData } = useClients({ limit:100 })
  const clients = clientsData?.data || []

  const [step, setStep] = useState(1)
  const [modelSearch, setModelSearch] = useState('')
  const [modelOpen, setModelOpen] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    client_id:'', type:'venda', iphone_model:'', capacity:'', color:'',
    imei:'', price:'', warranty_months:'12', notes:'', payment_methods:[],
  })

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }
  const togglePay = (v) => set('payment_methods', form.payment_methods.includes(v) ? form.payment_methods.filter(x=>x!==v) : [...form.payment_methods, v])

  const filteredModels = IPHONE_MODELS.map(g=>({ ...g, m:g.m.filter(m=>m.toLowerCase().includes(modelSearch.toLowerCase())) })).filter(g=>g.m.length>0)

  const validate = () => {
    const e = {}
    if (step===1 && !form.client_id) e.client_id = 'Selecione um cliente'
    if (step===2 && !form.iphone_model) e.iphone_model = 'Selecione o modelo'
    if (step===2 && form.imei && !validateIMEI(form.imei)) e.imei = 'IMEI inválido'
    if (step===3 && !form.price) e.price = 'Informe o valor'
    if (step===3 && !form.payment_methods.length) e.payment_methods = 'Selecione ao menos uma forma'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s=>s+1) }

  const handleSubmit = async () => {
    if (!validate()) return
    const priceNum = parseFloat(form.price.replace(/\./g,'').replace(',','.')) || 0
    await createOrder.mutateAsync({
      ...form,
      price: priceNum,
      warranty_months: parseInt(form.warranty_months)||0,
      imei: form.imei || undefined,
    })
  }

  const inp = (err) => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${err?T.red:T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none',
  })

  const lbl = (txt) => <label style={{ fontSize:12, fontWeight:500, color:T.t2, display:'block', marginBottom:6 }}>{txt}</label>

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
        {/* STEP 1 */}
        {step===1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Cliente e tipo de atendimento</div>
            <div>
              {lbl('Cliente *')}
              <div style={{ position:'relative' }}>
                <select value={form.client_id} onChange={e=>set('client_id',e.target.value)} style={{ ...inp(errors.client_id), appearance:'none', cursor:'pointer', paddingRight:32, color:form.client_id?T.text:T.t3 }}>
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.cpf_formatted||formatCPF(c.cpf)}</option>)}
                </select>
                <ChevronRight size={12} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%) rotate(90deg)', color:T.t3, pointerEvents:'none' }}/>
              </div>
              {errors.client_id && <span style={{ fontSize:11, color:T.red, marginTop:3, display:'block' }}>{errors.client_id}</span>}
            </div>
            <div>
              {lbl('Tipo de atendimento *')}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[{v:'venda',l:'Venda',icon:Smartphone,d:'iPhone novo ou usado'},{v:'manutencao',l:'Manutenção',icon:Wrench,d:'Reparo ou serviço técnico'}].map(t=>(
                  <button key={t.v} onClick={()=>set('type',t.v)} style={{ padding:'14px 16px', borderRadius:8, cursor:'pointer', textAlign:'left', border:`1.5px solid ${form.type===t.v?T.text:T.border}`, background:form.type===t.v?T.text:T.surface, transition:'all .15s', display:'flex', flexDirection:'column', gap:6 }}>
                    <t.icon size={18} style={{ color:form.type===t.v?'#fff':T.t2 }}/>
                    <div style={{ fontSize:14, fontWeight:600, color:form.type===t.v?'#fff':T.text }}>{t.l}</div>
                    <div style={{ fontSize:11, color:form.type===t.v?'rgba(255,255,255,0.55)':T.t3 }}>{t.d}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Informações do produto</div>
            <div style={{ position:'relative' }}>
              {lbl('Modelo do iPhone *')}
              <input value={form.iphone_model||modelSearch} onChange={e=>{ setModelSearch(e.target.value); set('iphone_model',''); setModelOpen(true) }} onFocus={()=>setModelOpen(true)} onBlur={()=>setTimeout(()=>setModelOpen(false),200)} placeholder="Buscar modelo..." autoComplete="off" style={inp(errors.iphone_model)}/>
              {errors.iphone_model && <span style={{ fontSize:11, color:T.red, marginTop:3, display:'block' }}>{errors.iphone_model}</span>}
              {modelOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.surface, border:`1px solid ${T.borderS}`, borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:200, maxHeight:220, overflowY:'auto', marginTop:2 }}>
                  {filteredModels.map(g=>(
                    <div key={g.s}>
                      <div style={{ padding:'6px 12px 3px', fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'0.5px', background:T.bg, position:'sticky', top:0 }}>{g.s}</div>
                      {g.m.map(m=>(
                        <div key={m} onMouseDown={()=>{ set('iphone_model',m); setModelSearch(m); setModelOpen(false) }} style={{ padding:'9px 14px', fontSize:13, cursor:'pointer', color:T.text, transition:'background .1s' }}
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
                  <select value={form.capacity} onChange={e=>set('capacity',e.target.value)} style={{ ...inp(), appearance:'none', paddingRight:32, cursor:'pointer' }}>
                    <option value="">Selecionar...</option>
                    {['16GB','32GB','64GB','128GB','256GB','512GB','1TB'].map(c=><option key={c}>{c}</option>)}
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
              <input value={form.imei} onChange={e=>set('imei',e.target.value.replace(/\D/g,'').slice(0,15))} placeholder="15 dígitos" style={{ ...inp(errors.imei), fontFamily:'JetBrains Mono,monospace', letterSpacing:'1px' }}/>
              {errors.imei && <span style={{ fontSize:11, color:T.red, marginTop:3, display:'block' }}>{errors.imei}</span>}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step===3 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Pagamento e garantia</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                {lbl('Valor (R$) *')}
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:T.t3, fontWeight:500 }}>R$</span>
                  <input value={form.price} onChange={e=>set('price',formatCurrencyInput(e.target.value))} placeholder="0,00" style={{ ...inp(errors.price), paddingLeft:32, fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}/>
                </div>
                {errors.price && <span style={{ fontSize:11, color:T.red, marginTop:3, display:'block' }}>{errors.price}</span>}
              </div>
              <div>
                {lbl('Garantia (meses)')}
                <input type="number" min="0" max="60" value={form.warranty_months} onChange={e=>set('warranty_months',e.target.value)} style={inp()}/>
              </div>
            </div>
            <div>
              {lbl('Formas de pagamento *')}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {PAY_OPTS.map(p=>{
                  const active = form.payment_methods.includes(p.v)
                  return (
                    <button key={p.v} onClick={()=>togglePay(p.v)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999, fontSize:13, fontWeight:500, border:`1.5px solid ${active?T.text:T.border}`, background:active?T.text:'transparent', color:active?'#fff':T.t2, cursor:'pointer', transition:'all .15s', fontFamily:'Instrument Sans,sans-serif' }}>
                      <p.icon size={13}/>{p.l}{active&&<Check size={12}/>}
                    </button>
                  )
                })}
              </div>
              {errors.payment_methods && <span style={{ fontSize:11, color:T.red, marginTop:6, display:'block' }}>{errors.payment_methods}</span>}
            </div>
            <div>
              {lbl('Observações')}
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} placeholder="Condições do aparelho, defeitos, acordos..." style={{ ...inp(), resize:'vertical' }}/>
            </div>
            {form.price && (
              <div style={{ background:T.text, borderRadius:8, padding:'16px 18px', color:'#fff' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8, fontWeight:600 }}>Resumo</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{form.iphone_model} {form.capacity}</span>
                  <span style={{ fontSize:15, fontWeight:700 }}>R$ {form.price}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Garantia: {form.warranty_months||0} meses</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{form.payment_methods.join(', ')||'—'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display:'flex', gap:10, marginTop:28, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
          <button onClick={()=>step>1?setStep(s=>s-1):navigate('/orders')} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', border:`1px solid ${T.borderS}`, borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:T.t2, fontFamily:'Instrument Sans,sans-serif' }}>
            <ArrowLeft size={14}/> {step>1?'Voltar':'Cancelar'}
          </button>
          <button onClick={step<3?next:handleSubmit} disabled={createOrder.isPending} style={{ flex:1, padding:'10px 24px', background:T.text, color:'#fff', border:'none', borderRadius:8, cursor:createOrder.isPending?'not-allowed':'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'Instrument Sans,sans-serif', opacity:createOrder.isPending?0.8:1 }}>
            {createOrder.isPending ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Registrando...</> : step<3 ? <>Próximo ({step}/3)<ChevronRight size={14}/></> : <><Send size={14}/> Registrar Atendimento</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

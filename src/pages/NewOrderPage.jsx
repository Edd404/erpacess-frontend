import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients, useCreateOrder } from '../hooks/useData'
import { formatCurrencyInput, formatCPF } from '../utils/formatters'
import { validateIMEI } from '../utils/validators'
import {
  ArrowLeft, ChevronRight, Check, Smartphone, Wrench, Zap, CreditCard,
  Banknote, Loader2, Send, Search, AlertCircle, CheckCircle2, X, ChevronDown
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  // Neutrals
  ink:      '#0A0A0B',
  ink2:     '#3A3A3C',
  ink3:     '#6B6B70',
  ink4:     '#AEAEB2',
  ink5:     '#D1D1D6',
  ink6:     '#F2F2F7',
  white:    '#FFFFFF',
  // Accent
  blue:     '#0A66FF',
  blueL:    '#EEF4FF',
  green:    '#12A150',
  greenL:   '#EDFAF3',
  amber:    '#C47D00',
  amberL:   '#FFF8E7',
  red:      '#D93025',
  redL:     '#FFF0EE',
  // Maintenance accent — warm graphite, NOT purple
  slate:    '#1C2B3A',
  slateL:   '#F0F4F8',
  slateMid: '#4A6080',
  // Surfaces
  surface:  '#FFFFFF',
  bg:       '#F5F5F7',
  // Shadows
  shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
  shadowLg: '0 12px 40px rgba(0,0,0,0.12)',
}

// ── Data ──────────────────────────────────────────────────────────────────────
const IPHONE_MODELS = [
  { s:'iPhone 16', m:['iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max'] },
  { s:'iPhone 15', m:['iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max'] },
  { s:'iPhone 14', m:['iPhone 14','iPhone 14 Plus','iPhone 14 Pro','iPhone 14 Pro Max'] },
  { s:'iPhone 13', m:['iPhone 13 mini','iPhone 13','iPhone 13 Pro','iPhone 13 Pro Max'] },
  { s:'iPhone 12', m:['iPhone 12 mini','iPhone 12','iPhone 12 Pro','iPhone 12 Pro Max'] },
  { s:'iPhone 11', m:['iPhone 11','iPhone 11 Pro','iPhone 11 Pro Max'] },
  { s:'iPhone SE', m:['iPhone SE (1ª gen)','iPhone SE (2ª gen)','iPhone SE (3ª gen)'] },
  { s:'iPhone X/XS', m:['iPhone X','iPhone XR','iPhone XS','iPhone XS Max'] },
  { s:'Antigos',   m:['iPhone 8','iPhone 8 Plus','iPhone 7','iPhone 7 Plus','iPhone 6s','iPhone 6s Plus','iPhone 6','iPhone 6 Plus'] },
]

const SERVICOS = [
  { cat:'Tela & Display',        dot:'#0A66FF', items:['Troca de Tela (Display + Touch)','Troca de Tela Original Remanufaturada','Troca de Vidro Frontal','Troca de Vidro Traseiro','Reparo de Manchas / Listras','Reparo de Touch Não Funciona'] },
  { cat:'Bateria & Carga',       dot:'#12A150', items:['Troca de Bateria','Reparo de Conector Lightning','Reparo de Conector USB-C','Calibração de Bateria','Reparo de Carregamento Sem Fio'] },
  { cat:'Câmera & Flash',        dot:'#8B5CF6', items:['Troca de Câmera Traseira','Troca de Câmera Frontal','Troca de Câmera TrueDepth / Face ID','Troca de Lente','Troca de Flash','Reparo de Câmera Travada'] },
  { cat:'Áudio & Som',           dot:'#F59E0B', items:['Troca de Alto-falante (Speaker)','Troca de Fone Interno (Earpiece)','Troca de Microfone','Reparo de Sem Som','Reparo de Microfone'] },
  { cat:'Botões & Estrutura',    dot:'#0891B2', items:['Troca de Botão Power','Troca de Botões de Volume','Troca de Chave Mute','Troca de Bandeja SIM','Troca de Chassi / Carcaça','Reparo de Vibração'] },
  { cat:'Conectividade',         dot:'#0A66FF', items:['Reparo de Wi-Fi / Bluetooth','Reparo de Sinal / Sem Rede','Reparo de GPS','Reparo de NFC','Reparo de Antena'] },
  { cat:'Software & Sistema',    dot:'#12A150', items:['Restauração iOS (DFU / Recovery)','Desbloqueio de Senha','Remoção de Bloqueio iCloud','Backup e Transferência de Dados','Reparo de Loop de Reinicialização','Diagnóstico Completo'] },
  { cat:'Micro Soldagem',        dot:'#D93025', items:['Reparo de Placa-Mãe','Reparo de Face ID','Reparo de Touch ID','Recuperação de Dados','Reparo por Oxidação / Líquido','Reparo de Componente BGA'] },
  { cat:'Higienização & Outros', dot:'#6B6B70', items:['Higienização Interna Completa','Higienização Pós-Líquido','Avaliação Técnica (Orçamento)','Instalação de Película','Troca de Película'] },
]

const PAY_OPTS = [
  { v:'pix',             l:'Pix',           icon:Zap        },
  { v:'dinheiro',        l:'Dinheiro',       icon:Banknote   },
  { v:'cartao_credito',  l:'Crédito',        icon:CreditCard },
  { v:'cartao_debito',   l:'Débito',         icon:CreditCard },
  { v:'iphone_entrada',  l:'iPhone Entrada', icon:Smartphone, vendaOnly:true },
]
const PARCELAS = [1,2,3,4,5,6,7,8,9,10,11,12]

// ── Utils ─────────────────────────────────────────────────────────────────────
const parseVal = (s) => parseFloat((s||'0').replace(/\./g,'').replace(',','.')) || 0
const fmtNum   = (n) => n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

// ── Shared UI primitives ──────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <div style={{ fontSize:11, fontWeight:600, color:T.ink3, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:7 }}>
    {children}{required && <span style={{ color:T.red, marginLeft:2 }}>*</span>}
  </div>
)

const ErrMsg = ({ msg }) => !msg ? null : (
  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5, fontSize:11, color:T.red }}>
    <AlertCircle size={10}/>{msg}
  </div>
)

const Field = ({ err, children }) => (
  <div style={{ border:`1px solid ${err ? T.red : T.ink5}`, borderRadius:10, background:T.white, overflow:'hidden', transition:'border-color .15s', boxShadow: err ? `0 0 0 3px ${T.red}18` : 'none' }}>
    {children}
  </div>
)

const TextInput = ({ value, onChange, placeholder, err, style={}, ...rest }) => (
  <input value={value} onChange={onChange} placeholder={placeholder}
    style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none', fontSize:14, color:T.ink, background:'transparent', fontFamily:'Instrument Sans,sans-serif', ...style }}
    {...rest}/>
)

// ── Model search ──────────────────────────────────────────────────────────────
function ModelSearch({ value, onSelect, err }) {
  const [q, setQ] = useState(value || '')
  const [open, setOpen] = useState(false)

  const filtered = IPHONE_MODELS
    .map(g => ({ ...g, m: g.m.filter(m => m.toLowerCase().includes(q.toLowerCase())) }))
    .filter(g => g.m.length > 0)

  return (
    <div style={{ position:'relative' }}>
      <Field err={err}>
        <TextInput
          value={value || q}
          onChange={e => { setQ(e.target.value); onSelect(''); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Buscar modelo..."
          autoComplete="off"
        />
      </Field>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:T.white, border:`1px solid ${T.ink5}`, borderRadius:12, boxShadow:T.shadowLg, zIndex:400, maxHeight:240, overflowY:'auto' }}>
          {filtered.length === 0
            ? <div style={{ padding:16, fontSize:13, color:T.ink4, textAlign:'center' }}>Nenhum modelo</div>
            : filtered.map(g => (
              <div key={g.s}>
                <div style={{ padding:'7px 14px 4px', fontSize:10, fontWeight:700, letterSpacing:'0.7px', color:T.ink4, textTransform:'uppercase', background:T.bg, borderBottom:`1px solid ${T.ink6}` }}>{g.s}</div>
                {g.m.map(m => (
                  <div key={m} onMouseDown={() => { onSelect(m); setQ(m); setOpen(false) }}
                    style={{ padding:'10px 14px', fontSize:13, color:T.ink2, cursor:'pointer', borderBottom:`1px solid ${T.ink6}`, transition:'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.ink6}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {m}
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ── Step 2 — Manutenção ───────────────────────────────────────────────────────
function StepServico({ form, set, errors }) {
  const [q, setQ] = useState('')
  const [openCat, setOpenCat] = useState(null)
  const selected = form.service_types || []

  const groups = q
    ? SERVICOS.map(g => ({ ...g, items: g.items.filter(i => i.toLowerCase().includes(q.toLowerCase())) })).filter(g => g.items.length > 0)
    : SERVICOS

  const toggle = (item) => set('service_types',
    selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item]
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Aparelho */}
      <div>
        <Label required>Modelo do aparelho</Label>
        <ModelSearch value={form.iphone_model} onSelect={v => set('iphone_model', v)} err={errors.iphone_model}/>
        <ErrMsg msg={errors.iphone_model}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <Label>Cor</Label>
          <Field><TextInput value={form.color} onChange={e => set('color', e.target.value)} placeholder="Ex: Preto Meia-noite"/></Field>
        </div>
        <div>
          <Label>IMEI</Label>
          <Field err={errors.imei}>
            <TextInput value={form.imei} onChange={e => set('imei', e.target.value.replace(/\D/g,'').slice(0,15))}
              placeholder="15 dígitos" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, letterSpacing:'0.5px' }}/>
          </Field>
          <ErrMsg msg={errors.imei}/>
        </div>
      </div>

      {/* Serviços selecionados (chips) */}
      {selected.length > 0 && (
        <div>
          <Label>Serviços selecionados</Label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {selected.map(s => (
              <span key={s} style={{
                display:'inline-flex', alignItems:'center', gap:6,
                background:T.ink, color:T.white,
                padding:'5px 12px', borderRadius:999, fontSize:12, fontWeight:500,
              }}>
                {s}
                <button onClick={() => toggle(s)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', padding:0, display:'flex', lineHeight:1 }}>
                  <X size={11}/>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de serviços */}
      <div>
        <Label required>Tipo de serviço</Label>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:10 }}>
          <Search size={13} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:T.ink4, pointerEvents:'none' }}/>
          <Field err={errors.service_types}>
            <TextInput value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrar serviços..." style={{ paddingLeft:36 }}/>
          </Field>
        </div>
        <ErrMsg msg={errors.service_types}/>

        {/* Categories */}
        <div style={{ border:`1px solid ${T.ink5}`, borderRadius:12, overflow:'hidden', marginTop:6 }}>
          {groups.map((g, gi) => {
            const isOpen = q || openCat === g.cat
            const selCount = g.items.filter(i => selected.includes(i)).length
            const isLast = gi === groups.length - 1
            return (
              <div key={g.cat}>
                {/* Category header */}
                <button
                  onClick={() => !q && setOpenCat(isOpen ? null : g.cat)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'13px 16px',
                    background: selCount > 0 ? T.ink6 : T.white,
                    border:'none', borderBottom: isOpen || isLast ? 'none' : `1px solid ${T.ink6}`,
                    cursor: q ? 'default' : 'pointer', fontFamily:'Instrument Sans,sans-serif',
                  }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {/* Color dot */}
                    <div style={{ width:8, height:8, borderRadius:'50%', background:g.dot, flexShrink:0 }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:T.ink2 }}>{g.cat}</span>
                    {selCount > 0 && (
                      <span style={{
                        fontSize:11, fontWeight:700, color:T.white, background:T.ink2,
                        width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      }}>{selCount}</span>
                    )}
                  </div>
                  {!q && (
                    <ChevronDown size={14} style={{ color:T.ink4, transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}/>
                  )}
                </button>

                {/* Service items */}
                {isOpen && (
                  <div style={{ borderTop:`1px solid ${T.ink6}` }}>
                    {g.items.map((item, ii) => {
                      const on = selected.includes(item)
                      const isLastItem = ii === g.items.length - 1 && isLast
                      return (
                        <button key={item} onClick={() => toggle(item)}
                          style={{
                            width:'100%', display:'flex', alignItems:'center', gap:12,
                            padding:'10px 16px 10px 32px',
                            background: on ? T.ink6 : T.white,
                            border:'none', borderBottom: isLastItem ? 'none' : `1px solid ${T.ink6}`,
                            cursor:'pointer', textAlign:'left', fontFamily:'Instrument Sans,sans-serif',
                            transition:'background .1s',
                          }}
                          onMouseEnter={e => !on && (e.currentTarget.style.background = T.bg)}
                          onMouseLeave={e => !on && (e.currentTarget.style.background = T.white)}>
                          {/* Checkbox */}
                          <div style={{
                            width:17, height:17, borderRadius:5, flexShrink:0,
                            border: on ? 'none' : `1.5px solid ${T.ink5}`,
                            background: on ? T.ink : 'transparent',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            transition:'all .15s',
                          }}>
                            {on && <Check size={10} style={{ color:T.white }}/>}
                          </div>
                          <span style={{ fontSize:13, color: on ? T.ink : T.ink2, fontWeight: on ? 500 : 400 }}>{item}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {gi < groups.length - 1 && <div style={{ height:1, background:T.ink6 }}/>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <Label required>Problema relatado pelo cliente</Label>
        <div style={{ border:`1px solid ${errors.problem_description ? T.red : T.ink5}`, borderRadius:10, background:T.white, boxShadow: errors.problem_description ? `0 0 0 3px ${T.red}18` : 'none' }}>
          <textarea
            value={form.problem_description || ''}
            onChange={e => set('problem_description', e.target.value)}
            rows={3}
            placeholder="Ex: Tela rachada após queda, touch não responde mais na parte inferior..."
            style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none', resize:'vertical', fontSize:13, color:T.ink, background:'transparent', fontFamily:'Instrument Sans,sans-serif', lineHeight:1.6, boxSizing:'border-box' }}
          />
        </div>
        <ErrMsg msg={errors.problem_description}/>
      </div>

      {/* Condição */}
      <div>
        <Label>Condição do aparelho</Label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            { v:'otimo',     l:'Ótimo',     sub:'Sem danos', dot:'#12A150' },
            { v:'bom',       l:'Bom',       sub:'Desgaste leve', dot:'#0A66FF' },
            { v:'regular',   l:'Regular',   sub:'Danos visíveis', dot:'#C47D00' },
            { v:'danificado',l:'Danificado',sub:'Dano severo', dot:'#D93025' },
          ].map(c => {
            const on = form.device_condition === c.v
            return (
              <button key={c.v} onClick={() => set('device_condition', c.v)}
                style={{
                  padding:'12px 8px', borderRadius:10, cursor:'pointer',
                  border:`1.5px solid ${on ? T.ink : T.ink5}`,
                  background: on ? T.ink : T.white,
                  transition:'all .15s', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  fontFamily:'Instrument Sans,sans-serif',
                }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: on ? T.white : c.dot }}/>
                <span style={{ fontSize:12, fontWeight:600, color: on ? T.white : T.ink2 }}>{c.l}</span>
                <span style={{ fontSize:10, color: on ? 'rgba(255,255,255,0.5)' : T.ink4, textAlign:'center' }}>{c.sub}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Step 2 — Venda ────────────────────────────────────────────────────────────
function StepProduto({ form, set, errors }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <div>
        <Label required>Modelo do iPhone</Label>
        <ModelSearch value={form.iphone_model} onSelect={v => set('iphone_model', v)} err={errors.iphone_model}/>
        <ErrMsg msg={errors.iphone_model}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <Label>Capacidade</Label>
          <Field>
            <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
              <select value={form.capacity} onChange={e => set('capacity', e.target.value)}
                style={{ width:'100%', padding:'11px 36px 11px 14px', border:'none', outline:'none', fontSize:14, color: form.capacity ? T.ink : T.ink4, background:'transparent', fontFamily:'Instrument Sans,sans-serif', appearance:'none', cursor:'pointer' }}>
                <option value="">Selecionar...</option>
                {['64GB','128GB','256GB','512GB','1TB'].map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} style={{ position:'absolute', right:12, color:T.ink4, pointerEvents:'none' }}/>
            </div>
          </Field>
        </div>
        <div>
          <Label>Cor</Label>
          <Field><TextInput value={form.color} onChange={e => set('color', e.target.value)} placeholder="Ex: Titânio Natural"/></Field>
        </div>
      </div>

      <div>
        <Label>IMEI</Label>
        <Field err={errors.imei}>
          <TextInput value={form.imei} onChange={e => set('imei', e.target.value.replace(/\D/g,'').slice(0,15))}
            placeholder="15 dígitos" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, letterSpacing:'0.5px' }}/>
        </Field>
        <ErrMsg msg={errors.imei}/>
      </div>
    </div>
  )
}

// ── Step 3 — Pagamento ────────────────────────────────────────────────────────
function StepPagamento({ form, set, errors, isManut }) {
  const [pd, setPdState] = useState({
    pix:             { value:'' },
    dinheiro:        { value:'' },
    cartao_credito:  { value:'', parcelas:'1' },
    cartao_debito:   { value:'' },
    iphone_entrada:  { value:'', model:'', capacity:'', color:'', imei:'' },
  })
  const [tradeModelSearch, setTradeModelSearch] = useState('')
  const [tradeModelOpen, setTradeModelOpen] = useState(false)

  const setPd = (m, f, v) => setPdState(p => ({ ...p, [m]: { ...p[m], [f]: v } }))

  const togglePay = (v) => set('payment_methods',
    form.payment_methods.includes(v) ? form.payment_methods.filter(x => x !== v) : [...form.payment_methods, v]
  )

  const total       = parseVal(form.price)
  const tradeVal    = form.payment_methods.includes('iphone_entrada') ? parseVal(pd.iphone_entrada.value) : 0
  const cashTotal   = Math.max(0, total - tradeVal)
  const cashMethods = form.payment_methods.filter(m => m !== 'iphone_entrada')

  const autoM = cashMethods.length > 1 && cashMethods.filter(m => parseVal(pd[m].value) === 0).length === 1
    ? cashMethods.find(m => parseVal(pd[m].value) === 0) : null

  const getEff = (m) => {
    if (m === 'iphone_entrada') return tradeVal
    if (m === autoM) {
      const sum = cashMethods.filter(x => x !== m).reduce((s, x) => s + parseVal(pd[x].value), 0)
      return Math.max(0, cashTotal - sum)
    }
    return parseVal(pd[m].value)
  }

  const allocated = form.payment_methods.reduce((s, m) => s + getEff(m), 0)
  const remainder = total - allocated
  const balanced  = Math.abs(remainder) < 0.01
  const over      = remainder < -0.01

  const tradeFilteredModels = IPHONE_MODELS
    .map(g => ({ ...g, m: g.m.filter(m => m.toLowerCase().includes(tradeModelSearch.toLowerCase())) }))
    .filter(g => g.m.length > 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Valor + Garantia */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <Label required>Valor</Label>
          <Field err={errors.price}>
            <div style={{ display:'flex', alignItems:'center' }}>
              <span style={{ paddingLeft:14, fontSize:14, color:T.ink3, fontWeight:500, flexShrink:0 }}>R$</span>
              <TextInput value={form.price} onChange={e => set('price', formatCurrencyInput(e.target.value))}
                placeholder="0,00" style={{ paddingLeft:6, fontSize:18, fontWeight:700, letterSpacing:'-0.5px', flex:1 }}/>
            </div>
          </Field>
          <ErrMsg msg={errors.price}/>
        </div>
        <div>
          <Label>Garantia (meses)</Label>
          <Field>
            <TextInput type="number" min="0" max="60"
              value={form.warranty_months ?? (isManut ? '3' : '12')}
              onChange={e => set('warranty_months', e.target.value)}/>
          </Field>
          <div style={{ fontSize:10, color:T.ink4, marginTop:4 }}>
            Padrão: {isManut ? '3 meses (serviço)' : '12 meses (venda)'}
          </div>
        </div>
      </div>

      {/* Formas */}
      <div>
        <Label required>Formas de pagamento</Label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {PAY_OPTS.filter(p => !p.vendaOnly || !isManut).map(p => {
            const on = form.payment_methods.includes(p.v)
            return (
              <button key={p.v} onClick={() => togglePay(p.v)}
                style={{
                  display:'flex', alignItems:'center', gap:7, padding:'8px 16px',
                  borderRadius:999, fontSize:13, fontWeight:500,
                  border:`1.5px solid ${on ? T.ink : T.ink5}`,
                  background: on ? T.ink : T.white,
                  color: on ? T.white : T.ink3,
                  cursor:'pointer', transition:'all .15s', fontFamily:'Instrument Sans,sans-serif',
                }}>
                <p.icon size={13}/>
                {p.l}
                {on && <Check size={12} style={{ opacity:0.7 }}/>}
              </button>
            )
          })}
        </div>
        <ErrMsg msg={errors.payment_methods}/>
      </div>

      {/* ── iPhone Entrada (apenas venda) ───────────────────────── */}
      {form.payment_methods.includes('iphone_entrada') && (
        <div style={{ border:`1.5px solid ${T.ink}`, borderRadius:12, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ background:T.ink, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Smartphone size={14} style={{ color:'rgba(255,255,255,0.6)' }}/>
              <span style={{ fontSize:13, fontWeight:600, color:T.white }}>iPhone de Entrada — Troca</span>
            </div>
            {tradeVal > 0 && (
              <span style={{ fontSize:13, fontWeight:700, color:T.white }}>
                − R$ {pd.iphone_entrada.value}
              </span>
            )}
          </div>

          {/* Fields */}
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12, background:T.ink6 }}>

            {/* Modelo trade-in */}
            <div style={{ position:'relative' }}>
              <Label required>Modelo do iPhone de entrada</Label>
              <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.white }}>
                <TextInput
                  value={pd.iphone_entrada.model || tradeModelSearch}
                  onChange={e => { setTradeModelSearch(e.target.value); setPd('iphone_entrada','model',''); setTradeModelOpen(true) }}
                  onFocus={() => setTradeModelOpen(true)}
                  onBlur={() => setTimeout(() => setTradeModelOpen(false), 180)}
                  placeholder="Buscar modelo..."
                  autoComplete="off"
                />
              </div>
              {tradeModelOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.white, border:`1px solid ${T.ink5}`, borderRadius:12, boxShadow:T.shadowLg, zIndex:400, maxHeight:200, overflowY:'auto', marginTop:2 }}>
                  {tradeFilteredModels.map(g => (
                    <div key={g.s}>
                      <div style={{ padding:'6px 14px 3px', fontSize:10, fontWeight:700, color:T.ink4, textTransform:'uppercase', background:T.bg }}>{g.s}</div>
                      {g.m.map(m => (
                        <div key={m} onMouseDown={() => { setPd('iphone_entrada','model',m); setTradeModelSearch(m); setTradeModelOpen(false) }}
                          style={{ padding:'9px 14px', fontSize:13, cursor:'pointer', color:T.ink2, borderBottom:`1px solid ${T.ink6}` }}
                          onMouseEnter={e => e.currentTarget.style.background = T.ink6}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
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
                <Label>Memória</Label>
                <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.white }}>
                  <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                    <select value={pd.iphone_entrada.capacity} onChange={e => setPd('iphone_entrada','capacity',e.target.value)}
                      style={{ width:'100%', padding:'11px 32px 11px 14px', border:'none', outline:'none', fontSize:13, color: pd.iphone_entrada.capacity ? T.ink : T.ink4, background:'transparent', fontFamily:'Instrument Sans,sans-serif', appearance:'none', cursor:'pointer' }}>
                      <option value="">Selecionar...</option>
                      {['16GB','32GB','64GB','128GB','256GB','512GB','1TB'].map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={13} style={{ position:'absolute', right:11, color:T.ink4, pointerEvents:'none' }}/>
                  </div>
                </div>
              </div>
              <div>
                <Label>Cor</Label>
                <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.white }}>
                  <TextInput value={pd.iphone_entrada.color} onChange={e => setPd('iphone_entrada','color',e.target.value)} placeholder="Ex: Preto"/>
                </div>
              </div>
            </div>

            {/* IMEI + Valor */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <Label>IMEI</Label>
                <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.white }}>
                  <TextInput value={pd.iphone_entrada.imei} onChange={e => setPd('iphone_entrada','imei',e.target.value.replace(/\D/g,'').slice(0,15))}
                    placeholder="15 dígitos" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, letterSpacing:'0.5px' }}/>
                </div>
              </div>
              <div>
                <Label required>Valor de entrada</Label>
                <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.white, display:'flex', alignItems:'center' }}>
                  <span style={{ paddingLeft:12, fontSize:13, color:T.ink4, flexShrink:0 }}>R$</span>
                  <TextInput value={pd.iphone_entrada.value} onChange={e => setPd('iphone_entrada','value',formatCurrencyInput(e.target.value))}
                    placeholder="0,00" style={{ paddingLeft:6, fontWeight:700, fontSize:15 }}/>
                </div>
              </div>
            </div>

            {/* Restante após entrada */}
            {tradeVal > 0 && total > 0 && (
              <div style={{ background:T.amberL, border:`1px solid #FDE68A`, borderRadius:8, padding:'9px 13px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:T.amber, fontWeight:500 }}>Restante a pagar</span>
                <span style={{ fontSize:14, fontWeight:700, color:T.amber }}>R$ {fmtNum(cashTotal)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detalhes por método — apenas cash methods */}
      {cashMethods.length > 0 && (
        <div style={{ border:`1px solid ${T.ink5}`, borderRadius:12, overflow:'hidden' }}>
          {cashMethods.map((m, idx) => {
            const opt    = PAY_OPTS.find(p => p.v === m)
            const isAuto = m === autoM
            const effVal = getEff(m)
            const isLast = idx === cashMethods.length - 1
            return (
              <div key={m} style={{ borderBottom: isLast ? 'none' : `1px solid ${T.ink6}` }}>
                <div style={{ padding:'12px 16px 4px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <opt.icon size={13} style={{ color:T.ink3 }}/>
                    <span style={{ fontSize:13, fontWeight:600, color:T.ink2 }}>{opt.l}</span>
                    {m === 'cartao_credito' && pd.cartao_credito.parcelas !== '1' && (
                      <span style={{ fontSize:11, fontWeight:600, color:T.blue, background:T.blueL, padding:'2px 8px', borderRadius:999 }}>
                        {pd.cartao_credito.parcelas}x
                      </span>
                    )}
                  </div>
                  {isAuto && (
                    <span style={{ fontSize:10, fontWeight:500, color:T.green, background:T.greenL, padding:'2px 8px', borderRadius:999 }}>
                      calculado automaticamente
                    </span>
                  )}
                </div>

                <div style={{ padding:'6px 16px 12px', display:'grid', gridTemplateColumns: m === 'cartao_credito' ? '1fr auto' : '1fr', gap:10, alignItems:'end' }}>
                  <div style={{ border:`1px solid ${T.ink5}`, borderRadius:8, background: isAuto ? T.greenL : T.white, display:'flex', alignItems:'center' }}>
                    <span style={{ paddingLeft:12, fontSize:13, color:T.ink4, flexShrink:0 }}>R$</span>
                    <input
                      value={isAuto ? fmtNum(effVal) : pd[m].value}
                      onChange={e => isAuto ? null : setPd(m, 'value', formatCurrencyInput(e.target.value))}
                      readOnly={isAuto}
                      placeholder={cashMethods.length === 1 ? fmtNum(cashTotal) : '0,00'}
                      style={{
                        flex:1, padding:'10px 12px 10px 6px', border:'none', outline:'none',
                        fontSize:15, fontWeight:700, color: isAuto ? T.green : T.ink,
                        background:'transparent', fontFamily:'Instrument Sans,sans-serif',
                      }}/>
                  </div>

                  {m === 'cartao_credito' && (
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', maxWidth:220 }}>
                      {PARCELAS.map(n => {
                        const on = pd.cartao_credito.parcelas === String(n)
                        return (
                          <button key={n} onClick={() => setPd('cartao_credito','parcelas',String(n))}
                            style={{
                              width:34, height:28, borderRadius:6,
                              border:`1px solid ${on ? T.ink : T.ink5}`,
                              background: on ? T.ink : T.white,
                              color: on ? T.white : T.ink3,
                              fontSize:12, fontWeight: on ? 600 : 400, cursor:'pointer',
                              fontFamily:'Instrument Sans,sans-serif', transition:'all .12s',
                            }}>
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
          {total > 0 && (
            <div style={{
              padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center',
              borderTop:`1px solid ${T.ink6}`,
              background: over ? T.redL : balanced ? T.greenL : T.amberL,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {balanced
                  ? <CheckCircle2 size={13} style={{ color:T.green }}/>
                  : <AlertCircle  size={13} style={{ color: over ? T.red : T.amber }}/>}
                <span style={{ fontSize:12, fontWeight:500, color: over ? T.red : balanced ? T.green : T.amber }}>
                  {balanced ? 'Pagamento completo' : over ? `Excede R$ ${fmtNum(Math.abs(remainder))}` : `Faltam R$ ${fmtNum(remainder)}`}
                </span>
              </div>
              <span style={{ fontSize:12, color:T.ink3 }}>
                <b style={{ color:T.ink2 }}>R$ {fmtNum(allocated)}</b> / R$ {fmtNum(total)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Observações */}
      <div>
        <Label>Observações</Label>
        <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.white }}>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            placeholder={isManut ? 'Prazo de entrega, acessórios entregues, acordos...' : 'Condições, defeitos, acordos...'}
            style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none', resize:'vertical', fontSize:13, color:T.ink, background:'transparent', fontFamily:'Instrument Sans,sans-serif', lineHeight:1.6, boxSizing:'border-box' }}/>
        </div>
      </div>

      {/* Resumo */}
      {form.price && (
        <div style={{ background:T.ink, borderRadius:12, padding:'18px 20px' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'1px', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginBottom:12 }}>Resumo</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)', maxWidth:'60%', lineHeight:1.4 }}>
              {isManut
                ? (form.service_types?.slice(0,2).join(', ') || 'Manutenção') + (form.service_types?.length > 2 ? ` +${form.service_types.length - 2}` : '')
                : `${form.iphone_model || '—'} ${form.capacity || ''}`}
            </span>
            <span style={{ fontSize:20, fontWeight:700, color:T.white, letterSpacing:'-0.5px' }}>R$ {form.price}</span>
          </div>
          {tradeVal > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
                iPhone entrada ({pd.iphone_entrada.model || '—'})
              </span>
              <span style={{ fontSize:12, color:'#86EFAC', fontWeight:600 }}>− R$ {pd.iphone_entrada.value}</span>
            </div>
          )}
          {tradeVal > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.08)', marginBottom:8 }}>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Total a pagar</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#86EFAC' }}>R$ {fmtNum(cashTotal)}</span>
            </div>
          )}
          <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'8px 0' }}/>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>
              {form.warranty_months || (isManut ? 3 : 12)} meses de garantia
            </span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>
              {form.payment_methods.map(m => PAY_OPTS.find(p => p.v === m)?.l).join(' + ') || '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const { data: clientsData } = useClients({ limit:100 })
  const clients = clientsData?.data || []

  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    client_id:'', type:'venda', iphone_model:'', capacity:'', color:'',
    imei:'', price:'', warranty_months:'', notes:'',
    payment_methods:[], service_types:[], problem_description:'', device_condition:'',
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]:v })); setErrors(e => ({ ...e, [k]:'' })) }
  const isManut = form.type === 'manutencao'

  const stepLabels = [
    { n:1, l:'Cliente' },
    { n:2, l: isManut ? 'Serviço' : 'Produto' },
    { n:3, l:'Pagamento' },
  ]

  const validate = () => {
    const e = {}
    if (step === 1 && !form.client_id) e.client_id = 'Selecione um cliente'
    if (step === 2) {
      if (!form.iphone_model) e.iphone_model = 'Selecione o modelo'
      if (form.imei && !validateIMEI(form.imei)) e.imei = 'IMEI inválido'
      if (isManut) {
        if (!form.service_types?.length) e.service_types = 'Selecione ao menos um serviço'
        if (!form.problem_description?.trim()) e.problem_description = 'Descreva o problema relatado'
      }
    }
    if (step === 3) {
      if (!form.price) e.price = 'Informe o valor'
      if (!form.payment_methods.length) e.payment_methods = 'Selecione ao menos uma forma de pagamento'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }

  const handleSubmit = async () => {
    if (!validate()) return
    const noteParts = []
    if (isManut && form.service_types?.length) noteParts.push(`Serviços: ${form.service_types.join(', ')}`)
    if (isManut && form.problem_description) noteParts.push(`Problema: ${form.problem_description}`)
    if (isManut && form.device_condition) {
      const cond = { otimo:'Ótimo', bom:'Bom', regular:'Regular', danificado:'Danificado' }
      noteParts.push(`Condição: ${cond[form.device_condition] || form.device_condition}`)
    }
    if (form.notes) noteParts.push(form.notes)

    await createOrder.mutateAsync({
      client_id:      form.client_id,
      type:           form.type,
      iphone_model:   form.iphone_model,
      capacity:       form.capacity || undefined,
      color:          form.color || undefined,
      imei:           form.imei || undefined,
      price:          parseVal(form.price),
      warranty_months: parseInt(form.warranty_months) || (isManut ? 3 : 12),
      payment_methods: form.payment_methods,
      notes:          noteParts.join('\n') || undefined,
    })
  }

  return (
    <div style={{ maxWidth:640, margin:'0 auto', fontFamily:'Instrument Sans,sans-serif', display:'flex', flexDirection:'column', gap:12 }}>

      {/* ── Stepper ─────────────────────────────────────────────── */}
      <div style={{ background:T.white, borderRadius:12, boxShadow:T.shadowSm, padding:'14px 22px' }}>
        <div style={{ display:'flex', alignItems:'center' }}>
          {stepLabels.map((s, i) => (
            <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < stepLabels.length - 1 ? 1 : 0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, transition:'all .2s',
                  background: step > s.n ? T.green : step === s.n ? T.ink : T.ink6,
                  color: step > s.n ? T.white : step === s.n ? T.white : T.ink4,
                }}>
                  {step > s.n ? <Check size={12}/> : s.n}
                </div>
                <span style={{ fontSize:13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? T.ink : T.ink4 }}>
                  {s.l}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div style={{ flex:1, height:1, background: step > s.n + 1 ? T.green : T.ink6, margin:'0 14px', transition:'background .3s' }}/>
              )}
            </div>
          ))}
        </div>

        {/* Context strip */}
        {isManut && step > 1 && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.ink6}`, display:'flex', alignItems:'center', gap:8 }}>
            <Wrench size={12} style={{ color:T.ink4 }}/>
            <span style={{ fontSize:12, color:T.ink3 }}>
              Manutenção{form.iphone_model ? ` · ${form.iphone_model}` : ''}
              {form.service_types?.length ? ` · ${form.service_types.length} serviço${form.service_types.length > 1 ? 's' : ''}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Form card ───────────────────────────────────────────── */}
      <div style={{ background:T.white, borderRadius:12, boxShadow:T.shadowSm, padding:28 }}>

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:T.ink, letterSpacing:'-0.3px', marginBottom:2 }}>Novo atendimento</div>
              <div style={{ fontSize:13, color:T.ink3 }}>Selecione o cliente e o tipo de serviço</div>
            </div>

            <div>
              <Label required>Cliente</Label>
              <Field err={errors.client_id}>
                <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                  <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
                    style={{ width:'100%', padding:'11px 36px 11px 14px', border:'none', outline:'none', fontSize:14, color: form.client_id ? T.ink : T.ink4, background:'transparent', fontFamily:'Instrument Sans,sans-serif', appearance:'none', cursor:'pointer' }}>
                    <option value="">Selecionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.cpf_formatted || formatCPF(c.cpf)}</option>)}
                  </select>
                  <ChevronDown size={14} style={{ position:'absolute', right:12, color:T.ink4, pointerEvents:'none' }}/>
                </div>
              </Field>
              <ErrMsg msg={errors.client_id}/>
            </div>

            <div>
              <Label required>Tipo de atendimento</Label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { v:'venda',     l:'Venda',      desc:'iPhone novo ou usado', icon:Smartphone },
                  { v:'manutencao',l:'Manutenção',  desc:'Reparo ou serviço técnico', icon:Wrench },
                ].map(t => {
                  const on = form.type === t.v
                  return (
                    <button key={t.v} onClick={() => set('type', t.v)}
                      style={{
                        padding:'18px 16px', borderRadius:10, cursor:'pointer', textAlign:'left',
                        border:`1.5px solid ${on ? T.ink : T.ink5}`,
                        background: on ? T.ink : T.white,
                        transition:'all .15s', display:'flex', flexDirection:'column', gap:10,
                        fontFamily:'Instrument Sans,sans-serif',
                      }}>
                      <div style={{
                        width:32, height:32, borderRadius:8,
                        background: on ? 'rgba(255,255,255,0.12)' : T.ink6,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <t.icon size={16} style={{ color: on ? T.white : T.ink3 }}/>
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color: on ? T.white : T.ink, marginBottom:3 }}>{t.l}</div>
                        <div style={{ fontSize:12, color: on ? 'rgba(255,255,255,0.45)' : T.ink4 }}>{t.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (isManut
          ? <StepServico form={form} set={set} errors={errors}/>
          : <StepProduto form={form} set={set} errors={errors}/>
        )}

        {step === 3 && <StepPagamento form={form} set={set} errors={errors} isManut={isManut}/>}

        {/* Navigation */}
        <div style={{ display:'flex', gap:10, marginTop:28, paddingTop:20, borderTop:`1px solid ${T.ink6}` }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/orders')}
            style={{
              display:'flex', alignItems:'center', gap:6, padding:'11px 18px',
              border:`1px solid ${T.ink5}`, borderRadius:9, background:T.white,
              cursor:'pointer', fontSize:13, fontWeight:500, color:T.ink3,
              fontFamily:'Instrument Sans,sans-serif', transition:'border-color .15s',
            }}>
            <ArrowLeft size={14}/>{step > 1 ? 'Voltar' : 'Cancelar'}
          </button>

          <button onClick={step < 3 ? next : handleSubmit} disabled={createOrder.isPending}
            style={{
              flex:1, padding:'11px 24px', background:T.ink, color:T.white,
              border:'none', borderRadius:9, cursor: createOrder.isPending ? 'not-allowed' : 'pointer',
              fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              fontFamily:'Instrument Sans,sans-serif', opacity: createOrder.isPending ? 0.7 : 1,
              transition:'opacity .15s',
            }}>
            {createOrder.isPending
              ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Registrando...</>
              : step < 3
                ? <>Próximo <ChevronRight size={14}/></>
                : <><Send size={14}/> Registrar atendimento</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}

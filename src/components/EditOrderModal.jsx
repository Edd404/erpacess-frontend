import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  X, Smartphone, Wrench, CheckCircle2, AlertCircle, Loader2,
  ChevronDown, Check, Zap, Banknote, CreditCard, Search, Plus,
} from 'lucide-react'
import { useUpdateOrder } from '../hooks/useData'
import { formatCurrencyInput } from '../utils/formatters'
import { validateIMEI } from '../utils/validators'

// ── Dados ─────────────────────────────────────────────────────
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
  { v:'pix',            l:'Pix',           icon:Zap        },
  { v:'dinheiro',       l:'Dinheiro',       icon:Banknote   },
  { v:'cartao_credito', l:'Crédito',        icon:CreditCard },
  { v:'cartao_debito',  l:'Débito',         icon:CreditCard },
  { v:'iphone_entrada', l:'iPhone Entrada', icon:Smartphone },
]

const PARCELAS = [1,2,3,4,5,6,7,8,9,10,11,12]

// ── Helpers ───────────────────────────────────────────────────
const brl = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)
const parseVal = s => parseFloat((s||'0').replace(/\./g,'').replace(',','.')) || 0
const fmtNum   = n => n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

const parsePayments = raw => {
  try { return Array.isArray(raw) ? raw : JSON.parse(raw||'[]') }
  catch { return [] }
}

const parseNotes = notes => {
  if (!notes) return { services:[], problem:'', condition:'', free:'' }
  const lines = notes.split('\n')
  let services=[], problem='', condition='', free=[]
  lines.forEach(l => {
    if (l.startsWith('Serviços:'))  services  = l.replace('Serviços:','').trim().split(', ').filter(Boolean)
    else if (l.startsWith('Problema:'))  problem   = l.replace('Problema:','').trim()
    else if (l.startsWith('Condição:'))  condition = l.replace('Condição:','').trim()
    else if (l.trim()) free.push(l)
  })
  return { services, problem, condition, free: free.join('\n') }
}

const buildNotes = ({ services, problem, condition, free, isManut }) => {
  const parts = []
  if (isManut && services.length)  parts.push(`Serviços: ${services.join(', ')}`)
  if (isManut && problem)          parts.push(`Problema: ${problem}`)
  if (isManut && condition)        parts.push(`Condição: ${condition}`)
  if (free)                        parts.push(free)
  return parts.join('\n') || null
}

// ── Sub-components ────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, color:'#AEAEB2', textTransform:'uppercase',
      letterSpacing:'0.7px', marginBottom:12, marginTop:4 }}>
      {children}
    </div>
  )
}

function FieldRow({ label, children, err }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:600, color:'#6B6B70', letterSpacing:'0.4px',
        textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      {children}
      {err && (
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4,
          fontSize:11, color:'#D93025' }}>
          <AlertCircle size={10}/>{err}
        </div>
      )}
    </div>
  )
}

// Model picker dropdown
function ModelPicker({ value, onChange, T }) {
  const [q, setQ] = useState(value||'')
  const [open, setOpen] = useState(false)

  useEffect(() => { setQ(value||'') }, [value])

  const filtered = IPHONE_MODELS
    .map(g => ({ ...g, m: g.m.filter(m => m.toLowerCase().includes(q.toLowerCase())) }))
    .filter(g => g.m.length > 0)

  return (
    <div style={{ position:'relative' }}>
      <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface,
        display:'flex', alignItems:'center' }}>
        <input value={q}
          onChange={e => { setQ(e.target.value); onChange(''); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder="Buscar modelo..."
          autoComplete="off"
          style={{ flex:1, padding:'11px 14px', border:'none', outline:'none', fontSize:14,
            color:T.ink, background:'transparent', fontFamily:'Instrument Sans,sans-serif' }}/>
        <ChevronDown size={13} style={{ marginRight:12, color:T.ink4, flexShrink:0 }}/>
      </div>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 3px)', left:0, right:0,
          background:T.surface, border:`1px solid ${T.ink5}`, borderRadius:12,
          boxShadow:'0 12px 40px rgba(0,0,0,0.12)', zIndex:600, maxHeight:220, overflowY:'auto' }}>
          {filtered.length === 0
            ? <div style={{ padding:14, fontSize:13, color:T.ink4, textAlign:'center' }}>Nenhum modelo</div>
            : filtered.map(g => (
              <div key={g.s}>
                <div style={{ padding:'6px 14px 3px', fontSize:10, fontWeight:700,
                  letterSpacing:'0.7px', color:T.ink4, textTransform:'uppercase',
                  background:T.bg, borderBottom:`1px solid ${T.ink6}` }}>{g.s}</div>
                {g.m.map(m => (
                  <div key={m} onMouseDown={() => { onChange(m); setQ(m); setOpen(false) }}
                    style={{ padding:'10px 14px', fontSize:13, color:T.ink2, cursor:'pointer',
                      borderBottom:`1px solid ${T.ink6}`, transition:'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
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

// IMEI field com feedback em tempo real
function IMEIField({ value, onChange, T }) {
  const len     = value.length
  const isValid = len === 15 && validateIMEI(value)
  const isWrong = len === 15 && !isValid

  return (
    <div style={{ border:`1px solid ${isWrong ? '#D93025' : isValid ? '#12A150' : T.ink5}`,
      borderRadius:10, background:T.surface, display:'flex', alignItems:'center', overflow:'hidden',
      transition:'border-color .15s' }}>
      <input value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g,'').slice(0,15))}
        placeholder="15 dígitos"
        inputMode="numeric"
        maxLength={15}
        style={{ flex:1, padding:'11px 14px', border:'none', outline:'none', fontSize:13,
          color:T.ink, background:'transparent', fontFamily:'JetBrains Mono,monospace',
          letterSpacing:'0.5px' }}/>
      <div style={{ display:'flex', alignItems:'center', gap:5, paddingRight:12 }}>
        {len > 0 && (
          <span style={{ fontSize:11, color: len===15 ? (isValid ? '#12A150' : '#D93025') : T.ink4,
            fontFamily:'JetBrains Mono,monospace' }}>
            {len}/15
          </span>
        )}
        {isValid && <CheckCircle2 size={14} style={{ color:'#12A150' }}/>}
        {isWrong && <AlertCircle  size={14} style={{ color:'#D93025' }}/>}
      </div>
    </div>
  )
}

// Serviços picker (chips + dropdown de adição)
function ServicesPicker({ selected, onChange, T }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const allItems = SERVICOS.flatMap(g => g.items.map(i => ({ item:i, cat:g.cat, dot:g.dot })))
  const filtered = allItems.filter(x =>
    !selected.includes(x.item) && x.item.toLowerCase().includes(q.toLowerCase())
  )

  const remove = item => onChange(selected.filter(s => s !== item))
  const add    = item => { onChange([...selected, item]); setQ(''); setOpen(false) }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {/* Chips dos serviços selecionados */}
      {selected.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {selected.map(s => (
            <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:T.ink, color:'#fff', padding:'5px 12px', borderRadius:999,
              fontSize:12, fontWeight:500 }}>
              {s}
              <button onClick={() => remove(s)}
                style={{ background:'none', border:'none', cursor:'pointer',
                  color:'rgba(255,255,255,0.5)', padding:0, display:'flex', lineHeight:1 }}>
                <X size={11}/>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Campo de adição */}
      <div style={{ position:'relative' }}>
        <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface,
          display:'flex', alignItems:'center' }}>
          <Search size={13} style={{ marginLeft:12, color:T.ink4, flexShrink:0 }}/>
          <input value={q}
            onChange={e => { setQ(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 160)}
            placeholder="Adicionar serviço..."
            style={{ flex:1, padding:'10px 12px', border:'none', outline:'none',
              fontSize:13, color:T.ink, background:'transparent',
              fontFamily:'Instrument Sans,sans-serif' }}/>
          <Plus size={13} style={{ marginRight:12, color:T.ink4 }}/>
        </div>

        {open && filtered.length > 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 3px)', left:0, right:0,
            background:T.surface, border:`1px solid ${T.ink5}`, borderRadius:12,
            boxShadow:'0 12px 40px rgba(0,0,0,0.12)', zIndex:600, maxHeight:200, overflowY:'auto' }}>
            {filtered.map(({ item, cat, dot }) => (
              <div key={item} onMouseDown={() => add(item)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                  cursor:'pointer', borderBottom:`1px solid ${T.ink6}`, transition:'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:dot, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:13, color:T.ink }}>{item}</div>
                  <div style={{ fontSize:10, color:T.ink4, marginTop:1 }}>{cat}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function EditOrderModal({ order, onClose }) {
  const { T } = useTheme()
  const updateOrder = useUpdateOrder()
  const isManut = order?.type === 'manutencao'

  // Inicializa o form com os valores atuais da ordem
  const parsed = parseNotes(order?.notes)
  const initPayments = parsePayments(order?.payment_methods)

  const [form, setForm] = useState({
    iphone_model:   order?.iphone_model || '',
    capacity:       order?.capacity || '',
    color:          order?.color || '',
    imei:           order?.imei || '',
    condition_sale: order?.condition_sale || '',
    price:          order?.price ? fmtNum(parseFloat(order.price)) : '',
    warranty_months: order?.warranty_months != null ? String(order.warranty_months) : '',
    payment_methods: initPayments,
    // Manutenção
    services:       parsed.services,
    problem:        parsed.problem,
    free_notes:     parsed.free,
    // Venda
    notes:          isManut ? parsed.free : (order?.notes || ''),
  })

  const [errors, setErrors] = useState({})
  // Estado de parcelas do cartão (preservado localmente)
  const [parcelas, setParcelas] = useState('1')

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const togglePay = v => set('payment_methods',
    form.payment_methods.includes(v)
      ? form.payment_methods.filter(x => x !== v)
      : [...form.payment_methods, v]
  )

  const validate = () => {
    const e = {}
    if (!form.iphone_model.trim())      e.iphone_model = 'Modelo obrigatório'
    if (form.imei && !validateIMEI(form.imei)) e.imei = 'IMEI inválido'
    if (!form.price)                    e.price = 'Valor obrigatório'
    if (!form.payment_methods.length)   e.payment_methods = 'Selecione ao menos uma forma de pagamento'
    if (!isManut && !form.condition_sale) e.condition_sale = 'Selecione a condição'
    if (isManut && !form.services.length) e.services = 'Selecione ao menos um serviço'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    const notesBuilt = isManut
      ? buildNotes({ services: form.services, problem: form.problem, condition:'', free: form.free_notes, isManut: true })
      : (form.notes?.trim() || null)

    await updateOrder.mutateAsync({
      id: order.id,
      data: {
        iphone_model:    form.iphone_model.trim(),
        capacity:        form.capacity || null,
        color:           form.color.trim() || null,
        imei:            form.imei || null,
        price:           parseVal(form.price),
        warranty_months: parseInt(form.warranty_months) || 0,
        payment_methods: form.payment_methods,
        notes:           notesBuilt,
        condition_sale:  !isManut ? (form.condition_sale || null) : null,
      },
    })
    onClose()
  }

  const typeColor  = isManut ? '#1C2B3A' : '#0A66FF'
  const typeLabel  = isManut ? 'Manutenção' : 'Venda'
  const TypeIcon   = isManut ? Wrench : Smartphone

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
      backdropFilter:'blur(6px)', zIndex:1600, display:'flex', alignItems:'center',
      justifyContent:'center', padding:16, fontFamily:'Instrument Sans,sans-serif' }}
      onClick={onClose}>

      <div onClick={e => e.stopPropagation()}
        style={{ background:T.bg, borderRadius:20, width:'100%', maxWidth:560,
          maxHeight:'93vh', overflow:'hidden', boxShadow:'0 32px 100px rgba(0,0,0,0.3)',
          display:'flex', flexDirection:'column' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ background:T.surface, padding:'18px 22px',
          borderBottom:`1px solid ${T.ink6}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:10,
                background: isManut ? '#1C2B3A' : T.blueL,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TypeIcon size={18} style={{ color: isManut ? '#fff' : T.blue }}/>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:T.ink, letterSpacing:'-0.3px' }}>
                  Editar OS · {order?.order_number}
                </div>
                <div style={{ fontSize:12, color:T.ink4, marginTop:2 }}>
                  {typeLabel} · {order?.client_name}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ background:T.bg, border:'none', borderRadius:9, width:34, height:34,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', color:T.ink3 }}>
              <X size={16}/>
            </button>
          </div>

          {/* Aviso sobre PDF */}
          <div style={{ marginTop:14, padding:'9px 13px',
            background: isManut ? '#F0F4F8' : T.blueL,
            borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
            <AlertCircle size={13} style={{ color: isManut ? '#4A6080' : T.blue, flexShrink:0 }}/>
            <span style={{ fontSize:12, color: isManut ? '#4A6080' : T.blue }}>
              Após salvar, se necessário reenvie o PDF de garantia pelo modal de detalhes.
            </span>
          </div>
        </div>

        {/* ── Body (scroll) ───────────────────────────────────── */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 22px',
          display:'flex', flexDirection:'column', gap:22 }}>

          {/* ─ Aparelho ───────────────────────────────────────── */}
          <div>
            <SectionTitle>Aparelho</SectionTitle>
            <div style={{ background:T.surface, borderRadius:12, padding:'18px 16px',
              display:'flex', flexDirection:'column', gap:16 }}>

              <FieldRow label="Modelo" err={errors.iphone_model}>
                <ModelPicker value={form.iphone_model} onChange={v => set('iphone_model', v)} T={T}/>
              </FieldRow>

              {!isManut && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <FieldRow label="Capacidade">
                    <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface,
                      position:'relative', display:'flex', alignItems:'center' }}>
                      <select value={form.capacity} onChange={e => set('capacity', e.target.value)}
                        style={{ width:'100%', padding:'11px 36px 11px 14px', border:'none',
                          outline:'none', fontSize:14, color: form.capacity ? T.ink : T.ink4,
                          background:'transparent', fontFamily:'Instrument Sans,sans-serif',
                          appearance:'none', cursor:'pointer' }}>
                        <option value="">Selecionar...</option>
                        {['64GB','128GB','256GB','512GB','1TB'].map(c => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={13} style={{ position:'absolute', right:12,
                        color:T.ink4, pointerEvents:'none' }}/>
                    </div>
                  </FieldRow>
                  <FieldRow label="Cor">
                    <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface }}>
                      <input value={form.color} onChange={e => set('color', e.target.value)}
                        placeholder="Ex: Titânio Natural"
                        style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none',
                          fontSize:14, color:T.ink, background:'transparent',
                          fontFamily:'Instrument Sans,sans-serif', boxSizing:'border-box' }}/>
                    </div>
                  </FieldRow>
                </div>
              )}

              {isManut && (
                <FieldRow label="Cor">
                  <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface }}>
                    <input value={form.color} onChange={e => set('color', e.target.value)}
                      placeholder="Ex: Preto Meia-noite"
                      style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none',
                        fontSize:14, color:T.ink, background:'transparent',
                        fontFamily:'Instrument Sans,sans-serif', boxSizing:'border-box' }}/>
                  </div>
                </FieldRow>
              )}

              <FieldRow label="IMEI" err={errors.imei}>
                <IMEIField value={form.imei} onChange={v => set('imei', v)} T={T}/>
              </FieldRow>

              {!isManut && (
                <FieldRow label="Condição" err={errors.condition_sale}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { v:'lacrado',  l:'Lacrado',  desc:'Na caixa, nunca usado', emoji:'📦' },
                      { v:'seminovo', l:'Seminovo', desc:'Usado, em bom estado',  emoji:'✨' },
                    ].map(opt => {
                      const on = form.condition_sale === opt.v
                      return (
                        <button key={opt.v} onClick={() => set('condition_sale', opt.v)}
                          style={{ padding:'14px 12px', borderRadius:10, cursor:'pointer',
                            textAlign:'left',
                            border:`1.5px solid ${errors.condition_sale ? '#D93025' : on ? T.ink : T.ink5}`,
                            background: on ? T.ink : T.surface,
                            transition:'all .15s', display:'flex', flexDirection:'column', gap:6,
                            fontFamily:'Instrument Sans,sans-serif' }}>
                          <div style={{ fontSize:20, lineHeight:1 }}>{opt.emoji}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700,
                              color: on ? '#fff' : T.ink, marginBottom:2 }}>{opt.l}</div>
                            <div style={{ fontSize:11, color: on ? 'rgba(255,255,255,0.45)' : T.ink4 }}>
                              {opt.desc}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </FieldRow>
              )}
            </div>
          </div>

          {/* ─ Serviços (manutenção) ──────────────────────────── */}
          {isManut && (
            <div>
              <SectionTitle>Serviço</SectionTitle>
              <div style={{ background:T.surface, borderRadius:12, padding:'18px 16px',
                display:'flex', flexDirection:'column', gap:16 }}>

                <FieldRow label="Serviços" err={errors.services}>
                  <ServicesPicker selected={form.services}
                    onChange={v => set('services', v)} T={T}/>
                </FieldRow>

                <FieldRow label="Problema relatado">
                  <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface }}>
                    <textarea value={form.problem} onChange={e => set('problem', e.target.value)}
                      rows={2} placeholder="Descreva o problema relatado pelo cliente..."
                      style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none',
                        resize:'vertical', fontSize:13, color:T.ink, background:'transparent',
                        fontFamily:'Instrument Sans,sans-serif', lineHeight:1.6,
                        boxSizing:'border-box' }}/>
                  </div>
                </FieldRow>
              </div>
            </div>
          )}

          {/* ─ Pagamento ─────────────────────────────────────── */}
          <div>
            <SectionTitle>Pagamento</SectionTitle>
            <div style={{ background:T.surface, borderRadius:12, padding:'18px 16px',
              display:'flex', flexDirection:'column', gap:16 }}>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <FieldRow label="Valor (R$)" err={errors.price}>
                  <div style={{ border:`1px solid ${errors.price ? '#D93025' : T.ink5}`,
                    borderRadius:10, background:T.surface, display:'flex', alignItems:'center' }}>
                    <span style={{ paddingLeft:14, fontSize:14, color:T.ink3,
                      fontWeight:500, flexShrink:0 }}>R$</span>
                    <input value={form.price}
                      onChange={e => set('price', formatCurrencyInput(e.target.value))}
                      placeholder="0,00"
                      style={{ flex:1, padding:'11px 14px 11px 6px', border:'none',
                        outline:'none', fontSize:18, fontWeight:700, color:T.ink,
                        background:'transparent', fontFamily:'Instrument Sans,sans-serif',
                        letterSpacing:'-0.5px' }}/>
                  </div>
                </FieldRow>

                <FieldRow label="Garantia (meses)">
                  <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10,
                    background:T.surface }}>
                    <input type="number" min="0" max="60" value={form.warranty_months}
                      onChange={e => set('warranty_months', e.target.value)}
                      style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none',
                        fontSize:14, color:T.ink, background:'transparent',
                        fontFamily:'Instrument Sans,sans-serif', boxSizing:'border-box' }}/>
                  </div>
                </FieldRow>
              </div>

              <FieldRow label="Formas de pagamento" err={errors.payment_methods}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {PAY_OPTS.filter(p => !p.vendaOnly || !isManut).map(p => {
                    const on = form.payment_methods.includes(p.v)
                    return (
                      <button key={p.v} onClick={() => togglePay(p.v)}
                        style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px',
                          borderRadius:999, fontSize:13, fontWeight:500,
                          border:`1.5px solid ${on ? T.ink : T.ink5}`,
                          background: on ? T.ink : T.surface,
                          color: on ? '#fff' : T.ink3,
                          cursor:'pointer', transition:'all .15s',
                          fontFamily:'Instrument Sans,sans-serif' }}>
                        <p.icon size={13}/>
                        {p.l}
                        {on && <Check size={11} style={{ opacity:0.7 }}/>}
                      </button>
                    )
                  })}
                </div>
              </FieldRow>

              {/* Parcelas do crédito */}
              {form.payment_methods.includes('cartao_credito') && (
                <FieldRow label="Parcelas (crédito)">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {PARCELAS.map(n => {
                      const on = parcelas === String(n)
                      return (
                        <button key={n} onClick={() => setParcelas(String(n))}
                          style={{ width:38, height:30, borderRadius:7,
                            border:`1px solid ${on ? T.ink : T.ink5}`,
                            background: on ? T.ink : T.surface,
                            color: on ? '#fff' : T.ink3,
                            fontSize:12, fontWeight: on ? 600 : 400,
                            cursor:'pointer', fontFamily:'Instrument Sans,sans-serif',
                            transition:'all .12s' }}>
                          {n}x
                        </button>
                      )
                    })}
                  </div>
                </FieldRow>
              )}

              {/* Resumo do valor */}
              {form.price && (
                <div style={{ background:T.bg, borderRadius:10, padding:'12px 14px',
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:T.ink3 }}>Total</span>
                  <span style={{ fontSize:20, fontWeight:700, color:T.ink,
                    letterSpacing:'-0.5px' }}>{brl(parseVal(form.price))}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─ Observações ───────────────────────────────────── */}
          <div>
            <SectionTitle>Observações</SectionTitle>
            <div style={{ background:T.surface, borderRadius:12, padding:'18px 16px' }}>
              <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface }}>
                <textarea
                  value={isManut ? form.free_notes : form.notes}
                  onChange={e => set(isManut ? 'free_notes' : 'notes', e.target.value)}
                  rows={3}
                  placeholder={isManut
                    ? 'Prazo de entrega, acessórios recebidos, acordos...'
                    : 'Condições, defeitos, acordos...'}
                  style={{ width:'100%', padding:'11px 14px', border:'none', outline:'none',
                    resize:'vertical', fontSize:13, color:T.ink, background:'transparent',
                    fontFamily:'Instrument Sans,sans-serif', lineHeight:1.6,
                    boxSizing:'border-box' }}/>
              </div>
            </div>
          </div>

          {/* Espaço extra no final para o footer não sobrepor */}
          <div style={{ height:4 }}/>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div style={{ padding:'14px 22px', borderTop:`1px solid ${T.ink6}`,
          display:'flex', gap:10, flexShrink:0, background:T.surface }}>
          <button onClick={onClose}
            style={{ padding:'11px 20px', border:`1px solid ${T.ink5}`, borderRadius:9,
              background:T.surface, cursor:'pointer', fontSize:13, fontWeight:500,
              color:T.ink3, fontFamily:'Instrument Sans,sans-serif' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={updateOrder.isPending}
            style={{ flex:1, padding:'11px 24px', background:T.ink, color:'#fff',
              border:'none', borderRadius:9,
              cursor: updateOrder.isPending ? 'not-allowed' : 'pointer',
              fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              fontFamily:'Instrument Sans,sans-serif',
              opacity: updateOrder.isPending ? 0.7 : 1, transition:'opacity .15s' }}>
            {updateOrder.isPending
              ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Salvando...</>
              : <><Check size={14}/> Salvar alterações</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

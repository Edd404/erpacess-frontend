import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients, useCreateOrder } from '../hooks/useData'
import { formatCurrencyInput, formatCPF } from '../utils/formatters'
import { validateIMEI } from '../utils/validators'
import {
  ArrowLeft, ChevronRight, Check, Smartphone, Wrench, Zap, CreditCard,
  Banknote, Loader2, Send, Search, AlertCircle, CheckCircle2, X
} from 'lucide-react'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', borderS:'rgba(0,0,0,0.12)',
  text:'#0C0C0E', t2:'#6B7280', t3:'#9CA3AF', bg:'#F7F7F8',
  accent:'#0A66FF', accentL:'#EEF4FF', green:'#16A34A', greenL:'#F0FDF4',
  red:'#DC2626', redL:'#FEF2F2', amber:'#D97706', amberL:'#FFFBEB',
  purple:'#7C3AED', purpleL:'#F5F3FF',
  shadow:'0 1px 2px rgba(0,0,0,0.05),0 0 0 1px rgba(0,0,0,0.06)',
}

// ── Modelos ──────────────────────────────────────────────────────────────────
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

// ── Serviços de manutenção ───────────────────────────────────────────────────
const SERVICOS = [
  {
    cat: 'Tela & Display', icon: '📱', color: T.accent,
    items: [
      'Troca de Tela (Display + Touch)',
      'Troca de Tela Original Remanufaturada',
      'Troca de Vidro Frontal',
      'Troca de Vidro Traseiro',
      'Reparo de Tela com Manchas / Listras',
      'Reparo de Tela sem Toque (Touch)',
    ]
  },
  {
    cat: 'Bateria & Carga', icon: '🔋', color: T.green,
    items: [
      'Troca de Bateria',
      'Reparo de Conector de Carga (Lightning)',
      'Reparo de Conector de Carga (USB-C)',
      'Calibração de Bateria',
      'Reparo de Carregamento Sem Fio',
    ]
  },
  {
    cat: 'Câmera & Flash', icon: '📷', color: '#8B5CF6',
    items: [
      'Troca de Câmera Traseira',
      'Troca de Câmera Frontal',
      'Troca de Câmera Frontal (Face ID / TrueDepth)',
      'Troca de Lente da Câmera',
      'Troca de Flash',
      'Reparo de Câmera Travada / Tremida',
    ]
  },
  {
    cat: 'Áudio & Som', icon: '🔊', color: T.amber,
    items: [
      'Troca de Alto-falante (Speaker)',
      'Troca de Fone de Ouvido Interno (Earpiece)',
      'Troca de Microfone',
      'Reparo de Áudio Sem Som',
      'Reparo de Microfone Não Funciona',
    ]
  },
  {
    cat: 'Botões & Estrutura', icon: '🔩', color: '#0891B2',
    items: [
      'Troca de Botão Power / Sleep',
      'Troca de Botões de Volume',
      'Troca de Chave Mute / Ring Switch',
      'Troca de Bandeja SIM (SIM Tray)',
      'Troca de Chassi / Carcaça',
      'Reparo de Vibração (Taptic Engine)',
    ]
  },
  {
    cat: 'Conectividade', icon: '📡', color: T.accent,
    items: [
      'Reparo de Wi-Fi / Bluetooth',
      'Reparo de Sinal / Sem Rede',
      'Reparo de GPS',
      'Reparo de NFC',
      'Reparo de Antena',
    ]
  },
  {
    cat: 'Software & Sistema', icon: '💻', color: T.green,
    items: [
      'Restauração de Sistema (DFU / Recovery)',
      'Desbloqueio de Senha / Tela',
      'Remoção de Bloqueio iCloud / Ativação',
      'Backup e Transferência de Dados',
      'Atualização / Downgrade de iOS',
      'Reparo de Loop de Reinicialização',
      'Diagnóstico Completo',
    ]
  },
  {
    cat: 'Placa & Micro Soldagem', icon: '⚡', color: T.red,
    items: [
      'Reparo de Placa-Mãe (Micro Soldagem)',
      'Reparo de Face ID',
      'Reparo de Touch ID',
      'Recuperação de Dados (Placa Danificada)',
      'Reparo de Danos por Líquido / Oxidação',
      'Reparo de Componente BGA',
    ]
  },
  {
    cat: 'Higienização & Outros', icon: '🧹', color: '#6B7280',
    items: [
      'Higienização Completa Interna',
      'Higienização Pós-Líquido',
      'Avaliação Técnica (Orçamento)',
      'Instalação de Película / Protetor',
      'Troca de Película',
    ]
  },
]

// ── Pagamento ────────────────────────────────────────────────────────────────
const PAY_OPTS = [
  { v:'pix',            l:'Pix',     icon:Zap       },
  { v:'dinheiro',       l:'Dinheiro', icon:Banknote  },
  { v:'cartao_credito', l:'Crédito',  icon:CreditCard},
  { v:'cartao_debito',  l:'Débito',   icon:CreditCard},
]

const PARCELAS = [1,2,3,4,5,6,7,8,9,10,11,12]

const parseVal = (s) => parseFloat((s||'0').replace(/\./g,'').replace(',','.')) || 0
const fmtNum  = (n) => n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

// ── Componentes auxiliares ───────────────────────────────────────────────────
const lbl = (txt, req) => (
  <label style={{ fontSize:12, fontWeight:500, color:T.t2, display:'block', marginBottom:6 }}>
    {txt}{req && <span style={{ color:T.red }}> *</span>}
  </label>
)

const errTip = (msg) => msg && (
  <span style={{ fontSize:11, color:T.red, marginTop:4, display:'flex', alignItems:'center', gap:3 }}>
    <AlertCircle size={10}/>{msg}
  </span>
)

function ModelSearch({ value, onSelect, error, placeholder='Buscar modelo...' }) {
  const [search, setSearch] = useState(value || '')
  const [open, setOpen] = useState(false)

  const filtered = IPHONE_MODELS
    .map(g => ({ ...g, m: g.m.filter(m => m.toLowerCase().includes(search.toLowerCase())) }))
    .filter(g => g.m.length > 0)

  const inp = {
    width:'100%', padding:'9px 12px', border:`1px solid ${error ? T.red : T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box',
  }

  return (
    <div style={{ position:'relative' }}>
      <input
        value={value || search}
        onChange={e => { setSearch(e.target.value); onSelect(''); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder={placeholder}
        autoComplete="off"
        style={inp}
      />
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.surface, border:`1px solid ${T.borderS}`, borderRadius:8, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:300, maxHeight:220, overflowY:'auto', marginTop:2 }}>
          {filtered.length === 0
            ? <div style={{ padding:'14px', fontSize:13, color:T.t3, textAlign:'center' }}>Nenhum modelo encontrado</div>
            : filtered.map(g => (
              <div key={g.s}>
                <div style={{ padding:'6px 12px 3px', fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'0.5px', background:T.bg, position:'sticky', top:0 }}>{g.s}</div>
                {g.m.map(m => (
                  <div key={m}
                    onMouseDown={() => { onSelect(m); setSearch(m); setOpen(false) }}
                    style={{ padding:'9px 14px', fontSize:13, cursor:'pointer', color:T.text }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {m}
                  </div>
                ))}
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ── Step 2 — Manutenção ──────────────────────────────────────────────────────
function StepServico({ form, set, errors }) {
  const [serviceSearch, setServiceSearch] = useState('')
  const [expandedCat, setExpandedCat] = useState(null)

  const inp = (err) => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${err ? T.red : T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box',
  })

  // Filtragem de serviços
  const filtered = serviceSearch
    ? SERVICOS
        .map(g => ({ ...g, items: g.items.filter(i => i.toLowerCase().includes(serviceSearch.toLowerCase())) }))
        .filter(g => g.items.length > 0)
    : SERVICOS

  const toggleService = (item) => {
    const cur = form.service_types || []
    set('service_types', cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item])
  }

  const selectedServices = form.service_types || []

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ fontSize:15, fontWeight:700 }}>Aparelho e serviços</div>

      {/* Aparelho */}
      <div>
        {lbl('Modelo do iPhone', true)}
        <ModelSearch value={form.iphone_model} onSelect={v => set('iphone_model', v)} error={errors.iphone_model}/>
        {errTip(errors.iphone_model)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          {lbl('Cor (opcional)')}
          <input value={form.color} onChange={e => set('color', e.target.value)}
            placeholder="Ex: Preto" style={inp()}/>
        </div>
        <div>
          {lbl('IMEI (opcional)')}
          <input value={form.imei}
            onChange={e => set('imei', e.target.value.replace(/\D/g,'').slice(0,15))}
            placeholder="15 dígitos"
            style={{ ...inp(errors.imei), fontFamily:'JetBrains Mono,monospace', letterSpacing:'1px' }}/>
          {errTip(errors.imei)}
        </div>
      </div>

      {/* Serviços selecionados */}
      {selectedServices.length > 0 && (
        <div style={{ background:T.accentL, borderRadius:8, padding:'10px 12px', display:'flex', flexWrap:'wrap', gap:6 }}>
          {selectedServices.map(s => (
            <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:5, background:T.accent, color:'#fff', padding:'4px 10px', borderRadius:999, fontSize:12, fontWeight:500 }}>
              {s}
              <button onClick={() => toggleService(s)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', padding:0, display:'flex', lineHeight:1 }}>
                <X size={11}/>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Busca + lista de serviços */}
      <div>
        {lbl('Tipo(s) de serviço', true)}

        {/* Busca */}
        <div style={{ position:'relative', marginBottom:10 }}>
          <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:T.t3, pointerEvents:'none' }}/>
          <input
            value={serviceSearch}
            onChange={e => setServiceSearch(e.target.value)}
            placeholder="Buscar serviço..."
            style={{ ...inp(errors.service_types), paddingLeft:32 }}
          />
        </div>
        {errTip(errors.service_types)}

        {/* Categorias */}
        <div style={{ border:`1px solid ${T.borderS}`, borderRadius:10, overflow:'hidden', maxHeight:320, overflowY:'auto' }}>
          {filtered.map((group, gi) => {
            const isOpen = serviceSearch || expandedCat === group.cat
            const anySelected = group.items.some(i => selectedServices.includes(i))
            return (
              <div key={group.cat}>
                {/* Category header */}
                <button
                  onClick={() => setExpandedCat(isOpen && !serviceSearch ? null : group.cat)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', background: anySelected ? `${group.color}0D` : gi % 2 === 0 ? T.bg : T.surface,
                    border:'none', borderBottom:`1px solid ${T.border}`, cursor:'pointer',
                    fontFamily:'Instrument Sans,sans-serif',
                  }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:15 }}>{group.icon}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{group.cat}</span>
                    {anySelected && (
                      <span style={{ fontSize:10, background:group.color, color:'#fff', padding:'1px 7px', borderRadius:999, fontWeight:600 }}>
                        {group.items.filter(i => selectedServices.includes(i)).length}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color:T.t3, transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform .2s' }}/>
                </button>

                {/* Services */}
                {isOpen && group.items.map((item, ii) => {
                  const selected = selectedServices.includes(item)
                  const isLast = ii === group.items.length - 1
                  return (
                    <button key={item}
                      onClick={() => toggleService(item)}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:10,
                        padding:'9px 14px 9px 36px',
                        background: selected ? `${group.color}0A` : T.surface,
                        border:'none', borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                        cursor:'pointer', textAlign:'left', fontFamily:'Instrument Sans,sans-serif',
                        transition:'background .1s',
                      }}>
                      <div style={{
                        width:18, height:18, borderRadius:4, flexShrink:0, display:'flex',
                        alignItems:'center', justifyContent:'center', transition:'all .15s',
                        border: selected ? 'none' : `1.5px solid ${T.borderS}`,
                        background: selected ? group.color : 'transparent',
                      }}>
                        {selected && <Check size={11} style={{ color:'#fff' }}/>}
                      </div>
                      <span style={{ fontSize:13, color: selected ? T.text : T.t2, fontWeight: selected ? 500 : 400 }}>
                        {item}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Descrição do problema */}
      <div>
        {lbl('Descrição do problema / defeito relatado', true)}
        <textarea
          value={form.problem_description || ''}
          onChange={e => set('problem_description', e.target.value)}
          rows={3}
          placeholder="Ex: Tela rachada após queda, não acende mais. Cliente relata que caiu de 1m de altura..."
          style={{ ...inp(errors.problem_description), resize:'vertical' }}
        />
        {errTip(errors.problem_description)}
      </div>

      {/* Condição geral */}
      <div>
        {lbl('Condição geral do aparelho')}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            { v:'otimo',     l:'Ótimo',    emoji:'✨', color:T.green  },
            { v:'bom',       l:'Bom',      emoji:'👍', color:T.accent },
            { v:'regular',   l:'Regular',  emoji:'⚠️', color:T.amber  },
            { v:'danificado',l:'Danificado',emoji:'💥', color:T.red   },
          ].map(c => {
            const active = form.device_condition === c.v
            return (
              <button key={c.v} onClick={() => set('device_condition', c.v)}
                style={{
                  padding:'10px 6px', borderRadius:8, cursor:'pointer', border:`1.5px solid ${active ? c.color : T.border}`,
                  background: active ? `${c.color}12` : T.surface, transition:'all .15s',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                  fontFamily:'Instrument Sans,sans-serif',
                }}>
                <span style={{ fontSize:18 }}>{c.emoji}</span>
                <span style={{ fontSize:11, fontWeight: active ? 600 : 400, color: active ? c.color : T.t2 }}>{c.l}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Step 2 — Venda ───────────────────────────────────────────────────────────
function StepProduto({ form, set, errors }) {
  const inp = (err) => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${err ? T.red : T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ fontSize:15, fontWeight:700 }}>Informações do produto</div>

      <div>
        {lbl('Modelo do iPhone', true)}
        <ModelSearch value={form.iphone_model} onSelect={v => set('iphone_model', v)} error={errors.iphone_model}/>
        {errTip(errors.iphone_model)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          {lbl('Capacidade')}
          <div style={{ position:'relative' }}>
            <select value={form.capacity} onChange={e => set('capacity', e.target.value)}
              style={{ ...inp(), appearance:'none', paddingRight:32, cursor:'pointer' }}>
              <option value="">Selecionar...</option>
              {['64GB','128GB','256GB','512GB','1TB'].map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronRight size={12} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%) rotate(90deg)', color:T.t3, pointerEvents:'none' }}/>
          </div>
        </div>
        <div>
          {lbl('Cor')}
          <input value={form.color} onChange={e => set('color', e.target.value)}
            placeholder="Ex: Titânio Natural" style={inp()}/>
        </div>
      </div>

      <div>
        {lbl('IMEI (opcional)')}
        <input value={form.imei}
          onChange={e => set('imei', e.target.value.replace(/\D/g,'').slice(0,15))}
          placeholder="15 dígitos"
          style={{ ...inp(errors.imei), fontFamily:'JetBrains Mono,monospace', letterSpacing:'1px' }}/>
        {errTip(errors.imei)}
      </div>
    </div>
  )
}

// ── Step 3 — Pagamento ───────────────────────────────────────────────────────
function StepPagamento({ form, set, errors, type }) {
  const [pd, setPdState] = useState({
    pix:            { value:'' },
    dinheiro:       { value:'' },
    cartao_credito: { value:'', parcelas:'1' },
    cartao_debito:  { value:'' },
  })

  const setPd = (method, field, val) => setPdState(p => ({ ...p, [method]: { ...p[method], [field]: val } }))

  const togglePay = (v) => {
    set('payment_methods', form.payment_methods.includes(v)
      ? form.payment_methods.filter(x => x !== v)
      : [...form.payment_methods, v]
    )
  }

  const total = parseVal(form.price)
  const cashMethods = form.payment_methods
  const autoMethod = cashMethods.filter(m => parseVal(pd[m].value) === 0).length === 1
    ? cashMethods.find(m => parseVal(pd[m].value) === 0)
    : null

  const getEff = (m) => {
    if (m === autoMethod && cashMethods.length > 1) {
      const sum = cashMethods.filter(x => x !== m).reduce((s, x) => s + parseVal(pd[x].value), 0)
      return Math.max(0, total - sum)
    }
    return parseVal(pd[m].value)
  }

  const allocated = cashMethods.reduce((s, m) => s + getEff(m), 0)
  const remainder = total - allocated
  const balanced  = Math.abs(remainder) < 0.01
  const over      = remainder < -0.01

  const inp = (err) => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${err ? T.red : T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box',
  })

  const warrantyDefault = type === 'manutencao' ? '3' : '12'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ fontSize:15, fontWeight:700 }}>Pagamento e garantia</div>

      {/* Valor + Garantia */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          {lbl('Valor (R$)', true)}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:12, color:T.t3, fontWeight:500 }}>R$</span>
            <input value={form.price} onChange={e => set('price', formatCurrencyInput(e.target.value))}
              placeholder="0,00"
              style={{ ...inp(errors.price), paddingLeft:30, fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}/>
          </div>
          {errTip(errors.price)}
        </div>
        <div>
          {lbl('Garantia (meses)')}
          <input type="number" min="0" max="60"
            value={form.warranty_months ?? warrantyDefault}
            onChange={e => set('warranty_months', e.target.value)}
            style={inp()}/>
          <span style={{ fontSize:10, color:T.t3, marginTop:3, display:'block' }}>
            {type === 'manutencao' ? 'Padrão: 3 meses para serviços' : 'Padrão: 12 meses para vendas'}
          </span>
        </div>
      </div>

      {/* Formas */}
      <div>
        {lbl('Formas de pagamento', true)}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {PAY_OPTS.map(p => {
            const active = form.payment_methods.includes(p.v)
            return (
              <button key={p.v} onClick={() => togglePay(p.v)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999, fontSize:13, fontWeight:500,
                  border:`1.5px solid ${active ? T.text : T.border}`, background:active ? T.text : 'transparent',
                  color:active ? '#fff' : T.t2, cursor:'pointer', transition:'all .15s', fontFamily:'Instrument Sans,sans-serif' }}>
                <p.icon size={13}/>{p.l}{active && <Check size={12}/>}
              </button>
            )
          })}
        </div>
        {errTip(errors.payment_methods)}
      </div>

      {/* Detalhes por método */}
      {cashMethods.length > 0 && (
        <div style={{ border:`1px solid ${T.borderS}`, borderRadius:10, overflow:'hidden' }}>
          {cashMethods.map((m, idx) => {
            const opt = PAY_OPTS.find(p => p.v === m)
            const isAuto = m === autoMethod && cashMethods.length > 1
            const effVal = getEff(m)
            return (
              <div key={m} style={{ borderBottom: idx < cashMethods.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ padding:'10px 14px 4px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <opt.icon size={13} style={{ color:T.t2 }}/>
                    <span style={{ fontSize:13, fontWeight:600 }}>{opt.l}</span>
                    {m === 'cartao_credito' && pd.cartao_credito.parcelas !== '1' && (
                      <span style={{ fontSize:11, background:T.accentL, color:T.accent, padding:'1px 7px', borderRadius:999, fontWeight:500 }}>
                        {pd.cartao_credito.parcelas}x
                      </span>
                    )}
                  </div>
                  {isAuto && <span style={{ fontSize:10, color:T.green, background:T.greenL, padding:'2px 8px', borderRadius:999, fontWeight:500 }}>automático</span>}
                </div>

                <div style={{ padding:'6px 14px 10px', display:'grid', gridTemplateColumns: m === 'cartao_credito' ? '1fr auto' : '1fr', gap:10, alignItems:'end' }}>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:T.t3 }}>R$</span>
                    <input
                      value={isAuto ? fmtNum(effVal) : pd[m].value}
                      onChange={e => isAuto ? null : setPd(m, 'value', formatCurrencyInput(e.target.value))}
                      readOnly={isAuto}
                      placeholder={cashMethods.length === 1 ? fmtNum(total) : '0,00'}
                      style={{ ...inp(), paddingLeft:28, fontWeight:600,
                        background: isAuto ? T.greenL : T.surface,
                        color: isAuto ? T.green : T.text }}/>
                  </div>
                  {m === 'cartao_credito' && (
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', maxWidth:230 }}>
                      {PARCELAS.map(n => {
                        const a = pd.cartao_credito.parcelas === String(n)
                        return (
                          <button key={n} onClick={() => setPd('cartao_credito','parcelas',String(n))}
                            style={{ width:36, height:28, borderRadius:6, border:`1px solid ${a ? T.text : T.border}`,
                              background:a ? T.text : 'transparent', color:a ? '#fff' : T.t2,
                              fontSize:12, fontWeight:a ? 600 : 400, cursor:'pointer', fontFamily:'Instrument Sans,sans-serif' }}>
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

          {/* Barra de balanço */}
          {total > 0 && (
            <div style={{ padding:'9px 14px', background: over ? T.redL : balanced ? T.greenL : T.amberL, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {balanced
                  ? <CheckCircle2 size={13} style={{ color:T.green }}/>
                  : <AlertCircle size={13} style={{ color: over ? T.red : T.amber }}/>}
                <span style={{ fontSize:12, fontWeight:500, color: over ? T.red : balanced ? T.green : T.amber }}>
                  {balanced ? 'Pagamento completo' : over ? `Excede R$ ${fmtNum(Math.abs(remainder))}` : `Faltam R$ ${fmtNum(remainder)}`}
                </span>
              </div>
              <span style={{ fontSize:12, color:T.t2 }}>
                <b style={{ color:T.text }}>R$ {fmtNum(allocated)}</b> de R$ {fmtNum(total)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Observações */}
      <div>
        {lbl('Observações')}
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          rows={3}
          placeholder={type === 'manutencao'
            ? 'Acordos, prazo de entrega, acessórios entregues...'
            : 'Condições do aparelho, defeitos, acordos...'}
          style={{ ...inp(), resize:'vertical' }}/>
      </div>

      {/* Resumo */}
      {form.price && (
        <div style={{ background:T.text, borderRadius:8, padding:'16px 18px', color:'#fff' }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, fontWeight:600 }}>Resumo</div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>
              {type === 'manutencao'
                ? (form.service_types?.slice(0,2).join(', ') || 'Manutenção') + (form.service_types?.length > 2 ? ` +${form.service_types.length - 2}` : '')
                : `${form.iphone_model || '—'} ${form.capacity || ''}`}
            </span>
            <span style={{ fontSize:16, fontWeight:700 }}>R$ {form.price}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Garantia: {form.warranty_months || 0} meses</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>
              {form.payment_methods.map(m => PAY_OPTS.find(p => p.v === m)?.l).join(' + ') || '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
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
    payment_methods:[], service_types:[], problem_description:'',
    device_condition:'',
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]:v })); setErrors(e => ({ ...e, [k]:'' })) }

  const isManut = form.type === 'manutencao'

  // Labels dinâmicos por tipo
  const stepLabels = [
    { n:1, l:'Cliente & Tipo' },
    { n:2, l: isManut ? 'Aparelho & Serviço' : 'Produto' },
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
      if (!form.payment_methods.length) e.payment_methods = 'Selecione ao menos uma forma'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }

  const handleSubmit = async () => {
    if (!validate()) return
    const priceNum = parseVal(form.price)

    // Monta notes consolidado
    const noteParts = []
    if (isManut && form.service_types?.length) {
      noteParts.push(`Serviços: ${form.service_types.join(', ')}`)
    }
    if (isManut && form.problem_description) {
      noteParts.push(`Problema: ${form.problem_description}`)
    }
    if (isManut && form.device_condition) {
      const condLabel = { otimo:'Ótimo', bom:'Bom', regular:'Regular', danificado:'Danificado' }
      noteParts.push(`Condição: ${condLabel[form.device_condition] || form.device_condition}`)
    }
    if (form.notes) noteParts.push(form.notes)

    await createOrder.mutateAsync({
      client_id:      form.client_id,
      type:           form.type,
      iphone_model:   form.iphone_model,
      capacity:       form.capacity || undefined,
      color:          form.color || undefined,
      imei:           form.imei || undefined,
      price:          priceNum,
      warranty_months: parseInt(form.warranty_months) || (isManut ? 3 : 12),
      payment_methods: form.payment_methods,
      notes:          noteParts.join('\n') || undefined,
    })
  }

  const shadow = T.shadow

  return (
    <div style={{ maxWidth:660, margin:'0 auto', display:'flex', flexDirection:'column', gap:16, fontFamily:'Instrument Sans,sans-serif' }}>

      {/* Stepper */}
      <div style={{ background:T.surface, borderRadius:12, boxShadow:shadow, padding:'16px 22px', display:'flex', alignItems:'center' }}>
        {stepLabels.map((s, i) => (
          <div key={s.n} style={{ display:'flex', alignItems:'center', flex: i < stepLabels.length - 1 ? 1 : 0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{
                width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700, transition:'all .2s',
                background: step > s.n ? T.green : step === s.n ? (isManut ? T.purple : T.text) : T.bg,
                color: step > s.n ? '#fff' : step === s.n ? '#fff' : T.t3,
              }}>
                {step > s.n ? <Check size={13}/> : s.n}
              </div>
              <span style={{ fontSize:13, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? T.text : T.t3 }}>
                {s.l}
              </span>
            </div>
            {i < stepLabels.length - 1 && <div style={{ flex:1, height:1, background:T.border, margin:'0 14px' }}/>}
          </div>
        ))}
      </div>

      {/* Tipo badge no topo quando manutenção */}
      {isManut && step > 1 && (
        <div style={{ background:T.purpleL, border:`1px solid #DDD6FE`, borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
          <Wrench size={13} style={{ color:T.purple }}/>
          <span style={{ fontSize:12, fontWeight:500, color:T.purple }}>Modo Manutenção — {form.iphone_model || 'aparelho não definido'}</span>
        </div>
      )}

      <div style={{ background:T.surface, borderRadius:12, boxShadow:shadow, padding:28 }}>

        {/* STEP 1 — Cliente & Tipo */}
        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Cliente e tipo de atendimento</div>

            <div>
              {lbl('Cliente', true)}
              <div style={{ position:'relative' }}>
                <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
                  style={{
                    width:'100%', padding:'9px 12px', paddingRight:32,
                    border:`1px solid ${errors.client_id ? T.red : T.borderS}`,
                    borderRadius:8, fontSize:13, color:form.client_id ? T.text : T.t3,
                    background:T.surface, fontFamily:'Instrument Sans,sans-serif',
                    outline:'none', appearance:'none', cursor:'pointer', boxSizing:'border-box',
                  }}>
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.cpf_formatted || formatCPF(c.cpf)}</option>)}
                </select>
                <ChevronRight size={12} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%) rotate(90deg)', color:T.t3, pointerEvents:'none' }}/>
              </div>
              {errTip(errors.client_id)}
            </div>

            <div>
              {lbl('Tipo de atendimento', true)}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { v:'venda',     l:'Venda',     icon:Smartphone, d:'iPhone novo ou usado', color:T.text   },
                  { v:'manutencao',l:'Manutenção', icon:Wrench,     d:'Reparo ou serviço técnico', color:T.purple },
                ].map(t => (
                  <button key={t.v} onClick={() => set('type', t.v)}
                    style={{
                      padding:'16px', borderRadius:10, cursor:'pointer', textAlign:'left',
                      border:`1.5px solid ${form.type === t.v ? t.color : T.border}`,
                      background: form.type === t.v ? t.color : T.surface,
                      transition:'all .15s', display:'flex', flexDirection:'column', gap:8,
                      fontFamily:'Instrument Sans,sans-serif',
                    }}>
                    <t.icon size={20} style={{ color: form.type === t.v ? '#fff' : T.t2 }}/>
                    <div style={{ fontSize:14, fontWeight:700, color: form.type === t.v ? '#fff' : T.text }}>{t.l}</div>
                    <div style={{ fontSize:11, color: form.type === t.v ? 'rgba(255,255,255,0.55)' : T.t3 }}>{t.d}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Produto ou Serviço */}
        {step === 2 && (
          isManut
            ? <StepServico form={form} set={set} errors={errors}/>
            : <StepProduto form={form} set={set} errors={errors}/>
        )}

        {/* STEP 3 — Pagamento */}
        {step === 3 && (
          <StepPagamento form={form} set={set} errors={errors} type={form.type}/>
        )}

        {/* Navegação */}
        <div style={{ display:'flex', gap:10, marginTop:28, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/orders')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', border:`1px solid ${T.borderS}`, borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:T.t2, fontFamily:'Instrument Sans,sans-serif' }}>
            <ArrowLeft size={14}/> {step > 1 ? 'Voltar' : 'Cancelar'}
          </button>
          <button onClick={step < 3 ? next : handleSubmit} disabled={createOrder.isPending}
            style={{ flex:1, padding:'10px 24px', background: isManut ? T.purple : T.text, color:'#fff', border:'none', borderRadius:8,
              cursor: createOrder.isPending ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              fontFamily:'Instrument Sans,sans-serif', opacity: createOrder.isPending ? 0.8 : 1 }}>
            {createOrder.isPending
              ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Registrando...</>
              : step < 3
                ? <>Próximo ({step}/3)<ChevronRight size={14}/></>
                : <><Send size={14}/> Registrar Atendimento</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders, useDownloadPDF } from '../hooks/useData'
import { useIsMobile } from '../hooks/useIsMobile'
import { useOrderStats } from '../hooks/useData'
import { displayCurrency, getInitials, getAvatarColor } from '../utils/formatters'
import {
  Search, Download, X, Shield, Loader2, ChevronRight,
  Smartphone, Wrench, Mail, Copy, User, Filter,
  TrendingUp, ClipboardList, Zap, CheckCheck, ChevronLeft,
  Package, Sparkles, ChevronDown,
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────
const C = {
  bg:         '#F5F5F7',
  surface:    '#FFFFFF',
  border:     'rgba(0,0,0,0.08)',
  text:       '#1D1D1F',
  t2:         '#6E6E73',
  t3:         '#AEAEB2',
  accent:     '#0A66FF',
  accentSoft: 'rgba(10,102,255,0.08)',
  green:      '#34C759',
  greenSoft:  'rgba(52,199,89,0.10)',
  amber:      '#FF9F0A',
  amberSoft:  'rgba(255,159,10,0.10)',
  violet:     '#AF52DE',
  violetSoft: 'rgba(175,82,222,0.10)',
  red:        '#FF3B30',
  redSoft:    'rgba(255,59,48,0.10)',
  shadow:     '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
  shadowMd:   '0 8px 32px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.08)',
}

const PAY = {
  pix: 'Pix', dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito', cartao_debito: 'Débito',
  iphone_entrada: 'iPhone entrada',
}

// Modelos iPhone mais comuns — usados no dropdown
const IPHONE_MODELS = [
  'iPhone 8', 'iPhone 8 Plus',
  'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
  'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
  'iPhone 12', 'iPhone 12 Mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
  'iPhone 13', 'iPhone 13 Mini', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
  'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
  'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
  'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
  'iPhone 16e',
]

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0)

const parsePayments = (raw) => {
  try { return Array.isArray(raw) ? raw : JSON.parse(raw || '[]') }
  catch { return [] }
}

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getAvatarColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

// ─── Type Pill ────────────────────────────────────────────────
function TypePill({ type }) {
  const isVenda = type === 'venda'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: isVenda ? C.accentSoft : C.violetSoft,
      color: isVenda ? C.accent : C.violet,
    }}>
      {isVenda ? <Smartphone size={10} /> : <Wrench size={10} />}
      {isVenda ? 'Venda' : 'Manutenção'}
    </span>
  )
}

// ─── Warranty badge ───────────────────────────────────────────
function WarrantyBadge({ createdAt, warrantyMonths }) {
  if (!warrantyMonths) return null
  const exp = new Date(createdAt)
  exp.setMonth(exp.getMonth() + warrantyMonths)
  const daysLeft = Math.round((exp - Date.now()) / 86400000)
  if (daysLeft < 0) return null
  const urgent = daysLeft <= 30
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
      background: urgent ? C.amberSoft : C.greenSoft,
      color: urgent ? C.amber : C.green,
    }}>
      <Shield size={9} />
      {daysLeft === 0 ? 'Vence hoje' : `${daysLeft}d`}
    </span>
  )
}

// ─── Segmented control ────────────────────────────────────────
function Segments({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'rgba(0,0,0,0.06)',
      borderRadius: 10, padding: 3, gap: 2,
    }}>
      {options.map((o) => {
        const active = value === o.v
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: active ? 600 : 400,
            background: active ? C.surface : 'transparent',
            color: active ? C.text : C.t2,
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all .15s', fontFamily: 'Instrument Sans, sans-serif',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {o.icon && <o.icon size={12} />}
            {o.l}
            {o.count !== undefined && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10,
                background: active ? C.accent : 'rgba(0,0,0,0.08)',
                color: active ? '#fff' : C.t2,
              }}>{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Condition Pill Selector ──────────────────────────────────
function ConditionFilter({ value, onChange }) {
  const opts = [
    { v: '',         label: 'Todos',    icon: null },
    { v: 'lacrado',  label: 'Lacrado',  icon: '📦' },
    { v: 'seminovo', label: 'Seminovo', icon: '✨' },
  ]
  return (
    <div style={{
      display: 'inline-flex', background: 'rgba(0,0,0,0.06)',
      borderRadius: 10, padding: 3, gap: 2,
    }}>
      {opts.map((o) => {
        const active = value === o.v
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: active ? 600 : 400,
            background: active ? C.surface : 'transparent',
            color: active
              ? o.v === 'lacrado' ? C.accent : o.v === 'seminovo' ? C.violet : C.text
              : C.t2,
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all .15s', fontFamily: 'Instrument Sans, sans-serif',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {o.icon && <span style={{ fontSize: 12 }}>{o.icon}</span>}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Model Dropdown ───────────────────────────────────────────
function ModelFilter({ value, onChange }) {
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState(value || '')
  const ref               = useRef(null)

  // Sync input com value externo (limpar filtros)
  useEffect(() => { setInput(value || '') }, [value])

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = input.trim()
    ? IPHONE_MODELS.filter(m => m.toLowerCase().includes(input.toLowerCase()))
    : IPHONE_MODELS

  const select = (model) => {
    setInput(model)
    onChange(model)
    setOpen(false)
  }

  const clear = () => {
    setInput('')
    onChange('')
    setOpen(false)
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    onChange(e.target.value)   // filtro em tempo real
    setOpen(true)
  }

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 200 }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: C.surface,
        border: `1.5px solid ${open || value ? C.accent : C.border}`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: C.shadow,
        transition: 'border-color .15s',
      }}>
        <Smartphone size={13} style={{
          position: 'absolute', left: 11, color: value ? C.accent : C.t3,
          pointerEvents: 'none', flexShrink: 0,
        }} />
        <input
          value={input}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Modelo"
          style={{
            flex: 1, padding: '9px 32px 9px 32px',
            border: 'none', outline: 'none', fontSize: 13,
            fontFamily: 'Instrument Sans, sans-serif',
            color: C.text, background: 'transparent',
            cursor: 'text',
          }}
        />
        {value ? (
          <button onClick={clear} style={{
            padding: '0 10px 0 4px', background: 'none',
            border: 'none', cursor: 'pointer', color: C.t3,
            display: 'flex', alignItems: 'center',
          }}>
            <X size={13} />
          </button>
        ) : (
          <ChevronDown size={13} style={{
            marginRight: 10, color: C.t3, pointerEvents: 'none', flexShrink: 0,
          }} />
        )}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          boxShadow: C.shadowMd,
          zIndex: 200,
          maxHeight: 220, overflowY: 'auto',
          animation: 'fadeDown .15s ease',
        }}>
          {filtered.map((m) => (
            <button key={m} onClick={() => select(m)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 14px', border: 'none',
              background: m === value ? C.accentSoft : 'transparent',
              color: m === value ? C.accent : C.text,
              fontSize: 13, fontWeight: m === value ? 600 : 400,
              cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif',
              transition: 'background .1s',
            }}
            onMouseEnter={e => { if (m !== value) e.currentTarget.style.background = C.bg }}
            onMouseLeave={e => { if (m !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Active Filters Bar ───────────────────────────────────────
function ActiveFilters({ model, condition, onClearModel, onClearCondition, onClearAll }) {
  const active = [
    model     && { key: 'model',     label: `Modelo: ${model}`,       onClear: onClearModel },
    condition && { key: 'condition', label: condition === 'lacrado' ? '📦 Lacrado' : '✨ Seminovo', onClear: onClearCondition },
  ].filter(Boolean)

  if (!active.length) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      animation: 'fadeUp .2s ease',
    }}>
      <span style={{ fontSize: 11, color: C.t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Filtros ativos:
      </span>
      {active.map(f => (
        <span key={f.key} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: C.accentSoft, color: C.accent,
          padding: '4px 10px 4px 12px', borderRadius: 20,
          fontSize: 12, fontWeight: 600,
        }}>
          {f.label}
          <button onClick={f.onClear} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.accent, display: 'flex', alignItems: 'center', padding: 0,
          }}>
            <X size={11} />
          </button>
        </span>
      ))}
      <button onClick={onClearAll} style={{
        fontSize: 11, color: C.t2, background: 'none', border: 'none',
        cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Instrument Sans, sans-serif',
        padding: 0,
      }}>
        Limpar tudo
      </button>
    </div>
  )
}

// ─── Metric card ─────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color, colorSoft, delay }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 18, boxShadow: C.shadow,
      padding: '18px 20px',
      animation: 'fadeUp .3s ease forwards', animationDelay: `${delay}ms`, opacity: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1, color: C.text }}>{value}</div>
      <div style={{ fontSize: 13, color: C.t2, marginTop: 5, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ─── Order Card ───────────────────────────────────────────────
function OrderCard({ order, onClick, onPDF, pdfLoading }) {
  const [hovered, setHovered] = useState(false)
  const payments = parsePayments(order.payment_methods)

  return (
    <div
      onClick={() => onClick(order)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface,
        borderRadius: 16,
        boxShadow: hovered ? C.shadowMd : C.shadow,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'box-shadow .2s, transform .15s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
        animation: 'fadeUp .25s ease forwards', opacity: 0,
      }}
    >
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Avatar name={order.client_name} size={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.client_name}
            </div>
            <div style={{ fontSize: 11, color: C.t2, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
              {order.order_number?.slice(-12)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <WarrantyBadge createdAt={order.created_at} warrantyMonths={order.warranty_months} />
          {order.condition_sale && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: order.condition_sale === 'lacrado' ? 'rgba(10,102,255,0.06)' : 'rgba(175,82,222,0.08)', color: order.condition_sale === 'lacrado' ? '#0A66FF' : '#AF52DE' }}>
              {order.condition_sale === 'lacrado' ? '📦 Lacrado' : '✨ Seminovo'}
            </span>
          )}
          <TypePill type={order.type} />
        </div>
      </div>

      {/* product */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>{order.iphone_model}</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>
            {[order.capacity, order.color].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: C.text }}>{brl(order.price)}</div>
          {payments.length > 0 && (
            <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>
              {payments.map(p => PAY[p] || p).join(' + ')}
            </div>
          )}
        </div>
      </div>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.t3 }}>
          {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPDF(order.id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: hovered ? C.accentSoft : 'transparent',
              color: hovered ? C.accent : C.t3,
              border: 'none', borderRadius: 8, padding: '5px 10px',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              transition: 'all .15s', fontFamily: 'Instrument Sans, sans-serif',
            }}
          >
            {pdfLoading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
            PDF
          </button>
          <ChevronRight size={14} style={{ color: C.t3 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────
function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(String(value || '')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button onClick={copy} style={{
      background: copied ? C.greenSoft : 'rgba(0,0,0,0.05)',
      border: 'none', borderRadius: 6, padding: '4px 7px',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
      color: copied ? C.green : C.t2, transition: 'all .2s',
      fontFamily: 'Instrument Sans, sans-serif', fontSize: 11, fontWeight: 600,
    }}>
      {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

// ─── Order Detail Modal ───────────────────────────────────────
function OrderDetail({ order, onClose }) {
  const navigate    = useNavigate()
  const downloadPDF = useDownloadPDF()
  const payments    = parsePayments(order.payment_methods)

  const exp = new Date(order.created_at)
  exp.setMonth(exp.getMonth() + (order.warranty_months || 0))
  const daysLeft = Math.round((exp - Date.now()) / 86400000)

  const goToClient = () => {
    onClose()
    navigate(`/clients/${order.client_id}`)
  }

  return (
    <>
      <div style={{
        padding: '16px 20px 14px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: C.surface, zIndex: 1,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Detalhes do Atendimento</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
            {order.order_number}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TypePill type={order.type} />
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', width: 28, height: 28,
            borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: C.t2,
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* client card */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={order.client_name} size={42} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{order.client_name}</div>
              {order.client_phone && (
                <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{order.client_phone}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {order.client_phone && <CopyBtn value={order.client_phone} />}
            <button onClick={goToClient} style={{
              background: C.accentSoft, border: 'none', borderRadius: 8, padding: '5px 10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              color: C.accent, fontFamily: 'Instrument Sans, sans-serif', fontSize: 11, fontWeight: 600,
            }}>
              <User size={11} /> Ver perfil
            </button>
          </div>
        </div>

        {/* warranty banner */}
        {order.warranty_months > 0 && (
          <div style={{
            background: daysLeft <= 0 ? C.redSoft : daysLeft <= 30 ? C.amberSoft : '#1D1D1F',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Shield size={12} style={{ color: daysLeft <= 0 ? C.red : daysLeft <= 30 ? C.amber : 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: daysLeft <= 0 ? C.red : daysLeft <= 30 ? C.amber : 'rgba(255,255,255,0.4)' }}>
                  Garantia
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: daysLeft > 30 ? '#fff' : C.text }}>
                {order.warranty_months} {order.warranty_months === 1 ? 'mês' : 'meses'}
              </div>
              <div style={{ fontSize: 12, marginTop: 3, color: daysLeft <= 0 ? C.red : daysLeft <= 30 ? C.amber : 'rgba(255,255,255,0.45)' }}>
                {daysLeft <= 0 ? 'Garantia expirada' : `Válida até ${exp.toLocaleDateString('pt-BR')} · ${daysLeft} dias restantes`}
              </div>
            </div>
            <Shield size={30} style={{ color: daysLeft > 30 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', flexShrink: 0 }} />
          </div>
        )}

        {/* details grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Modelo',      value: order.iphone_model, mono: false },
            order.condition_sale ? { label: 'Condição', value: order.condition_sale === 'lacrado' ? '📦 Lacrado' : '✨ Seminovo', mono: false } : null,
            { label: 'Capacidade',  value: order.capacity || '—', mono: false },
            { label: 'Cor',         value: order.color || '—', mono: false },
            { label: 'IMEI',        value: order.imei || '—', mono: true,  copy: order.imei },
            { label: 'Valor',       value: brl(order.price), mono: false },
            { label: 'Pagamento',   value: parsePayments(order.payment_methods).map(p => PAY[p] || p).join(' + ') || '—', mono: false },
            { label: 'Data',        value: new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), mono: false },
            order.notes ? { label: 'Observações', value: order.notes, mono: false } : null,
          ].filter(Boolean).map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
              gap: 12,
            }}>
              <span style={{ fontSize: 12, color: C.t2, flexShrink: 0 }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: row.mono ? 12 : 13, fontWeight: 500,
                  fontFamily: row.mono ? 'JetBrains Mono, monospace' : 'Instrument Sans, sans-serif',
                  textAlign: 'right',
                }}>
                  {row.value}
                </span>
                {row.copy && <CopyBtn value={row.copy} />}
              </div>
            </div>
          ))}
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            onClick={() => downloadPDF.mutate(order.id)}
            disabled={downloadPDF.isPending}
            style={{
              flex: 1, padding: '11px 0', background: C.text, color: '#fff',
              border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'Instrument Sans, sans-serif', transition: 'opacity .15s',
              opacity: downloadPDF.isPending ? 0.6 : 1,
            }}
          >
            {downloadPDF.isPending
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Download size={14} />}
            Baixar Garantia
          </button>
          {order.client_email && (
            <button onClick={() => {}} style={{
              flex: 1, padding: '11px 0', background: C.accentSoft, color: C.accent,
              border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'Instrument Sans, sans-serif',
            }}>
              <Mail size={14} />
              Reenviar e-mail
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Pagination ───────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1
    if (page <= 4) return i + 1
    if (page >= totalPages - 3) return totalPages - 6 + i
    return page - 3 + i
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
      <button
        onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? C.t3 : C.t2 }}
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: p === page ? 700 : 400,
          background: p === page ? C.text : C.surface,
          color: p === page ? '#fff' : C.t2,
          boxShadow: p === page ? 'none' : `0 0 0 1px ${C.border}`,
          fontFamily: 'Instrument Sans, sans-serif',
        }}>{p}</button>
      ))}
      <button
        onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, cursor: page === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? C.t3 : C.t2 }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function OrdersPage() {
  const [search,    setSearch]    = useState('')
  const [typeTab,   setTypeTab]   = useState('')
  const [condition, setCondition] = useState('')   // '' | 'lacrado' | 'seminovo'
  const [model,     setModel]     = useState('')   // texto livre / modelo selecionado
  const [period,    setPeriod]    = useState('30')
  const [page,      setPage]      = useState(1)
  const [selected,  setSelected]  = useState(null)

  const isMobile = useIsMobile()

  // Reset page em qualquer mudança de filtro
  const resetPage = useCallback(() => setPage(1), [])
  const handleSearch    = useCallback((v) => { setSearch(v);    resetPage() }, [resetPage])
  const handleType      = useCallback((v) => { setTypeTab(v);   resetPage() }, [resetPage])
  const handleCondition = useCallback((v) => { setCondition(v); resetPage() }, [resetPage])
  const handleModel     = useCallback((v) => { setModel(v);     resetPage() }, [resetPage])

  const clearAll = () => {
    setSearch(''); setTypeTab(''); setCondition(''); setModel(''); setPage(1)
  }

  const limit = 12
  const { data, isLoading } = useOrders({
    search,
    type: typeTab,
    condition_sale: condition,
    model,
    page,
    limit,
  })
  const orders     = data?.data || []
  const meta       = data?.meta || {}
  const totalPages = Math.ceil((meta.total || 0) / limit)

  const { data: stats } = useOrderStats(period)
  const s = stats?.summary || {}

  const downloadPDF = useDownloadPDF()

  const periodOpts = [
    { v: '7',  l: '7d'  },
    { v: '30', l: '30d' },
    { v: '90', l: '90d' },
  ]

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Instrument Sans, sans-serif', color: C.text }}>

        {/* ── Metric cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
          <MetricCard icon={ClipboardList} label="Total de ordens" value={meta.total || 0}
            sub={`últimos ${period} dias`} color={C.accent} colorSoft={C.accentSoft} delay={0} />
          <MetricCard icon={TrendingUp} label="Receita" value={brl(s.total_revenue)}
            sub="no período" color={C.green} colorSoft={C.greenSoft} delay={60} />
          <MetricCard icon={Zap} label="Ticket médio" value={brl(s.avg_sale_price)}
            sub="por atendimento" color={C.amber} colorSoft={C.amberSoft} delay={120} />
          <MetricCard icon={Smartphone} label="Vendas" value={s.total_sales || 0}
            sub={`${s.total_maintenance || 0} manutenções`} color={C.violet} colorSoft={C.violetSoft} delay={180} />
        </div>

        {/* ── Toolbar ── */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          animation: 'fadeUp .3s ease forwards', animationDelay: '200ms', opacity: 0,
        }}>
          {/* Busca textual */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.t3, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar cliente, número, IMEI..."
              style={{
                width: '100%', padding: '9px 14px 9px 34px', boxSizing: 'border-box',
                border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 13,
                color: C.text, background: C.surface, outline: 'none',
                fontFamily: 'Instrument Sans, sans-serif', boxShadow: C.shadow,
              }}
            />
            {search && (
              <button onClick={() => handleSearch('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: C.t3,
                display: 'flex', alignItems: 'center', padding: 0,
              }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Dropdown modelo */}
          <ModelFilter value={model} onChange={handleModel} />

          {/* Período */}
          <Segments value={period} onChange={setPeriod} options={periodOpts} />
        </div>

        {/* ── Segunda linha: tipo + condição ── */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          animation: 'fadeUp .3s ease forwards', animationDelay: '240ms', opacity: 0,
        }}>
          <Segments
            value={typeTab} onChange={handleType}
            options={[
              { v: '',           l: 'Todos',       count: meta.total || 0 },
              { v: 'venda',      l: 'Vendas',      icon: Smartphone },
              { v: 'manutencao', l: 'Manutenções', icon: Wrench },
            ]}
          />

          {/* Separador visual */}
          <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

          {/* Condição */}
          <ConditionFilter value={condition} onChange={handleCondition} />
        </div>

        {/* ── Filtros ativos ── */}
        <ActiveFilters
          model={model}
          condition={condition}
          onClearModel={() => handleModel('')}
          onClearCondition={() => handleCondition('')}
          onClearAll={clearAll}
        />

        {/* ── Grid de cards ── */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: C.t2, gap: 10 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Carregando atendimentos…</span>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '60px 24px', textAlign: 'center' }}>
            <ClipboardList size={36} style={{ color: C.t3, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: C.t2 }}>Nenhum atendimento encontrado</div>
            <div style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>Tente ajustar a busca ou os filtros</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: isMobile ? 10 : 14,
          }}>
            {orders.map((o, i) => (
              <div key={o.id} style={{ animationDelay: `${i * 30}ms` }}>
                <OrderCard
                  order={o}
                  onClick={setSelected}
                  onPDF={(id) => downloadPDF.mutate(id)}
                  pdfLoading={downloadPDF.isPending}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Paginação ── */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      </div>

      {/* ── Modal ── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.surface, borderRadius: 20, width: 560,
              maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 32px 80px rgba(0,0,0,0.24)',
              animation: 'modalIn .2s ease',
            }}
          >
            <OrderDetail order={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}

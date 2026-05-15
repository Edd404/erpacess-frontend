import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders, useDownloadPDF, useOrderStats } from '../hooks/useData'
import { useIsMobile } from '../hooks/useIsMobile'
import { displayCurrency, getInitials, getAvatarColor } from '../utils/formatters'
import {
  Search, Download, X, Shield, Loader2, ChevronRight,
  Smartphone, Wrench, Mail, Copy, User, Pencil,
  TrendingUp, ClipboardList, Zap, CheckCheck, ChevronLeft,
  ChevronDown,
} from 'lucide-react'
import EditOrderModal from '../components/EditOrderModal'

// ─── Tokens ───────────────────────────────────────────────────
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

// ─── TypePill ─────────────────────────────────────────────────
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

// ─── WarrantyBadge ────────────────────────────────────────────
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
      borderRadius: 10, padding: 3, gap: 2, flexShrink: 0,
    }}>
      {options.map((o) => {
        const active = value === o.v
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: active ? 600 : 400,
            background: active ? C.surface : 'transparent',
            color: active ? C.text : C.t2,
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all .15s', fontFamily: 'Instrument Sans, sans-serif',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {o.icon && <o.icon size={12} />}
            {o.l}
          </button>
        )
      })}
    </div>
  )
}

// ─── Model Select (nativo estilizado) ─────────────────────────
// ─── Bottom Sheet genérico ───────────────────────────────────
function BottomSheet({ title, options, selected, onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'bsFadeIn .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface,
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 540,
          padding: '0 0 calc(env(safe-area-inset-bottom, 0px) + 16px)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          animation: 'bsSlideUp .25s cubic-bezier(.32,1,.46,1)',
          fontFamily: 'Instrument Sans, sans-serif',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Handle + título */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {title}
          </div>
        </div>

        {/* Lista scrollável */}
        <div style={{ overflowY: 'auto', padding: '0 12px 8px' }}>
          {options.map((o, i) => {
            const isSelected = selected === o.value
            return (
              <button
                key={o.value}
                onClick={() => { onSelect(o.value); onClose() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: isSelected ? C.accentSoft : 'transparent',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: 'Instrument Sans, sans-serif',
                  marginBottom: 2,
                  transition: 'background .12s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.bg }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {o.icon && <span style={{ fontSize: 20 }}>{o.icon}</span>}
                  <span style={{
                    fontSize: 16, fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? C.accent : C.text,
                  }}>{o.label}</span>
                </div>
                {/* Checkmark */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${isSelected ? C.accent : 'rgba(0,0,0,0.18)'}`,
                  background: isSelected ? C.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all .15s',
                }}>
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Model Select (bottom sheet) ─────────────────────────────
function ModelSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const hasValue = !!value

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          flex: 1, minWidth: 160, maxWidth: 260,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: hasValue ? C.accentSoft : C.surface,
          border: `1.5px solid ${hasValue ? C.accent : C.border}`,
          borderRadius: 12, cursor: 'pointer',
          boxShadow: C.shadow, transition: 'all .15s',
          fontFamily: 'Instrument Sans, sans-serif',
        }}
      >
        <Smartphone size={13} style={{ color: hasValue ? C.accent : C.t3, flexShrink: 0 }} />
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 13,
          color: hasValue ? C.text : C.t3,
          fontWeight: hasValue ? 600 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value || 'Todos os modelos'}
        </span>
        {hasValue
          ? <span onClick={e => { e.stopPropagation(); onChange('') }} style={{ color: C.t3, display: 'flex', padding: 2, borderRadius: 4, cursor: 'pointer' }}><X size={12} /></span>
          : <ChevronDown size={13} style={{ color: C.t3, flexShrink: 0 }} />
        }
      </button>

      {open && (
        <BottomSheet
          title="Modelo"
          selected={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
          options={[
            { value: '', label: 'Todos os modelos' },
            ...IPHONE_MODELS.map(m => ({ value: m, label: m })),
          ]}
        />
      )}
    </>
  )
}

// ─── Condition Select (bottom sheet) ─────────────────────────
function ConditionSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)

  const label = value === 'lacrado' ? '📦  Lacrado'
              : value === 'seminovo' ? '✨  Seminovo'
              : 'Qualquer condição'

  const color = value === 'lacrado' ? C.accent : value === 'seminovo' ? C.violet : C.t3
  const bg    = value === 'lacrado' ? C.accentSoft : value === 'seminovo' ? C.violetSoft : C.surface
  const border = value ? color : C.border

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          flex: 1, minWidth: 160, maxWidth: 220,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: bg, border: `1.5px solid ${border}`,
          borderRadius: 12, cursor: 'pointer',
          boxShadow: C.shadow, transition: 'all .15s',
          fontFamily: 'Instrument Sans, sans-serif',
        }}
      >
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 13,
          color: value ? color : C.t3,
          fontWeight: value ? 600 : 400,
        }}>
          {label}
        </span>
        <ChevronDown size={13} style={{ color, flexShrink: 0 }} />
      </button>

      {open && (
        <BottomSheet
          title="Condição"
          selected={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
          options={[
            { value: '',         label: 'Qualquer condição' },
            { value: 'lacrado',  label: 'Lacrado',  icon: '📦' },
            { value: 'seminovo', label: 'Seminovo', icon: '✨' },
          ]}
        />
      )}
    </>
  )
}

// ─── Active filter chips ──────────────────────────────────────
function ActiveFilters({ model, condition, type, onClear }) {
  const chips = [
    model     && { key: 'model',     label: model,     color: C.accent,  bg: C.accentSoft },
    condition && { key: 'condition', label: condition === 'lacrado' ? '📦 Lacrado' : '✨ Seminovo', color: condition === 'lacrado' ? C.accent : C.violet, bg: condition === 'lacrado' ? C.accentSoft : C.violetSoft },
    type      && { key: 'type',      label: type === 'venda' ? 'Vendas' : 'Manutenções', color: C.accent, bg: C.accentSoft },
  ].filter(Boolean)

  if (!chips.length) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', animation: 'fadeUp .2s ease' }}>
      <span style={{ fontSize: 11, color: C.t3, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Filtros:
      </span>
      {chips.map(chip => (
        <span key={chip.key} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px 4px 12px', borderRadius: 20,
          background: chip.bg, color: chip.color, fontSize: 12, fontWeight: 600,
        }}>
          {chip.label}
          <button onClick={() => onClear(chip.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: chip.color, display: 'flex', alignItems: 'center', padding: 0,
          }}>
            <X size={10} />
          </button>
        </span>
      ))}
      <button onClick={() => onClear('all')} style={{
        fontSize: 11, color: C.t2, background: 'none', border: 'none',
        cursor: 'pointer', textDecoration: 'underline',
        fontFamily: 'Instrument Sans, sans-serif', padding: 0,
      }}>
        Limpar tudo
      </button>
    </div>
  )
}

// ─── Metric card ──────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color, colorSoft, delay }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 18, boxShadow: C.shadow,
      padding: '18px 20px',
      animation: 'fadeUp .3s ease forwards', animationDelay: `${delay}ms`, opacity: 0,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={17} style={{ color }} />
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
        background: C.surface, borderRadius: 16,
        boxShadow: hovered ? C.shadowMd : C.shadow,
        padding: '16px 18px', cursor: 'pointer',
        transition: 'box-shadow .2s, transform .15s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
        animation: 'fadeUp .25s ease forwards', opacity: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0, maxWidth: '44%' }}>
          <WarrantyBadge createdAt={order.created_at} warrantyMonths={order.warranty_months} />
          {order.condition_sale && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: order.condition_sale === 'lacrado' ? C.accentSoft : C.violetSoft,
              color: order.condition_sale === 'lacrado' ? C.accent : C.violet,
            }}>
              {order.condition_sale === 'lacrado' ? '📦 Lacrado' : '✨ Seminovo'}
            </span>
          )}
          <TypePill type={order.type} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.iphone_model}</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[order.capacity, order.color].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>{brl(order.price)}</div>
          {payments.length > 0 && (
            <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>
              {payments.map(p => PAY[p] || p).join(' + ')}
            </div>
          )}
        </div>
      </div>

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
      setCopied(true); setTimeout(() => setCopied(false), 1500)
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
  const [editOpen, setEditOpen] = useState(false)
  const payments    = parsePayments(order.payment_methods)
  const exp = new Date(order.created_at)
  exp.setMonth(exp.getMonth() + (order.warranty_months || 0))
  const daysLeft = Math.round((exp - Date.now()) / 86400000)

  return (
    <>
      <div style={{
        padding: '16px 20px 14px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: C.surface, zIndex: 1,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Detalhes do Atendimento</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 2, fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.order_number}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 10 }}>
          <TypePill type={order.type} />
          <button onClick={() => setEditOpen(true)} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
            height: 28, padding: '0 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: C.t2, fontFamily: 'Instrument Sans, sans-serif', fontSize: 12, fontWeight: 600,
          }}>
            <Pencil size={11} /> Editar
          </button>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', width: 28, height: 28,
            borderRadius: '50%', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: C.t2,
          }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '12px 14px', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <Avatar name={order.client_name} size={42} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', lineHeight: 1.3,
              }}>{order.client_name}</div>
              {order.client_phone && <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{order.client_phone}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {order.client_phone && <CopyBtn value={order.client_phone} />}
            <button onClick={() => { onClose(); navigate(`/clients/${order.client_id}`) }} style={{
              background: C.accentSoft, border: 'none', borderRadius: 8, padding: '5px 10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              color: C.accent, fontFamily: 'Instrument Sans, sans-serif', fontSize: 11, fontWeight: 600,
            }}>
              <User size={11} /> Ver perfil
            </button>
          </div>
        </div>

        {order.warranty_months > 0 && (
          <div style={{
            background: daysLeft <= 0 ? C.redSoft : daysLeft <= 30 ? C.amberSoft : '#1D1D1F',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Shield size={12} style={{ color: daysLeft > 30 ? 'rgba(255,255,255,0.4)' : daysLeft <= 0 ? C.red : C.amber }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: daysLeft > 30 ? 'rgba(255,255,255,0.4)' : daysLeft <= 0 ? C.red : C.amber }}>Garantia</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: daysLeft > 30 ? '#fff' : C.text }}>
                {order.warranty_months} {order.warranty_months === 1 ? 'mês' : 'meses'}
              </div>
              <div style={{ fontSize: 12, marginTop: 3, color: daysLeft > 30 ? 'rgba(255,255,255,0.45)' : daysLeft <= 0 ? C.red : C.amber }}>
                {daysLeft <= 0 ? 'Garantia expirada' : `Válida até ${exp.toLocaleDateString('pt-BR')} · ${daysLeft} dias restantes`}
              </div>
            </div>
            <Shield size={30} style={{ color: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
          </div>
        )}

        <div>
          {[
            { label: 'Modelo',     value: order.iphone_model },
            order.condition_sale ? { label: 'Condição', value: order.condition_sale === 'lacrado' ? '📦 Lacrado' : '✨ Seminovo' } : null,
            { label: 'Capacidade', value: order.capacity || '—' },
            { label: 'Cor',        value: order.color || '—' },
            { label: 'IMEI',       value: order.imei || '—', mono: true, copy: order.imei },
            { label: 'Valor',      value: brl(order.price) },
            { label: 'Pagamento',  value: payments.map(p => PAY[p] || p).join(' + ') || '—' },
            { label: 'Data',       value: new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
            order.notes ? { label: 'Obs.', value: order.notes } : null,
          ].filter(Boolean).map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', gap: 12,
            }}>
              <span style={{ fontSize: 12, color: C.t2, flexShrink: 0 }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: row.mono ? 12 : 13, fontWeight: 500, textAlign: 'right',
                  fontFamily: row.mono ? 'JetBrains Mono, monospace' : 'Instrument Sans, sans-serif',
                }}>{row.value}</span>
                {row.copy && <CopyBtn value={row.copy} />}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            onClick={() => downloadPDF.mutate(order.id)}
            disabled={downloadPDF.isPending}
            style={{
              flex: 1, padding: '11px 0', background: C.text, color: '#fff',
              border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'Instrument Sans, sans-serif', opacity: downloadPDF.isPending ? 0.6 : 1,
            }}
          >
            {downloadPDF.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
            Baixar Garantia
          </button>
          {order.client_email && (
            <button style={{
              flex: 1, padding: '11px 0', background: C.accentSoft, color: C.accent,
              border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'Instrument Sans, sans-serif',
            }}>
              <Mail size={14} /> Reenviar e-mail
            </button>
          )}
        </div>
      </div>

      {editOpen && (
        <EditOrderModal order={order} onClose={() => setEditOpen(false)} />
      )}
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
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? C.t3 : C.t2 }}>
        <ChevronLeft size={14} />
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400, background: p === page ? C.text : C.surface, color: p === page ? '#fff' : C.t2, boxShadow: p === page ? 'none' : `0 0 0 1px ${C.border}`, fontFamily: 'Instrument Sans, sans-serif' }}>{p}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.surface, cursor: page === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? C.t3 : C.t2 }}>
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function OrdersPage() {
  const [search,    setSearch]    = useState('')
  const [typeTab,   setTypeTab]   = useState('')
  const [condition, setCondition] = useState('')
  const [model,     setModel]     = useState('')
  const [period,    setPeriod]    = useState('30')
  const [page,      setPage]      = useState(1)
  const [selectedId,  setSelectedId]  = useState(null)

  const isMobile = useIsMobile()

  const reset = useCallback(() => setPage(1), [])
  const handleSearch    = useCallback((v) => { setSearch(v);    reset() }, [reset])
  const handleType      = useCallback((v) => { setTypeTab(v);   reset() }, [reset])
  const handleCondition = useCallback((v) => { setCondition(v); reset() }, [reset])
  const handleModel     = useCallback((v) => { setModel(v);     reset() }, [reset])

  const clearFilter = (key) => {
    if      (key === 'all')       { setSearch(''); setTypeTab(''); setCondition(''); setModel('') }
    else if (key === 'model')     handleModel('')
    else if (key === 'condition') handleCondition('')
    else if (key === 'type')      handleType('')
    setPage(1)
  }

  const limit = 12
  const { data, isLoading } = useOrders({ search, type: typeTab, condition_sale: condition, model, page, limit })
  const orders     = data?.data || []
  const meta       = data?.meta || {}
  const totalPages = Math.ceil((meta.total || 0) / limit)
  const selectedOrder = selectedId ? (orders.find(o => o.id === selectedId) ?? null) : null

  const { data: stats } = useOrderStats(period)
  const s = stats?.summary || {}
  const downloadPDF = useDownloadPDF()

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Instrument Sans, sans-serif', color: C.text }}>

        {/* ── Métricas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
          <MetricCard icon={ClipboardList} label="Total de ordens"  value={meta.total || 0}     sub={`últimos ${period} dias`}          color={C.accent}  colorSoft={C.accentSoft}  delay={0} />
          <MetricCard icon={TrendingUp}    label="Receita"          value={brl(s.total_revenue)} sub="no período"                        color={C.green}   colorSoft={C.greenSoft}   delay={60} />
          <MetricCard icon={Zap}           label="Ticket médio"     value={brl(s.avg_sale_price)} sub="por atendimento"                  color={C.amber}   colorSoft={C.amberSoft}   delay={120} />
          <MetricCard icon={Smartphone}    label="Vendas"           value={s.total_sales || 0}  sub={`${s.total_maintenance || 0} manutenções`} color={C.violet} colorSoft={C.violetSoft} delay={180} />
        </div>

        {/* ════════════════════════════════════════
            FILTROS — 3 linhas organizadas
        ════════════════════════════════════════ */}

        {/* Linha 1 — Busca textual (full width) */}
        <div style={{ position: 'relative', animation: 'fadeUp .3s ease forwards', animationDelay: '200ms', opacity: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.t3, pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por cliente, número OS, IMEI..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 36px 10px 38px',
              border: `1.5px solid ${search ? C.accent : C.border}`,
              borderRadius: 12, fontSize: 14,
              color: C.text, background: C.surface, outline: 'none',
              fontFamily: 'Instrument Sans, sans-serif', boxShadow: C.shadow,
              transition: 'border-color .15s',
            }}
          />
          {search && (
            <button onClick={() => handleSearch('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: C.t3, display: 'flex', padding: 0,
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Linha 2 — Modelo + Condição (dois selects lado a lado) */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap',
          animation: 'fadeUp .3s ease forwards', animationDelay: '240ms', opacity: 0,
        }}>
          <ModelSelect     value={model}     onChange={handleModel} />
          <ConditionSelect value={condition} onChange={handleCondition} />
        </div>

        {/* Linha 3 — Tipo + Período */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          animation: 'fadeUp .3s ease forwards', animationDelay: '280ms', opacity: 0,
        }}>
          <Segments
            value={typeTab} onChange={handleType}
            options={[
              { v: '',           l: 'Todos' },
              { v: 'venda',      l: 'Vendas',      icon: Smartphone },
              { v: 'manutencao', l: 'Manutenções', icon: Wrench },
            ]}
          />
          <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />
          <Segments
            value={period} onChange={setPeriod}
            options={[{ v: '7', l: '7d' }, { v: '30', l: '30d' }, { v: '90', l: '90d' }]}
          />
        </div>

        {/* Chips de filtros ativos */}
        <ActiveFilters model={model} condition={condition} type={typeTab} onClear={clearFilter} />

        {/* ── Grid ── */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: C.t2, gap: 10 }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14 }}>Carregando atendimentos…</span>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '60px 24px', textAlign: 'center' }}>
            <ClipboardList size={36} style={{ color: C.t3, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: C.t2 }}>Nenhum atendimento encontrado</div>
            <div style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>Tente ajustar os filtros</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: isMobile ? 10 : 14 }}>
            {orders.map((o, i) => (
              <div key={o.id} style={{ animationDelay: `${i * 30}ms` }}>
                <OrderCard order={o} onClick={() => setSelectedId(o.id)} onPDF={(id) => downloadPDF.mutate(id)} pdfLoading={downloadPDF.isPending} />
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {selectedOrder && (
        <div onClick={() => setSelectedId(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(6px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: C.surface, borderRadius: 20,
            width: 560, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.24)',
            animation: 'modalIn .2s ease',
          }}>
            <OrderDetail order={selectedOrder} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bsFadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes bsSlideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes modalIn { from { opacity:0; transform:scale(.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>
    </>
  )
}

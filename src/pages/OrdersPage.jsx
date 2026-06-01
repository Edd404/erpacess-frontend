import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders, useDownloadPDF, useOrderStats, useDeleteOrder } from '../hooks/useData'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { displayCurrency, getInitials, getAvatarColor } from '../utils/formatters'
import {
  Search, Download, X, Shield, Loader2, ChevronRight,
  Smartphone, Wrench, Mail, Copy, User, Pencil,
  TrendingUp, ClipboardList, Zap, CheckCheck, ChevronLeft,
  ChevronDown, Phone, Trash2,
} from 'lucide-react'
import EditOrderModal from '../components/EditOrderModal'
import { orderService, adminService } from '../services/api'
import toast from 'react-hot-toast'

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

// Lista preenchida via API — fallback estático mínimo
const IPHONE_MODELS_FALLBACK = [
  'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16',
  'iPhone 15 Pro', 'iPhone 16 Pro', 'iPhone 15 Pro Max', 'iPhone 16 Pro Max',
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

// ─── Hook: fechar ao clicar fora ──────────────────────────────
function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  }, [ref, onClose])
}

// ─── Dropdown genérico (sem backdrop, sem bottom sheet) ───────
function FilterDropdown({ trigger, options, selected, onSelect, maxHeight = 320 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useClickOutside(ref, () => setOpen(false))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div onClick={() => setOpen(o => !o)}>{trigger(open)}</div>

      {/* Lista */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '100%', width: 'max-content', maxWidth: 320,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)',
          zIndex: 9999,
          overflow: 'hidden',
          maxHeight,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {options.map((o, i) => {
              const sel = selected === o.value
              return (
                <div
                  key={o.value}
                  onMouseDown={() => { onSelect(o.value); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px',
                    background: sel ? C.accentSoft : C.surface,
                    borderBottom: i < options.length - 1 ? `1px solid ${C.border}` : 'none',
                    cursor: 'pointer', transition: 'background .1s',
                    fontFamily: 'Instrument Sans, sans-serif',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = C.bg }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = sel ? C.accentSoft : C.surface }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {o.icon && <span style={{ fontSize: 16, lineHeight: 1 }}>{o.icon}</span>}
                    <span style={{
                      fontSize: 14, fontWeight: sel ? 600 : 400,
                      color: sel ? C.accent : C.text,
                    }}>{o.label}</span>
                  </div>
                  {/* Radio */}
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sel ? C.accent : 'rgba(0,0,0,0.18)'}`,
                    background: sel ? C.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}>
                    {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Model Select ─────────────────────────────────────────────
function ModelSelect({ value, onChange }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState(IPHONE_MODELS_FALLBACK)
  const ref = useRef()
  useClickOutside(ref, () => setOpen(false))

  // Busca modelos ativos da API (mesma fonte do NewOrderPage)
  useEffect(() => {
    adminService.activeModels()
      .then(r => {
        const list = (r.data?.data || [])
          .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
          .map(m => m.name)
        if (list.length > 0) setModels(list)
      })
      .catch(() => {})
  }, [])

  const filtered = q
    ? models.filter(m => m.toLowerCase().includes(q.toLowerCase()))
    : models

  const hasValue = !!value

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 260 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: hasValue ? C.accentSoft : C.surface,
          border: `1.5px solid ${hasValue ? C.accent : open ? C.text : C.border}`,
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
          ? <span
              onMouseDown={e => { e.stopPropagation(); onChange(''); setQ('') }}
              style={{ color: C.t3, display: 'flex', padding: 2, borderRadius: 4, cursor: 'pointer' }}>
              <X size={12} />
            </span>
          : <ChevronDown size={13} style={{ color: C.t3, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        }
      </button>

      {/* Dropdown com busca */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 260,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)',
          zIndex: 9999,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: 360,
        }}>
          {/* Busca */}
          <div style={{ padding: '10px 10px 6px', flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, borderRadius: 9, padding: '7px 10px' }}>
              <Search size={12} style={{ color: C.t3, flexShrink: 0 }} />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar modelo..."
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, color: C.text, fontFamily: 'Instrument Sans, sans-serif',
                }}
              />
              {q && <button onMouseDown={() => setQ('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.t3, padding: 0, display: 'flex' }}><X size={11} /></button>}
            </div>
          </div>

          {/* Lista */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* "Todos" */}
            {[{ value: '', label: 'Todos os modelos' }, ...filtered.map(m => ({ value: m, label: m }))].map((o, i, arr) => {
              const sel = value === o.value
              return (
                <div
                  key={o.value || '__all'}
                  onMouseDown={() => { onChange(o.value); setQ(''); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: sel ? C.accentSoft : C.surface,
                    borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                    cursor: 'pointer', transition: 'background .1s',
                    fontFamily: 'Instrument Sans, sans-serif',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = C.bg }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = sel ? C.accentSoft : C.surface }}
                >
                  <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? C.accent : C.text }}>
                    {o.label}
                  </span>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${sel ? C.accent : 'rgba(0,0,0,0.18)'}`,
                    background: sel ? C.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}>
                    {sel && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && q && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: C.t3 }}>
                Nenhum modelo encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Condition Select ─────────────────────────────────────────
function ConditionSelect({ value, onChange }) {
  const color  = value === 'lacrado' ? C.accent : value === 'seminovo' ? C.violet : C.t3
  const bg     = value === 'lacrado' ? C.accentSoft : value === 'seminovo' ? C.violetSoft : C.surface
  const border = value ? color : C.border
  const label  = value === 'lacrado' ? '📦 Lacrado' : value === 'seminovo' ? '✨ Seminovo' : 'Qualquer condição'

  return (
    <FilterDropdown
      selected={value}
      onSelect={onChange}
      maxHeight={200}
      options={[
        { value: '',         label: 'Qualquer condição' },
        { value: 'lacrado',  label: 'Lacrado',  icon: '📦' },
        { value: 'seminovo', label: 'Seminovo', icon: '✨' },
      ]}
      trigger={(open) => (
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', width: '100%',
          background: bg, border: `1.5px solid ${open ? (value ? color : C.text) : border}`,
          borderRadius: 12, cursor: 'pointer',
          boxShadow: C.shadow, transition: 'all .15s',
          fontFamily: 'Instrument Sans, sans-serif',
        }}>
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: value ? color : C.t3, fontWeight: value ? 600 : 400 }}>
            {label}
          </span>
          <ChevronDown size={13} style={{ color, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
      )}
    />
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
function OrderDetail({ order, onClose, isAdmin, onDelete }) {
  const navigate    = useNavigate()
  const downloadPDF = useDownloadPDF()
  const [editOpen,   setEditOpen]   = useState(false)
  const [copiedIMEI, setCopiedIMEI] = useState(false)
  const [resending,  setResending]  = useState(false)

  const handleResend = async () => {
    if (resending) return
    setResending(true)
    try {
      await orderService.resendPDF(order.id)
      toast.success('Comprovante reenviado!')
    } catch {
      toast.error('Erro ao reenviar e-mail.')
    } finally {
      setResending(false)
    }
  }

  const payments = parsePayments(order.payment_methods)
  const exp      = new Date(order.created_at)
  exp.setMonth(exp.getMonth() + (order.warranty_months || 0))
  const daysLeft = Math.round((exp - Date.now()) / 86400000)

  const COLORS   = ['#0A66FF','#12A150','#D97706','#D93025','#7C3AED','#0891B2']
  const avatarBg = COLORS[(order.client_name||'').charCodeAt(0) % COLORS.length]
  const initials = (order.client_name||'?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
  const isManut  = order.type === 'manutencao'

  const copyIMEI = () => {
    if (!order.imei) return
    navigator.clipboard.writeText(order.imei).then(() => { setCopiedIMEI(true); setTimeout(()=>setCopiedIMEI(false),2000) })
  }

  // KPIs do cabeçalho
  const kpis = [
    { label: 'Valor',     value: brl(order.price) },
    { label: 'Garantia',  value: order.warranty_months ? `${order.warranty_months} ${order.warranty_months===1?'mês':'meses'}` : 'Sem garantia' },
    { label: 'Pagamento', value: payments.map(p => PAY[p]||p).join(' + ') || '—' },
    { label: 'Data',      value: new Date(order.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}) },
  ]

  // Campos de detalhe
  const noteLines  = (order?.notes || '').split('\n')
  const origemLine = noteLines.find(l => l.startsWith('Origem:'))
  const leadSource = origemLine ? origemLine.replace('Origem:', '').trim() : null

  const servicosLine = noteLines.find(l => l.startsWith('Serviços:'))
  const servicos     = servicosLine ? servicosLine.replace('Serviços:', '').trim().split(', ').filter(Boolean) : []

  const problemaLine = noteLines.find(l => l.startsWith('Problema:'))
  const problema     = problemaLine ? problemaLine.replace('Problema:', '').trim() : null

  const condicaoLine = noteLines.find(l => /^Condi.+o:/i.test(l))
  const condicao     = condicaoLine ? condicaoLine.replace(/^Condi.+o:\s*/i, '').trim() : null

  const freeNotes  = order.notes
    ? order.notes.split('\n').filter(l =>
        !l.startsWith('Origem:') &&
        !l.startsWith('Serviços:') &&
        !l.startsWith('Problema:') &&
        !/^Condi.+o:/i.test(l) &&
        l.trim()
      ).join('\n')
    : null

  const details = [
    { label:'Modelo',     value: order.iphone_model },
    order.condition_sale ? { label:'Condição', value: order.condition_sale==='lacrado' ? '📦 Lacrado' : '✨ Seminovo' } : null,
    order.capacity       ? { label:'Capacidade',value: order.capacity } : null,
    order.color          ? { label:'Cor',       value: order.color    } : null,
    order.imei           ? { label:'IMEI',      value: order.imei, mono: true, copyAction: copyIMEI, copied: copiedIMEI } : null,
    leadSource ? { label:'Origem', value: leadSource, badge: true,
      ...(() => { const MAP = { 'Instagram': { color:'#7C3AED', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.20)', emoji:'📸' }, 'Indicação': { color:'#0891B2', bg:'rgba(8,145,178,0.08)', border:'rgba(8,145,178,0.20)', emoji:'🗣️' }, 'Já é cliente': { color:'#D97706', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.20)', emoji:'⭐' }, 'Instagram/Indicação': { color:'#7C3AED', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.20)', emoji:'📲' } }; const m = MAP[leadSource] || { color:'#6B7280', bg:'rgba(107,114,128,0.08)', border:'rgba(107,114,128,0.20)', emoji:'📌' }; return { badgeColor: m.color, badgeBg: m.bg, badgeBorder: m.border, emoji: m.emoji } })(),
    } : null,
    freeNotes ? { label:'Observações', value: freeNotes, wrap: true } : null,
  ].filter(Boolean)

  return (
    <>
      {/* ── HERO dark ────────────────────────────────────────── */}
      <div style={{ background:'#0C0C0E', padding:'22px 22px 20px', flexShrink:0, position:'relative' }}>

        {/* Fechar */}
        <button onClick={onClose} style={{
          position:'absolute', top:14, right:14,
          background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8,
          width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', color:'rgba(255,255,255,0.5)', zIndex:2,
        }}>
          <X size={15}/>
        </button>

        {/* Ações */}
        <div style={{ position:'absolute', top:14, right:54, display:'flex', gap:6, zIndex:2 }}>
          <button onClick={() => setEditOpen(true)} style={{
            background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)',
            borderRadius:8, padding:'6px 10px', cursor:'pointer',
            color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', gap:4,
            fontSize:11, fontWeight:500, fontFamily:'Instrument Sans,sans-serif', whiteSpace:'nowrap',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
            <Pencil size={11}/> Editar
          </button>
        </div>

        {/* Avatar + nome + OS */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, paddingTop:40 }}>
          <div style={{
            width:54, height:54, borderRadius:'50%', background:avatarBg, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:19, fontWeight:700, letterSpacing:'-0.5px',
            boxShadow:'0 0 0 3px rgba(255,255,255,0.12)',
          }}>
            {initials}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:19, fontWeight:700, color:'#fff', letterSpacing:'-0.4px', lineHeight:1.2 }}>
              {order.client_name}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', marginTop:5, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                {isManut ? <Wrench size={10}/> : <Smartphone size={10}/>}
                {isManut ? 'Manutenção' : 'Venda'}
              </span>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10 }}>{order.order_number}</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background:'rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 12px',
              border:'1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.32)', fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 }}>{k.label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCROLL BODY ───────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* Garantia banner */}
        {order.warranty_months > 0 && (
          <div style={{
            margin:'16px 20px 0',
            background: daysLeft<=0 ? '#FEF2F2' : daysLeft<=30 ? '#FFFBEB' : '#F0FDF4',
            border: `1px solid ${daysLeft<=0 ? '#FCA5A5' : daysLeft<=30 ? '#FDE68A' : '#86EFAC'}`,
            borderRadius:12, padding:'12px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px',
                color: daysLeft<=0 ? '#B91C1C' : daysLeft<=30 ? '#B45309' : '#15803D', marginBottom:3 }}>
                Garantia
              </div>
              <div style={{ fontSize:16, fontWeight:700,
                color: daysLeft<=0 ? '#B91C1C' : daysLeft<=30 ? '#92400E' : '#166534' }}>
                {order.warranty_months} {order.warranty_months===1?'mês':'meses'}
              </div>
              <div style={{ fontSize:11, marginTop:2,
                color: daysLeft<=0 ? '#DC2626' : daysLeft<=30 ? '#B45309' : '#16A34A' }}>
                {daysLeft<=0 ? `Vencida há ${Math.abs(daysLeft)} dias` : `Válida até ${exp.toLocaleDateString('pt-BR')} · ${daysLeft} dias restantes`}
              </div>
            </div>
            <Shield size={28} style={{ color: daysLeft<=0 ? '#FCA5A5' : daysLeft<=30 ? '#FDE68A' : '#86EFAC', flexShrink:0 }}/>
          </div>
        )}

        {/* Serviços realizados — só manutenção */}
        {isManut && (servicos.length > 0 || problema || condicao) && (
          <section style={{ margin:'16px 20px 0' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
              letterSpacing:'0.7px', marginBottom:8 }}>Serviços realizados</div>
            <div style={{ background:'#fff', borderRadius:12, border:'1px solid rgba(0,0,0,0.07)',
              overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', padding:'14px 16px',
              display:'flex', flexDirection:'column', gap:10 }}>

              {/* Chips de serviços */}
              {servicos.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {servicos.map((sv, i) => (
                    <span key={i} style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      background:'#111827', color:'#fff',
                      padding:'5px 12px', borderRadius:999,
                      fontSize:11, fontWeight:500, fontFamily:'Instrument Sans,sans-serif',
                    }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.4)', flexShrink:0 }}/>
                      {sv}
                    </span>
                  ))}
                </div>
              )}

              {/* Problema relatado */}
              {problema && (
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#B45309', textTransform:'uppercase',
                    letterSpacing:'0.5px', marginBottom:4 }}>Problema relatado</div>
                  <div style={{ fontSize:13, color:'#1D1D1F', lineHeight:1.5 }}>{problema}</div>
                </div>
              )}

              {/* Condição */}
              {condicao && (
                <span style={{
                  display:'inline-flex', alignSelf:'flex-start', alignItems:'center',
                  background:'#F3F4F6', border:'1px solid #E5E7EB',
                  padding:'4px 12px', borderRadius:999,
                  fontSize:12, fontWeight:500, color:'#374151',
                  fontFamily:'Instrument Sans,sans-serif',
                }}>
                  Condição: {condicao}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Detalhes do aparelho */}
        <section style={{ margin:'16px 20px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
            letterSpacing:'0.7px', marginBottom:8 }}>Detalhes</div>
          <div style={{ background:'#fff', borderRadius:12, border:'1px solid rgba(0,0,0,0.07)',
            overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            {details.map((row, i) => (
              <div key={row.label} style={{
                display:'flex', justifyContent:'space-between', alignItems: row.wrap ? 'flex-start' : 'center',
                padding:'12px 16px',
                borderBottom: i < details.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                gap:12,
              }}>
                <span style={{ fontSize:12, color:'#6B7280', flexShrink:0 }}>{row.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {row.badge ? (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px',
                      borderRadius:7, background: row.badgeBg, border:`1px solid ${row.badgeBorder}`,
                      fontSize:12, fontWeight:700, color: row.badgeColor }}>
                      {row.emoji} {row.value}
                    </span>
                  ) : (
                    <span style={{
                      fontSize: row.mono ? 12 : 13, fontWeight:500, textAlign:'right',
                      fontFamily: row.mono ? 'JetBrains Mono,monospace' : 'Instrument Sans,sans-serif',
                      color:'#111827', lineHeight: row.wrap ? 1.5 : 1,
                    }}>{row.value}</span>
                  )}
                  {row.copyAction && (
                    <button onClick={row.copyAction} style={{
                      background: row.copied ? '#F0FDF4' : 'rgba(0,0,0,0.05)',
                      border:'none', borderRadius:6, padding:'3px 7px', cursor:'pointer',
                      display:'flex', alignItems:'center', gap:3,
                      color: row.copied ? '#15803D' : '#6B7280', fontSize:11, fontWeight:600,
                      fontFamily:'Instrument Sans,sans-serif',
                    }}>
                      {row.copied ? <CheckCheck size={11}/> : <Copy size={11}/>}
                      {row.copied ? 'Copiado' : 'Copiar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Resumo Financeiro ─────────────────────────────────── */}
        {(() => {
          const parseJ = (v, fb) => { try { return typeof v === 'object' && v !== null ? v : JSON.parse(v || JSON.stringify(fb)) } catch { return fb } }
          const parseBRL = (v) => { if (!v) return 0; if (typeof v === 'number') return v; const n = parseFloat(String(v).replace(/\./g,'').replace(',','.')); return isNaN(n) ? 0 : n }
          const brl2 = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)
          const accs = parseJ(order.accessories, [])
          const pd   = parseJ(order.payment_details, {})
          const hasTradeIn = payments.includes('iphone_entrada')
          const cashMethods = payments.filter(p => p !== 'iphone_entrada')
          const tradeVal = parseBRL(pd.iphone_entrada?.value)
          const PAY_LABELS = { pix:'Pix', dinheiro:'Dinheiro', cartao_credito:'Cartão de Crédito', cartao_debito:'Cartão de Débito' }

          return (
            <section style={{ margin:'16px 20px 0' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:8 }}>Pagamento</div>
              <div style={{ background:'#fff', borderRadius:12, border:'1px solid rgba(0,0,0,0.07)', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', gap:0 }}>

                {/* Acessórios */}
                {accs.map((acc, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 16px', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>Acessório</div>
                      <div style={{ fontSize:13, fontWeight:500, color:'#111827' }}>{acc.name}</div>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:'#374151', fontFamily:'JetBrains Mono,monospace' }}>{brl2(acc.price)}</span>
                  </div>
                ))}

                {/* iPhone de Entrada */}
                {hasTradeIn && (
                  <div style={{ padding:'11px 16px', background:'#F0FDF4', borderBottom:'1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'#15803D', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>📲 iPhone de Entrada</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#166534', marginBottom:2 }}>
                          {[pd.iphone_entrada?.model, pd.iphone_entrada?.capacity, pd.iphone_entrada?.color].filter(Boolean).join(' · ') || '—'}
                        </div>
                        {pd.iphone_entrada?.imei && (
                          <div style={{ fontSize:11, color:'#6B7280', fontFamily:'JetBrains Mono,monospace' }}>IMEI {pd.iphone_entrada.imei}</div>
                        )}
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                        {tradeVal > 0 ? (
                          <>
                            <div style={{ fontSize:10, fontWeight:700, color:'#15803D', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:2 }}>Desconto</div>
                            <div style={{ fontSize:14, fontWeight:700, color:'#16A34A', fontFamily:'JetBrains Mono,monospace' }}>– {brl2(tradeVal)}</div>
                          </>
                        ) : (
                          <span style={{ fontSize:11, color:'#9CA3AF', fontStyle:'italic' }}>valor n/a</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Formas de pagamento */}
                {cashMethods.map((m, i) => {
                  const val = parseBRL(pd[m]?.value)
                  const parcelas = pd[m]?.parcelas ? parseInt(pd[m].parcelas) : null
                  return (
                    <div key={m} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 16px', borderBottom: i < cashMethods.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>Pagamento</div>
                        <div style={{ fontSize:13, fontWeight:500, color:'#111827' }}>
                          {PAY_LABELS[m] || m}{m === 'cartao_credito' && parcelas && parcelas > 1 ? ` · ${parcelas}x` : ''}
                        </div>
                      </div>
                      {val > 0 && <span style={{ fontSize:13, fontWeight:600, color:'#374151', fontFamily:'JetBrains Mono,monospace' }}>{brl2(val)}</span>}
                    </div>
                  )
                })}

                {/* Total */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'#111827' }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total</span>
                  <span style={{ fontSize:18, fontWeight:700, color:'#fff', fontFamily:'JetBrains Mono,monospace' }}>{brl2(order.price)}</span>
                </div>

              </div>
            </section>
          )
        })()}

        {/* Ver perfil do cliente */}
        <section style={{ margin:'12px 20px 0' }}>
          <button onClick={() => { onClose(); navigate(`/clients/${order.client_id}`) }} style={{
            width:'100%', padding:'11px 16px', background:'#F3F4F6',
            border:'1px solid #E5E7EB', borderRadius:12, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            fontFamily:'Instrument Sans,sans-serif',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:avatarBg,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontSize:11, fontWeight:700 }}>{initials}</div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{order.client_name}</div>
                <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>Ver histórico completo</div>
              </div>
            </div>
            <ChevronRight size={14} style={{ color:'#9CA3AF' }}/>
          </button>
        </section>

        {/* Ações PDF / e-mail */}
        <section style={{ margin:'12px 20px 0', display:'flex', gap:10 }}>
          <button onClick={() => downloadPDF.mutate(order.id)} disabled={downloadPDF.isPending} style={{
            flex:1, padding:'11px 0', background:'#111827', color:'#fff',
            border:'none', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600,
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            fontFamily:'Instrument Sans,sans-serif', opacity: downloadPDF.isPending ? 0.6 : 1,
          }}>
            {downloadPDF.isPending ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={14}/>}
            Baixar PDF
          </button>
          {order.client_email && (
            <button onClick={handleResend} disabled={resending} style={{
              flex:1, padding:'11px 0', background:C.accentSoft, color:C.accent,
              border:'none', borderRadius:12, cursor: resending ? 'not-allowed' : 'pointer',
              fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              fontFamily:'Instrument Sans,sans-serif', opacity: resending ? 0.7 : 1,
            }}>
              {resending
                ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Enviando...</>
                : <><Mail size={14}/> Reenviar e-mail</>}
            </button>
          )}
        </section>

        {/* Excluir ordem — somente admin */}
        {isAdmin && (
          <section style={{ margin:'10px 20px 20px' }}>
            <button onClick={() => onDelete(order.id)} style={{
              width:'100%', padding:'11px 0',
              background:'transparent', color:'#EF4444',
              border:'1.5px solid #FCA5A5', borderRadius:12, cursor:'pointer',
              fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              fontFamily:'Instrument Sans,sans-serif',
            }}>
              <Trash2 size={14}/>
              Excluir ordem
            </button>
          </section>
        )}
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const { isAdmin } = useAuth()
  const deleteOrder = useDeleteOrder()

  const handleDeleteOrder = async (id) => {
    await deleteOrder.mutateAsync(id)
    setConfirmDeleteId(null)
    setSelectedId(null)
  }

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
          display: 'flex', gap: 10,
          position: 'relative', zIndex: 100,
          animation: 'fadeUp .3s ease forwards', animationDelay: '240ms', opacity: 0,
        }}>
          <ModelSelect     value={model}     onChange={handleModel} />
          <div style={{ flex: 1, minWidth: 150, maxWidth: 220, position: 'relative' }}>
            <ConditionSelect value={condition} onChange={handleCondition} />
          </div>
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
            width: 560, maxWidth: '95vw', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.24)',
            animation: 'modalIn .2s ease',
          }}>
            <OrderDetail
              order={selectedOrder}
              onClose={() => setSelectedId(null)}
              isAdmin={isAdmin}
              onDelete={(id) => setConfirmDeleteId(id)}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmDeleteId && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
          backdropFilter:'blur(6px)', zIndex:2000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        }}>
          <div style={{
            background:C.surface, borderRadius:20, padding:28,
            width:360, maxWidth:'92vw',
            boxShadow:'0 32px 80px rgba(0,0,0,0.3)',
            display:'flex', flexDirection:'column', gap:16,
            animation:'modalIn .18s ease',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'#FEF2F2',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Trash2 size={20} color="#EF4444"/>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:3 }}>
                  Excluir ordem?
                </div>
                <div style={{ fontSize:13, color:'#6B7280' }}>
                  Esta ação não pode ser desfeita.
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{
                flex:1, padding:'11px 0', background:'#F3F4F6', color:'#374151',
                border:'none', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600,
                fontFamily:'Instrument Sans,sans-serif',
              }}>
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteOrder(confirmDeleteId)}
                disabled={deleteOrder.isPending}
                style={{
                  flex:1, padding:'11px 0', background:'#EF4444', color:'#fff',
                  border:'none', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600,
                  fontFamily:'Instrument Sans,sans-serif', opacity: deleteOrder.isPending ? 0.7 : 1,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                {deleteOrder.isPending
                  ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Excluindo...</>
                  : <><Trash2 size={14}/> Confirmar exclusão</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes modalIn { from { opacity:0; transform:scale(.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>
    </>
  )
}

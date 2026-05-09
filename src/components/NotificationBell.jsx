/**
 * NotificationBell.jsx
 * Sininho com badge + painel dropdown de notificações.
 * Notifica: garantias vencendo em 30 dias + ordens travadas há 7+ dias.
 *
 * Uso no Layout.jsx — importar e colocar no header:
 *
 *   import NotificationBell from '../NotificationBell'
 *   // dentro do header do DesktopLayout e MobileLayout:
 *   <NotificationBell />
 *
 * Não precisa de props — faz o fetch interno.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Shield, Clock, ChevronRight, X, CheckCheck } from 'lucide-react'
import api from '../services/api'

const C = {
  surface:   '#FFFFFF',
  border:    'rgba(0,0,0,0.08)',
  text:      '#1D1D1F',
  t2:        '#6E6E73',
  t3:        '#AEAEB2',
  accent:    '#0A66FF',
  accentSoft:'rgba(10,102,255,0.08)',
  green:     '#34C759',
  greenSoft: 'rgba(52,199,89,0.10)',
  amber:     '#FF9F0A',
  amberSoft: 'rgba(255,159,10,0.10)',
  red:       '#FF3B30',
  redSoft:   'rgba(255,59,48,0.10)',
  shadow:    '0 8px 32px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.08)',
}

// Poll de 5 minutos
const POLL_MS = 5 * 60 * 1000

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d atrás`
  const h = Math.floor(diff / 3600000)
  if (h > 0) return `${h}h atrás`
  return 'agora'
}

function warrantyColor(daysLeft) {
  if (daysLeft <= 7)  return { color: C.red,   bg: C.redSoft   }
  if (daysLeft <= 15) return { color: C.amber,  bg: C.amberSoft }
  return                     { color: C.green,  bg: C.greenSoft }
}

// ─── Item de garantia vencendo ────────────────────────────────
function WarrantyItem({ item, onClose }) {
  const { color, bg } = warrantyColor(item.days_left)
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', gap: 10, cursor: 'pointer',
      transition: 'background .12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Shield size={15} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.client_name}
        </div>
        <div style={{ fontSize: 11, color: C.t2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.iphone_model} · {item.order_number}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 3 }}>
          {item.days_left <= 0 ? 'Vencida' : `Vence em ${item.days_left} dia${item.days_left !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  )
}

// ─── Item de ordem travada ─────────────────────────────────────
function StalledItem({ item }) {
  const days = item.stalled_days || 0
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', gap: 10, cursor: 'pointer',
      transition: 'background .12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Clock size={15} style={{ color: C.amber }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.client_name}
        </div>
        <div style={{ fontSize: 11, color: C.t2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.iphone_model} · {item.order_number}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.amber, marginTop: 3 }}>
          Parada há {days} dia{days !== 1 ? 's' : ''} — {item.status === 'aberto' ? 'Em aberto' : 'Em andamento'}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function NotificationBell({ darkMode = true }) {
  const [open, setOpen]     = useState(false)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('istore_dismissed_notifs') || '[]') } catch { return [] }
  })
  const panelRef = useRef(null)
  const btnRef   = useRef(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/orders/notifications')
      setData(res.data.data)
    } catch { /* silencia */ } finally { setLoading(false) }
  }, [])

  // fetch inicial + poll
  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, POLL_MS)
    return () => clearInterval(id)
  }, [fetchNotifications])

  // fechar ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (open && !panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const warranties = (data?.warranties_expiring || []).filter(i => !dismissed.includes(i.id))
  const stalled    = (data?.stalled_orders      || []).filter(i => !dismissed.includes(i.id))
  const total      = warranties.length + stalled.length

  const dismissAll = () => {
    const ids = [...warranties, ...stalled].map(i => i.id)
    const next = [...dismissed, ...ids]
    setDismissed(next)
    localStorage.setItem('istore_dismissed_notifs', JSON.stringify(next))
  }

  // cor do botão adapta ao fundo (sidebar escura vs header claro)
  const iconColor  = darkMode ? 'rgba(255,255,255,0.7)' : C.t2
  const iconActive = darkMode ? '#fff' : C.text

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Botão sininho ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'relative', background: open
            ? (darkMode ? 'rgba(255,255,255,0.12)' : C.accentSoft)
            : 'none',
          border: 'none', borderRadius: 10, width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background .15s',
        }}
      >
        <Bell size={18} style={{ color: open ? iconActive : iconColor }} />

        {/* badge */}
        {total > 0 && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            width: total > 9 ? 18 : 14, height: 14,
            background: '#FF3B30', borderRadius: 7,
            fontSize: 9, fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: darkMode ? '1.5px solid #0C0C0E' : '1.5px solid #fff',
            fontFamily: 'Instrument Sans, sans-serif',
          }}>
            {total > 9 ? '9+' : total}
          </div>
        )}
      </button>

      {/* ── Painel dropdown ── */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 320, background: C.surface,
            borderRadius: 16, boxShadow: C.shadow,
            zIndex: 999, overflow: 'hidden',
            animation: 'notifIn .15s ease',
          }}
        >
          {/* header do painel */}
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Notificações</div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 1 }}>
                {total > 0 ? `${total} pendente${total !== 1 ? 's' : ''}` : 'Tudo em dia ✓'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {total > 0 && (
                <button onClick={dismissAll} title="Dispensar todas" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.t2, padding: 4, borderRadius: 6, display: 'flex',
                }}>
                  <CheckCheck size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.t2, padding: 4, borderRadius: 6, display: 'flex',
              }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* conteúdo */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: C.t3 }}>
                Carregando…
              </div>
            )}

            {!loading && total === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Bell size={28} style={{ color: C.t3, marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>Nenhuma notificação</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>Todas as ordens estão em dia</div>
              </div>
            )}

            {/* garantias */}
            {warranties.length > 0 && (
              <>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: 10, fontWeight: 700, color: C.t3,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Garantias Vencendo
                </div>
                {warranties.map(i => <WarrantyItem key={i.id} item={i} />)}
              </>
            )}

            {/* ordens travadas */}
            {stalled.length > 0 && (
              <>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: 10, fontWeight: 700, color: C.t3,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Ordens Paradas
                </div>
                {stalled.map(i => <StalledItem key={i.id} item={i} />)}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  )
}

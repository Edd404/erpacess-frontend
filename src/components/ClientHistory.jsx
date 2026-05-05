import { useState } from 'react'
import {
  X, Smartphone, Wrench, TrendingUp, Calendar, CreditCard, Shield,
  Download, Loader2, Mail, MapPin, Phone, Copy, CheckCircle2,
  ChevronDown, ChevronUp, User, Hash, Home,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { clientService, orderService } from '../services/api'
import toast from 'react-hot-toast'

/* ── helpers ─────────────────────────────────────────────────── */
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const fmtPhone = (p) => {
  if (!p) return null
  const d = p.replace(/\D/g, '')
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : p
}

const STATUS = {
  aberto:       { label: 'Aberto',        bg: '#FFF8E6', text: '#B45309', border: '#FDE68A' },
  em_andamento: { label: 'Em andamento',  bg: '#EEF4FF', text: '#1D4ED8', border: '#BFDBFE' },
  concluido:    { label: 'Concluído',     bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  cancelado:    { label: 'Cancelado',     bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
}

const PAY_LABEL = {
  pix: 'Pix', dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito', cartao_debito: 'Débito',
  iphone_entrada: 'iPhone Entrada',
}

/* ── OrderCard ───────────────────────────────────────────────── */
function OrderCard({ order, clientEmail, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(isFirst)
  const [dlLoading,   setDlLoading]   = useState(false)
  const [mailLoading, setMailLoading] = useState(false)

  const st = STATUS[order.status] || STATUS.aberto

  const payments = (() => {
    try { return Array.isArray(order.payment_methods) ? order.payment_methods : JSON.parse(order.payment_methods || '[]') }
    catch { return [] }
  })()

  /* PDF download */
  const handleDownload = async (e) => {
    e.stopPropagation()
    setDlLoading(true)
    try {
      const res = await orderService.downloadPDF(order.id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `garantia-${order.order_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF baixado!')
    } catch { toast.error('Erro ao baixar o PDF.') }
    setDlLoading(false)
  }

  /* Reenviar email */
  const handleResend = async (e) => {
    e.stopPropagation()
    if (!clientEmail) { toast.error('Cliente sem e-mail cadastrado.'); return }
    setMailLoading(true)
    try {
      await orderService.resendPDF(order.id)
      toast.success('Comprovante reenviado!')
    } catch { toast.error('Erro ao reenviar e-mail.') }
    setMailLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
      {/* ── linha da timeline ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 16 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: isFirst ? '#0C0C0E' : '#D1D5DB',
          border: isFirst ? 'none' : '2px solid #E5E7EB',
        }}/>
        {!isLast && <div style={{ width: 1, flex: 1, background: '#E5E7EB', marginTop: 4, minHeight: 32 }}/>}
      </div>

      {/* ── card ── */}
      <div style={{
        flex: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 8,
        border: '1px solid rgba(0,0,0,0.07)',
        background: '#fff',
        boxShadow: isFirst ? '0 2px 8px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}>

        {/* header clicável */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            padding: '12px 14px', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            background: expanded ? '#FAFAFA' : '#fff',
            transition: 'background .15s',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* número + tipo + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {order.type === 'venda'
                ? <Smartphone size={12} style={{ color: '#6B7280', flexShrink: 0 }}/>
                : <Wrench     size={12} style={{ color: '#6B7280', flexShrink: 0 }}/>}
              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.3px', fontFamily: 'JetBrains Mono,monospace' }}>
                {order.order_number}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: st.text, background: st.bg,
                padding: '2px 8px', borderRadius: 999, border: `1px solid ${st.border}`,
              }}>
                {st.label}
              </span>
            </div>

            {/* modelo */}
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0C0C0E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.iphone_model}
              {order.capacity ? ` · ${order.capacity}` : ''}
              {order.color    ? ` · ${order.color}`    : ''}
            </div>

            {/* meta */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#9CA3AF' }}>
                <Calendar size={10}/>{fmtDate(order.created_at)}
              </span>
              {payments.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#9CA3AF' }}>
                  <CreditCard size={10}/>{payments.map(p => PAY_LABEL[p] || p).join(' + ')}
                </span>
              )}
              {order.warranty_months > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#16A34A' }}>
                  <Shield size={10}/>
                  {order.warranty_months} {order.warranty_months === 1 ? 'mês' : 'meses'} garantia
                </span>
              )}
            </div>
          </div>

          {/* valor + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0C0C0E' }}>{brl(order.price)}</span>
            <div style={{
              width: 22, height: 22, borderRadius: 6, background: '#F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {expanded
                ? <ChevronUp   size={13} style={{ color: '#6B7280' }}/>
                : <ChevronDown size={13} style={{ color: '#6B7280' }}/>}
            </div>
          </div>
        </div>

        {/* ── conteúdo expansível ── */}
        {expanded && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA' }}>

            {/* IMEI */}
            {order.imei && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#F1F5F9', border: '1px solid #E2E8F0',
                borderRadius: 7, padding: '5px 10px', marginBottom: 10,
              }}>
                <Hash size={10} style={{ color: '#64748B' }}/>
                <span style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.4px' }}>
                  IMEI {order.imei}
                </span>
              </div>
            )}

            {/* Notas */}
            {order.notes && (
              <div style={{
                fontSize: 12, color: '#6B7280', lineHeight: 1.6,
                background: '#F5F5F7', borderRadius: 8, padding: '9px 12px',
                border: '1px solid #EBEBED', marginBottom: 10,
              }}>
                {order.notes}
              </div>
            )}

            {/* Ações */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDownload}
                disabled={dlLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0', background: '#0C0C0E', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: dlLoading ? 'default' : 'pointer', opacity: dlLoading ? 0.6 : 1,
                  fontFamily: 'Instrument Sans,sans-serif', transition: 'opacity .15s',
                }}
              >
                {dlLoading
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }}/> Baixando...</>
                  : <><Download size={12}/> Baixar PDF</>}
              </button>

              <button
                onClick={handleResend}
                disabled={mailLoading || !clientEmail}
                title={!clientEmail ? 'Cliente sem e-mail cadastrado' : 'Reenviar comprovante por e-mail'}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0',
                  background: clientEmail ? '#EEF4FF' : '#F9FAFB',
                  color: clientEmail ? '#1D4ED8' : '#9CA3AF',
                  border: `1px solid ${clientEmail ? '#BFDBFE' : '#E5E7EB'}`,
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: (mailLoading || !clientEmail) ? 'default' : 'pointer',
                  opacity: mailLoading ? 0.6 : 1,
                  fontFamily: 'Instrument Sans,sans-serif', transition: 'opacity .15s',
                }}
              >
                {mailLoading
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }}/> Enviando...</>
                  : <><Mail size={12}/> {clientEmail ? 'Reenviar e-mail' : 'Sem e-mail'}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── InfoRow (contato) ───────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value, raw, onCopy, copied }) {
  const empty = !value || value === '—'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={14} style={{ color: '#6B7280' }}/>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, color: empty ? '#D1D5DB' : '#0C0C0E' }}>
            {value || '—'}
          </div>
        </div>
      </div>
      {!empty && raw && (
        <button
          onClick={() => onCopy(raw, label)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: copied ? '#16A34A' : '#9CA3AF', transition: 'color .15s' }}
        >
          {copied ? <CheckCircle2 size={15}/> : <Copy size={15}/>}
        </button>
      )}
    </div>
  )
}

/* ── Componente principal ────────────────────────────────────── */
export default function ClientHistory({ clientId, onClose }) {
  const [copiedField, setCopiedField] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['client-history', clientId],
    queryFn:  () => clientService.getHistory(clientId).then(r => r.data.data),
    enabled:  !!clientId,
  })

  const client  = data?.client  || {}
  const orders  = data?.orders  || []
  const metrics = data?.metrics || {}

  const copy = (val, field) => {
    if (!val) return
    navigator.clipboard.writeText(val).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  /* avatar */
  const COLORS = ['#0A66FF', '#12A150', '#D97706', '#D93025', '#7C3AED', '#0891B2']
  const avatarBg  = COLORS[(client.name || '').charCodeAt(0) % COLORS.length]
  const initials  = (client.name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  /* endereço completo */
  const addressParts = [
    client.address,
    client.complement,
    client.neighborhood,
    client.city && client.state ? `${client.city}/${client.state}` : (client.city || client.state),
    client.cep ? client.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : null,
  ].filter(Boolean)
  const addressLine = addressParts.join(' · ') || null

  /* upsell */
  const upsell = (() => {
    if (!metrics.topModels?.length) return null
    const num = parseInt(metrics.topModels[0]?.model?.match(/\d+/)?.[0] || 0)
    return (num >= 11 && num <= 14) ? `iPhone ${num + 1}` : null
  })()

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: 'Instrument Sans,sans-serif',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
          maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 100px rgba(0,0,0,0.30)',
        }}
      >
        {/* ══ HERO HEADER ════════════════════════════════════════ */}
        <div style={{ background: '#0C0C0E', padding: '22px 22px 20px', flexShrink: 0, position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            }}
          >
            <X size={15}/>
          </button>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', height: 80 }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/>
              <span style={{ fontSize: 13 }}>Carregando...</span>
            </div>
          ) : (
            <>
              {/* avatar + nome + localização */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%', background: avatarBg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 19, fontWeight: 700, letterSpacing: '-0.5px',
                  boxShadow: `0 0 0 3px rgba(255,255,255,0.12)`,
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                    {client.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {client.cpf_formatted && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={10}/>{client.cpf_formatted}
                      </span>
                    )}
                    {client.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10}/>{fmtPhone(client.phone)}
                      </span>
                    )}
                  </div>
                  {(client.city || client.state) && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10}/>
                      {[client.city, client.state].filter(Boolean).join('/')}
                    </div>
                  )}
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { label: 'Total gasto',   value: brl(metrics.totalSpent)         },
                  { label: 'Atendimentos',  value: metrics.totalOrders || 0         },
                  { label: 'Ticket médio',  value: brl(metrics.avgTicket)           },
                  { label: 'Cliente desde', value: fmtDate(metrics.firstOrderDate)  },
                ].map(k => (
                  <div key={k.label} style={{
                    background: 'rgba(255,255,255,0.07)', borderRadius: 10,
                    padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ══ UPSELL ══════════════════════════════════════════════ */}
        {upsell && !isLoading && (
          <div style={{
            background: '#EEF4FF', borderBottom: '1px solid #BFDBFE',
            padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <TrendingUp size={13} style={{ color: '#1D4ED8', flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 500 }}>
              Oportunidade: histórico com {metrics.topModels[0]?.model} — considere oferecer {upsell}
            </span>
          </div>
        )}

        {/* ══ CONTEÚDO SCROLLÁVEL ═════════════════════════════════ */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Cadastro completo ── */}
          {!isLoading && (
            <section style={{ margin: '16px 20px 0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                Dados do cadastro
              </div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {[
                  { icon: Phone,  label: 'Telefone', value: fmtPhone(client.phone) || '—', raw: client.phone },
                  { icon: Mail,   label: 'E-mail',   value: client.email || '—',            raw: client.email },
                  { icon: Home,   label: 'Endereço', value: addressLine || '—',             raw: addressLine  },
                ].map(({ icon, label, value, raw }, i, arr) => (
                  <div key={label} style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <InfoRow
                      icon={icon} label={label} value={value} raw={raw}
                      onCopy={copy} copied={copiedField === label}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Modelos atendidos ── */}
          {!isLoading && metrics.modelsSet?.length > 0 && (
            <section style={{ margin: '16px 20px 0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                Modelos atendidos
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {metrics.modelsSet.map(m => (
                  <span key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#F3F4F6', border: '1px solid #E5E7EB',
                    color: '#374151', padding: '5px 12px', borderRadius: 999,
                    fontSize: 12, fontWeight: 500,
                  }}>
                    <Smartphone size={10}/>{m}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Histórico de atendimentos ── */}
          <section style={{ margin: '16px 20px 24px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8, color: '#9CA3AF' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }}/>
                <span style={{ fontSize: 13 }}>Carregando histórico...</span>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Sem atendimentos registrados</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>O histórico aparece aqui após o primeiro atendimento.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
                  Histórico de atendimentos ({orders.length})
                </div>
                {orders.map((o, idx) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    clientEmail={client.email}
                    isFirst={idx === 0}
                    isLast={idx === orders.length - 1}
                  />
                ))}
              </>
            )}
          </section>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

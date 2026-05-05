import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  X, Smartphone, Wrench, TrendingUp, Calendar, CreditCard, Shield,
  Download, Loader2, Mail, MapPin, Phone, Copy, CheckCircle2,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { clientService, orderService } from '../services/api'
import toast from 'react-hot-toast'

const brl     = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'
const fmtPhone = (p) => {
  if (!p) return '—'
  const d = p.replace(/\D/g,'')
  return d.length === 11 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}` : p
}

const STATUS = {
  aberto:       { label:'Aberto',       bg:'#FFF8E6', text:'#B45309', dot:'#D97706' },
  em_andamento: { label:'Em andamento', bg:'#EEF4FF', text:'#1D4ED8', dot:'#2563EB' },
  concluido:    { label:'Concluído',    bg:'#F0FDF4', text:'#15803D', dot:'#16A34A' },
  cancelado:    { label:'Cancelado',    bg:'#FEF2F2', text:'#B91C1C', dot:'#DC2626' },
}

const PAY_LABEL = {
  pix:'Pix', dinheiro:'Dinheiro', cartao_credito:'Crédito',
  cartao_debito:'Débito', iphone_entrada:'iPhone Entrada',
}

function OrderActions({ order }) {
  const [dlLoading, setDlLoading] = useState(false)
  const [mailLoading, setMailLoading] = useState(false)
  const canEmail = !!order.client_email

  const handleDownload = async () => {
    setDlLoading(true)
    try {
      const res = await orderService.downloadPDF(order.id)
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `comprovante-${order.order_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF baixado!')
    } catch { toast.error('Erro ao baixar PDF.') }
    setDlLoading(false)
  }

  const handleResend = async () => {
    if (!canEmail) { toast.error('Cliente sem e-mail cadastrado.'); return }
    setMailLoading(true)
    try {
      await orderService.resendPDF(order.id)
      toast.success('Comprovante reenviado por e-mail!')
    } catch { toast.error('Erro ao reenviar e-mail.') }
    setMailLoading(false)
  }

  return (
    <div style={{ display:'flex', gap:6, marginTop:10, paddingTop:10, borderTop:'1px solid rgba(0,0,0,0.06)' }}>
      <button onClick={handleDownload} disabled={dlLoading}
        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
          padding:'7px 0', background:'#0C0C0E', color:'#fff', border:'none', borderRadius:7,
          fontSize:11, fontWeight:600, cursor:dlLoading?'default':'pointer',
          opacity:dlLoading?0.6:1, fontFamily:'Instrument Sans,sans-serif', transition:'opacity .15s' }}>
        {dlLoading
          ? <><Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> Baixando...</>
          : <><Download size={11}/> Baixar PDF</>}
      </button>
      <button onClick={handleResend} disabled={mailLoading || !canEmail}
        title={!canEmail ? 'Cliente sem e-mail cadastrado' : 'Reenviar comprovante por e-mail'}
        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
          padding:'7px 0', background:canEmail?'#EEF4FF':'#F3F4F6',
          color:canEmail?'#1D4ED8':'#9CA3AF',
          border:`1px solid ${canEmail?'#BFDBFE':'#E5E7EB'}`,
          borderRadius:7, fontSize:11, fontWeight:600,
          cursor:(mailLoading||!canEmail)?'default':'pointer',
          opacity:mailLoading?0.6:1, fontFamily:'Instrument Sans,sans-serif', transition:'opacity .15s' }}>
        {mailLoading
          ? <><Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> Enviando...</>
          : <><Mail size={11}/> {canEmail ? 'Reenviar e-mail' : 'Sem e-mail'}</>}
      </button>
    </div>
  )
}

function OrderCard({ order, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(isFirst)
  const st = STATUS[order.status] || STATUS.aberto
  const payments = (() => {
    try { return Array.isArray(order.payment_methods) ? order.payment_methods : JSON.parse(order.payment_methods||'[]') }
    catch { return [] }
  })()

  return (
    <div style={{ display:'flex', gap:12 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:4 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:isFirst?'#0C0C0E':'#D1D5DB', flexShrink:0 }}/>
        {!isLast && <div style={{ width:1, flex:1, background:'#E5E7EB', marginTop:4, minHeight:20 }}/>}
      </div>

      <div style={{ flex:1, background:'#FAFAFA', borderRadius:12, overflow:'hidden', marginBottom:8,
        border:'1px solid rgba(0,0,0,0.05)', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>

        <div onClick={() => setExpanded(e => !e)}
          style={{ padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {order.type === 'venda'
                ? <Smartphone size={12} style={{ color:'#6B7280', flexShrink:0 }}/>
                : <Wrench     size={12} style={{ color:'#6B7280', flexShrink:0 }}/>}
              <span style={{ fontSize:12, fontWeight:700, color:'#0C0C0E', letterSpacing:'0.2px' }}>
                {order.order_number}
              </span>
              <span style={{ fontSize:10, fontWeight:700, color:st.text, background:st.bg,
                padding:'2px 8px', borderRadius:999, border:`1px solid ${st.dot}28` }}>
                {st.label}
              </span>
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginTop:4,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {order.iphone_model}
              {order.capacity ? ` · ${order.capacity}` : ''}
              {order.color    ? ` · ${order.color}`    : ''}
            </div>
            <div style={{ fontSize:11, color:'#9CA3AF', marginTop:3, display:'flex', gap:10, flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                <Calendar size={10}/>{fmtDate(order.created_at)}
              </span>
              {payments.length > 0 && (
                <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <CreditCard size={10}/>{payments.map(p => PAY_LABEL[p]||p).join(' + ')}
                </span>
              )}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, marginLeft:10 }}>
            <span style={{ fontSize:15, fontWeight:700, color:'#0C0C0E' }}>{brl(order.price)}</span>
            {expanded
              ? <ChevronUp   size={14} style={{ color:'#9CA3AF' }}/>
              : <ChevronDown size={14} style={{ color:'#9CA3AF' }}/>}
          </div>
        </div>

        {expanded && (
          <div style={{ padding:'0 14px 14px', borderTop:'1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, paddingTop:10 }}>
              {order.warranty_months > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:5, background:'#F0FDF4',
                  border:'1px solid #BBF7D0', borderRadius:7, padding:'5px 10px' }}>
                  <Shield size={11} style={{ color:'#16A34A' }}/>
                  <span style={{ fontSize:11, fontWeight:600, color:'#15803D' }}>
                    Garantia {order.warranty_months} {order.warranty_months === 1 ? 'mês' : 'meses'}
                  </span>
                </div>
              )}
              {order.imei && (
                <div style={{ display:'flex', alignItems:'center', gap:5, background:'#F8FAFC',
                  border:'1px solid #E2E8F0', borderRadius:7, padding:'5px 10px' }}>
                  <span style={{ fontSize:10, color:'#64748B', fontFamily:'JetBrains Mono,monospace', letterSpacing:'0.5px' }}>
                    IMEI {order.imei}
                  </span>
                </div>
              )}
              {order.description && (
                <div style={{ width:'100%', fontSize:12, color:'#6B7280', lineHeight:1.5,
                  background:'#F5F5F5', borderRadius:7, padding:'8px 10px', border:'1px solid #EBEBEB' }}>
                  {order.description}
                </div>
              )}
            </div>
            <OrderActions order={order}/>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientHistory({ clientId, onClose }) {
  const { T } = useTheme()
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

  const upsell = (() => {
    if (!metrics.topModels?.length) return null
    const num = parseInt(metrics.topModels[0]?.model?.match(/\d+/)?.[0] || 0)
    if (num >= 11 && num <= 14) return `iPhone ${num + 1}`
    return null
  })()

  const addressLine = [
    client.address,
    client.neighborhood,
    client.city && client.state ? `${client.city}/${client.state}` : (client.city || client.state),
  ].filter(Boolean).join(', ') || null

  const avatarColors = ['#0A66FF','#12A150','#D97706','#D93025','#7C3AED','#0891B2']
  const avatarBg = avatarColors[(client.name||'').charCodeAt(0) % avatarColors.length]
  const initials = (client.name||'?').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)',
        zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, fontFamily:'Instrument Sans,sans-serif' }}
      onClick={onClose}>

      <div onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:640,
          maxHeight:'92vh', overflow:'hidden', boxShadow:'0 32px 100px rgba(0,0,0,0.28)',
          display:'flex', flexDirection:'column' }}>

        {/* ── Hero header escuro ── */}
        <div style={{ background:'#0C0C0E', padding:'22px 22px 20px', flexShrink:0, position:'relative' }}>
          <button onClick={onClose}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.1)',
              border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center',
              justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.6)' }}>
            <X size={15}/>
          </button>

          {isLoading ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.4)', height:56 }}>
              <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/>
              <span style={{ fontSize:13 }}>Carregando...</span>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:avatarBg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontSize:18, fontWeight:700, flexShrink:0, letterSpacing:'-0.5px' }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'-0.3px', lineHeight:1.2 }}>
                    {client.name}
                  </div>
                  {addressLine && (
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:4,
                      display:'flex', alignItems:'center', gap:4 }}>
                      <MapPin size={10}/>{addressLine}
                    </div>
                  )}
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[
                  { label:'Total gasto',   value: brl(metrics.totalSpent)          },
                  { label:'Atendimentos',  value: metrics.totalOrders || 0          },
                  { label:'Ticket médio',  value: brl(metrics.avgTicket)            },
                  { label:'Cliente desde', value: fmtDate(metrics.firstOrderDate)   },
                ].map(k => (
                  <div key={k.label} style={{ background:'rgba(255,255,255,0.06)', borderRadius:10,
                    padding:'10px 12px', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Upsell ── */}
        {upsell && !isLoading && (
          <div style={{ background:'#EEF4FF', borderBottom:'1px solid #BFDBFE',
            padding:'9px 22px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <TrendingUp size={13} style={{ color:'#1D4ED8', flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#1D4ED8', fontWeight:500 }}>
              Oportunidade: histórico com {metrics.topModels[0]?.model} — considere oferecer {upsell}
            </span>
          </div>
        )}

        {/* ── Conteúdo scrollável ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 0 24px' }}>

          {/* Contatos com copy */}
          {!isLoading && (
            <div style={{ margin:'16px 20px 0', background:'#FAFAFA', borderRadius:12,
              border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }}>
              {[
                { icon:Phone,  label:'Telefone', value: fmtPhone(client.phone), raw: client.phone   },
                { icon:Mail,   label:'E-mail',   value: client.email || '—',   raw: client.email   },
                { icon:MapPin, label:'Endereço', value: addressLine  || '—',   raw: addressLine    },
              ].map(({ icon:Icon, label, value, raw }, i, arr) => (
                <div key={label}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 16px',
                    borderBottom: i < arr.length-1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'#F0F0F2',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={13} style={{ color:'#6B7280' }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:'#9CA3AF', fontWeight:600,
                        textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                      <div style={{ fontSize:13, fontWeight:500, marginTop:1,
                        color: value === '—' ? '#D1D5DB' : '#0C0C0E' }}>{value}</div>
                    </div>
                  </div>
                  {raw && (
                    <button onClick={() => copy(raw, label)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:6,
                        color: copiedField === label ? '#16A34A' : '#9CA3AF',
                        borderRadius:6, transition:'color .15s' }}>
                      {copiedField === label ? <CheckCircle2 size={14}/> : <Copy size={14}/>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modelos atendidos */}
          {!isLoading && metrics.modelsSet?.length > 0 && (
            <div style={{ margin:'16px 20px 0' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
                letterSpacing:'0.7px', marginBottom:8 }}>Modelos atendidos</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {metrics.modelsSet.map(m => (
                  <span key={m} style={{ display:'flex', alignItems:'center', gap:5,
                    background:'#F3F4F6', border:'1px solid #E5E7EB', color:'#374151',
                    padding:'4px 10px', borderRadius:999, fontSize:12, fontWeight:500 }}>
                    <Smartphone size={10}/>{m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          <div style={{ margin:'16px 20px 0' }}>
            {isLoading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                height:160, gap:8, color:'#9CA3AF' }}>
                <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/>
                <span style={{ fontSize:13 }}>Carregando histórico...</span>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'#9CA3AF' }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📋</div>
                <div style={{ fontSize:14, fontWeight:500 }}>Nenhum atendimento registrado</div>
                <div style={{ fontSize:12, marginTop:4 }}>O histórico aparece aqui após o primeiro atendimento.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
                  letterSpacing:'0.7px', marginBottom:10 }}>
                  Histórico de atendimentos ({orders.length})
                </div>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {orders.map((o, idx) => (
                    <OrderCard
                      key={o.id}
                      order={o}
                      isFirst={idx === 0}
                      isLast={idx === orders.length - 1}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

import { useTheme } from '../context/ThemeContext'
import { X, Smartphone, Wrench, TrendingUp, Calendar, CreditCard, Shield, Download, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { clientService, orderService } from '../services/api'

const brl = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const STATUS_COLORS = {
  aberto:       { label:'Aberto',       dot:'#C47D00' },
  em_andamento: { label:'Em andamento', dot:'#0A66FF' },
  concluido:    { label:'Concluído',    dot:'#12A150' },
  cancelado:    { label:'Cancelado',    dot:'#D93025' },
}

export default function ClientHistory({ clientId, onClose }) {
  const { T } = useTheme()

  const { data, isLoading } = useQuery({
    queryKey: ['client-history', clientId],
    queryFn: () => clientService.getHistory(clientId).then(r => r.data.data),
    enabled: !!clientId,
  })

  const client  = data?.client  || {}
  const orders  = data?.orders  || []
  const metrics = data?.metrics || {}

  const suggestUpsell = () => {
    if (!metrics.topModels?.length) return null
    const topModel = metrics.topModels[0]?.model || ''
    const num = parseInt(topModel.match(/\d+/)?.[0] || 0)
    if (num >= 11 && num <= 14) return `iPhone ${num + 1}`
    return null
  }
  const upsell = suggestUpsell()

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:'Instrument Sans,sans-serif' }}
      onClick={onClose}>

      <div onClick={e=>e.stopPropagation()}
        style={{ background:T.surface, borderRadius:18, width:'100%', maxWidth:640, maxHeight:'90vh', overflow:'hidden', boxShadow:'0 32px 100px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ background:T.ink, padding:'20px 22px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>
                {isLoading ? 'Carregando...' : client.name}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:3 }}>
                {client.cpf_formatted} · {client.phone}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.6)' }}>
              <X size={15}/>
            </button>
          </div>

          {/* KPIs */}
          {!isLoading && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16 }}>
              {[
                { label:'Total gasto', value: brl(metrics.totalSpent) },
                { label:'Atendimentos', value: metrics.totalOrders || 0 },
                { label:'Ticket médio', value: brl(metrics.avgTicket) },
                { label:'Cliente desde', value: fmtDate(metrics.firstOrderDate) },
              ].map(k => (
                <div key={k.label} style={{ background:'rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{k.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginTop:4 }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upsell hint */}
        {upsell && (
          <div style={{ background:T.blueL, borderBottom:`1px solid ${T.ink5}`, padding:'10px 22px', display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={13} style={{ color:T.blue }}/>
            <span style={{ fontSize:12, color:T.blue, fontWeight:500 }}>
              Oportunidade: Cliente tem histórico com {metrics.topModels[0]?.model} — considere oferecer {upsell}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 0 16px' }}>

          {isLoading && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:8, color:T.ink4 }}>
              <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/>
              <span style={{ fontSize:13 }}>Carregando histórico...</span>
            </div>
          )}

          {!isLoading && orders.length === 0 && (
            <div style={{ padding:'48px 22px', textAlign:'center', color:T.ink4 }}>
              <div style={{ fontSize:14 }}>Nenhum atendimento registrado</div>
            </div>
          )}

          {!isLoading && orders.length > 0 && (
            <>
              {/* Modelos */}
              {metrics.modelsSet?.length > 0 && (
                <div style={{ padding:'16px 22px 0' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.ink4, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:10 }}>Modelos atendidos</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {metrics.modelsSet.map(m => (
                      <span key={m} style={{ display:'flex', alignItems:'center', gap:5, background:T.ink6, color:T.ink2, padding:'4px 10px', borderRadius:999, fontSize:12, fontWeight:500 }}>
                        <Smartphone size={11}/>{m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline de ordens */}
              <div style={{ padding:'16px 22px 0' }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.ink4, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:10 }}>
                  Histórico de atendimentos ({orders.length})
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {orders.map((o, idx) => {
                    const st = STATUS_COLORS[o.status] || STATUS_COLORS.aberto
                    const payments = (() => { try { return Array.isArray(o.payment_methods) ? o.payment_methods : JSON.parse(o.payment_methods||'[]') } catch { return [] } })()
                    const PAY = { pix:'Pix', dinheiro:'Dinheiro', cartao_credito:'Crédito', cartao_debito:'Débito', iphone_entrada:'iPhone Entrada' }

                    return (
                      <div key={o.id} style={{ display:'flex', gap:12 }}>
                        {/* Timeline dot */}
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:2 }}>
                          <div style={{ width:10, height:10, borderRadius:'50%', background: idx===0 ? T.ink : T.ink5, flexShrink:0 }}/>
                          {idx < orders.length-1 && <div style={{ width:1, flex:1, background:T.ink5, marginTop:4, minHeight:20 }}/>}
                        </div>

                        {/* Card */}
                        <div style={{ flex:1, background:T.bg, borderRadius:10, padding:'12px 14px', marginBottom:4 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                            <div>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                {o.type==='venda' ? <Smartphone size={12} style={{ color:T.ink3 }}/> : <Wrench size={12} style={{ color:T.ink3 }}/>}
                                <span style={{ fontSize:12, fontWeight:700, color:T.ink, letterSpacing:'0.2px' }}>{o.order_number}</span>
                                <span style={{ fontSize:10, fontWeight:600, color:st.dot }}>● {st.label}</span>
                              </div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.ink2, marginTop:3 }}>
                                {o.iphone_model}{o.capacity ? ` · ${o.capacity}` : ''}{o.color ? ` · ${o.color}` : ''}
                              </div>
                            </div>
                            <span style={{ fontSize:15, fontWeight:700, color:T.ink, flexShrink:0 }}>{brl(o.price)}</span>
                          </div>

                          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, color:T.ink4, display:'flex', alignItems:'center', gap:3 }}>
                              <Calendar size={10}/>{fmtDate(o.created_at)}
                            </span>
                            {payments.length > 0 && (
                              <span style={{ fontSize:11, color:T.ink4, display:'flex', alignItems:'center', gap:3 }}>
                                <CreditCard size={10}/>{payments.map(p=>PAY[p]||p).join(' + ')}
                              </span>
                            )}
                            {o.warranty_months > 0 && (
                              <span style={{ fontSize:11, color:T.ink4, display:'flex', alignItems:'center', gap:3 }}>
                                <Shield size={10}/>{o.warranty_months}m garantia
                              </span>
                            )}
                            {o.imei && (
                              <span style={{ fontSize:10, color:T.ink4, fontFamily:'JetBrains Mono,monospace' }}>
                                {o.imei}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

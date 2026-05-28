import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { X, Smartphone, Wrench, Download, Send, Shield, CreditCard, Calendar, User, Hash, Loader2, CheckCircle2, Clock, AlertCircle, XCircle, ChevronRight, Pencil } from 'lucide-react'
import { useOrder, useUpdateOrderStatus, useDownloadPDF } from '../hooks/useData'
import { useMutation } from '@tanstack/react-query'
import { orderService } from '../services/api'
import toast from 'react-hot-toast'
import EditOrderModal from './EditOrderModal'

const brl = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)
const fmtDate = (d) => d ? new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'

const STATUS_FLOW = [
  { v:'aberto',        l:'Aberto',        icon:Clock,         color:'#C47D00' },
  { v:'em_andamento',  l:'Em andamento',  icon:AlertCircle,   color:'#0A66FF' },
  { v:'concluido',     l:'Concluído',     icon:CheckCircle2,  color:'#12A150' },
  { v:'cancelado',     l:'Cancelado',     icon:XCircle,       color:'#D93025' },
]

const PAY_LABELS = { pix:'Pix', dinheiro:'Dinheiro', cartao_credito:'Cartão de Crédito', cartao_debito:'Cartão de Débito', iphone_entrada:'iPhone de Entrada' }

const parseJSON = (v, fallback) => { try { return typeof v === 'object' && v !== null ? v : JSON.parse(v || JSON.stringify(fallback)) } catch { return fallback } }

export default function OrderDetail({ orderId, onClose }) {
  const { T } = useTheme()
  const { data: order, isLoading } = useOrder(orderId)
  const updateStatus = useUpdateOrderStatus()
  const downloadPDF  = useDownloadPDF()
  const [changingStatus, setChangingStatus] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const resendPDF = useMutation({
    mutationFn: () => orderService.resendPDF(orderId),
    onSuccess: () => toast.success('PDF reenviado por e-mail!'),
    onError: () => toast.error('Erro ao reenviar PDF.'),
  })

  const payments = (() => {
    try { return Array.isArray(order?.payment_methods) ? order.payment_methods : JSON.parse(order?.payment_methods||'[]') }
    catch { return [] }
  })()

  const currentStatusIdx = STATUS_FLOW.findIndex(s => s.v === order?.status)
  const currentStatus = STATUS_FLOW[currentStatusIdx] || STATUS_FLOW[0]

  // Extrai campos estruturados das notas — usa regex para evitar problemas de encoding
  const parseNotes = (notes) => {
    if (!notes) return { servicos: [], problema: '', condicao: '', free: '' }
    const lines = notes.split('\n')
    let servicos = []
    let problema = ''
    let condicao = ''
    const free = []

    lines.forEach(l => {
      const t = l.trim()
      if (!t) return
      // regex case-insensitive para capturar variações de encoding
      const mSrv = t.match(/^Servi.os:\s*(.+)/i)
      const mProb = t.match(/^Problema:\s*(.+)/i)
      const mCond = t.match(/^Condi.+o:\s*(.+)/i)
      if (mSrv)  servicos = mSrv[1].split(', ').filter(Boolean)
      else if (mProb) problema = mProb[1].trim()
      else if (mCond) condicao = mCond[1].trim()
      else free.push(t)
    })

    return { servicos, problema, condicao, free: free.join('\n') }
  }

  const { servicos, problema, condicao, free } = parseNotes(order?.notes)

  return (
    <>
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:'Instrument Sans,sans-serif' }}
      onClick={onClose}>

      <div onClick={e=>e.stopPropagation()}
        style={{ background:T.surface, borderRadius:18, width:'100%', maxWidth:600, maxHeight:'92vh', overflow:'hidden', boxShadow:'0 32px 100px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ background:T.ink, padding:'20px 22px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {order?.type==='venda' ? <Smartphone size={18} style={{ color:'#fff' }}/> : <Wrench size={18} style={{ color:'#fff' }}/>}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>
                  {isLoading ? 'Carregando...' : order?.order_number}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                  {order?.type === 'venda' ? 'Venda' : 'Manutenção'} · {fmtDate(order?.created_at)}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {!isLoading && (
                <button onClick={() => setEditOpen(true)}
                  style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8,
                    height:32, padding:'0 12px', display:'flex', alignItems:'center',
                    gap:6, cursor:'pointer', color:'rgba(255,255,255,0.75)',
                    fontSize:12, fontWeight:500, fontFamily:'Instrument Sans,sans-serif' }}>
                  <Pencil size={12}/>
                  Editar
                </button>
              )}
              <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.6)' }}>
                <X size={15}/>
              </button>
            </div>
          </div>

          {/* Status flow */}
          {!isLoading && (
            <div style={{ display:'flex', alignItems:'center', gap:0 }}>
              {STATUS_FLOW.filter(s => s.v !== 'cancelado').map((s, i, arr) => {
                const done = currentStatusIdx > STATUS_FLOW.findIndex(x=>x.v===s.v)
                const active = order?.status === s.v
                const isCancelled = order?.status === 'cancelado'
                return (
                  <div key={s.v} style={{ flex: i<arr.length-1?1:0, display:'flex', alignItems:'center' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{
                        width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                        background: isCancelled ? 'rgba(255,255,255,0.1)' : (done || active) ? s.color : 'rgba(255,255,255,0.1)',
                        transition:'all .2s',
                      }}>
                        <s.icon size={12} style={{ color: (done || active) && !isCancelled ? '#fff' : 'rgba(255,255,255,0.3)' }}/>
                      </div>
                      <span style={{ fontSize:9, color: active && !isCancelled ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: active?600:400, whiteSpace:'nowrap' }}>
                        {s.l}
                      </span>
                    </div>
                    {i<arr.length-1 && (
                      <div style={{ flex:1, height:1, background: done && !isCancelled ? currentStatus.color : 'rgba(255,255,255,0.12)', margin:'0 6px', marginBottom:14, transition:'background .3s' }}/>
                    )}
                  </div>
                )
              })}
              {order?.status === 'cancelado' && (
                <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
                  <XCircle size={13} style={{ color:'#FF453A' }}/>
                  <span style={{ fontSize:11, color:'#FF453A', fontWeight:600 }}>Cancelado</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {isLoading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:8, color:T.ink4 }}>
              <Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/>
              <span style={{ fontSize:13 }}>Carregando...</span>
            </div>
          ) : (
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:18 }}>

              {/* Produto */}
              <Section T={T} title="Produto">
                <Row T={T} label="Modelo" value={order?.iphone_model || '—'}/>
                {order?.capacity && <Row T={T} label="Capacidade" value={order.capacity}/>}
                {order?.color && <Row T={T} label="Cor" value={order.color}/>}
                {order?.imei && <Row T={T} label="IMEI" value={order.imei} mono/>}
              </Section>

              {/* Manutenção — serviços, problema e condição */}
              {order?.type === 'manutencao' && (servicos.length > 0 || problema || condicao) && (
                <Section T={T} title="Serviço">
                  {/* Chips de serviços */}
                  {servicos.length > 0 && (
                    <div style={{ padding:'4px 0 10px' }}>
                      <div style={{ fontSize:11, fontWeight:600, color:T.ink4, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>
                        Serviços realizados
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {servicos.map((sv, i) => (
                          <span key={i} style={{
                            display:'inline-flex', alignItems:'center', gap:5,
                            background:T.ink, color:T.white,
                            padding:'5px 12px', borderRadius:999,
                            fontSize:11, fontWeight:500,
                          }}>
                            <span style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.4)', flexShrink:0 }}/>
                            {sv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Problema relatado */}
                  {problema && (
                    <Row T={T} label="Problema" value={problema}/>
                  )}
                  {/* Condição */}
                  {condicao && (
                    <Row T={T} label="Condição" value={condicao}/>
                  )}
                </Section>
              )}

              {/* Cliente */}
              <Section T={T} title="Cliente">
                <Row T={T} label="Nome" value={order?.client_name}/>
                <Row T={T} label="Telefone" value={order?.client_phone || '—'}/>
                <Row T={T} label="E-mail" value={order?.client_email || '—'}/>
              </Section>

              {/* Pagamento */}
              <Section T={T} title="Pagamento">
                {(() => {
                  const pd   = parseJSON(order?.payment_details, {})
                  const accs = parseJSON(order?.accessories, [])
                  const total     = parseFloat(order?.price) || 0
                  const accTotal  = accs.reduce((s, a) => s + (parseFloat(a.price) || 0), 0)
                  const devPrice  = total - accTotal
                  // parseBRL: converte '1.500,00' → 1500 | '500,00' → 500 | número → número
                  const parseBRL  = (v) => { if (!v) return 0; if (typeof v === 'number') return v; const n = parseFloat(String(v).replace(/\./g,'').replace(',','.')); return isNaN(n) ? 0 : n; }
                  const tradeVal  = parseBRL(pd.iphone_entrada?.value)
                  const isVenda   = order?.type === 'venda'
                  const cashMethods = payments.filter(p => p !== 'iphone_entrada')

                  return (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>

                      {/* Aparelho */}
                      {isVenda && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 14px', background:T.bg, borderRadius:10 }}>
                          <div>
                            <div style={{ fontSize:11, color:T.ink4, fontWeight:500, marginBottom:2 }}>APARELHO</div>
                            <div style={{ fontSize:13, color:T.ink, fontWeight:600 }}>
                              {order?.iphone_model}{order?.capacity ? ' · ' + order.capacity : ''}
                            </div>
                          </div>
                          <span style={{ fontSize:14, fontWeight:700, color:T.ink, fontFamily:'JetBrains Mono,monospace' }}>
                            {brl(devPrice)}
                          </span>
                        </div>
                      )}

                      {/* Acessórios */}
                      {accs.length > 0 && accs.map((acc, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 14px', background:T.bg, borderRadius:10 }}>
                          <div>
                            <div style={{ fontSize:11, color:T.ink4, fontWeight:500, marginBottom:2 }}>ACESSÓRIO</div>
                            <div style={{ fontSize:13, color:T.ink, fontWeight:500 }}>{acc.name}</div>
                          </div>
                          <span style={{ fontSize:13, fontWeight:600, color:T.ink2, fontFamily:'JetBrains Mono,monospace' }}>
                            {brl(acc.price)}
                          </span>
                        </div>
                      ))}

                      {/* iPhone de Entrada */}
                      {tradeVal > 0 && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 14px', background:T.greenL, border:`1px solid ${T.green}30`, borderRadius:10 }}>
                          <div>
                            <div style={{ fontSize:11, color:T.green, fontWeight:600, marginBottom:2 }}>iPhone como Entrada</div>
                            <div style={{ fontSize:12, color:T.ink2 }}>
                              {[pd.iphone_entrada?.model, pd.iphone_entrada?.capacity, pd.iphone_entrada?.color].filter(Boolean).join(' · ') || '—'}
                            </div>
                            {pd.iphone_entrada?.imei && (
                              <div style={{ fontSize:11, color:T.ink4, fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>
                                IMEI {pd.iphone_entrada.imei}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize:13, fontWeight:700, color:T.green, fontFamily:'JetBrains Mono,monospace' }}>
                            – {brl(tradeVal)}
                          </span>
                        </div>
                      )}

                      {/* Formas de pagamento em dinheiro */}
                      {cashMethods.map(m => {
                        const val      = parseBRL(pd[m]?.value)
                        const parcelas = pd[m]?.parcelas ? parseInt(pd[m].parcelas) : null
                        return (
                          <div key={m} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                            padding:'10px 14px', background:T.bg, borderRadius:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <CreditCard size={14} color={T.ink3}/>
                              <div>
                                <div style={{ fontSize:11, color:T.ink4, fontWeight:500, marginBottom:2 }}>PAGAMENTO</div>
                                <div style={{ fontSize:13, color:T.ink, fontWeight:500 }}>
                                  {PAY_LABELS[m] || m}
                                  {m === 'cartao_credito' && parcelas && parcelas > 1 ? ` · ${parcelas}x` : ''}
                                </div>
                              </div>
                            </div>
                            {val > 0 && (
                              <span style={{ fontSize:13, fontWeight:600, color:T.ink, fontFamily:'JetBrains Mono,monospace' }}>
                                {brl(val)}
                              </span>
                            )}
                          </div>
                        )
                      })}

                      {/* Total */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'12px 14px', background:T.ink, borderRadius:10, marginTop:2 }}>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:500 }}>TOTAL</span>
                        <span style={{ fontSize:20, fontWeight:700, color:'#FFF', letterSpacing:'-0.5px', fontFamily:'JetBrains Mono,monospace' }}>
                          {brl(total)}
                        </span>
                      </div>

                    </div>
                  )
                })()}
                {order?.warranty_months > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:T.greenL, border:`1px solid ${T.green}30`, borderRadius:8, marginTop:8 }}>
                    <Shield size={14} style={{ color:T.green }}/>
                    <span style={{ fontSize:13, color:T.green, fontWeight:500 }}>{order.warranty_months} meses de garantia</span>
                  </div>
                )}
              </Section>

              {/* Observações livres */}
              {free && (
                <Section T={T} title="Observações">
                  <p style={{ fontSize:13, color:T.ink2, lineHeight:1.6, padding:'4px 0' }}>{free}</p>
                </Section>
              )}

              {/* Atualizar status */}
              <Section T={T} title="Atualizar status">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {STATUS_FLOW.map(s => {
                    const active = order?.status === s.v
                    return (
                      <button key={s.v} onClick={() => {
                        if (active) return
                        updateStatus.mutate({ id: order.id, status: s.v })
                      }}
                        disabled={active || updateStatus.isPending}
                        style={{
                          display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                          border:`1.5px solid ${active ? s.color : T.ink5}`,
                          borderRadius:9, background: active ? `${s.color}12` : T.surface,
                          cursor: active ? 'default' : 'pointer', fontFamily:'Instrument Sans,sans-serif',
                          opacity: updateStatus.isPending ? 0.7 : 1,
                        }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background: active ? s.color : T.ink5, flexShrink:0 }}/>
                        <span style={{ fontSize:12, fontWeight: active?600:400, color: active ? s.color : T.ink3 }}>
                          {s.l}
                        </span>
                        {active && <CheckCircle2 size={11} style={{ color:s.color, marginLeft:'auto' }}/>}
                      </button>
                    )
                  })}
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!isLoading && (
          <div style={{ padding:'14px 22px', borderTop:`1px solid ${T.ink6}`, display:'flex', gap:10, flexShrink:0, background:T.surface }}>
            <button onClick={() => downloadPDF.mutate(order?.id)} disabled={downloadPDF.isPending}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px', border:`1px solid ${T.ink5}`, borderRadius:9, background:T.surface, cursor:'pointer', fontSize:13, fontWeight:500, color:T.ink2, fontFamily:'Instrument Sans,sans-serif' }}>
              {downloadPDF.isPending ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={13}/>}
              Baixar PDF
            </button>
            {order?.client_email && (
              <button onClick={() => resendPDF.mutate()} disabled={resendPDF.isPending}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px', border:'none', borderRadius:9, background:T.ink, cursor:'pointer', fontSize:13, fontWeight:600, color:'#fff', fontFamily:'Instrument Sans,sans-serif' }}>
                {resendPDF.isPending ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={13}/>}
                Reenviar por e-mail
              </button>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>

    {editOpen && order && (
      <EditOrderModal order={order} onClose={() => setEditOpen(false)}/>
    )}
  </>
  )
}

function Section({ T, title, children }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, color:T.ink4, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:10 }}>{title}</div>
      <div style={{ border:`1px solid ${T.ink5}`, borderRadius:10, overflow:'hidden' }}>{children}</div>
    </div>
  )
}

function Row({ T, label, value, mono, last }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderBottom: last ? 'none' : `1px solid ${T.ink6}` }}>
      <span style={{ fontSize:12, color:T.ink3 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, color:T.ink, fontFamily: mono?'JetBrains Mono,monospace':'inherit', textAlign:'right', maxWidth:'60%' }}>{value || '—'}</span>
    </div>
  )
}

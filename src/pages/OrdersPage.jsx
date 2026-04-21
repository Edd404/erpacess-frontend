import { useState } from 'react'
import { useOrders, useUpdateOrderStatus, useDownloadPDF } from '../hooks/useData'
import { Search, ChevronRight, Download, X, Shield, Loader2 } from 'lucide-react'
import { displayCurrency, getInitials, getAvatarColor } from '../utils/formatters'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', borderS:'rgba(0,0,0,0.12)',
  text:'#0C0C0E', t2:'#6B7280', t3:'#9CA3AF', bg:'#F7F7F8',
  accent:'#0A66FF', accentL:'#EEF4FF', green:'#16A34A', greenBg:'#F0FDF4',
  amber:'#D97706', amberBg:'#FFFBEB', red:'#DC2626', redBg:'#FEF2F2',
  shadow:'0 1px 2px rgba(0,0,0,0.05),0 0 0 1px rgba(0,0,0,0.06)',
}

const STATUS = {
  aberto:       { label:'Aberto',       color:T.amber,  bg:T.amberBg },
  em_andamento: { label:'Em andamento', color:T.accent, bg:T.accentL },
  concluido:    { label:'Concluído',    color:T.green,  bg:T.greenBg },
  cancelado:    { label:'Cancelado',    color:T.red,    bg:T.redBg   },
}

const PAY = { pix:'Pix', dinheiro:'Dinheiro', cartao_credito:'Crédito', cartao_debito:'Débito', iphone_entrada:'iPhone Entrada' }

function Avatar({ name, size=30 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:getAvatarColor(name), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:size*0.34, fontWeight:600, flexShrink:0 }}>
      {getInitials(name)}
    </div>
  )
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.aberto
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500, background:s.bg, color:s.color }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color }}/>
      {s.label}
    </span>
  )
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, borderRadius:16, width:580, maxWidth:'95vw', maxHeight:'88vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
        {children}
      </div>
    </div>
  )
}

function OrderDetail({ order, onClose }) {
  const updateStatus = useUpdateOrderStatus()
  const downloadPDF = useDownloadPDF()

  const payments = (() => {
    try { return Array.isArray(order.payment_methods) ? order.payment_methods : JSON.parse(order.payment_methods||'[]') }
    catch { return [] }
  })()

  const expiryDate = new Date(order.created_at)
  expiryDate.setMonth(expiryDate.getMonth() + (order.warranty_months||0))

  const nextStatus = { aberto:'em_andamento', em_andamento:'concluido', concluido:'aberto' }

  return (
    <>
      <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:T.surface, zIndex:1 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700 }}>Detalhes do Atendimento</div>
          <div style={{ fontSize:11, color:T.t2, marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>{order.order_number}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Badge status={order.status}/>
          <button onClick={onClose} style={{ background:T.bg, border:'none', width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.t2 }}>
            <X size={14}/>
          </button>
        </div>
      </div>

      <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
        {/* Client */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:T.bg, borderRadius:8 }}>
          <Avatar name={order.client_name} size={38}/>
          <div>
            <div style={{ fontSize:14, fontWeight:600 }}>{order.client_name}</div>
            <div style={{ fontSize:12, color:T.t2, marginTop:2 }}>{order.type==='venda'?'📱 Venda':'🛠 Manutenção'}</div>
          </div>
        </div>

        {/* Warranty banner */}
        {order.warranty_months > 0 && (
          <div style={{ background:T.text, borderRadius:8, padding:'16px 20px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <Shield size={13} style={{ color:'rgba(255,255,255,0.4)' }}/>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>Garantia</span>
              </div>
              <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>{order.warranty_months} {order.warranty_months===1?'mês':'meses'}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>Válida até {expiryDate.toLocaleDateString('pt-BR')}</div>
            </div>
            <Shield size={32} style={{ color:'rgba(255,255,255,0.15)' }}/>
          </div>
        )}

        {/* Details */}
        {[
          ['Modelo', order.iphone_model],
          ['Capacidade', order.capacity||'—'],
          ['Cor', order.color||'—'],
          ['IMEI', order.imei||'—', true],
          ['Valor', displayCurrency(order.price)],
          ['Pagamento', payments.map(p=>PAY[p]||p).join(', ') || '—'],
          ['Data', new Date(order.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})],
        ].map(([l,v,mono],i,a)=>(
          <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<a.length-1?`1px solid ${T.border}`:'none' }}>
            <span style={{ fontSize:12, color:T.t2 }}>{l}</span>
            <span style={{ fontSize:mono?12:13, fontWeight:500, fontFamily:mono?'JetBrains Mono,monospace':'inherit' }}>{v}</span>
          </div>
        ))}

        {/* Actions */}
        <div style={{ display:'flex', gap:10, paddingTop:4 }}>
          {order.status !== 'concluido' && order.status !== 'cancelado' && (
            <button onClick={()=>{ updateStatus.mutate({ id:order.id, status:nextStatus[order.status] }); onClose() }} disabled={updateStatus.isPending} style={{ flex:1, padding:10, border:`1px solid ${T.borderS}`, borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:T.t2, fontFamily:'Instrument Sans,sans-serif' }}>
              Avançar Status
            </button>
          )}
          <button onClick={()=>{ downloadPDF.mutate(order.id); onClose() }} disabled={downloadPDF.isPending} style={{ flex:2, padding:10, background:T.text, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'Instrument Sans,sans-serif' }}>
            {downloadPDF.isPending ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={14}/>}
            Baixar Termo de Garantia
          </button>
        </div>
      </div>
    </>
  )
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useOrders({ search, status: activeTab, page:1, limit:50 })
  const orders = data?.data || []
  const meta = data?.meta || {}

  const tabs = [
    { v:'',            l:'Todos',        count: meta.total||0 },
    { v:'aberto',      l:'Abertos',      count: orders.filter(o=>o.status==='aberto').length },
    { v:'em_andamento',l:'Em andamento', count: orders.filter(o=>o.status==='em_andamento').length },
    { v:'concluido',   l:'Concluídos',   count: orders.filter(o=>o.status==='concluido').length },
  ]

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap:16, fontFamily:'Instrument Sans,sans-serif' }}>
        {/* Search */}
        <div style={{ position:'relative', maxWidth:320 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.t3 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente, modelo, número..." style={{ width:'100%', padding:'8px 12px 8px 30px', border:`1px solid ${T.borderS}`, borderRadius:8, fontSize:13, color:T.text, background:T.surface, fontFamily:'Instrument Sans,sans-serif', outline:'none' }}/>
        </div>

        <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, overflow:'hidden' }}>
          {/* Tabs */}
          <div style={{ padding:'0 22px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:2 }}>
            {tabs.map(t=>(
              <button key={t.v} onClick={()=>setActiveTab(t.v)} style={{
                padding:'14px 12px', fontSize:13, fontWeight:activeTab===t.v?600:400,
                color:activeTab===t.v?T.text:T.t2, background:'none', border:'none', cursor:'pointer',
                borderBottom:`2px solid ${activeTab===t.v?T.text:'transparent'}`,
                display:'flex', alignItems:'center', gap:6, transition:'all .15s',
                fontFamily:'Instrument Sans,sans-serif', marginBottom:-1,
              }}>
                {t.l}
                <span style={{ fontSize:11, fontWeight:600, padding:'1px 6px', borderRadius:999, background:activeTab===t.v?T.text:T.bg, color:activeTab===t.v?'#fff':T.t3 }}>{t.count}</span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, color:T.t2 }}>
              <Loader2 size={20} style={{ animation:'spin 1s linear infinite', marginRight:8 }}/> Carregando...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, color:T.t3 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:14 }}>Nenhum atendimento encontrado</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    {['Nº','Cliente','Produto','Valor','Status',''].map((h,i)=>(
                      <th key={i} style={{ padding:`10px ${i===0?'22px':'14px'}`, textAlign:'left', fontSize:10, fontWeight:600, color:T.t3, letterSpacing:'0.5px', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o=>(
                    <tr key={o.id} onClick={()=>setSelected(o)} style={{ borderBottom:`1px solid ${T.border}`, cursor:'pointer', transition:'background .1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'14px 22px', fontFamily:'JetBrains Mono,monospace', fontSize:11, color:T.t2 }}>{o.order_number?.slice(-12)}</td>
                      <td style={{ padding:'14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <Avatar name={o.client_name} size={30}/>
                          <span style={{ fontSize:13, fontWeight:500 }}>{o.client_name}</span>
                        </div>
                      </td>
                      <td style={{ padding:'14px' }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{o.iphone_model}</div>
                        <div style={{ fontSize:11, color:T.t3 }}>{o.capacity}{o.color?` · ${o.color}`:''}</div>
                      </td>
                      <td style={{ padding:'14px', fontSize:13, fontWeight:700, letterSpacing:'-0.2px' }}>{displayCurrency(o.price)}</td>
                      <td style={{ padding:'14px' }}><Badge status={o.status}/></td>
                      <td style={{ padding:'14px 14px 14px 0', textAlign:'right', color:T.t3 }}><ChevronRight size={14}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!selected} onClose={()=>setSelected(null)}>
        {selected && <OrderDetail order={selected} onClose={()=>setSelected(null)}/>}
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

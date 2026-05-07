import { useState, useMemo } from 'react'
import { useClients, useCreateClient, useLookupCEP } from '../hooks/useData'
import {
  Search, Plus, ChevronRight, Phone, Mail, MapPin, X, Loader2, Check,
  Download, ChevronUp, ChevronDown, ChevronsUpDown, Users, UserPlus, AlertTriangle,
} from 'lucide-react'
import { formatCPF, formatPhone, formatCEP, getInitials, getAvatarColor } from '../utils/formatters'
import { validateCPF } from '../utils/validators'
import toast from 'react-hot-toast'
import ClientHistory from '../components/ClientHistory'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', borderS:'rgba(0,0,0,0.12)',
  text:'#0C0C0E', t2:'#6B7280', t3:'#9CA3AF', bg:'#F7F7F8',
  accent:'#0A66FF', accentL:'#EEF4FF',
  shadow:'0 1px 2px rgba(0,0,0,0.05),0 0 0 1px rgba(0,0,0,0.06)',
}

/* ── helpers ─────────────────────────────────────────────── */
function Avatar({ name, size = 34, inactive = false }) {
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%', background:getAvatarColor(name),
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontSize:size*0.34, fontWeight:600,
      }}>
        {getInitials(name)}
      </div>
      {inactive && (
        <div style={{
          position:'absolute', bottom:0, right:0,
          width:10, height:10, borderRadius:'50%',
          background:'#F59E0B', border:'2px solid #fff',
        }} title="Sem atendimento há mais de 90 dias"/>
      )}
    </div>
  )
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface, borderRadius:16, width:520, maxWidth:'95vw', maxHeight:'88vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:T.surface, zIndex:1 }}>
          <span style={{ fontSize:15, fontWeight:700 }}>{title}</span>
          <button onClick={onClose} style={{ background:T.bg, border:'none', width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.t2 }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  )
}

function ClientForm({ onSuccess, onClose }) {
  const createClient = useCreateClient()
  const lookupCEP = useLookupCEP()
  const [form, setForm] = useState({ name:'', cpf:'', phone:'', email:'', cep:'', address:'', neighborhood:'', city:'', state:'' })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }

  const handleCEP = async (val) => {
    set('cep', val)
    const clean = val.replace(/\D/g,'')
    if (clean.length === 8) {
      try {
        const res = await lookupCEP.mutateAsync(clean)
        const d = res.data.data
        setForm(f=>({ ...f, address:d.address||'', neighborhood:d.neighborhood||'', city:d.city||'', state:d.state||'' }))
        toast.success('Endereço preenchido automaticamente!')
      } catch {}
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (!form.cpf) e.cpf = 'CPF obrigatório'
    else if (!validateCPF(form.cpf)) e.cpf = 'CPF inválido'
    if (!form.phone) e.phone = 'Telefone obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      await createClient.mutateAsync({
        name: form.name.trim(),
        cpf: form.cpf.replace(/\D/g,''),
        phone: form.phone.replace(/\D/g,''),
        email: form.email || null,
        cep: form.cep.replace(/\D/g,'') || null,
        address: form.address || null,
        neighborhood: form.neighborhood || null,
        city: form.city || null,
        state: form.state || null,
      })
      onSuccess?.()
    } catch {}
  }

  const inp = (err) => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${err ? '#DC2626' : T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box',
  })
  const lbl = (txt) => <label style={{ fontSize:12, fontWeight:500, color:T.t2, display:'block', marginBottom:6 }}>{txt}</label>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        {lbl('Nome completo *')}
        <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nome completo" style={inp(errors.name)}/>
        {errors.name && <span style={{ fontSize:11, color:'#DC2626', marginTop:3, display:'block' }}>{errors.name}</span>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          {lbl('CPF *')}
          <input value={form.cpf} onChange={e=>set('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} style={inp(errors.cpf)}/>
          {errors.cpf && <span style={{ fontSize:11, color:'#DC2626', marginTop:3, display:'block' }}>{errors.cpf}</span>}
        </div>
        <div>
          {lbl('Telefone *')}
          <input value={form.phone} onChange={e=>set('phone', formatPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} style={inp(errors.phone)}/>
          {errors.phone && <span style={{ fontSize:11, color:'#DC2626', marginTop:3, display:'block' }}>{errors.phone}</span>}
        </div>
      </div>
      <div>
        {lbl('E-mail')}
        <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="cliente@email.com" style={inp()}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'end' }}>
        <div>
          {lbl('CEP')}
          <input value={form.cep} onChange={e=>handleCEP(formatCEP(e.target.value))} placeholder="00000-000" maxLength={9} style={inp()}/>
        </div>
        {lookupCEP.isPending && <Loader2 size={16} style={{ color:T.accent, animation:'spin 1s linear infinite', marginBottom:10 }}/>}
      </div>
      <div>
        {lbl('Endereço')}
        <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Rua, número" style={inp()}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 60px', gap:14 }}>
        <div>
          {lbl('Bairro')}
          <input value={form.neighborhood} onChange={e=>set('neighborhood',e.target.value)} placeholder="Bairro" style={inp()}/>
        </div>
        <div>
          {lbl('Cidade')}
          <input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Cidade" style={inp()}/>
        </div>
        <div>
          {lbl('UF')}
          <input value={form.state} onChange={e=>set('state',e.target.value.toUpperCase())} placeholder="SP" maxLength={2} style={inp()}/>
        </div>
      </div>
      <div style={{ display:'flex', gap:10, paddingTop:8, borderTop:`1px solid ${T.border}`, marginTop:4 }}>
        <button onClick={onClose} style={{ flex:1, padding:10, border:`1px solid ${T.borderS}`, borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, fontWeight:500, color:T.t2, fontFamily:'Instrument Sans,sans-serif' }}>
          Cancelar
        </button>
        <button onClick={handleSubmit} disabled={createClient.isPending} style={{ flex:2, padding:10, background:T.text, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'Instrument Sans,sans-serif' }}>
          {createClient.isPending ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Salvando...</> : <><Check size={14}/> Salvar Cliente</>}
        </button>
      </div>
    </div>
  )
}

/* ── SortIcon ────────────────────────────────────────────── */
function SortIcon({ col, sort, order }) {
  if (sort !== col) return <ChevronsUpDown size={11} style={{ color:'#C4C4C4', marginLeft:3, flexShrink:0 }}/>
  return order === 'asc'
    ? <ChevronUp   size={11} style={{ color:T.accent, marginLeft:3, flexShrink:0 }}/>
    : <ChevronDown size={11} style={{ color:T.accent, marginLeft:3, flexShrink:0 }}/>
}

/* ── MetricCard ──────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
  return (
    <div style={{
      background:T.surface, borderRadius:12, padding:'16px 18px',
      boxShadow:T.shadow, display:'flex', alignItems:'center', gap:14, flex:1,
    }}>
      <div style={{ width:40, height:40, borderRadius:10, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={18} style={{ color:iconColor }}/>
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:700, color:T.text, letterSpacing:'-0.5px', lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:T.t3, marginTop:4 }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ── isInactive: sem atendimento há > 90 dias ou nunca ── */
const isInactive = (c) => {
  if (parseInt(c.total_orders) === 0) return true
  if (!c.last_order_date) return false
  const days = (Date.now() - new Date(c.last_order_date)) / 86400000
  return days > 90
}

/* ── exportCSV ───────────────────────────────────────────── */
function exportCSV(clients) {
  const headers = ['Nome','CPF','Telefone','E-mail','Cidade','UF','Atendimentos','Último atendimento']
  const rows = clients.map(c => [
    c.name,
    c.cpf_formatted || formatCPF(c.cpf),
    c.phone,
    c.email || '',
    c.city  || '',
    c.state || '',
    c.total_orders || 0,
    c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('pt-BR') : '—',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `clientes-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Lista exportada!')
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════ */
export default function ClientsPage() {
  const [search,   setSearch]   = useState('')
  const [page]                  = useState(1)
  const [showNew,  setShowNew]  = useState(false)
  const [selected, setSelected] = useState(null)
  const [sort,     setSort]     = useState('name')
  const [order,    setOrder]    = useState('asc')

  const { data, isLoading } = useClients({ search, page, limit:100, sort, order })
  const clients = data?.data || []
  const meta    = data?.meta || {}

  /* métricas derivadas */
  const metrics = useMemo(() => {
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
    return {
      total:    meta.total || 0,
      newMonth: clients.filter(c => new Date(c.created_at) >= thisMonth).length,
      inactive: clients.filter(isInactive).length,
    }
  }, [clients, meta.total])

  /* sort handler */
  const handleSort = (col) => {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSort(col); setOrder('asc') }
  }

  const thStyle = (col, pl = '14px') => ({
    padding:`10px ${pl}`, textAlign:'left', fontSize:10, fontWeight:600,
    color: sort === col ? T.accent : T.t3,
    letterSpacing:'0.5px', textTransform:'uppercase',
    cursor: col ? 'pointer' : 'default', userSelect:'none', whiteSpace:'nowrap',
  })

  const COLS = [
    { key:'name',         label:'Cliente',        pl:'22px' },
    { key:null,           label:'Contato',        pl:'14px' },
    { key:'city',         label:'Cidade',         pl:'14px' },
    { key:'total_orders', label:'Atendimentos',   pl:'14px' },
    { key:null,           label:'',               pl:'14px' },
  ]

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap:16, fontFamily:'Instrument Sans,sans-serif' }}>

        {/* ── Métricas ── */}
        <div style={{ display:'flex', gap:12 }}>
          <MetricCard
            icon={Users} label="Total de clientes" value={metrics.total}
            sub="na base de dados"
            iconBg="#EEF4FF" iconColor="#0A66FF"
          />
          <MetricCard
            icon={UserPlus} label="Novos este mês" value={metrics.newMonth}
            sub="cadastros no mês atual"
            iconBg="#F0FDF4" iconColor="#16A34A"
          />
          <MetricCard
            icon={AlertTriangle} label="Inativos" value={metrics.inactive}
            sub="sem atendimento +90 dias"
            iconBg="#FFFBEB" iconColor="#D97706"
          />
        </div>

        {/* ── Busca + ações ── */}
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, maxWidth:340 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.t3 }}/>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF, telefone..."
              style={{ width:'100%', padding:'9px 12px 9px 32px', border:`1px solid ${T.borderS}`, borderRadius:9, fontSize:13, color:T.text, background:T.surface, fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box' }}
            />
          </div>

          {/* Exportar CSV */}
          <button
            onClick={() => exportCSV(clients)}
            disabled={clients.length === 0}
            title="Exportar lista em CSV"
            style={{
              display:'flex', alignItems:'center', gap:6, padding:'9px 14px',
              background:T.surface, color:T.t2, border:`1px solid ${T.borderS}`,
              borderRadius:9, fontSize:13, fontWeight:500, cursor: clients.length ? 'pointer' : 'default',
              fontFamily:'Instrument Sans,sans-serif', opacity: clients.length ? 1 : 0.4,
              transition:'background .15s',
            }}
            onMouseEnter={e => { if (clients.length) e.currentTarget.style.background = T.bg }}
            onMouseLeave={e => { e.currentTarget.style.background = T.surface }}
          >
            <Download size={13}/> Exportar
          </button>

          {/* Novo Cliente */}
          <button
            onClick={()=>setShowNew(true)}
            style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              background:'#1A7A4A', color:'#fff', border:'none', borderRadius:9,
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Instrument Sans,sans-serif',
              boxShadow:'0 2px 8px rgba(26,122,74,0.28)', transition:'background .15s, box-shadow .15s',
              whiteSpace:'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='#15693E'; e.currentTarget.style.boxShadow='0 4px 14px rgba(26,122,74,0.38)' }}
            onMouseLeave={e => { e.currentTarget.style.background='#1A7A4A'; e.currentTarget.style.boxShadow='0 2px 8px rgba(26,122,74,0.28)' }}
          >
            <Plus size={14}/> Novo Cliente
          </button>
        </div>

        {/* ── Tabela ── */}
        <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, overflow:'hidden' }}>
          <div style={{ padding:'12px 22px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:600, color:T.text }}>
              {meta.total || 0} cliente{meta.total !== 1 ? 's' : ''}
            </span>
            {metrics.inactive > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#B45309', background:'#FFFBEB', border:'1px solid #FDE68A', padding:'3px 10px', borderRadius:999 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#F59E0B', display:'inline-block' }}/>
                {metrics.inactive} cliente{metrics.inactive !== 1 ? 's' : ''} inativo{metrics.inactive !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {isLoading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, color:T.t2 }}>
              <Loader2 size={20} style={{ animation:'spin 1s linear infinite', marginRight:8 }}/> Carregando...
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, color:T.t3 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>👤</div>
              <div style={{ fontSize:14 }}>Nenhum cliente encontrado</div>
              <div style={{ fontSize:12, marginTop:4 }}>Cadastre o primeiro cliente clicando em "Novo Cliente"</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}`, background:'#FAFAFA' }}>
                    {COLS.map((col, i) => (
                      <th key={i}
                        onClick={() => col.key && handleSort(col.key)}
                        style={thStyle(col.key, i === 0 ? '22px' : '14px')}
                      >
                        <div style={{ display:'flex', alignItems:'center' }}>
                          {col.label}
                          {col.key && <SortIcon col={col.key} sort={sort} order={order}/>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => {
                    const inactive = isInactive(c)
                    return (
                      <tr key={c.id}
                        onClick={() => setSelected(c.id)}
                        style={{ borderBottom:`1px solid ${T.border}`, cursor:'pointer', transition:'background .1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Cliente */}
                        <td style={{ padding:'13px 22px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <Avatar name={c.name} size={34} inactive={inactive}/>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{c.name}</div>
                              <div style={{ fontSize:11, color:T.t3, fontFamily:'JetBrains Mono,monospace', marginTop:1 }}>
                                {c.cpf_formatted || formatCPF(c.cpf)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contato */}
                        <td style={{ padding:'13px 14px' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                            <span style={{ fontSize:12, display:'flex', alignItems:'center', gap:5, color:T.t2 }}>
                              <Phone size={10}/>{c.phone}
                            </span>
                            {c.email && (
                              <span style={{ fontSize:12, display:'flex', alignItems:'center', gap:5, color:T.t2 }}>
                                <Mail size={10}/>{c.email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cidade */}
                        <td style={{ padding:'13px 14px', fontSize:12, color:T.t2 }}>
                          {c.city && (
                            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <MapPin size={10}/>{c.city}/{c.state}
                            </span>
                          )}
                        </td>

                        {/* Atendimentos */}
                        <td style={{ padding:'13px 14px' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                            <span style={{
                              background: parseInt(c.total_orders) > 0 ? '#EEF4FF' : '#F3F4F6',
                              color: parseInt(c.total_orders) > 0 ? T.accent : T.t3,
                              fontSize:12, fontWeight:600,
                              padding:'3px 10px', borderRadius:999,
                              display:'inline-block', width:'fit-content',
                            }}>
                              {c.total_orders || 0}
                            </span>
                            {c.last_order_date && (
                              <span style={{ fontSize:10, color:T.t3 }}>
                                último: {new Date(c.last_order_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {inactive && (
                              <span style={{ fontSize:10, color:'#B45309', display:'flex', alignItems:'center', gap:3 }}>
                                <span style={{ width:5, height:5, borderRadius:'50%', background:'#F59E0B', display:'inline-block', flexShrink:0 }}/>
                                inativo
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Chevron */}
                        <td style={{ padding:'13px 14px 13px 0', textAlign:'right', color:T.t3 }}>
                          <ChevronRight size={14}/>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showNew} onClose={()=>setShowNew(false)} title="Novo Cliente">
        <ClientForm onSuccess={()=>setShowNew(false)} onClose={()=>setShowNew(false)}/>
      </Modal>

      {selected && (
        <ClientHistory clientId={selected} onClose={()=>setSelected(null)}/>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

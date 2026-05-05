import { useState } from 'react'
import { useClients, useCreateClient, useLookupCEP } from '../hooks/useData'
import { Search, Plus, ChevronRight, Phone, Mail, MapPin, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { formatCPF, formatPhone, formatCEP, displayCurrency, getInitials, getAvatarColor } from '../utils/formatters'
import { validateCPF } from '../utils/validators'
import toast from 'react-hot-toast'
import ClientHistory from '../components/ClientHistory'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', borderS:'rgba(0,0,0,0.12)',
  text:'#0C0C0E', t2:'#6B7280', t3:'#9CA3AF', bg:'#F7F7F8',
  accent:'#0A66FF', accentL:'#EEF4FF', green:'#16A34A', greenBg:'#F0FDF4',
  amber:'#D97706', amberBg:'#FFFBEB', shadow:'0 1px 2px rgba(0,0,0,0.05),0 0 0 1px rgba(0,0,0,0.06)',
}

function Avatar({ name, size=34 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:getAvatarColor(name), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:size*0.34, fontWeight:600, flexShrink:0 }}>
      {getInitials(name)}
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

  const inputStyle = (err) => ({
    width:'100%', padding:'9px 12px', border:`1px solid ${err ? '#DC2626' : T.borderS}`,
    borderRadius:8, fontSize:13, color:T.text, background:T.surface,
    fontFamily:'Instrument Sans,sans-serif', outline:'none',
  })

  const label = (txt) => <label style={{ fontSize:12, fontWeight:500, color:T.t2, display:'block', marginBottom:6 }}>{txt}</label>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        {label('Nome completo *')}
        <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nome completo" style={inputStyle(errors.name)}/>
        {errors.name && <span style={{ fontSize:11, color:'#DC2626', marginTop:3, display:'block' }}>{errors.name}</span>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          {label('CPF *')}
          <input value={form.cpf} onChange={e=>set('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} style={inputStyle(errors.cpf)}/>
          {errors.cpf && <span style={{ fontSize:11, color:'#DC2626', marginTop:3, display:'block' }}>{errors.cpf}</span>}
        </div>
        <div>
          {label('Telefone *')}
          <input value={form.phone} onChange={e=>set('phone', formatPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} style={inputStyle(errors.phone)}/>
          {errors.phone && <span style={{ fontSize:11, color:'#DC2626', marginTop:3, display:'block' }}>{errors.phone}</span>}
        </div>
      </div>

      <div>
        {label('E-mail')}
        <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="cliente@email.com" style={inputStyle()}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'end' }}>
        <div>
          {label('CEP')}
          <input value={form.cep} onChange={e=>handleCEP(formatCEP(e.target.value))} placeholder="00000-000" maxLength={9} style={inputStyle()}/>
        </div>
        {lookupCEP.isPending && <Loader2 size={16} style={{ color:T.accent, animation:'spin 1s linear infinite', marginBottom:10 }}/>}
      </div>

      <div>
        {label('Endereço')}
        <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Rua, número" style={inputStyle()}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 60px', gap:14 }}>
        <div>
          {label('Bairro')}
          <input value={form.neighborhood} onChange={e=>set('neighborhood',e.target.value)} placeholder="Bairro" style={inputStyle()}/>
        </div>
        <div>
          {label('Cidade')}
          <input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Cidade" style={inputStyle()}/>
        </div>
        <div>
          {label('UF')}
          <input value={form.state} onChange={e=>set('state',e.target.value.toUpperCase())} placeholder="SP" maxLength={2} style={inputStyle()}/>
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

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [page] = useState(1)
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useClients({ search, page, limit:20 })
  const clients = data?.data || []
  const meta = data?.meta || {}

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap:16, fontFamily:'Instrument Sans,sans-serif' }}>
        {/* Search + New */}
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, maxWidth:320 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.t3 }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, CPF, telefone..." style={{ width:'100%', padding:'8px 12px 8px 30px', border:`1px solid ${T.borderS}`, borderRadius:8, fontSize:13, color:T.text, background:T.surface, fontFamily:'Instrument Sans,sans-serif', outline:'none' }}/>
          </div>
          <button onClick={()=>setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:T.text, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Instrument Sans,sans-serif' }}>
            <Plus size={14}/> Novo Cliente
          </button>
        </div>

        {/* Table */}
        <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, overflow:'hidden' }}>
          <div style={{ padding:'14px 22px 12px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{meta.total || 0} cliente{meta.total !== 1 ? 's' : ''}</span>
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
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    {['Cliente','Contato','Cidade','Atendimentos',''].map((h,i)=>(
                      <th key={i} style={{ padding:`10px ${i===0?'22px':'14px'}`, textAlign:'left', fontSize:10, fontWeight:600, color:T.t3, letterSpacing:'0.5px', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c=>(
                    <tr key={c.id} onClick={()=>setSelected(c.id)} style={{ borderBottom:`1px solid ${T.border}`, cursor:'pointer', transition:'background .1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'14px 22px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <Avatar name={c.name} size={34}/>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                            <div style={{ fontSize:11, color:T.t3, fontFamily:'JetBrains Mono,monospace', marginTop:1 }}>{c.cpf_formatted || formatCPF(c.cpf)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'14px' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                          <span style={{ fontSize:12, display:'flex', alignItems:'center', gap:5, color:T.t2 }}><Phone size={11}/>{c.phone}</span>
                          {c.email && <span style={{ fontSize:12, display:'flex', alignItems:'center', gap:5, color:T.t2 }}><Mail size={11}/>{c.email}</span>}
                        </div>
                      </td>
                      <td style={{ padding:'14px', fontSize:12, color:T.t2 }}>
                        {c.city && <span style={{ display:'flex', alignItems:'center', gap:5 }}><MapPin size={11}/>{c.city}/{c.state}</span>}
                      </td>
                      <td style={{ padding:'14px' }}>
                        <span style={{ background:T.accentL, color:T.accent, fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:999 }}>{c.total_orders||0}</span>
                      </td>
                      <td style={{ padding:'14px 14px 14px 0', textAlign:'right', color:T.t3 }}><ChevronRight size={14}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Client Modal */}
      <Modal open={showNew} onClose={()=>setShowNew(false)} title="Novo Cliente">
        <ClientForm onSuccess={()=>setShowNew(false)} onClose={()=>setShowNew(false)}/>
      </Modal>

      {/* Client History — premium drawer */}
      {selected && (
        <ClientHistory clientId={selected} onClose={()=>setSelected(null)}/>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

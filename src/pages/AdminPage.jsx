import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import {
  Users, Smartphone, Plus, Pencil, Check, X, Eye, EyeOff,
  ShieldCheck, ShieldOff, Key, ChevronDown, Loader2,
  UserCircle, Crown, Briefcase, Database, Send, CheckCircle2, AlertCircle,
  Package, Upload, Trash2, ChevronUp, RefreshCw,
} from 'lucide-react'
import {
  useAdminUsers, useAdminModels,
  useCreateUser, useUpdateUser, useResetPassword,
  useCreateModel, useUpdateModel,
  useAdminInventory, useCreateInventory, useUpdateInventory,
  useDeleteInventory, useImportInventory,
} from '../hooks/useData'
import api from '../services/api'

// ── Constantes ────────────────────────────────────────────────
const ALL_CAPACITIES = ['16GB','32GB','64GB','128GB','256GB','512GB','1TB']

const ROLE_META = {
  admin:    { label:'Admin',    icon:Crown,    color:'#D97706', bg:'#FEF3C7' },
  gerente:  { label:'Gerente',  icon:Briefcase,color:'#2563EB', bg:'#DBEAFE' },
  vendedor: { label:'Vendedor', icon:UserCircle,color:'#6B7280', bg:'#F3F4F6' },
}

const inp = (err, T) => ({
  width:'100%', padding:'10px 12px', border:`1.5px solid ${err ? '#EF4444' : T.ink5}`,
  borderRadius:9, fontSize:13, color:T.ink, background:T.surface,
  fontFamily:'Instrument Sans,sans-serif', outline:'none', boxSizing:'border-box',
  transition:'border-color .15s',
})

// ── Componentes auxiliares ────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
      letterSpacing:'0.7px', marginBottom:10 }}>{children}</div>
  )
}

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.vendedor
  const Icon = m.icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px',
      borderRadius:999, background:m.bg, color:m.color, fontSize:11, fontWeight:600 }}>
      <Icon size={11}/>{m.label}
    </span>
  )
}

// ── Modal de usuário ──────────────────────────────────────────
function UserModal({ user, onClose, T }) {
  const isEdit = !!user
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const resetPw    = useResetPassword()

  const [form, setForm]   = useState({
    name:     user?.name  || '',
    email:    user?.email || '',
    role:     user?.role  || 'vendedor',
    password: '',
  })
  const [showPw, setShowPw]   = useState(false)
  const [newPw,  setNewPw]    = useState('')
  const [showNew, setShowNew] = useState(false)
  const [errors, setErrors]   = useState({})

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Nome obrigatório'
    if (!form.email.trim()) e.email = 'E-mail obrigatório'
    if (!isEdit && form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    if (isEdit) {
      await updateUser.mutateAsync({ id: user.id, data: { name:form.name, role:form.role } })
    } else {
      await createUser.mutateAsync(form)
    }
    onClose()
  }

  const handleReset = async () => {
    if (newPw.length < 6) return
    await resetPw.mutateAsync({ id: user.id, password: newPw })
    setNewPw('')
  }

  const busy = createUser.isPending || updateUser.isPending

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(5px)',
      zIndex:1600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.bg, borderRadius:18, width:'100%', maxWidth:440,
        boxShadow:'0 24px 80px rgba(0,0,0,0.25)', fontFamily:'Instrument Sans,sans-serif',
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ background:'#0C0C0E', padding:'18px 20px', display:'flex',
          alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={16} style={{ color:'#fff' }}/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
                {isEdit ? 'Editar usuário' : 'Novo usuário'}
              </div>
              {isEdit && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{user.email}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none',
            borderRadius:8, width:30, height:30, cursor:'pointer', color:'rgba(255,255,255,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        <div style={{ padding:'20px 20px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Dados */}
          <div style={{ background:T.surface, borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
            <SectionTitle>Dados</SectionTitle>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Nome completo</div>
              <input value={form.name} onChange={e=>set('name',e.target.value)}
                placeholder="Ex: João Silva" style={inp(errors.name, T)}/>
              {errors.name && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.name}</div>}
            </div>
            {!isEdit && (
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>E-mail</div>
                <input value={form.email} onChange={e=>set('email',e.target.value)}
                  type="email" placeholder="email@acessphones.com" style={inp(errors.email, T)}/>
                {errors.email && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.email}</div>}
              </div>
            )}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Função</div>
              <div style={{ display:'flex', gap:8 }}>
                {Object.entries(ROLE_META).map(([r, m]) => {
                  const Icon = m.icon
                  const active = form.role === r
                  return (
                    <button key={r} onClick={()=>set('role',r)} style={{
                      flex:1, padding:'10px 8px', borderRadius:9, cursor:'pointer',
                      border:`1.5px solid ${active ? m.color : T.ink5}`,
                      background: active ? m.bg : T.surface,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      transition:'all .15s', fontFamily:'Instrument Sans,sans-serif',
                    }}>
                      <Icon size={14} style={{ color: active ? m.color : '#9CA3AF' }}/>
                      <span style={{ fontSize:11, fontWeight: active ? 700 : 400,
                        color: active ? m.color : '#6B7280' }}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            {!isEdit && (
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Senha inicial</div>
                <div style={{ position:'relative' }}>
                  <input value={form.password} onChange={e=>set('password',e.target.value)}
                    type={showPw?'text':'password'} placeholder="Mínimo 6 caracteres"
                    style={{...inp(errors.password, T), paddingRight:40}}/>
                  <button onClick={()=>setShowPw(s=>!s)} style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#9CA3AF',
                    display:'flex', alignItems:'center',
                  }}>
                    {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
                {errors.password && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.password}</div>}
              </div>
            )}
          </div>

          {/* Reset de senha (somente edição) */}
          {isEdit && (
            <div style={{ background:T.surface, borderRadius:12, padding:'16px' }}>
              <SectionTitle>Redefinir senha</SectionTitle>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ position:'relative', flex:1 }}>
                  <input value={newPw} onChange={e=>setNewPw(e.target.value)}
                    type={showNew?'text':'password'} placeholder="Nova senha (mín. 6 chars)"
                    style={inp(false, T)}/>
                  <button onClick={()=>setShowNew(s=>!s)} style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#9CA3AF',
                    display:'flex', alignItems:'center',
                  }}>
                    {showNew ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
                <button onClick={handleReset} disabled={newPw.length < 6 || resetPw.isPending}
                  style={{ padding:'10px 14px', background: newPw.length>=6 ? '#0C0C0E' : T.ink6,
                    color: newPw.length>=6 ? '#fff' : T.ink4, border:'none', borderRadius:9,
                    cursor: newPw.length>=6 ? 'pointer' : 'default', fontSize:12, fontWeight:600,
                    display:'flex', alignItems:'center', gap:5, fontFamily:'Instrument Sans,sans-serif',
                    flexShrink:0,
                  }}>
                  {resetPw.isPending ? <Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/> : <Key size={12}/>}
                  Redefinir
                </button>
              </div>
            </div>
          )}

          {/* Ações */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'11px 18px', border:`1px solid ${T.ink5}`,
              borderRadius:9, background:T.surface, cursor:'pointer', fontSize:13, fontWeight:500,
              color:T.ink3, fontFamily:'Instrument Sans,sans-serif' }}>Cancelar</button>
            <button onClick={handleSave} disabled={busy} style={{ flex:1, padding:'11px 18px',
              background:'#0C0C0E', color:'#fff', border:'none', borderRadius:9, cursor:busy?'not-allowed':'pointer',
              fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              fontFamily:'Instrument Sans,sans-serif', opacity: busy ? 0.7 : 1 }}>
              {busy ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : <Check size={14}/>}
              {isEdit ? 'Salvar alterações' : 'Criar usuário'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Modal de modelo ───────────────────────────────────────────
function ModelModal({ model, onClose, T, defaultCategory = 'iphone' }) {
  const isEdit    = !!model
  const createMdl = useCreateModel()
  const updateMdl = useUpdateModel()

  const [category,     setCategory]     = useState(model?.category || defaultCategory)
  const [name,         setName]         = useState(model?.name   || '')
  const [series,       setSeries]       = useState(model?.series  || '')
  const [year,         setYear]         = useState(model?.year    || new Date().getFullYear())
  const [caps,         setCaps]         = useState(model?.capacities || [])
  const [suggestedPrice, setSuggestedPrice] = useState(model?.suggested_price || '')
  const [errors,       setErrors]       = useState({})

  const isIphone = category === 'iphone'

  const toggleCap = (c) =>
    setCaps(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c])

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (isIphone) {
      if (!series.trim()) e.series = 'Série obrigatória'
      if (!caps.length)   e.caps   = 'Selecione ao menos uma capacidade'
    }
    setErrors(e); return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    const payload = {
      name: name.trim(), category,
      series: isIphone ? series.trim() : undefined,
      year:   isIphone ? parseInt(year) : undefined,
      capacities: isIphone ? caps : [],
      suggested_price: suggestedPrice ? parseFloat(String(suggestedPrice).replace(',','.')) : undefined,
    }
    if (isEdit) { await updateMdl.mutateAsync({ id: model.id, data: payload }) }
    else        { await createMdl.mutateAsync(payload) }
    onClose()
  }

  const busy = createMdl.isPending || updateMdl.isPending

  const CAT_OPTS = [
    { v:'iphone',    l:'iPhone',    emoji:'📱' },
    { v:'acessorio', l:'Acessório', emoji:'🛡️' },
    { v:'outro',     l:'Outro produto Apple', emoji:'⌚' },
  ]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(5px)',
      zIndex:1600, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.bg, borderRadius:18, width:'100%', maxWidth:460,
        boxShadow:'0 24px 80px rgba(0,0,0,0.25)', fontFamily:'Instrument Sans,sans-serif',
        overflow:'hidden', maxHeight:'93vh', display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{ background:'#0C0C0E', padding:'18px 20px', display:'flex',
          alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'rgba(10,102,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Smartphone size={16} style={{ color:'#60A5FA' }}/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
              {isEdit ? `Editar — ${model.name}` : 'Novo item no catálogo'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none',
            borderRadius:8, width:30, height:30, cursor:'pointer', color:'rgba(255,255,255,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        <div style={{ overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Categoria */}
          {!isEdit && (
            <div style={{ background:T.surface, borderRadius:12, padding:'16px' }}>
              <SectionTitle>Categoria</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                {CAT_OPTS.map(opt => {
                  const on = category === opt.v
                  return (
                    <button key={opt.v} onClick={() => setCategory(opt.v)} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      borderRadius:9, border:`1.5px solid ${on ? '#0C0C0E' : T.ink5}`,
                      background: on ? '#0C0C0E' : T.surface, cursor:'pointer', textAlign:'left',
                      fontFamily:'Instrument Sans,sans-serif', transition:'all .15s',
                    }}>
                      <span style={{ fontSize:16 }}>{opt.emoji}</span>
                      <span style={{ fontSize:13, fontWeight: on ? 700 : 500,
                        color: on ? '#fff' : T.ink }}>{opt.l}</span>
                      {on && <Check size={13} style={{ color:'#fff', marginLeft:'auto' }}/>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Identificação */}
          <div style={{ background:T.surface, borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
            <SectionTitle>Identificação</SectionTitle>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Nome</div>
              <input value={name} onChange={e=>{setName(e.target.value);setErrors(v=>({...v,name:''}))}}
                placeholder={isIphone ? 'Ex: iPhone 17 Pro Max' : 'Ex: Película 3D, Apple Watch Ultra 3'}
                style={inp(errors.name, T)}/>
              {errors.name && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.name}</div>}
            </div>

            {/* Série e Ano — só para iPhones */}
            {isIphone && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Série</div>
                  <input value={series} onChange={e=>{setSeries(e.target.value);setErrors(v=>({...v,series:''}))}}
                    placeholder="Ex: 17" style={inp(errors.series, T)}/>
                  {errors.series && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.series}</div>}
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Ano</div>
                  <input value={year} onChange={e=>setYear(e.target.value)}
                    type="number" min="2007" max="2035" style={inp(false, T)}/>
                </div>
              </div>
            )}

            {/* Preço sugerido — para acessórios e outros */}
            {!isIphone && (
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>
                  Preço sugerido <span style={{ fontWeight:400, color:'#9CA3AF' }}>(opcional)</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, ...inp(false, T),
                  padding:'10px 12px' }}>
                  <span style={{ fontSize:13, color:'#6B7280' }}>R$</span>
                  <input value={suggestedPrice}
                    onChange={e => setSuggestedPrice(e.target.value.replace(/[^0-9,\.]/g,''))}
                    placeholder="0,00"
                    style={{ border:'none', outline:'none', fontSize:13, fontWeight:600,
                      background:'transparent', fontFamily:'JetBrains Mono,monospace',
                      color:T.ink, width:'100%' }}/>
                </div>
                <div style={{ fontSize:11, color:'#9CA3AF', marginTop:3 }}>
                  Aparece como sugestão na venda — pode ser alterado na hora
                </div>
              </div>
            )}
          </div>

          {/* Capacidades — só para iPhones */}
          {isIphone && (
            <div style={{ background:T.surface, borderRadius:12, padding:'16px' }}>
              <SectionTitle>Capacidades disponíveis</SectionTitle>
              {errors.caps && <div style={{ fontSize:11, color:'#EF4444', marginBottom:8 }}>{errors.caps}</div>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {ALL_CAPACITIES.map(c => {
                  const on = caps.includes(c)
                  return (
                    <button key={c} onClick={()=>{toggleCap(c);setErrors(v=>({...v,caps:''}))}}
                      style={{ padding:'9px 18px', borderRadius:9,
                        border:`1.5px solid ${on ? '#0C0C0E' : T.ink5}`,
                        background: on ? '#0C0C0E' : T.surface,
                        color: on ? '#fff' : T.ink3,
                        fontSize:13, fontWeight: on ? 700 : 400,
                        cursor:'pointer', transition:'all .15s',
                        fontFamily:'Instrument Sans,sans-serif',
                        display:'flex', alignItems:'center', gap:5,
                      }}>
                      {on && <Check size={11}/>}{c}
                    </button>
                  )
                })}
              </div>
              {caps.length > 0 && (
                <div style={{ marginTop:10, fontSize:11, color:'#6B7280' }}>
                  {caps.length} capacidade{caps.length>1?'s':''} selecionada{caps.length>1?'s':''}:&nbsp;
                  <strong style={{ color:T.ink }}>{caps.join(', ')}</strong>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'11px 18px', border:`1px solid ${T.ink5}`,
              borderRadius:9, background:T.surface, cursor:'pointer', fontSize:13, fontWeight:500,
              color:T.ink3, fontFamily:'Instrument Sans,sans-serif' }}>Cancelar</button>
            <button onClick={handleSave} disabled={busy} style={{ flex:1, padding:'11px 18px',
              background:'linear-gradient(135deg,#0A66FF,#0047CC)', color:'#fff', border:'none',
              borderRadius:9, cursor:busy?'not-allowed':'pointer',
              fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              fontFamily:'Instrument Sans,sans-serif', opacity: busy ? 0.7 : 1 }}>
              {busy ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : <Check size={14}/>}
              {isEdit ? 'Salvar' : 'Adicionar ao catálogo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────


// ── Restore Panel ─────────────────────────────────────────────
function RestorePanel({ T }) {
  const [file,        setFile]        = useState(null)
  const [parsed,      setParsed]      = useState(null)   // { exportedAt, tables:{...} }
  const [parseErr,    setParseErr]    = useState('')
  const [selTables,   setSelTables]   = useState([])
  const [mode,        setMode]        = useState('missing_only')
  const [confirm,     setConfirm]     = useState(false)
  const [status,      setStatus]      = useState(null)   // null|'loading'|'ok'|'error'
  const [results,     setResults]     = useState(null)
  const [errMsg,      setErrMsg]      = useState('')

  const TABLE_LABELS = { users:'Usuários', clients:'Clientes', service_orders:'Ordens de serviço' }

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setParsed(null); setParseErr(''); setSelTables([])
    setStatus(null); setResults(null); setConfirm(false)
    try {
      let text
      if (f.name.endsWith('.gz')) {
        const buf    = await f.arrayBuffer()
        const stream = new DecompressionStream('gzip')
        const writer = stream.writable.getWriter()
        writer.write(buf); writer.close()
        const out    = await new Response(stream.readable).arrayBuffer()
        text         = new TextDecoder().decode(out)
      } else {
        text = await f.text()
      }
      const json = JSON.parse(text)
      if (!json.tables) throw new Error('Arquivo inválido — campo "tables" não encontrado.')
      setParsed(json)
      setSelTables(Object.keys(json.tables).filter(t => ['users','clients','service_orders'].includes(t)))
    } catch (err) {
      setParseErr(err.message || 'Erro ao ler o arquivo.')
    }
  }

  const toggleTable = (t) =>
    setSelTables(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const doRestore = async () => {
    setConfirm(false); setStatus('loading'); setResults(null); setErrMsg('')
    try {
      const { data } = await api.post('/admin/backup/restore', {
        data:   parsed.tables,
        tables: selTables,
        mode,
      }, { timeout: 120000 })  // 2 min — backup completo pode ter 6k+ registros
      setResults(data.results)
      setStatus('ok')
    } catch (err) {
      setErrMsg(err?.response?.data?.error || err.message || 'Erro desconhecido')
      setStatus('error')
    }
  }

  const totalInserted = results ? Object.values(results).reduce((a,r) => a + r.inserted, 0) : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:4 }}>

      {/* Upload */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', boxSizing:'border-box', width:'100%' }}>
        <div style={{ padding:'16px 18px', borderBottom:'1px solid #F3F4F6' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Restaurar backup</div>
          <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>
            Selecione um arquivo <strong>.json</strong> ou <strong>.json.gz</strong> gerado pelo sistema
          </div>
        </div>
        <div style={{ padding:'14px 18px' }}>
          <label style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'100%', boxSizing:'border-box', padding:'12px 16px',
            borderRadius:10, border:'2px dashed #D1D5DB', cursor:'pointer',
            background:'#F9FAFB', fontSize:13, fontWeight:600, color:'#374151',
            fontFamily:'Instrument Sans,sans-serif', transition:'all .15s',
          }}>
            <Database size={15}/>
            {file ? file.name : 'Selecionar arquivo de backup'}
            <input type="file" accept=".json,.gz" onChange={handleFile}
              style={{ display:'none' }}/>
          </label>
        </div>
      </div>

      {/* Parse error */}
      {parseErr && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12,
          padding:'12px 16px', display:'flex', gap:8, alignItems:'flex-start' }}>
          <AlertCircle size={16} style={{ color:'#DC2626', flexShrink:0, marginTop:1 }}/>
          <div style={{ fontSize:12, color:'#B91C1C' }}>{parseErr}</div>
        </div>
      )}

      {/* Preview do arquivo */}
      {parsed && (
        <>
          {/* Info do backup */}
          <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:12,
            padding:'12px 16px', fontSize:12, color:'#0369A1' }}>
            📅 Backup de <strong>{new Date(parsed.exportedAt).toLocaleString('pt-BR', { timeZone:'America/Sao_Paulo' })}</strong>
          </div>

          {/* Seleção de tabelas */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB',
            overflow:'hidden', boxSizing:'border-box', width:'100%' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid #F3F4F6',
              fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.7px' }}>
              Tabelas para restaurar
            </div>
            {Object.entries(parsed.tables)
              .filter(([t]) => ['users','clients','service_orders'].includes(t))
              .map(([t, rows]) => {
                const sel = selTables.includes(t)
                return (
                  <button key={t} onClick={() => toggleTable(t)} style={{
                    display:'flex', alignItems:'center', gap:12, width:'100%',
                    padding:'12px 18px', border:'none', background: sel ? '#F0F9FF' : '#fff',
                    borderBottom:'1px solid #F3F4F6', cursor:'pointer', textAlign:'left',
                    fontFamily:'Instrument Sans,sans-serif', transition:'background .1s',
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:5, flexShrink:0,
                      border: `2px solid ${sel ? '#0891B2' : '#D1D5DB'}`,
                      background: sel ? '#0891B2' : '#fff',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {sel && <Check size={11} style={{ color:'#fff' }}/>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color: sel ? '#0369A1' : '#111827' }}>
                        {TABLE_LABELS[t] || t}
                      </div>
                      <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>
                        {rows.length.toLocaleString('pt-BR')} registros no backup
                      </div>
                    </div>
                  </button>
                )
              })}
          </div>

          {/* Modo de restauração */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB',
            overflow:'hidden', boxSizing:'border-box', width:'100%' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid #F3F4F6',
              fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.7px' }}>
              Modo de restauração
            </div>
            {[
              { v:'missing_only', label:'Apenas registros ausentes', desc:'Insere só o que não existe no banco — seguro, sem sobrescrever nada', safe:true },
              { v:'overwrite',    label:'Sobrescrever existentes',   desc:'Atualiza registros que já existem. Senhas de usuários nunca são alteradas', safe:false },
            ].map(opt => {
              const sel = mode === opt.v
              return (
                <button key={opt.v} onClick={() => setMode(opt.v)} style={{
                  display:'flex', alignItems:'flex-start', gap:12, width:'100%',
                  padding:'12px 18px', border:'none', background: sel ? (opt.safe ? '#F0FDF4' : '#FFFBEB') : '#fff',
                  borderBottom:'1px solid #F3F4F6', cursor:'pointer', textAlign:'left',
                  fontFamily:'Instrument Sans,sans-serif', transition:'background .1s',
                }}>
                  <div style={{
                    width:18, height:18, borderRadius:'50%', flexShrink:0, marginTop:1,
                    border: `2px solid ${sel ? (opt.safe ? '#16A34A' : '#D97706') : '#D1D5DB'}`,
                    background: sel ? (opt.safe ? '#16A34A' : '#D97706') : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {sel && <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }}/>}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600,
                      color: sel ? (opt.safe ? '#15803D' : '#B45309') : '#111827' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize:11, color:'#6B7280', marginTop:1, lineHeight:1.5 }}>{opt.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Botão restaurar */}
          {selTables.length > 0 && !confirm && status !== 'ok' && (
            <button onClick={() => setConfirm(true)} style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              width:'100%', boxSizing:'border-box', padding:'13px 16px',
              borderRadius:10, border:'none', cursor:'pointer',
              background: mode === 'overwrite' ? '#D97706' : '#15803D',
              color:'#fff', fontSize:13, fontWeight:700,
              fontFamily:'Instrument Sans,sans-serif', transition:'all .15s',
            }}>
              <Database size={15}/>
              Restaurar {selTables.length} {selTables.length === 1 ? 'tabela' : 'tabelas'}
            </button>
          )}

          {/* Confirmação */}
          {confirm && (
            <div style={{ background: mode === 'overwrite' ? '#FFFBEB' : '#F0FDF4',
              border: `1px solid ${mode === 'overwrite' ? '#FDE68A' : '#86EFAC'}`,
              borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontSize:13, fontWeight:700,
                color: mode === 'overwrite' ? '#92400E' : '#15803D', marginBottom:6 }}>
                {mode === 'overwrite' ? '⚠️ Confirmar restauração com sobrescrita?' : '✅ Confirmar restauração?'}
              </div>
              <div style={{ fontSize:12, color:'#374151', marginBottom:14, lineHeight:1.6 }}>
                Tabelas: <strong>{selTables.map(t => TABLE_LABELS[t]).join(', ')}</strong><br/>
                Modo: <strong>{mode === 'overwrite' ? 'Sobrescrever existentes' : 'Apenas registros ausentes'}</strong>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setConfirm(false)} style={{
                  flex:1, padding:'10px', borderRadius:8, border:'1px solid #D1D5DB',
                  background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer',
                  fontFamily:'Instrument Sans,sans-serif',
                }}>Cancelar</button>
                <button onClick={doRestore} style={{
                  flex:2, padding:'10px', borderRadius:8, border:'none',
                  background: mode === 'overwrite' ? '#D97706' : '#15803D',
                  color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
                  fontFamily:'Instrument Sans,sans-serif',
                }}>Confirmar restauração</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px',
          background:'#F8FAFC', borderRadius:12, border:'1px solid #E2E8F0' }}>
          <Loader2 size={18} style={{ color:'#6B7280', animation:'spin 1s linear infinite' }}/>
          <div style={{ fontSize:13, color:'#374151' }}>Restaurando dados...</div>
        </div>
      )}

      {/* Resultado OK */}
      {status === 'ok' && results && (
        <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:14, padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <CheckCircle2 size={18} style={{ color:'#16A34A' }}/>
            <div style={{ fontSize:14, fontWeight:700, color:'#15803D' }}>
              Restauração concluída — {totalInserted} registros inseridos
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {Object.entries(results).map(([t, r]) => (
              <div key={t} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                background:'#fff', borderRadius:8, padding:'8px 12px', border:'1px solid #BBF7D0' }}>
                <div style={{ fontSize:12, color:'#374151' }}>{TABLE_LABELS[t] || t}</div>
                <div style={{ display:'flex', gap:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#15803D' }}>+{r.inserted} inseridos</span>
                  <span style={{ fontSize:11, color:'#9CA3AF' }}>{r.skipped} ignorados</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultado ERRO */}
      {status === 'error' && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:14,
          padding:'16px 18px', display:'flex', gap:10, alignItems:'flex-start' }}>
          <AlertCircle size={18} style={{ color:'#DC2626', flexShrink:0, marginTop:1 }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#B91C1C', marginBottom:4 }}>Falha na restauração</div>
            <div style={{ fontSize:12, color:'#7F1D1D', fontFamily:'JetBrains Mono,monospace',
              background:'rgba(0,0,0,0.04)', padding:'6px 10px', borderRadius:6 }}>{errMsg}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Backup Panel ──────────────────────────────────────────────
function BackupPanel({ T }) {
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [errMsg, setErrMsg] = useState('')

  const runBackup = async () => {
    setStatus('loading'); setResult(null); setErrMsg('')
    try {
      const { data } = await api.post('/admin/backup/run')
      setResult(data); setStatus('ok')
    } catch (err) {
      setErrMsg(err?.response?.data?.error || err.message || 'Erro desconhecido')
      setStatus('error')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E5E7EB', overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'#0C0C0E', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Database size={16} style={{ color:'#fff' }}/>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Backup manual</div>
            <div style={{ fontSize:11, color:'#6B7280' }}>Exporta e envia para eddjpog@gmail.com</div>
          </div>
        </div>
        <div style={{ padding:'12px 16px' }}>
          <button
            onClick={runBackup}
            disabled={status === 'loading'}
            style={{
              display:'block', width:'100%', padding:'12px 0',
              borderRadius:10, border:'none',
              background: status === 'loading' ? '#E5E7EB' : '#0C0C0E',
              color: status === 'loading' ? '#9CA3AF' : '#fff',
              fontSize:13, fontWeight:700, textAlign:'center',
              fontFamily:'Instrument Sans,sans-serif',
              cursor: status === 'loading' ? 'wait' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Executando...' : '⬆ Executar backup agora'}
          </button>
        </div>
      </div>

      {status === 'ok' && result && (
        <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#15803D', marginBottom:6 }}>✅ Backup enviado!</div>
          <div style={{ fontSize:12, color:'#166534', lineHeight:1.7 }}>
            Arquivo: {result.fileName}<br/>
            Tamanho: {result.sizeKB} KB · Clientes: {result.rowCounts?.clients ?? '—'} · Ordens: {result.rowCounts?.service_orders ?? '—'}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, padding:'14px 16px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#B91C1C', marginBottom:4 }}>Falha no backup</div>
          <div style={{ fontSize:12, color:'#7F1D1D', fontFamily:'JetBrains Mono,monospace',
            background:'rgba(0,0,0,0.04)', padding:'6px 10px', borderRadius:6, wordBreak:'break-all' }}>{errMsg}</div>
        </div>
      )}

      <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:12,
        padding:'12px 14px', fontSize:11, color:'#6B7280', lineHeight:1.6 }}>
        🕒 <strong style={{ color:'#374151' }}>Backup automático às 03:00 BRT.</strong>{' '}
        Se o servidor reiniciar e o último backup tiver mais de 20h, um backup de recuperação é disparado automaticamente.
      </div>
    </div>
  )
}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAINEL DE ESTOQUE
// ─────────────────────────────────────────────────────────────

// Mapa de cores para indicadores visuais das cores de iPhones
const COLOR_MAP = {
  preto:       '#1C1C1E', 'preto meia-noite': '#1C1C1E', 'meia-noite': '#1C1C1E',
  branco:      '#F5F5F0', 'branco estelar': '#F5F5F0', estelar: '#F5F5F0',
  azul:        '#2C6EAC', 'azul sierra': '#4A90D9', 'azul alpino': '#5B9BD5',
  'azul titânio': '#4A7FA5', 'azul pacífico': '#2B5FA0',
  verde:       '#3A7D44', 'verde floresta': '#2E6B38', 'verde alpine': '#4E8C56',
  roxo:        '#7B5EA7', 'roxo intenso': '#6B4FA0',
  rosa:        '#F4A0B0', 'rosa areia': '#E8B4B8',
  vermelho:    '#C0392B', 'product red': '#C0392B',
  amarelo:     '#F5D547',
  laranja:     '#E8690B',
  dourado:     '#C5A84F', gold: '#C5A84F', 'ouro': '#C5A84F',
  prata:       '#A8A9AD', silver: '#A8A9AD',
  cinza:       '#8E8E93', 'cinza espacial': '#3A3A3C', 'cinza sideral': '#3A3A3C',
  natural:     '#C4B89A', 'titânio natural': '#C4B89A',
  'titânio preto': '#2C2C2E', 'titânio branco': '#E8E8E0',
  titânio:     '#8B8C8D', 'titânio azul': '#4A6FA5',
  desert:      '#C4A882', 'desert titanium': '#C4A882',
  'lilás':     '#BDA9D4', lilas: '#BDA9D4',
  'marsala':   '#955251',
  coral:       '#FF7F7F',
  'midnight':  '#1C1C1E',
}

function colorDot(colorName) {
  const key = (colorName || '').toLowerCase().trim()
  // Busca exata primeiro, depois parcial
  let hex = COLOR_MAP[key]
  if (!hex) {
    for (const [k, v] of Object.entries(COLOR_MAP)) {
      if (key.includes(k) || k.includes(key)) { hex = v; break }
    }
  }
  if (!hex) hex = '#9CA3AF' // cinza fallback
  const isLight = hex === '#F5F5F0' || hex === '#E8E8E0' || hex === '#F5D547' || hex === '#C4B89A' || hex === '#C4A882'
  return { hex, isLight }
}

function BatteryBar({ value }) {
  if (!value) return <span style={{ fontSize:11, color:'#9CA3AF' }}>—</span>
  const color = value >= 95 ? '#12A150' : value >= 85 ? '#D97706' : '#EF4444'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <div style={{ width:36, height:5, background:'#E5E7EB', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${value}%`, height:'100%', background:color, borderRadius:99, transition:'width .3s' }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, fontFamily:'JetBrains Mono,monospace' }}>{value}%</span>
    </div>
  )
}

function QtyBadge({ qty }) {
  const bg = qty === 0 ? '#FEE2E2' : qty <= 2 ? '#FEF3C7' : '#DCFCE7'
  const color = qty === 0 ? '#B91C1C' : qty <= 2 ? '#D97706' : '#15803D'
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      minWidth:26, height:22, padding:'0 6px', borderRadius:6,
      background:bg, color, fontSize:11, fontWeight:700,
      fontFamily:'JetBrains Mono,monospace',
    }}>{qty}</span>
  )
}

// Modal de criação/edição de item de estoque
function InventoryItemModal({ item, onClose, T }) {
  const isEdit = !!item?.id
  const create = useCreateInventory()
  const update = useUpdateInventory()

  const [form, setForm] = useState({
    model_name:     item?.model_name     || '',
    capacity:       item?.capacity       || '',
    color:          item?.color          || '',
    quantity:       item?.quantity       ?? 1,
    battery_health: item?.battery_health || '',
    condition:      item?.condition      || 'seminovo',
    price_override: item?.price_override || '',
    notes:          item?.notes          || '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({...f,[k]:v})); setErrors(e=>({...e,[k]:''})) }

  const validate = () => {
    const e = {}
    if (!form.model_name.trim()) e.model_name = 'Modelo obrigatório'
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) e.quantity = 'Quantidade inválida'
    if (form.battery_health !== '' && (isNaN(form.battery_health) || form.battery_health < 1 || form.battery_health > 100)) e.battery_health = '1–100'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    const payload = {
      model_name:     form.model_name.trim(),
      capacity:       form.capacity.trim(),
      color:          form.color.trim(),
      quantity:       Number(form.quantity),
      battery_health: form.battery_health !== '' ? Number(form.battery_health) : undefined,
      condition:      form.condition,
      price_override: form.price_override !== '' ? parseFloat(String(form.price_override).replace(',','.')) : undefined,
      notes:          form.notes.trim() || undefined,
    }
    if (isEdit) { await update.mutateAsync({ id: item.id, data: payload }) }
    else        { await create.mutateAsync(payload) }
    onClose()
  }

  const busy = create.isPending || update.isPending
  const { hex: dotHex, isLight } = colorDot(form.color)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(5px)',
      zIndex:1700, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.bg, borderRadius:18, width:'100%', maxWidth:460,
        boxShadow:'0 24px 80px rgba(0,0,0,0.3)', fontFamily:'Instrument Sans,sans-serif',
        overflow:'hidden', maxHeight:'92vh', display:'flex', flexDirection:'column',
      }}>
        <div style={{ background:'#0C0C0E', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Package size={16} style={{ color:'#34D399' }}/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>
              {isEdit ? `Editar — ${item.model_name}` : 'Novo item no estoque'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        <div style={{ overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          {/* Modelo + Capacidade */}
          <div style={{ background:T.surface, borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
            <SectionTitle>Identificação</SectionTitle>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Modelo</div>
              <input value={form.model_name} onChange={e=>set('model_name',e.target.value)}
                placeholder="Ex: iPhone 15 Pro Max" style={inp(errors.model_name, T)}/>
              {errors.model_name && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.model_name}</div>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Capacidade</div>
                <input value={form.capacity} onChange={e=>set('capacity',e.target.value)}
                  placeholder="128GB" style={inp(false, T)}/>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Quantidade</div>
                <input value={form.quantity} onChange={e=>set('quantity',e.target.value)}
                  type="number" min="0" style={inp(errors.quantity, T)}/>
                {errors.quantity && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.quantity}</div>}
              </div>
            </div>
          </div>

          {/* Cor + Bateria */}
          <div style={{ background:T.surface, borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
            <SectionTitle>Cor e estado</SectionTitle>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Cor</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
                  background:dotHex, border:`2px solid ${isLight ? '#D1D5DB' : 'transparent'}`,
                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                <input value={form.color} onChange={e=>set('color',e.target.value)}
                  placeholder="Ex: Preto Meia-noite" style={{...inp(false,T), flex:1}}/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Saúde da bateria <span style={{ fontWeight:400, color:'#9CA3AF' }}>(%, opcional)</span></div>
              <input value={form.battery_health} onChange={e=>set('battery_health',e.target.value)}
                type="number" min="1" max="100" placeholder="Ex: 95" style={inp(errors.battery_health, T)}/>
              {errors.battery_health && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.battery_health}</div>}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:7 }}>Condição</div>
              <div style={{ display:'flex', gap:8 }}>
                {[{ v:'lacrado', l:'Lacrado', emoji:'📦' }, { v:'seminovo', l:'Seminovo', emoji:'✨' }].map(opt => {
                  const on = form.condition === opt.v
                  return (
                    <button key={opt.v} onClick={()=>set('condition',opt.v)} style={{
                      flex:1, padding:'10px 8px', borderRadius:9, cursor:'pointer',
                      border:`1.5px solid ${on ? '#0C0C0E' : T.ink5}`,
                      background: on ? '#0C0C0E' : T.surface,
                      display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      fontFamily:'Instrument Sans,sans-serif', fontSize:12, fontWeight: on ? 700 : 400,
                      color: on ? '#fff' : T.ink3,
                    }}>
                      <span>{opt.emoji}</span>{opt.l}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Preço e notas */}
          <div style={{ background:T.surface, borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
            <SectionTitle>Extras <span style={{ fontWeight:400, color:'#9CA3AF', textTransform:'none', fontSize:10 }}>(opcionais)</span></SectionTitle>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Preço específico</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, ...inp(false,T), padding:'10px 12px' }}>
                <span style={{ fontSize:13, color:'#6B7280' }}>R$</span>
                <input value={form.price_override} onChange={e=>setForm(f=>({...f,price_override:e.target.value.replace(/[^0-9,.]/g,'')}))}
                  placeholder="0,00" style={{ border:'none', outline:'none', fontSize:13, fontWeight:600, background:'transparent', fontFamily:'JetBrains Mono,monospace', color:T.ink, width:'100%' }}/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Observações</div>
              <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
                placeholder="Ex: marcas de uso, câmera com mensagem..."
                rows={2} style={{ ...inp(false,T), resize:'vertical', lineHeight:1.5 }}/>
            </div>
          </div>
        </div>

        <div style={{ padding:'12px 20px 20px', display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'11px 18px', border:`1px solid ${T.ink5}`, borderRadius:9, background:T.surface, cursor:'pointer', fontSize:13, fontWeight:500, color:T.ink3, fontFamily:'Instrument Sans,sans-serif' }}>Cancelar</button>
          <button onClick={handleSave} disabled={busy} style={{ flex:1, padding:'11px 18px', background:'#0C0C0E', color:'#fff', border:'none', borderRadius:9, cursor:busy?'not-allowed':'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'Instrument Sans,sans-serif', opacity:busy?0.7:1 }}>
            {busy ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : <Check size={14}/>}
            {isEdit ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal de importação WhatsApp
function ImportModal({ onClose, T }) {
  const importInv = useImportInventory()
  const [text,    setText]    = useState('')
  const [mode,    setMode]    = useState('replace')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errMsg,  setErrMsg]  = useState('')

  const handlePreview = async () => {
    if (text.trim().length < 10) { setErrMsg('Cole o texto do WhatsApp acima.'); return }
    setLoading(true); setErrMsg(''); setPreview(null)
    try {
      const { data } = await api.post('/admin/inventory/import', { text, mode, preview: true })
      setPreview(data)
    } catch (e) {
      setErrMsg(e.response?.data?.error || 'Erro ao processar texto.')
    } finally { setLoading(false) }
  }

  const handleImport = async () => {
    setLoading(true); setErrMsg('')
    try {
      await importInv.mutateAsync({ text, mode, preview: false })
      onClose()
    } catch (e) {
      setErrMsg(e.response?.data?.error || 'Erro ao importar.')
      setLoading(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', zIndex:1800, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 0 0' }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.bg, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:640,
        boxShadow:'0 -8px 40px rgba(0,0,0,0.3)', fontFamily:'Instrument Sans,sans-serif',
        maxHeight:'90vh', display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{ background:'#0C0C0E', padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderRadius:'20px 20px 0 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Upload size={16} style={{ color:'#34D399' }}/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Importar estoque do WhatsApp</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:1 }}>Cole a mensagem recebida do fornecedor</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        <div style={{ overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:14, flex:1 }}>
          {/* Modo */}
          <div style={{ background:T.surface, borderRadius:12, padding:14 }}>
            <SectionTitle>Modo de importação</SectionTitle>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              {[
                { v:'replace', l:'Substituir tudo', desc:'Zera o estoque e reimporta', emoji:'🔄' },
                { v:'merge',   l:'Mesclar',         desc:'Adiciona sem remover anteriores', emoji:'➕' },
              ].map(opt => {
                const on = mode === opt.v
                return (
                  <button key={opt.v} onClick={()=>setMode(opt.v)} style={{
                    flex:1, padding:'12px 10px', borderRadius:10, cursor:'pointer', textAlign:'left',
                    border:`1.5px solid ${on ? '#0C0C0E' : T.ink5}`,
                    background: on ? '#0C0C0E' : T.surface,
                    fontFamily:'Instrument Sans,sans-serif', transition:'all .15s',
                  }}>
                    <div style={{ fontSize:16, marginBottom:5 }}>{opt.emoji}</div>
                    <div style={{ fontSize:12, fontWeight:700, color: on ? '#fff' : T.ink }}>{opt.l}</div>
                    <div style={{ fontSize:10, color: on ? 'rgba(255,255,255,0.5)' : '#9CA3AF', marginTop:2 }}>{opt.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:6 }}>Texto do WhatsApp</div>
            <textarea
              value={text}
              onChange={e=>{setText(e.target.value); setPreview(null); setErrMsg('')}}
              placeholder={'ESTOQUE DA LOJA\n\n13 128gb - 6 azul 95% // 1 verde 95%\n14 Pro 256gb - 4 pretos 90%, 95%\n...'}
              rows={8}
              style={{ width:'100%', padding:'12px 14px', border:`1.5px solid ${T.ink5}`, borderRadius:10,
                fontSize:12, color:T.ink, background:T.surface, fontFamily:'JetBrains Mono,monospace',
                outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:1.6 }}
            />
          </div>

          {errMsg && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#B91C1C', display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={14}/>{errMsg}
            </div>
          )}

          {/* Pré-visualização */}
          {preview && (
            <div style={{ background:T.surface, borderRadius:12, overflow:'hidden', border:`1px solid ${T.ink5}` }}>
              <div style={{ padding:'10px 14px', background:'#F0FDF4', borderBottom:'1px solid #BBF7D0', display:'flex', alignItems:'center', gap:8 }}>
                <CheckCircle2 size={14} style={{ color:'#15803D' }}/>
                <span style={{ fontSize:12, fontWeight:700, color:'#15803D' }}>{preview.count} itens reconhecidos</span>
                <span style={{ fontSize:11, color:'#6B7280', marginLeft:'auto' }}>Revise antes de importar</span>
              </div>
              <div style={{ maxHeight:220, overflowY:'auto' }}>
                {preview.data.map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:`1px solid ${T.ink6}` }}>
                    {(() => { const { hex, isLight } = colorDot(item.color); return (
                      <div style={{ width:10, height:10, borderRadius:'50%', background:hex, flexShrink:0, border:`1px solid ${isLight ? '#D1D5DB' : 'transparent'}` }}/>
                    )})()}
                    <span style={{ fontSize:12, fontWeight:600, color:T.ink, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.model_name} {item.capacity}
                    </span>
                    <span style={{ fontSize:11, color:'#6B7280', whiteSpace:'nowrap' }}>{item.color}</span>
                    {item.battery_health && <span style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color: item.battery_health >= 95 ? '#15803D' : '#D97706' }}>{item.battery_health}%</span>}
                    <QtyBadge qty={item.quantity}/>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div style={{ padding:'12px 20px 24px', display:'flex', gap:8, flexShrink:0, borderTop:`1px solid ${T.ink6}` }}>
          {!preview ? (
            <button onClick={handlePreview} disabled={loading || text.trim().length < 10} style={{
              flex:1, padding:'12px', background: text.trim().length >= 10 ? '#0C0C0E' : T.ink5,
              color: text.trim().length >= 10 ? '#fff' : '#9CA3AF',
              border:'none', borderRadius:10, cursor: text.trim().length >= 10 ? 'pointer' : 'default',
              fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              fontFamily:'Instrument Sans,sans-serif',
            }}>
              {loading ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle2 size={14}/>}
              Pré-visualizar
            </button>
          ) : (
            <>
              <button onClick={()=>setPreview(null)} style={{ padding:'12px 18px', border:`1px solid ${T.ink5}`, borderRadius:10, background:T.surface, cursor:'pointer', fontSize:13, fontWeight:500, color:T.ink3, fontFamily:'Instrument Sans,sans-serif' }}>
                Editar
              </button>
              <button onClick={handleImport} disabled={loading} style={{
                flex:1, padding:'12px', background:'#12A150', color:'#fff',
                border:'none', borderRadius:10, cursor: loading ? 'not-allowed' : 'pointer',
                fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                fontFamily:'Instrument Sans,sans-serif', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> : <Upload size={14}/>}
                Importar {preview.count} itens
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Painel principal de estoque
function InventoryPanel({ T }) {
  const { data: items = [], isLoading } = useAdminInventory()
  const deleteInv = useDeleteInventory()

  const [search,      setSearch]      = useState('')
  const [itemModal,   setItemModal]   = useState(null)   // null | {} | item
  const [importModal, setImportModal] = useState(false)
  const [expandedModel, setExpandedModel] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Agrupa por model_name + capacity
  const grouped = {}
  items.forEach(item => {
    const key = `${item.model_name}|||${item.capacity}`
    if (!grouped[key]) grouped[key] = { model_name: item.model_name, capacity: item.capacity, items: [] }
    grouped[key].items.push(item)
  })

  const groups = Object.values(grouped).filter(g => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return g.model_name.toLowerCase().includes(q) || g.capacity.toLowerCase().includes(q) ||
      g.items.some(i => i.color.toLowerCase().includes(q))
  }).sort((a,b) => a.model_name.localeCompare(b.model_name, 'pt-BR') || a.capacity.localeCompare(b.capacity))

  const totalUnits = items.reduce((s, i) => s + (i.quantity || 0), 0)
  const totalModels = Object.keys(grouped).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Métricas rápidas */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'Total em estoque', value:totalUnits, color:'#0A66FF' },
          { label:'Modelos distintos', value:totalModels, color:'#7C3AED' },
          { label:'Itens críticos', value:items.filter(i=>i.quantity<=2).length, color:'#D97706' },
        ].map(m => (
          <div key={m.label} style={{ background:'#fff', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:20, fontWeight:800, color:m.color, fontFamily:'JetBrains Mono,monospace', letterSpacing:'-1px' }}>{m.value}</div>
            <div style={{ fontSize:10, color:'#6B7280', marginTop:3, fontWeight:500 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de ações */}
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar modelo, capacidade ou cor..."
          style={{ flex:1, minWidth:150, padding:'9px 12px', border:`1.5px solid ${T.ink5}`, borderRadius:9, fontSize:13, color:T.ink, background:T.surface, outline:'none', fontFamily:'Instrument Sans,sans-serif' }}
        />
        <button onClick={()=>setItemModal({})} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 14px',
          background:'rgba(0,0,0,0.07)', color:T.ink, border:'none', borderRadius:9,
          cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'Instrument Sans,sans-serif',
        }}>
          <Plus size={13}/> Manual
        </button>
        <button onClick={()=>setImportModal(true)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
          background:'linear-gradient(135deg,#12A150,#059669)', color:'#fff',
          border:'none', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:700,
          fontFamily:'Instrument Sans,sans-serif', boxShadow:'0 3px 10px rgba(18,161,80,0.3)',
        }}>
          <Upload size={13}/> Importar WhatsApp
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
          <Loader2 size={20} style={{ animation:'spin 1s linear infinite', margin:'0 auto 8px', display:'block' }}/>
          Carregando estoque...
        </div>
      )}

      {/* Vazio */}
      {!isLoading && items.length === 0 && (
        <div style={{ padding:'48px 20px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Package size={24} style={{ color:'#9CA3AF' }}/>
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:'#374151' }}>Estoque vazio</div>
          <div style={{ fontSize:13, color:'#9CA3AF', maxWidth:260 }}>Importe a lista do WhatsApp ou adicione itens manualmente.</div>
          <button onClick={()=>setImportModal(true)} style={{ marginTop:4, padding:'10px 22px', background:'#12A150', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Instrument Sans,sans-serif' }}>
            Importar agora
          </button>
        </div>
      )}

      {/* Lista agrupada */}
      {!isLoading && groups.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {groups.map(g => {
            const key = `${g.model_name}|||${g.capacity}`
            const isExpanded = expandedModel === key
            const totalQty = g.items.reduce((s,i) => s+i.quantity, 0)

            return (
              <div key={key} style={{ background:'#fff', borderRadius:14, border:'1px solid rgba(0,0,0,0.08)', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', transition:'box-shadow .15s' }}>
                {/* Header do grupo */}
                <button
                  onClick={()=>setExpandedModel(isExpanded ? null : key)}
                  style={{ width:'100%', padding:'12px 14px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:12, fontFamily:'Instrument Sans,sans-serif', textAlign:'left' }}
                >
                  <div style={{ width:36, height:36, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Smartphone size={16} style={{ color:'#2563EB' }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {g.model_name}
                      {g.capacity && <span style={{ marginLeft:7, fontSize:11, fontWeight:600, background:'#F3F4F6', color:'#374151', padding:'2px 7px', borderRadius:5, fontFamily:'JetBrains Mono,monospace' }}>{g.capacity}</span>}
                    </div>
                    {/* Dots de cores */}
                    <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
                      {g.items.map(item => {
                        const { hex, isLight } = colorDot(item.color)
                        return (
                          <div key={item.id} title={`${item.color} — ${item.quantity} un.`} style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:hex, border:`1.5px solid ${isLight ? '#D1D5DB' : 'transparent'}`, boxShadow:'0 1px 2px rgba(0,0,0,0.15)' }}/>
                            <span style={{ fontSize:10, color:'#6B7280', fontFamily:'JetBrains Mono,monospace' }}>{item.quantity}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <QtyBadge qty={totalQty}/>
                    {isExpanded ? <ChevronUp size={14} style={{ color:'#9CA3AF' }}/> : <ChevronDown size={14} style={{ color:'#9CA3AF' }}/>}
                  </div>
                </button>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid #F3F4F6' }}>
                    {g.items.map(item => {
                      const { hex, isLight } = colorDot(item.color)
                      return (
                        <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid #F9FAFB' }}>
                          {/* Bolinha da cor */}
                          <div style={{ width:14, height:14, borderRadius:'50%', background:hex, flexShrink:0, border:`2px solid ${isLight ? '#D1D5DB' : 'transparent'}`, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>

                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{item.color || '—'}</div>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
                              <BatteryBar value={item.battery_health}/>
                              <span style={{ fontSize:10, background: item.condition === 'lacrado' ? '#EFF6FF' : '#F0FDF4', color: item.condition === 'lacrado' ? '#1D4ED8' : '#15803D', padding:'2px 7px', borderRadius:5, fontWeight:600 }}>
                                {item.condition === 'lacrado' ? '📦 Lacrado' : '✨ Seminovo'}
                              </span>
                              {item.price_override && (
                                <span style={{ fontSize:10, background:'#FEF3C7', color:'#D97706', padding:'2px 7px', borderRadius:5, fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>
                                  R$ {Number(item.price_override).toLocaleString('pt-BR',{minimumFractionDigits:2})}
                                </span>
                              )}
                              {item.notes && <span style={{ fontSize:10, color:'#9CA3AF', fontStyle:'italic' }} title={item.notes}>📝 {item.notes.slice(0,30)}{item.notes.length>30?'…':''}</span>}
                            </div>
                          </div>

                          <QtyBadge qty={item.quantity}/>

                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            <button onClick={()=>setItemModal(item)} style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:7, padding:'6px', cursor:'pointer', display:'flex', alignItems:'center', color:'#6B7280' }}>
                              <Pencil size={12}/>
                            </button>
                            <button onClick={()=>setDeleteConfirm(item)} style={{ background:'#FEE2E2', border:'none', borderRadius:7, padding:'6px', cursor:'pointer', display:'flex', alignItems:'center', color:'#B91C1C' }}>
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {/* Botão de adicionar variante */}
                    <button onClick={()=>setItemModal({ model_name: g.model_name, capacity: g.capacity })}
                      style={{ width:'100%', padding:'9px 14px', background:'#F9FAFB', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:7, color:'#6B7280', fontSize:12, fontWeight:500, fontFamily:'Instrument Sans,sans-serif' }}>
                      <Plus size={12}/> Adicionar cor/variante
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Sem resultados na busca */}
      {!isLoading && items.length > 0 && groups.length === 0 && (
        <div style={{ padding:32, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Nenhum modelo encontrado para "{search}"</div>
      )}

      {/* Modais */}
      {itemModal !== null && (
        <InventoryItemModal
          item={Object.keys(itemModal).length ? itemModal : null}
          onClose={()=>setItemModal(null)}
          T={T}
        />
      )}
      {importModal && <ImportModal onClose={()=>setImportModal(false)} T={T}/>}

      {/* Confirma exclusão */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1900, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={()=>setDeleteConfirm(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.bg, borderRadius:16, padding:24, maxWidth:360, width:'100%', boxShadow:'0 16px 48px rgba(0,0,0,0.25)', fontFamily:'Instrument Sans,sans-serif' }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:8 }}>Remover item?</div>
            <div style={{ fontSize:13, color:'#6B7280', marginBottom:20 }}>
              <strong>{deleteConfirm.model_name} {deleteConfirm.capacity}</strong> · {deleteConfirm.color} · {deleteConfirm.quantity} un.<br/>Esta ação não pode ser desfeita.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ flex:1, padding:'10px', border:`1px solid ${T.ink5}`, borderRadius:9, background:T.surface, cursor:'pointer', fontSize:13, fontWeight:500, color:T.ink3, fontFamily:'Instrument Sans,sans-serif' }}>Cancelar</button>
              <button onClick={async()=>{ await deleteInv.mutateAsync(deleteConfirm.id); setDeleteConfirm(null) }} style={{ flex:1, padding:'10px', background:'#EF4444', color:'#fff', border:'none', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Instrument Sans,sans-serif' }}>
                {deleteInv.isPending ? <Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { T }    = useTheme()
  const { user } = useAuth()
  const [tab,    setTab]    = useState('users')  // 'users' | 'models' | 'inventory' | 'backup'
  const [userModal,  setUserModal]  = useState(null)  // null | {} | user obj
  const [modelModal, setModelModal] = useState(null)

  const { data: users  = [], isLoading: loadU } = useAdminUsers()
  const { data: models = [], isLoading: loadM } = useAdminModels()

  const updateUser  = useUpdateUser()
  const updateModel = useUpdateModel()

  if (user?.role !== 'admin') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        height:'60vh', gap:12, fontFamily:'Instrument Sans,sans-serif' }}>
        <ShieldOff size={40} style={{ color:'#EF4444' }}/>
        <div style={{ fontSize:18, fontWeight:700 }}>Acesso restrito</div>
        <div style={{ fontSize:13, color:'#6B7280' }}>Apenas administradores podem acessar esta área.</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'24px 16px 40px',
      fontFamily:'Instrument Sans,sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'#0C0C0E',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShieldCheck size={20} style={{ color:'#fff' }}/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, letterSpacing:'-0.4px' }}>Administração</h1>
            <p style={{ margin:0, fontSize:12, color:'#6B7280', marginTop:2 }}>Usuários e catálogo de modelos</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'rgba(0,0,0,0.05)', borderRadius:12,
        padding:4, marginBottom:20, gap:3 }}>
        {[
          { k:'users',     l:'Usuários',  Icon:Users,       count:users.length },
          { k:'models',    l:'Catálogo',  Icon:Smartphone,  count:models.filter(m=>m.is_active).length },
          { k:'inventory', l:'Estoque',   Icon:Package,     count:null },
          { k:'backup',    l:'Backup',    Icon:Database,    count:null },
        ].map(({ k, l, Icon, count }) => {
          const active = tab === k
          return (
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1, minWidth:0, padding:'9px 4px', borderRadius:9, border:'none',
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              fontFamily:'Instrument Sans,sans-serif', fontSize:12,
              fontWeight: active ? 700 : 500, color: active ? '#0C0C0E' : '#6B7280',
              transition:'all .15s', overflow:'hidden',
            }}>
              <Icon size={13} style={{ flexShrink:0 }}/>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l}</span>
              {count !== null && (
                <span style={{
                  background: active ? '#0C0C0E' : 'rgba(0,0,0,0.1)',
                  color: active ? '#fff' : '#6B7280',
                  borderRadius:999, padding:'1px 6px', fontSize:10, fontWeight:700, flexShrink:0,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── ABA USUÁRIOS ──────────────────────────────────────── */}
      {tab === 'users' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={()=>setUserModal({})} style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              background:'#0C0C0E', color:'#fff', border:'none', borderRadius:9,
              cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'Instrument Sans,sans-serif',
            }}>
              <Plus size={14}/> Novo usuário
            </button>
          </div>

          {loadU && (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
              <Loader2 size={20} style={{ animation:'spin 1s linear infinite', margin:'0 auto 8px', display:'block' }}/>
              Carregando usuários...
            </div>
          )}

          {!loadU && users.map(u => {
            const isMe = u.id === user.id
            return (
              <div key={u.id} style={{
                background:'#fff', borderRadius:14, border:'1px solid rgba(0,0,0,0.07)',
                padding:'14px 16px', display:'flex', alignItems:'center', gap:14,
                boxShadow:'0 1px 4px rgba(0,0,0,0.05)', opacity: u.is_active ? 1 : 0.55,
              }}>
                {/* Avatar */}
                <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0,
                  background: u.is_active ? '#0C0C0E' : '#E5E7EB',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: u.is_active ? '#fff' : '#9CA3AF', fontSize:14, fontWeight:700 }}>
                  {u.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#111827',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</span>
                    {isMe && <span style={{ fontSize:9, background:'#0C0C0E', color:'#fff',
                      padding:'2px 7px', borderRadius:999, fontWeight:700, letterSpacing:'0.05em' }}>VOCÊ</span>}
                    <RoleBadge role={u.role}/>
                    {!u.is_active && <span style={{ fontSize:10, background:'#FEE2E2', color:'#B91C1C',
                      padding:'2px 7px', borderRadius:999, fontWeight:600 }}>Inativo</span>}
                  </div>
                  <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{u.email}</div>
                  {u.last_login && (
                    <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>
                      Último acesso: {new Date(u.last_login).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                  {!isMe && (
                    <button onClick={()=>updateUser.mutate({ id:u.id, data:{ is_active:!u.is_active }})}
                      title={u.is_active ? 'Desativar' : 'Ativar'}
                      style={{ background: u.is_active ? '#FEE2E2' : '#DCFCE7', border:'none', borderRadius:8,
                        padding:'7px', cursor:'pointer', display:'flex', alignItems:'center',
                        color: u.is_active ? '#B91C1C' : '#15803D' }}>
                      {u.is_active ? <ShieldOff size={14}/> : <ShieldCheck size={14}/>}
                    </button>
                  )}
                  <button onClick={()=>setUserModal(u)}
                    style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:8,
                      padding:'7px', cursor:'pointer', display:'flex', alignItems:'center', color:'#6B7280' }}>
                    <Pencil size={14}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ABA MODELOS ───────────────────────────────────────── */}
      {tab === 'models' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
            <div style={{ fontSize:12, color:'#6B7280' }}>
              {models.filter(m=>m.is_active).length} itens ativos · {models.filter(m=>!m.is_active).length} inativos
            </div>
            <button onClick={()=>setModelModal({})} style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              background:'linear-gradient(135deg,#0A66FF,#0047CC)', color:'#fff',
              border:'none', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:600,
              fontFamily:'Instrument Sans,sans-serif', boxShadow:'0 4px 12px rgba(10,102,255,0.25)',
            }}>
              <Plus size={14}/> Novo item
            </button>
          </div>

          {loadM && (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
              <Loader2 size={20} style={{ animation:'spin 1s linear infinite', margin:'0 auto 8px', display:'block' }}/>
              Carregando modelos...
            </div>
          )}

          {/* Separado por categoria */}
          {!loadM && (() => {
            const iphones    = models.filter(m => !m.category || m.category === 'iphone')
            const acessorios = models.filter(m => m.category === 'acessorio')
            const outros     = models.filter(m => m.category === 'outro')

            const ModelCard = ({ m }) => (
              <div key={m.id} style={{
                background:'#fff', borderRadius:12, border:'1px solid rgba(0,0,0,0.07)',
                padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
                boxShadow:'0 1px 4px rgba(0,0,0,0.04)', opacity: m.is_active ? 1 : 0.5,
                transition:'opacity .15s',
              }}>
                <div style={{ width:36, height:36, borderRadius:9, flexShrink:0,
                  background: m.category === 'acessorio' ? '#F0FDF4' : m.category === 'outro' ? '#FFF7ED' : '#EFF6FF',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                  {m.category === 'acessorio'
                    ? (m.name.includes('Película') ? '🛡️' : m.name.includes('Carregador') || m.name.includes('Fonte') ? '🔌'
                      : m.name.includes('Cabo') ? '🔗' : m.name.includes('Capa') ? '📱'
                      : m.name.includes('Fone') ? '🎧' : m.name.includes('Powerbank') ? '🔋' : '📦')
                    : m.category === 'outro' ? '⌚'
                    : <Smartphone size={16} style={{ color:'#2563EB' }}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:4 }}>{m.name}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
                    {m.capacities?.map(c => (
                      <span key={c} style={{ fontSize:10, background:'#F3F4F6', color:'#374151',
                        padding:'2px 7px', borderRadius:6, fontWeight:600,
                        fontFamily:'JetBrains Mono,monospace' }}>{c}</span>
                    ))}
                    {m.suggested_price && (
                      <span style={{ fontSize:10, background:'#F0FDF4', color:'#15803D',
                        padding:'2px 7px', borderRadius:6, fontWeight:700,
                        fontFamily:'JetBrains Mono,monospace' }}>
                        R$ {Number(m.suggested_price).toLocaleString('pt-BR',{minimumFractionDigits:2})}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                  <button onClick={()=>updateModel.mutate({ id:m.id, data:{ is_active:!m.is_active }})}
                    title={m.is_active ? 'Desativar' : 'Ativar'}
                    style={{ background: m.is_active ? '#FEE2E2' : '#DCFCE7', border:'none', borderRadius:8,
                      padding:'6px', cursor:'pointer', display:'flex', alignItems:'center',
                      color: m.is_active ? '#B91C1C' : '#15803D' }}>
                    {m.is_active ? <ShieldOff size={13}/> : <ShieldCheck size={13}/>}
                  </button>
                  <button onClick={()=>setModelModal(m)}
                    style={{ background:'rgba(0,0,0,0.05)', border:'none', borderRadius:8,
                      padding:'6px', cursor:'pointer', display:'flex', alignItems:'center', color:'#6B7280' }}>
                    <Pencil size={13}/>
                  </button>
                </div>
              </div>
            )

            const Section = ({ label, list, emoji }) => list.length === 0 ? null : (
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
                  letterSpacing:'0.7px', marginBottom:8, paddingLeft:4, display:'flex', alignItems:'center', gap:6 }}>
                  <span>{emoji}</span> {label} · {list.filter(m=>m.is_active).length} ativos
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {list.map(m => <ModelCard key={m.id} m={m}/>)}
                </div>
              </div>
            )

            // iPhones agrupados por série
            const bySeries = {}
            iphones.forEach(m => {
              const s = m.series || 'Outros'
              if (!bySeries[s]) bySeries[s] = []
              bySeries[s].push(m)
            })

            return (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {/* iPhones por série */}
                {Object.entries(bySeries).map(([series, list]) => (
                  <div key={series}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
                      letterSpacing:'0.7px', marginBottom:8, paddingLeft:4, display:'flex', alignItems:'center', gap:6 }}>
                      📱 iPhone {series} · {list.filter(m=>m.is_active).length} ativos
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {list.map(m => <ModelCard key={m.id} m={m}/>)}
                    </div>
                  </div>
                ))}
                <Section label="Acessórios"       list={acessorios} emoji="🛡️"/>
                <Section label="Outros produtos"   list={outros}     emoji="⌚"/>
              </div>
            )
          })()}
        </div>
      )}


      {/* ── ABA ESTOQUE ──────────────────────────────────────── */}
      {tab === 'inventory' && <InventoryPanel T={T}/>}

      {/* ── ABA BACKUP ───────────────────────────────────────── */}
      {tab === 'backup' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <BackupPanel T={T}/>
          <div style={{ height:1, background:'#E5E7EB' }}/>
          <RestorePanel T={T}/>
        </div>
      )}

            {/* Modals */}
      {userModal  !== null && <UserModal  user={Object.keys(userModal).length  ? userModal  : null} onClose={()=>setUserModal(null)}  T={T}/>}
      {modelModal !== null && <ModelModal model={Object.keys(modelModal).length ? modelModal : null} onClose={()=>setModelModal(null)} T={T}/>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

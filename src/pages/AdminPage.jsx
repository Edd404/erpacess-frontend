import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import {
  Users, Smartphone, Plus, Pencil, Check, X, Eye, EyeOff,
  ShieldCheck, ShieldOff, Key, ChevronDown, Loader2,
  UserCircle, Crown, Briefcase, Database, Send, CheckCircle2, AlertCircle,
} from 'lucide-react'
import {
  useAdminUsers, useAdminModels,
  useCreateUser, useUpdateUser, useResetPassword,
  useCreateModel, useUpdateModel,
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
function ModelModal({ model, onClose, T }) {
  const isEdit    = !!model
  const createMdl = useCreateModel()
  const updateMdl = useUpdateModel()

  const [name,  setName]  = useState(model?.name   || '')
  const [series,setSeries]= useState(model?.series  || '')
  const [year,  setYear]  = useState(model?.year    || new Date().getFullYear())
  const [caps,  setCaps]  = useState(model?.capacities || [])
  const [errors,setErrors]= useState({})

  const toggleCap = (c) =>
    setCaps(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c])

  const validate = () => {
    const e = {}
    if (!name.trim())   e.name   = 'Nome obrigatório'
    if (!series.trim()) e.series = 'Série obrigatória'
    if (!caps.length)   e.caps   = 'Selecione ao menos uma capacidade'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    const payload = { name: name.trim(), series: series.trim(), year: parseInt(year), capacities: caps }
    if (isEdit) { await updateMdl.mutateAsync({ id: model.id, data: payload }) }
    else        { await createMdl.mutateAsync(payload) }
    onClose()
  }

  const busy = createMdl.isPending || updateMdl.isPending

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
              {isEdit ? `Editar — ${model.name}` : 'Novo modelo'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none',
            borderRadius:8, width:30, height:30, cursor:'pointer', color:'rgba(255,255,255,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14}/>
          </button>
        </div>

        <div style={{ overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Dados do modelo */}
          <div style={{ background:T.surface, borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
            <SectionTitle>Identificação</SectionTitle>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Nome completo</div>
              <input value={name} onChange={e=>{setName(e.target.value);setErrors(v=>({...v,name:''}))}}
                placeholder="Ex: iPhone 17 Pro Max" style={inp(errors.name, T)}/>
              {errors.name && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.name}</div>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Série</div>
                <input value={series} onChange={e=>{setSeries(e.target.value);setErrors(v=>({...v,series:''}))}}
                  placeholder="Ex: 17" style={inp(errors.series, T)}/>
                {errors.series && <div style={{ fontSize:11, color:'#EF4444', marginTop:3 }}>{errors.series}</div>}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', marginBottom:5 }}>Ano de lançamento</div>
                <input value={year} onChange={e=>setYear(e.target.value)}
                  type="number" min="2007" max="2035" style={inp(false, T)}/>
              </div>
            </div>
          </div>

          {/* Capacidades */}
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
              {isEdit ? 'Salvar' : 'Adicionar modelo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────

// ── Backup Panel ──────────────────────────────────────────────
function BackupPanel({ T }) {
  const [status, setStatus]   = useState(null)   // null | 'loading' | 'ok' | 'error'
  const [result, setResult]   = useState(null)
  const [errMsg, setErrMsg]   = useState('')

  const runBackup = async () => {
    setStatus('loading')
    setResult(null)
    setErrMsg('')
    try {
      const { data } = await api.post('/admin/backup/run')
      setResult(data)
      setStatus('ok')
    } catch (err) {
      setErrMsg(err?.response?.data?.error || err.message || 'Erro desconhecido')
      setStatus('error')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Card principal */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E5E7EB',
        overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #F3F4F6' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'#0C0C0E',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Database size={18} style={{ color:'#fff' }}/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>Backup manual</div>
              <div style={{ fontSize:11, color:'#6B7280', marginTop:1 }}>
                Exporta clients, users e service_orders → envia para eddjpog@gmail.com
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'16px 20px' }}>
          <button onClick={runBackup} disabled={status === 'loading'} style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'12px 20px', borderRadius:10, border:'none', cursor: status === 'loading' ? 'wait' : 'pointer',
            background: status === 'loading' ? '#E5E7EB' : '#0C0C0E',
            color: status === 'loading' ? '#9CA3AF' : '#fff',
            fontSize:13, fontWeight:700, fontFamily:'Instrument Sans,sans-serif',
            transition:'all .15s', opacity: status === 'loading' ? 0.7 : 1,
          }}>
            {status === 'loading'
              ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> Executando backup...</>
              : <><Send size={15}/> Executar backup agora</>
            }
          </button>
        </div>
      </div>

      {/* Resultado OK */}
      {status === 'ok' && result && (
        <div style={{ background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:14,
          padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle2 size={18} style={{ color:'#16A34A', flexShrink:0 }}/>
            <div style={{ fontSize:14, fontWeight:700, color:'#15803D' }}>Backup enviado com sucesso!</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { l:'Arquivo',    v: result.fileName },
              { l:'Tamanho',    v: `${result.sizeKB} KB` },
              { l:'Clientes',   v: result.rowCounts?.clients?.toLocaleString('pt-BR') ?? '—' },
              { l:'Ordens',     v: result.rowCounts?.service_orders?.toLocaleString('pt-BR') ?? '—' },
            ].map(({ l, v }) => (
              <div key={l} style={{ background:'#fff', borderRadius:8, padding:'10px 12px',
                border:'1px solid #BBF7D0' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#6B7280', textTransform:'uppercase',
                  letterSpacing:'0.7px', marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#111827', wordBreak:'break-all' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#166534' }}>
            📧 Verifique sua caixa de entrada em <strong>eddjpog@gmail.com</strong>
          </div>
        </div>
      )}

      {/* Resultado ERRO */}
      {status === 'error' && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:14,
          padding:'16px 18px', display:'flex', gap:10, alignItems:'flex-start' }}>
          <AlertCircle size={18} style={{ color:'#DC2626', flexShrink:0, marginTop:1 }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#B91C1C', marginBottom:4 }}>Falha no backup</div>
            <div style={{ fontSize:12, color:'#7F1D1D', fontFamily:'JetBrains Mono,monospace',
              background:'rgba(0,0,0,0.04)', padding:'6px 10px', borderRadius:6 }}>{errMsg}</div>
          </div>
        </div>
      )}

      {/* Info automático */}
      <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:12,
        padding:'14px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
        <div style={{ fontSize:16, flexShrink:0 }}>🕒</div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:3 }}>
            Backup automático diário às 03:00 BRT
          </div>
          <div style={{ fontSize:11, color:'#6B7280', lineHeight:1.6 }}>
            O sistema executa automaticamente todo dia às 03:00 (horário de Brasília).
            Se o servidor reiniciar e o último backup tiver mais de 20h, um backup de recuperação
            é disparado imediatamente na inicialização.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { T }    = useTheme()
  const { user } = useAuth()
  const [tab,    setTab]    = useState('users')  // 'users' | 'models'
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
        padding:4, marginBottom:20, gap:4 }}>
        {[
          { k:'users',  l:'Usuários',  Icon:Users, count:users.length },
          { k:'models', l:'Modelos',   Icon:Smartphone, count:models.filter(m=>m.is_active).length },
          { k:'backup', l:'Backup',    Icon:Database,  count:null },
        ].map(({ k, l, Icon, count }) => {
          const active = tab === k
          return (
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1, padding:'10px 16px', borderRadius:9, border:'none',
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:'Instrument Sans,sans-serif', fontSize:13,
              fontWeight: active ? 700 : 400, color: active ? '#0C0C0E' : '#6B7280',
              transition:'all .15s',
            }}>
              <Icon size={14}/>
              {l}
              <span style={{ background: active ? '#0C0C0E' : 'rgba(0,0,0,0.1)', color: active ? '#fff' : '#6B7280',
                borderRadius:999, padding:'1px 7px', fontSize:10, fontWeight:700 }}>
                {count}
              </span>
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
              {models.filter(m=>m.is_active).length} modelos ativos · {models.filter(m=>!m.is_active).length} inativos
            </div>
            <button onClick={()=>setModelModal({})} style={{
              display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
              background:'linear-gradient(135deg,#0A66FF,#0047CC)', color:'#fff',
              border:'none', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:600,
              fontFamily:'Instrument Sans,sans-serif', boxShadow:'0 4px 12px rgba(10,102,255,0.25)',
            }}>
              <Plus size={14}/> Novo modelo
            </button>
          </div>

          {loadM && (
            <div style={{ padding:40, textAlign:'center', color:'#9CA3AF' }}>
              <Loader2 size={20} style={{ animation:'spin 1s linear infinite', margin:'0 auto 8px', display:'block' }}/>
              Carregando modelos...
            </div>
          )}

          {/* Agrupar por série */}
          {!loadM && (() => {
            const bySeries = {}
            models.forEach(m => {
              if (!bySeries[m.series]) bySeries[m.series] = []
              bySeries[m.series].push(m)
            })
            return Object.entries(bySeries).map(([series, list]) => (
              <div key={series}>
                <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
                  letterSpacing:'0.7px', marginBottom:8, paddingLeft:4 }}>
                  iPhone {series} · {list.filter(m=>m.is_active).length} ativos
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {list.map(m => (
                    <div key={m.id} style={{
                      background:'#fff', borderRadius:12, border:'1px solid rgba(0,0,0,0.07)',
                      padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
                      boxShadow:'0 1px 4px rgba(0,0,0,0.04)', opacity: m.is_active ? 1 : 0.5,
                      transition:'opacity .15s',
                    }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:'#EFF6FF',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Smartphone size={16} style={{ color:'#2563EB' }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:4 }}>{m.name}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {m.capacities?.map(c => (
                            <span key={c} style={{ fontSize:10, background:'#F3F4F6', color:'#374151',
                              padding:'2px 7px', borderRadius:6, fontWeight:600,
                              fontFamily:'JetBrains Mono,monospace' }}>{c}</span>
                          ))}
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
                  ))}
                </div>
              </div>
            ))
          })()}
        </div>
      )}


      {/* ── ABA BACKUP ───────────────────────────────────────── */}
      {tab === 'backup' && <BackupPanel T={T}/>}

            {/* Modals */}
      {userModal  !== null && <UserModal  user={Object.keys(userModal).length  ? userModal  : null} onClose={()=>setUserModal(null)}  T={T}/>}
      {modelModal !== null && <ModelModal model={Object.keys(modelModal).length ? modelModal : null} onClose={()=>setModelModal(null)} T={T}/>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

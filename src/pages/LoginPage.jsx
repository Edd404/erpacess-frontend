import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Smartphone, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.error || 'E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'#0C0C0E', display:'flex', alignItems:'center',
      justifyContent:'center', padding:20, position:'relative', overflow:'hidden',
      fontFamily:'Instrument Sans,sans-serif',
    }}>
      {/* Background glow */}
      <div style={{ position:'absolute', top:'-15%', right:'-10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(10,102,255,0.1) 0%,transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-15%', left:'-10%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:380 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:56, height:56, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'#fff' }}>
            <Smartphone size={26}/>
          </div>
          <div style={{ fontSize:24, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}>iStore</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', marginTop:4 }}>Sistema de Gestão Premium</div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:28 }}>
          {error && (
            <div style={{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={14} style={{ color:'#FCA5A5', flexShrink:0 }}/>
              <span style={{ fontSize:13, color:'#FCA5A5' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>E-mail</label>
              <input
                type="email" value={email} onChange={e=>{ setEmail(e.target.value); setError('') }}
                placeholder="seu@email.com" autoFocus
                style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:14, color:'#fff', outline:'none', fontFamily:'Instrument Sans,sans-serif' }}
              />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Senha</label>
              <div style={{ position:'relative' }}>
                <input
                  type={show ? 'text' : 'password'} value={password} onChange={e=>{ setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  style={{ width:'100%', padding:'10px 40px 10px 14px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:14, color:'#fff', outline:'none', fontFamily:'Instrument Sans,sans-serif' }}
                />
                <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex' }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width:'100%', marginTop:8, padding:12, background:'#fff', color:'#0C0C0E',
              border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:'Instrument Sans,sans-serif', opacity: loading ? 0.8 : 1, transition:'all .15s',
            }}>
              {loading ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> Entrando...</> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

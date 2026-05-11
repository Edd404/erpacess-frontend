import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [focused, setFocused]   = useState(null)

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

  const inputStyle = (field) => ({
    width: '100%',
    padding: '11px 14px',
    background: focused === field
      ? 'rgba(255,255,255,0.10)'
      : 'rgba(255,255,255,0.06)',
    border: `1px solid ${focused === field
      ? 'rgba(255,255,255,0.28)'
      : 'rgba(255,255,255,0.10)'}`,
    borderRadius: 10,
    fontSize: 14,
    color: '#fff',
    outline: 'none',
    fontFamily: 'Instrument Sans, sans-serif',
    transition: 'background .2s, border-color .2s',
    boxSizing: 'border-box',
  })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Instrument Sans, sans-serif',
    }}>

      {/* ── Background image ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgroundlogin.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* ── Dark overlay for legibility ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(4,8,20,0.72) 0%, rgba(4,8,20,0.58) 50%, rgba(4,8,20,0.70) 100%)',
        backdropFilter: 'blur(1px)',
        WebkitBackdropFilter: 'blur(1px)',
      }} />

      {/* ── Subtle blue accent top-right (complementa a imagem) ── */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-8%',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,102,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ── Card ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 384,
        animation: 'fadeUp .45s cubic-bezier(.22,1,.36,1) both',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <img
              src="/backgroundlogin.png"
              alt=""
              style={{
                width: 64, height: 64,
                borderRadius: 18,
                objectFit: 'cover',
                objectPosition: 'center top',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'none', // hidden; usamos o ícone abaixo
              }}
            />
            {/* Logo mark */}
            <div style={{
              width: 60, height: 60,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}>
              {/* Phone icon inline SVG — matching brand */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
          </div>

          <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
            Acess<span style={{ color: 'rgba(255,255,255,0.55)' }}>phones</span>
          </div>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginTop: 6, fontWeight: 500,
          }}>
            Sistema de Gestão
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: '28px 28px 24px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.10)',
              border: '1px solid rgba(220,38,38,0.20)',
              borderRadius: 10, padding: '10px 14px',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'fadeIn .2s ease both',
            }}>
              <AlertCircle size={14} style={{ color: '#FCA5A5', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{
                fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                display: 'block', marginBottom: 7,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="seu@email.com"
                autoFocus
                style={inputStyle('email')}
              />
            </div>

            {/* Senha */}
            <div>
              <label style={{
                fontSize: 11, fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                display: 'block', marginBottom: 7,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  style={{ ...inputStyle('password'), paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{
                    position: 'absolute', right: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.28)',
                    display: 'flex', padding: 0,
                    transition: 'color .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '12px 0',
                background: loading ? 'rgba(255,255,255,0.85)' : '#fff',
                color: '#0A0A0C',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'Instrument Sans, sans-serif',
                transition: 'all .18s',
                letterSpacing: '-0.1px',
                boxShadow: loading ? 'none' : '0 2px 12px rgba(255,255,255,0.15)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.90)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#fff' }}
            >
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Entrando...</>
                : 'Entrar'
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 11, color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.04em',
        }}>
          © {new Date().getFullYear()} Acessphones · Todos os direitos reservados
        </p>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(255,255,255,0.22) !important; }
      `}</style>
    </div>
  )
}

import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, ClipboardList, Plus, LogOut, Smartphone, Bell
} from 'lucide-react'

const T = {
  sidebar: '#0C0C0E',
  sb: 'rgba(255,255,255,0.06)',
  st: 'rgba(255,255,255,0.45)',
  bg: '#F7F7F8',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  borderS: 'rgba(0,0,0,0.12)',
  text: '#0C0C0E',
  t2: '#6B7280',
  t3: '#9CA3AF',
  accent: '#0A66FF',
}

const navItems = [
  { path: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/clients',   icon: Users,           label: 'Clientes' },
  { path: '/orders',    icon: ClipboardList,   label: 'Atendimentos' },
  { path: '/orders/new',icon: Plus,            label: 'Novo Atendimento' },
]

const pageTitles = {
  '/':           { title: 'Dashboard',         sub: 'Visão geral do negócio' },
  '/clients':    { title: 'Clientes',          sub: 'Gerenciamento de clientes' },
  '/orders':     { title: 'Atendimentos',      sub: 'Vendas e manutenções' },
  '/orders/new': { title: 'Novo Atendimento',  sub: 'Registrar venda ou serviço' },
}

function Avatar({ name, size = 32 }) {
  const colors = ['#0A66FF','#7C3AED','#DC2626','#D97706','#16A34A','#0891B2']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  const ini = (name || 'A').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.34, fontWeight: 600, flexShrink: 0,
    }}>{ini}</div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const info = pageTitles[location.pathname] || pageTitles['/']

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'Instrument Sans,sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width:215, background:T.sidebar, display:'flex', flexDirection:'column', flexShrink:0, borderRight:`1px solid ${T.sb}` }}>
        {/* Logo */}
        <div style={{ padding:'20px 18px 14px', borderBottom:`1px solid ${T.sb}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, background:'#fff', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Smartphone size={16} style={{ color:T.sidebar }}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'-0.2px' }}>iStore</div>
              <div style={{ fontSize:10, color:T.st, marginTop:1 }}>Gestão Premium</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding:'12px 10px', flex:1 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.22)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'0 10px', marginBottom:6 }}>Menu</div>
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <button key={item.path} onClick={()=>navigate(item.path)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:8, cursor:'pointer', border:'none',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? '#fff' : T.st,
                fontSize:13, fontWeight: active ? 600 : 400, marginBottom:1,
                transition:'all .15s', textAlign:'left', fontFamily:'Instrument Sans,sans-serif',
                boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
              }}>
                <item.icon size={16}/>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding:'12px 14px', borderTop:`1px solid ${T.sb}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Avatar name={user?.name || 'Admin'} size={30}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize:10, color:T.st }}>{user?.role}</div>
            </div>
            <button onClick={logout} title="Sair" style={{ background:'none', border:'none', cursor:'pointer', color:T.st, padding:4, borderRadius:4, display:'flex', transition:'color .15s' }}>
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:T.bg }}>
        {/* Topbar */}
        <header style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'0 24px', height:58, display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.2px' }}>{info.title}</div>
            <div style={{ fontSize:11, color:T.t3, marginTop:1 }}>{info.sub}</div>
          </div>
          {['/clients','/orders'].includes(location.pathname) && (
            <button onClick={()=>navigate('/orders/new')} style={{
              display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
              background:T.text, color:'#fff', border:'none', borderRadius:8,
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Instrument Sans,sans-serif',
            }}>
              <Plus size={14}/>
              Novo Atendimento
            </button>
          )}
          <div style={{ width:1, height:22, background:T.border }}/>
          <button style={{ background:'none', border:'none', cursor:'pointer', color:T.t2, display:'flex' }}>
            <Bell size={17}/>
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', padding:24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

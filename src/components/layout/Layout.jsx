import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import {
  LayoutDashboard, Users, ClipboardList, Plus, LogOut,
  Smartphone, ArrowLeft,
} from 'lucide-react'

const navItems = [
  { path:'/',           icon:LayoutDashboard, label:'Dashboard' },
  { path:'/clients',    icon:Users,           label:'Clientes'  },
  { path:'/orders',     icon:ClipboardList,   label:'Ordens'    },
  { path:'/orders/new', icon:Plus,            label:'Novo', cta:true },
]

const pageTitles = {
  '/':           { title:'Dashboard',        sub:'Visão geral do negócio' },
  '/clients':    { title:'Clientes',         sub:'Gerenciamento de clientes' },
  '/orders':     { title:'Atendimentos',     sub:'Vendas e manutenções' },
  '/orders/new': { title:'Novo Atendimento', sub:'Registrar venda ou serviço' },
}

function Avatar({ name, size=32 }) {
  const colors = ['#0A66FF','#7C3AED','#DC2626','#D97706','#16A34A','#0891B2']
  const color = colors[(name||'').charCodeAt(0) % colors.length]
  const ini = (name||'A').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:size*0.34, fontWeight:600, flexShrink:0 }}>
      {ini}
    </div>
  )
}

function MobileLayout({ user, logout, location, navigate, info, T }) {
  const isNewOrder = location.pathname === '/orders/new'
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', fontFamily:'Instrument Sans,sans-serif', background:T.bg }}>
      <header style={{ background:T.sidebar, padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        {isNewOrder
          ? <button onClick={()=>navigate('/orders')} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer', flexShrink:0 }}>
              <ArrowLeft size={16}/>
            </button>
          : <div style={{ width:30, height:30, background:T.blue, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Smartphone size={15} style={{ color:'#fff' }}/>
            </div>
        }
        <div style={{ flex:1, fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-0.2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {info.title}
        </div>
        <button onClick={logout} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', display:'flex' }}>
          <LogOut size={18}/>
        </button>
      </header>

      <main style={{ flex:1, overflowY:'auto', padding:'16px 14px', paddingBottom:80 }}>
        <Outlet/>
      </main>

      <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:100, background:T.sidebar, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', paddingBottom:'env(safe-area-inset-bottom)', height:'calc(60px + env(safe-area-inset-bottom))' }}>
        {navItems.map(item => {
          const active = location.pathname === item.path
          if (item.cta) return (
            <button key={item.path} onClick={()=>navigate(item.path)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'none', background:'none', cursor:'pointer', height:60, padding:0 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:active?'#fff':T.blue, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(10,102,255,0.45)' }}>
                <item.icon size={20} style={{ color:active?T.sidebar:'#fff' }}/>
              </div>
            </button>
          )
          return (
            <button key={item.path} onClick={()=>navigate(item.path)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, border:'none', background:'none', cursor:'pointer', height:60, padding:'8px 4px' }}>
              <div style={{ width:36, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:active?'rgba(255,255,255,0.1)':'transparent' }}>
                <item.icon size={18} style={{ color:active?'#fff':'rgba(255,255,255,0.45)' }}/>
              </div>
              <span style={{ fontSize:10, fontWeight:active?600:400, color:active?'#fff':'rgba(255,255,255,0.45)', fontFamily:'Instrument Sans,sans-serif' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function DesktopLayout({ user, logout, location, navigate, info, T }) {
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:'Instrument Sans,sans-serif' }}>
      <aside style={{ width:215, background:T.sidebar, display:'flex', flexDirection:'column', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding:'20px 18px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, background:T.blue, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Smartphone size={16} style={{ color:'#fff' }}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'-0.2px' }}>iStore</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:1 }}>Gestão Premium</div>
            </div>
          </div>
        </div>

        <nav style={{ padding:'12px 10px', flex:1 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.22)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'0 10px', marginBottom:8 }}>Menu</div>
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <button key={item.path} onClick={()=>navigate(item.path)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', border:'none', background:active?'rgba(255,255,255,0.08)':'transparent', color:active?'#fff':'rgba(255,255,255,0.45)', fontSize:13, fontWeight:active?600:400, marginBottom:1, transition:'all .15s', textAlign:'left', fontFamily:'Instrument Sans,sans-serif', boxShadow:active?'inset 0 0 0 1px rgba(255,255,255,0.06)':'none' }}>
                <item.icon size={16}/>{item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Avatar name={user?.name||'Admin'} size={30}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name||'Admin'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{user?.role}</div>
            </div>
            <button onClick={logout} title="Sair" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:4, display:'flex' }}>
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:T.bg }}>
        <header style={{ background:T.surface, borderBottom:`1px solid ${T.ink5}`, padding:'0 24px', height:58, display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.2px', color:T.ink }}>{info.title}</div>
            <div style={{ fontSize:11, color:T.ink4, marginTop:1 }}>{info.sub}</div>
          </div>
          {['/clients','/orders'].includes(location.pathname) && (
            <button onClick={()=>navigate('/orders/new')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:T.ink, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Instrument Sans,sans-serif' }}>
              <Plus size={14}/>Novo
            </button>
          )}
        </header>
        <main style={{ flex:1, overflowY:'auto', padding:24 }}><Outlet/></main>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { T } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const info = pageTitles[location.pathname] || pageTitles['/']

  const props = { user, logout, location, navigate, info, T }
  return isMobile ? <MobileLayout {...props}/> : <DesktopLayout {...props}/>
}

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import {
  LayoutDashboard, Users, ClipboardList, Plus, Search, Bell, Settings,
  ChevronRight, TrendingUp, TrendingDown, Phone, Mail, MapPin, Shield,
  Smartphone, Wrench, CreditCard, DollarSign, Banknote, Zap, ArrowUpRight,
  LogOut, Eye, EyeOff, X, Check, AlertCircle, Download, RefreshCw,
  Filter, MoreHorizontal, Star, Clock, Activity, ChevronDown, Hash,
  Package, FileText, Send, CheckCircle2, XCircle, Loader2, ArrowLeft,
  SlidersHorizontal, Calendar, BarChart3, PieChart
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  sidebar: "#0C0C0E",
  sidebarBorder: "rgba(255,255,255,0.06)",
  sidebarText: "rgba(255,255,255,0.5)",
  sidebarActive: "rgba(255,255,255,0.08)",
  sidebarActiveText: "#FFFFFF",
  bg: "#F7F7F8",
  surface: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  borderStrong: "rgba(0,0,0,0.12)",
  text: "#0C0C0E",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  accent: "#0A66FF",
  accentLight: "#EEF4FF",
  accentDark: "#0052CC",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  red: "#DC2626",
  redBg: "#FEF2F2",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  shadow: "0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
  radius: "12px",
  radiusSm: "8px",
  radiusXs: "6px",
  radiusFull: "999px",
};

// ─── Fonts ────────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Instrument Sans',sans-serif; background:${T.bg}; color:${T.text}; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12); border-radius:2px; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .fade-in { animation:fadeIn .25s ease forwards; }
  .slide-in { animation:slideIn .2s ease forwards; }
  .scale-in { animation:scaleIn .2s ease forwards; }
  .spin { animation:spin 1s linear infinite; }
  .btn-hover { transition:all .15s ease; }
  .btn-hover:hover { transform:translateY(-1px); }
  .btn-hover:active { transform:translateY(0) scale(0.98); }
  .row-hover:hover { background:${T.bg} !important; }
  .nav-hover:hover { background:${T.sidebarActive}; }
  input, textarea, select { font-family:'Instrument Sans',sans-serif; }
  input:focus, textarea:focus, select:focus { outline:none; }
`;
document.head.appendChild(globalStyle);

// ─── Mock data ────────────────────────────────────────────────────────────────
const CLIENTS = [
  { id:"c1", name:"Maria Silva Santos", cpf:"529.982.247-25", phone:"(11) 98765-4321", email:"maria@email.com", city:"São Paulo", state:"SP", orders:4, totalSpent:24196, since:"Jan 2024" },
  { id:"c2", name:"Carlos Eduardo Oliveira", cpf:"111.444.777-35", phone:"(21) 91234-5678", email:"carlos@email.com", city:"Rio de Janeiro", state:"RJ", orders:2, totalSpent:8598, since:"Jan 2024" },
  { id:"c3", name:"Ana Paula Rodrigues", cpf:"714.287.938-60", phone:"(31) 93456-7890", email:null, city:"Belo Horizonte", state:"MG", orders:1, totalSpent:350, since:"Jan 2024" },
  { id:"c4", name:"Pedro Henrique Lima", cpf:"264.372.088-73", phone:"(11) 94567-8901", email:"pedro@email.com", city:"São Paulo", state:"SP", orders:3, totalSpent:15297, since:"Dez 2023" },
  { id:"c5", name:"Juliana Costa Ferreira", cpf:"348.417.785-65", phone:"(47) 95678-9012", email:"juliana@email.com", city:"Joinville", state:"SC", orders:1, totalSpent:220, since:"Jan 2024" },
  { id:"c6", name:"Roberto Almeida Cruz", cpf:"123.456.789-09", phone:"(85) 96789-0123", email:"roberto@email.com", city:"Fortaleza", state:"CE", orders:2, totalSpent:9398, since:"Fev 2024" },
];

const ORDERS = [
  { id:"o1", number:"AT-20240115-10001", clientId:"c1", client:"Maria Silva Santos", type:"venda", model:"iPhone 15 Pro", capacity:"256GB", color:"Titânio Natural", imei:"351234567890123", price:6899, warranty:12, payment:["pix"], status:"concluido", date:"15/01/2024" },
  { id:"o2", number:"AT-20240116-10002", clientId:"c2", client:"Carlos Eduardo Oliveira", type:"venda", model:"iPhone 14", capacity:"128GB", color:"Meia-noite", imei:"358765432109876", price:4299, warranty:6, payment:["cartao_credito"], status:"concluido", date:"16/01/2024" },
  { id:"o3", number:"AT-20240117-10003", clientId:"c3", client:"Ana Paula Rodrigues", type:"manutencao", model:"iPhone 13 Pro Max", capacity:"256GB", color:"Grafite", imei:"354321098765432", price:350, warranty:3, payment:["dinheiro","pix"], status:"em_andamento", date:"17/01/2024" },
  { id:"o4", number:"AT-20240120-10004", clientId:"c4", client:"Pedro Henrique Lima", type:"venda", model:"iPhone 15 Pro Max", capacity:"512GB", color:"Titânio Azul", imei:"", price:8799, warranty:12, payment:["iphone_entrada","pix"], status:"aberto", date:"20/01/2024" },
  { id:"o5", number:"AT-20240121-10005", clientId:"c5", client:"Juliana Costa Ferreira", type:"manutencao", model:"iPhone 12", capacity:"128GB", color:"Branco", imei:"356543210987654", price:220, warranty:3, payment:["cartao_debito"], status:"aberto", date:"21/01/2024" },
  { id:"o6", number:"AT-20240122-10006", clientId:"c1", client:"Maria Silva Santos", type:"venda", model:"iPhone 16 Pro", capacity:"256GB", color:"Titânio Desert", imei:"353214567890123", price:9199, warranty:12, payment:["pix"], status:"aberto", date:"22/01/2024" },
  { id:"o7", number:"AT-20240123-10007", clientId:"c6", client:"Roberto Almeida Cruz", type:"venda", model:"iPhone 15", capacity:"128GB", color:"Rosa", imei:"357890123456789", price:5199, warranty:6, payment:["cartao_credito"], status:"concluido", date:"23/01/2024" },
];

const REVENUE_DATA = [
  { day:"Seg", v:4200 }, { day:"Ter", v:6800 }, { day:"Qua", v:3200 }, { day:"Qui", v:9100 },
  { day:"Sex", v:12400 }, { day:"Sáb", v:15200 }, { day:"Dom", v:8700 },
];

const MONTHLY_DATA = [
  { m:"Out", v:42000 }, { m:"Nov", v:58000 }, { m:"Dez", v:71000 }, { m:"Jan", v:65000 },
];

const IPHONE_MODELS = [
  { series:"16", models:["iPhone 16","iPhone 16 Plus","iPhone 16 Pro","iPhone 16 Pro Max"] },
  { series:"15", models:["iPhone 15","iPhone 15 Plus","iPhone 15 Pro","iPhone 15 Pro Max"] },
  { series:"14", models:["iPhone 14","iPhone 14 Plus","iPhone 14 Pro","iPhone 14 Pro Max"] },
  { series:"13", models:["iPhone 13 mini","iPhone 13","iPhone 13 Pro","iPhone 13 Pro Max"] },
  { series:"12", models:["iPhone 12 mini","iPhone 12","iPhone 12 Pro","iPhone 12 Pro Max"] },
  { series:"SE", models:["iPhone SE (1ª gen)","iPhone SE (2ª gen)","iPhone SE (3ª gen)"] },
  { series:"11", models:["iPhone 11","iPhone 11 Pro","iPhone 11 Pro Max"] },
];

const STATUS = {
  aberto: { label:"Aberto", color:T.amber, bg:T.amberBg },
  em_andamento: { label:"Em andamento", color:T.accent, bg:T.accentLight },
  concluido: { label:"Concluído", color:T.green, bg:T.greenBg },
  cancelado: { label:"Cancelado", color:T.red, bg:T.redBg },
};

const PAY = { pix:"Pix", dinheiro:"Dinheiro", cartao_credito:"Crédito", cartao_debito:"Débito", iphone_entrada:"iPhone Entrada" };

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmtCurrency = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const initials = (name) => name.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
const avatarColor = (name) => {
  const colors = ["#0A66FF","#7C3AED","#DC2626","#D97706","#16A34A","#0891B2","#DB2777"];
  return colors[name.charCodeAt(0) % colors.length];
};

const maskCPF = (v) => {
  v = v.replace(/\D/g,"").slice(0,11);
  return v.replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2");
};
const maskPhone = (v) => {
  v = v.replace(/\D/g,"").slice(0,11);
  if(v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3");
  if(v.length > 6) return v.replace(/(\d{2})(\d{4})(\d+)/,"($1) $2-$3");
  if(v.length > 2) return v.replace(/(\d{2})(\d+)/,"($1) $2");
  return v;
};
const maskCEP = (v) => { v=v.replace(/\D/g,"").slice(0,8); return v.length>5?v.replace(/(\d{5})(\d+)/,"$1-$2"):v; };
const maskCurrency = (v) => {
  const n = v.replace(/\D/g,"");
  if(!n) return "";
  return (parseInt(n)/100).toLocaleString("pt-BR",{minimumFractionDigits:2});
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ─── Toast ────────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x=>x.id!==id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} className="fade-in" style={{
            background: t.type==="success" ? T.text : t.type==="error" ? T.red : T.accent,
            color:"#fff", padding:"12px 18px", borderRadius:T.radiusSm,
            fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:8,
            boxShadow:"0 8px 24px rgba(0,0,0,0.2)", minWidth:260,
          }}>
            {t.type==="success" ? <CheckCircle2 size={15}/> : t.type==="error" ? <XCircle size={15}/> : <AlertCircle size={15}/>}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────
function Avatar({ name, size=32, style={} }) {
  const color = avatarColor(name);
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", background:color,
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#fff", fontSize:size*0.35, fontWeight:600, flexShrink:0, ...style,
    }}>{initials(name)}</div>
  );
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.aberto;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
      borderRadius:T.radiusFull, fontSize:12, fontWeight:500,
      background:s.bg, color:s.color,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color }} />
      {s.label}
    </span>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} className="btn-hover" style={{
      padding:"6px 14px", borderRadius:T.radiusFull, fontSize:13, fontWeight:500,
      border:"none", cursor:"pointer", transition:"all .15s",
      background: active ? T.text : "transparent",
      color: active ? "#fff" : T.textSecondary,
    }}>{children}</button>
  );
}

function Input({ label, error, ...props }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary }}>{label}</label>}
      <input {...props} style={{
        width:"100%", padding:"9px 12px", border:`1px solid ${error?T.red:T.borderStrong}`,
        borderRadius:T.radiusSm, fontSize:13, color:T.text, background:T.surface,
        transition:"border-color .15s",
        ...props.style,
      }}
      onFocus={e=>e.target.style.borderColor=T.accent}
      onBlur={e=>e.target.style.borderColor=error?T.red:T.borderStrong}
      />
      {error && <span style={{ fontSize:11, color:T.red }}>{error}</span>}
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary }}>{label}</label>}
      <div style={{ position:"relative" }}>
        <select {...props} style={{
          width:"100%", padding:"9px 32px 9px 12px", border:`1px solid ${T.borderStrong}`,
          borderRadius:T.radiusSm, fontSize:13, color:T.text, background:T.surface,
          appearance:"none", cursor:"pointer", ...props.style,
        }}
        onFocus={e=>e.target.style.borderColor=T.accent}
        onBlur={e=>e.target.style.borderColor=T.borderStrong}
        >{children}</select>
        <ChevronDown size={13} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:T.textTertiary, pointerEvents:"none" }}/>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, width=560 }) {
  if(!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(4px)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={onClose}>
      <div className="scale-in" onClick={e=>e.stopPropagation()} style={{
        background:T.surface, borderRadius:16, width, maxWidth:"95vw", maxHeight:"90vh",
        overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08)",
      }}>
        <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:T.surface, zIndex:1 }}>
          <span style={{ fontSize:15, fontWeight:600 }}>{title}</span>
          <button onClick={onClose} style={{ background:T.bg, border:"none", width:28, height:28, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:T.textSecondary }}>
            <X size={14}/>
          </button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, label, value, sub, trend, delay=0 }) {
  return (
    <div className="fade-in" style={{
      background:T.surface, borderRadius:T.radius, boxShadow:T.shadow,
      padding:"20px 22px", display:"flex", flexDirection:"column", gap:12,
      animationDelay:`${delay}ms`,
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ width:36, height:36, borderRadius:T.radiusSm, background:iconColor+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={16} style={{ color:iconColor }}/>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize:12, fontWeight:500, display:"flex", alignItems:"center", gap:3, color:trend>=0?T.green:T.red }}>
            {trend>=0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, color:T.textSecondary, marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:T.textTertiary, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const { user, setUser } = useApp();
  const nav = [
    { id:"dashboard", icon:LayoutDashboard, label:"Dashboard" },
    { id:"clients", icon:Users, label:"Clientes" },
    { id:"orders", icon:ClipboardList, label:"Atendimentos" },
    { id:"new-order", icon:Plus, label:"Novo Atendimento" },
  ];
  return (
    <aside style={{
      width:220, background:T.sidebar, display:"flex", flexDirection:"column",
      flexShrink:0, borderRight:`1px solid ${T.sidebarBorder}`,
    }}>
      {/* Logo */}
      <div style={{ padding:"22px 20px 16px", borderBottom:`1px solid ${T.sidebarBorder}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, background:"#fff", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Smartphone size={16} style={{ color:T.sidebar }}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#fff", letterSpacing:"-0.2px" }}>iStore</div>
            <div style={{ fontSize:10, color:T.sidebarText, marginTop:1 }}>Gestão Premium</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:"12px 10px", flex:1 }}>
        <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.25)", letterSpacing:"0.8px", textTransform:"uppercase", padding:"0 10px", marginBottom:6 }}>Menu</div>
        {nav.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} className="nav-hover" onClick={()=>setPage(item.id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"9px 12px", borderRadius:T.radiusSm, cursor:"pointer",
              border:"none", background: active ? T.sidebarActive : "transparent",
              color: active ? T.sidebarActiveText : T.sidebarText,
              fontSize:13, fontWeight: active ? 600 : 400, marginBottom:1,
              transition:"all .15s", textAlign:"left",
              boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.08)" : "none",
            }}>
              <item.icon size={16}/>
              {item.label}
              {item.id === "orders" && (
                <span style={{ marginLeft:"auto", background:T.accent, color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:T.radiusFull }}>{ORDERS.filter(o=>o.status==="aberto").length}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:"12px 14px", borderTop:`1px solid ${T.sidebarBorder}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Avatar name={user?.name || "Admin"} size={30} style={{ flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name || "Administrador"}</div>
            <div style={{ fontSize:10, color:T.sidebarText }}>admin</div>
          </div>
          <button onClick={()=>setUser(null)} title="Sair" style={{ background:"none", border:"none", cursor:"pointer", color:T.sidebarText, padding:4, borderRadius:4, display:"flex", transition:"color .15s" }}
            onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=T.sidebarText}>
            <LogOut size={14}/>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ page, setPage, search, setSearch }) {
  const pages = {
    dashboard: { title:"Dashboard", sub:"Visão geral do negócio" },
    clients: { title:"Clientes", sub:"Gerenciamento de clientes" },
    orders: { title:"Atendimentos", sub:"Vendas e manutenções" },
    "new-order": { title:"Novo Atendimento", sub:"Registrar venda ou serviço" },
  };
  const info = pages[page] || pages.dashboard;
  const showSearch = ["clients","orders"].includes(page);

  return (
    <header style={{
      background:T.surface, borderBottom:`1px solid ${T.border}`,
      padding:"0 28px", height:60, display:"flex", alignItems:"center", gap:16, flexShrink:0,
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-0.2px" }}>{info.title}</div>
        <div style={{ fontSize:11, color:T.textTertiary, marginTop:1 }}>{info.sub}</div>
      </div>

      {showSearch && (
        <div style={{ position:"relative" }}>
          <Search size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:T.textTertiary }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{
            paddingLeft:32, paddingRight:12, paddingTop:8, paddingBottom:8,
            border:`1px solid ${T.borderStrong}`, borderRadius:T.radiusSm,
            fontSize:13, color:T.text, background:T.bg, width:220,
          }}
          onFocus={e=>e.target.style.borderColor=T.accent}
          onBlur={e=>e.target.style.borderColor=T.borderStrong}
          />
        </div>
      )}

      {["clients","orders"].includes(page) && (
        <button className="btn-hover" onClick={()=>setPage("new-order")} style={{
          display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
          background:T.text, color:"#fff", border:"none", borderRadius:T.radiusSm,
          fontSize:13, fontWeight:600, cursor:"pointer",
        }}>
          <Plus size={14}/>
          {page === "clients" ? "Novo Cliente" : "Novo Atendimento"}
        </button>
      )}

      <div style={{ width:1, height:24, background:T.border }}/>
      <button style={{ background:"none", border:"none", cursor:"pointer", color:T.textSecondary, display:"flex", position:"relative" }}>
        <Bell size={17}/>
        <span style={{ position:"absolute", top:-2, right:-2, width:7, height:7, background:T.accent, borderRadius:"50%", border:`2px solid ${T.surface}` }}/>
      </button>
    </header>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard() {
  const totalRevenue = ORDERS.filter(o=>o.type==="venda").reduce((s,o)=>s+o.price,0);
  const openOrders = ORDERS.filter(o=>o.status==="aberto").length;
  const completedToday = ORDERS.filter(o=>o.status==="concluido").length;

  const pieData = [
    { name:"Vendas", value:ORDERS.filter(o=>o.type==="venda").length, color:T.accent },
    { name:"Manutenções", value:ORDERS.filter(o=>o.type==="manutencao").length, color:"#8B5CF6" },
  ];

  return (
    <div className="fade-in" style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <StatCard icon={TrendingUp} iconColor={T.green} label="Receita Total" value={fmtCurrency(totalRevenue)} sub="Todas as vendas" trend={12} delay={0}/>
        <StatCard icon={ClipboardList} iconColor={T.accent} label="Atendimentos Abertos" value={openOrders} sub="Aguardando ação" delay={50}/>
        <StatCard icon={CheckCircle2} iconColor={T.green} label="Concluídos" value={completedToday} sub="Total concluído" trend={8} delay={100}/>
        <StatCard icon={Users} iconColor="#8B5CF6" label="Clientes" value={CLIENTS.length} sub="+2 este mês" trend={5} delay={150}/>
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:14 }}>
        {/* Area chart */}
        <div className="fade-in" style={{ background:T.surface, borderRadius:T.radius, boxShadow:T.shadow, padding:"20px 22px", animationDelay:"200ms" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>Receita Semanal</div>
              <div style={{ fontSize:12, color:T.textSecondary, marginTop:2 }}>Últimos 7 dias</div>
            </div>
            <div style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.5px" }}>
              {fmtCurrency(REVENUE_DATA.reduce((s,d)=>s+d.v,0))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={REVENUE_DATA} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.15}/>
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize:11, fill:T.textTertiary }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:T.textTertiary }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
              <Tooltip formatter={v=>[fmtCurrency(v),"Receita"]} contentStyle={{ background:T.text, border:"none", borderRadius:8, color:"#fff", fontSize:12 }} itemStyle={{ color:"#fff" }} labelStyle={{ color:"rgba(255,255,255,0.6)" }}/>
              <Area type="monotone" dataKey="v" stroke={T.accent} strokeWidth={2} fill="url(#revenueGrad)" dot={false} activeDot={{ r:4, fill:T.accent }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + breakdown */}
        <div className="fade-in" style={{ background:T.surface, borderRadius:T.radius, boxShadow:T.shadow, padding:"20px 22px", animationDelay:"250ms" }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Por tipo</div>
          <div style={{ fontSize:12, color:T.textSecondary, marginBottom:16 }}>{ORDERS.length} atendimentos total</div>
          <div style={{ display:"flex", justifyContent:"center" }}>
            <RPieChart width={120} height={120}>
              <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
            </RPieChart>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:T.textSecondary }}>{d.name}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:600 }}>{d.value}</span>
              </div>
            ))}
            <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:T.textSecondary }}>Ticket médio</span>
              <span style={{ fontSize:13, fontWeight:600 }}>{fmtCurrency(totalRevenue/ORDERS.filter(o=>o.type==="venda").length)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="fade-in" style={{ background:T.surface, borderRadius:T.radius, boxShadow:T.shadow, animationDelay:"300ms" }}>
        <div style={{ padding:"18px 22px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:14, fontWeight:600 }}>Últimos Atendimentos</div>
          <span style={{ fontSize:12, color:T.textSecondary }}>{ORDERS.length} registros</span>
        </div>
        <OrderTable orders={ORDERS.slice(0,5)} compact/>
      </div>
    </div>
  );
}

// ─── ORDER TABLE ──────────────────────────────────────────────────────────────
function OrderTable({ orders, compact=false, onSelect }) {
  const [detail, setDetail] = useState(null);
  const toast = useToast();

  return (
    <>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${T.border}` }}>
              {["Nº Atendimento","Cliente","Produto","Valor","Status",""].map((h,i) => (
                <th key={i} style={{ padding:`${compact?"10px":"12px"} ${i===0?"22px":"14px"}`, textAlign:"left", fontSize:11, fontWeight:600, color:T.textTertiary, letterSpacing:"0.4px", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o,i) => (
              <tr key={o.id} className="row-hover" onClick={()=>setDetail(o)} style={{ borderBottom:`1px solid ${T.border}`, cursor:"pointer", transition:"background .1s", animationDelay:`${i*30}ms` }}>
                <td style={{ padding:`${compact?"12px":"14px"} 22px`, fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:T.textSecondary }}>{o.number.slice(-12)}</td>
                <td style={{ padding:`${compact?"12px":"14px"} 14px` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Avatar name={o.client} size={28}/>
                    <span style={{ fontSize:13, fontWeight:500 }}>{o.client}</span>
                  </div>
                </td>
                <td style={{ padding:`${compact?"12px":"14px"} 14px` }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{o.model}</div>
                  <div style={{ fontSize:11, color:T.textTertiary }}>{o.capacity} {o.color && `· ${o.color}`}</div>
                </td>
                <td style={{ padding:`${compact?"12px":"14px"} 14px`, fontSize:13, fontWeight:700, letterSpacing:"-0.2px" }}>{fmtCurrency(o.price)}</td>
                <td style={{ padding:`${compact?"12px":"14px"} 14px` }}><Badge status={o.status}/></td>
                <td style={{ padding:`${compact?"12px":"14px"} 14px 12px 0`, textAlign:"right" }}>
                  <ChevronRight size={14} style={{ color:T.textTertiary }}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      <Modal open={!!detail} onClose={()=>setDetail(null)} title="Detalhes do Atendimento" width={600}>
        {detail && <OrderDetail order={detail} onClose={()=>setDetail(null)}/>}
      </Modal>
    </>
  );
}

function OrderDetail({ order, onClose }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const expiryDate = new Date("2024-01-15");
  expiryDate.setMonth(expiryDate.getMonth() + (order.warranty || 0));

  const downloadPDF = async () => {
    setLoading(true);
    await new Promise(r=>setTimeout(r,1500));
    setLoading(false);
    toast("PDF gerado com sucesso!");
    onClose();
  };

  const rows = [
    ["Nº Atendimento", order.number, true],
    ["Tipo", order.type==="venda"?"Venda":"Manutenção"],
    ["Data", order.date],
    ["Modelo", order.model],
    ["Capacidade", order.capacity || "—"],
    ["Cor", order.color || "—"],
    ["IMEI", order.imei || "—", true],
    ["Valor", fmtCurrency(order.price)],
    ["Pagamento", order.payment.map(p=>PAY[p]).join(", ")],
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Status banner */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:T.bg, borderRadius:T.radiusSm }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Avatar name={order.client} size={36}/>
          <div>
            <div style={{ fontSize:14, fontWeight:600 }}>{order.client}</div>
            <div style={{ fontSize:12, color:T.textSecondary }}>{order.number}</div>
          </div>
        </div>
        <Badge status={order.status}/>
      </div>

      {/* Warranty */}
      {order.warranty > 0 && (
        <div style={{ background:T.text, borderRadius:T.radiusSm, padding:"16px 20px", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <Shield size={14} style={{ color:"rgba(255,255,255,0.5)" }}/>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:600 }}>Garantia</span>
            </div>
            <div style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.5px" }}>{order.warranty} {order.warranty===1?"mês":"meses"}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>Válida até {expiryDate.toLocaleDateString("pt-BR")}</div>
          </div>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Shield size={22} style={{ color:"rgba(255,255,255,0.4)" }}/>
          </div>
        </div>
      )}

      {/* Details grid */}
      <div style={{ display:"flex", flexDirection:"column" }}>
        {rows.map(([label, value, mono], i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<rows.length-1?`1px solid ${T.border}`:"none" }}>
            <span style={{ fontSize:12, color:T.textSecondary }}>{label}</span>
            <span style={{ fontSize:13, fontWeight:500, fontFamily:mono?"'JetBrains Mono',monospace":"inherit", fontSize:mono?12:13 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:10, paddingTop:4 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px", border:`1px solid ${T.borderStrong}`, borderRadius:T.radiusSm, background:"transparent", cursor:"pointer", fontSize:13, fontWeight:500, color:T.textSecondary }}>
          Fechar
        </button>
        <button className="btn-hover" onClick={downloadPDF} disabled={loading} style={{ flex:2, padding:"10px", background:T.text, color:"#fff", border:"none", borderRadius:T.radiusSm, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          {loading ? <Loader2 size={14} className="spin"/> : <Download size={14}/>}
          {loading ? "Gerando PDF..." : "Baixar Termo de Garantia"}
        </button>
      </div>
    </div>
  );
}

// ─── CLIENTS PAGE ─────────────────────────────────────────────────────────────
function ClientsPage({ search }) {
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const filtered = CLIENTS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search) || (c.email||"").includes(search) || c.phone.includes(search)
  );

  return (
    <>
      <div className="fade-in" style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          <StatCard icon={Users} iconColor={T.accent} label="Total de Clientes" value={CLIENTS.length} delay={0}/>
          <StatCard icon={TrendingUp} iconColor={T.green} label="Receita Gerada" value={fmtCurrency(CLIENTS.reduce((s,c)=>s+c.totalSpent,0))} delay={50}/>
          <StatCard icon={Star} iconColor={T.amber} label="Ticket Médio" value={fmtCurrency(CLIENTS.reduce((s,c)=>s+c.totalSpent,0)/CLIENTS.length)} delay={100}/>
        </div>

        <div style={{ background:T.surface, borderRadius:T.radius, boxShadow:T.shadow, overflow:"hidden" }}>
          <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{filtered.length} cliente{filtered.length!==1?"s":""}</span>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                {["Cliente","Telefone / E-mail","Localização","Atendimentos","Gasto Total",""].map((h,i) => (
                  <th key={i} style={{ padding:`10px ${i===0?"22px":"14px"}`, textAlign:"left", fontSize:11, fontWeight:600, color:T.textTertiary, letterSpacing:"0.4px", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i) => (
                <tr key={c.id} className="row-hover" onClick={()=>setSelected(c)} style={{ borderBottom:`1px solid ${T.border}`, cursor:"pointer", transition:"background .1s" }}>
                  <td style={{ padding:"14px 22px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Avatar name={c.name} size={34}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                        <div style={{ fontSize:11, color:T.textTertiary, fontFamily:"'JetBrains Mono',monospace" }}>{c.cpf}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                      <span style={{ fontSize:12, display:"flex", alignItems:"center", gap:5, color:T.textSecondary }}><Phone size={11}/>{c.phone}</span>
                      {c.email && <span style={{ fontSize:12, display:"flex", alignItems:"center", gap:5, color:T.textSecondary }}><Mail size={11}/>{c.email}</span>}
                    </div>
                  </td>
                  <td style={{ padding:"14px" }}>
                    <span style={{ fontSize:12, display:"flex", alignItems:"center", gap:5, color:T.textSecondary }}><MapPin size={11}/>{c.city}/{c.state}</span>
                  </td>
                  <td style={{ padding:"14px" }}>
                    <span style={{ background:T.accentLight, color:T.accent, fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:T.radiusFull }}>{c.orders}</span>
                  </td>
                  <td style={{ padding:"14px", fontSize:13, fontWeight:700, letterSpacing:"-0.3px" }}>{fmtCurrency(c.totalSpent)}</td>
                  <td style={{ padding:"14px 14px 14px 0", textAlign:"right" }}><ChevronRight size={14} style={{ color:T.textTertiary }}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={()=>setSelected(null)} title="Perfil do Cliente" width={520}>
        {selected && <ClientDetail client={selected} onClose={()=>setSelected(null)}/>}
      </Modal>
    </>
  );
}

function ClientDetail({ client, onClose }) {
  const clientOrders = ORDERS.filter(o=>o.clientId===client.id);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", background:T.bg, borderRadius:T.radiusSm }}>
        <Avatar name={client.name} size={52}/>
        <div>
          <div style={{ fontSize:16, fontWeight:700 }}>{client.name}</div>
          <div style={{ fontSize:12, color:T.textSecondary, marginTop:3 }}>Cliente desde {client.since}</div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <span style={{ background:T.accentLight, color:T.accent, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:T.radiusFull }}>{client.orders} atendimentos</span>
            <span style={{ background:T.greenBg, color:T.green, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:T.radiusFull }}>{fmtCurrency(client.totalSpent)}</span>
          </div>
        </div>
      </div>
      {[["CPF",client.cpf,true],["Telefone",client.phone],["E-mail",client.email||"—"],["Cidade",`${client.city}/${client.state}`]].map(([l,v,mono],i,a) => (
        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:i<a.length-1?`1px solid ${T.border}`:"none" }}>
          <span style={{ fontSize:12, color:T.textSecondary }}>{l}</span>
          <span style={{ fontSize:13, fontWeight:500, fontFamily:mono?"'JetBrains Mono',monospace":"inherit", fontSize:mono?12:13 }}>{v}</span>
        </div>
      ))}
      {clientOrders.length > 0 && (
        <>
          <div style={{ fontSize:13, fontWeight:600, paddingTop:4 }}>Histórico</div>
          {clientOrders.map(o => (
            <div key={o.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:T.bg, borderRadius:T.radiusSm }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>{o.model} {o.capacity}</div>
                <div style={{ fontSize:11, color:T.textTertiary, marginTop:2 }}>{o.number} · {o.date}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{fmtCurrency(o.price)}</div>
                <div style={{ marginTop:4 }}><Badge status={o.status}/></div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
function OrdersPage({ search }) {
  const [activeTab, setActiveTab] = useState("");
  const tabs = [
    { v:"", l:"Todos", count:ORDERS.length },
    { v:"aberto", l:"Abertos", count:ORDERS.filter(o=>o.status==="aberto").length },
    { v:"em_andamento", l:"Em andamento", count:ORDERS.filter(o=>o.status==="em_andamento").length },
    { v:"concluido", l:"Concluídos", count:ORDERS.filter(o=>o.status==="concluido").length },
  ];
  const filtered = ORDERS.filter(o =>
    (!activeTab || o.status === activeTab) &&
    (!search || o.number.toLowerCase().includes(search.toLowerCase()) ||
     o.client.toLowerCase().includes(search.toLowerCase()) ||
     o.model.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fade-in" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatCard icon={ClipboardList} iconColor={T.accent} label="Total" value={ORDERS.length} delay={0}/>
        <StatCard icon={Clock} iconColor={T.amber} label="Abertos" value={ORDERS.filter(o=>o.status==="aberto").length} delay={50}/>
        <StatCard icon={Activity} iconColor={T.accent} label="Em andamento" value={ORDERS.filter(o=>o.status==="em_andamento").length} delay={100}/>
        <StatCard icon={CheckCircle2} iconColor={T.green} label="Concluídos" value={ORDERS.filter(o=>o.status==="concluido").length} delay={150}/>
      </div>

      <div style={{ background:T.surface, borderRadius:T.radius, boxShadow:T.shadow, overflow:"hidden" }}>
        <div style={{ padding:"0 22px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:2 }}>
          {tabs.map(t => (
            <button key={t.v} onClick={()=>setActiveTab(t.v)} style={{
              padding:"14px 14px", fontSize:13, fontWeight:activeTab===t.v?600:400,
              color:activeTab===t.v?T.text:T.textSecondary, background:"none", border:"none",
              cursor:"pointer", borderBottom:`2px solid ${activeTab===t.v?T.text:"transparent"}`,
              display:"flex", alignItems:"center", gap:6, transition:"all .15s", marginBottom:-1,
            }}>
              {t.l}
              <span style={{ fontSize:11, fontWeight:600, padding:"1px 6px", borderRadius:T.radiusFull, background:activeTab===t.v?T.text:T.bg, color:activeTab===t.v?"#fff":T.textTertiary }}>{t.count}</span>
            </button>
          ))}
        </div>
        <OrderTable orders={filtered}/>
      </div>
    </div>
  );
}

// ─── NEW ORDER FORM ───────────────────────────────────────────────────────────
function NewOrderPage({ setPage }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [form, setForm] = useState({
    clientId:"", type:"venda", model:"", capacity:"", color:"", imei:"",
    price:"", warranty:"12", notes:""
  });
  const [errors, setErrors] = useState({});
  const modelRef = useRef(null);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const filteredModels = IPHONE_MODELS.map(g => ({
    ...g,
    models: g.models.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
  })).filter(g=>g.models.length>0);

  const togglePayment = (v) => setSelectedPayments(p => p.includes(v) ? p.filter(x=>x!==v) : [...p,v]);

  const validate = () => {
    const e = {};
    if(!form.clientId) e.clientId="Selecione um cliente";
    if(!form.model) e.model="Selecione o modelo";
    if(!form.price) e.price="Informe o valor";
    if(!selectedPayments.length) e.payment="Selecione ao menos uma forma";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if(!validate()) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,1800));
    setLoading(false);
    toast("✅ Atendimento registrado! Termo de garantia enviado por e-mail.");
    setPage("orders");
  };

  const steps = [
    { n:1, label:"Cliente & Tipo" },
    { n:2, label:"Produto" },
    { n:3, label:"Pagamento & Garantia" },
  ];

  const payOpts = [
    { v:"pix", l:"Pix", icon:Zap },
    { v:"dinheiro", l:"Dinheiro", icon:Banknote },
    { v:"cartao_credito", l:"Crédito", icon:CreditCard },
    { v:"cartao_debito", l:"Débito", icon:CreditCard },
    { v:"iphone_entrada", l:"iPhone Entrada", icon:Smartphone },
  ];

  return (
    <div className="fade-in" style={{ maxWidth:680, margin:"0 auto" }}>
      {/* Steps */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:28, background:T.surface, borderRadius:T.radius, padding:"14px 22px", boxShadow:T.shadow }}>
        {steps.map((s,i) => (
          <div key={s.n} style={{ display:"flex", alignItems:"center", gap:0, flex:i<steps.length-1?1:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700,
                background: step>s.n ? T.green : step===s.n ? T.text : T.bg,
                color: step>s.n ? "#fff" : step===s.n ? "#fff" : T.textTertiary,
                transition:"all .2s",
              }}>
                {step > s.n ? <Check size={13}/> : s.n}
              </div>
              <span style={{ fontSize:13, fontWeight: step===s.n?600:400, color:step===s.n?T.text:T.textTertiary }}>{s.label}</span>
            </div>
            {i < steps.length-1 && <div style={{ flex:1, height:1, background:T.border, margin:"0 14px" }}/>}
          </div>
        ))}
      </div>

      <div style={{ background:T.surface, borderRadius:T.radius, boxShadow:T.shadow, padding:28 }}>
        {/* STEP 1 */}
        {step === 1 && (
          <div className="fade-in" style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Cliente e tipo de atendimento</div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:6 }}>Cliente *</label>
              <div style={{ position:"relative" }}>
                <Users size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:T.textTertiary }}/>
                <select value={form.clientId} onChange={e=>set("clientId",e.target.value)} style={{
                  width:"100%", padding:"9px 32px 9px 32px", border:`1px solid ${errors.clientId?T.red:T.borderStrong}`,
                  borderRadius:T.radiusSm, fontSize:13, color:form.clientId?T.text:T.textTertiary,
                  background:T.surface, appearance:"none", cursor:"pointer",
                }}>
                  <option value="">Selecionar cliente...</option>
                  {CLIENTS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={13} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", color:T.textTertiary, pointerEvents:"none" }}/>
              </div>
              {errors.clientId && <span style={{ fontSize:11, color:T.red, marginTop:4, display:"block" }}>{errors.clientId}</span>}
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:8 }}>Tipo de atendimento *</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[{v:"venda",l:"Venda",icon:Smartphone,desc:"iPhone novo ou usado"},{v:"manutencao",l:"Manutenção",icon:Wrench,desc:"Reparo ou serviço técnico"}].map(t => (
                  <button key={t.v} onClick={()=>set("type",t.v)} style={{
                    padding:"14px 16px", borderRadius:T.radiusSm, cursor:"pointer", textAlign:"left",
                    border:`1.5px solid ${form.type===t.v?T.text:T.border}`,
                    background:form.type===t.v?T.text:T.surface, transition:"all .15s",
                    display:"flex", flexDirection:"column", gap:6,
                  }}>
                    <t.icon size={18} style={{ color:form.type===t.v?"#fff":T.textSecondary }}/>
                    <div style={{ fontSize:14, fontWeight:600, color:form.type===t.v?"#fff":T.text }}>{t.l}</div>
                    <div style={{ fontSize:11, color:form.type===t.v?"rgba(255,255,255,0.6)":T.textTertiary }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="fade-in" style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Informações do produto</div>

            {/* Model selector */}
            <div ref={modelRef} style={{ position:"relative" }}>
              <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:6 }}>Modelo do iPhone *</label>
              <div style={{ position:"relative" }}>
                <Smartphone size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:T.textTertiary }}/>
                <input value={form.model || modelSearch} onChange={e=>{setModelSearch(e.target.value);set("model","");setModelOpen(true);}}
                  onFocus={()=>setModelOpen(true)}
                  placeholder="Buscar modelo..." style={{
                    width:"100%", padding:"9px 12px 9px 32px",
                    border:`1px solid ${errors.model?T.red:T.borderStrong}`,
                    borderRadius:T.radiusSm, fontSize:13, color:T.text, background:T.surface,
                  }}
                />
              </div>
              {errors.model && <span style={{ fontSize:11, color:T.red, marginTop:4, display:"block" }}>{errors.model}</span>}
              {modelOpen && (
                <div style={{
                  position:"absolute", top:"100%", left:0, right:0, background:T.surface, zIndex:200,
                  border:`1px solid ${T.borderStrong}`, borderRadius:T.radiusSm, boxShadow:T.shadowLg,
                  maxHeight:220, overflowY:"auto", marginTop:2,
                }}>
                  {filteredModels.map(g => (
                    <div key={g.series}>
                      <div style={{ padding:"6px 12px 3px", fontSize:10, fontWeight:700, color:T.textTertiary, textTransform:"uppercase", letterSpacing:"0.5px", background:T.bg }}>{g.series}</div>
                      {g.models.map(m => (
                        <div key={m} onClick={()=>{set("model",m);setModelSearch(m);setModelOpen(false);}} style={{ padding:"9px 14px", fontSize:13, cursor:"pointer", color:T.text, transition:"background .1s" }}
                          onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                        >{m}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <Select label="Capacidade" value={form.capacity} onChange={e=>set("capacity",e.target.value)}>
                <option value="">Selecionar...</option>
                {["16GB","32GB","64GB","128GB","256GB","512GB","1TB"].map(c=><option key={c}>{c}</option>)}
              </Select>
              <Input label="Cor" placeholder="Ex: Titânio Natural" value={form.color} onChange={e=>set("color",e.target.value)}/>
            </div>

            <Input label="IMEI (opcional)" placeholder="15 dígitos" value={form.imei}
              onChange={e=>set("imei",e.target.value.replace(/\D/g,"").slice(0,15))}
              style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, letterSpacing:"1px" }}
            />

            <div style={{ background:T.bg, borderRadius:T.radiusSm, padding:"12px 14px", display:"flex", gap:8 }}>
              <AlertCircle size={14} style={{ color:T.textTertiary, flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, color:T.textSecondary }}>O IMEI é validado pelo algoritmo de Luhn e deve ter 15 dígitos. Deixe em branco se não disponível.</span>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="fade-in" style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Pagamento e garantia</div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:6 }}>Valor (R$) *</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.textTertiary, fontWeight:500 }}>R$</span>
                  <input value={form.price} onChange={e=>set("price",maskCurrency(e.target.value))} placeholder="0,00" style={{
                    width:"100%", padding:"9px 12px 9px 32px",
                    border:`1px solid ${errors.price?T.red:T.borderStrong}`,
                    borderRadius:T.radiusSm, fontSize:16, fontWeight:700, color:T.text,
                    background:T.surface, letterSpacing:"-0.3px",
                  }}/>
                </div>
                {errors.price && <span style={{ fontSize:11, color:T.red, marginTop:4, display:"block" }}>{errors.price}</span>}
              </div>
              <Input type="number" label="Garantia (meses)" placeholder="Ex: 12" min="0" max="60" value={form.warranty} onChange={e=>set("warranty",e.target.value)}/>
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:8 }}>Formas de pagamento *</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {payOpts.map(p => {
                  const active = selectedPayments.includes(p.v);
                  return (
                    <button key={p.v} onClick={()=>togglePayment(p.v)} style={{
                      display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
                      borderRadius:T.radiusFull, fontSize:13, fontWeight:500,
                      border:`1.5px solid ${active?T.text:T.border}`,
                      background:active?T.text:"transparent",
                      color:active?"#fff":T.textSecondary, cursor:"pointer", transition:"all .15s",
                    }}>
                      <p.icon size={13}/>{p.l}
                      {active && <Check size={12}/>}
                    </button>
                  );
                })}
              </div>
              {errors.payment && <span style={{ fontSize:11, color:T.red, marginTop:4, display:"block" }}>{errors.payment}</span>}
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:500, color:T.textSecondary, display:"block", marginBottom:6 }}>Observações</label>
              <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3}
                placeholder="Condições do aparelho, defeitos, acordos especiais..."
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${T.borderStrong}`, borderRadius:T.radiusSm, fontSize:13, color:T.text, resize:"vertical", fontFamily:"'Instrument Sans',sans-serif" }}/>
            </div>

            {/* Summary */}
            {form.price && (
              <div style={{ background:T.text, borderRadius:T.radiusSm, padding:"16px 18px", color:"#fff" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8, fontWeight:600 }}>Resumo</div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{form.model || "iPhone"} {form.capacity}</span>
                  <span style={{ fontSize:15, fontWeight:700 }}>R$ {form.price}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Garantia: {form.warranty || 0} meses</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{selectedPayments.map(p=>PAY[p]).join(", ")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:"flex", gap:10, marginTop:28, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
          {step > 1 && (
            <button onClick={()=>setStep(s=>s-1)} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px", border:`1px solid ${T.borderStrong}`, borderRadius:T.radiusSm, background:"transparent", cursor:"pointer", fontSize:13, fontWeight:500, color:T.textSecondary }}>
              <ArrowLeft size={14}/> Voltar
            </button>
          )}
          <button className="btn-hover" disabled={loading} onClick={step<3?()=>setStep(s=>s+1):handleSubmit} style={{
            flex:1, padding:"10px 24px", background:T.text, color:"#fff", border:"none",
            borderRadius:T.radiusSm, cursor:"pointer", fontSize:13, fontWeight:600,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
            {loading ? <Loader2 size={14} className="spin"/> : step < 3 ? null : <Send size={14}/>}
            {loading ? "Registrando..." : step < 3 ? `Próximo (${step}/3)` : "Registrar Atendimento"}
            {!loading && step < 3 && <ChevronRight size={14}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@iphonestore.com.br");
  const [password, setPassword] = useState("Admin@123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if(!email || !password) { setError("Preencha todos os campos."); return; }
    setLoading(true); setError("");
    await new Promise(r=>setTimeout(r,1200));
    if(email === "admin@iphonestore.com.br" && password === "Admin@123") {
      onLogin({ name:"Administrador", email, role:"admin" });
    } else {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.sidebar, display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>
      {/* Background decoration */}
      <div style={{ position:"absolute", top:"-20%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(10,102,255,0.08) 0%, transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:"-20%", left:"-10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)", pointerEvents:"none" }}/>

      <div className="scale-in" style={{ width:"100%", maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:56, height:56, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <Smartphone size={26} style={{ color:"#fff" }}/>
          </div>
          <div style={{ fontSize:24, fontWeight:700, color:"#fff", letterSpacing:"-0.5px" }}>iStore</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.35)", marginTop:4 }}>Sistema de Gestão Premium</div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:32, backdropFilter:"blur(12px)" }}>
          {error && (
            <div style={{ background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
              <AlertCircle size={14} style={{ color:T.red, flexShrink:0 }}/>
              <span style={{ fontSize:13, color:"#FCA5A5" }}>{error}</span>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:6 }}>E-mail</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError("");}} placeholder="seu@email.com"
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:T.radiusSm, fontSize:14, color:"#fff", outline:"none" }}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:6 }}>Senha</label>
              <div style={{ position:"relative" }}>
                <input type={show?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setError("");}}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  style={{ width:"100%", padding:"10px 40px 10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:T.radiusSm, fontSize:14, color:"#fff", outline:"none" }}/>
                <button onClick={()=>setShow(!show)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)" }}>
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
          </div>

          <button className="btn-hover" onClick={handleLogin} disabled={loading} style={{
            width:"100%", marginTop:22, padding:"12px", background:"#fff", color:T.sidebar,
            border:"none", borderRadius:T.radiusSm, fontSize:14, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8, letterSpacing:"-0.2px",
          }}>
            {loading ? <><Loader2 size={15} className="spin"/>Entrando...</> : "Entrar"}
          </button>

          <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"rgba(255,255,255,0.2)" }}>
            admin@iphonestore.com.br · Admin@123
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");

  useEffect(() => { setSearch(""); }, [page]);

  if(!user) return <ToastProvider><Login onLogin={setUser}/></ToastProvider>;

  return (
    <ToastProvider>
      <AppCtx.Provider value={{ user, setUser }}>
        <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Instrument Sans',sans-serif" }}>
          <Sidebar page={page} setPage={p=>{setPage(p);setSearch("");}}/>
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:T.bg }}>
            <Topbar page={page} setPage={setPage} search={search} setSearch={setSearch}/>
            <main style={{ flex:1, overflowY:"auto", padding:24 }}>
              {page === "dashboard" && <Dashboard/>}
              {page === "clients" && <ClientsPage search={search}/>}
              {page === "orders" && <OrdersPage search={search}/>}
              {page === "new-order" && <NewOrderPage setPage={setPage}/>}
            </main>
          </div>
        </div>
      </AppCtx.Provider>
    </ToastProvider>
  );
}

import { useState, useMemo, Component } from 'react'
import PeriodFilter, { periodToParams } from '../components/PeriodFilter'
import { useOrderStats } from '../hooks/useData'
import { useIsMobile } from '../hooks/useIsMobile'
import GreetingBanner   from '../components/GreetingBanner'
import DeviceComparison from '../components/DeviceComparison'
import {
  TrendingUp, TrendingDown, ClipboardList,
  Users, Loader2, Smartphone, BarChart2, Zap,
  ChevronDown, ChevronUp, DollarSign, ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ─── ErrorBoundary ────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error('[ErrorBoundary]', err) }
  render() {
    if (this.state.hasError) return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', fontFamily: 'Instrument Sans, sans-serif' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6E6E73', marginBottom: 8 }}>Não foi possível carregar esta seção</div>
        <button onClick={() => this.setState({ hasError: false })} style={{ background: 'rgba(10,102,255,0.08)', color: '#0A66FF', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif' }}>Tentar novamente</button>
      </div>
    )
    return this.props.children
  }
}

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  bg:          '#F5F5F7',
  surface:     '#FFFFFF',
  border:      'rgba(0,0,0,0.08)',
  text:        '#1D1D1F',
  t2:          '#6E6E73',
  t3:          '#AEAEB2',
  accent:      '#0A66FF',
  accentSoft:  'rgba(10,102,255,0.08)',
  green:       '#34C759',
  greenSoft:   'rgba(52,199,89,0.10)',
  red:         '#FF3B30',
  redSoft:     'rgba(255,59,48,0.10)',
  amber:       '#FF9F0A',
  amberSoft:   'rgba(255,159,10,0.10)',
  violet:      '#AF52DE',
  violetSoft:  'rgba(175,82,222,0.10)',
  teal:        '#32ADE6',
  tealSoft:    'rgba(50,173,230,0.10)',
  shadow:      '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

const brl  = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const brlK = (v) => { const n = parseFloat(v) || 0; return n >= 1000 ? `R$${(n / 1000).toFixed(1)}k` : brl(n) }
const pct  = (a, b) => b ? Math.round((a / b) * 100) : 0

// ═══════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════
function SkeletonBox({ w = '100%', h = 16, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#F0F0F2 25%,#E8E8EA 50%,#F0F0F2 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease infinite',
      flexShrink: 0,
      ...style,
    }} />
  )
}

function HeroCardSkeleton() {
  return (
    <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '24px 24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <SkeletonBox w={44} h={44} r={12} />
        <SkeletonBox w={60} h={26} r={13} />
      </div>
      <SkeletonBox w="55%" h={30} r={6} style={{ marginBottom: 10 }} />
      <SkeletonBox w="70%" h={14} r={4} style={{ marginBottom: 6 }} />
      <SkeletonBox w="45%" h={11} r={4} />
    </div>
  )
}

function DashboardSkeleton({ isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><SkeletonBox w={160} h={24} r={6} style={{ marginBottom: 8 }} /><SkeletonBox w={110} h={13} r={4} /></div>
        <SkeletonBox w={120} h={34} r={10} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14 }}>
        {[0,1,2,3].map(i => <HeroCardSkeleton key={i} />)}
      </div>
      <div style={{ display: 'flex', gap: isMobile ? 8 : 12 }}>
        {(isMobile ? [0,1,2] : [0,1,2,3]).map(i => (
          <div key={i} style={{ flex:1, background:C.surface, borderRadius:14, boxShadow:C.shadow, padding:'12px 12px 10px' }}>
            <SkeletonBox w={40} h={20} r={10} style={{ marginBottom:8 }} />
            <SkeletonBox w="50%" h={22} r={4} style={{ marginBottom:6 }} />
            <SkeletonBox w="100%" h={3} r={2} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: isMobile ? 12 : 14 }}>
        <div style={{ background:C.surface, borderRadius:20, boxShadow:C.shadow, padding:'22px 24px' }}>
          <SkeletonBox w="60%" h={16} r={4} style={{ marginBottom:8 }} />
          <SkeletonBox w="40%" h={12} r={4} style={{ marginBottom:20 }} />
          <SkeletonBox w="100%" h={isMobile ? 140 : 170} r={8} />
        </div>
        <div style={{ background:C.surface, borderRadius:20, boxShadow:C.shadow, padding:'22px 22px 18px' }}>
          <SkeletonBox w={80} h={16} r={4} style={{ marginBottom:8 }} />
          <SkeletonBox w={120} h={12} r={4} style={{ marginBottom:24 }} />
          {[0,1].map(i=>(
            <div key={i} style={{ marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <SkeletonBox w={100} h={14} r={4} />
                <SkeletonBox w={30} h={14} r={4} />
              </div>
              <SkeletonBox w="100%" h={6} r={3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════


// Hero card com badge de variação vs período anterior
function HeroCard({ label, value, sub, icon: Icon, color, colorSoft, trend, delay = 0 }) {
  const hasTrend = trend !== undefined && trend !== null
  const up = trend >= 0
  return (
    <div style={{
      background:C.surface, borderRadius:20, boxShadow:C.shadow,
      padding:'16px 14px 14px',
      animation:'dashIn .3s ease forwards', animationDelay:`${delay}ms`, opacity:0,
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:colorSoft, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {hasTrend && (
          <div style={{
            display:'flex', alignItems:'center', gap:4,
            background: up ? C.greenSoft : C.redSoft,
            color: up ? C.green : C.red,
            borderRadius:20, padding:'4px 10px',
            fontSize:11, fontWeight:700,
          }}>
            {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
            {trend === 0 ? '0%' : `${up?'+':''}${trend}%`}
          </div>
        )}
      </div>
      <div style={{ fontSize:'clamp(18px, 5vw, 30px)', fontWeight:700, letterSpacing:'-1px', lineHeight:1, color:C.text }}>{value}</div>
      <div style={{ fontSize:13, color:C.t2, marginTop:5, fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>{sub}</div>}
      {hasTrend && <div style={{ fontSize:10, color:C.t3, marginTop:6 }}>vs período anterior</div>}
    </div>
  )
}

function StatusPill({ label, count, color, colorSoft, pctVal }) {
  return (
    <div style={{ flex:1, minWidth:0, background:C.surface, borderRadius:14, boxShadow:C.shadow, padding:'12px 12px 10px' }}>
      <div style={{ display:'inline-flex', background:colorSoft, borderRadius:20, padding:'2px 8px', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color }}>{pctVal}%</span>
      </div>
      <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px', color:C.text, lineHeight:1 }}>{count}</div>
      <div style={{ fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', color:C.t2, marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</div>
      <div style={{ marginTop:8, height:3, background:'rgba(0,0,0,0.06)', borderRadius:2 }}>
        <div style={{ height:'100%', borderRadius:2, background:color, width:`${pctVal}%`, transition:'width .5s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:C.text, borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', color:'#fff', fontSize:12 }}>
      <div style={{ color:'rgba(255,255,255,0.5)', marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
          <div style={{ width:6, height:6, borderRadius:3, background:p.color }} />
          <span style={{ color:'rgba(255,255,255,0.7)' }}>{p.name}:</span>
          <span style={{ fontWeight:600 }}>{p.dataKey === 'receita' ? brl(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, colorSoft, sub, delay = 0 }) {
  return (
    <div style={{ background:C.surface, borderRadius:16, boxShadow:C.shadow, padding:'16px 18px', animation:'dashIn .3s ease forwards', animationDelay:`${delay}ms`, opacity:0, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:colorSoft, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px', lineHeight:1, color:C.text }}>{value}</div>
        <div style={{ fontSize:12, color:C.t2, marginTop:4, fontWeight:500 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── ConditionPanel ───────────────────────────────────────────
function ConditionPanel({ totalLacrado, totalSeminovo, revLacrado, revSeminovo, avgLacrado, avgSeminovo, totalSales, isMobile }) {
  const [expanded, setExpanded] = useState(false)

  const totalCond = totalLacrado + totalSeminovo
  const pctL = pct(totalLacrado,  totalCond)
  const pctS = pct(totalSeminovo, totalCond)
  const revTotal = revLacrado + revSeminovo
  const revPctL = revTotal > 0 ? Math.round((revLacrado  / revTotal) * 100) : 0
  const revPctS = revTotal > 0 ? Math.round((revSeminovo / revTotal) * 100) : 0

  const insight = totalCond === 0 ? 'Sem dados no período.'
    : totalLacrado > totalSeminovo ? `Lacrados dominam com ${pctL}% das vendas por condição.`
    : totalSeminovo > totalLacrado ? `Seminovos lideram com ${pctS}% das vendas por condição.`
    : 'Empate entre Lacrado e Seminovo no período.'

  const conditions = [
    { label:'Lacrado',  sub:'iPhones novos',  icon:'📦', color:C.accent, colorSoft:C.accentSoft, count:totalLacrado,  pctVal:pctL, rev:revLacrado,  avg:avgLacrado  },
    { label:'Seminovo', sub:'iPhones usados', icon:'✨', color:C.violet, colorSoft:C.violetSoft, count:totalSeminovo, pctVal:pctS, rev:revSeminovo, avg:avgSeminovo },
  ]

  return (
    <div style={{ background:C.surface, borderRadius:20, boxShadow:C.shadow, overflow:'hidden', animation:'dashIn .3s ease forwards', animationDelay:'440ms', opacity:0 }}>
      <div style={{ padding: isMobile ? '18px 16px 0' : '20px 24px 0' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.2px' }}>Condições de Venda</div>
            <div style={{ fontSize:12, color:C.t2, marginTop:2 }}>{totalCond} vendas · {brlK(revTotal)} em receita</div>
          </div>
          <button onClick={() => setExpanded(e => !e)} style={{
            display:'flex', alignItems:'center', gap:6,
            background: expanded ? C.text : 'rgba(0,0,0,0.05)',
            color: expanded ? '#fff' : C.t2,
            border:'none', borderRadius:10, padding:'7px 14px',
            fontSize:12, fontWeight:600, cursor:'pointer',
            fontFamily:'Instrument Sans, sans-serif', transition:'all .2s', whiteSpace:'nowrap',
          }}>
            {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            {expanded ? 'Recolher' : 'Ver detalhes'}
          </button>
        </div>

        {/* Barra comparativa */}
        <div style={{ marginBottom:20 }}>
          <div style={{ height:10, borderRadius:5, overflow:'hidden', display:'flex', background:'rgba(0,0,0,0.05)' }}>
            <div style={{ width:`${pctL}%`, background:C.accent, borderRadius:'5px 0 0 5px', transition:'width .7s cubic-bezier(.4,0,.2,1)' }} />
            <div style={{ width:`${pctS}%`, background:C.violet, borderRadius:'0 5px 5px 0', transition:'width .7s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:11, color:C.accent, fontWeight:600 }}>📦 Lacrado {pctL}%</span>
            <span style={{ fontSize:11, color:C.violet, fontWeight:600 }}>{pctS}% Seminovo ✨</span>
          </div>
        </div>

        {/* Cards — 1 coluna no mobile, 2 no desktop */}
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap:12,
          paddingBottom:20,
        }}>
          {conditions.map(d => (
            <div key={d.label} style={{ background:d.colorSoft, borderRadius:14, padding:'16px 18px', border:`1px solid ${d.color}22` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{d.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{d.label}</div>
                    <div style={{ fontSize:10, color:C.t2 }}>{d.sub}</div>
                  </div>
                </div>
                <div style={{ background:d.color, color:'#fff', fontSize:11, fontWeight:700, borderRadius:20, padding:'3px 9px', flexShrink:0 }}>{d.pctVal}%</div>
              </div>
              <div style={{ fontSize:36, fontWeight:700, letterSpacing:'-1.5px', lineHeight:1, color:C.text }}>{d.count}</div>
              <div style={{ fontSize:11, color:C.t2, marginTop:4 }}>de {totalSales} vendas</div>
              <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${d.color}22`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>Receita</div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text, marginTop:1 }}>{brlK(d.rev)}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>Ticket</div>
                  <div style={{ fontSize:14, fontWeight:700, color:d.color, marginTop:1 }}>{brlK(d.avg)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Painel expandido */}
      <div style={{ maxHeight: expanded ? 700 : 0, overflow:'hidden', transition:'max-height .35s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ borderTop:`1px solid ${C.border}`, padding: isMobile ? '18px 16px 20px' : '20px 24px 24px', display:'flex', flexDirection:'column', gap:20 }}>

          <div style={{ fontSize:13, fontWeight:700, color:C.t2, textTransform:'uppercase', letterSpacing:'0.06em' }}>Análise detalhada</div>

          {/* 4 KPIs — 2 colunas no mobile, 4 no desktop */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:10 }}>
            {[
              { label:'Ticket Lacrado',   value:brl(avgLacrado),   icon:DollarSign, color:C.accent, colorSoft:C.accentSoft, sub:`${totalLacrado} vendas` },
              { label:'Ticket Seminovo',  value:brl(avgSeminovo),  icon:DollarSign, color:C.violet, colorSoft:C.violetSoft, sub:`${totalSeminovo} vendas` },
              { label:'Receita Lacrado',  value:brlK(revLacrado),  icon:TrendingUp, color:C.accent, colorSoft:C.accentSoft, sub:`${revPctL}% da receita total` },
              { label:'Receita Seminovo', value:brlK(revSeminovo), icon:TrendingUp, color:C.violet, colorSoft:C.violetSoft, sub:`${revPctS}% da receita total` },
            ].map(k => (
              <div key={k.label} style={{ background:C.bg, borderRadius:14, padding:'14px 16px', border:`1px solid ${C.border}` }}>
                <div style={{ width:32, height:32, borderRadius:8, background:k.colorSoft, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                  <k.icon size={14} style={{ color:k.color }} />
                </div>
                <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.4px', color:C.text }}>{k.value}</div>
                <div style={{ fontSize:11, color:C.t2, marginTop:3, fontWeight:500 }}>{k.label}</div>
                <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Barras participação receita */}
          <div style={{ background:C.bg, borderRadius:14, padding:'16px 18px', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:16 }}>Participação na receita</div>
            {[
              { label:'Lacrado',  color:C.accent, value:revLacrado,  pctVal:revPctL },
              { label:'Seminovo', color:C.violet, value:revSeminovo, pctVal:revPctS },
            ].map(row => (
              <div key={row.label} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{row.label}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:row.color }}>{row.pctVal}%</span>
                    <span style={{ fontSize:12, color:C.t2 }}>{brlK(row.value)}</span>
                  </div>
                </div>
                <div style={{ height:8, background:'rgba(0,0,0,0.06)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:row.color, borderRadius:4, width:`${row.pctVal}%`, transition:'width .7s cubic-bezier(.4,0,.2,1)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Insight */}
          <div style={{ background:'linear-gradient(135deg,rgba(10,102,255,0.05) 0%,rgba(175,82,222,0.05) 100%)', border:'1px solid rgba(10,102,255,0.12)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,rgba(10,102,255,0.12),rgba(175,82,222,0.12))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ArrowUpRight size={16} style={{ color:C.accent }} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:C.t2, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Insight do período</div>
              <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{insight}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
// ── LeadSourcePanel ──────────────────────────────────────────
function LeadSourcePanel({ byLeadSource, leadSourceOrders, isMobile }) {
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState(null) // origem expandida

  const SOURCES = {
    'Instagram':           { emoji:'📸', color:'#7C3AED', soft:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.18)' },
    'Indicação':           { emoji:'🗣️', color:'#0891B2', soft:'rgba(8,145,178,0.08)',   border:'rgba(8,145,178,0.18)'  },
    'Já é cliente':        { emoji:'⭐', color:'#D97706', soft:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.18)'  },
    'Instagram/Indicação': { emoji:'📲', color:'#7C3AED', soft:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.18)' },
    'Não informado':       { emoji:'❓', color:'#6B7280', soft:'rgba(107,114,128,0.06)', border:'rgba(107,114,128,0.14)' },
  }

  const total = byLeadSource.reduce((s, r) => s + (parseInt(r.total) || 0), 0)
  if (total === 0) return null

  const firstName = (name = '') => name.trim().split(' ')[0]
  const fmtDay = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
  }

  const toggleExpand = (origem) => setExpanded(e => e === origem ? null : origem)

  return (
    <div style={{ background:C.surface, borderRadius:20, boxShadow:C.shadow,
      overflow:'hidden', animation:'dashIn .3s ease forwards', animationDelay:'320ms', opacity:0 }}>

      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: isMobile ? '16px 16px' : '18px 24px', background:'none', border:'none', cursor:'pointer',
          fontFamily:'Instrument Sans,sans-serif' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(124,58,237,0.10)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:16 }}>📲</span>
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Origem dos Clientes</div>
            <div style={{ fontSize:11, color:C.t2, marginTop:2 }}>
              {total} venda{total !== 1 ? 's' : ''} com origem registrada
            </div>
          </div>
        </div>
        <span style={{ fontSize:13, color:C.t3 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: isMobile ? '0 16px 16px' : '0 24px 20px',
          display:'flex', flexDirection:'column', gap:10, borderTop:`1px solid ${C.border}`, paddingTop:16 }}>

          {byLeadSource.filter(r => r.origem !== 'Não informado').map(row => {
            const meta    = SOURCES[row.origem] || SOURCES['Não informado']
            const count   = parseInt(row.total) || 0
            const receita = parseFloat(row.receita) || 0
            const pctVal  = total > 0 ? Math.round((count / total) * 100) : 0
            const isExp   = expanded === row.origem
            const orders  = (leadSourceOrders || []).filter(o => o.origem === row.origem)

            return (
              <div key={row.origem} style={{ background:meta.soft, border:`1px solid ${meta.border}`,
                borderRadius:12, overflow:'hidden' }}>

                {/* Card principal */}
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>{meta.emoji}</span>
                      <span style={{ fontSize:14, fontWeight:700, color:meta.color }}>{row.origem}</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:17, fontWeight:700, color:C.text, letterSpacing:'-0.4px' }}>{count}</div>
                      <div style={{ fontSize:10, color:C.t3 }}>venda{count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Barra */}
                  <div style={{ height:6, background:'rgba(0,0,0,0.07)', borderRadius:999, overflow:'hidden', marginBottom:8 }}>
                    <div style={{ height:'100%', width:`${pctVal}%`, background:meta.color,
                      borderRadius:999, transition:'width .6s cubic-bezier(.4,0,.2,1)' }}/>
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, color:meta.color, fontWeight:600 }}>{pctVal}% das vendas</span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.text }}>
                      {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(receita)}
                    </span>
                  </div>
                </div>

                {/* Botão expandir */}
                <button
                  onClick={() => toggleExpand(row.origem)}
                  style={{ width:'100%', padding:'8px 16px', background:'rgba(0,0,0,0.04)',
                    border:'none', borderTop:`1px solid ${meta.border}`, cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                    fontFamily:'Instrument Sans,sans-serif' }}>
                  <span style={{ fontSize:11, fontWeight:600, color:meta.color }}>
                    {isExp ? 'Ocultar' : `Ver ${orders.length} cliente${orders.length !== 1 ? 's' : ''}`}
                  </span>
                  <span style={{ fontSize:10, color:meta.color }}>{isExp ? '▲' : '▼'}</span>
                </button>

                {/* Lista expandida */}
                {isExp && (
                  <div style={{ borderTop:`1px solid ${meta.border}` }}>
                    {orders.map((o, i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'8px 16px',
                        borderBottom: i < orders.length - 1 ? `1px solid ${meta.border}` : 'none',
                        background:'rgba(255,255,255,0.5)',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:24, height:24, borderRadius:'50%', background:meta.color,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>
                            {firstName(o.client_name).charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>
                            {firstName(o.client_name)}
                          </span>
                        </div>
                        <span style={{ fontSize:11, color:C.t3, fontFamily:'JetBrains Mono,monospace' }}>
                          {fmtDay(o.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Não informado (compacto) */}
          {byLeadSource.find(r => r.origem === 'Não informado') && (() => {
            const row   = byLeadSource.find(r => r.origem === 'Não informado')
            const count = parseInt(row.total) || 0
            return (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 14px', background:C.bg, borderRadius:9, border:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.t3 }}>❓ Não informado</span>
                <span style={{ fontSize:12, fontWeight:600, color:C.t2 }}>{count} venda{count !== 1 ? 's' : ''}</span>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [periodFilter, setPeriodFilter] = useState({ mode: 'quick', days: 30 })
  const statsParams = periodToParams(periodFilter)
  const isMobile = useIsMobile()
  const { data, isLoading } = useOrderStats(statsParams)

  const userName = useMemo(() => {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('istore_user') || '{}'
      return JSON.parse(raw)?.name || ''
    } catch { return '' }
  }, [])

  const s        = data?.summary          || {}
  const trends   = data?.trends           || {}
  const timeline = data?.revenue_timeline || []
  const byType   = data?.by_type          || []
  const byLeadSource = data?.by_lead_source || []
  const leadSourceOrders = data?.lead_source_orders || []

  const total         = parseInt(s.total_orders)     || 0
  const totalSales    = parseInt(s.total_sales)       || 0
  const totalManut    = parseInt(s.total_maintenance) || 0
  const revVenda      = parseFloat(byType.find(t => t.type === 'venda')?.revenue)      || 0
  const revManut      = parseFloat(byType.find(t => t.type === 'manutencao')?.revenue) || 0
  const ticketVenda   = totalSales > 0 ? revVenda / totalSales : 0
  const totalLacrado  = parseInt(s.total_lacrado)     || 0
  const totalSeminovo = parseInt(s.total_seminovo)    || 0
  const revLacrado    = parseFloat(s.revenue_lacrado)  || 0
  const revSeminovo   = parseFloat(s.revenue_seminovo) || 0
  const avgLacrado    = parseFloat(s.avg_lacrado)      || 0
  const avgSeminovo   = parseFloat(s.avg_seminovo)     || 0

  const chartData = useMemo(() => timeline.map(d => ({
    day:     new Date(d.day).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }),
    receita: parseFloat(d.revenue) || 0,
    ordens:  parseInt(d.orders)    || 0,
  })), [timeline])

  const periodLabel = (() => {
    if (periodFilter.mode === 'quick') {
      const d = periodFilter.days
      return d === 7 ? 'últimos 7 dias' : d === 30 ? 'últimos 30 dias' : `últimos ${d} dias`
    }
    if (periodFilter.mode === 'month') {
      const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
      return `${months[periodFilter.month]} ${periodFilter.year}`
    }
    if (periodFilter.mode === 'range') {
      if (!periodFilter.from) return 'Intervalo'
      const fmt = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
      return periodFilter.to && periodFilter.to !== periodFilter.from
        ? `${fmt(periodFilter.from)} – ${fmt(periodFilter.to)}`
        : fmt(periodFilter.from)
    }
    return 'últimos 30 dias'
  })()

  if (isLoading && !data) return (
    <div style={{ fontFamily:'Instrument Sans, sans-serif', color:C.text }}>
      <DashboardSkeleton isMobile={isMobile} />
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 12 : 16, fontFamily:'Instrument Sans, sans-serif', color:C.text }}>

      <ErrorBoundary>
        <GreetingBanner userName={userName} totalRevenue={parseFloat(s.total_revenue) || 0} />
      </ErrorBoundary>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, animation:'dashIn .25s ease forwards', opacity:0 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight:700, letterSpacing:'-0.5px', margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:13, color:C.t2, margin:'2px 0 0', textTransform:'capitalize' }}>{periodLabel}</p>
        </div>
        <PeriodFilter value={periodFilter} onChange={setPeriodFilter} align="right" />
      </div>

      {/* Hero cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 8 : 14 }}>
        <HeroCard icon={TrendingUp}    color={C.green}  colorSoft={C.greenSoft}  label="Receita total"   value={brl(s.total_revenue)}  sub={periodLabel}      trend={trends.revenue}        delay={0} />
        <HeroCard icon={Zap}           color={C.accent} colorSoft={C.accentSoft} label="Ticket médio"    value={brl(s.avg_sale_price)}  sub="por atendimento"  trend={trends.avg_sale_price} delay={60} />
        <HeroCard icon={ClipboardList} color={C.amber}  colorSoft={C.amberSoft}  label="Total de ordens" value={total}                  sub={periodLabel}      trend={trends.total_orders}   delay={120} />
        <HeroCard icon={Users}         color={C.violet} colorSoft={C.violetSoft} label="Clientes únicos" value={s.unique_clients || 0}  sub={periodLabel}      trend={trends.unique_clients} delay={180} />
      </div>

      {/* Pills */}
      <div style={{ display:'flex', gap: isMobile ? 8 : 12, animation:'dashIn .3s ease forwards', animationDelay:'200ms', opacity:0 }}>
        <StatusPill label="Vendas"      count={totalSales}     color={C.accent} colorSoft={C.accentSoft} pctVal={pct(totalSales, total)} />
        <StatusPill label="Manutenções" count={totalManut}     color={C.violet} colorSoft={C.violetSoft} pctVal={pct(totalManut, total)} />
        <StatusPill label="Rec. Vendas" count={brlK(revVenda)} color={C.green}  colorSoft={C.greenSoft}  pctVal={pct(totalSales, total)} />
        {!isMobile && <StatusPill label="Rec. Manut." count={brlK(revManut)} color={C.teal} colorSoft={C.tealSoft} pctVal={pct(totalManut, total)} />}
      </div>

      {/* Chart + Por tipo */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: isMobile ? 12 : 14 }}>
        <div style={{ background:C.surface, borderRadius:20, boxShadow:C.shadow, padding: isMobile ? '18px 14px' : '22px 24px', animation:'dashIn .3s ease forwards', animationDelay:'240ms', opacity:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:600 }}>Receita Diária</div>
              <div style={{ fontSize:12, color:C.t2, marginTop:2 }}>{periodLabel}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight:700, letterSpacing:'-0.5px' }}>{brl(s.total_revenue)}</div>
              <div style={{ fontSize:11, color:C.t3, marginTop:1 }}>{total} ordens</div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 140 : 170}>
              <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-18 }}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.accent} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize:10, fill:C.t3, fontFamily:'Instrument Sans' }} axisLine={false} tickLine={false} interval={periodFilter.mode === 'quick' && periodFilter.days === 7 ? 0 : periodFilter.mode === 'quick' && periodFilter.days === 30 ? 4 : 'preserveStartEnd'} />
                <YAxis tick={{ fontSize:10, fill:C.t3, fontFamily:'Instrument Sans' }} axisLine={false} tickLine={false} tickFormatter={v => brlK(v)} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke={C.accent} strokeWidth={2.5} fill="url(#gRevenue)" dot={false} activeDot={{ r:5, fill:C.accent, stroke:'#fff', strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:140, display:'flex', alignItems:'center', justifyContent:'center', color:C.t3, fontSize:13 }}>Nenhum dado no período</div>
          )}
        </div>

        <div style={{ background:C.surface, borderRadius:20, boxShadow:C.shadow, padding:'22px 22px 18px', animation:'dashIn .3s ease forwards', animationDelay:'280ms', opacity:0, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>Por tipo</div>
          <div style={{ fontSize:12, color:C.t2, marginBottom:20 }}>{total} atendimentos</div>
          {[
            { l:'Vendas',       icon:Smartphone, v:totalSales, rev:revVenda, c:C.accent, cs:C.accentSoft },
            { l:'Manutenções',  icon:BarChart2,  v:totalManut, rev:revManut, c:C.violet, cs:C.violetSoft },
          ].map(d => {
            const p2 = pct(d.v, total)
            return (
              <div key={d.l} style={{ marginBottom:18 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:d.cs, display:'flex', alignItems:'center', justifyContent:'center' }}><d.icon size={13} style={{ color:d.c }} /></div>
                    <span style={{ fontSize:13, fontWeight:500 }}>{d.l}</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700 }}>{d.v}</span>
                </div>
                <div style={{ height:6, background:'rgba(0,0,0,0.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:d.c, borderRadius:3, width:`${p2}%`, transition:'width .6s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:11, color:C.t3 }}>{p2}% do total</span>
                  <span style={{ fontSize:11, color:C.t2, fontWeight:600 }}>{brl(d.rev)}</span>
                </div>
              </div>
            )
          })}
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14, marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:11, color:C.t3, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>Ticket médio</div>
              <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.5px', marginTop:2 }}>{brl(s.avg_sale_price)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:C.t3, textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>Clientes únicos</div>
              <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.5px', marginTop:2, color:C.violet }}>{s.unique_clients || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: isMobile ? 10 : 14 }}>
        <StatCard icon={Smartphone} color={C.accent} colorSoft={C.accentSoft} label="Vendas"       value={totalSales}       sub={brl(revVenda)}   delay={300} />
        <StatCard icon={BarChart2}  color={C.violet} colorSoft={C.violetSoft} label="Manutenções"  value={totalManut}       sub={brl(revManut)}   delay={340} />
        <StatCard icon={Zap}        color={C.green}  colorSoft={C.greenSoft}  label="Ticket Venda" value={brl(ticketVenda)} sub="por venda"        delay={380} />
      </div>

      {/* Condições de venda */}
      <ConditionPanel
        totalLacrado={totalLacrado}   totalSeminovo={totalSeminovo}
        revLacrado={revLacrado}       revSeminovo={revSeminovo}
        avgLacrado={avgLacrado}       avgSeminovo={avgSeminovo}
        totalSales={totalSales}       isMobile={isMobile}
      />

      <LeadSourcePanel byLeadSource={byLeadSource} leadSourceOrders={leadSourceOrders} isMobile={isMobile} />

      <ErrorBoundary>
        <DeviceComparison />
      </ErrorBoundary>

      <style>{`
        @keyframes dashIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  )
}

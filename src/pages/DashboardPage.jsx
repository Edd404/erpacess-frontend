import { useState, useMemo, Component } from 'react'
import { useOrderStats } from '../hooks/useData'
import { useIsMobile } from '../hooks/useIsMobile'
import GreetingBanner   from '../components/GreetingBanner'
import DeviceComparison from '../components/DeviceComparison'

// ─── ErrorBoundary — evita tela branca por crash de componente ─
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error('[ErrorBoundary]', err) }
  render() {
    if (this.state.hasError) return (
      <div style={{
        background: '#fff', borderRadius: 16, padding: '32px 24px',
        textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        fontFamily: 'Instrument Sans, sans-serif',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6E6E73', marginBottom: 8 }}>
          Não foi possível carregar esta seção
        </div>
        <button
          onClick={() => this.setState({ hasError: false })}
          style={{
            background: 'rgba(10,102,255,0.08)', color: '#0A66FF',
            border: 'none', borderRadius: 8, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Instrument Sans, sans-serif',
          }}
        >Tentar novamente</button>
      </div>
    )
    return this.props.children
  }
}
import {
  TrendingUp, TrendingDown, ClipboardList,
  Users, Loader2, Smartphone, BarChart2, Zap, Clock,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  bg:       '#F5F5F7',
  surface:  '#FFFFFF',
  border:   'rgba(0,0,0,0.08)',
  text:     '#1D1D1F',
  t2:       '#6E6E73',
  t3:       '#AEAEB2',
  accent:   '#0A66FF',
  accentSoft:'rgba(10,102,255,0.08)',
  green:    '#34C759',
  greenSoft:'rgba(52,199,89,0.10)',
  red:      '#FF3B30',
  redSoft:  'rgba(255,59,48,0.10)',
  amber:    '#FF9F0A',
  amberSoft:'rgba(255,159,10,0.10)',
  violet:   '#AF52DE',
  violetSoft:'rgba(175,82,222,0.10)',
  teal:     '#32ADE6',
  tealSoft: 'rgba(50,173,230,0.10)',
  shadow:   '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
  shadowHover: '0 4px 20px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.08)',
}

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const brlK = (v) => {
  const n = parseFloat(v) || 0
  return n >= 1000 ? `R$${(n / 1000).toFixed(1)}k` : brl(n)
}

const pct = (a, b) => b ? Math.round((a / b) * 100) : 0

// ─── Period Selector (segmented control iOS-style) ────────────
function PeriodSelector({ value, onChange }) {
  const opts = [
    { v: '7',  l: '7d' },
    { v: '30', l: '30d' },
    { v: '90', l: '90d' },
  ]
  return (
    <div style={{
      display: 'inline-flex', background: 'rgba(0,0,0,0.06)',
      borderRadius: 10, padding: 3, gap: 2,
    }}>
      {opts.map(o => {
        const active = value === o.v
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: active ? 600 : 400,
            background: active ? C.surface : 'transparent',
            color: active ? C.text : C.t2,
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all .15s ease',
            fontFamily: 'Instrument Sans, sans-serif',
          }}>
            {o.l}
          </button>
        )
      })}
    </div>
  )
}

// ─── Metric Hero Card (large) ─────────────────────────────────
function HeroCard({ label, value, sub, icon: Icon, color, colorSoft, trend, delay = 0 }) {
  const up = trend >= 0
  return (
    <div style={{
      background: C.surface, borderRadius: 20, boxShadow: C.shadow,
      padding: '24px 24px 20px',
      animation: `dashIn .3s ease forwards`, animationDelay: `${delay}ms`, opacity: 0,
      transition: 'box-shadow .2s',
    }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: up ? C.greenSoft : C.redSoft,
            color: up ? C.green : C.red,
            borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600,
          }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {/* value */}
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1, color: C.text }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: C.t2, marginTop: 5, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ─── Compact Stat Card ────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, colorSoft, sub, delay = 0 }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, boxShadow: C.shadow,
      padding: '16px 18px',
      animation: `dashIn .3s ease forwards`, animationDelay: `${delay}ms`, opacity: 0,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, color: C.text }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 4, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Status Pills ─────────────────────────────────────────────
function StatusPill({ label, count, color, colorSoft, pctVal }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, background: C.surface, borderRadius: 14,
      boxShadow: C.shadow, padding: '12px 12px 10px',
      overflow: 'hidden',
    }}>
      {/* badge no topo */}
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        background: colorSoft, borderRadius: 20, padding: '2px 8px',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pctVal}%</span>
      </div>

      {/* número grande */}
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: C.text, lineHeight: 1 }}>
        {count}
      </div>

      {/* label abaixo do número */}
      <div style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.04em', color: C.t2, marginTop: 4,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </div>

      {/* barra */}
      <div style={{ marginTop: 8, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
        <div style={{
          height: '100%', borderRadius: 2, background: color,
          width: `${pctVal}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.text, borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)', color: '#fff', fontSize: 12,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: p.color }} />
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {p.dataKey === 'receita' ? brl(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const [period, setPeriod] = useState('30')
  const { data, isLoading } = useOrderStats(period)
  const isMobile = useIsMobile()

  // Pega nome do usuário do token salvo, sem depender do contexto
  const userName = useMemo(() => {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('istore_user') || '{}'
      return JSON.parse(raw)?.name || ''
    } catch { return '' }
  }, [])

  const s = data?.summary || {}
  const timeline = data?.revenue_timeline || []
  const topModels = data?.top_models || []
  const byType = data?.by_type || []

  const total       = parseInt(s.total_orders)      || 0
  const totalSales  = parseInt(s.total_sales)        || 0
  const totalManut  = parseInt(s.total_maintenance)  || 0
  const revVenda    = parseFloat(byType.find(t => t.type === 'venda')?.revenue)      || 0
  const revManut    = parseFloat(byType.find(t => t.type === 'manutencao')?.revenue) || 0
  const ticketVenda   = totalSales > 0 ? revVenda / totalSales : 0
  const ticketManut   = totalManut > 0 ? revManut / totalManut : 0
  const totalLacrado  = parseInt(s.total_lacrado)  || 0
  const totalSeminovo = parseInt(s.total_seminovo) || 0
  const pctLacrado    = total > 0 ? Math.round((totalLacrado  / total) * 100) : 0
  const pctSeminovo   = total > 0 ? Math.round((totalSeminovo / total) * 100) : 0

  const chartData = useMemo(() => timeline.map(d => ({
    day: new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    receita: parseFloat(d.revenue) || 0,
    ordens: parseInt(d.orders) || 0,
  })), [timeline])

  const maxModel = topModels.length ? Math.max(...topModels.map(m => parseFloat(m.revenue))) : 1

  const periodLabel = period === '7' ? 'últimos 7 dias' : period === '30' ? 'últimos 30 dias' : 'últimos 90 dias'

  if (isLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 320, color: C.t2, gap: 10, fontFamily: 'Instrument Sans, sans-serif',
    }}>
      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14 }}>Carregando dashboard…</span>
    </div>
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16,
      fontFamily: 'Instrument Sans, sans-serif', color: C.text,
    }}>

      {/* ── Greeting + Meta ── */}
      <ErrorBoundary>
        <GreetingBanner userName={userName} totalRevenue={parseFloat(s.total_revenue) || 0} />
      </ErrorBoundary>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        animation: 'dashIn .25s ease forwards', opacity: 0,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: C.t2, margin: '2px 0 0', textTransform: 'capitalize' }}>
            {periodLabel}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* ── Hero cards row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: isMobile ? 10 : 14,
      }}>
        <HeroCard
          icon={TrendingUp} color={C.green} colorSoft={C.greenSoft}
          label="Receita total" value={brl(s.total_revenue)}
          sub={periodLabel} trend={undefined} delay={0}
        />
        <HeroCard
          icon={Zap} color={C.accent} colorSoft={C.accentSoft}
          label="Ticket médio" value={brl(s.avg_sale_price)}
          sub="por atendimento" delay={60}
        />
        <HeroCard
          icon={ClipboardList} color={C.amber} colorSoft={C.amberSoft}
          label="Total de ordens" value={total}
          sub={periodLabel} delay={120}
        />
        <HeroCard
          icon={Users} color={C.violet} colorSoft={C.violetSoft}
          label="Clientes únicos" value={s.unique_clients || 0}
          sub={periodLabel} delay={180}
        />
      </div>

      {/* ── Vendas vs Manutenções breakdown ── */}
      <div style={{
        display: 'flex', gap: isMobile ? 8 : 12, flexWrap: 'nowrap',
        animation: 'dashIn .3s ease forwards', animationDelay: '200ms', opacity: 0,
      }}>
        <StatusPill label="Vendas"      count={totalSales}
          color={C.accent} colorSoft={C.accentSoft} pctVal={pct(totalSales, total)} />
        <StatusPill label="Manutenções" count={totalManut}
          color={C.violet} colorSoft={C.violetSoft} pctVal={pct(totalManut, total)} />
        <StatusPill label="Rec. Vendas" count={brlK(revVenda)}
          color={C.green}  colorSoft={C.greenSoft}  pctVal={pct(totalSales, total)} />
        {!isMobile && (
          <StatusPill label="Rec. Manut." count={brlK(revManut)}
            color={C.teal}  colorSoft={C.tealSoft}  pctVal={pct(totalManut, total)} />
        )}
      </div>

      {/* ── Chart + Por tipo ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
        gap: isMobile ? 12 : 14,
      }}>

        {/* Area chart */}
        <div style={{
          background: C.surface, borderRadius: 20, boxShadow: C.shadow,
          padding: isMobile ? '18px 14px' : '22px 24px',
          animation: 'dashIn .3s ease forwards', animationDelay: '240ms', opacity: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Receita Diária</div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{periodLabel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, letterSpacing: '-0.5px' }}>
                {brl(s.total_revenue)}
              </div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>{total} ordens</div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 140 : 170}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.accent} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: C.t3, fontFamily: 'Instrument Sans' }}
                  axisLine={false} tickLine={false}
                  interval={period === '7' ? 0 : period === '30' ? 4 : 10}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: C.t3, fontFamily: 'Instrument Sans' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => brlK(v)}
                  width={44}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="receita" name="Receita"
                  stroke={C.accent} strokeWidth={2.5}
                  fill="url(#gRevenue)" dot={false}
                  activeDot={{ r: 5, fill: C.accent, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontSize: 13 }}>
              Nenhum dado no período
            </div>
          )}
        </div>

        {/* Por tipo */}
        <div style={{
          background: C.surface, borderRadius: 20, boxShadow: C.shadow,
          padding: '22px 22px 18px',
          animation: 'dashIn .3s ease forwards', animationDelay: '280ms', opacity: 0,
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Por tipo</div>
          <div style={{ fontSize: 12, color: C.t2, marginBottom: 20 }}>
            {total} atendimentos
          </div>

          {[
            {
              l: 'Vendas', icon: Smartphone,
              v: parseInt(s.total_sales) || 0,
              rev: parseFloat((data?.by_type || []).find(t => t.type === 'venda')?.revenue) || 0,
              c: C.accent, cs: C.accentSoft,
            },
            {
              l: 'Manutenções', icon: BarChart2,
              v: parseInt(s.total_maintenance) || 0,
              rev: parseFloat((data?.by_type || []).find(t => t.type === 'manutencao')?.revenue) || 0,
              c: C.violet, cs: C.violetSoft,
            },
          ].map(d => {
            const p = pct(d.v, total)
            return (
              <div key={d.l} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: d.cs, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <d.icon size={13} style={{ color: d.c }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{d.l}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{d.v}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: d.c, borderRadius: 3,
                    width: `${p}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: C.t3 }}>{p}% do total</span>
                  <span style={{ fontSize: 11, color: C.t2, fontWeight: 600 }}>{brl(d.rev)}</span>
                </div>
              </div>
            )
          })}

          {/* Divider + ticket médio */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Ticket médio</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 2 }}>{brl(s.avg_sale_price)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Clientes únicos</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 2, color: C.violet }}>{s.unique_clients || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Compact stats row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? 10 : 14,
      }}>
        <StatCard icon={Smartphone}   color={C.accent} colorSoft={C.accentSoft}
          label="Vendas"         value={totalSales}      sub={brl(revVenda)}       delay={300} />
        <StatCard icon={BarChart2}    color={C.violet} colorSoft={C.violetSoft}
          label="Manutenções"    value={totalManut}      sub={brl(revManut)}       delay={340} />
        <StatCard icon={Zap}          color={C.green}  colorSoft={C.greenSoft}
          label="Ticket Venda"   value={brl(ticketVenda)} sub="por venda"          delay={380} />
      </div>

      {/* ── Lacrado vs Seminovo ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
        gap: isMobile ? 10 : 14,
        animation: 'dashIn .3s ease forwards', animationDelay: '440ms', opacity: 0,
      }}>
        {/* Lacrado */}
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>📦</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Lacrado</div>
                <div style={{ fontSize: 11, color: C.t2, marginTop: 1 }}>iPhones novos</div>
              </div>
            </div>
            <div style={{ background: C.accentSoft, color: C.accent, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>
              {pctLacrado}%
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>{totalLacrado}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>de {totalSales} vendas</div>
          <div style={{ marginTop: 12, height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctLacrado}%`, background: C.accent, borderRadius: 3, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>

        {/* Seminovo */}
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Seminovo</div>
                <div style={{ fontSize: 11, color: C.t2, marginTop: 1 }}>iPhones usados</div>
              </div>
            </div>
            <div style={{ background: C.violetSoft, color: C.violet, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>
              {pctSeminovo}%
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>{totalSeminovo}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>de {totalSales} vendas</div>
          <div style={{ marginTop: 12, height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctSeminovo}%`, background: C.violet, borderRadius: 3, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>
      </div>

      {/* ── Top Models ── */}
      {topModels.length > 0 && (
        <div style={{
          background: C.surface, borderRadius: 20, boxShadow: C.shadow,
          overflow: 'hidden',
          animation: 'dashIn .3s ease forwards', animationDelay: '460ms', opacity: 0,
        }}>
          <div style={{
            padding: '18px 22px 14px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Modelos mais atendidos</div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 1 }}>{periodLabel}</div>
            </div>
            <div style={{
              background: C.accentSoft, color: C.accent,
              fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '4px 12px',
            }}>
              Top {topModels.length}
            </div>
          </div>

          <div style={{ padding: '8px 0 12px' }}>
            {topModels.map((m, i) => {
              const barPct = pct(parseFloat(m.revenue), maxModel)
              const colors = [C.accent, C.violet, C.teal, C.amber, C.green]
              const c = colors[i] || C.t2
              return (
                <div key={i} style={{
                  padding: isMobile ? '10px 16px' : '10px 22px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  {/* rank badge */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: i === 0 ? C.amberSoft : 'rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    color: i === 0 ? C.amber : C.t2, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>

                  {/* model info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.iphone_model}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 20, flexShrink: 0, marginLeft: 8 }}>
                        {!isMobile && (
                          <span style={{ fontSize: 12, color: C.t2 }}>{m.count} atend.</span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{brl(m.revenue)}</span>
                      </div>
                    </div>
                    {/* bar */}
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2, background: c,
                        width: `${barPct}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                      }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Divisor ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        animation: 'dashIn .3s ease forwards', animationDelay: '500ms', opacity: 0,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
          Comparativo de Aparelhos
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
      </div>

      {/* ── Device Comparison ── */}
      <ErrorBoundary>
        <DeviceComparison />
      </ErrorBoundary>

      <style>{`
        @keyframes dashIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

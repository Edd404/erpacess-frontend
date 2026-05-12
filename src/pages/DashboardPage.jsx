import { useState, useMemo, Component } from 'react'
import { useOrderStats } from '../hooks/useData'
import { useIsMobile } from '../hooks/useIsMobile'
import GreetingBanner   from '../components/GreetingBanner'
import DeviceComparison from '../components/DeviceComparison'
import {
  TrendingUp, TrendingDown, ClipboardList,
  Users, Loader2, Smartphone, BarChart2, Zap,
  ChevronDown, ChevronUp, Package, Sparkles,
  DollarSign, ArrowUpRight,
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
      <div style={{
        background: '#fff', borderRadius: 16, padding: '32px 24px',
        textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        fontFamily: 'Instrument Sans, sans-serif',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6E6E73', marginBottom: 8 }}>
          Não foi possível carregar esta seção
        </div>
        <button onClick={() => this.setState({ hasError: false })} style={{
          background: 'rgba(10,102,255,0.08)', color: '#0A66FF',
          border: 'none', borderRadius: 8, padding: '6px 14px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Instrument Sans, sans-serif',
        }}>Tentar novamente</button>
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
  shadowHover: '0 4px 20px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.08)',
}

const brl  = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const brlK = (v) => { const n = parseFloat(v) || 0; return n >= 1000 ? `R$${(n / 1000).toFixed(1)}k` : brl(n) }
const pct  = (a, b) => b ? Math.round((a / b) * 100) : 0

// ─── Period Selector ──────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 3, gap: 2 }}>
      {[{ v: '7', l: '7d' }, { v: '30', l: '30d' }, { v: '90', l: '90d' }].map(o => {
        const active = value === o.v
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: active ? 600 : 400,
            background: active ? C.surface : 'transparent',
            color: active ? C.text : C.t2,
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all .15s', fontFamily: 'Instrument Sans, sans-serif',
          }}>{o.l}</button>
        )
      })}
    </div>
  )
}

// ─── Hero Card ────────────────────────────────────────────────
function HeroCard({ label, value, sub, icon: Icon, color, colorSoft, delay = 0 }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20, boxShadow: C.shadow,
      padding: '24px 24px 20px',
      animation: 'dashIn .3s ease forwards', animationDelay: `${delay}ms`, opacity: 0,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1, color: C.text }}>{value}</div>
      <div style={{ fontSize: 13, color: C.t2, marginTop: 5, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ─── Status Pill ──────────────────────────────────────────────
function StatusPill({ label, count, color, colorSoft, pctVal }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: C.surface, borderRadius: 14, boxShadow: C.shadow, padding: '12px 12px 10px' }}>
      <div style={{ display: 'inline-flex', background: colorSoft, borderRadius: 20, padding: '2px 8px', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pctVal}%</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: C.text, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.t2, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ marginTop: 8, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
        <div style={{ height: '100%', borderRadius: 2, background: color, width: `${pctVal}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  )
}

// ─── Chart Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.text, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', color: '#fff', fontSize: 12 }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: p.color }} />
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.dataKey === 'receita' ? brl(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, colorSoft, sub, delay = 0 }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, boxShadow: C.shadow,
      padding: '16px 18px',
      animation: 'dashIn .3s ease forwards', animationDelay: `${delay}ms`, opacity: 0,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1, color: C.text }}>{value}</div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 4, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ConditionPanel — card premium expansível Lacrado vs Seminovo
// ─────────────────────────────────────────────────────────────
function ConditionPanel({ totalLacrado, totalSeminovo, revLacrado, revSeminovo, avgLacrado, avgSeminovo, totalSales, isMobile }) {
  const [expanded, setExpanded] = useState(false)

  const totalCond = totalLacrado + totalSeminovo
  const pctL = pct(totalLacrado,  totalCond)
  const pctS = pct(totalSeminovo, totalCond)

  // receita total das condições
  const revTotal = revLacrado + revSeminovo

  // participação na receita
  const revPctL = revTotal > 0 ? Math.round((revLacrado  / revTotal) * 100) : 0
  const revPctS = revTotal > 0 ? Math.round((revSeminovo / revTotal) * 100) : 0

  // insight automático
  const insight = totalCond === 0
    ? 'Sem dados no período.'
    : totalLacrado > totalSeminovo
      ? `Lacrados dominam com ${pctL}% das vendas por condição.`
      : totalSeminovo > totalLacrado
        ? `Seminovos lideram com ${pctS}% das vendas por condição.`
        : 'Empate entre Lacrado e Seminovo no período.'

  return (
    <div style={{
      background: C.surface, borderRadius: 20, boxShadow: C.shadow,
      overflow: 'hidden',
      animation: 'dashIn .3s ease forwards', animationDelay: '440ms', opacity: 0,
    }}>

      {/* ── Cabeçalho do painel ── */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>Condições de Venda</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>
              {totalCond} vendas · {brlK(revTotal)} em receita
            </div>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: expanded ? C.text : 'rgba(0,0,0,0.05)',
              color: expanded ? '#fff' : C.t2,
              border: 'none', borderRadius: 10, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Instrument Sans, sans-serif',
              transition: 'all .2s',
            }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Recolher' : 'Ver detalhes'}
          </button>
        </div>

        {/* ── Barra comparativa ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', background: 'rgba(0,0,0,0.05)' }}>
            <div style={{
              width: `${pctL}%`, background: C.accent, borderRadius: '5px 0 0 5px',
              transition: 'width .7s cubic-bezier(.4,0,.2,1)',
            }} />
            <div style={{
              width: `${pctS}%`, background: C.violet, borderRadius: '0 5px 5px 0',
              transition: 'width .7s cubic-bezier(.4,0,.2,1)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>📦 Lacrado {pctL}%</span>
            <span style={{ fontSize: 11, color: C.violet, fontWeight: 600 }}>{pctS}% Seminovo ✨</span>
          </div>
        </div>

        {/* ── Cards lado a lado (sempre visíveis) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 20 }}>
          {[
            {
              label: 'Lacrado',   sub: 'iPhones novos',
              icon: '📦',         color: C.accent, colorSoft: C.accentSoft,
              count: totalLacrado, pctVal: pctL,
              rev: revLacrado,    avg: avgLacrado,
            },
            {
              label: 'Seminovo',  sub: 'iPhones usados',
              icon: '✨',          color: C.violet, colorSoft: C.violetSoft,
              count: totalSeminovo, pctVal: pctS,
              rev: revSeminovo,   avg: avgSeminovo,
            },
          ].map(d => (
            <div key={d.label} style={{
              background: d.colorSoft,
              borderRadius: 14, padding: '16px 18px',
              border: `1px solid ${d.color}22`,
            }}>
              {/* top */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{d.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.label}</div>
                    <div style={{ fontSize: 10, color: C.t2 }}>{d.sub}</div>
                  </div>
                </div>
                <div style={{
                  background: d.color, color: '#fff',
                  fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 9px',
                }}>
                  {d.pctVal}%
                </div>
              </div>

              {/* número */}
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1, color: C.text }}>
                {d.count}
              </div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>de {totalSales} vendas</div>

              {/* receita resumida */}
              <div style={{
                marginTop: 14, paddingTop: 12,
                borderTop: `1px solid ${d.color}22`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Receita</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 1 }}>{brlK(d.rev)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Ticket</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: d.color, marginTop: 1 }}>{brlK(d.avg)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PAINEL EXPANDIDO
      ══════════════════════════════════════════════ */}
      <div style={{
        maxHeight: expanded ? 800 : 0,
        overflow: 'hidden',
        transition: 'max-height .35s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: '20px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>

          {/* ── Título da seção ── */}
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Análise detalhada
          </div>

          {/* ── Grid de KPIs expandidos ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
            {[
              {
                label: 'Ticket Lacrado',
                value: brl(avgLacrado),
                icon: DollarSign, color: C.accent, colorSoft: C.accentSoft,
                sub: `${totalLacrado} vendas`,
              },
              {
                label: 'Ticket Seminovo',
                value: brl(avgSeminovo),
                icon: DollarSign, color: C.violet, colorSoft: C.violetSoft,
                sub: `${totalSeminovo} vendas`,
              },
              {
                label: 'Receita Lacrado',
                value: brlK(revLacrado),
                icon: TrendingUp, color: C.accent, colorSoft: C.accentSoft,
                sub: `${revPctL}% da receita total`,
              },
              {
                label: 'Receita Seminovo',
                value: brlK(revSeminovo),
                icon: TrendingUp, color: C.violet, colorSoft: C.violetSoft,
                sub: `${revPctS}% da receita total`,
              },
            ].map(k => (
              <div key={k.label} style={{
                background: C.bg, borderRadius: 14, padding: '14px 16px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: k.colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <k.icon size={14} style={{ color: k.color }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: C.text }}>{k.value}</div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 3, fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Barras comparativas de receita ── */}
          <div style={{ background: C.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Participação na receita</div>

            {[
              { label: 'Lacrado',  color: C.accent,  value: revLacrado,  pctVal: revPctL },
              { label: 'Seminovo', color: C.violet,  value: revSeminovo, pctVal: revPctS },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.pctVal}%</span>
                    <span style={{ fontSize: 12, color: C.t2 }}>{brlK(row.value)}</span>
                  </div>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: row.color, borderRadius: 4,
                    width: `${row.pctVal}%`,
                    transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Comparação visual Unidades vs Receita ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Unidades */}
            <div style={{ background: C.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Unidades
              </div>
              {[
                { label: '📦 Lacrado',  val: totalLacrado,  color: C.accent, pctVal: pctL },
                { label: '✨ Seminovo', val: totalSeminovo, color: C.violet, pctVal: pctS },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.text }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.val}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: r.color, borderRadius: 3, width: `${r.pctVal}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Ticket comparativo */}
            <div style={{ background: C.bg, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ticket médio
              </div>
              {[
                { label: '📦 Lacrado',  val: avgLacrado,  color: C.accent  },
                { label: '✨ Seminovo', val: avgSeminovo, color: C.violet  },
              ].map(r => {
                const maxAvg = Math.max(avgLacrado, avgSeminovo, 1)
                return (
                  <div key={r.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: C.text }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{brlK(r.val)}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: r.color, borderRadius: 3, width: `${Math.round((r.val / maxAvg) * 100)}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Insight box ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(10,102,255,0.05) 0%, rgba(175,82,222,0.05) 100%)',
            border: '1px solid rgba(10,102,255,0.12)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(10,102,255,0.12), rgba(175,82,222,0.12))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <ArrowUpRight size={16} style={{ color: C.accent }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                Insight do período
              </div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{insight}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Principal ──────────────────────────────────────
export default function DashboardPage() {
  const [period, setPeriod] = useState('30')
  const { data, isLoading } = useOrderStats(period)
  const isMobile = useIsMobile()

  const userName = useMemo(() => {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('istore_user') || '{}'
      return JSON.parse(raw)?.name || ''
    } catch { return '' }
  }, [])

  const s        = data?.summary || {}
  const timeline = data?.revenue_timeline || []
  const byType   = data?.by_type || []

  const total         = parseInt(s.total_orders)     || 0
  const totalSales    = parseInt(s.total_sales)       || 0
  const totalManut    = parseInt(s.total_maintenance) || 0
  const revVenda      = parseFloat(byType.find(t => t.type === 'venda')?.revenue)      || 0
  const revManut      = parseFloat(byType.find(t => t.type === 'manutencao')?.revenue) || 0
  const ticketVenda   = totalSales > 0 ? revVenda / totalSales : 0
  const totalLacrado  = parseInt(s.total_lacrado)   || 0
  const totalSeminovo = parseInt(s.total_seminovo)  || 0
  const revLacrado    = parseFloat(s.revenue_lacrado)  || 0
  const revSeminovo   = parseFloat(s.revenue_seminovo) || 0
  const avgLacrado    = parseFloat(s.avg_lacrado)      || 0
  const avgSeminovo   = parseFloat(s.avg_seminovo)     || 0

  const chartData = useMemo(() => timeline.map(d => ({
    day:     new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    receita: parseFloat(d.revenue) || 0,
    ordens:  parseInt(d.orders)    || 0,
  })), [timeline])

  const periodLabel = period === '7' ? 'últimos 7 dias' : period === '30' ? 'últimos 30 dias' : 'últimos 90 dias'

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, color: C.t2, gap: 10, fontFamily: 'Instrument Sans, sans-serif' }}>
      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14 }}>Carregando dashboard…</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16, fontFamily: 'Instrument Sans, sans-serif', color: C.text }}>

      {/* Greeting */}
      <ErrorBoundary>
        <GreetingBanner userName={userName} totalRevenue={parseFloat(s.total_revenue) || 0} />
      </ErrorBoundary>

      {/* Header + período */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, animation: 'dashIn .25s ease forwards', opacity: 0 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: C.t2, margin: '2px 0 0', textTransform: 'capitalize' }}>{periodLabel}</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Hero cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
        <HeroCard icon={TrendingUp}   color={C.green}  colorSoft={C.greenSoft}  label="Receita total"   value={brl(s.total_revenue)}  sub={periodLabel}       delay={0} />
        <HeroCard icon={Zap}          color={C.accent} colorSoft={C.accentSoft} label="Ticket médio"    value={brl(s.avg_sale_price)}  sub="por atendimento"   delay={60} />
        <HeroCard icon={ClipboardList} color={C.amber} colorSoft={C.amberSoft}  label="Total de ordens" value={total}                  sub={periodLabel}       delay={120} />
        <HeroCard icon={Users}        color={C.violet} colorSoft={C.violetSoft} label="Clientes únicos" value={s.unique_clients || 0}  sub={periodLabel}       delay={180} />
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: isMobile ? 8 : 12, flexWrap: 'nowrap', animation: 'dashIn .3s ease forwards', animationDelay: '200ms', opacity: 0 }}>
        <StatusPill label="Vendas"       count={totalSales}     color={C.accent} colorSoft={C.accentSoft} pctVal={pct(totalSales, total)} />
        <StatusPill label="Manutenções"  count={totalManut}     color={C.violet} colorSoft={C.violetSoft} pctVal={pct(totalManut, total)} />
        <StatusPill label="Rec. Vendas"  count={brlK(revVenda)} color={C.green}  colorSoft={C.greenSoft}  pctVal={pct(totalSales, total)} />
        {!isMobile && (
          <StatusPill label="Rec. Manut." count={brlK(revManut)} color={C.teal} colorSoft={C.tealSoft}   pctVal={pct(totalManut, total)} />
        )}
      </div>

      {/* Chart + Por tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: isMobile ? 12 : 14 }}>

        {/* Area chart */}
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: isMobile ? '18px 14px' : '22px 24px', animation: 'dashIn .3s ease forwards', animationDelay: '240ms', opacity: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Receita Diária</div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{periodLabel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, letterSpacing: '-0.5px' }}>{brl(s.total_revenue)}</div>
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
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.t3, fontFamily: 'Instrument Sans' }} axisLine={false} tickLine={false} interval={period === '7' ? 0 : period === '30' ? 4 : 10} />
                <YAxis tick={{ fontSize: 10, fill: C.t3, fontFamily: 'Instrument Sans' }} axisLine={false} tickLine={false} tickFormatter={v => brlK(v)} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke={C.accent} strokeWidth={2.5} fill="url(#gRevenue)" dot={false} activeDot={{ r: 5, fill: C.accent, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3, fontSize: 13 }}>Nenhum dado no período</div>
          )}
        </div>

        {/* Por tipo */}
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '22px 22px 18px', animation: 'dashIn .3s ease forwards', animationDelay: '280ms', opacity: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Por tipo</div>
          <div style={{ fontSize: 12, color: C.t2, marginBottom: 20 }}>{total} atendimentos</div>
          {[
            { l: 'Vendas',      icon: Smartphone, v: totalSales, rev: revVenda, c: C.accent, cs: C.accentSoft },
            { l: 'Manutenções', icon: BarChart2,  v: totalManut, rev: revManut, c: C.violet, cs: C.violetSoft },
          ].map(d => {
            const p2 = pct(d.v, total)
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
                  <div style={{ height: '100%', background: d.c, borderRadius: 3, width: `${p2}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: C.t3 }}>{p2}% do total</span>
                  <span style={{ fontSize: 11, color: C.t2, fontWeight: 600 }}>{brl(d.rev)}</span>
                </div>
              </div>
            )
          })}
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

      {/* Compact stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 14 }}>
        <StatCard icon={Smartphone} color={C.accent} colorSoft={C.accentSoft} label="Vendas"       value={totalSales}       sub={brl(revVenda)}   delay={300} />
        <StatCard icon={BarChart2}  color={C.violet} colorSoft={C.violetSoft} label="Manutenções"  value={totalManut}       sub={brl(revManut)}   delay={340} />
        <StatCard icon={Zap}        color={C.green}  colorSoft={C.greenSoft}  label="Ticket Venda" value={brl(ticketVenda)} sub="por venda"        delay={380} />
      </div>

      {/* ── Condições de Venda — painel expansível ── */}
      <ConditionPanel
        totalLacrado={totalLacrado}   totalSeminovo={totalSeminovo}
        revLacrado={revLacrado}       revSeminovo={revSeminovo}
        avgLacrado={avgLacrado}       avgSeminovo={avgSeminovo}
        totalSales={totalSales}       isMobile={isMobile}
      />

      {/* Comparativo de aparelhos */}
      <ErrorBoundary>
        <DeviceComparison />
      </ErrorBoundary>

      <style>{`
        @keyframes dashIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}

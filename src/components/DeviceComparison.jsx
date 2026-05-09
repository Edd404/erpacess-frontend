/**
 * DeviceComparison.jsx
 * Sessão premium de comparativo de aparelhos com date picker e métricas.
 *
 * Uso no DashboardPage:
 *   import DeviceComparison from '../components/DeviceComparison'
 *   <DeviceComparison />
 *
 * Deps já presentes no projeto: recharts, axios (via api.js), lucide-react
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import {
  Smartphone, TrendingUp, ShoppingBag, Wrench,
  CheckCircle2, Calendar, Filter, Loader2, ChevronDown, ChevronUp,
  Trophy, ArrowUpRight,
} from 'lucide-react'
import api from '../services/api' // ajuste o path conforme seu projeto

// ─── Design Tokens (mesmos do Dashboard) ─────────────────────
const C = {
  bg:        '#F5F5F7',
  surface:   '#FFFFFF',
  border:    'rgba(0,0,0,0.08)',
  text:      '#1D1D1F',
  t2:        '#6E6E73',
  t3:        '#AEAEB2',
  accent:    '#0A66FF',
  accentSoft:'rgba(10,102,255,0.08)',
  green:     '#34C759',
  greenSoft: 'rgba(52,199,89,0.10)',
  amber:     '#FF9F0A',
  amberSoft: 'rgba(255,159,10,0.10)',
  violet:    '#AF52DE',
  violetSoft:'rgba(175,82,222,0.10)',
  teal:      '#32ADE6',
  tealSoft:  'rgba(50,173,230,0.10)',
  red:       '#FF3B30',
  redSoft:   'rgba(255,59,48,0.10)',
  shadow:    '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

// paleta de barras para top 5 modelos
const PALETTE = [C.accent, C.violet, C.teal, C.amber, C.green]

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0)

const num = (v) =>
  new Intl.NumberFormat('pt-BR').format(parseInt(v) || 0)

const shortModel = (name = '') =>
  name.replace(/^iPhone\s*/i, '').trim() || name

// hoje e 30 dias atrás no formato YYYY-MM-DD
const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// ─── Date Input ───────────────────────────────────────────────
function DateInput({ label, value, onChange, max }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input
        type="date" value={value} max={max}
        onChange={e => onChange(e.target.value)}
        style={{
          border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 12px',
          fontSize: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text,
          background: C.surface, outline: 'none', cursor: 'pointer',
          WebkitAppearance: 'none',
        }}
      />
    </div>
  )
}

// ─── Segmented control tipo ───────────────────────────────────
function TypeFilter({ value, onChange }) {
  const opts = [
    { v: '',          l: 'Todos'        },
    { v: 'venda',     l: 'Vendas'       },
    { v: 'manutencao',l: 'Manutenções'  },
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
            padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: active ? 600 : 400,
            background: active ? C.surface : 'transparent',
            color: active ? C.text : C.t2,
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all .15s ease',
            fontFamily: 'Instrument Sans, sans-serif',
            whiteSpace: 'nowrap',
          }}>
            {o.l}
          </button>
        )
      })}
    </div>
  )
}

// ─── Tooltip do gráfico ───────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1D1D1F', borderRadius: 12, padding: '12px 16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.24)', minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8, fontWeight: 600 }}>
        iPhone {label}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: p.fill }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {p.dataKey === 'receita_total' ? brl(p.value) : num(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Rank Badge ───────────────────────────────────────────────
function RankBadge({ rank }) {
  if (rank === 1) return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Trophy size={14} style={{ color: C.amber }} />
    </div>
  )
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.t2 }}>
      {rank}
    </div>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────
function ModelRow({ m, rank, maxRevenue, expanded, onToggle }) {
  const barPct = Math.round((parseFloat(m.receita_total) / maxRevenue) * 100) || 0
  const color = PALETTE[(rank - 1) % PALETTE.length]
  const conclusionRate = m.total > 0 ? Math.round((parseInt(m.concluidos) / parseInt(m.total)) * 100) : 0

  return (
    <>
      {/* linha principal */}
      <div
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr 60px 80px 110px 28px',
          alignItems: 'center', gap: 12,
          padding: '12px 20px',
          cursor: 'pointer',
          background: expanded ? C.accentSoft : 'transparent',
          transition: 'background .15s',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <RankBadge rank={rank} />

        {/* modelo + barra */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {m.iphone_model}
          </div>
          <div style={{ marginTop: 5, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${barPct}%`, background: color, borderRadius: 2, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>

        {/* atendimentos */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{num(m.total)}</div>
          <div style={{ fontSize: 10, color: C.t3 }}>atend.</div>
        </div>

        {/* conclusão */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: conclusionRate >= 80 ? C.green : conclusionRate >= 50 ? C.amber : C.red }}>
            {conclusionRate}%
          </div>
          <div style={{ fontSize: 10, color: C.t3 }}>conclusão</div>
        </div>

        {/* receita */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>{brl(m.receita_total)}</div>
          <div style={{ fontSize: 10, color: C.t3 }}>receita</div>
        </div>

        {/* toggle */}
        <div style={{ color: C.t3 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {/* detalhe expandido */}
      {expanded && (
        <div style={{
          padding: '14px 20px 16px 76px',
          background: C.accentSoft,
          borderBottom: `1px solid ${C.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        }}>
          {[
            { label: 'Vendas',        value: num(m.vendas),           sub: brl(m.receita_vendas),    icon: ShoppingBag,  color: C.accent },
            { label: 'Manutenções',   value: num(m.manutencoes),      sub: brl(m.receita_manutencoes), icon: Wrench,     color: C.violet },
            { label: 'Ticket Médio',  value: brl(m.ticket_medio),     sub: `V: ${brl(m.ticket_venda)} · M: ${brl(m.ticket_manutencao)}`, icon: TrendingUp, color: C.teal },
            { label: 'Concluídos',    value: num(m.concluidos),       sub: `${conclusionRate}% do total`, icon: CheckCircle2, color: C.green },
            { label: 'Em Aberto',     value: num(m.abertos),          sub: 'aguardando', icon: Calendar, color: C.amber },
            { label: 'Últ. atend.',   value: m.ultimo_atendimento ? new Date(m.ultimo_atendimento).toLocaleDateString('pt-BR') : '—', sub: 'último registro', icon: ArrowUpRight, color: C.t2 },
          ].map(d => (
            <div key={d.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <d.icon size={12} style={{ color: d.color }} />
                <span style={{ fontSize: 10, color: C.t2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{d.value}</div>
              <div style={{ fontSize: 10, color: C.t3 }}>{d.sub}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function DeviceComparison() {
  const [startDate, setStartDate]   = useState(daysAgo(30))
  const [endDate, setEndDate]       = useState(today())
  const [typeFilter, setTypeFilter] = useState('')
  const [limit, setLimit]           = useState(10)
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [expanded, setExpanded]     = useState(null)
  const [chartMetric, setChartMetric] = useState('total') // 'total' | 'receita_total'

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date:   endDate,
        limit:      String(limit),
        ...(typeFilter && { type: typeFilter }),
      })
      const res = await api.get(`/orders/model-comparison?${params}`)
      setData(res.data.data)
    } catch (e) {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, typeFilter, limit])

  // busca automática ao mudar filtros
  useEffect(() => { fetchData() }, [fetchData])

  const models = data?.models || []
  const totals = data?.totals || {}
  const maxRevenue = useMemo(() => {
    if (!models.length) return 1
    return Math.max(1, ...models.map(m => parseFloat(m.receita_total) || 0))
  }, [models])

  // dados para o gráfico — top 5
  const chartData = useMemo(() =>
    models.slice(0, 5).map(m => ({
      name: shortModel(m.iphone_model),
      total: parseInt(m.total) || 0,
      vendas: parseInt(m.vendas) || 0,
      manutencoes: parseInt(m.manutencoes) || 0,
      receita_total: parseFloat(m.receita_total) || 0,
    })),
  [models])

  const toggleExpand = (idx) => setExpanded(prev => prev === idx ? null : idx)

  const diffDays = Math.round((new Date(endDate) - new Date(startDate)) / 86400000)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      fontFamily: 'Instrument Sans, sans-serif', color: C.text,
    }}>

      {/* ── Header ── */}
      <div style={{
        background: C.surface, borderRadius: 20, boxShadow: C.shadow,
        padding: '20px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={14} style={{ color: C.accent }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Comparativo de Aparelhos</span>
            </div>
            <div style={{ fontSize: 12, color: C.t2, marginLeft: 38 }}>
              {diffDays > 0 ? `${diffDays} dias selecionados` : 'Selecione o período'}
              {totals.total_orders ? ` · ${num(totals.total_orders)} atendimentos` : ''}
              {totals.distinct_models ? ` · ${num(totals.distinct_models)} modelos` : ''}
            </div>
          </div>
          <TypeFilter value={typeFilter} onChange={setTypeFilter} />
        </div>

        {/* filtros de data */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <DateInput label="De" value={startDate} onChange={setStartDate} max={endDate} />
          <DateInput label="Até" value={endDate} onChange={setEndDate} max={today()} />

          {/* limite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Top
            </label>
            <select
              value={limit} onChange={e => setLimit(Number(e.target.value))}
              style={{
                border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 12px',
                fontSize: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text,
                background: C.surface, outline: 'none', cursor: 'pointer',
                appearance: 'none', paddingRight: 28, minWidth: 80,
              }}
            >
              {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {totals.total_orders && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Receita Total',    value: brl(totals.total_revenue),    icon: TrendingUp,  color: C.green,  colorSoft: C.greenSoft },
            { label: 'Total de Ordens',  value: num(totals.total_orders),     icon: ClipboardList2, color: C.accent, colorSoft: C.accentSoft },
            { label: 'Clientes Únicos',  value: num(totals.unique_clients),   icon: UserIcon,    color: C.violet, colorSoft: C.violetSoft },
          ].map(d => (
            <div key={d.label} style={{
              background: C.surface, borderRadius: 16, boxShadow: C.shadow,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: d.colorSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <d.icon size={16} style={{ color: d.color }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px' }}>{d.value}</div>
                <div style={{ fontSize: 11, color: C.t2, marginTop: 1 }}>{d.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Gráfico de barras ── */}
      {!loading && chartData.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Top 5 — Visão Gráfica</div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 1 }}>Comparativo lado a lado</div>
            </div>
            {/* métrica do gráfico */}
            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 3, gap: 2 }}>
              {[
                { v: 'total',         l: 'Atendimentos' },
                { v: 'receita_total', l: 'Receita'      },
              ].map(o => {
                const active = chartMetric === o.v
                return (
                  <button key={o.v} onClick={() => setChartMetric(o.v)} style={{
                    padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    background: active ? C.surface : 'transparent',
                    color: active ? C.text : C.t2,
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                    transition: 'all .15s', fontFamily: 'Instrument Sans, sans-serif',
                    whiteSpace: 'nowrap',
                  }}>{o.l}</button>
                )
              })}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -10 }} barSize={28} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis
                dataKey="name" tick={{ fontSize: 11, fill: C.t3, fontFamily: 'Instrument Sans' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: C.t3, fontFamily: 'Instrument Sans' }}
                axisLine={false} tickLine={false} width={chartMetric === 'receita_total' ? 52 : 32}
                tickFormatter={v => chartMetric === 'receita_total'
                  ? (v >= 1000 ? `${(v/1000).toFixed(0)}k` : v)
                  : v}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 6 }} />
              <Bar dataKey={chartMetric} name={chartMetric === 'total' ? 'Atendimentos' : 'Receita'} radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Tabela de ranking ── */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, overflow: 'hidden' }}>

        {/* cabeçalho da tabela */}
        <div style={{
          display: 'grid', gridTemplateColumns: '36px 1fr 60px 80px 110px 28px',
          gap: 12, padding: '10px 20px',
          background: 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${C.border}`,
        }}>
          {['#', 'Modelo', 'Qtd', 'Conclusão', 'Receita', ''].map((h, i) => (
            <div key={i} style={{
              fontSize: 10, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              textAlign: i >= 2 && i < 5 ? 'center' : i === 4 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {/* loading */}
        {loading && (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: C.t2 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Buscando dados…</span>
          </div>
        )}

        {/* erro */}
        {!loading && error && (
          <div style={{ padding: 40, textAlign: 'center', color: C.red, fontSize: 13 }}>{error}</div>
        )}

        {/* linhas */}
        {!loading && !error && models.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Smartphone size={32} style={{ color: C.t3, marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.t2 }}>Nenhum resultado</div>
            <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>Tente um período diferente</div>
          </div>
        )}

        {!loading && !error && models.map((m, i) => (
          <ModelRow
            key={m.iphone_model}
            m={m}
            rank={i + 1}
            maxRevenue={maxRevenue}
            expanded={expanded === i}
            onToggle={() => toggleExpand(i)}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ─── Ícones extras inline (evitar imports extras) ─────────────
function ClipboardList2(props) {
  return <ClipboardList {...props} />
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 16} height={props.size || 16} fill="none" stroke={props.style?.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

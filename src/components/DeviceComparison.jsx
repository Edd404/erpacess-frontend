/**
 * DeviceComparison.jsx
 * Comparativo de aparelhos com date picker e métricas.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import {
  Smartphone, Loader2, ChevronDown, ChevronUp, Trophy,
} from 'lucide-react'
import api from '../services/api'

const C = {
  surface:    '#FFFFFF',
  border:     'rgba(0,0,0,0.08)',
  text:       '#1D1D1F',
  t2:         '#6E6E73',
  t3:         '#AEAEB2',
  accent:     '#0A66FF',
  accentSoft: 'rgba(10,102,255,0.08)',
  green:      '#34C759',
  greenSoft:  'rgba(52,199,89,0.10)',
  amber:      '#FF9F0A',
  amberSoft:  'rgba(255,159,10,0.10)',
  violet:     '#AF52DE',
  violetSoft: 'rgba(175,82,222,0.10)',
  teal:       '#32ADE6',
  red:        '#FF3B30',
  shadow:     '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

const PALETTE = [C.accent, C.violet, C.teal, C.amber, C.green]

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0)

const num = (v) =>
  new Intl.NumberFormat('pt-BR').format(parseInt(v) || 0)

const safePct = (a, b) => {
  const nb = parseInt(b)
  return nb > 0 ? Math.round((parseInt(a) / nb) * 100) : 0
}

const today = () => new Date().toISOString().slice(0, 10)

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const shortModel = (name) =>
  String(name || '—').replace(/^iPhone\s*/i, '').trim() || '—'

// ── Segmented control ─────────────────────────────────────────
function Segments({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'rgba(0,0,0,0.06)',
      borderRadius: 10, padding: 3, gap: 2, flexShrink: 0,
    }}>
      {options.map((o) => {
        const active = value === o.v
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: active ? 600 : 400,
            background: active ? '#fff' : 'transparent',
            color: active ? C.text : C.t2,
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all .15s',
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

// ── Tooltip do gráfico ────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: '#1D1D1F', borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
        iPhone {label}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: String(p.fill) }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{String(p.name)}:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {p.dataKey === 'receita_total' ? brl(p.value) : num(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function DeviceComparison() {
  const [startDate,   setStartDate]   = useState(() => daysAgo(30))
  const [endDate,     setEndDate]     = useState(() => today())
  const [typeFilter,  setTypeFilter]  = useState('')
  const [limit,       setLimit]       = useState(10)
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [expanded,    setExpanded]    = useState(null)
  const [chartMetric, setChartMetric] = useState('total')

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        start_date: startDate,
        end_date:   endDate,
        limit:      String(limit),
      })
      if (typeFilter) qs.set('type', typeFilter)
      const res = await api.get(`/orders/model-comparison?${qs.toString()}`)
      const payload = res?.data?.data
      setData(payload && typeof payload === 'object' ? payload : null)
    } catch {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, typeFilter, limit])

  useEffect(() => { fetchData() }, [fetchData])

  const models = useMemo(() => {
    if (!data || !Array.isArray(data.models)) return []
    return data.models
  }, [data])

  const totals = useMemo(() => {
    if (!data || typeof data.totals !== 'object') return {}
    return data.totals || {}
  }, [data])

  const maxRevenue = useMemo(() => {
    if (!models.length) return 1
    const vals = models.map((m) => parseFloat(m.receita_total) || 0)
    return Math.max(1, ...vals)
  }, [models])

  const chartData = useMemo(() =>
    models.slice(0, 5).map((m) => ({
      name:          shortModel(m.iphone_model),
      total:         parseInt(m.total) || 0,
      receita_total: parseFloat(m.receita_total) || 0,
    }))
  , [models])

  const diffDays = useMemo(() => {
    try {
      return Math.round((new Date(endDate) - new Date(startDate)) / 86400000)
    } catch {
      return 0
    }
  }, [startDate, endDate])

  const toggleExpand = (i) => setExpanded((prev) => (prev === i ? null : i))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text }}>

      {/* ── Filtros ── */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={15} style={{ color: C.accent }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Comparativo de Aparelhos</div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 1 }}>
                {diffDays > 0 ? `${diffDays} dias` : '—'}
                {totals.total_orders ? ` · ${num(totals.total_orders)} atendimentos` : ''}
              </div>
            </div>
          </div>
          <Segments
            value={typeFilter} onChange={setTypeFilter}
            options={[{ v: '', l: 'Todos' }, { v: 'venda', l: 'Vendas' }, { v: 'manutencao', l: 'Manutenções' }]}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>De</label>
            <input type="date" value={startDate} max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text, background: C.surface, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Até</label>
            <input type="date" value={endDate} max={today()}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text, background: C.surface, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
              style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text, background: C.surface, outline: 'none', minWidth: 80 }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {!loading && !error && totals.total_orders && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Receita Total',   value: brl(totals.total_revenue),  color: C.green  },
            { label: 'Total de Ordens', value: num(totals.total_orders),   color: C.accent },
            { label: 'Clientes Únicos', value: num(totals.unique_clients), color: C.violet },
          ].map((d) => (
            <div key={d.label} style={{ background: C.surface, borderRadius: 16, boxShadow: C.shadow, padding: '14px 16px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: d.color }}>{d.value}</div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 3 }}>{d.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Gráfico top 5 ── */}
      {!loading && !error && chartData.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Top 5 — Visão Gráfica</div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 1 }}>Comparativo lado a lado</div>
            </div>
            <Segments
              value={chartMetric} onChange={setChartMetric}
              options={[{ v: 'total', l: 'Atendimentos' }, { v: 'receita_total', l: 'Receita' }]}
            />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -10 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.t3, fontFamily: 'Instrument Sans' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: C.t3, fontFamily: 'Instrument Sans' }}
                axisLine={false} tickLine={false}
                width={chartMetric === 'receita_total' ? 52 : 32}
                tickFormatter={(v) => chartMetric === 'receita_total' ? (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)) : String(v)}
              />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey={chartMetric} name={chartMetric === 'total' ? 'Atendimentos' : 'Receita'} radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Tabela ranking ── */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 64px 80px 110px 24px', gap: 10, padding: '10px 20px', background: 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${C.border}` }}>
          {['#', 'Modelo', 'Qtd', 'Conclusão', 'Receita', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i >= 2 && i <= 4 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading && (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: C.t2 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Buscando dados…</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.red, marginBottom: 10 }}>{error}</div>
            <button onClick={fetchData} style={{ background: C.accentSoft, color: C.accent, border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif' }}>
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && models.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Smartphone size={32} style={{ color: C.t3, marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.t2 }}>Nenhum resultado</div>
            <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>Tente um período diferente</div>
          </div>
        )}

        {!loading && !error && models.map((m, i) => {
          const color   = PALETTE[i % PALETTE.length]
          const barPct  = maxRevenue > 0 ? Math.round((parseFloat(m.receita_total) / maxRevenue) * 100) : 0
          const concPct = safePct(m.concluidos, m.total)
          const isOpen  = expanded === i
          const rowKey  = m.iphone_model ? String(m.iphone_model) : String(i)

          return (
            <div key={rowKey}>
              <div
                onClick={() => toggleExpand(i)}
                style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr 64px 80px 110px 24px',
                  alignItems: 'center', gap: 10, padding: '12px 20px', cursor: 'pointer',
                  borderBottom: `1px solid ${C.border}`,
                  background: isOpen ? C.accentSoft : 'transparent',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: i === 0 ? C.amberSoft : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? C.amber : C.t2 }}>
                  {i === 0 ? <Trophy size={13} style={{ color: C.amber }} /> : i + 1}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(m.iphone_model || '—')}
                  </div>
                  <div style={{ marginTop: 5, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barPct}%`, background: color, borderRadius: 2 }} />
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{num(m.total)}</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>atend.</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: concPct >= 80 ? C.green : concPct >= 50 ? C.amber : C.red }}>
                    {concPct}%
                  </div>
                  <div style={{ fontSize: 9, color: C.t3 }}>conclusão</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{brl(m.receita_total)}</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>receita</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t3 }}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: '12px 20px 14px 70px', background: C.accentSoft, borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Vendas',        value: num(m.vendas),       sub: brl(m.receita_vendas)      },
                    { label: 'Manutenções',   value: num(m.manutencoes),  sub: brl(m.receita_manutencoes) },
                    { label: 'Ticket Médio',  value: brl(m.ticket_medio), sub: `Venda: ${brl(m.ticket_venda)}` },
                    { label: 'Concluídos',    value: num(m.concluidos),   sub: `${concPct}% do total`     },
                    { label: 'Em Aberto',     value: num(m.abertos),      sub: 'aguardando'               },
                    { label: 'Último atend.', value: m.ultimo_atendimento ? new Date(m.ultimo_atendimento).toLocaleDateString('pt-BR') : '—', sub: 'última data' },
                  ].map((d) => (
                    <div key={d.label}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{d.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{d.value}</div>
                      <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{d.sub}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

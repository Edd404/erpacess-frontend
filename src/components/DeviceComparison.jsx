/**
 * DeviceComparison.jsx
 * Comparativo de aparelhos com date picker e métricas — mobile-first layout.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import {
  Smartphone, Loader2, ChevronDown, ChevronUp, Trophy,
  Package, Sparkles,
} from 'lucide-react'
import api from '../services/api'
import { useIsMobile } from '../hooks/useIsMobile'

const C = {
  surface:    '#FFFFFF',
  bg:         '#F5F5F7',
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
  lacrado:    '#0A66FF',
  lacradoBg:  'rgba(10,102,255,0.10)',
  seminovo:   '#FF9F0A',
  semiovoBg:  'rgba(255,159,10,0.10)',
  shadow:     '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

const SHORTCUTS = [
  { l:'7d',  n:7   },
  { l:'15d', n:15  },
  { l:'30d', n:30  },
  { l:'60d', n:60  },
  { l:'90d', n:90  },
  { l:'6m',  n:180 },
  { l:'1a',  n:365 },
]

const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0

const PALETTE = [C.accent, C.violet, C.teal, C.amber, C.green]

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0)

const num = (v) =>
  new Intl.NumberFormat('pt-BR').format(parseInt(v) || 0)

const today   = () => new Date().toISOString().slice(0, 10)
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
      borderRadius: 10, padding: 3, gap: 2,
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
  const [activeShort, setActiveShort] = useState(30)
  const isMobile = useIsMobile()

  const applyShortcut = (n) => {
    setActiveShort(n)
    setStartDate(daysAgo(n))
    setEndDate(today())
  }

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

  const chartData = useMemo(() =>
    models.slice(0, 5).map((m) => ({
      name:          shortModel(m.iphone_model),
      total:         parseInt(m.total) || 0,
      receita_total: parseFloat(m.receita_total) || 0,
    }))
  , [models])

  const diffDays = useMemo(() => {
    try { return Math.round((new Date(endDate) - new Date(startDate)) / 86400000) }
    catch { return 0 }
  }, [startDate, endDate])

  const totalLacrado  = useMemo(() => models.reduce((s, m) => s + (parseInt(m.lacrados)  || 0), 0), [models])
  const totalSeminovo = useMemo(() => models.reduce((s, m) => s + (parseInt(m.seminovos) || 0), 0), [models])
  const recLacrado    = useMemo(() => models.reduce((s, m) => s + (parseFloat(m.receita_lacrado)  || 0), 0), [models])
  const recSeminovo   = useMemo(() => models.reduce((s, m) => s + (parseFloat(m.receita_seminovo) || 0), 0), [models])

  const toggleExpand = (i) => setExpanded((prev) => (prev === i ? null : i))

  const inputStyle = {
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'Instrument Sans, sans-serif',
    color: C.text,
    background: C.surface,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text }}>

      {/* ── Filtros ── */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: isMobile ? '18px 16px' : '20px 22px' }}>

        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

        {/* Atalhos de período */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {SHORTCUTS.map((s) => {
            const active = activeShort === s.n
            return (
              <button key={s.n} onClick={() => applyShortcut(s.n)} style={{
                padding: '5px 12px', borderRadius: 8,
                border: `1.5px solid ${active ? C.accent : C.border}`,
                background: active ? C.accentSoft : 'transparent',
                color: active ? C.accent : C.t2,
                fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif', transition: 'all .15s',
              }}>
                {s.l}
              </button>
            )
          })}
        </div>

        {/* Tipo — linha separada no mobile */}
        <div style={{ marginBottom: 14 }}>
          <Segments
            value={typeFilter} onChange={setTypeFilter}
            options={[{ v: '', l: 'Todos' }, { v: 'venda', l: 'Vendas' }, { v: 'manutencao', l: 'Manutenções' }]}
          />
        </div>

        {/* Datas + Top — grid responsivo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr auto',
          gap: 10,
          alignItems: 'flex-end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>De</label>
            <input type="date" value={startDate} max={endDate}
              onChange={(e) => { setStartDate(e.target.value); setActiveShort(null) }}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Até</label>
            <input type="date" value={endDate} max={today()}
              onChange={(e) => { setEndDate(e.target.value); setActiveShort(null) }}
              style={inputStyle}
            />
          </div>
          {/* Top — linha própria no mobile para não quebrar */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            gridColumn: isMobile ? '1 / -1' : 'auto',
          }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
              style={{ ...inputStyle, width: isMobile ? '50%' : 'auto', minWidth: 80, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Summary cards ── */}
      {!loading && !error && totals.total_orders && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 12 }}>
          {[
            { label: 'Receita Total',   value: brl(totals.total_revenue),  color: C.green  },
            { label: 'Total de Ordens', value: num(totals.total_orders),   color: C.accent },
            { label: 'Clientes Únicos', value: num(totals.unique_clients), color: C.violet },
          ].map((d) => (
            <div key={d.label} style={{ background: C.surface, borderRadius: 16, boxShadow: C.shadow, padding: isMobile ? '12px 12px' : '14px 16px' }}>
              <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 700, letterSpacing: '-0.4px', color: d.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.value}</div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: C.t2, marginTop: 3 }}>{d.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Painel Lacrado vs Seminovo global ── */}
      {!loading && !error && (totalLacrado > 0 || totalSeminovo > 0) && (() => {
        const total = totalLacrado + totalSeminovo
        const pctL  = pct(totalLacrado, total)
        const pctS  = 100 - pctL
        return (
          <div style={{ background: C.surface, borderRadius: 16, boxShadow: C.shadow, padding: isMobile ? '14px 14px' : '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Condição do período
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {totalLacrado > 0 && (
                <div style={{ background: C.lacradoBg, borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 110 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                    <Package size={12} style={{ color: C.lacrado }}/>
                    <span style={{ fontSize:11, fontWeight:700, color: C.lacrado, textTransform:'uppercase', letterSpacing:'0.04em' }}>Lacrado</span>
                  </div>
                  <div style={{ fontSize:20, fontWeight:700, color:C.text, letterSpacing:'-0.4px' }}>{totalLacrado}</div>
                  <div style={{ fontSize:11, color:C.t2, marginTop:2 }}>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(recLacrado)}</div>
                </div>
              )}
              {totalSeminovo > 0 && (
                <div style={{ background: C.semiovoBg, borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 110 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                    <Sparkles size={12} style={{ color: C.seminovo }}/>
                    <span style={{ fontSize:11, fontWeight:700, color: C.seminovo, textTransform:'uppercase', letterSpacing:'0.04em' }}>Seminovo</span>
                  </div>
                  <div style={{ fontSize:20, fontWeight:700, color:C.text, letterSpacing:'-0.4px' }}>{totalSeminovo}</div>
                  <div style={{ fontSize:11, color:C.t2, marginTop:2 }}>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(recSeminovo)}</div>
                </div>
              )}
            </div>
            {totalLacrado > 0 && totalSeminovo > 0 && (
              <div>
                <div style={{ height:7, borderRadius:999, overflow:'hidden', display:'flex', background:C.bg }}>
                  <div style={{ width:`${pctL}%`, background:C.lacrado, transition:'width .5s' }}/>
                  <div style={{ width:`${pctS}%`, background:C.seminovo, transition:'width .5s' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <span style={{ fontSize:10, color:C.lacrado, fontWeight:600 }}>📦 {pctL}% Lacrado</span>
                  <span style={{ fontSize:10, color:C.seminovo, fontWeight:600 }}>✨ {pctS}% Seminovo</span>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Gráfico top 5 ── */}
      {!loading && !error && chartData.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: isMobile ? '16px 14px 12px' : '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Top 5 — Visão Gráfica</div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 1 }}>Comparativo lado a lado</div>
            </div>
            <Segments
              value={chartMetric} onChange={setChartMetric}
              options={[{ v: 'total', l: 'Atendimentos' }, { v: 'receita_total', l: 'Receita' }]}
            />
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
            <BarChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -10 }} barSize={isMobile ? 20 : 28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 9 : 11, fill: C.t3, fontFamily: 'Instrument Sans' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: C.t3, fontFamily: 'Instrument Sans' }}
                axisLine={false} tickLine={false}
                width={chartMetric === 'receita_total' ? 48 : 28}
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
          const color    = PALETTE[i % PALETTE.length]
          const maxTotal = Math.max(...models.map(x => parseInt(x.total) || 0), 1)
          const barPct   = Math.round((parseInt(m.total) / maxTotal) * 100)
          const isOpen   = expanded === i
          const rowKey   = m.iphone_model ? String(m.iphone_model) : String(i)
          const lac      = parseInt(m.lacrados)  || 0
          const sem      = parseInt(m.seminovos) || 0
          const total    = parseInt(m.total)     || 0
          const lacPct   = pct(lac, total)
          const semPct   = pct(sem, total)

          return (
            <div key={rowKey}>
              <div
                onClick={() => toggleExpand(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
                  padding: isMobile ? '12px 14px' : '13px 20px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${C.border}`,
                  background: isOpen ? C.accentSoft : 'transparent',
                }}
              >
                {/* rank */}
                <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: i === 0 ? C.amberSoft : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? C.amber : C.t3 }}>
                  {i === 0 ? <Trophy size={12} style={{ color: C.amber }} /> : i + 1}
                </div>

                {/* nome + barra */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                    {String(m.iphone_model || '—')}
                  </div>
                  {/* Barra com segmentos lacrado/seminovo */}
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden', display: 'flex' }}>
                    {lac > 0 && <div style={{ width: `${barPct * (lac / total)}%`, background: C.lacrado, transition: 'width .7s' }} />}
                    {sem > 0 && <div style={{ width: `${barPct * (sem / total)}%`, background: C.seminovo, transition: 'width .7s' }} />}
                    {(lac + sem < total) && <div style={{ width: `${barPct * ((total - lac - sem) / total)}%`, background: color, opacity: 0.4, transition: 'width .7s' }} />}
                  </div>
                  {(lac > 0 || sem > 0) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
                      {lac > 0 && <span style={{ fontSize: 10, color: C.lacrado, fontWeight: 600 }}>📦 {lac} ({lacPct}%)</span>}
                      {sem > 0 && <span style={{ fontSize: 10, color: C.seminovo, fontWeight: 600 }}>✨ {sem} ({semPct}%)</span>}
                    </div>
                  )}
                </div>

                {/* métricas */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.text, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>{brl(m.receita_total)}</span>
                  <span style={{ fontSize: 11, color: C.t3 }}>{num(m.total)} atend.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: C.t3, flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Detalhe expandido */}
              {isOpen && (
                <div style={{
                  padding: isMobile ? '14px 14px 16px 48px' : '14px 20px 16px 58px',
                  background: '#FAFAFA',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  {/* Lacrado vs Seminovo por modelo */}
                  {(lac > 0 || sem > 0) && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        Condição de venda
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: lac > 0 && sem > 0 ? 10 : 0 }}>
                        {lac > 0 && (
                          <div style={{ background: C.lacradoBg, borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 110 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                              <Package size={12} style={{ color:C.lacrado }}/>
                              <span style={{ fontSize:11, fontWeight:700, color:C.lacrado, textTransform:'uppercase', letterSpacing:'0.04em' }}>Lacrado</span>
                            </div>
                            <div style={{ fontSize:18, fontWeight:700, color:C.text, letterSpacing:'-0.4px' }}>{lac}</div>
                            <div style={{ fontSize:11, color:C.t2, marginTop:2 }}>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(m.receita_lacrado)||0)}</div>
                            <div style={{ fontSize:10, color:C.t3, marginTop:1 }}>{lacPct}% das vendas</div>
                          </div>
                        )}
                        {sem > 0 && (
                          <div style={{ background: C.semiovoBg, borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 110 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                              <Sparkles size={12} style={{ color:C.seminovo }}/>
                              <span style={{ fontSize:11, fontWeight:700, color:C.seminovo, textTransform:'uppercase', letterSpacing:'0.04em' }}>Seminovo</span>
                            </div>
                            <div style={{ fontSize:18, fontWeight:700, color:C.text, letterSpacing:'-0.4px' }}>{sem}</div>
                            <div style={{ fontSize:11, color:C.t2, marginTop:2 }}>{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(m.receita_seminovo)||0)}</div>
                            <div style={{ fontSize:10, color:C.t3, marginTop:1 }}>{semPct}% das vendas</div>
                          </div>
                        )}
                      </div>
                      {lac > 0 && sem > 0 && (
                        <div>
                          <div style={{ height:6, borderRadius:999, overflow:'hidden', display:'flex', background:C.bg }}>
                            <div style={{ width:`${lacPct}%`, background:C.lacrado, transition:'width .5s' }}/>
                            <div style={{ width:`${semPct}%`, background:C.seminovo, transition:'width .5s' }}/>
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                            <span style={{ fontSize:10, color:C.lacrado, fontWeight:600 }}>📦 {lacPct}% Lacrado</span>
                            <span style={{ fontSize:10, color:C.seminovo, fontWeight:600 }}>✨ {semPct}% Seminovo</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grid de stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)',
                    gap: isMobile ? 10 : 12,
                  }}>
                    {[
                      { label: 'Vendas',          value: num(m.vendas),            sub: new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(m.receita_vendas)||0)           },
                      { label: 'Manutenções',     value: num(m.manutencoes),       sub: new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(m.receita_manutencoes)||0)      },
                      { label: 'Ticket Médio',    value: new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(m.ticket_medio)||0),      sub: `Venda: ${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(m.ticket_venda)||0)}` },
                      { label: 'Ticket Manut.',   value: new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(m.ticket_manutencao)||0), sub: 'por manutenção'                },
                      { label: 'Primeiro atend.', value: m.primeiro_atendimento ? new Date(m.primeiro_atendimento).toLocaleDateString('pt-BR') : '—', sub: 'primeira data' },
                      { label: 'Último atend.',   value: m.ultimo_atendimento     ? new Date(m.ultimo_atendimento).toLocaleDateString('pt-BR')     : '—', sub: 'última data'  },
                    ].map((d) => (
                      <div key={d.label}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{d.label}</div>
                        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.text }}>{d.value}</div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{d.sub}</div>
                      </div>
                    ))}
                  </div>
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

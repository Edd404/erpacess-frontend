/**
 * DeviceComparison.jsx
 * Comparativo de aparelhos — ranking com barras horizontais, sem gráfico vertical.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Smartphone, Loader2, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
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
  teal:       '#32ADE6',
  red:        '#FF3B30',
  shadow:     '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

const PALETTE = [C.accent, C.violet, C.teal, C.amber, C.green,
                 '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

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

// ── Segmented control ──────────────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DeviceComparison() {
  const [startDate,  setStartDate]  = useState(() => daysAgo(30))
  const [endDate,    setEndDate]    = useState(() => today())
  const [typeFilter, setTypeFilter] = useState('')
  const [limit,      setLimit]      = useState(10)
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [expanded,   setExpanded]   = useState(null)
  const [metric,     setMetric]     = useState('total') // 'total' | 'receita_total'
  const isMobile = useIsMobile()

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ start_date: startDate, end_date: endDate, limit: String(limit) })
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

  const models = useMemo(() => (data?.models && Array.isArray(data.models) ? data.models : []), [data])
  const totals  = useMemo(() => (data?.totals && typeof data.totals === 'object' ? data.totals : {}), [data])

  // Máximo da métrica selecionada — define 100% da barra
  const maxValue = useMemo(() => {
    if (!models.length) return 1
    const vals = models.map(m => metric === 'receita_total'
      ? parseFloat(m.receita_total) || 0
      : parseInt(m.total) || 0
    )
    return Math.max(...vals, 1)
  }, [models, metric])

  const diffDays = useMemo(() => {
    try { return Math.round((new Date(endDate) - new Date(startDate)) / 86400000) }
    catch { return 0 }
  }, [startDate, endDate])

  const inputStyle = {
    border: `1.5px solid ${C.border}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 14,
    fontFamily: 'Instrument Sans, sans-serif',
    color: C.text, background: C.surface, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'Instrument Sans, sans-serif', color: C.text }}>

      {/* ── Filtros ────────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, padding: isMobile ? '18px 16px' : '20px 22px' }}>

        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: C.accentSoft, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
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

        {/* Tipo */}
        <div style={{ marginBottom: 14 }}>
          <Segments
            value={typeFilter} onChange={setTypeFilter}
            options={[{ v: '', l: 'Todos' }, { v: 'venda', l: 'Vendas' }, { v: 'manutencao', l: 'Manutenções' }]}
          />
        </div>

        {/* Datas + Top */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr auto',
          gap: 10, alignItems: 'flex-end',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>De</label>
            <input type="date" value={startDate} max={endDate}
              onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.t2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Até</label>
            <input type="date" value={endDate} max={today()}
              onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </div>
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

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      {!loading && !error && totals.total_orders && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 12 }}>
          {[
            { label: 'Receita Total',   value: brl(totals.total_revenue),  color: C.green  },
            { label: 'Total de Ordens', value: num(totals.total_orders),   color: C.accent },
            { label: 'Clientes Únicos', value: num(totals.unique_clients), color: C.violet },
          ].map((d) => (
            <div key={d.label} style={{
              background: C.surface, borderRadius: 16, boxShadow: C.shadow,
              padding: isMobile ? '12px 12px' : '14px 16px',
            }}>
              <div style={{
                fontSize: isMobile ? 14 : 18, fontWeight: 700, letterSpacing: '-0.4px',
                color: d.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{d.value}</div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: C.t2, marginTop: 3 }}>{d.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Ranking ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, overflow: 'hidden' }}>

        {/* Cabeçalho do ranking com toggle */}
        {!loading && !error && models.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '14px 14px 10px' : '16px 20px 12px',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                Top {models.length} aparelhos
              </div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 1 }}>
                Barras proporcionais a {metric === 'total' ? 'atendimentos' : 'receita'}
              </div>
            </div>
            <Segments
              value={metric} onChange={(v) => { setMetric(v); setExpanded(null) }}
              options={[{ v: 'total', l: 'Atendimentos' }, { v: 'receita_total', l: 'Receita' }]}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: C.t2 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Buscando dados…</span>
          </div>
        )}

        {/* Erro */}
        {!loading && error && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.red, marginBottom: 10 }}>{error}</div>
            <button onClick={fetchData} style={{
              background: C.accentSoft, color: C.accent, border: 'none',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif',
            }}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* Vazio */}
        {!loading && !error && models.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Smartphone size={32} style={{ color: C.t3, marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.t2 }}>Nenhum resultado</div>
            <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>Tente um período diferente</div>
          </div>
        )}

        {/* Linhas */}
        {!loading && !error && models.map((m, i) => {
          const color   = PALETTE[i % PALETTE.length]
          const rawVal  = metric === 'receita_total'
            ? parseFloat(m.receita_total) || 0
            : parseInt(m.total) || 0
          const barPct  = Math.round((rawVal / maxValue) * 100)
          const isOpen  = expanded === i
          const rowKey  = m.iphone_model ? String(m.iphone_model) : String(i)

          // Valor principal e secundário trocam conforme métrica
          const primary   = metric === 'receita_total' ? brl(m.receita_total)       : `${num(m.total)} atend.`
          const secondary = metric === 'receita_total' ? `${num(m.total)} atend.`   : brl(m.receita_total)

          return (
            <div key={rowKey}>
              <div
                onClick={() => setExpanded(prev => prev === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
                  padding: isMobile ? '12px 14px' : '13px 20px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${C.border}`,
                  background: isOpen ? C.accentSoft : 'transparent',
                  transition: 'background .15s',
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: i === 0 ? C.amberSoft : 'rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: i === 0 ? C.amber : C.t3,
                }}>
                  {i === 0 ? <Trophy size={12} style={{ color: C.amber }} /> : i + 1}
                </div>

                {/* Nome + barra proporcional */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? 12 : 13, fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 6,
                  }}>
                    {String(m.iphone_model || '—')}
                  </div>
                  {/* Track */}
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                    {/* Fill — proporcional à métrica selecionada */}
                    <div style={{
                      height: '100%',
                      width: `${barPct}%`,
                      background: color,
                      borderRadius: 10,
                      transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                </div>

                {/* Valores */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  <span style={{
                    fontSize: isMobile ? 13 : 14, fontWeight: 700,
                    color: C.text, letterSpacing: '-0.3px', whiteSpace: 'nowrap',
                  }}>{primary}</span>
                  <span style={{ fontSize: 11, color: C.t3, whiteSpace: 'nowrap' }}>{secondary}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: C.t3, flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>

              {/* Detalhe expandido */}
              {isOpen && (
                <div style={{
                  padding: isMobile ? '12px 14px 14px 48px' : '12px 20px 14px 58px',
                  background: C.accentSoft,
                  borderBottom: `1px solid ${C.border}`,
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
                  gap: isMobile ? 10 : 12,
                }}>
                  {[
                    { label: 'Vendas',          value: num(m.vendas),              sub: brl(m.receita_vendas)           },
                    { label: 'Manutenções',     value: num(m.manutencoes),         sub: brl(m.receita_manutencoes)      },
                    { label: 'Ticket Médio',    value: brl(m.ticket_medio),        sub: `Venda: ${brl(m.ticket_venda)}` },
                    { label: 'Ticket Manut.',   value: brl(m.ticket_manutencao),   sub: 'por manutenção'                },
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
              )}
            </div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

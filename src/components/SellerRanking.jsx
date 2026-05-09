/**
 * SellerRanking.jsx
 * Painel de ranking de vendedores com filtro de período.
 *
 * Uso no DashboardPage:
 *   import SellerRanking from '../components/SellerRanking'
 *   <SellerRanking />
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Trophy, TrendingUp, ShoppingBag, Wrench,
  CheckCircle2, Loader2, Users,
} from 'lucide-react'
import { ResponsiveContainer, Tooltip } from 'recharts'
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
  tealSoft:   'rgba(50,173,230,0.10)',
  red:        '#FF3B30',
  redSoft:    'rgba(255,59,48,0.10)',
  shadow:     '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

// Paleta por posição no ranking
const RANK_COLORS  = [C.amber, C.accent, C.violet, C.teal, C.green]
const RANK_SOFT    = [C.amberSoft, C.accentSoft, C.violetSoft, C.tealSoft, C.greenSoft]

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0)

const num = (v) =>
  new Intl.NumberFormat('pt-BR').format(parseInt(v) || 0)

const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0

// Initials avatar
function Avatar({ name, size = 40, rank }) {
  const color = RANK_COLORS[(rank - 1) % RANK_COLORS.length]
  const soft  = RANK_SOFT[(rank - 1)  % RANK_SOFT.length]
  const ini   = (name || 'A').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: soft, border: `2px solid ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
      fontFamily: 'Instrument Sans, sans-serif',
    }}>
      {ini}
    </div>
  )
}

// Badge de ranking (🥇🥈🥉 ou número)
function RankBadge({ rank }) {
  const medals = ['🥇', '🥈', '🥉']
  if (rank <= 3) return (
    <span style={{ fontSize: 18, lineHeight: 1 }}>{medals[rank - 1]}</span>
  )
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: 'rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: C.t2,
    }}>{rank}</div>
  )
}

// Segmented control reutilizável
function SegmentedControl({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'rgba(0,0,0,0.06)',
      borderRadius: 10, padding: 3, gap: 2,
    }}>
      {options.map(o => {
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
          }}>{o.l}</button>
        )
      })}
    </div>
  )
}

// Card do vendedor #1 (destaque hero)
function TopSellerCard({ seller, totalOrders }) {
  if (!seller) return null
  const conclusionRate = pct(parseInt(seller.concluidos), parseInt(seller.total))
  const shareOfTotal   = pct(parseInt(seller.total), totalOrders)

  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.amber}18 0%, ${C.accentSoft} 100%)`,
      border: `1px solid ${C.amber}33`,
      borderRadius: 18, padding: '20px 22px',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      {/* avatar grande */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={seller.name} size={56} rank={1} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          fontSize: 16, lineHeight: 1,
        }}>🥇</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
          Líder do período
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {seller.name}
        </div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 2, textTransform: 'capitalize' }}>
          {seller.role}
        </div>
      </div>

      {/* métricas resumidas */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Atendimentos', value: num(seller.total),        color: C.accent },
          { label: 'Receita',      value: brl(seller.receita_total), color: C.green  },
          { label: 'Conclusão',    value: `${conclusionRate}%`,      color: conclusionRate >= 80 ? C.green : C.amber },
          { label: 'Share',        value: `${shareOfTotal}%`,        color: C.violet },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Linha de ranking
function SellerRow({ seller, rank, maxRevenue, maxOrders, metric }) {
  const color   = RANK_COLORS[(rank - 1) % RANK_COLORS.length]
  const barVal  = metric === 'receita'
    ? pct(parseFloat(seller.receita_total), maxRevenue)
    : pct(parseInt(seller.total), maxOrders)
  const conclusionRate = pct(parseInt(seller.concluidos), parseInt(seller.total))

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '30px 40px 1fr 60px 60px 110px',
      alignItems: 'center', gap: 10,
      padding: '10px 20px',
      borderBottom: `1px solid ${C.border}`,
      transition: 'background .12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <RankBadge rank={rank} />
      <Avatar name={seller.name} size={34} rank={rank} />

      {/* nome + barra */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {seller.name}
        </div>
        <div style={{ marginTop: 4, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2, background: color,
            width: `${barVal}%`, transition: 'width .6s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>

      {/* atendimentos */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{num(seller.total)}</div>
        <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>ordens</div>
      </div>

      {/* conclusão */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: conclusionRate >= 80 ? C.green : conclusionRate >= 50 ? C.amber : C.red,
        }}>
          {conclusionRate}%
        </div>
        <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>conclusão</div>
      </div>

      {/* receita */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{brl(seller.receita_total)}</div>
        <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>receita</div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function SellerRanking() {
  const [period,  setPeriod]  = useState('30')
  const [metric,  setMetric]  = useState('ordens')   // 'ordens' | 'receita'
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/orders/seller-ranking?period=${period}`)
      setData(res.data.data)
    } catch (e) {
      setError('Não foi possível carregar o ranking.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchRanking() }, [fetchRanking])

  const sellers    = data?.sellers || []
  const topSeller  = sellers[0] || null
  const totalOrders = sellers.reduce((s, v) => s + (parseInt(v.total) || 0), 0)
  const maxRevenue  = Math.max(...sellers.map(s => parseFloat(s.receita_total) || 0), 1)
  const maxOrders   = Math.max(...sellers.map(s => parseInt(s.total) || 0), 1)
  const totalRevenue = sellers.reduce((s, v) => s + (parseFloat(v.receita_total) || 0), 0)

  const periodLabel = period === '7' ? '7 dias' : period === '30' ? '30 dias' : '90 dias'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      fontFamily: 'Instrument Sans, sans-serif', color: C.text,
      animation: 'dashIn .3s ease forwards', opacity: 0,
    }}>

      {/* ── Header ── */}
      <div style={{
        background: C.surface, borderRadius: 20, boxShadow: C.shadow,
        padding: '18px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={15} style={{ color: C.amber }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Ranking de Vendedores</div>
              <div style={{ fontSize: 11, color: C.t2, marginTop: 1 }}>
                {sellers.length} vendedor{sellers.length !== 1 ? 'es' : ''} · últimos {periodLabel}
              </div>
            </div>
          </div>
          <SegmentedControl
            value={period} onChange={setPeriod}
            options={[{ v: '7', l: '7d' }, { v: '30', l: '30d' }, { v: '90', l: '90d' }]}
          />
        </div>

        {/* resumo do período */}
        {!loading && sellers.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Total de Ordens', value: num(totalOrders),   icon: CheckCircle2, color: C.accent, soft: C.accentSoft },
              { label: 'Receita Total',   value: brl(totalRevenue),  icon: TrendingUp,   color: C.green,  soft: C.greenSoft  },
              { label: 'Vendedores',      value: num(sellers.length), icon: Users,       color: C.violet, soft: C.violetSoft },
            ].map(m => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: m.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <m.icon size={14} style={{ color: m.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: C.t3 }}>{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Card do líder ── */}
      {!loading && topSeller && (
        <TopSellerCard seller={topSeller} totalOrders={totalOrders} />
      )}

      {/* ── Tabela de ranking ── */}
      <div style={{ background: C.surface, borderRadius: 20, boxShadow: C.shadow, overflow: 'hidden' }}>

        {/* cabeçalho da tabela + toggle de métrica */}
        <div style={{
          padding: '12px 20px 10px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Todos os vendedores</div>
          <SegmentedControl
            value={metric} onChange={setMetric}
            options={[{ v: 'ordens', l: '# Ordens' }, { v: 'receita', l: 'Receita' }]}
          />
        </div>

        {/* cabeçalho das colunas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '30px 40px 1fr 60px 60px 110px',
          gap: 10, padding: '7px 20px 5px',
          background: 'rgba(0,0,0,0.015)',
          borderBottom: `1px solid ${C.border}`,
        }}>
          {['', '', 'Vendedor', 'Ordens', 'Conc.', 'Receita'].map((h, i) => (
            <div key={i} style={{
              fontSize: 10, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              textAlign: i >= 3 ? 'center' : 'left',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* loading */}
        {loading && (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: C.t2 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Carregando ranking…</span>
          </div>
        )}

        {/* erro */}
        {!loading && error && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.red, marginBottom: 8 }}>{error}</div>
            <button onClick={fetchRanking} style={{
              background: C.accentSoft, color: C.accent, border: 'none',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif',
            }}>Tentar novamente</button>
          </div>
        )}

        {/* empty */}
        {!loading && !error && sellers.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Users size={32} style={{ color: C.t3, marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.t2 }}>Nenhum dado</div>
            <div style={{ fontSize: 12, color: C.t3, marginTop: 4 }}>Nenhum atendimento no período</div>
          </div>
        )}

        {/* linhas */}
        {!loading && !error && sellers.map((s, i) => (
          <SellerRow
            key={s.id}
            seller={s}
            rank={i + 1}
            maxRevenue={maxRevenue}
            maxOrders={maxOrders}
            metric={metric}
          />
        ))}

        {/* footer com breakdown vendas vs manutenções */}
        {!loading && sellers.length > 0 && (() => {
          const totalVendas = sellers.reduce((s, v) => s + (parseInt(v.vendas) || 0), 0)
          const totalManut  = sellers.reduce((s, v) => s + (parseInt(v.manutencoes) || 0), 0)
          return (
            <div style={{
              padding: '12px 20px',
              background: 'rgba(0,0,0,0.015)',
              borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 20, flexWrap: 'wrap',
            }}>
              {[
                { label: 'Vendas',       value: num(totalVendas), icon: ShoppingBag, color: C.accent },
                { label: 'Manutenções',  value: num(totalManut),  icon: Wrench,      color: C.violet },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <m.icon size={13} style={{ color: m.color }} />
                  <span style={{ fontSize: 12, color: C.t2 }}>
                    {m.label}: <strong style={{ color: C.text }}>{m.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

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

/**
 * GreetingBanner.jsx
 * Banner de saudação personalizada + meta mensal configurável.
 * Adicionar no topo do DashboardPage, antes dos hero cards.
 *
 * Uso:
 *   import GreetingBanner from '../components/GreetingBanner'
 *   <GreetingBanner user={user} totalRevenue={parseFloat(s.total_revenue) || 0} />
 */

import { useState, useCallback } from 'react'
import { Target, ChevronRight, Check, X } from 'lucide-react'

const C = {
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
  shadow:    '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

function greeting(name) {
  const h = new Date().getHours()
  const period = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const first = (name || 'Admin').split(' ')[0]
  return `${period}, ${first} 👋`
}

function todayFormatted() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

const STORAGE_KEY = 'istore_monthly_goal'

export default function GreetingBanner({ userName = '', totalRevenue = 0 }) {
  const [goal, setGoal]         = useState(() => parseFloat(localStorage.getItem(STORAGE_KEY)) || 20000)
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState('')

  const pct = Math.min(Math.round((totalRevenue / goal) * 100), 100)
  const reached = totalRevenue >= goal

  const saveGoal = useCallback(() => {
    const v = parseFloat(draft.replace(/\D+/g, ''))
    if (v > 0) {
      setGoal(v)
      localStorage.setItem(STORAGE_KEY, String(v))
    }
    setEditing(false)
  }, [draft])

  // cor da barra de progresso por faixa
  const barColor = pct >= 100 ? C.green : pct >= 70 ? C.accent : pct >= 40 ? C.amber : '#FF3B30'

  return (
    <div style={{
      background: C.surface, borderRadius: 20, boxShadow: C.shadow,
      padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14,
      animation: 'dashIn .25s ease forwards', opacity: 0,
    }}>
      {/* ── linha 1: saudação + data ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {greeting(userName)}
          </div>
          <div style={{ fontSize: 12, color: C.t2, marginTop: 4, textTransform: 'capitalize' }}>
            {todayFormatted()}
          </div>
        </div>

        {/* badge de status da meta */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: reached ? C.greenSoft : C.accentSoft,
          color: reached ? C.green : C.accent,
          borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600,
          flexShrink: 0,
        }}>
          <Target size={12} />
          {reached ? 'Meta atingida! 🎉' : `${pct}% da meta`}
        </div>
      </div>

      {/* ── linha 2: meta mensal ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Meta mensal</span>

            {/* editar meta */}
            {!editing ? (
              <button onClick={() => { setDraft(String(goal)); setEditing(true) }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: C.accent, padding: '1px 6px',
                borderRadius: 6, fontFamily: 'Instrument Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                Editar <ChevronRight size={10} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value.replace(/[^\d]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditing(false) }}
                  placeholder="ex: 30000"
                  style={{
                    border: `1.5px solid ${C.accent}`, borderRadius: 8, padding: '3px 8px',
                    fontSize: 13, fontFamily: 'Instrument Sans, sans-serif', color: C.text,
                    outline: 'none', width: 90,
                  }}
                />
                <button onClick={saveGoal} style={{ background: C.green, border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} style={{ color: '#fff' }} />
                </button>
                <button onClick={() => setEditing(false)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} style={{ color: C.t2 }} />
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: C.t2 }}>
            <span style={{ fontWeight: 700, color: C.text }}>{brl(totalRevenue)}</span>
            {' '}de{' '}
            <span>{brl(goal)}</span>
          </div>
        </div>

        {/* barra de progresso */}
        <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4, background: barColor,
            width: `${pct}%`,
            transition: 'width .8s cubic-bezier(.4,0,.2,1)',
            boxShadow: pct > 0 ? `0 0 8px ${barColor}55` : 'none',
          }} />
        </div>

        {/* legenda abaixo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: C.t3 }}>
            {reached
              ? `Superou em ${brl(totalRevenue - goal)}`
              : `Faltam ${brl(goal - totalRevenue)}`}
          </span>
          <span style={{ fontSize: 11, color: C.t3 }}>30 dias</span>
        </div>
      </div>

      <style>{`
        @keyframes dashIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

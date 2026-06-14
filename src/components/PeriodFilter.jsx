// src/components/PeriodFilter.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

const C = {
  surface:    '#FFFFFF',
  border:     'rgba(0,0,0,0.08)',
  text:       '#1D1D1F',
  t2:         '#6E6E73',
  t3:         '#AEAEB2',
  accent:     '#0A66FF',
  accentSoft: 'rgba(10,102,255,0.08)',
  popShadow:  '0 8px 32px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)',
}

const MONTHS_PT    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAYS_SHORT   = ['D','S','T','Q','Q','S','S']

function pad(n) { return String(n).padStart(2,'0') }
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function fmtLabel(from, to) {
  if (!from) return 'Intervalo'
  const a = new Date(from + 'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
  if (!to || to === from) return a
  const b = new Date(to   + 'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
  return `${a} – ${b}`
}

const btnNav = {
  width:24, height:24, borderRadius:6, border:'none', cursor:'pointer',
  background:'rgba(0,0,0,0.04)', color:C.t2,
  display:'flex', alignItems:'center', justifyContent:'center', padding:0,
  fontFamily:'Instrument Sans, sans-serif',
}

// ── Mini calendário ──────────────────────────────────────────
function MiniCalendar({ year, month, rangeFrom, rangeTo, hoverDate, onDayClick, onDayHover, onPrevMonth, onNextMonth }) {
  const now = new Date()
  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const inRange = (iso) => {
    if (!rangeFrom) return false
    const end = rangeTo || hoverDate
    if (!end) return false
    const [a, b] = rangeFrom <= end ? [rangeFrom, end] : [end, rangeFrom]
    return iso > a && iso < b
  }
  const isStart = (iso) => iso === rangeFrom
  const isEnd   = (iso) => { if (!rangeFrom) return false; const end = rangeTo || hoverDate; return iso === end && end !== rangeFrom }
  const isToday = (iso) => iso === toISO(now)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ userSelect:'none' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <button onClick={onPrevMonth} style={btnNav}><ChevronLeft size={14} /></button>
        <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{MONTHS_PT[month]} {year}</span>
        <button onClick={onNextMonth} style={btnNav}><ChevronRight size={14} /></button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {DAYS_SHORT.map((d,i) => (
          <div key={i} style={{ textAlign:'center', fontSize:10, fontWeight:600, color:C.t3, padding:'2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const iso    = `${year}-${pad(month+1)}-${pad(day)}`
          const start  = isStart(iso)
          const end    = isEnd(iso)
          const inRng  = inRange(iso)
          const today  = isToday(iso)
          const marked = start || end
          return (
            <button key={iso} onClick={() => onDayClick(iso)} onMouseEnter={() => onDayHover(iso)} style={{
              width:'100%', aspectRatio:'1', border:'none', cursor:'pointer',
              borderRadius:8,
              background: marked ? C.accent : inRng ? 'rgba(10,102,255,0.10)' : 'transparent',
              color:      marked ? '#fff'   : today  ? C.accent : C.text,
              fontSize:12, fontWeight: marked || today ? 700 : 400,
              fontFamily:'Instrument Sans, sans-serif',
              outline: today && !marked ? `1.5px solid ${C.accent}` : 'none',
              transition:'background .1s',
            }}>{day}</button>
          )
        })}
      </div>
    </div>
  )
}

// ── Month Grid ───────────────────────────────────────────────
function MonthGrid({ year, selectedMonth, selectedYear, onSelect, onPrevYear, onNextYear }) {
  const now = new Date()
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button onClick={onPrevYear} style={btnNav}><ChevronLeft size={14} /></button>
        <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{year}</span>
        <button onClick={onNextYear} style={btnNav}><ChevronRight size={14} /></button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
        {MONTHS_SHORT.map((m, i) => {
          const isCurrent  = i === now.getMonth() && year === now.getFullYear()
          const isSelected = i === selectedMonth && year === selectedYear
          const isFuture   = year > now.getFullYear() || (year === now.getFullYear() && i > now.getMonth())
          return (
            <button key={m} onClick={() => !isFuture && onSelect(year, i)} disabled={isFuture} style={{
              padding:'8px 4px', border:'none', borderRadius:8, cursor: isFuture ? 'default' : 'pointer',
              background: isSelected ? C.accent : isCurrent ? C.accentSoft : 'transparent',
              color:      isSelected ? '#fff'   : isFuture  ? C.t3        : C.text,
              fontSize:12, fontWeight: isSelected || isCurrent ? 700 : 400,
              fontFamily:'Instrument Sans, sans-serif', transition:'background .1s',
              outline: isCurrent && !isSelected ? `1.5px solid ${C.accent}` : 'none',
            }}>{m}</button>
          )
        })}
      </div>
    </div>
  )
}

// ── Portal Popover (renderiza no body, nunca cortado por overflow) ──
function PortalPopover({ anchorRef, open, onClose, children, align = 'right' }) {
  const popRef  = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  // Calcula posição baseada no botão âncora
  const recalc = useCallback(() => {
    if (!anchorRef?.current) return
    const r = anchorRef.current.getBoundingClientRect()
    const popW = 256
    let left = align === 'right' ? r.right - popW : r.left
    // garante que não saia pela esquerda
    if (left < 8) left = 8
    // garante que não saia pela direita
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8
    setPos({ top: r.bottom + window.scrollY + 6, left: left + window.scrollX })
  }, [anchorRef, align])

  useEffect(() => {
    if (!open) return
    recalc()
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc, true)
    return () => {
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc, true)
    }
  }, [open, recalc])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (popRef.current  && popRef.current.contains(e.target))  return
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return
      onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return createPortal(
    <div ref={popRef} style={{
      position:'absolute',
      top: pos.top,
      left: pos.left,
      width: 256,
      background: C.surface,
      borderRadius: 16,
      boxShadow: C.popShadow,
      padding: 16,
      zIndex: 99999,
      animation: 'pfadeIn .15s ease',
    }}>
      {children}
      <style>{`@keyframes pfadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>,
    document.body
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function PeriodFilter({ value, onChange, align = 'right' }) {
  const now = new Date()

  const [openMonth, setOpenMonth] = useState(false)
  const [openCal,   setOpenCal]   = useState(false)

  const [calYear,  setCalYear]  = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [picking,  setPicking]  = useState(null)
  const [hovered,  setHovered]  = useState(null)
  const [mYear,    setMYear]    = useState(now.getFullYear())

  const monthBtnRef = useRef(null)
  const calBtnRef   = useRef(null)

  useEffect(() => {
    if (openCal) {
      if (value?.mode === 'range' && value.from) {
        const d = new Date(value.from + 'T12:00:00')
        setCalYear(d.getFullYear()); setCalMonth(d.getMonth())
      } else {
        setCalYear(now.getFullYear()); setCalMonth(now.getMonth())
      }
      setPicking(value?.mode === 'range' ? value.from || null : null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCal])

  const isQuickActive = (d) => value?.mode === 'quick' && value?.days === d
  const isMonthActive = value?.mode === 'month'
  const isRangeActive = value?.mode === 'range'

  const rangeFrom = value?.mode === 'range' ? value.from : null
  const rangeTo   = value?.mode === 'range' ? value.to   : null

  const label = (() => {
    if (value?.mode === 'month') return `${MONTHS_SHORT[value.month]} ${value.year}`
    if (value?.mode === 'range') return fmtLabel(value.from, value.to)
    return null
  })()

  const handleQuick = (days) => { onChange({ mode:'quick', days }); setOpenMonth(false); setOpenCal(false) }

  const handleMonthSelect = (year, month) => { onChange({ mode:'month', year, month }); setOpenMonth(false) }

  const handleDayClick = (iso) => {
    if (!picking) {
      setPicking(iso)
    } else {
      const [from, to] = picking <= iso ? [picking, iso] : [iso, picking]
      onChange({ mode:'range', from, to })
      setPicking(null); setHovered(null); setOpenCal(false)
    }
  }

  const handleClear = (e) => { e.stopPropagation(); onChange({ mode:'quick', days: 30 }) }

  const toggleMonth = () => { setOpenMonth(o => !o); setOpenCal(false) }
  const toggleCal   = () => { setOpenCal(o => !o);   setOpenMonth(false) }

  const displayRangeFrom = picking || rangeFrom
  const displayRangeTo   = picking ? hovered : rangeTo

  return (
    <>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>

        {/* Pills rápidas */}
        <div style={{ display:'inline-flex', background:'rgba(0,0,0,0.06)', borderRadius:10, padding:3, gap:2 }}>
          {[7,30,90].map(d => (
            <button key={d} onClick={() => handleQuick(d)} style={{
              padding:'5px 14px', borderRadius:7, border:'none', cursor:'pointer',
              fontSize:13, fontWeight: isQuickActive(d) ? 600 : 400,
              background: isQuickActive(d) ? C.surface : 'transparent',
              color:      isQuickActive(d) ? C.text    : C.t2,
              boxShadow:  isQuickActive(d) ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition:'all .15s', fontFamily:'Instrument Sans, sans-serif',
            }}>{d}d</button>
          ))}
        </div>

        {/* Divisor */}
        <div style={{ width:1, height:22, background:C.border, flexShrink:0 }} />

        {/* Botão Mês */}
        <button ref={monthBtnRef} onClick={toggleMonth} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'5px 12px', borderRadius:9, border:'none', cursor:'pointer',
          background: isMonthActive ? C.accent : 'rgba(0,0,0,0.06)',
          color:      isMonthActive ? '#fff'   : C.t2,
          fontSize:13, fontWeight: isMonthActive ? 600 : 400,
          fontFamily:'Instrument Sans, sans-serif', transition:'all .15s',
          boxShadow: isMonthActive ? '0 2px 8px rgba(10,102,255,0.25)' : 'none',
          whiteSpace:'nowrap',
        }}>
          {isMonthActive ? label : 'Mês'}
          <ChevronRight size={12} style={{ transform: openMonth ? 'rotate(90deg)' : 'none', transition:'transform .15s' }} />
        </button>

        <PortalPopover anchorRef={monthBtnRef} open={openMonth} onClose={() => setOpenMonth(false)} align={align}>
          <MonthGrid
            year={mYear}
            selectedMonth={value?.mode === 'month' ? value.month : -1}
            selectedYear={value?.mode  === 'month' ? value.year  : -1}
            onSelect={handleMonthSelect}
            onPrevYear={() => setMYear(y => y - 1)}
            onNextYear={() => setMYear(y => Math.min(y + 1, now.getFullYear()))}
          />
        </PortalPopover>

        {/* Botão Intervalo */}
        <button ref={calBtnRef} onClick={toggleCal} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'5px 12px', borderRadius:9, border:'none', cursor:'pointer',
          background: isRangeActive ? C.accent : 'rgba(0,0,0,0.06)',
          color:      isRangeActive ? '#fff'   : C.t2,
          fontSize:13, fontWeight: isRangeActive ? 600 : 400,
          fontFamily:'Instrument Sans, sans-serif', transition:'all .15s',
          boxShadow: isRangeActive ? '0 2px 8px rgba(10,102,255,0.25)' : 'none',
          whiteSpace:'nowrap',
        }}>
          <Calendar size={13} />
          {isRangeActive ? label : 'Intervalo'}
        </button>

        <PortalPopover anchorRef={calBtnRef} open={openCal} onClose={() => { setOpenCal(false); setPicking(null); setHovered(null) }} align={align}>
          {picking && (
            <div style={{
              marginBottom:10, padding:'6px 10px', background:'rgba(10,102,255,0.07)',
              borderRadius:8, fontSize:12, color:C.accent, fontWeight:600,
            }}>
              Selecione a data final
            </div>
          )}
          <MiniCalendar
            year={calYear} month={calMonth}
            rangeFrom={displayRangeFrom} rangeTo={displayRangeTo}
            hoverDate={hovered}
            onDayClick={handleDayClick}
            onDayHover={(iso) => { if (picking) setHovered(iso) }}
            onPrevMonth={() => {
              if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11) }
              else setCalMonth(m => m-1)
            }}
            onNextMonth={() => {
              const nextM = calMonth === 11 ? 0         : calMonth + 1
              const nextY = calMonth === 11 ? calYear+1 : calYear
              if (nextY > now.getFullYear() || (nextY === now.getFullYear() && nextM > now.getMonth())) return
              setCalMonth(nextM); setCalYear(nextY)
            }}
          />
          {(rangeFrom || picking) && (
            <button onClick={() => { setPicking(null); setHovered(null) }} style={{
              width:'100%', marginTop:10, padding:'7px 0',
              background:'rgba(0,0,0,0.04)', border:'none', borderRadius:8,
              fontSize:12, color:C.t2, cursor:'pointer',
              fontFamily:'Instrument Sans, sans-serif',
              display:'flex', alignItems:'center', justifyContent:'center', gap:5,
            }}>
              <X size={11} /> Limpar seleção
            </button>
          )}
        </PortalPopover>

        {/* X para limpar modo ativo */}
        {(isMonthActive || isRangeActive) && (
          <button onClick={handleClear} style={{
            display:'inline-flex', alignItems:'center', padding:'4px 8px',
            background:'rgba(0,0,0,0.05)', border:'none', borderRadius:6,
            cursor:'pointer', color:C.t3,
          }}>
            <X size={12} />
          </button>
        )}

      </div>
    </>
  )
}

// ── Helper: converte value do PeriodFilter para params de API ──
export function periodToParams(value) {
  if (!value) return { period: '30' }
  if (value.mode === 'quick') return { period: String(value.days) }
  if (value.mode === 'month') {
    const { year, month } = value
    const from = `${year}-${pad(month + 1)}-01`
    const to   = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`
    return { date_from: from, date_to: to }
  }
  if (value.mode === 'range') {
    if (!value.from) return { period: '30' }
    return { date_from: value.from, date_to: value.to || value.from }
  }
  return { period: '30' }
}

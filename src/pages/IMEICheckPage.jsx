import { useState, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import {
  Search, CheckCircle2, AlertCircle, XCircle, ExternalLink,
  Smartphone, Shield, Wifi, ClipboardCheck, Trash2,
  ChevronRight, Copy, Check, Info, Clock, Hash,
} from 'lucide-react'

// ── Luhn Algorithm ─────────────────────────────────────────────
function validateIMEI(imei) {
  const digits = imei.replace(/\D/g, '')
  if (digits.length !== 15) return false
  let sum = 0
  for (let i = 0; i < 15; i++) {
    let d = parseInt(digits[i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

function getIMEIBrand(imei) {
  const tac = imei.slice(0, 8)
  // TACs conhecidos de iPhones Apple
  const applePrefixes = ['35','86','35355','35407','35245']
  const isApple = applePrefixes.some(p => imei.startsWith(p))
  return isApple ? 'Apple' : null
}

// ── Links externos com IMEI pré-preenchido ─────────────────────
const getServices = (imei) => [
  {
    id: 'anatel',
    name: 'ANATEL',
    desc: 'Consulta oficial de bloqueio no Brasil',
    badge: '🇧🇷 Oficial',
    badgeColor: '#15803D',
    badgeBg: '#DCFCE7',
    url: `https://consultaimei.anatel.gov.br/`,
    note: 'Cole o IMEI no campo do site',
    priority: true,
  },
  {
    id: 'gsma',
    name: 'GSMA Check',
    desc: 'Base mundial de IMEIs — detecta roubo internacional',
    badge: '🌐 Global',
    badgeColor: '#1D4ED8',
    badgeBg: '#DBEAFE',
    url: `https://www.gsma.com/get-involved/gsma-imei-database`,
    note: 'Requer cadastro gratuito',
    priority: true,
  },
  {
    id: 'icloud',
    name: 'iCloud Status (Apple)',
    desc: 'Verifica se o Find My iPhone está ativo — o maior risco',
    badge: '⚠️ Essencial',
    badgeColor: '#92400E',
    badgeBg: '#FEF3C7',
    url: `https://checkcoverage.apple.com/`,
    note: 'Use o número de série, não o IMEI',
    priority: true,
  },
  {
    id: 'swappa',
    name: 'Swappa ESN Check',
    desc: 'Checa ESN/IMEI em operadoras americanas',
    badge: '🇺🇸 EUA',
    badgeColor: '#6B7280',
    badgeBg: '#F3F4F6',
    url: `https://swappa.com/esn?imei=${imei}`,
    note: 'Útil para iPhones importados',
    priority: false,
  },
  {
    id: 'imei24',
    name: 'IMEI24.com',
    desc: 'Consulta gratuita de modelo, memória e especificações',
    badge: '🔍 Info',
    badgeColor: '#6B7280',
    badgeBg: '#F3F4F6',
    url: `https://imei24.com/${imei}`,
    note: 'Informações do aparelho pelo IMEI',
    priority: false,
  },
]

// ── Checklist de compra ────────────────────────────────────────
const CHECKLIST = [
  { id:'icloud',    label:'Find My / iCloud desativado',              desc:'Vá em Ajustes → [nome] → Encontrar → Encontrar iPhone deve estar OFF',   icon:'🔒', critical:true  },
  { id:'conta',     label:'Conta Apple removida do aparelho',          desc:'Ajustes → [nome] deve mostrar opção de fazer login, não uma conta ativa', icon:'👤', critical:true  },
  { id:'caixa',     label:'IMEI da caixa bate com o do aparelho',      desc:'Conferir IMEI em Ajustes → Geral → Sobre com o da caixa e da nota',      icon:'📦', critical:true  },
  { id:'touch',     label:'Touch ID / Face ID funcionando',            desc:'Testar desbloqueio biométrico normalmente',                              icon:'✋', critical:false },
  { id:'tela',      label:'Tela sem manchas, listras ou dead pixels',   desc:'Exibir fundo branco e preto sólido para verificar',                     icon:'📱', critical:false },
  { id:'bateria',   label:'Bateria acima de 80% de capacidade',         desc:'Ajustes → Bateria → Saúde da Bateria',                                  icon:'🔋', critical:false },
  { id:'cameras',   label:'Câmeras frontal e traseira funcionando',     desc:'Testar foto, vídeo e troca de câmera',                                  icon:'📷', critical:false },
  { id:'botoes',    label:'Todos os botões funcionando',                desc:'Volume, power, mute e (se houver) botão home',                          icon:'🔘', critical:false },
  { id:'signal',    label:'SIM reconhecido e com sinal',               desc:'Inserir chip e verificar rede da operadora',                            icon:'📶', critical:false },
  { id:'nota',      label:'Nota fiscal ou comprovante de compra',       desc:'Documento que comprove a origem do aparelho',                           icon:'🧾', critical:false },
]

// ── Componente principal ───────────────────────────────────────
export default function IMEICheckPage() {
  const { T } = useTheme()
  const [imei, setImei]           = useState('')
  const [checked, setChecked]     = useState(false)
  const [history, setHistory]     = useState([])
  const [checkItems, setCheckItems] = useState({})
  const [copied, setCopied]       = useState(false)
  const inputRef = useRef(null)

  const digits   = imei.replace(/\D/g, '')
  const len      = digits.length
  const isValid  = len === 15 && validateIMEI(digits)
  const isWrong  = len === 15 && !validateIMEI(digits)
  const brand    = isValid ? getIMEIBrand(digits) : null
  const services = getServices(digits)

  const handleCheck = () => {
    if (!isValid) return
    setChecked(true)
    setHistory(h => {
      const exists = h.find(x => x.imei === digits)
      if (exists) return h
      return [{ imei: digits, at: new Date(), valid: true }, ...h].slice(0, 10)
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(digits)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleCheck = (id) =>
    setCheckItems(c => ({ ...c, [id]: !c[id] }))

  const checkedCount  = Object.values(checkItems).filter(Boolean).length
  const criticalOk    = CHECKLIST.filter(i => i.critical).every(i => checkItems[i.id])
  const allOk         = checkedCount === CHECKLIST.length

  return (
    <div style={{
      maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px',
      fontFamily: 'Instrument Sans, sans-serif',
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,#0A66FF,#0047CC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(10,102,255,0.30)',
          }}>
            <Shield size={20} style={{ color: '#fff' }}/>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.ink, letterSpacing: '-0.4px' }}>
              Consulta de IMEI
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: T.ink3, marginTop: 2 }}>
              Verificação antes de comprar um iPhone usado
            </p>
          </div>
        </div>
      </div>

      {/* ── Input IMEI ─────────────────────────────────────────── */}
      <div style={{
        background: T.surface, borderRadius: 18, padding: '20px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16,
        border: `1px solid ${T.ink6}`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.ink4, textTransform: 'uppercase',
          letterSpacing: '0.7px', marginBottom: 10 }}>IMEI do aparelho</div>

        {/* Campo */}
        <div style={{
          border: `2px solid ${isWrong ? '#EF4444' : isValid ? '#22C55E' : checked ? T.blue : T.ink5}`,
          borderRadius: 12, background: T.bg, display: 'flex', alignItems: 'center',
          transition: 'border-color .15s', overflow: 'hidden',
        }}>
          <Hash size={14} style={{ marginLeft: 14, color: T.ink4, flexShrink: 0 }}/>
          <input
            ref={inputRef}
            value={digits.replace(/(\d{2})(\d{6})(\d{6})(\d?)/, (_, a, b, c, d) =>
              [a, b, c, d].filter(Boolean).join(' ')
            )}
            onChange={e => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 15)
              setImei(raw)
              setChecked(false)
            }}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            placeholder="00 000000 000000 0"
            inputMode="numeric"
            style={{
              flex: 1, padding: '14px 12px', border: 'none', outline: 'none',
              fontSize: 20, fontWeight: 700, color: T.ink, background: 'transparent',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 12 }}>
            {len > 0 && (
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                color: len === 15 ? (isValid ? '#22C55E' : '#EF4444') : T.ink4,
              }}>{len}/15</span>
            )}
            {isValid  && <CheckCircle2 size={18} style={{ color: '#22C55E' }}/>}
            {isWrong  && <XCircle      size={18} style={{ color: '#EF4444' }}/>}
            {digits.length > 0 && !isValid && !isWrong && (
              <div style={{ fontSize: 11, color: T.ink4 }}>{15 - len} restantes</div>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div style={{ marginTop: 8, minHeight: 18 }}>
          {isValid && brand && (
            <div style={{ fontSize: 12, color: '#15803D', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={12}/> IMEI válido · Aparelho {brand}
            </div>
          )}
          {isValid && !brand && (
            <div style={{ fontSize: 12, color: '#15803D', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={12}/> IMEI válido (Luhn ✓)
            </div>
          )}
          {isWrong && (
            <div style={{ fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}>
              <XCircle size={12}/> IMEI inválido — verifique os dígitos
            </div>
          )}
          {len === 0 && (
            <div style={{ fontSize: 12, color: T.ink4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Info size={12}/> Digite os 15 dígitos do IMEI (Ajustes → Geral → Sobre)
            </div>
          )}
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={handleCheck}
            disabled={!isValid}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
              background: isValid ? 'linear-gradient(135deg,#0A66FF,#0047CC)' : T.ink6,
              color: isValid ? '#fff' : T.ink4,
              fontSize: 14, fontWeight: 600, cursor: isValid ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all .15s', fontFamily: 'Instrument Sans, sans-serif',
              boxShadow: isValid ? '0 4px 12px rgba(10,102,255,0.25)' : 'none',
            }}
          >
            <Search size={15}/> Consultar IMEI
          </button>
          {isValid && (
            <button onClick={handleCopy} style={{
              padding: '12px 16px', borderRadius: 10,
              border: `1px solid ${T.ink5}`, background: T.surface,
              color: copied ? '#15803D' : T.ink3, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, fontFamily: 'Instrument Sans, sans-serif',
              transition: 'color .15s',
            }}>
              {copied ? <Check size={14}/> : <Copy size={14}/>}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          )}
        </div>
      </div>

      {/* ── Serviços de consulta ────────────────────────────────── */}
      {checked && isValid && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink4, textTransform: 'uppercase',
            letterSpacing: '0.7px', marginBottom: 12 }}>Consultar nos serviços</div>

          {/* Aviso */}
          <div style={{
            background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12,
            padding: '11px 14px', marginBottom: 12, display: 'flex', gap: 9, alignItems: 'flex-start',
          }}>
            <AlertCircle size={14} style={{ color: '#B45309', flexShrink: 0, marginTop: 1 }}/>
            <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
              O IMEI <strong style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{digits}</strong> foi copiado automaticamente — basta colar no site ao abrir.
            </div>
          </div>

          {/* Serviços prioritários */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {services.filter(s => s.priority).map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: T.surface, border: `1px solid ${T.ink6}`, borderRadius: 14,
                  padding: '14px 16px', textDecoration: 'none', gap: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{s.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                      background: s.badgeBg, color: s.badgeColor,
                    }}>{s.badge}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.ink3 }}>{s.desc}</div>
                  <div style={{ fontSize: 11, color: T.ink4, marginTop: 3 }}>💡 {s.note}</div>
                </div>
                <ExternalLink size={15} style={{ color: T.ink4, flexShrink: 0 }}/>
              </a>
            ))}
          </div>

          {/* Serviços secundários */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {services.filter(s => !s.priority).map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: T.surface, border: `1px solid ${T.ink6}`,
                  borderRadius: 12, padding: '12px 14px', textDecoration: 'none', gap: 8,
                  transition: 'box-shadow .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: T.ink4 }}>{s.desc}</div>
                </div>
                <ExternalLink size={13} style={{ color: T.ink4, flexShrink: 0 }}/>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Checklist de compra ─────────────────────────────────── */}
      <div style={{
        background: T.surface, borderRadius: 18, overflow: 'hidden',
        border: `1px solid ${T.ink6}`, boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        marginBottom: 16,
      }}>
        {/* Header do checklist */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${T.ink6}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <ClipboardCheck size={16} style={{ color: T.blue }}/>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Checklist de compra</div>
              <div style={{ fontSize: 11, color: T.ink4, marginTop: 1 }}>
                {checkedCount}/{CHECKLIST.length} itens verificados
              </div>
            </div>
          </div>
          {/* Barra de progresso */}
          <div style={{ width: 80, height: 6, background: T.ink6, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, transition: 'width .3s',
              width: `${(checkedCount / CHECKLIST.length) * 100}%`,
              background: allOk ? '#22C55E' : criticalOk ? '#0A66FF' : '#F59E0B',
            }}/>
          </div>
        </div>

        {/* Status geral */}
        {checkedCount > 0 && (
          <div style={{
            padding: '10px 20px',
            background: allOk ? '#F0FDF4' : criticalOk ? '#EFF6FF' : '#FFFBEB',
            borderBottom: `1px solid ${T.ink6}`,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {allOk
              ? <><CheckCircle2 size={13} style={{ color: '#16A34A' }}/><span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>Tudo verificado — aparelho aprovado para compra!</span></>
              : criticalOk
              ? <><CheckCircle2 size={13} style={{ color: '#2563EB' }}/><span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>Itens críticos OK — finalize os demais itens</span></>
              : <><AlertCircle size={13} style={{ color: '#D97706' }}/><span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Verifique os itens críticos antes de fechar</span></>
            }
          </div>
        )}

        {/* Itens */}
        {CHECKLIST.map((item, i) => {
          const done = !!checkItems[item.id]
          return (
            <button key={item.id} onClick={() => toggleCheck(item.id)}
              style={{
                width: '100%', background: done ? (item.critical ? '#F0FDF4' : '#FAFAFA') : T.surface,
                border: 'none', borderBottom: i < CHECKLIST.length - 1 ? `1px solid ${T.ink6}` : 'none',
                padding: '14px 20px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                transition: 'background .15s', fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: `2px solid ${done ? (item.critical ? '#22C55E' : '#0A66FF') : T.ink5}`,
                background: done ? (item.critical ? '#22C55E' : '#0A66FF') : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
              }}>
                {done && <Check size={13} style={{ color: '#fff' }}/>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: done ? T.ink3 : T.ink,
                    textDecoration: done ? 'line-through' : 'none',
                  }}>{item.label}</span>
                  {item.critical && !done && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                      background: '#FEE2E2', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>Crítico</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: T.ink4, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Histórico da sessão ─────────────────────────────────── */}
      {history.length > 0 && (
        <div style={{
          background: T.surface, borderRadius: 16, border: `1px solid ${T.ink6}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 18px', borderBottom: `1px solid ${T.ink6}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={13} style={{ color: T.ink4 }}/>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.ink3 }}>
                Consultados nesta sessão
              </span>
            </div>
            <button onClick={() => setHistory([])} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: T.ink4, display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontFamily: 'Instrument Sans, sans-serif',
            }}>
              <Trash2 size={11}/> Limpar
            </button>
          </div>
          {history.map((h, i) => (
            <button key={h.imei} onClick={() => { setImei(h.imei); setChecked(true) }}
              style={{
                width: '100%', background: 'none', border: 'none',
                borderBottom: i < history.length - 1 ? `1px solid ${T.ink6}` : 'none',
                padding: '11px 18px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Smartphone size={13} style={{ color: T.ink4 }}/>
                <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.05em', color: T.ink }}>{h.imei}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.ink4 }}>
                  {h.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <ChevronRight size={13} style={{ color: T.ink5 }}/>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

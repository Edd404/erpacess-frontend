import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import {
  X, Copy, CheckCheck, Loader2, Receipt, AlertTriangle, RotateCcw, MessageCircle,
} from 'lucide-react'
import { useOrder } from '../hooks/useData'
import { formatPhone } from '../utils/formatters'
import {
  buildNfMessage, missingNfFields, orderAccessories, normalizeBrPhone, buildWhatsAppUrl,
} from '../utils/nfMessage'

// Número do administrativo fica salvo só neste aparelho (opcional)
const PHONE_KEY = 'acessphones_nf_whatsapp'
const readPhone = () => {
  try { return localStorage.getItem(PHONE_KEY) || '' } catch { return '' }
}
const savePhone = (digits) => {
  try {
    if (digits) localStorage.setItem(PHONE_KEY, digits)
    else localStorage.removeItem(PHONE_KEY)
  } catch { /* armazenamento indisponível (aba privada) */ }
}

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

async function copyToClipboard(value, el) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch { /* tenta o método antigo */ }
  try {
    if (el) {
      el.focus()
      el.select()
      return document.execCommand('copy')
    }
  } catch { /* sem permissão */ }
  return false
}

function Note({ tone = 'amber', children }) {
  const t = tone === 'red'
    ? { bg: '#FEF2F2', border: '#FCA5A5', color: '#B91C1C' }
    : { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      background: t.bg, border: `1px solid ${t.border}`, color: t.color,
      borderRadius: 10, padding: '9px 12px', fontSize: 12, lineHeight: 1.45,
    }}>
      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  )
}

export default function NfDataModal({ order, onClose }) {
  // A listagem não traz CPF nem endereço do cliente — o detalhe completo vem de GET /orders/:id
  const { data: full, isLoading, isError } = useOrder(order.id)

  const [text,   setText]   = useState('')
  const [edited, setEdited] = useState(false)
  const [copied, setCopied] = useState(false)
  const [phone,  setPhone]  = useState(readPhone)
  const areaRef = useRef(null)

  const data        = useMemo(() => ({ ...order, ...(full || {}) }), [order, full])
  const generated   = useMemo(() => buildNfMessage(data), [data])
  const missing     = useMemo(() => missingNfFields(data), [data])
  const accessories = useMemo(() => orderAccessories(data), [data])
  const loadFailed  = isError && !full

  // Mantém o texto em dia com os dados, sem sobrescrever o que o usuário editou
  useEffect(() => {
    if (!edited && !isLoading) setText(generated)
  }, [generated, edited, isLoading])

  // Esc fecha
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = async () => {
    const ok = await copyToClipboard(text, areaRef.current)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Não consegui copiar. Selecione o texto e copie manualmente.')
    }
  }

  const handlePhone = (e) => {
    let d = e.target.value.replace(/\D/g, '')
    if (d.length > 11 && d.startsWith('55')) d = d.slice(2) // colou com DDI
    d = d.slice(0, 11)
    setPhone(d)
    savePhone(d)
  }

  const waUrl    = buildWhatsAppUrl(text, phone)
  const phoneBad = phone.length > 0 && !normalizeBrPhone(phone)
  const busy     = isLoading

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)', zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: 480, maxWidth: '100%', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)', animation: 'modalIn .18s ease',
        fontFamily: 'Instrument Sans, sans-serif',
      }}>

        {/* Cabeçalho */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Receipt size={18} color="#15803D" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Dados para nota fiscal</div>
            <div style={{
              fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: 'JetBrains Mono, monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{order.order_number}</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{
            background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B7280', flexShrink: 0,
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Corpo */}
        <div style={{
          padding: '14px 18px', overflowY: 'auto', flex: 1,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {busy ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '48px 0', color: '#6B7280', fontSize: 13,
            }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Buscando CPF e endereço…
            </div>
          ) : (
            <>
              {loadFailed ? (
                <Note tone="red">
                  Não consegui carregar o CPF e o endereço agora. Você pode copiar assim mesmo e completar à mão.
                </Note>
              ) : missing.length > 0 && (
                <Note>Confira no cadastro: {missing.join(', ')}.</Note>
              )}

              {accessories.length > 0 && (
                <Note>
                  Esta ordem inclui acessórios ({accessories.map((a) => `${a.name} ${brl(a.price)}`).join(', ')}).
                  O valor do texto é o total da ordem — ajuste se a nota for só do aparelho.
                </Note>
              )}

              <textarea
                ref={areaRef}
                value={text}
                onChange={(e) => { setText(e.target.value); setEdited(true) }}
                rows={Math.max(10, text.split('\n').length + 1)}
                spellCheck={false}
                autoCapitalize="off"
                aria-label="Texto para o administrativo"
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical',
                  padding: '12px 14px', borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.12)', background: '#FAFAFA', color: '#111827',
                  fontSize: 16, lineHeight: 1.5, fontFamily: 'Instrument Sans, sans-serif',
                  whiteSpace: 'pre-wrap', outline: 'none',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                  Você pode editar o texto antes de copiar ou enviar.
                </span>
                {edited && (
                  <button onClick={() => { setText(generated); setEdited(false) }} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600, color: '#6B7280', fontFamily: 'Instrument Sans, sans-serif',
                  }}>
                    <RotateCcw size={11} /> Restaurar
                  </button>
                )}
              </div>

              {/* WhatsApp do administrativo (opcional, fica salvo neste aparelho) */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 700, color: '#9CA3AF',
                  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
                }}>
                  WhatsApp do administrativo (opcional)
                </label>
                <input
                  value={formatPhone(phone)}
                  onChange={handlePhone}
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="(11) 99999-9999"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10,
                    border: `1px solid ${phoneBad ? '#FCA5A5' : 'rgba(0,0,0,0.12)'}`, background: '#fff',
                    fontSize: 16, color: '#111827', fontFamily: 'Instrument Sans, sans-serif', outline: 'none',
                  }}
                />
                <div style={{ fontSize: 11, color: phoneBad ? '#B91C1C' : '#9CA3AF', marginTop: 5 }}>
                  {phoneBad
                    ? 'Número incompleto — o WhatsApp vai abrir a lista de conversas.'
                    : phone
                      ? 'Salvo neste aparelho. O WhatsApp abre direto nessa conversa.'
                      : 'Vazio: o WhatsApp abre para você escolher a conversa.'}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ações */}
        <div style={{
          display: 'flex', gap: 10, padding: '12px 18px 16px',
          borderTop: '1px solid rgba(0,0,0,0.07)', flexShrink: 0,
        }}>
          <button onClick={handleCopy} disabled={busy} style={{
            flex: 1, padding: '12px 0', background: copied ? '#16A34A' : '#111827', color: '#fff',
            border: 'none', borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 7, fontFamily: 'Instrument Sans, sans-serif',
            opacity: busy ? 0.5 : 1, transition: 'background .2s',
          }}>
            {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={busy}
            onClick={(e) => { if (busy) e.preventDefault() }}
            style={{
              flex: 1, padding: '12px 0', background: '#128C7E', color: '#fff',
              textDecoration: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'Instrument Sans, sans-serif',
              opacity: busy ? 0.5 : 1, pointerEvents: busy ? 'none' : 'auto',
            }}>
            <MessageCircle size={15} />
            WhatsApp
          </a>
        </div>
      </div>
    </div>,
    document.body
  )
}

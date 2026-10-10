import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import {
  Search, X, Eye, ShieldCheck, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
  ArrowLeftRight, Smartphone, Info,
} from 'lucide-react'
import api from '../services/api'
import { displayCurrency, formatPhone, getInitials, getAvatarColor } from '../utils/formatters'

// ─────────────────────────────────────────────────────────────────────────────
// "Vendas com Upgrade" (aba da tela Administração — só admin)
//  • Lista as vendas em que o cliente ENTREGOU um aparelho (iPhone de entrada ou troca).
//  • Serve para achar a venda, o aparelho que o cliente deixou (modelo / IMEI) e a foto
//    do documento dele, caso apareça algum problema depois.
//  • A foto é buscada com o login do usuário e só aparece na tela — nunca há link público.
//    Cada visualização fica registrada na auditoria (o backend faz isso).
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15
const TZ = 'America/Sao_Paulo'

const C = {
  ink: '#0C0C0E', text: '#111827', muted: '#6B7280', faint: '#9CA3AF',
  line: 'rgba(0,0,0,0.07)', soft: '#F7F7F9',
  green: '#15803D', greenBg: '#DCFCE7',
  amber: '#B45309', amberBg: '#FFFBEB', amberLine: '#FDE68A', amberChip: '#FEF3C7', amberText: '#92400E',
  blue: '#1D4ED8', blueBg: '#DBEAFE',
}

const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: TZ })
const fmtTime = (d) => new Date(d).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

const STATUS_LABEL = { aberto: 'Em aberto', em_andamento: 'Em andamento' }

const specsOf = (d) => [d?.capacity, d?.color].filter(Boolean).join(' · ')

// ── Resumo (usado também no número da aba, em AdminPage) ──────────────────────
export function useUpgradeSummary() {
  return useQuery({
    queryKey: ['admin-upgrades-summary'],
    queryFn: () => api.get('/admin/upgrades/summary').then((r) => r.data.data),
    staleTime: 30_000,
  })
}

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

const blobErrorMessage = async (err) => {
  try {
    const text = await err?.response?.data?.text?.()
    const msg = JSON.parse(text)?.error
    if (msg) return msg
  } catch { /* corpo não era JSON */ }
  if (err?.response?.status === 403) return 'Você não tem permissão para visualizar este documento.'
  return 'Não foi possível carregar o documento. Tente novamente.'
}

// ── Visualizador do documento (tela cheia, com troca de foto) ────────────────
function DocumentViewer({ sale, startIndex = 0, onClose }) {
  const docs = sale.documents || []
  const [index, setIndex] = useState(startIndex)
  const [src, setSrc] = useState(null)
  const [error, setError] = useState('')
  const doc = docs[index]
  const many = docs.length > 1

  useEffect(() => {
    if (!doc) return undefined
    let url = null
    let cancelled = false
    setSrc(null)
    setError('')
    api.get(`/orders/${sale.id}/documents/${doc.id}/file`, { responseType: 'blob', timeout: 60000 })
      .then((res) => {
        if (cancelled) return
        url = URL.createObjectURL(res.data)
        setSrc(url)
      })
      .catch(async (err) => { if (!cancelled) setError(await blobErrorMessage(err)) })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [sale.id, doc?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(docs.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, docs.length])

  const navBtn = (disabled) => ({
    width: 44, height: 44, borderRadius: 12, border: 'none', cursor: disabled ? 'default' : 'pointer',
    background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: disabled ? 0.3 : 1,
  })

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Documento do cliente" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 3500, background: 'rgba(5,5,6,0.985)',
      display: 'flex', flexDirection: 'column', fontFamily: 'Instrument Sans,sans-serif',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '12px 16px', color: '#fff', flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Documento do cliente</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sale.client?.name} · <span style={{ fontFamily: 'JetBrains Mono,monospace' }}>{sale.order_number}</span>
          </div>
        </div>
        <button onClick={onClose} aria-label="Fechar" style={{
          width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><X size={18} /></button>
      </div>

      <div style={{
        flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 12, touchAction: 'pinch-zoom',
      }}>
        {src ? (
          <img src={src} alt={`Documento do cliente, foto ${index + 1}`} onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />
        ) : error ? (
          <div onClick={(e) => e.stopPropagation()} style={{ color: '#FCA5A5', fontSize: 14, textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>{error}</div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Loader2 size={16} style={{ animation: 'upg-spin 1s linear infinite' }} /> Carregando documento…
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{
        flexShrink: 0, padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        {many && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} aria-label="Foto anterior" style={navBtn(index === 0)}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, minWidth: 90, textAlign: 'center' }}>
              Foto {index + 1} de {docs.length}
            </span>
            <button onClick={() => setIndex((i) => Math.min(docs.length - 1, i + 1))} disabled={index === docs.length - 1} aria-label="Próxima foto" style={navBtn(index === docs.length - 1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          🔒 Esta visualização fica registrada no histórico de auditoria.
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Linha de aparelho dentro do cartão ───────────────────────────────────────
// Linha 1: modelo (+ etiqueta) e valor — o valor desce para a linha de baixo se faltar espaço.
// Linha 2: capacidade · cor. Linha 3: IMEI (sempre em linha própria, para ficar alinhado e fácil de conferir).
function DeviceLine({ icon: Icon, tone, model, specs, imei, tag, value, valueColor }) {
  const tones = tone === 'blue'
    ? { bg: C.blueBg, fg: C.blue }
    : { bg: C.ink, fg: '#fff' }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div aria-hidden="true" style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: tones.bg, color: tones.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '2px 10px' }}>
          <div style={{ flex: '1 1 120px', minWidth: 0, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
            {model}
            {tag && (
              <span style={{
                marginLeft: 7, padding: '1px 7px', borderRadius: 99, background: C.blueBg, color: C.blue,
                fontSize: 10.5, fontWeight: 700, verticalAlign: 'middle', whiteSpace: 'nowrap',
              }}>{tag}</span>
            )}
          </div>
          {value && (
            <div style={{
              marginLeft: 'auto', fontSize: 12.5, fontWeight: 700, color: valueColor || C.text,
              whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
            }}>{value}</div>
          )}
        </div>
        {specs && (
          <div style={{ marginTop: 2, fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>{specs}</div>
        )}
        {imei && (
          <div className="upg-imei" style={{
            marginTop: specs ? 0 : 2, fontSize: 11, color: C.muted, lineHeight: 1.5, fontFamily: 'JetBrains Mono,monospace',
          }}>IMEI {imei}</div>
        )}
      </div>
    </div>
  )
}

// ── Cartão de uma venda ──────────────────────────────────────────────────────
function UpgradeCard({ sale, docsEnabled, onViewDoc, onOpenClient }) {
  const client = sale.client || {}
  const docs = sale.documents || []
  const hasDocs = docs.length > 0
  const statusLabel = STATUS_LABEL[sale.status]
  // A seção de anexar documento, dentro da ordem, só existe quando há iPhone de entrada
  const canAttachInOrder = (sale.payment_methods || []).includes('iphone_entrada')

  return (
    <article style={{
      background: '#fff', borderRadius: 16, border: `1px solid ${C.line}`, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)', fontFamily: 'Instrument Sans,sans-serif',
    }}>
      <div style={{ padding: '14px 14px 12px' }}>
        {/* cliente + data (toque abre o cliente) */}
        <button type="button" className="upg-btn" onClick={() => onOpenClient(client.id)}
          aria-label={`Abrir cliente ${client.name}`}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: 0, margin: 0,
            background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
          }}>
          <div aria-hidden="true" style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(client.name || ''),
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
          }}>{getInitials(client.name || '')}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.name || 'Cliente'}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {client.phone ? formatPhone(client.phone) : 'Sem telefone'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fmtDate(sale.created_at)}</div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(sale.created_at)}</div>
          </div>
        </button>

        {/* aparelho vendido e aparelho(s) entregue(s) */}
        <div style={{ marginTop: 12, background: C.soft, borderRadius: 12, padding: '11px 12px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <DeviceLine
            icon={Smartphone} tone="ink"
            model={sale.device?.model || 'Aparelho vendido'}
            specs={specsOf(sale.device)}
            imei={sale.device?.imei}
            value={displayCurrency(sale.price)}
          />
          {(sale.trade_ins || []).map((t) => (
            <DeviceLine
              key={t.method}
              icon={ArrowLeftRight} tone="blue"
              model={t.model || 'Aparelho entregue (não informado)'}
              specs={specsOf(t)}
              imei={t.imei}
              tag={t.method === 'troca' ? 'Troca' : 'Entrada'}
              value={t.value > 0 ? `− ${displayCurrency(t.value)}` : null}
              valueColor={C.green}
            />
          ))}
        </div>

        {/* ordem + vendedor */}
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', fontSize: 11.5, color: C.muted }}>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', color: '#374151' }}>{sale.order_number}</span>
          {sale.seller_name && <span>Vendido por {sale.seller_name}</span>}
          {statusLabel && (
            <span style={{ padding: '1px 8px', borderRadius: 99, background: '#E5E7EB', color: '#374151', fontWeight: 600, fontSize: 10.5 }}>{statusLabel}</span>
          )}
        </div>
      </div>

      {/* documento do cliente */}
      {docsEnabled && (
        <div style={{
          borderTop: `1px solid ${hasDocs ? '#EEF0F3' : C.amberLine}`, background: hasDocs ? '#fff' : C.amberBg,
          padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            {hasDocs
              ? <ShieldCheck size={18} color={C.green} style={{ flexShrink: 0 }} />
              : <AlertTriangle size={18} color={C.amber} style={{ flexShrink: 0 }} />}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: hasDocs ? '#166534' : C.amberText }}>
                {hasDocs ? 'Documento anexado' : 'Sem documento'}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                {hasDocs
                  ? `${docs.length} foto${docs.length > 1 ? 's' : ''}`
                  : canAttachInOrder ? 'Para anexar, abra a ordem em Ordens.' : 'Nenhuma foto anexada a esta venda'}
              </div>
            </div>
          </div>
          {hasDocs && (
            <button type="button" className="upg-btn" onClick={() => onViewDoc(sale)} style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', flexShrink: 0,
              borderRadius: 11, border: 'none', cursor: 'pointer', background: C.ink, color: '#fff',
              fontFamily: 'Instrument Sans,sans-serif', fontSize: 13, fontWeight: 600,
            }}>
              <Eye size={15} /> Ver documento
            </button>
          )}
        </div>
      )}
    </article>
  )
}

// ── Painel ───────────────────────────────────────────────────────────────────
export default function UpgradeSalesPanel() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [doc, setDoc] = useState('all')          // 'all' | 'with' | 'missing'
  const [viewer, setViewer] = useState(null)     // venda aberta no visualizador
  const search = useDebounced(text.trim(), 350)

  const q = useInfiniteQuery({
    queryKey: ['admin-upgrades', { search, doc }],
    queryFn: ({ pageParam }) => api.get('/admin/upgrades', {
      params: { page: pageParam, limit: PAGE_SIZE, search: search || undefined, doc: doc === 'all' ? undefined : doc },
    }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    placeholderData: keepPreviousData,
    staleTime: 5_000,
  })

  const pages = q.data?.pages ?? []
  const sales = pages.flatMap((p) => p.data)
  const counts = pages[0]?.counts
  const total = pages[0]?.meta?.total ?? 0
  const docsEnabled = pages[0]?.meta?.documents_enabled !== false
  const filtered = Boolean(search) || doc !== 'all'
  const remaining = Math.max(0, total - sales.length)
  const clearAll = () => { setText(''); setDoc('all') }

  const tiles = [
    { k: 'all', label: 'Todas', n: counts?.total },
    { k: 'with', label: 'Com documento', n: counts?.with_document },
    { k: 'missing', label: 'Sem documento', n: counts?.missing_document, warn: true },
  ]

  return (
    <div className="upg-root" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'Instrument Sans,sans-serif', containerType: 'inline-size' }}>
      {/* busca */}
      <div style={{ position: 'relative' }}>
        <Search size={17} aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.faint, pointerEvents: 'none' }} />
        <input
          className="upg-search"
          type="text" inputMode="search" enterKeyHint="search"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Nome, IMEI ou modelo"
          aria-label="Buscar vendas com upgrade"
          style={{
            width: '100%', height: 48, boxSizing: 'border-box', padding: '0 44px 0 42px', borderRadius: 14,
            border: '1.5px solid #E5E7EB', background: '#fff', color: C.text, fontSize: 14,
            fontFamily: 'Instrument Sans,sans-serif', outline: 'none', transition: 'border-color .15s, box-shadow .15s',
          }}
        />
        {text && (
          <button type="button" className="upg-btn" onClick={() => setText('')} aria-label="Limpar busca" style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36,
            borderRadius: 10, border: 'none', background: 'transparent', color: C.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} /></button>
        )}
      </div>

      {/* filtros (também mostram os totais) */}
      {docsEnabled && (
        <div role="group" aria-label="Filtrar por documento" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {tiles.map(({ k, label, n, warn }) => {
            const on = doc === k
            const alert = warn && !on && n > 0
            return (
              <button key={k} type="button" className="upg-btn upg-tile" aria-pressed={on} onClick={() => setDoc(k)} style={{
                padding: '9px 6px 8px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0,
                fontFamily: 'Instrument Sans,sans-serif', transition: 'background .15s, border-color .15s, color .15s',
                background: on ? C.ink : alert ? C.amberBg : '#fff',
                border: `1px solid ${on ? C.ink : alert ? C.amberLine : '#E5E7EB'}`,
                color: on ? '#fff' : alert ? C.amberText : C.text,
              }}>
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                  {n ?? '–'}
                </span>
                <span className="upg-tile-label" style={{ fontSize: 11, fontWeight: 600, color: on ? 'rgba(255,255,255,0.78)' : alert ? C.amberText : C.muted, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* aviso: migration 010 ainda não rodou */}
      {!q.isLoading && !q.isError && !docsEnabled && (
        <div style={{
          display: 'flex', gap: 9, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 12,
          background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 12, lineHeight: 1.5,
        }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>O recurso de documentos do cliente ainda não foi ativado no banco de dados (migration 010). Depois de ativar, o status do documento aparece em cada venda.</span>
        </div>
      )}

      {/* quantas foram encontradas */}
      {filtered && !q.isLoading && !q.isError && (
        <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12, color: C.muted }}>
          <span>{total === 1 ? '1 venda encontrada' : `${total} vendas encontradas`}</span>
          <button type="button" className="upg-btn" onClick={clearAll} style={{
            border: 'none', background: 'none', cursor: 'pointer', color: C.text, fontWeight: 600, fontSize: 12,
            fontFamily: 'Instrument Sans,sans-serif', padding: '6px 2px', textDecoration: 'underline', textUnderlineOffset: 3,
          }}>Limpar filtros</button>
        </div>
      )}

      {/* carregando */}
      {q.isLoading && (
        <div style={{ padding: 40, textAlign: 'center', color: C.faint, fontSize: 13 }}>
          <Loader2 size={20} style={{ animation: 'upg-spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
          Carregando vendas…
        </div>
      )}

      {/* erro */}
      {q.isError && !q.data && (
        <div style={{ padding: '28px 16px', textAlign: 'center', background: '#fff', borderRadius: 16, border: `1px solid ${C.line}` }}>
          <AlertTriangle size={26} color="#DC2626" style={{ margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Não foi possível carregar as vendas.</div>
          <div style={{ fontSize: 12, color: C.muted, margin: '4px 0 14px' }}>Confira a conexão e tente de novo.</div>
          <button type="button" className="upg-btn" onClick={() => q.refetch()} style={{
            height: 40, padding: '0 18px', borderRadius: 11, border: 'none', background: C.ink, color: '#fff',
            fontFamily: 'Instrument Sans,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Tentar de novo</button>
        </div>
      )}

      {/* vazio */}
      {!q.isLoading && !q.isError && sales.length === 0 && (
        <div style={{ padding: '34px 18px', textAlign: 'center', background: '#fff', borderRadius: 16, border: `1px solid ${C.line}` }}>
          <div aria-hidden="true" style={{
            width: 44, height: 44, borderRadius: '50%', background: '#F3F4F6', color: C.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
          }}><ArrowLeftRight size={20} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
            {filtered ? 'Nenhuma venda encontrada' : 'Ainda não há vendas com upgrade'}
          </div>
          <div style={{ fontSize: 12, color: C.muted, margin: '4px auto 0', maxWidth: 300, lineHeight: 1.5 }}>
            {filtered
              ? 'Tente o nome do cliente, o IMEI do aparelho entregue ou o número da ordem.'
              : 'Vendas pagas com iPhone de entrada ou troca aparecem aqui, junto com o documento do cliente.'}
          </div>
          {filtered && (
            <button type="button" className="upg-btn" onClick={clearAll} style={{
              marginTop: 14, height: 40, padding: '0 18px', borderRadius: 11, border: '1px solid #E5E7EB',
              background: '#fff', color: C.text, fontFamily: 'Instrument Sans,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Limpar filtros</button>
          )}
        </div>
      )}

      {/* lista */}
      {sales.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          opacity: q.isPlaceholderData ? 0.55 : 1, transition: 'opacity .15s',
        }}>
          {sales.map((s) => (
            <UpgradeCard
              key={s.id} sale={s} docsEnabled={docsEnabled}
              onViewDoc={setViewer}
              onOpenClient={(id) => navigate(`/clients/${id}`)}
            />
          ))}
        </div>
      )}

      {/* ver mais */}
      {q.hasNextPage && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button type="button" className="upg-btn" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} style={{
            width: '100%', height: 46, borderRadius: 13, border: '1px solid #E5E7EB', background: '#fff', color: C.text,
            cursor: q.isFetchingNextPage ? 'default' : 'pointer', fontFamily: 'Instrument Sans,sans-serif', fontSize: 13.5, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {q.isFetchingNextPage
              ? <><Loader2 size={15} style={{ animation: 'upg-spin 1s linear infinite' }} /> Carregando…</>
              : `Ver mais vendas (${remaining})`}
          </button>
          {q.isFetchNextPageError && (
            <div style={{ fontSize: 12, color: '#B91C1C' }}>Não foi possível carregar mais. Tente de novo.</div>
          )}
        </div>
      )}

      {viewer && <DocumentViewer sale={viewer} onClose={() => setViewer(null)} />}

      <style>{`
        @keyframes upg-spin { to { transform: rotate(360deg) } }
        .upg-search:focus { border-color: ${C.ink} !important; box-shadow: 0 0 0 3px rgba(12,12,14,0.08); }
        .upg-search::placeholder { color: ${C.faint}; }
        .upg-btn:focus-visible { outline: 2px solid #0A66FF; outline-offset: 2px; border-radius: 12px; }
        @container (max-width: 340px) {
          .upg-tile { padding-left: 3px !important; padding-right: 3px !important; }
          .upg-tile-label { font-size: 10px !important; letter-spacing: -0.1px; }
        }
        @media (prefers-reduced-motion: reduce) { .upg-search, .upg-btn { transition: none !important; } }
      `}</style>
    </div>
  )
}

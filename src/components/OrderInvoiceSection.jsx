import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Receipt, Paperclip, Send, Mail, Download, ExternalLink, Trash2, Loader2,
  AlertTriangle, CheckCircle2, Info, Plus,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

// ─────────────────────────────────────────────────────────────────────────────
// "Nota fiscal" no detalhe da ordem.
//  • Você emite a nota no outro sistema, anexa o arquivo aqui (PDF, XML ou imagem)
//    e envia por e-mail ao cliente — como já é feito com o comprovante.
//  • O e-mail vai SEMPRE para o e-mail cadastrado do cliente (aparece na confirmação).
//  • Admin e gerente usam; só admin exclui (o backend também confere).
//  • Até 3 arquivos por ordem (ex.: PDF + XML), 5 MB cada, 10 MB no total.
// ─────────────────────────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo'
const fmtDateTime = (d) => new Date(d).toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' })
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

const ACCEPT = '.pdf,.xml,.jpg,.jpeg,.png,application/pdf,text/xml,application/xml,image/jpeg,image/png'
const MIME_BY_EXT = { pdf: 'application/pdf', xml: 'application/xml', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' }
const extOf = (name) => (String(name).split('.').pop() || '').toLowerCase()

const KIND = {
  'application/pdf': { label: 'PDF', bg: '#FEE2E2', fg: '#B91C1C' },
  'application/xml': { label: 'XML', bg: '#EDE9FE', fg: '#6D28D9' },
  'image/jpeg':      { label: 'IMG', bg: '#DBEAFE', fg: '#1D4ED8' },
  'image/png':       { label: 'IMG', bg: '#DBEAFE', fg: '#1D4ED8' },
}

const C = {
  ink: '#111827', muted: '#6B7280', faint: '#9CA3AF', line: '#E5E7EB',
  green: '#15803D', greenBg: '#DCFCE7', greenSoft: '#F0FDF4', greenLine: '#BBF7D0',
  amber: '#B45309', amberText: '#92400E', amberBg: '#FFFBEB', amberLine: '#FDE68A', amberChip: '#FEF3C7',
  red: '#B91C1C',
}

// mensagem amigável a partir do erro da API (aceita também resposta em Blob)
const apiMessage = async (err, fallback) => {
  if (!err?.response) return 'Sem conexão com o servidor. Confira a internet e tente de novo.'
  let body = err.response.data
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    try { body = JSON.parse(await body.text()) } catch { body = null }
  }
  const msg = body?.error || fallback
  return body?.detail ? `${msg} (${body.detail})` : msg
}

// ── Folha de confirmação (embaixo no celular, centralizada no computador) ────
function Sheet({ title, onClose, locked, children }) {
  const isMobile = useIsMobile()
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !locked) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, locked])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} onClick={() => { if (!locked) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 3400, background: 'rgba(12,12,14,0.55)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : 16, fontFamily: 'Instrument Sans,sans-serif',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, background: '#fff', boxSizing: 'border-box',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        padding: '18px 18px calc(18px + env(safe-area-inset-bottom))',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, letterSpacing: '-0.2px', marginBottom: 14 }}>{title}</div>
        {children}
      </div>
    </div>,
    document.body
  )
}

function FileTile({ mime }) {
  const k = KIND[mime] || KIND['image/png']
  return (
    <div aria-hidden="true" style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: k.bg, color: k.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.3px',
    }}>{k.label}</div>
  )
}

const btn = (kind = 'secondary', extra = {}) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, padding: '0 16px',
  borderRadius: 12, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'Instrument Sans,sans-serif',
  border: kind === 'primary' ? 'none' : `1px solid ${C.line}`,
  background: kind === 'primary' ? C.ink : '#fff', color: kind === 'primary' ? '#fff' : C.ink,
  ...extra,
})

const iconBtn = { width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#F3F4F6', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

export default function OrderInvoiceSection({ order, last = false }) {
  const { user } = useAuth()
  const canUse = user?.role === 'admin' || user?.role === 'gerente'
  const qc = useQueryClient()
  const queryKey = ['order-invoices', order.id]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    enabled: canUse,
    queryFn: () => api.get(`/orders/${order.id}/invoices`).then((r) => r.data),
    staleTime: 10_000,
  })

  const inputRef = useRef(null)
  const [picked, setPicked] = useState(null)       // arquivo escolhido, esperando confirmação
  const [sheet, setSheet] = useState(null)         // null | 'attach' | 'send' | 'resend'
  const [busy, setBusy] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [openingId, setOpeningId] = useState(null)

  if (!canUse) return null

  const files = data?.data ?? []
  const limits = data?.limits ?? { max_files: 3, max_file_bytes: 5 * 1024 * 1024, max_total_bytes: 10 * 1024 * 1024 }
  const recipient = data?.recipient ?? { name: order.client_name, email: order.client_email || null }
  const email = recipient.email
  const pending = files.filter((f) => !f.sent_at)
  const lastSent = files.filter((f) => f.sent_at).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))[0]
  const canAddMore = files.length < limits.max_files
  const refresh = () => qc.invalidateQueries({ queryKey })

  const wrapStyle = { margin: last ? '12px 20px 20px' : '12px 20px 0', fontFamily: 'Instrument Sans,sans-serif' }
  const cardStyle = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }

  // ── escolher arquivo ───────────────────────────────────────────────────────
  const onPick = (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''                      // permite escolher o mesmo arquivo de novo
    if (!f) return
    const ext = extOf(f.name)
    if (!MIME_BY_EXT[ext]) return toast.error('Formato não aceito. Envie PDF, XML, JPG ou PNG.')
    if (f.size === 0) return toast.error('O arquivo está vazio.')
    if (f.size > limits.max_file_bytes) return toast.error(`Arquivo muito grande (${fmtSize(f.size)}). O máximo é ${fmtSize(limits.max_file_bytes)}.`)
    if (files.length >= limits.max_files) return toast.error(`Esta ordem já tem ${limits.max_files} arquivos. Exclua um para anexar outro.`)
    if (files.reduce((s, x) => s + x.size_bytes, 0) + f.size > limits.max_total_bytes) return toast.error(`O total de anexos passaria de ${fmtSize(limits.max_total_bytes)}.`)
    setPicked(f)
    setSheet('attach')
  }

  const closeSheet = () => { if (busy) return; setSheet(null); setPicked(null) }

  // ── anexar (e, se quiser, já enviar) ───────────────────────────────────────
  const doAttach = async (alsoSend) => {
    if (!picked || busy) return
    setBusy(true)
    let attached = false
    try {
      await api.post(`/orders/${order.id}/invoices`, picked, {
        params: { filename: picked.name },
        headers: { 'Content-Type': MIME_BY_EXT[extOf(picked.name)] },
        timeout: 120000,
      })
      attached = true
      if (alsoSend) {
        await api.post(`/orders/${order.id}/invoices/send`, {}, { timeout: 60000 })
        toast.success(`Nota fiscal anexada e enviada para ${email}`)
      } else {
        toast.success('Nota fiscal anexada.')
      }
      setSheet(null); setPicked(null)
    } catch (err) {
      const msg = await apiMessage(err, alsoSend && attached ? 'Não foi possível enviar o e-mail.' : 'Não foi possível anexar o arquivo.')
      if (attached) {
        toast.error(`Arquivo anexado, mas o envio falhou: ${msg}`, { duration: 7000 })
        setSheet(null); setPicked(null)
      } else {
        toast.error(msg, { duration: 6000 })
      }
    } finally {
      setBusy(false)
      refresh()
    }
  }

  // ── enviar / reenviar ──────────────────────────────────────────────────────
  const doSend = async (all) => {
    if (busy) return
    setBusy(true)
    try {
      const { data: res } = await api.post(`/orders/${order.id}/invoices/send`, all ? { all: true } : {}, { timeout: 60000 })
      toast.success(`Nota fiscal enviada para ${res?.data?.to || email}`)
      setSheet(null)
    } catch (err) {
      toast.error(await apiMessage(err, 'Não foi possível enviar o e-mail.'), { duration: 7000 })
    } finally {
      setBusy(false)
      refresh()
    }
  }

  // ── abrir (PDF/imagem numa nova aba; XML é baixado) ────────────────────────
  const openFile = async (f) => {
    if (openingId) return
    const isXml = f.mime_type === 'application/xml'
    const tab = isXml ? null : window.open('', '_blank')      // abre a aba já no toque (o celular bloqueia depois)
    setOpeningId(f.id)
    try {
      const res = await api.get(`/orders/${order.id}/invoices/${f.id}/file`, { responseType: 'blob', timeout: 60000 })
      const url = URL.createObjectURL(new Blob([res.data], { type: isXml ? 'application/octet-stream' : f.mime_type }))
      if (tab) {
        tab.location.href = url
      } else {
        const a = document.createElement('a')
        a.href = url; a.download = f.filename
        document.body.appendChild(a); a.click(); a.remove()
      }
      setTimeout(() => URL.revokeObjectURL(url), 120000)
    } catch (err) {
      if (tab) tab.close()
      toast.error(await apiMessage(err, 'Não foi possível abrir o arquivo.'))
    } finally {
      setOpeningId(null)
    }
  }

  // ── excluir (admin) ────────────────────────────────────────────────────────
  const doDelete = async (id) => {
    if (busy) return
    setBusy(true)
    try {
      await api.delete(`/orders/${order.id}/invoices/${id}`)
      toast.success('Arquivo excluído.')
      setConfirmDeleteId(null)
    } catch (err) {
      toast.error(await apiMessage(err, 'Não foi possível excluir o arquivo.'))
    } finally {
      setBusy(false)
      refresh()
    }
  }

  // ── cabeçalho ──────────────────────────────────────────────────────────────
  let chip = null
  let subtitle = 'Anexe o arquivo emitido no outro sistema e envie ao cliente.'
  if (files.length > 0) {
    if (pending.length === 0 && lastSent) {
      chip = { text: 'Enviada', bg: C.greenBg, fg: C.green }
      subtitle = `Enviada em ${fmtDateTime(lastSent.sent_at)} para ${lastSent.sent_to}`
    } else if (lastSent) {
      chip = { text: 'Falta enviar', bg: C.amberChip, fg: C.amberText }
      subtitle = `${pending.length === 1 ? '1 arquivo novo' : `${pending.length} arquivos novos`} ainda não enviado${pending.length === 1 ? '' : 's'}`
    } else {
      chip = { text: 'Não enviada', bg: C.amberChip, fg: C.amberText }
      subtitle = 'Ainda não enviada ao cliente.'
    }
  }

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px' }}>
      <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 10, background: C.greenBg, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Receipt size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Nota fiscal</span>
          {chip && <span style={{ padding: '2px 9px', borderRadius: 99, background: chip.bg, color: chip.fg, fontSize: 10.5, fontWeight: 700 }}>{chip.text}</span>}
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2, lineHeight: 1.4, wordBreak: 'break-word' }}>{subtitle}</div>
      </div>
    </div>
  )

  // ── carregando / erro / recurso ainda não ativado ──────────────────────────
  if (isLoading) {
    return (
      <section style={wrapStyle}><div style={cardStyle}>
        {header}
        <div style={{ padding: '4px 14px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.faint }}>
          <Loader2 size={14} style={{ animation: 'oin-spin 1s linear infinite' }} /> Carregando…
        </div>
      </div><style>{`@keyframes oin-spin { to { transform: rotate(360deg) } }`}</style></section>
    )
  }
  if (isError) {
    return (
      <section style={wrapStyle}><div style={cardStyle}>
        {header}
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 12.5, color: C.red, lineHeight: 1.45 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error?.response?.data?.error || 'Não foi possível carregar a nota fiscal desta ordem.'}</span>
          </div>
          <button type="button" onClick={() => refetch()} style={btn('secondary', { height: 40, marginTop: 10 })}>Tentar de novo</button>
        </div>
      </div></section>
    )
  }
  if (data && data.enabled === false) {
    return (
      <section style={wrapStyle}><div style={cardStyle}>
        {header}
        <div style={{ margin: '0 14px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 12, lineHeight: 1.5 }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>O recurso de nota fiscal ainda não foi ativado no banco de dados (migration 011). Avise o administrador.</span>
        </div>
      </div></section>
    )
  }

  // ── conteúdo ───────────────────────────────────────────────────────────────
  return (
    <section style={wrapStyle}>
      <div style={cardStyle}>
        {header}

        {/* arquivos */}
        {files.map((f) => (
          <div key={f.id} style={{ borderTop: `1px solid ${C.line}`, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
            <FileTile mime={f.mime_type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span>{fmtSize(f.size_bytes)}</span>
                {f.sent_at
                  ? <span title={`Enviado em ${fmtDateTime(f.sent_at)} para ${f.sent_to}`} style={{ color: C.green, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={11} /> Enviado</span>
                  : <span style={{ color: C.amber, fontWeight: 600 }}>Não enviado</span>}
              </div>
            </div>

            {confirmDeleteId === f.id ? (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => doDelete(f.id)} disabled={busy} style={{ ...btn('secondary', { height: 38, padding: '0 12px', fontSize: 12.5, color: C.red, borderColor: '#FCA5A5' }), opacity: busy ? 0.6 : 1 }}>
                  {busy ? <Loader2 size={13} style={{ animation: 'oin-spin 1s linear infinite' }} /> : 'Excluir'}
                </button>
                <button type="button" onClick={() => setConfirmDeleteId(null)} disabled={busy} style={btn('secondary', { height: 38, padding: '0 12px', fontSize: 12.5 })}>Não</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => openFile(f)} disabled={openingId === f.id}
                  aria-label={f.mime_type === 'application/xml' ? `Baixar ${f.filename}` : `Abrir ${f.filename}`} style={{ ...iconBtn, opacity: openingId === f.id ? 0.6 : 1 }}>
                  {openingId === f.id
                    ? <Loader2 size={15} style={{ animation: 'oin-spin 1s linear infinite' }} />
                    : f.mime_type === 'application/xml' ? <Download size={15} /> : <ExternalLink size={15} />}
                </button>
                {data?.can_delete && (
                  <button type="button" onClick={() => setConfirmDeleteId(f.id)} aria-label={`Excluir ${f.filename}`} style={{ ...iconBtn, background: '#FEF2F2', color: C.red }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* aviso: cliente sem e-mail */}
        {!email && (
          <div style={{ margin: files.length ? '0 14px 12px' : '0 14px 12px', display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, background: C.amberBg, border: `1px solid ${C.amberLine}`, color: C.amberText, fontSize: 12, lineHeight: 1.5 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Este cliente não tem e-mail cadastrado. Dá para anexar o arquivo, mas o envio só funciona depois de cadastrar o e-mail em Clientes.</span>
          </div>
        )}

        {/* ações */}
        <div style={{ borderTop: files.length ? `1px solid ${C.line}` : 'none', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {email && pending.length > 0 && (
            <div style={{ fontSize: 11.5, color: C.muted, display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}>
              <Mail size={12} style={{ flexShrink: 0 }} /> Destinatário: <strong style={{ color: C.ink, fontWeight: 600 }}>{email}</strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {files.length === 0 && (
              <button type="button" onClick={() => inputRef.current?.click()} style={btn('primary', { flex: '1 1 200px' })}>
                <Paperclip size={15} /> Anexar nota fiscal
              </button>
            )}
            {files.length > 0 && pending.length > 0 && (
              <button type="button" disabled={!email} onClick={() => setSheet('send')}
                style={btn('primary', { flex: '1 1 170px', opacity: email ? 1 : 0.45, cursor: email ? 'pointer' : 'not-allowed' })}>
                <Send size={15} /> Enviar ao cliente
              </button>
            )}
            {files.length > 0 && pending.length === 0 && (
              <button type="button" disabled={!email} onClick={() => setSheet('resend')}
                style={btn('secondary', { flex: '1 1 170px', opacity: email ? 1 : 0.45, cursor: email ? 'pointer' : 'not-allowed' })}>
                <Send size={15} /> Reenviar ao cliente
              </button>
            )}
            {files.length > 0 && canAddMore && (
              <button type="button" onClick={() => inputRef.current?.click()} style={btn('secondary', { flex: '1 1 150px' })}>
                <Plus size={15} /> Anexar outro arquivo
              </button>
            )}
          </div>
          {files.length > 0 && !canAddMore && (
            <div style={{ fontSize: 11, color: C.faint }}>Limite de {limits.max_files} arquivos por ordem.</div>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} style={{ display: 'none' }} aria-label="Escolher arquivo da nota fiscal" />

      {/* confirmação: anexar */}
      {sheet === 'attach' && picked && (
        <Sheet title="Anexar nota fiscal" onClose={closeSheet} locked={busy}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 12, borderRadius: 12, background: '#F7F7F9' }}>
            <FileTile mime={MIME_BY_EXT[extOf(picked.name)]} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, wordBreak: 'break-all' }}>{picked.name}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{fmtSize(picked.size)}</div>
            </div>
          </div>
          <RecipientLine email={email} name={recipient.name} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <button type="button" disabled={!email || busy} onClick={() => doAttach(true)}
              style={btn('primary', { opacity: !email || busy ? 0.5 : 1, cursor: !email || busy ? 'not-allowed' : 'pointer' })}>
              {busy ? <><Loader2 size={15} style={{ animation: 'oin-spin 1s linear infinite' }} /> Enviando…</> : <><Send size={15} /> Anexar e enviar ao cliente</>}
            </button>
            <button type="button" disabled={busy} onClick={() => doAttach(false)} style={btn('secondary', { opacity: busy ? 0.5 : 1 })}>Só anexar (enviar depois)</button>
            <button type="button" disabled={busy} onClick={closeSheet} style={btn('secondary', { border: 'none', color: C.muted, height: 40 })}>Cancelar</button>
          </div>
        </Sheet>
      )}

      {/* confirmação: enviar / reenviar */}
      {(sheet === 'send' || sheet === 'resend') && (() => {
        const toSend = sheet === 'resend' ? files : pending
        return (
          <Sheet title={sheet === 'resend' ? 'Reenviar nota fiscal?' : 'Enviar nota fiscal ao cliente?'} onClose={closeSheet} locked={busy}>
            <RecipientLine email={email} name={recipient.name} />
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {toSend.map((f) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, background: '#F7F7F9' }}>
                  <FileTile mime={f.mime_type} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, wordBreak: 'break-all' }}>{f.filename}</div>
                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{fmtSize(f.size_bytes)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <button type="button" disabled={busy} onClick={() => doSend(sheet === 'resend')} style={btn('primary', { opacity: busy ? 0.6 : 1, cursor: busy ? 'not-allowed' : 'pointer' })}>
                {busy ? <><Loader2 size={15} style={{ animation: 'oin-spin 1s linear infinite' }} /> Enviando…</> : <><Send size={15} /> Enviar agora</>}
              </button>
              <button type="button" disabled={busy} onClick={closeSheet} style={btn('secondary', { border: 'none', color: C.muted, height: 40 })}>Cancelar</button>
            </div>
          </Sheet>
        )
      })()}

      <style>{`@keyframes oin-spin { to { transform: rotate(360deg) } }`}</style>
    </section>
  )
}

function RecipientLine({ email, name }) {
  return (
    <div style={{ marginTop: 12, display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.45 }}>
      {email
        ? <>
            <Mail size={16} style={{ flexShrink: 0, marginTop: 2, color: C.muted }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: C.muted }}>Será enviada para</div>
              <div style={{ fontWeight: 700, color: C.ink, wordBreak: 'break-all' }}>{email}</div>
              {name && <div style={{ fontSize: 11.5, color: C.muted }}>{name}</div>}
            </div>
          </>
        : <>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2, color: C.amber }} />
            <div style={{ color: C.amberText }}>Este cliente não tem e-mail cadastrado — só dá para anexar o arquivo.</div>
          </>}
    </div>
  )
}

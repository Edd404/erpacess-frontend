import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ShieldCheck, AlertTriangle, Eye, Trash2, X, Loader2, Lock, Plus,
} from 'lucide-react'
import api from '../services/api'
import ClientDocumentUpload from './ClientDocumentUpload'

// ─────────────────────────────────────────────────────────────────────────────
// "Documento do cliente" no detalhe da ordem.
//  • Todos os perfis veem o STATUS (anexado / pendente) e podem anexar a foto.
//  • Só admin e gerente VISUALIZAM; só admin EXCLUI (o backend também confere).
//  • A imagem é buscada com o login do usuário e exibida só na tela (nunca há link público).
//  • Ordens que não exigem documento e não têm foto: a seção nem aparece.
// ─────────────────────────────────────────────────────────────────────────────

const fmtDateTime = (d) =>
  new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })

const blobErrorMessage = async (err) => {
  try {
    const text = await err?.response?.data?.text?.()
    const msg = JSON.parse(text)?.error
    if (msg) return msg
  } catch { /* corpo não era JSON */ }
  if (err?.response?.status === 403) return 'Você não tem permissão para visualizar este documento.'
  return 'Não foi possível carregar o documento. Tente novamente.'
}

function DocumentViewer({ orderId, docId, title, onClose }) {
  const [src, setSrc] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let url = null
    let cancelled = false
    api.get(`/orders/${orderId}/documents/${docId}/file`, { responseType: 'blob', timeout: 60000 })
      .then((res) => {
        if (cancelled) return
        url = URL.createObjectURL(res.data)
        setSrc(url)
      })
      .catch(async (err) => { if (!cancelled) setError(await blobErrorMessage(err)) })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [orderId, docId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 3500, background: 'rgba(0,0,0,0.94)',
      display: 'flex', flexDirection: 'column', fontFamily: 'Instrument Sans,sans-serif',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '12px 16px', color: '#fff', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Documento do cliente</div>
          {title && <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>{title}</div>}
        </div>
        <button onClick={onClose} aria-label="Fechar" style={{
          width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><X size={18} /></button>
      </div>

      <div style={{
        flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 12, touchAction: 'pinch-zoom',
      }}>
        {src ? (
          <img src={src} alt="Documento do cliente" onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />
        ) : error ? (
          <div onClick={(e) => e.stopPropagation()} style={{ color: '#FCA5A5', fontSize: 14, textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>{error}</div>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando documento…
          </div>
        )}
      </div>

      <div style={{ padding: '8px 16px 14px', fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', flexShrink: 0 }}>
        🔒 Esta visualização fica registrada no histórico de auditoria.
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>,
    document.body
  )
}

export default function ClientDocumentSection({ order }) {
  const qc = useQueryClient()
  const queryKey = ['order-documents', order.id]
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => api.get(`/orders/${order.id}/documents`).then((r) => r.data),
    staleTime: 10_000,
  })

  const [viewId, setViewId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [adding, setAdding] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [pendingDoc, setPendingDoc] = useState(null)

  if (isLoading || isError || !data) return null
  const docs = data.data || []
  const { required, max = 3, can_view: canView, can_delete: canDelete } = data
  if (!required && docs.length === 0) return null   // venda comum: nada a mostrar

  const missing = required && docs.length === 0
  const showUploader = (missing || adding) && docs.length < max

  const refresh = () => qc.invalidateQueries({ queryKey })

  const attach = async (doc) => {
    setAttaching(true)
    try {
      await api.post(`/orders/${order.id}/documents`, { document_ids: [doc.id] })
      toast.success('Documento anexado à ordem.')
      setPendingDoc(null); setAdding(false)
      await refresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Não foi possível anexar o documento.')
      setPendingDoc(null)
      api.delete(`/order-documents/${doc.id}`).catch(() => {})   // não deixa foto órfã
    } finally {
      setAttaching(false)
    }
  }

  const removeDoc = async (docId) => {
    setDeleting(true)
    try {
      await api.delete(`/orders/${order.id}/documents/${docId}`)
      toast.success('Documento excluído.')
      setConfirmId(null)
      await refresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Não foi possível excluir o documento.')
    } finally {
      setDeleting(false)
    }
  }

  const chip = (bg, color, text) => (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', padding: '3px 8px', borderRadius: 99, background: bg, color }}>{text}</span>
  )
  const smallBtn = (extra = {}) => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 9, cursor: 'pointer',
    fontSize: 12, fontWeight: 600, fontFamily: 'Instrument Sans,sans-serif', background: '#fff',
    border: '1px solid #E5E7EB', color: '#111827', ...extra,
  })

  return (
    <section style={{ margin: '12px 20px 0' }}>
      <div style={{
        border: `1px solid ${missing ? '#FDE68A' : '#E5E7EB'}`, background: missing ? '#FFFBEB' : '#F9FAFB',
        borderRadius: 14, overflow: 'hidden', fontFamily: 'Instrument Sans,sans-serif',
      }}>
        {/* cabeçalho */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {missing ? <AlertTriangle size={15} color="#B45309" /> : <ShieldCheck size={15} color="#15803D" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Documento do cliente</span>
          </div>
          {missing
            ? chip('#FEF3C7', '#92400E', 'PENDENTE')
            : chip('#DCFCE7', '#166534', `${docs.length} FOTO${docs.length > 1 ? 'S' : ''}`)}
        </div>

        {missing && (
          <div style={{ padding: '0 14px 12px', fontSize: 12, color: '#92400E', lineHeight: 1.45 }}>
            Esta venda tem iPhone de entrada ou troca e ainda não tem a foto do documento do cliente. Anexe agora.
          </div>
        )}

        {/* fotos já anexadas */}
        {docs.map((d, i) => (
          <div key={d.id} style={{
            padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Foto {i + 1}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fmtDateTime(d.created_at)}{d.uploaded_by_name ? ` · ${d.uploaded_by_name}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {canView && (
                <button onClick={() => setViewId(d.id)} style={smallBtn()} aria-label={`Ver foto ${i + 1}`}>
                  <Eye size={13} /> Ver
                </button>
              )}
              {canDelete && (confirmId === d.id ? (
                <>
                  <button onClick={() => removeDoc(d.id)} disabled={deleting}
                    style={smallBtn({ background: '#DC2626', color: '#fff', borderColor: '#DC2626' })}>
                    {deleting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />} Confirmar
                  </button>
                  <button onClick={() => setConfirmId(null)} disabled={deleting} style={smallBtn()}>Cancelar</button>
                </>
              ) : (
                <button onClick={() => setConfirmId(d.id)} style={smallBtn({ color: '#DC2626' })} aria-label={`Excluir foto ${i + 1}`}>
                  <Trash2 size={13} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {docs.length > 0 && !canView && (
          <div style={{
            padding: '9px 14px', borderTop: '1px solid #E5E7EB', background: '#fff',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280',
          }}>
            <Lock size={11} /> Somente administrador e gerente podem visualizar.
          </div>
        )}

        {/* anexar */}
        {attaching ? (
          <div style={{ padding: '14px', borderTop: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#111827' }}>
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Anexando à ordem…
          </div>
        ) : showUploader ? (
          <div style={{ padding: 14, borderTop: docs.length || missing ? '1px solid ' + (missing ? '#FDE68A' : '#E5E7EB') : 'none', background: '#fff' }}>
            <ClientDocumentUpload
              bare
              id={`client-document-field-${order.id}`}
              value={pendingDoc}
              onChange={(v) => { setPendingDoc(v); if (v?.id) attach(v) }}
            />
            {!missing && (
              <button onClick={() => setAdding(false)} style={{ ...smallBtn(), marginTop: 10, border: 'none', background: 'transparent', color: '#6B7280' }}>
                Cancelar
              </button>
            )}
          </div>
        ) : docs.length < max ? (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#fff' }}>
            <button onClick={() => setAdding(true)} style={smallBtn()}>
              <Plus size={13} /> Adicionar outra foto (ex.: verso)
            </button>
          </div>
        ) : null}
      </div>

      {viewId && (
        <DocumentViewer orderId={order.id} docId={viewId} title={order.order_number} onClose={() => setViewId(null)} />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </section>
  )
}

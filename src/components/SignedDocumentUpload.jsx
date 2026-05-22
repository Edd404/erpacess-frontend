/**
 * SignedDocumentUpload.jsx  (FRONTEND)
 * Upload do documento assinado direto para Cloudinary.
 *
 * FLUXO GARANTIDO:
 * 1. Comprime imagem client-side (1200px / JPEG 75%)
 * 2. Envia para Cloudinary via XHR com progress
 * 3. Salva url + public_id no backend (PostgreSQL)
 * 4. Só atualiza o state local APÓS confirmação do backend
 * 5. Se backend falhar → avisa o usuário, NÃO atualiza state
 *    (evita mostrar doc que não foi salvo no banco)
 *
 * PERSISTÊNCIA:
 * - signed_document_url  → URL permanente (Cloudinary não expira uploads públicos)
 * - signed_document_public_id → backup para reconstruir URL se necessário
 * - Ambos salvos em service_orders via PATCH /orders/:id/document
 */

import { useState, useRef } from 'react'
import { Camera, Trash2, ExternalLink, Loader2, FileImage, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    || ''
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

// ── Compressão client-side via Canvas ────────────────────────
const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const MAX_PX  = 1200
    const QUALITY = 0.75
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else                { width  = Math.round(width  * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Falha na compressão')); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg', QUALITY
      )
    }
    img.onerror = () => reject(new Error('Imagem inválida'))
    img.src = URL.createObjectURL(file)
  })

// ── Upload para Cloudinary via XHR (com progresso) ───────────
const uploadToCloudinary = ({ file, folder, publicId, onProgress }) =>
  new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(new Error('Cloudinary não configurado. Verifique VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.'))
      return
    }

    const fd = new FormData()
    fd.append('file',          file)
    fd.append('upload_preset', UPLOAD_PRESET)
    fd.append('folder',        folder)
    fd.append('public_id',     publicId)

    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90)) // até 90% no upload
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status === 200 && res.secure_url) {
          onProgress(100)
          resolve({ url: res.secure_url, public_id: res.public_id })
        } else {
          reject(new Error(res.error?.message || `Cloudinary retornou status ${xhr.status}`))
        }
      } catch {
        reject(new Error('Resposta inválida do Cloudinary'))
      }
    }
    xhr.onerror   = () => reject(new Error('Sem conexão — verifique sua internet'))
    xhr.ontimeout = () => reject(new Error('Timeout — tente novamente'))
    xhr.timeout   = 60000 // 60s
    xhr.open('POST', UPLOAD_URL)
    xhr.send(fd)
  })

// ── Modal de confirmação de remoção ──────────────────────────
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn .18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: 20,
          padding: '28px 24px 20px', width: '100%', maxWidth: 340,
          boxShadow: '0 32px 80px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(0,0,0,0.08)',
          animation: 'modalIn .2s cubic-bezier(.34,1.56,.64,1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          fontFamily: 'Instrument Sans, sans-serif',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,59,48,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={24} style={{ color: '#FF3B30' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.3px', marginBottom: 6 }}>
            Remover documento?
          </div>
          <div style={{ fontSize: 13, color: '#6E6E73', lineHeight: 1.5 }}>
            O documento será removido desta ordem. Esta ação não pode ser desfeita.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
          <button onClick={onConfirm} style={{
            width: '100%', padding: '13px 0',
            background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Instrument Sans, sans-serif', transition: 'opacity .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Remover
          </button>
          <button onClick={onCancel} style={{
            width: '100%', padding: '13px 0',
            background: 'rgba(0,0,0,0.05)', color: '#1D1D1F', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Instrument Sans, sans-serif', transition: 'opacity .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Cancelar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes modalIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function SignedDocumentUpload({ orderId, orderNumber, existingUrl, onSaved }) {
  const [url,         setUrl]         = useState(existingUrl || null)
  const [uploading,   setUploading]   = useState(false)
  const [progress,    setProgress]    = useState(0)
  const [removing,    setRemoving]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error,       setError]       = useState(null)
  const fileRef = useRef(null)

  // ── Upload ────────────────────────────────────────────────
  const upload = async (file) => {
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 15MB.'); return }

    setUploading(true)
    setProgress(0)
    setError(null)

    let cloudResult = null

    try {
      // 1. Comprime
      const compressed = await compressImage(file)

      // 2. Sobe para o Cloudinary
      const safeId   = String(orderNumber || orderId).replace(/[^a-zA-Z0-9_-]/g, '-')
      const publicId = `${safeId}_${Date.now()}`

      cloudResult = await uploadToCloudinary({
        file:      compressed,
        folder:    'istore/documentos',
        publicId,
        onProgress: setProgress,
      })

      // 3. Salva no banco via backend
      // SÓ atualiza o state se o backend confirmar — garante persistência
      await api.patch(`/orders/${orderId}/document`, {
        url:       cloudResult.url,
        public_id: cloudResult.public_id,
      })

      // 4. Sucesso total — atualiza UI
      setUrl(cloudResult.url)
      onSaved?.(cloudResult.url)
      toast.success('Documento anexado com sucesso!')

    } catch (err) {
      console.error('[SignedDocumentUpload] Erro:', err)

      if (cloudResult) {
        // Chegou no Cloudinary mas não salvou no banco
        setError('Enviado ao servidor de imagens, mas não foi salvo no sistema. Tente novamente ou contate o suporte.')
        toast.error('Erro ao salvar no sistema. O documento pode não persistir.', { duration: 8000 })
      } else {
        // Falhou antes ou durante o upload
        setError(err.message || 'Erro ao enviar. Tente novamente.')
        toast.error(err.message || 'Erro ao enviar. Tente novamente.')
      }
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Remover ───────────────────────────────────────────────
  const confirmRemove = async () => {
    setShowConfirm(false)
    setRemoving(true)
    try {
      await api.delete(`/orders/${orderId}/document`)
      setUrl(null)
      onSaved?.(null)
      toast.success('Documento removido.')
    } catch {
      toast.error('Erro ao remover. Tente novamente.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => upload(e.target.files?.[0])}
      />

      {/* ── Erro de sincronização ── */}
      {error && (
        <div style={{
          marginTop: 8, padding: '10px 12px',
          background: 'rgba(255,59,48,0.07)',
          border: '1px solid rgba(255,59,48,0.2)',
          borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={13} style={{ color: '#FF3B30', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 12, color: '#FF3B30', fontWeight: 600, marginBottom: 2 }}>
              Erro ao salvar documento
            </p>
            <p style={{ fontSize: 11, color: '#6E6E73', lineHeight: 1.5 }}>{error}</p>
          </div>
        </div>
      )}

      {/* ── COM documento ── */}
      {url && (
        <div style={{
          border: '1.5px solid rgba(52,199,89,0.3)',
          borderRadius: 12, overflow: 'hidden',
          background: 'rgba(52,199,89,0.04)',
          marginTop: 10,
        }}>
          {/* Thumbnail */}
          <div
            onClick={() => window.open(url, '_blank')}
            style={{
              position: 'relative', width: '100%',
              aspectRatio: '16/9', cursor: 'pointer',
              background: '#000', overflow: 'hidden',
            }}
          >
            <img
              src={url}
              alt="Documento assinado"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 }}
              onError={(e) => {
                // Imagem não carregou — mostra placeholder mas mantém URL no state
                e.currentTarget.style.display = 'none'
              }}
            />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
              transition: 'background .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
            />
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(52,199,89,0.9)',
              backdropFilter: 'blur(6px)',
              borderRadius: 20, padding: '3px 10px',
              fontSize: 10, fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <FileImage size={9} /> Documento anexado
            </div>
          </div>

          {/* Ações */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 12px',
            borderTop: '1px solid rgba(52,199,89,0.15)',
          }}>
            <button onClick={() => window.open(url, '_blank')} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', background: 'rgba(52,199,89,0.10)', color: '#34C759',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif',
            }}>
              <ExternalLink size={12} /> Ver em tela cheia
            </button>

            <button onClick={() => { setError(null); fileRef.current?.click() }} disabled={uploading} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', background: 'rgba(10,102,255,0.08)', color: '#0A66FF',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: uploading ? 'default' : 'pointer', fontFamily: 'Instrument Sans, sans-serif',
            }}>
              <Camera size={12} /> Substituir
            </button>

            <button onClick={() => setShowConfirm(true)} disabled={removing} style={{
              padding: '8px 12px', background: 'rgba(255,59,48,0.08)', color: '#FF3B30',
              border: 'none', borderRadius: 8, cursor: removing ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {removing
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Trash2 size={13} />}
            </button>
          </div>
        </div>
      )}

      {/* ── SEM documento ── */}
      {!url && (
        <button
          onClick={() => { setError(null); fileRef.current?.click() }}
          disabled={uploading}
          style={{
            width: '100%', marginTop: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 0',
            background: uploading ? 'rgba(255,159,10,0.08)' : 'rgba(10,102,255,0.07)',
            border: `1.5px dashed ${uploading ? '#FF9F0A' : '#0A66FF'}`,
            borderRadius: 10, cursor: uploading ? 'default' : 'pointer',
            fontFamily: 'Instrument Sans, sans-serif', transition: 'all .2s',
          }}
          onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = 'rgba(10,102,255,0.12)' }}
          onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = 'rgba(10,102,255,0.07)' }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%', padding: '4px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} style={{ color: '#FF9F0A', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FF9F0A' }}>Enviando… {progress}%</span>
              </div>
              <div style={{ width: '80%', height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#FF9F0A', borderRadius: 2, width: `${progress}%`, transition: 'width .2s' }} />
              </div>
            </div>
          ) : (
            <>
              <Camera size={16} style={{ color: '#0A66FF', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0A66FF' }}>
                Anexar documento assinado
              </span>
            </>
          )}
        </button>
      )}

      {showConfirm && (
        <ConfirmModal
          onConfirm={confirmRemove}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

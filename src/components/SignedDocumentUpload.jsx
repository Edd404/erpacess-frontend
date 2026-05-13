/**
 * SignedDocumentUpload.jsx
 * Upload do documento assinado direto para Cloudinary.
 * - Nome do arquivo = número da OS (simples, sem pastas)
 * - Thumbnail persistente após upload
 * - Botão evidente mesmo após anexar
 */

import { useState, useRef } from 'react'
import { Camera, Trash2, ExternalLink, Loader2, FileImage } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    || ''
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`


// ── Compressão client-side via Canvas ────────────────────────
// Reduz para no máximo 1200px e qualidade 0.75 → ~200-400KB
const compressImage = (file) =>
  new Promise((resolve) => {
    const MAX_PX  = 1200   // largura/altura máxima
    const QUALITY = 0.75   // 0 = menor, 1 = original

    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // Redimensiona mantendo proporção
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else                 { width  = Math.round(width  * MAX_PX / height); height = MAX_PX }
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        QUALITY
      )
    }
    img.src = URL.createObjectURL(file)
  })

export default function SignedDocumentUpload({ orderId, orderNumber, existingUrl, onSaved }) {
  const [url,       setUrl]       = useState(existingUrl || null)
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [removing,  setRemoving]  = useState(false)
  const fileRef = useRef(null)

  // ── Upload ──────────────────────────────────────────────────
  const upload = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB.'); return }

    setUploading(true)
    setProgress(0)

    try {
      // Comprime antes de enviar — reduz de ~5MB para ~300KB
      const compressed = await compressImage(file)

      const fd = new FormData()
      fd.append('file',          compressed)
      fd.append('upload_preset', UPLOAD_PRESET)
      // Nome simples = número da OS, sem barras
      fd.append('public_id',     String(orderNumber || orderId).replace(/[^a-zA-Z0-9_-]/g, '-'))

      const cloudUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
          const res = JSON.parse(xhr.responseText)
          if (xhr.status === 200) resolve(res.secure_url)
          else reject(new Error(res.error?.message || 'Falha no upload'))
        }
        xhr.onerror = () => reject(new Error('Erro de rede'))
        xhr.open('POST', UPLOAD_URL)
        xhr.send(fd)
      })

      // Salva URL no backend
      await api.patch(`/orders/${orderId}/document`, {
        url:       cloudUrl,
        public_id: String(orderNumber || orderId).replace(/[^a-zA-Z0-9_-]/g, '-'),
      })

      setUrl(cloudUrl)
      onSaved?.(cloudUrl)
      toast.success('Documento anexado!')
    } catch (err) {
      console.error('[Upload]', err)
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Remover ─────────────────────────────────────────────────
  const remove = async () => {
    if (!window.confirm('Remover o documento desta ordem?')) return
    setRemoving(true)
    try {
      await api.delete(`/orders/${orderId}/document`)
      setUrl(null)
      onSaved?.(null)
      toast.success('Documento removido.')
    } catch {
      toast.error('Erro ao remover.')
    } finally {
      setRemoving(false)
    }
  }

  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 10 }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => upload(e.target.files?.[0])}
      />

      {/* ── COM documento anexado ── */}
      {url && (
        <div style={{
          border: '1.5px solid rgba(52,199,89,0.3)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'rgba(52,199,89,0.04)',
        }}>
          {/* Thumbnail */}
          <div
            onClick={() => window.open(url, '_blank')}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              cursor: 'pointer',
              background: '#000',
              overflow: 'hidden',
            }}
          >
            <img
              src={url}
              alt="Documento assinado"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 }}
            />
            {/* Overlay com ícone de abrir */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
            >
              <ExternalLink size={22} color="#fff" style={{ opacity: 0, transition: 'opacity .2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              />
            </div>
            {/* Badge "Documento anexado" */}
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
            <button
              onClick={() => window.open(url, '_blank')}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', background: 'rgba(52,199,89,0.10)', color: '#34C759',
                border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              <ExternalLink size={12} /> Ver em tela cheia
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', background: 'rgba(10,102,255,0.08)', color: '#0A66FF',
                border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              <Camera size={12} /> Substituir
            </button>

            <button
              onClick={remove}
              disabled={removing}
              style={{
                padding: '8px 12px', background: 'rgba(255,59,48,0.08)', color: '#FF3B30',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {removing
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Trash2 size={13} />}
            </button>
          </div>
        </div>
      )}

      {/* ── SEM documento — botão evidente ── */}
      {!url && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: uploading ? '10px 0' : '11px 0',
            background: uploading
              ? 'rgba(255,159,10,0.08)'
              : 'rgba(10,102,255,0.07)',
            border: `1.5px dashed ${uploading ? '#FF9F0A' : '#0A66FF'}`,
            borderRadius: 10, cursor: uploading ? 'default' : 'pointer',
            fontFamily: 'Instrument Sans, sans-serif',
            transition: 'all .2s',
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

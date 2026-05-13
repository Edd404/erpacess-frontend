/**
 * SignedDocumentUpload.jsx
 * Componente reutilizável para anexar foto do documento assinado pelo cliente.
 * Faz upload direto para o Cloudinary (sem passar pelo backend).
 * Depois salva apenas a URL no backend via PATCH /orders/:id/document
 *
 * Props:
 *   orderId        — ID da ordem
 *   orderNumber    — número da OS (para nome do arquivo)
 *   existingUrl    — URL atual se já tiver documento
 *   onSaved(url)   — callback chamado após salvar com sucesso
 *   compact        — se true, renderiza versão menor (para lista)
 */

import { useState, useRef } from 'react'
import { Camera, FileImage, Trash2, ExternalLink, Loader2, CheckCircle, Upload } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

// ── Credenciais Cloudinary ────────────────────────────────────
// Substitua pelos seus valores após criar a conta
const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   || 'SEU_CLOUD_NAME'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'SEU_UPLOAD_PRESET'
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

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
  red:        '#FF3B30',
  redSoft:    'rgba(255,59,48,0.10)',
  amber:      '#FF9F0A',
  amberSoft:  'rgba(255,159,10,0.10)',
  shadow:     '0 2px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.07)',
}

export default function SignedDocumentUpload({
  orderId,
  orderNumber,
  clientName,
  existingUrl,
  onSaved,
  compact = false,
}) {
  const [uploading,   setUploading]   = useState(false)
  const [removing,    setRemoving]    = useState(false)
  const [preview,     setPreview]     = useState(existingUrl || null)
  const [progress,    setProgress]    = useState(0)
  const fileInputRef = useRef(null)

  const hasDoc = !!preview

  // ── Upload para Cloudinary ────────────────────────────────
  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    // Sanitiza o nome do cliente para uso como pasta (remove caracteres especiais)
    const safeClient = (clientName || 'sem-nome')
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
      .replace(/[^a-zA-Z0-9 _-]/g, '')                 // só letras, números, espaço, _ e -
      .trim().replace(/\s+/g, '_')                      // espaços → underscore
      .toLowerCase()

    // Unsigned preset: só folder — public_id é gerado automaticamente pelo Cloudinary
    // O context tag identifica a ordem para rastreamento
    formData.append('file',          file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder',        `istore/documentos/${safeClient}`)
    formData.append('context',       `ordem=${orderNumber || orderId}`)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
      })
      xhr.addEventListener('load', () => {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status === 200) resolve(res)
        else reject(new Error(res.error?.message || 'Falha no upload'))
      })
      xhr.addEventListener('error', () => reject(new Error('Erro de rede')))
      xhr.open('POST', UPLOAD_URL)
      xhr.send(formData)
    })
  }

  // ── Handler de arquivo selecionado ────────────────────────
  const handleFile = async (file) => {
    if (!file) return
    const validTypes = ['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(heic|heif)$/i)) {
      toast.error('Use uma imagem (JPG, PNG, WEBP ou HEIC)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      // Cloudinary
      const cloudRes = await uploadToCloudinary(file)

      // Backend — salva URL
      await api.patch(`/orders/${orderId}/document`, {
        url:       cloudRes.secure_url,
        public_id: cloudRes.public_id,
      })

      setPreview(cloudRes.secure_url)
      onSaved?.(cloudRes.secure_url)
      toast.success('Documento anexado com sucesso!')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar documento. Tente novamente.')
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Remover documento ─────────────────────────────────────
  const handleRemove = async () => {
    if (!window.confirm('Remover o documento desta ordem?')) return
    setRemoving(true)
    try {
      await api.delete(`/orders/${orderId}/document`)
      setPreview(null)
      onSaved?.(null)
      toast.success('Documento removido.')
    } catch {
      toast.error('Erro ao remover documento.')
    } finally {
      setRemoving(false)
    }
  }

  // ── Versão compact (usada na lista do ClientHistory) ──────
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasDoc ? (
          <>
            <a
              href={preview}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: C.greenSoft, color: C.green,
                border: 'none', borderRadius: 8, padding: '5px 10px',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                textDecoration: 'none', fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              <FileImage size={11} /> Ver documento
            </a>
            <button
              onClick={handleRemove}
              disabled={removing}
              style={{
                display: 'flex', alignItems: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.t3, padding: 4,
              }}
            >
              {removing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
            </button>
          </>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: uploading ? C.amberSoft : C.accentSoft,
                color: uploading ? C.amber : C.accent,
                border: 'none', borderRadius: 8, padding: '5px 10px',
                fontSize: 11, fontWeight: 600, cursor: uploading ? 'default' : 'pointer',
                fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              {uploading
                ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> {progress}%</>
                : <><Camera size={11} /> Anexar doc.</>
              }
            </button>
          </>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  // ── Versão completa (usada no modal de detalhes) ──────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileImage size={14} style={{ color: C.t2 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Documento Assinado</span>
        </div>
        {hasDoc && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, color: C.green,
            background: C.greenSoft, borderRadius: 20, padding: '3px 9px',
          }}>
            <CheckCircle size={9} /> Anexado
          </span>
        )}
      </div>

      {hasDoc ? (
        /* Prévia do documento */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.border}`,
            background: '#000',
            maxHeight: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src={preview}
              alt="Documento assinado"
              style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={preview}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: '9px 0', textAlign: 'center',
                background: C.accentSoft, color: C.accent,
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              <ExternalLink size={12} /> Abrir em tela cheia
            </a>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1, padding: '9px 0',
                background: 'rgba(0,0,0,0.04)', color: C.t2,
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              <Camera size={12} /> Substituir
            </button>

            <button
              onClick={handleRemove}
              disabled={removing}
              style={{
                padding: '9px 14px',
                background: C.redSoft, color: C.red,
                border: 'none', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {removing
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Trash2 size={13} />}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        /* Área de upload */
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: '100%', padding: '20px 16px',
              background: uploading ? C.amberSoft : 'rgba(0,0,0,0.02)',
              border: `2px dashed ${uploading ? C.amber : C.border}`,
              borderRadius: 14, cursor: uploading ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              transition: 'all .2s', fontFamily: 'Instrument Sans, sans-serif',
            }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = C.accentSoft }}
            onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
          >
            {uploading ? (
              <>
                <Loader2 size={24} style={{ color: C.amber, animation: 'spin 1s linear infinite' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>Enviando… {progress}%</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Aguarde, fazendo upload</div>
                </div>
                <div style={{ width: '70%', height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: C.amber, borderRadius: 2, width: `${progress}%`, transition: 'width .2s' }} />
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: C.accentSoft, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Camera size={20} style={{ color: C.accent }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Tirar foto ou escolher arquivo</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>JPG, PNG, WEBP ou HEIC · máx. 10MB</div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: C.accent, color: '#fff',
                  borderRadius: 8, padding: '7px 16px',
                  fontSize: 12, fontWeight: 600,
                }}>
                  <Upload size={12} /> Anexar documento
                </div>
              </>
            )}
          </button>
        </>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

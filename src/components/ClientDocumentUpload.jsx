import { useState, useRef, useEffect } from 'react'
import {
  Camera, ImagePlus, ShieldCheck, Lock, Trash2, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react'
import api from '../services/api'
import { compressImage, blobToDataUrl } from '../utils/imageCompress'

// ─────────────────────────────────────────────────────────────────────────────
// Foto do documento do cliente (RG/CNH).
//
//  • "Tirar foto" abre a CÂMERA (capture); "Galeria" abre o seletor do aparelho.
//  • A foto é reduzida no próprio celular (sem EXIF/GPS) e enviada ao BACKEND, que a guarda
//    no Cloudinary como arquivo PRIVADO — sem link público.
//  • Componente controlado: value = { id, previewUrl } | null.
//    O `id` é o que a venda envia ao salvar (document_ids).
// ─────────────────────────────────────────────────────────────────────────────

// Venda com aparelho recebido do cliente exige o documento (o backend também confere).
export const DOC_REQUIRED_METHODS = ['iphone_entrada']
export const needsClientDocument = (type, paymentMethods = []) =>
  type === 'venda' && paymentMethods.some((m) => DOC_REQUIRED_METHODS.includes(m))

const MAX_INPUT_BYTES = 30 * 1024 * 1024

const C = {
  ink: '#0A0A0B', ink3: '#6B6B70', ink4: '#AEAEB2', ink5: '#D1D1D6', ink6: '#F2F2F7',
  white: '#FFFFFF', green: '#12A150', greenL: '#EDFAF3', red: '#D93025', redL: '#FFF0EE',
}

const friendlyError = (err) => {
  const serverMsg = err?.response?.data?.error
  if (serverMsg) return serverMsg
  if (err?.code === 'ECONNABORTED') return 'O envio demorou demais. Verifique a internet e tente de novo.'
  if (!err?.response && (/network/i.test(err?.message || '') || err?.code === 'ERR_NETWORK')) {
    return 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
  }
  return err?.message || 'Não foi possível enviar a foto. Tente novamente.'
}

export default function ClientDocumentUpload({
  value, onChange, onBusyChange, error, id = 'client-document-field', bare = false, disabled = false,
}) {
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('idle')        // compress | upload | finish
  const [progress, setProgress] = useState(0)
  const [localError, setLocalError] = useState('')
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const handleFile = async (file) => {
    if (!file || busy || disabled) return
    setLocalError('')

    const looksLikeImage = /^image\//i.test(file.type || '') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '')
    if (!looksLikeImage) { setLocalError('Selecione uma imagem (foto do documento).'); return }
    if (file.size > MAX_INPUT_BYTES) { setLocalError('Imagem muito grande. Tire uma nova foto ou escolha outra.'); return }

    setBusy(true); onBusyChange?.(true)
    setPhase('compress'); setProgress(0)
    try {
      const blob = await compressImage(file)
      const preview = await blobToDataUrl(blob)

      setPhase('upload')
      const res = await api.post('/order-documents', blob, {
        headers: { 'Content-Type': 'image/jpeg' },
        timeout: 90000,
        onUploadProgress: (e) => {
          if (!mounted.current || !e.total) return
          const pct = Math.min(100, Math.round((e.loaded * 100) / e.total))
          setProgress(pct)
          if (pct >= 100) setPhase('finish')
        },
      })

      const doc = res.data?.data
      if (!doc?.id) throw new Error('Resposta inesperada do servidor. Tente novamente.')

      const previous = value
      onChange?.({ id: doc.id, previewUrl: preview, bytes: doc.bytes })
      // trocou a foto: descarta a anterior (ainda pendente) no servidor
      if (previous?.id) api.delete(`/order-documents/${previous.id}`).catch(() => {})
    } catch (err) {
      if (mounted.current) setLocalError(friendlyError(err))
    } finally {
      if (mounted.current) { setBusy(false); setPhase('idle') }
      onBusyChange?.(false)
    }
  }

  const onPick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''            // permite escolher a mesma foto de novo
    handleFile(file)
  }

  const handleRemove = () => {
    if (!value?.id || busy) return
    const doc = value
    onChange?.(null)
    api.delete(`/order-documents/${doc.id}`).catch(() => {})
  }

  const shownError = error || localError
  const ready = !!value?.id

  const bigBtn = (primary) => ({
    flex: 1, minHeight: 48, padding: '10px 12px', borderRadius: 11, cursor: busy || disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontSize: 14, fontWeight: 600, fontFamily: 'Instrument Sans,sans-serif',
    border: `1.5px solid ${C.ink}`, background: primary ? C.ink : C.white, color: primary ? C.white : C.ink,
    opacity: busy || disabled ? 0.55 : 1, transition: 'opacity .15s',
  })

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* entradas escondidas: câmera × galeria */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} data-testid="doc-camera-input" />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onPick} data-testid="doc-gallery-input" />

      {busy ? (
        <div style={{ background: C.white, border: `1px solid ${C.ink5}`, borderRadius: 11, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C.ink }}>
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            {phase === 'compress' && 'Preparando a foto…'}
            {phase === 'upload' && `Enviando… ${progress}%`}
            {phase === 'finish' && 'Salvando com segurança…'}
          </div>
          <div style={{ height: 6, background: C.ink6, borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${phase === 'compress' ? 8 : progress}%`, background: C.ink,
              borderRadius: 99, transition: 'width .2s',
            }} />
          </div>
        </div>
      ) : ready ? (
        <>
          <div style={{
            background: C.white, border: `1px solid ${C.ink5}`, borderRadius: 11, padding: 8,
            display: 'flex', justifyContent: 'center',
          }}>
            {value.previewUrl && (
              <img src={value.previewUrl} alt="Foto do documento do cliente"
                style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 7 }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => cameraRef.current?.click()} disabled={disabled}
              style={{ ...bigBtn(false), minHeight: 42, fontSize: 13 }} aria-label="Tirar outra foto">
              <Camera size={15} /> Nova foto
            </button>
            <button type="button" onClick={() => galleryRef.current?.click()} disabled={disabled}
              style={{ ...bigBtn(false), minHeight: 42, fontSize: 13 }} aria-label="Escolher outra foto da galeria">
              <ImagePlus size={15} /> Galeria
            </button>
            <button type="button" onClick={handleRemove} disabled={disabled} aria-label="Remover foto"
              style={{
                ...bigBtn(false), flex: '0 0 46px', minHeight: 42, padding: 0,
                borderColor: C.ink5, color: C.red,
              }}>
              <Trash2 size={15} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: C.ink3, lineHeight: 1.5 }}>
            Fotografe o <b>RG</b> ou a <b>CNH</b> do cliente: frente, sem reflexo e com todos os dados legíveis.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => cameraRef.current?.click()} disabled={disabled} style={bigBtn(true)}>
              <Camera size={16} /> Tirar foto
            </button>
            <button type="button" onClick={() => galleryRef.current?.click()} disabled={disabled} style={bigBtn(false)}>
              <ImagePlus size={16} /> Galeria
            </button>
          </div>
        </>
      )}

      {shownError && (
        <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: C.red, lineHeight: 1.4 }}>
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />{shownError}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: C.ink4, lineHeight: 1.4 }}>
        <Lock size={11} style={{ flexShrink: 0, marginTop: 2 }} />
        Enviada com proteção, sem link público. Só administrador e gerente conseguem visualizar.
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (bare) return <div id={id}>{body}</div>

  const border = shownError ? C.red : ready ? C.green : C.ink
  return (
    <div id={id} style={{ border: `1.5px solid ${border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .15s' }}>
      <div style={{
        background: ready ? C.green : C.ink, padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Documento do cliente</span>
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
          color: C.white, background: 'rgba(255,255,255,0.18)', padding: '3px 8px', borderRadius: 99,
        }}>
          {ready ? <><CheckCircle2 size={10} /> ANEXADO</> : 'OBRIGATÓRIO'}
        </span>
      </div>
      <div style={{ padding: 16, background: C.ink6 }}>{body}</div>
    </div>
  )
}

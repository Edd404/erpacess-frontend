// ─────────────────────────────────────────────────────────────────────────────
// Prepara a foto do documento ANTES do envio.
//
//  • reduz (lado maior ≤ 1800 px — suficiente para ler RG/CNH) e comprime em JPEG
//    (celulares geram fotos de 3–8 MB; aqui ficam em ~0,3–1 MB)
//  • aplica a rotação correta da câmera (EXIF orientation)
//  • REMOVE todos os metadados (EXIF/GPS): ao redesenhar no canvas, a localização
//    e o modelo do celular não vão junto com o documento
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_SIDE = 1800
export const JPEG_QUALITY = 0.85
const TARGET_MAX_BYTES = 2.5 * 1024 * 1024

const READ_ERROR =
  'Não foi possível ler essa imagem. Tente outra foto (JPG ou PNG). Fotos em HEIC/HEIF não são aceitas.'

const loadSource = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch { /* cai para o método clássico */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')) }
    img.src = url
  })
}

const toJpeg = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))

/**
 * @param {File|Blob} file
 * @returns {Promise<Blob>} JPEG já reduzido e sem metadados
 */
export async function compressImage(file, { maxSide = MAX_SIDE, quality = JPEG_QUALITY } = {}) {
  let source
  try {
    source = await loadSource(file)
  } catch {
    throw new Error(READ_ERROR)
  }

  const srcW = source.width || source.naturalWidth
  const srcH = source.height || source.naturalHeight
  if (!srcW || !srcH) throw new Error(READ_ERROR)

  const scale = Math.min(1, maxSide / Math.max(srcW, srcH))
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.')

  // JPEG não tem transparência: fundo branco evita "tela preta" em PNG com alpha
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, w, h)
  if (typeof source.close === 'function') source.close()

  let q = quality
  let blob = await toJpeg(canvas, q)
  // foto muito "detalhada" (ex.: fundo com textura): baixa a qualidade até caber
  while (blob && blob.size > TARGET_MAX_BYTES && q > 0.55) {
    q = Math.round((q - 0.1) * 100) / 100
    blob = await toJpeg(canvas, q)
  }

  canvas.width = 0   // libera memória (importante em iPhone)
  canvas.height = 0

  if (!blob) throw new Error('Não foi possível preparar a imagem. Tente outra foto.')
  return blob
}

/** Blob → data URL (usado só para a miniatura na tela). */
export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Falha ao gerar a miniatura.'))
    reader.readAsDataURL(blob)
  })

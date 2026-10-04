// ─────────────────────────────────────────────────────────────────────────────
// Texto "Dados para nota fiscal" — mensagem padrão enviada ao administrativo
// (via WhatsApp) quando o cliente pede NF. Funções puras, sem React.
//
// Campos usados da ordem (o detalhe completo vem de GET /orders/:id):
//   created_at, type, client_name, client_cpf, client_address, client_neighborhood,
//   client_city, client_state, client_cep, iphone_model, capacity, color, imei,
//   price, payment_methods, payment_details, accessories, notes
// ─────────────────────────────────────────────────────────────────────────────
import { formatCPF, formatCEP } from './formatters'

const PAY_LABELS = {
  pix:            'Pix',
  dinheiro:       'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito:  'Débito',
  iphone_entrada: 'iPhone entrada',
  troca:          'Troca',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const text = (v) => (v == null ? '' : String(v).trim())
const onlyDigits = (v) => text(v).replace(/\D/g, '')

const parseJson = (v, fallback) => {
  if (v == null || v === '') return fallback
  if (typeof v === 'object') return v
  try { return JSON.parse(v) } catch { return fallback }
}

// Mesma regra usada no detalhe da ordem: "3.000,00" | "3000,00" | 3000 → 3000
const parseBRL = (v) => {
  if (v == null || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

// Acessórios são salvos como número; strings antigas podem vir com vírgula
const parseAmount = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = text(v)
  if (!s) return 0
  return s.includes(',') ? parseBRL(s) : (parseFloat(s) || 0)
}

// 2100 → "2100,00" (sem separador de milhar, como no modelo do administrativo)
const money = (n) => (Number.isFinite(n) ? n : 0).toFixed(2).replace('.', ',')

const brDate = (d) => {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

const addressLine = (o) => {
  const city = text(o.client_city)
  const uf   = text(o.client_state).toUpperCase()
  const cityUf = city && uf ? `${city}/${uf}` : (city || uf)
  const cep  = formatCEP(onlyDigits(o.client_cep))
  return [text(o.client_address), text(o.client_neighborhood), cityUf, cep].filter(Boolean).join(' · ')
}

const servicesFromNotes = (notes) => {
  const line = text(notes).split('\n').find((l) => l.startsWith('Serviços:'))
  return line ? line.replace('Serviços:', '').trim() : ''
}

// "Pix" | "Crédito 10x" | com vários métodos: "Pix (R$ 3000,00) + Crédito 5x (R$ 2749,00)"
const paymentText = (o) => {
  const raw = parseJson(o.payment_methods, [])
  const methods = Array.isArray(raw) ? raw : []
  if (!methods.length) return ''
  const pd = parseJson(o.payment_details, {}) || {}
  const multi = methods.length > 1

  return methods.map((m) => {
    const d = pd[m] || {}
    let label = PAY_LABELS[m] || text(m)
    const parcelas = parseInt(d.parcelas, 10)
    if (m === 'cartao_credito' && parcelas > 1) label += ` ${parcelas}x`
    const val = parseBRL(d.value)
    if (multi && val > 0) label += ` (R$ ${money(val)})`
    return label
  }).join(' + ')
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Monta o texto no modelo enviado ao administrativo.
 * Linhas sem valor ficam só com o rótulo; a linha de endereço some se não houver nada.
 */
export const buildNfMessage = (o = {}) => {
  const isManut = o.type === 'manutencao'
  const price   = parseFloat(o.price)
  const address = addressLine(o)
  const servicos = isManut ? servicesFromNotes(o.notes) : ''

  const identification = [
    `📆${isManut ? 'Data do serviço' : 'Data da compra'}:  ${brDate(o.created_at)}`,
    `👤 Nome completo:  ${text(o.client_name)}`,
    `🧾CPF:  ${formatCPF(text(o.client_cpf))}`,
  ]

  const deviceAndPayment = [
    `📲 Modelo e GB: ${[text(o.iphone_model), text(o.capacity)].filter(Boolean).join(' ')}`,
    `🎨 Cor: ${text(o.color)}`,
    `🔎 S/N ou IMEI ${text(o.imei)}`,
    ...(servicos ? [`🔧 Serviços: ${servicos}`] : []),
    `💰 Val: ${Number.isFinite(price) ? money(price) : ''}`,
    `💳 Forma de pagamento:  ${paymentText(o)}`,
  ]

  return [identification, address ? [address] : null, deviceAndPayment]
    .filter(Boolean)
    .map((block) => block.map((line) => line.replace(/\s+$/, '')).join('\n'))
    .join('\n\n')
}

/** Dados do cadastro que costumam faltar e que a nota precisa (para avisar na tela). */
export const missingNfFields = (o = {}) => {
  const isManut = o.type === 'manutencao'
  const missing = []

  if (onlyDigits(o.client_cpf).length !== 11) missing.push('CPF')

  const addr = []
  if (!text(o.client_address))      addr.push('endereço')
  if (!text(o.client_neighborhood)) addr.push('bairro')
  if (!text(o.client_city))         addr.push('cidade')
  if (!text(o.client_state))        addr.push('UF')
  if (onlyDigits(o.client_cep).length !== 8) addr.push('CEP')
  missing.push(...(addr.length === 5 ? ['endereço completo'] : addr))

  if (!isManut && !text(o.color)) missing.push('cor')
  if (!text(o.imei)) missing.push('IMEI')
  return missing
}

/** Acessórios vendidos junto (o `price` da ordem já os inclui). */
export const orderAccessories = (o = {}) => {
  const list = parseJson(o.accessories, [])
  if (!Array.isArray(list)) return []
  return list
    .filter((a) => a && text(a.name))
    .map((a) => ({ name: text(a.name), price: parseAmount(a.price) }))
}

/** Celular BR → só dígitos com DDI 55 (ou '' se inválido). Aceita com/sem 55. */
export const normalizeBrPhone = (phone) => {
  const d = onlyDigits(phone)
  if (d.length === 10 || d.length === 11) return `55${d}`
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return ''
}

/** Link do WhatsApp com a mensagem pronta. Sem número válido, abre a lista de conversas. */
export const buildWhatsAppUrl = (message, phone = '') =>
  `https://wa.me/${normalizeBrPhone(phone)}?text=${encodeURIComponent(message)}`

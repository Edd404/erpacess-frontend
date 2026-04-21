export const validateCPF = (cpf = '') => {
  const v = cpf.replace(/\D/g, '')
  if (v.length !== 11 || /^(\d)\1+$/.test(v)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(v[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(v[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(v[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(v[10])
}
export const validateIMEI = (imei = '') => {
  if (!imei) return true
  const v = imei.replace(/\D/g, '')
  if (v.length !== 15) return false
  let sum = 0
  for (let i = 0; i < 15; i++) {
    let d = parseInt(v[i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}
export const validateEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
export const validatePhone = (phone = '') => { const v = phone.replace(/\D/g, ''); return v.length === 10 || v.length === 11 }
export const validateCEP = (cep = '') => cep.replace(/\D/g, '').length === 8

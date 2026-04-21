export const formatCPF = (v = '') => {
  const n = v.replace(/\D/g, '').slice(0, 11)
  return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}
export const formatPhone = (v = '') => {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length > 10) return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (n.length > 6)  return n.replace(/(\d{2})(\d{4})(\d+)/,   '($1) $2-$3')
  if (n.length > 2)  return n.replace(/(\d{2})(\d+)/,           '($1) $2')
  return n
}
export const formatCEP = (v = '') => {
  const n = v.replace(/\D/g, '').slice(0, 8)
  return n.length > 5 ? n.replace(/(\d{5})(\d+)/, '$1-$2') : n
}
export const formatCurrencyInput = (v = '') => {
  const n = v.replace(/\D/g, '')
  if (!n) return ''
  return (parseInt(n) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}
export const displayCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
export const formatDate = (date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
export const getInitials = (name = '') => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
export const getAvatarColor = (name = '') => {
  const colors = ['#0A66FF','#7C3AED','#DC2626','#D97706','#16A34A','#0891B2','#DB2777']
  return colors[name.charCodeAt(0) % colors.length]
}

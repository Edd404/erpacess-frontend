/**
 * ClientHistoryPage.jsx
 * Página standalone para o perfil do cliente, acessada via /clients/:id
 *
 * O componente ClientHistory já existe como modal — aqui só adaptamos
 * para funcionar como página completa, sem o backdrop e sem o botão X.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import ClientHistory from '../components/ClientHistory'

export default function ClientHistoryPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  // Se não houver ID, volta para a lista de clientes
  useEffect(() => {
    if (!id) navigate('/clients', { replace: true })
  }, [id, navigate])

  if (!id) return null

  return (
    <ClientHistory
      clientId={id}
      // "onClose" no contexto de página = voltar para a lista
      onClose={() => navigate('/clients')}
    />
  )
}

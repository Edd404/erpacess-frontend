import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, MapPin, RefreshCw, Users, Receipt, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useClientsGeoDistribution, useGeoBackfill } from '../hooks/useData'
import PeriodFilter, { periodToParams } from '../components/PeriodFilter'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', borderS:'rgba(0,0,0,0.12)',
  text:'#0C0C0E', t2:'#6B7280', t3:'#9CA3AF', bg:'#F7F7F8',
  accent:'#0A66FF', accentL:'#EEF4FF',
}

// Centro aproximado da cidade de São Paulo — o mapa abre focado ali,
// mas continua livre pra arrastar/dar zoom pra qualquer bairro da região.
const SP_CENTER = [-23.5505, -46.6333]
const SP_ZOOM = 11

const formatBRL = (v) =>
  v.toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 })

// Raio da bolha em escala de raiz quadrada — cresce com o número de clientes
// sem deixar o bairro mais forte gigantesco a ponto de cobrir a cidade toda.
function radiusForCount(count, maxCount) {
  if (!maxCount || maxCount <= 1) return 14
  const MIN = 11, MAX = 40
  return Math.round(MIN + Math.sqrt(count / maxCount) * (MAX - MIN))
}

export default function ClientsMapPage() {
  const [periodFilter, setPeriodFilter] = useState(() => {
    const now = new Date()
    return { mode:'month', year: now.getFullYear(), month: now.getMonth() }
  })
  const params = periodToParams(periodFilter)
  const { data, isLoading, isError } = useClientsGeoDistribution(params)
  const geoBackfill = useGeoBackfill()

  const bairros = data?.bairros || []
  const maxCount = useMemo(() => bairros.reduce((m, b) => Math.max(m, b.client_count), 0), [bairros])
  const totalClientes = useMemo(() => bairros.reduce((s, b) => s + b.client_count, 0), [bairros])

  const semLocalizacao = data?.sem_localizacao || 0
  const semCoordenadas = data?.sem_coordenadas || 0
  const temAviso = semLocalizacao > 0 || semCoordenadas > 0

  const [selected, setSelected] = useState(null)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, fontFamily:'Instrument Sans,sans-serif' }}>

      {/* Filtro de período — mesmo componente e comportamento de Ordens/Dashboard */}
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <PeriodFilter value={periodFilter} onChange={setPeriodFilter} align="right"/>
      </div>

      {/* Resumo */}
      <div style={{
        display:'flex', flexDirection:'column', gap:4, padding:'12px 14px',
        background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isLoading
            ? <Loader2 size={14} style={{ color:T.t3, animation:'spin 1s linear infinite' }}/>
            : <MapPin size={14} style={{ color:T.accent }}/>}
          <span style={{ fontSize:13.5, fontWeight:600, color:T.text }}>
            {isLoading ? 'Carregando...' : `${totalClientes} cliente${totalClientes !== 1 ? 's' : ''} em ${bairros.length} bairro${bairros.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {!isLoading && temAviso && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:11.5, color:T.t3 }}>
              {semLocalizacao > 0 && `${semLocalizacao} sem bairro cadastrado`}
              {semLocalizacao > 0 && semCoordenadas > 0 && ' · '}
              {semCoordenadas > 0 && `${semCoordenadas} aguardando geocodificação`}
            </span>
            {semCoordenadas > 0 && (
              <button
                onClick={() => geoBackfill.mutate(undefined, {
                  onSuccess: (r) => {
                    toast.success(r.remaining > 0
                      ? `${r.geocoded} bairro${r.geocoded !== 1 ? 's' : ''} geocodificado${r.geocoded !== 1 ? 's' : ''} · ${r.remaining} restante${r.remaining !== 1 ? 's' : ''} — toca de novo pra continuar`
                      : `Pronto! ${r.geocoded} bairro${r.geocoded !== 1 ? 's' : ''} geocodificado${r.geocoded !== 1 ? 's' : ''}, nenhum restante.`)
                  },
                  onError: () => toast.error('Erro ao geocodificar. Tenta de novo em alguns segundos.'),
                })}
                disabled={geoBackfill.isPending}
                style={{
                  display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
                  background:T.accentL, color:T.accent, border:'none', borderRadius:7,
                  fontSize:11.5, fontWeight:600, cursor: geoBackfill.isPending ? 'default' : 'pointer',
                  fontFamily:'Instrument Sans,sans-serif', whiteSpace:'nowrap',
                }}
              >
                {geoBackfill.isPending
                  ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> Geocodificando...</>
                  : <><RefreshCw size={12}/> Geocodificar agora</>}
              </button>
            )}
          </div>
        )}
        {isError && (
          <span style={{ fontSize:11.5, color:'#B45309' }}>Não foi possível carregar os dados do mapa.</span>
        )}
      </div>

      {/* Mapa */}
      <div style={{
        height:'65vh', minHeight:380, borderRadius:12, overflow:'hidden',
        border:`1px solid ${T.border}`, position:'relative',
      }}>
        <style>{`
          @keyframes _bairroCardIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
          .leaflet-container { font-family:'Instrument Sans',sans-serif; }
        `}</style>

        <MapContainer center={SP_CENTER} zoom={SP_ZOOM} style={{ height:'100%', width:'100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {bairros.map((b) => {
            const isSelected = selected && selected.neighborhood === b.neighborhood && selected.city === b.city && selected.state === b.state
            return (
              <CircleMarker
                key={`${b.neighborhood}|${b.city}|${b.state}`}
                center={[b.latitude, b.longitude]}
                radius={radiusForCount(b.client_count, maxCount)}
                pathOptions={{
                  color: isSelected ? '#0C0C0E' : '#0047CC',
                  weight: isSelected ? 2.5 : 1.5,
                  fillColor: T.accent,
                  fillOpacity: isSelected ? 0.75 : 0.5,
                }}
                eventHandlers={{ click: () => setSelected(b) }}
              />
            )
          })}
        </MapContainer>

        {/* Cartão flutuante do bairro selecionado — substitui o popup padrão do Leaflet */}
        {selected && (
          <div style={{
            position:'absolute', left:10, right:10, bottom:10, zIndex:1000,
            background:T.surface, borderRadius:16, border:`1px solid ${T.border}`,
            boxShadow:'0 10px 32px rgba(12,12,14,0.16)', padding:'14px 16px',
            animation:'_bairroCardIn .18s ease-out',
          }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, lineHeight:1.25, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {selected.neighborhood}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                  <MapPin size={11} style={{ color:T.t3, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:T.t2 }}>{selected.city}/{selected.state}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  width:26, height:26, borderRadius:'50%', border:'none',
                  background:T.bg, color:T.t2, cursor:'pointer',
                }}
              >
                <X size={13}/>
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:26, height:26, borderRadius:8, background:T.accentL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Users size={13} style={{ color:T.accent }}/>
                </div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:T.text, lineHeight:1.1 }}>{selected.client_count}</div>
                  <div style={{ fontSize:10, color:T.t3 }}>cliente{selected.client_count !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:26, height:26, borderRadius:8, background:T.accentL, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Receipt size={13} style={{ color:T.accent }}/>
                </div>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:T.text, lineHeight:1.1 }}>{selected.order_count}</div>
                  <div style={{ fontSize:10, color:T.t3 }}>{selected.order_count !== 1 ? 'ordens' : 'ordem'}</div>
                </div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div style={{ fontSize:15, fontWeight:700, color:T.accent, lineHeight:1.1 }}>{formatBRL(selected.revenue)}</div>
                <div style={{ fontSize:10, color:T.t3 }}>no período</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize:10.5, color:T.t3, textAlign:'center' }}>
        Mapa: OpenStreetMap · o tamanho da bolha representa a quantidade de clientes no bairro
      </div>
    </div>
  )
}

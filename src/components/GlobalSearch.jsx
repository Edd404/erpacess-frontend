import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Search, X, Smartphone, Users, ClipboardList, Camera, Loader2 } from 'lucide-react'
import { clientService, orderService } from '../services/api'


export default function GlobalSearch({ onClose }) {
  const { T } = useTheme()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState({ clients: [], orders: [] })
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef()
  const videoRef = useRef()
  const streamRef = useRef()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (q.length < 2) { setResults({ clients: [], orders: [] }); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const [c, o] = await Promise.all([
          clientService.search(q).catch(() => ({ data: { data: [] } })),
          orderService.search(q).catch(() => ({ data: { data: [] } })),
        ])
        setResults({ clients: c.data.data || [], orders: o.data.data || [] })
      } finally { setLoading(false) }
    }, 280)
    return () => clearTimeout(t)
  }, [q])

  // IMEI scanner via câmera
  const startScanner = async () => {
    try {
      setScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream

      // Usa BarcodeDetector se disponível
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'qr_code'] })
        const scan = async () => {
          if (!scanning || !videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              const imei = codes[0].rawValue.replace(/\D/g, '').slice(0, 15)
              if (imei.length >= 14) {
                stopScanner()
                setQ(imei)
                return
              }
            }
          } catch {}
          if (streamRef.current) requestAnimationFrame(scan)
        }
        videoRef.current.onloadedmetadata = () => { videoRef.current.play(); scan() }
      }
    } catch {
      setScanning(false)
      alert('Câmera não disponível ou permissão negada.')
    }
  }

  const stopScanner = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => () => stopScanner(), [])

  const go = (path) => { onClose(); navigate(path) }

  const total = results.clients.length + results.orders.length
  const hasResults = total > 0
  const empty = q.length >= 2 && !loading && !hasResults

  const typeLabel = { venda: 'Venda', manutencao: 'Manutenção' }
  const statusColor = { aberto: T.amber, em_andamento: T.blue, concluido: T.green, cancelado: T.red }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px 16px', fontFamily: 'Instrument Sans,sans-serif' }}
      onClick={onClose}>

      <div onClick={e => e.stopPropagation()}
        style={{ background: T.surface, borderRadius: 16, width: '100%', maxWidth: 580, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${T.ink5}`, gap: 10 }}>
          {loading
            ? <Loader2 size={16} style={{ color: T.ink4, flexShrink: 0, animation: 'spin 1s linear infinite' }}/>
            : <Search size={16} style={{ color: T.ink4, flexShrink: 0 }}/>}
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar cliente, IMEI, nº OS, modelo..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: T.ink, background: 'transparent', fontFamily: 'Instrument Sans,sans-serif' }}/>
          <button onClick={scanning ? stopScanner : startScanner}
            title="Scanner de IMEI"
            style={{ background: scanning ? T.blue : T.ink6, border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Camera size={15} style={{ color: scanning ? '#fff' : T.ink3 }}/>
          </button>
          <button onClick={onClose} style={{ background: T.ink6, border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} style={{ color: T.ink3 }}/>
          </button>
        </div>

        {/* Scanner de câmera */}
        {scanning && (
          <div style={{ position: 'relative', background: '#000' }}>
            <video ref={videoRef} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} playsInline muted/>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 220, height: 80, border: '2px solid #0A66FF', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}/>
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              Aponte para o código de barras do IMEI
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>

          {/* Empty state */}
          {q.length < 2 && !scanning && (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: T.ink4 }}>
              <Search size={28} style={{ margin: '0 auto 10px', opacity: 0.3, display: 'block' }}/>
              <div style={{ fontSize: 13 }}>Digite para buscar clientes, IMEI ou número de OS</div>
              <div style={{ fontSize: 11, marginTop: 6, color: T.ink4, opacity: 0.7 }}>
                Use a câmera para escanear o IMEI do iPhone
              </div>
            </div>
          )}

          {empty && (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: T.ink4 }}>
              <div style={{ fontSize: 13 }}>Nenhum resultado para "<b>{q}</b>"</div>
            </div>
          )}

          {/* Clients */}
          {results.clients.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 700, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.7px', background: T.bg }}>
                Clientes
              </div>
              {results.clients.map(c => (
                <button key={c.id} onClick={() => go(`/clients?id=${c.id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.ink6}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'Instrument Sans,sans-serif', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.ink6}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                    {c.name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: T.ink4 }}>{c.cpf_formatted} · {c.phone}</div>
                  </div>
                  <Users size={12} style={{ color: T.ink4, flexShrink: 0 }}/>
                </button>
              ))}
            </div>
          )}

          {/* Orders */}
          {results.orders.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 700, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.7px', background: T.bg }}>
                Atendimentos
              </div>
              {results.orders.map(o => (
                <button key={o.id} onClick={() => go(`/orders?id=${o.id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.ink6}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'Instrument Sans,sans-serif', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.ink6}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.ink6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {o.type === 'venda' ? <Smartphone size={14} style={{ color: T.ink3 }}/> : <ClipboardList size={14} style={{ color: T.ink3 }}/>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{o.order_number}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: statusColor[o.status] || T.ink4 }}>● {o.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.ink4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.client_name} · {o.iphone_model} · {typeLabel[o.type]}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.ink2, flexShrink: 0 }}>
                    {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(o.price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        {hasResults && (
          <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.ink6}`, display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 11, color: T.ink4 }}>↵ Selecionar</span>
            <span style={{ fontSize: 11, color: T.ink4 }}>Esc Fechar</span>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

import { useOrderStats } from '../hooks/useData'
import { TrendingUp, ClipboardList, CheckCircle2, Users, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const T = {
  surface:'#FFFFFF', border:'rgba(0,0,0,0.07)', text:'#0C0C0E',
  t2:'#6B7280', t3:'#9CA3AF', accent:'#0A66FF', accentL:'#EEF4FF',
  green:'#16A34A', greenBg:'#F0FDF4', amber:'#D97706', amberBg:'#FFFBEB',
  bg:'#F7F7F8', shadow:'0 1px 2px rgba(0,0,0,0.05),0 0 0 1px rgba(0,0,0,0.06)',
}

const brl = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)

function StatCard({ icon: Icon, iconColor, label, value, sub, trend, delay=0 }) {
  return (
    <div style={{
      background:T.surface, borderRadius:12, boxShadow:T.shadow, padding:'20px 22px',
      display:'flex', flexDirection:'column', gap:12,
      animation:`fadeIn .25s ease forwards`, animationDelay:`${delay}ms`, opacity:0,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ width:36, height:36, borderRadius:8, background:`${iconColor}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={16} style={{ color:iconColor }}/>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize:12, fontWeight:500, color: trend>=0 ? T.green : '#DC2626', display:'flex', alignItems:'center', gap:3 }}>
            <TrendingUp size={12}/> {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, color:T.t2, marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:T.t3, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useOrderStats('30')
  const summary = data?.summary || {}
  const timeline = data?.revenue_timeline || []
  const byType = data?.by_type || []
  const topModels = data?.top_models || []

  const chartData = timeline.map(d => ({
    day: new Date(d.day).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),
    receita: parseFloat(d.revenue) || 0,
  }))

  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:T.t2 }}>
      <Loader2 size={24} style={{ animation:'spin 1s linear infinite', marginRight:8 }}/> Carregando...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, fontFamily:'Instrument Sans,sans-serif' }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <StatCard icon={TrendingUp}    iconColor={T.green}   label="Receita Total"       value={brl(summary.total_revenue)}   sub="Últimos 30 dias"    trend={12} delay={0}/>
        <StatCard icon={ClipboardList} iconColor={T.accent}  label="Ordens Abertas"      value={summary.open_orders||0}        sub="Aguardando ação"              delay={50}/>
        <StatCard icon={CheckCircle2}  iconColor={T.green}   label="Concluídos"          value={summary.completed_orders||0}   sub="Últimos 30 dias"    trend={8}  delay={100}/>
        <StatCard icon={Users}         iconColor="#8B5CF6"   label="Clientes Únicos"     value={summary.unique_clients||0}     sub="Últimos 30 dias"              delay={150}/>
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14 }}>
        {/* Area chart */}
        <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, padding:'20px 22px', animation:'fadeIn .25s ease forwards', animationDelay:'200ms', opacity:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>Receita Diária</div>
              <div style={{ fontSize:12, color:T.t2, marginTop:2 }}>Últimos 30 dias</div>
            </div>
            <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.5px' }}>
              {brl(summary.total_revenue)}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.accent} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={T.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{fontSize:10,fill:T.t3}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:T.t3}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>[brl(v),'Receita']} contentStyle={{background:T.text,border:'none',borderRadius:8,color:'#fff',fontSize:12}} itemStyle={{color:'#fff'}} labelStyle={{color:'rgba(255,255,255,0.6)'}}/>
                <Area type="monotone" dataKey="receita" stroke={T.accent} strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{r:4,fill:T.accent}}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:T.t3, fontSize:13 }}>
              Nenhum dado ainda
            </div>
          )}
        </div>

        {/* By type */}
        <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, padding:'20px 22px', animation:'fadeIn .25s ease forwards', animationDelay:'240ms', opacity:0 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Por tipo</div>
          <div style={{ fontSize:12, color:T.t2, marginBottom:16 }}>{(summary.total_sales||0)+(summary.total_maintenance||0)} atendimentos</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { l:'Vendas', v:summary.total_sales||0, pct: summary.total_sales && (summary.total_sales+summary.total_maintenance) ? Math.round(summary.total_sales/(summary.total_sales+summary.total_maintenance)*100) : 0, c:T.accent },
              { l:'Manutenções', v:summary.total_maintenance||0, pct: summary.total_maintenance && (summary.total_sales+summary.total_maintenance) ? Math.round(summary.total_maintenance/(summary.total_sales+summary.total_maintenance)*100) : 0, c:'#8B5CF6' },
            ].map(d => (
              <div key={d.l}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13, color:T.t2 }}>{d.l}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{d.v}</span>
                </div>
                <div style={{ height:5, background:T.bg, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:d.c, borderRadius:3, width:`${d.pct}%`, transition:'width .4s' }}/>
                </div>
              </div>
            ))}
            <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:14, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:T.t2 }}>Ticket médio</span>
              <span style={{ fontSize:13, fontWeight:700 }}>{brl(summary.avg_sale_price)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top models */}
      {topModels.length > 0 && (
        <div style={{ background:T.surface, borderRadius:12, boxShadow:T.shadow, animation:'fadeIn .25s ease forwards', animationDelay:'280ms', opacity:0 }}>
          <div style={{ padding:'16px 22px 14px', borderBottom:`1px solid ${T.border}` }}>
            <span style={{ fontSize:14, fontWeight:600 }}>Modelos mais atendidos</span>
          </div>
          <div style={{ padding:'4px 0 8px' }}>
            {topModels.map((m,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 22px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ width:22, height:22, borderRadius:'50%', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:T.t2, flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:13, fontWeight:500 }}>{m.iphone_model}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <span style={{ fontSize:12, color:T.t2 }}>{m.count} atend.</span>
                  <span style={{ fontSize:13, fontWeight:700 }}>{brl(m.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import OrdersPage from './pages/OrdersPage'
import NewOrderPage from './pages/NewOrderPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { T } = useTheme()
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:T.bg, color:T.ink3, fontFamily:'Instrument Sans,sans-serif', fontSize:14 }}>
      Carregando...
    </div>
  )
  if (!user) return <Navigate to="/login" replace/>
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace/>
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppInner/>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function AppInner() {
  const { T } = useTheme()
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1D1D1F', color: '#fff', borderRadius: '10px',
            fontSize: '13px', fontWeight: '500', fontFamily: 'Instrument Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#30D158', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#FF3B30', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>}/>
        <Route path="/" element={<ProtectedRoute><Layout/></ProtectedRoute>}>
          <Route index            element={<DashboardPage/>}/>
          <Route path="clients"   element={<ClientsPage/>}/>
          <Route path="orders"    element={<OrdersPage/>}/>
          <Route path="orders/new" element={<NewOrderPage/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}

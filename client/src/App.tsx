import { Link, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Sign from './pages/Sign'
import Verify from './pages/Verify'
import Keys from './pages/Keys'           
import PrivateRoute from './PrivateRoute'
import { AuthProvider, useAuth } from './AuthContext'

function Header() {
  const { isAuthenticated, logout } = useAuth()
  const loc = useLocation()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
      <h2>Assinador Digital Web</h2>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {!isAuthenticated ? (
          <>
            <Link to="/register" className={loc.pathname === '/register' ? 'active' : ''}>Cadastro</Link>
            <Link to="/login" className={loc.pathname === '/login' ? 'active' : ''}>Entrar</Link>
          </>
        ) : (
          <>
            <Link to="/sign" className={loc.pathname === '/sign' ? 'active' : ''}>Assinar</Link>
            <Link to="/verify" className={loc.pathname === '/verify' ? 'active' : ''}>Verificar</Link>
            <Link to="/keys" className={loc.pathname === '/keys' ? 'active' : ''}>Minhas Chaves</Link> {/* 👈 novo */}
            <button onClick={onLogout} style={{ padding: '6px 10px', cursor: 'pointer' }}>Sair</button>
          </>
        )}
      </nav>
    </header>
  )
}

function HomeGate() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>
  return isAuthenticated ? <Navigate to="/sign" replace /> : <Navigate to="/register" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <div style={{ maxWidth: 760, margin: '24px auto', fontFamily: 'system-ui, sans-serif' }}>
        <Header />
        <Routes>
          <Route path="/" element={<HomeGate />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign" element={<PrivateRoute><Sign /></PrivateRoute>} />
          <Route path="/verify" element={<PrivateRoute><Verify /></PrivateRoute>} />
          <Route path="/keys" element={<PrivateRoute><Keys /></PrivateRoute>} /> {/* 👈 novo */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

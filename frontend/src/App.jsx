import { useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import MyTickets from './MyTickets'
import TicketDetails from './TicketDetails'
import Dashboard from './Dashboard'
import Login from './Login'
import Register from './Register'
import './App.css'

function AppRoutes() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('helpdesk_token')
    const savedUser = localStorage.getItem('helpdesk_user')

    if (!token || !savedUser) {
      return null
    }

    try {
      return JSON.parse(savedUser)
    } catch {
      localStorage.removeItem('helpdesk_token')
      localStorage.removeItem('helpdesk_user')
      return null
    }
  })

  const location = useLocation()
  const navigate = useNavigate()

  function handleLogin(profile) {
  localStorage.setItem('helpdesk_user', JSON.stringify(profile))
  setUser(profile)
}

  function handleLogout() {
    localStorage.removeItem('helpdesk_token')
    localStorage.removeItem('helpdesk_user')

    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/my-tickets"
        element={
          user
            ? <MyTickets />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/"
        element={
          user ? (
            <Dashboard
              user={user}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate
              to="/login"
              replace
              state={{ from: location }}
            />
          )
        }
      />
      <Route
        path="/tickets/:id"
        element={
          user
            ? <TicketDetails />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string>('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      login()
      navigate('/sign', { replace: true })
    } catch (e:any) {
      setMsg(e.message)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display:'grid', gap:8 }}>
      <h3>Entrar</h3>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button>Entrar</button>
      {msg && <p>{msg}</p>}
    </form>
  )
}

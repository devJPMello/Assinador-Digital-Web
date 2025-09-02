import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string>('')
  const [privateToken, setPrivateToken] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setPrivateToken(null)
    try {
      const res = await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) })
      login()
      if (res.privateExportToken) {
        setPrivateToken(res.privateExportToken)
      }
      navigate('/sign', { replace: true })
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  function downloadPrivate() {
    if (!privateToken) return
    const base = import.meta.env.VITE_API_URL
    window.location.href = `${base}/keys/private.pem?token=${encodeURIComponent(privateToken)}`
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
      <h3>Cadastro</h3>
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="senha (>=6)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button>Registrar</button>
      {msg && <p>{msg}</p>}

      {privateToken && (
        <div style={{ border: '1px solid #f0ad4e', borderRadius: 8, padding: 12, marginTop: 8 }}>
          <strong>⚠️ Baixe sua chave privada agora.</strong>
          <p style={{ marginTop: 6, fontSize: 13 }}>
            Este download é <em>único</em>. Guarde o arquivo com segurança. O sistema não mostrará novamente.
          </p>
          <button type="button" onClick={downloadPrivate}>Baixar chave privada (.pem)</button>
        </div>
      )}
    </form>
  )
}

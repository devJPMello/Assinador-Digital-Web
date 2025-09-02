import { useEffect, useState } from 'react'
import { api } from '../api'

type KeyInfo = {
  algorithm: string
  createdAt: string
  publicKeyPem: string
  fingerprintSHA256: string
}

export default function Keys() {
  const [data, setData] = useState<KeyInfo | null>(null)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState('')          // token one-time (quando exigido)
  const [privatePem, setPrivatePem] = useState('') // para exibir a privada

  useEffect(() => {
    api('/keys')
      .then(setData)
      .catch((e: any) => setMsg(e.message))
  }, [])

  async function revealPrivate() {
    try {
      setMsg('')
      setPrivatePem('')
      const qs = token ? `?token=${encodeURIComponent(token)}` : ''
      const res = await api(`/keys/private.view${qs}`)
      setPrivatePem(res.privateKeyPem)
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  function downloadPublic() {
    window.location.href = import.meta.env.VITE_API_URL + '/keys/public.pem'
  }

  function downloadPrivate() {
    const base = import.meta.env.VITE_API_URL
    const qs = token ? `?token=${encodeURIComponent(token)}` : ''
    window.location.href = `${base}/keys/private.pem${qs}`
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => { })
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h3>Minhas Chaves</h3>
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}

      {data && (
        <>
          <div><strong>Algoritmo:</strong> {data.algorithm}</div>
          <div><strong>Criada em:</strong> {new Date(data.createdAt).toLocaleString()}</div>
          <div><strong>Fingerprint (SHA-256, base64):</strong><br />
            <code style={{ wordBreak: 'break-all' }}>{data.fingerprintSHA256}</code>
          </div>
          <div>
            <strong>Chave pública (PEM):</strong>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12, borderRadius: 8 }}>
              {data.publicKeyPem}
            </pre>
            <button onClick={downloadPublic}>Baixar pública (.pem)</button>
            <button onClick={() => copy(data.publicKeyPem)} style={{ marginLeft: 8 }}>Copiar pública</button>
          </div>

          <hr />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={revealPrivate}>Revelar privada (ver)</button>
              <button type="button" onClick={downloadPrivate}>Baixar privada (.pem)</button>
            </div>

            {privatePem && (
              <>
                <pre style={{ whiteSpace: 'pre-wrap', background: '#f7f7f7', padding: 12, borderRadius: 8, marginTop: 8 }}>
                  {privatePem}
                </pre>
                <button onClick={() => copy(privatePem)}>Copiar privada</button>
              </>
            )}
        </>
      )}
    </div>
  )
}

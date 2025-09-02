import { useState } from 'react'
import { api } from '../api'

export default function Sign() {
  const [text, setText] = useState('')
  const [storeText, setStoreText] = useState(false)
  const [resp, setResp] = useState<any>(null)
  const [msg, setMsg] = useState<string>('')

  async function onSign(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setResp(null)
    try {
      const res = await api('/sign', { method: 'POST', body: JSON.stringify({ text, storeText }) })
      setResp(res)
    } catch (e:any) {
      setMsg(e.message)
    }
  }

  return (
    <form onSubmit={onSign} style={{ display:'grid', gap:8 }}>
      <h3>Área autenticada de assinatura</h3>
      <textarea rows={8} placeholder="Digite o texto a ser assinado..." value={text} onChange={e=>setText(e.target.value)} />
      <label><input type="checkbox" checked={storeText} onChange={e=>setStoreText(e.target.checked)} /> Armazenar texto no servidor (facilita verificação completa por ID)</label>
      <button>Assinar</button>
      {msg && <p>{msg}</p>}
      {resp && (
        <div style={{ border:'1px solid #ddd', padding:12, borderRadius:8 }}>
          <div><strong>ID da assinatura:</strong> {resp.signatureId}</div>
          <div><strong>Algoritmo:</strong> {resp.algorithm}</div>
          <div><strong>SHA-256(texto):</strong> {resp.textHashHex}</div>
          <div><strong>Assinatura (base64):</strong> <code style={{ wordBreak:'break-all' }}>{resp.signatureB64}</code></div>
        </div>
      )}
    </form>
  )
}

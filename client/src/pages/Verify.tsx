import { useState } from 'react'
import { api } from '../api'

export default function Verify() {
  const [byId, setById] = useState(true)
  const [id, setId] = useState('')
  const [text, setText] = useState('')
  const [signatureB64, setSignatureB64] = useState('')
  const [result, setResult] = useState<any>(null)
  const [msg, setMsg] = useState<string>('')

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setResult(null)
    try {
      const res = byId
        ? await api(`/verify/${encodeURIComponent(id)}`)
        : await api('/verify', { method: 'POST', body: JSON.stringify({ text, signatureB64 }) })
      setResult(res)
    } catch (e:any) {
      setMsg(e.message)
    }
  }

  return (
    <form onSubmit={onVerify} style={{ display:'grid', gap:8 }}>
      <h3>Verificação pública</h3>

      <label>
        <input type="radio" checked={byId} onChange={()=>setById(true)} /> Verificar por ID
      </label>
      {byId && <input placeholder="signatureId" value={id} onChange={e=>setId(e.target.value)} />}

      <label>
        <input type="radio" checked={!byId} onChange={()=>setById(false)} /> Verificar colando texto + assinatura
      </label>
      {!byId && (
        <>
          <textarea rows={6} placeholder="Texto original" value={text} onChange={e=>setText(e.target.value)} />
          <textarea rows={3} placeholder="Assinatura (base64)" value={signatureB64} onChange={e=>setSignatureB64(e.target.value)} />
        </>
      )}

      <button>Verificar</button>
      {msg && <p>{msg}</p>}
      {result && (
        <div style={{ border:'2px solid', borderColor: result.valid ? 'green' : 'crimson', padding:12, borderRadius:8 }}>
          <h4>{result.valid ? 'VÁLIDA ✅' : 'INVÁLIDA ❌'}</h4>
          {'signatureId' in result && result.signatureId && <div><strong>ID:</strong> {result.signatureId}</div>}
          {'signer' in result && result.signer && <div><strong>Signatário:</strong> {result.signer}</div>}
          {'algorithm' in result && result.algorithm && <div><strong>Algoritmo:</strong> {result.algorithm}</div>}
          {'createdAt' in result && result.createdAt && <div><strong>Data/Hora:</strong> {new Date(result.createdAt).toLocaleString()}</div>}
          {'providedHashHex' in result && result.providedHashHex && <div><strong>SHA-256(texto):</strong> {result.providedHashHex}</div>}
          {'textStored' in result && !result.textStored && result.valid && (
            <p style={{ fontSize:12, opacity:.75 }}>
              Observação: o texto original não foi armazenado no servidor; a verificação por ID confirma o registro, não revalida o conteúdo.
            </p>
          )}
        </div>
      )}
    </form>
  )
}

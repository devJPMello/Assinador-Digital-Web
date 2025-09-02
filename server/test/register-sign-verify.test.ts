import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'

const baseURL = 'http://localhost:4000'
let agent: request.SuperAgentTest

beforeAll(async () => {
  agent = request.agent(baseURL)
})

describe('assinatura e verificação', () => {
  it('positivo: assina e verifica VÁLIDA', async () => {
    const email = `t+${Date.now()}@mail.com`
    const password = '123456'

    await agent.post('/auth/register').send({ email, password }).expect(200)

    const signRes = await agent.post('/sign').send({ text: 'Ola mundo', storeText: true }).expect(200)
    const signatureId = signRes.body.signatureId
    expect(signatureId).toBeTruthy()

    const verRes = await agent.get(`/verify/${signatureId}`).expect(200)
    expect(verRes.body.valid).toBe(true)
  })

  it('negativo: verifica com texto alterado dá INVÁLIDA', async () => {
    const email = `n+${Date.now()}@mail.com`
    const password = '123456'

    await agent.post('/auth/register').send({ email, password }).expect(200)

    const signRes = await agent.post('/sign').send({ text: 'ABC', storeText: true }).expect(200)
    const signatureB64 = signRes.body.signatureB64
    expect(signatureB64).toBeTruthy()
    
    const verRes2 = await agent.post('/verify').send({ text: 'ABC ALTERADO', signatureB64 }).expect(200)
    expect(verRes2.body.valid).toBe(false)
  })
})
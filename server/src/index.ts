// server/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import authRoutes from './routes/auth.js'
import signRoutes from './routes/sign.js'
import verifyRoutes from './routes/verify.js'
import keysRoutes from './routes/keys.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

app.use('/auth', authRoutes)
app.use('/', signRoutes)
app.use('/', verifyRoutes)
app.use('/', keysRoutes) 

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`))

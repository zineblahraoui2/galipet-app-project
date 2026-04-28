/**
 * One-off: loads this repo's app + DB, hits register on a random port.
 * Run: node scripts/verify-register.js
 */
require('dotenv').config()
const http = require('http')
const mongoose = require('mongoose')
const { connectDb } = require('../db')
const app = require('../app')

async function main() {
  await connectDb()
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const { port } = server.address()

  const payload = JSON.stringify({
    name: 'VerifyScript',
    email: `verify-${Date.now()}@galipet.local`,
    password: 'pw123456',
  })

  const postBody = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let d = ''
        res.on('data', (c) => {
          d += c
        })
        res.on('end', () => resolve({ status: res.statusCode, body: d }))
      },
    )
    req.on('error', reject)
    req.write(payload)
    req.end()
  })

  const getRes = await new Promise((resolve, reject) => {
    http
      .get(
        { hostname: '127.0.0.1', port, path: '/register' },
        (res) => {
          resolve({
            status: res.statusCode,
            location: res.headers.location,
          })
        },
      )
      .on('error', reject)
  })

  console.log('GET /register →', getRes.status, 'Location:', getRes.location || '(none)')
  console.log('POST /register →', postBody.status, postBody.body)

  const ok =
    getRes.status === 302 &&
    String(getRes.location || '').includes('/register') &&
    postBody.status === 201 &&
    postBody.body.includes('"user"') &&
    postBody.body.includes('"id"')

  server.close()
  await mongoose.connection.close()
  if (!ok) {
    console.error('VERIFY FAILED')
    process.exit(1)
  }
  console.log('VERIFY OK (this repo register + redirect behave correctly)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

require('dotenv').config()

const client = new MongoClient(process.env.MONGO_URL, {
  useNewUrlParser: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000
})

const submitForm = async (ctx) => {
  if (ctx.request.method === 'POST') {
    return new Promise((resolve, reject) => {
      const m = ctx.request.body
      const memory = {}
      memory.name = m.name || 'anonymous'
      memory.email = m.email || 'anonymous'
      memory.story = m.story || 'no story'
      memory.images = m.images || []
      try {
        MongoClient.connect(process.env.MONGO_URL, {
          useNewUrlParser: true
        }, async (err, client) => {
          assert.equal(null, err)
          const db = client.db('memories')
          db.collection('memories').insertOne(memory, (err, r) => {
            assert.equal(null, err)
            assert.equal(1, r.insertedCount)
            ctx.body = {
              status: 'success',
              insertedCount: r.insertedCount,
              memory
            }
            client.close()
            resolve()
          })
        })
      } catch (e) {
        ctx.body = { status: 'failure' }
        reject(e)
      }
    })
  } else {
    ctx.status = 200
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept')
    ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
  }
}

const fetchGallery = async (ctx) => {
  return new Promise((resolve, reject) => {
    try {
      MongoClient.connect(process.env.MONGO_URL, {
        useNewUrlParser: true
      }, async (err, client) => {
        assert.equal(null, err)
        const db = client.db('memories')
        const memoriesFromDB = await db.collection('memories')
          .find()
          .toArray()
        const memories = Array.from(memoriesFromDB)
          .filter(memory => !memory.skip)
        ctx.body = { status: 'success', count: memories.length, memories }
        resolve()
        client.close()
      })
    } catch (e) {
      ctx.body = { status: 'failure' }
      reject(e)
    }
  })
}

module.exports = {
  submitForm,
  fetchGallery
}

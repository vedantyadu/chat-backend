
const crypto = require('crypto')
require('dotenv').config()

function hash(string) {
  return crypto.createHash(process.env.CRYPTO_HASH_ALGORITHM).update(string).digest(process.env.CRYPTO_DIGEST)
}

module.exports = hash

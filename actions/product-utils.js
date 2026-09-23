/*
* <license header>
*/

/* Shared helper for actions that talk to App Builder Database Storage (aio-lib-db) */

const { Core } = require('@adobe/aio-sdk')
const libDb = require('@adobe/aio-lib-db')

const PRODUCTS_COLLECTION = 'products'

/**
 * Connects to the workspace database, runs the given callback with the
 * `products` collection, and always closes the connection afterwards.
 *
 * Requires the action to have the `include-ims-credentials: true` annotation
 * set in app.config.yaml so that `params.__ims_oauth_s2s` is populated.
 *
 * @param {object} params action input parameters
 * @param {Function} callback async (collection) => any
 * @returns {Promise<any>} whatever the callback returns
 */
async function withProductsCollection (params, callback) {
  const { generateAccessToken } = Core.AuthClient
  const token = await generateAccessToken(params)
  const db = await libDb.init({ token: token.access_token, region: params.DB_REGION })
  const client = await db.connect()
  try {
    const collection = await client.collection(PRODUCTS_COLLECTION)
    return await callback(collection)
  } finally {
    await client.close()
  }
}

module.exports = {
  PRODUCTS_COLLECTION,
  withProductsCollection
}

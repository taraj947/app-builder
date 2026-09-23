/*
* <license header>
*/

const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters } = require('../utils')
const { withProductsCollection } = require('../product-utils')

const FAKE_STORE_API = 'https://fakestoreapi.com/products'

/**
 * Normalizes a fake store product payload into our document shape.
 *
 * @param {object} product raw product data from fakestoreapi.com
 * @returns {object} normalized product document
 */
function normalizeProduct (product) {
  return {
    id: product.id,
    title: product.title,
    price: Number(product.price),
    description: product.description || '',
    category: product.category || 'uncategorized',
    image: product.image || '',
    rating: {
      rate: product?.rating?.rate ?? 0,
      count: product?.rating?.count ?? 0
    }
  }
}

/**
 * Fetches the default product catalog from fakestoreapi.com.
 * fakestoreapi.com rejects requests with no User-Agent/Accept headers (403),
 * which is what node-fetch sends by default, so those are set explicitly here.
 *
 * @returns {Promise<Array>} the raw list of products
 */
async function fetchFakeStoreProducts () {
  let res
  try {
    res = await fetch(FAKE_STORE_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AppBuilderProductIngest/1.0)',
        Accept: 'application/json'
      }
    })
  } catch (networkError) {
    const error = new Error(`request to ${FAKE_STORE_API} failed: ${networkError.message}`)
    error.upstream = true
    throw error
  }
  if (!res.ok) {
    const error = new Error(`request to ${FAKE_STORE_API} failed with status code ${res.status}`)
    error.upstream = true
    throw error
  }
  return res.json()
}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the ingest-products action')
    logger.debug(stringParameters(params))

    // optional protection: if INGEST_API_KEY is configured, require a matching header
    if (params.INGEST_API_KEY && params.__ow_headers?.['x-ingest-key'] !== params.INGEST_API_KEY) {
      return errorResponse(401, 'invalid or missing x-ingest-key header', logger)
    }

    const products = await fetchFakeStoreProducts()
    if (!Array.isArray(products) || products.length === 0) {
      return errorResponse(502, 'fakestoreapi.com returned no products', logger)
    }

    const operations = products.map(product => {
      const doc = normalizeProduct(product)
      return {
        updateOne: {
          filter: { id: doc.id },
          update: { $set: doc },
          upsert: true
        }
      }
    })

    const result = await withProductsCollection(params, (collection) => collection.bulkWrite(operations))

    const response = {
      statusCode: 200,
      body: {
        success: true,
        ingested: products.length,
        upserted: result.upsertedCount,
        modified: result.modifiedCount
      }
    }
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    logger.error(error)
    if (error.upstream) {
      return errorResponse(502, error.message, logger)
    }
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main

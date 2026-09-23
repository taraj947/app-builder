/*
* <license header>
*/

const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters } = require('../utils')
const { withProductsCollection } = require('../product-utils')

const DEFAULT_LIMIT = 6
const MAX_LIMIT = 100
const SORTABLE_FIELDS = {
  price: 'price',
  title: 'title',
  rating: 'rating.rate'
}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the get-products action')
    logger.debug(stringParameters(params))

    const page = Math.max(1, parseInt(params.page, 10) || 1)
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(params.limit, 10) || DEFAULT_LIMIT))
    const sortField = SORTABLE_FIELDS[params.sortBy] || SORTABLE_FIELDS.title
    const sortOrder = params.order === 'desc' ? -1 : 1

    const filter = {}
    if (params.category) {
      filter.category = params.category
    }
    if (params.search) {
      const searchRegex = { $regex: String(params.search).trim(), $options: 'i' }
      filter.$or = [{ title: searchRegex }, { description: searchRegex }]
    }

    const { products, total, categories } = await withProductsCollection(params, async (collection) => {
      const cursor = collection.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)

      const [productsResult, totalResult, categoriesResult] = await Promise.all([
        cursor.toArray(),
        collection.countDocuments(filter),
        collection.distinct('category')
      ])

      return { products: productsResult, total: totalResult, categories: categoriesResult }
    })

    const response = {
      statusCode: 200,
      body: {
        success: true,
        products,
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit))
        }
      }
    }
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    logger.error(error)
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main

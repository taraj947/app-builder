/*
* <license header>
*/

const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
const { withProductsCollection } = require('../product-utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the get-product-details action')
    logger.debug(stringParameters(params))

    const errorMessage = checkMissingRequestInputs(params, ['id'], [])
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return errorResponse(400, "'id' must be a number", logger)
    }

    const product = await withProductsCollection(params, (collection) => collection.findOne({ id }))

    if (!product) {
      return errorResponse(404, `no product found with id '${params.id}'`, logger)
    }

    const response = {
      statusCode: 200,
      body: { success: true, product }
    }
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    logger.error(error)
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main

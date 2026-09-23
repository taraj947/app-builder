/*
* <license header>
*/

const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters } = require('../utils')
const { verifyToken } = require('../auth-utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the validate-token action')
    logger.debug(stringParameters(params))

    if (!params.JWT_SECRET) {
      logger.error('JWT_SECRET is not configured')
      return errorResponse(500, 'server error', logger)
    }

    const token = getBearerToken(params) || params.token
    if (!token) {
      return errorResponse(400, "missing parameter(s) 'token' or 'Authorization' header", logger)
    }

    try {
      const decoded = verifyToken(token, params.JWT_SECRET)
      const response = {
        statusCode: 200,
        body: { valid: true, user: { email: decoded.email, name: decoded.name } }
      }
      logger.info(`${response.statusCode}: successful request`)
      return response
    } catch (verifyError) {
      logger.info(`token validation failed: ${verifyError.message}`)
      return {
        statusCode: 401,
        body: { valid: false, error: 'invalid or expired token' }
      }
    }
  } catch (error) {
    logger.error(error)
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main

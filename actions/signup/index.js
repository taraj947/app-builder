/*
* <license header>
*/

const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
const { createUser, hashPassword } = require('../auth-utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the signup action')
    logger.debug(stringParameters(params))

    const requiredParams = ['email', 'password']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, [])
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const { email, password, name = '' } = params

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse(400, 'invalid email format', logger)
    }
    if (typeof password !== 'string' || password.length < 8) {
      return errorResponse(400, 'password must be at least 8 characters', logger)
    }

    const passwordHash = await hashPassword(password)
    const created = await createUser({ email: email.trim().toLowerCase(), name, passwordHash, createdAt: new Date().toISOString() })

    if (!created) {
      return errorResponse(409, 'a user with this email already exists', logger)
    }

    const response = {
      statusCode: 201,
      body: { success: true, user: { email: email.trim().toLowerCase(), name } }
    }
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    logger.error(error)
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main

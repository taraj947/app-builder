/*
* <license header>
*/

const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
const { getUserByEmail, comparePassword, generateToken } = require('../auth-utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Calling the login action')
    logger.debug(stringParameters(params))

    const requiredParams = ['email', 'password']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, [])
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    if (!params.JWT_SECRET) {
      logger.error('JWT_SECRET is not configured')
      return errorResponse(500, 'server error', logger)
    }

    const { email, password } = params
    const user = await getUserByEmail(email)
    if (!user) {
      return errorResponse(401, 'invalid email or password', logger)
    }

    const passwordMatches = await comparePassword(password, user.passwordHash)
    if (!passwordMatches) {
      return errorResponse(401, 'invalid email or password', logger)
    }

    const token = generateToken({ email: user.email, name: user.name }, params.JWT_SECRET)

    const response = {
      statusCode: 200,
      body: { success: true, token, user: { email: user.email, name: user.name } }
    }
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    logger.error(error)
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main

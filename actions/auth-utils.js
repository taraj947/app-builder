/*
* <license header>
*/

/* Shared helpers for the signup/login/validate-token actions */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const stateLib = require('@adobe/aio-lib-state')

const SALT_ROUNDS = 10
const TOKEN_EXPIRES_IN = '1h'
const USER_KEY_PREFIX = 'user_'

/**
 * Builds a State store key for a user, since State keys only allow
 * alphanumeric, '-', '_' and '.' characters (emails contain '@').
 *
 * @param {string} email user email
 * @returns {string} sanitized state store key
 */
function emailToKey (email) {
  const normalized = email.trim().toLowerCase()
  return USER_KEY_PREFIX + Buffer.from(normalized).toString('base64url')
}

/**
 * Returns an initialized State store client.
 * Credentials are read automatically from the __OW_NAMESPACE/__OW_API_KEY
 * environment variables injected by Adobe I/O Runtime.
 *
 * @returns {Promise<object>} the State SDK instance
 */
async function getStateStore () {
  return stateLib.init()
}

/**
 * Persists a new user record, failing if one already exists for that email.
 *
 * @param {object} user the user object to store
 * @param {string} user.email user email
 * @param {string} user.name user display name
 * @param {string} user.passwordHash bcrypt hashed password
 * @returns {Promise<boolean>} true if the user was created, false if it already existed
 */
async function createUser (user) {
  const state = await getStateStore()
  const key = emailToKey(user.email)
  const result = await state.put(key, JSON.stringify(user), { ifNotExists: true })
  return result !== null
}

/**
 * Fetches a stored user record by email.
 *
 * @param {string} email user email
 * @returns {Promise<object|undefined>} the parsed user object, or undefined if not found
 */
async function getUserByEmail (email) {
  const state = await getStateStore()
  const key = emailToKey(email)
  const record = await state.get(key)
  return record && JSON.parse(record.value)
}

/**
 * Hashes a plaintext password.
 *
 * @param {string} password plaintext password
 * @returns {Promise<string>} the bcrypt hash
 */
async function hashPassword (password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compares a plaintext password against a bcrypt hash.
 *
 * @param {string} password plaintext password
 * @param {string} passwordHash bcrypt hash to compare against
 * @returns {Promise<boolean>} true if the password matches
 */
async function comparePassword (password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

/**
 * Generates a signed JWT for an authenticated user.
 *
 * @param {object} payload data to embed in the token, e.g. { email, name }
 * @param {string} secret the JWT signing secret
 * @returns {string} the signed JWT
 */
function generateToken (payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRES_IN })
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws if the token is invalid, malformed or expired.
 *
 * @param {string} token the JWT to verify
 * @param {string} secret the JWT signing secret
 * @returns {object} the decoded token payload
 */
function verifyToken (token, secret) {
  return jwt.verify(token, secret)
}

module.exports = {
  emailToKey,
  getStateStore,
  createUser,
  getUserByEmail,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
}

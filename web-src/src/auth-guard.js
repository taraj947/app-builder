/*
* <license header>
*/

/* Shared login-guard helper for pages that require an authenticated user */

import actions from './config.json'
import actionWebInvoke from './utils.js'

export const TOKEN_STORAGE_KEY = 'authToken'
export const USER_STORAGE_KEY = 'authUser'

/**
 * Ensures the current visitor is logged in with a still-valid token.
 * Redirects to login.html and returns null when not authenticated.
 *
 * @returns {Promise<{token: string, user: object}|null>} session info, or null if redirected
 */
export async function requireAuth () {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!token) {
    window.location.href = './login.html'
    return null
  }

  const actionUrl = actions['validate-token'] || actions['app builder2/validate-token']
  if (actionUrl) {
    try {
      const result = await actionWebInvoke(actionUrl, { authorization: `Bearer ${token}` }, {})
      if (!result || !result.valid) {
        clearSession()
        window.location.href = './login.html'
        return null
      }
    } catch (e) {
      clearSession()
      window.location.href = './login.html'
      return null
    }
  }

  return { token, user: safeParse(window.localStorage.getItem(USER_STORAGE_KEY)) }
}

/**
 * Clears the stored session, e.g. on logout or invalid token.
 */
export function clearSession () {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

function safeParse (val) {
  try {
    return JSON.parse(val)
  } catch (e) {
    return null
  }
}

/*
* <license header>
*/

import actions from './config.json'
import actionWebInvoke from './utils.js'
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './auth-guard.js'

window.onload = () => {
  document.getElementById('loginForm').onsubmit = (event) => {
    event.preventDefault()
    doLogin()
  }
}

async function doLogin () {
  const taOutput = document.getElementById('taOutput')
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  const actionUrl = actions.login || actions['app builder2/login']
  if (!actionUrl) {
    taOutput.innerHTML = 'login action is not deployed yet, run "aio app deploy"'
    return
  }

  taOutput.innerHTML = 'logging in ...'
  try {
    const result = await actionWebInvoke(actionUrl, {}, { email, password })
    if (result && result.success && result.token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, result.token)
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user))
      window.location.href = './products.html'
      return
    }
    taOutput.innerHTML = JSON.stringify(result, 0, 2)
  } catch (err) {
    taOutput.innerHTML = err.message
  }
}

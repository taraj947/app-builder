/*
* <license header>
*/

import actions from './config.json'
import actionWebInvoke from './utils.js'

window.onload = () => {
  document.getElementById('signupForm').onsubmit = (event) => {
    event.preventDefault()
    doSignup()
  }
}

async function doSignup () {
  const taOutput = document.getElementById('taOutput')
  const name = document.getElementById('name').value
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  const actionUrl = actions.signup || actions['app builder2/signup']
  if (!actionUrl) {
    taOutput.innerHTML = 'signup action is not deployed yet, run "aio app deploy"'
    return
  }

  taOutput.innerHTML = 'signing up ...'
  try {
    const result = await actionWebInvoke(actionUrl, {}, { name, email, password })
    taOutput.innerHTML = JSON.stringify(result, 0, 2)
    if (result && result.success) {
      window.location.href = './login.html'
    }
  } catch (err) {
    taOutput.innerHTML = err.message
  }
}

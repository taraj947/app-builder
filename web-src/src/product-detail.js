/*
* <license header>
*/

import actions from './config.json'
import actionWebInvoke from './utils.js'
import { requireAuth, clearSession } from './auth-guard.js'

window.onload = async () => {
  const session = await requireAuth()
  if (!session) return

  document.getElementById('userLabel').innerText = session.user?.email ? `Signed in as ${session.user.email}` : ''
  document.getElementById('logoutBtn').onclick = () => {
    clearSession()
    window.location.href = './login.html'
  }

  const id = new URLSearchParams(window.location.search).get('id')
  if (!id) {
    document.getElementById('statusEl').innerText = 'no product id was given'
    return
  }

  await loadProductDetails(id, session.token)
}

async function loadProductDetails (id, token) {
  const statusEl = document.getElementById('statusEl')
  const detailEl = document.getElementById('detailEl')

  const actionUrl = actions['get-product-details'] || actions['app builder2/get-product-details']
  if (!actionUrl) {
    statusEl.innerText = 'get-product-details action is not deployed yet, run "aio app deploy"'
    return
  }

  statusEl.innerText = 'Loading product...'
  detailEl.innerHTML = ''

  try {
    const result = await actionWebInvoke(
      actionUrl,
      { authorization: `Bearer ${token}` },
      { id },
      { method: 'GET' }
    )
    statusEl.innerText = ''
    renderProduct(result.product)
  } catch (err) {
    statusEl.innerText = `Error loading product: ${err.message}`
  }
}

function renderProduct (product) {
  const detailEl = document.getElementById('detailEl')
  detailEl.innerHTML = `
    <div class="pdp-layout">
      <div class="pdp-image"><img src="${product.image}" alt="${escapeHtml(product.title)}"></div>
      <div class="pdp-info">
        <span class="plp-card-category">${escapeHtml(product.category)}</span>
        <h2>${escapeHtml(product.title)}</h2>
        <p class="pdp-price">$${Number(product.price).toFixed(2)}</p>
        <p class="pdp-rating">★ ${product.rating?.rate ?? '-'} (${product.rating?.count ?? 0} reviews)</p>
        <p class="pdp-description">${escapeHtml(product.description)}</p>
      </div>
    </div>
  `
}

function escapeHtml (str) {
  const div = document.createElement('div')
  div.innerText = String(str ?? '')
  return div.innerHTML
}

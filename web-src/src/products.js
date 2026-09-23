/*
* <license header>
*/

import actions from './config.json'
import actionWebInvoke from './utils.js'
import { requireAuth, clearSession, TOKEN_STORAGE_KEY } from './auth-guard.js'

const state = {
  search: '',
  category: '',
  sortBy: 'title',
  order: 'asc',
  limit: 6,
  page: 1
}

let searchDebounceTimer = null

window.onload = async () => {
  const session = await requireAuth()
  if (!session) return

  document.getElementById('userLabel').innerText = session.user?.email ? `Signed in as ${session.user.email}` : ''

  document.getElementById('logoutBtn').onclick = () => {
    clearSession()
    window.location.href = './login.html'
  }

  document.getElementById('searchInput').oninput = (event) => {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => {
      state.search = event.target.value
      state.page = 1
      loadProducts()
    }, 350)
  }

  document.getElementById('categorySelect').onchange = (event) => {
    state.category = event.target.value
    state.page = 1
    loadProducts()
  }

  document.getElementById('sortSelect').onchange = (event) => {
    const [sortBy, order] = event.target.value.split(':')
    state.sortBy = sortBy
    state.order = order
    state.page = 1
    loadProducts()
  }

  await loadProducts()
}

async function loadProducts () {
  const statusEl = document.getElementById('statusEl')
  const gridEl = document.getElementById('gridEl')
  const paginationEl = document.getElementById('paginationEl')
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)

  const actionUrl = actions['get-products'] || actions['app builder2/get-products']
  if (!actionUrl) {
    statusEl.innerText = 'get-products action is not deployed yet, run "aio app deploy"'
    return
  }

  statusEl.innerText = 'Loading products...'
  gridEl.innerHTML = ''
  paginationEl.innerHTML = ''

  try {
    const params = {
      page: state.page,
      limit: state.limit,
      sortBy: state.sortBy,
      order: state.order
    }
    if (state.search) params.search = state.search
    if (state.category) params.category = state.category

    const result = await actionWebInvoke(
      actionUrl,
      { authorization: `Bearer ${token}` },
      params,
      { method: 'GET' }
    )

    populateCategories(result.categories || [])

    if (!result.products || result.products.length === 0) {
      if (result.pagination?.total === 0 && state.page === 1 && !state.search && !state.category) {
        await ingestAndReload()
        return
      }
      statusEl.innerText = ''
      renderEmptyState()
      return
    }

    statusEl.innerText = `Showing ${result.products.length} of ${result.pagination.total} products`
    renderGrid(result.products)
    renderPagination(result.pagination)
  } catch (err) {
    statusEl.innerText = `Error loading products: ${err.message}`
  }
}

function populateCategories (categories) {
  const select = document.getElementById('categorySelect')
  const current = select.value
  const options = ['<option value="">All categories</option>']
    .concat(categories.map(c => `<option value="${c}">${capitalize(c)}</option>`))
  select.innerHTML = options.join('')
  select.value = current
}

function capitalize (str) {
  return String(str).replace(/\b\w/g, c => c.toUpperCase())
}

function renderGrid (products) {
  const gridEl = document.getElementById('gridEl')
  gridEl.innerHTML = products.map(p => `
    <a class="plp-card" href="./product-detail.html?id=${encodeURIComponent(p.id)}">
      <div class="plp-card-image"><img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy"></div>
      <span class="plp-card-category">${escapeHtml(p.category)}</span>
      <h3 class="plp-card-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</h3>
      <div class="plp-card-footer">
        <span class="plp-card-price">$${Number(p.price).toFixed(2)}</span>
        <span class="plp-card-rating">★ ${p.rating?.rate ?? '-'}</span>
      </div>
    </a>
  `).join('')
}

function escapeHtml (str) {
  const div = document.createElement('div')
  div.innerText = String(str ?? '')
  return div.innerHTML
}

function renderEmptyState () {
  const gridEl = document.getElementById('gridEl')
  gridEl.innerHTML = '<div class="plp-empty"><p>No products match your filters.</p></div>'
}

async function ingestAndReload () {
  const statusEl = document.getElementById('statusEl')
  const actionUrl = actions['ingest-products'] || actions['app builder2/ingest-products']
  if (!actionUrl) {
    statusEl.innerText = 'ingest-products action is not deployed yet, run "aio app deploy"'
    return
  }
  statusEl.innerText = 'Loading products from fakestoreapi.com ...'
  try {
    await actionWebInvoke(actionUrl, {}, {})
    await loadProducts()
  } catch (err) {
    statusEl.innerText = `Error loading products: ${err.message}`
  }
}

function renderPagination (pagination) {
  const paginationEl = document.getElementById('paginationEl')
  const { page, totalPages } = pagination
  const buttons = []

  buttons.push(`<button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Prev</button>`)

  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) {
    buttons.push(`<button type="button" data-page="${i}" class="${i === page ? 'active' : ''}">${i}</button>`)
  }

  buttons.push(`<button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>Next</button>`)

  paginationEl.innerHTML = buttons.join('')
  paginationEl.querySelectorAll('button[data-page]').forEach(btn => {
    btn.onclick = () => {
      state.page = Number(btn.dataset.page)
      loadProducts()
    }
  })
}

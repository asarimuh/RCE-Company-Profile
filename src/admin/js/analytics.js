import '../css/admin-components.css'
import { requireAuth, logout, getCurrentUser } from './admin-auth.js'
import { supabase } from './admin-supabase.js'
import { formatNumber, compactNumber, platformBadge, getPrimaryHandle, getPrimaryFollowers, setHeaderDate, setSidebarUser } from './admin-utils.js'

const session = await requireAuth()
if (!session) throw new Error('Unauthenticated')

setHeaderDate()
const user = await getCurrentUser()
setSidebarUser(user)
document.getElementById('logoutBtn').addEventListener('click', logout)

const summaryCards = document.getElementById('summaryCards')
const platformChart = document.getElementById('platformChart')
const monthlyChart = document.getElementById('monthlyChart')
const categoryList = document.getElementById('categoryList')
const highlightsList = document.getElementById('highlightsList')

async function loadAnalytics () {
  const { data, error } = await supabase
    .from('talent_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    summaryCards.innerHTML = '<div class="empty-state">Gagal memuat analytics.</div>'
    console.error(error)
    return
  }

  const rows = data ?? []
  const total = rows.length
  const thisMonth = rows.filter((row) => isInCurrentMonth(row.created_at)).length
  const today = rows.filter((row) => isToday(row.created_at)).length
  const withFollowers = rows.filter((row) => getPrimaryFollowers(row) !== null && getPrimaryFollowers(row) !== undefined)

  const platformCounts = rows.reduce((acc, row) => {
    const platform = row.primary_platform || 'other'
    acc[platform] = (acc[platform] || 0) + 1
    return acc
  }, {})

  const monthlyCounts = buildMonthlyTrend(rows)
  const categoryCounts = buildCategoryCounts(rows)
  const topTalent = [...rows]
    .filter((row) => getPrimaryFollowers(row) !== null && getPrimaryFollowers(row) !== undefined)
    .sort((a, b) => (getPrimaryFollowers(b) || 0) - (getPrimaryFollowers(a) || 0))
    .slice(0, 5)

  renderSummaryCards({ total, thisMonth, today, withFollowers: withFollowers.length })
  renderPlatformChart(platformCounts)
  renderMonthlyChart(monthlyCounts)
  renderCategoryList(categoryCounts)
  renderHighlights(topTalent)
}

function renderSummaryCards ({ total, thisMonth, today, withFollowers }) {
  const cards = [
    { label: 'Total Pendaftar', value: formatNumber(total), sub: 'Semua data yang masuk', tone: 'pink' },
    { label: 'Pendaftar Bulan Ini', value: formatNumber(thisMonth), sub: 'Aktivitas terbaru', tone: 'green' },
    { label: 'Pendaftar Hari Ini', value: formatNumber(today), sub: 'Perkembangan harian', tone: 'blue' },
    { label: 'Memiliki Followers', value: formatNumber(withFollowers), sub: 'Sudah punya metrik utama', tone: 'pink' },
  ]

  summaryCards.innerHTML = cards.map((card) => `
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--${card.tone}">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div class="stat-card__body">
        <div class="stat-card__label">${card.label}</div>
        <div class="stat-card__value">${card.value}</div>
        <div class="stat-card__sub">${card.sub}</div>
      </div>
    </div>
  `).join('')
}

function renderPlatformChart(platformCounts) {
  const labels = [
    { key: 'tiktok', label: 'TikTok', color: '#ff62f4' },
    { key: 'instagram', label: 'Instagram', color: '#f43f5e' },
    { key: 'youtube', label: 'YouTube', color: '#38bdf8' },
    { key: 'other', label: 'Lainnya', color: '#8b5cf6' },
  ]

  const entries = labels.map((item) => ({ ...item, count: platformCounts[item.key] || 0 }))
  const total = entries.reduce((sum, item) => sum + item.count, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  const segments = entries.map((item) => {
    const length = total ? (item.count / total) * circumference : 0
    const dash = `${length} ${circumference - length}`
    const dashOffset = -offset
    offset += length
    return { ...item, dash, dashOffset }
  })

  if (!total) {
    platformChart.innerHTML = `
      <div class="platform-chart platform-chart--empty">
        <div class="platform-chart__visual">
          <svg viewBox="0 0 140 140" class="platform-chart__svg" aria-label="Belum ada data platform">
            <circle cx="70" cy="70" r="42" class="platform-chart__ring platform-chart__ring--empty"></circle>
          </svg>
          <div class="platform-chart__center">
            <span>0</span>
            <small>pendaftar</small>
          </div>
        </div>
        <div class="platform-chart__legend">
          <div class="platform-chart__legend-item"><span class="platform-chart__dot" style="background:#ff62f4"></span>Belum ada data</div>
        </div>
      </div>
    `
    return
  }

  const chartMarkup = `
    <div class="platform-chart">
      <div class="platform-chart__visual">
        <svg viewBox="0 0 140 140" class="platform-chart__svg" aria-label="Distribusi platform">
          <circle cx="70" cy="70" r="42" class="platform-chart__ring"></circle>
          ${segments.map((item) => `
            <circle
              cx="70"
              cy="70"
              r="42"
              class="platform-chart__segment"
              stroke="${item.color}"
              stroke-dasharray="${item.dash}"
              stroke-dashoffset="${item.dashOffset}"
            ></circle>
          `).join('')}
        </svg>
        <div class="platform-chart__center">
          <span>${total}</span>
          <small>pendaftar</small>
        </div>
      </div>
      <div class="platform-chart__legend">
        ${segments.map((item) => `
          <div class="platform-chart__legend-item">
            <span class="platform-chart__dot" style="background:${item.color}"></span>
            <span class="platform-chart__legend-label">${item.label}</span>
            <strong>${item.count}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `

  platformChart.innerHTML = chartMarkup
}

function renderMonthlyChart(monthlyCounts) {
  const months = Object.entries(monthlyCounts).slice(-6)
  const max = Math.max(1, ...months.map(([, count]) => count))
  const width = 320
  const height = 180
  const padding = 24
  const chartHeight = height - padding * 2

  const coords = months.map(([month, count], index) => {
    const x = padding + (index / Math.max(1, months.length - 1)) * (width - padding * 2)
    const y = height - padding - (count / max) * chartHeight
    return { month, count, x, y }
  })

  const linePath = coords.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`

  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding + chartHeight * (1 - ratio)
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="monthly-chart__grid"></line>`
  }).join('')

  const points = coords.map(({ x, y, count, month }) => `
    <g>
      <circle cx="${x}" cy="${y}" r="5" class="monthly-chart__point"></circle>
      <circle cx="${x}" cy="${y}" r="10" class="monthly-chart__point monthly-chart__point--halo"></circle>
      <text x="${x}" y="${height - 6}" text-anchor="middle" class="monthly-chart__label">${formatMonthLabel(month)}</text>
      <text x="${x}" y="${y - 10}" text-anchor="middle" class="monthly-chart__value">${count}</text>
    </g>
  `).join('')

  monthlyChart.innerHTML = `
    <div class="monthly-chart__wrap">
      <svg viewBox="0 0 ${width} ${height}" class="monthly-chart__svg" aria-label="Tren pendaftaran bulanan">
        <defs>
          <linearGradient id="monthlyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ff62f4"></stop>
            <stop offset="100%" stop-color="#7c3aed"></stop>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaPath}" class="monthly-chart__area"></path>
        <path d="${linePath}" class="monthly-chart__line"></path>
        ${points}
      </svg>
    </div>
  `
}

function renderCategoryList(categoryCounts) {
  const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const total = sorted.reduce((sum, [, count]) => sum + count, 0)

  categoryList.innerHTML = sorted.map(([category, count]) => {
    const pct = total ? Math.round((count / total) * 100) : 0
    return `
      <div class="category-item">
        <div class="category-item__meta">
          <div class="category-item__name">${labelCategory(category)}</div>
          <div class="category-item__sub">${count} pendaftar</div>
        </div>
        <div class="category-item__bar">
          <div class="category-item__fill" style="width:${Math.max(10, pct)}%"></div>
        </div>
        <div class="category-item__count">${pct}%</div>
      </div>
    `
  }).join('')
}

function renderHighlights(rows) {
  if (!rows.length) {
    highlightsList.innerHTML = `
      <div class="empty-state empty-state--compact">
        <h3>Belum ada data followers</h3>
        <p>Data pendaftar dengan metrik followers akan tampil di sini.</p>
      </div>
    `
    return
  }

  highlightsList.innerHTML = rows.map((row) => {
    const followers = compactNumber(getPrimaryFollowers(row))
    return `
      <div class="mini-list__item">
        <div class="mini-list__main">
          <div class="mini-list__name">${escHtml(row.full_name)}</div>
          <div class="mini-list__meta">${platformBadge(row.primary_platform).replace(/<[^>]+>/g, '')} · ${getPrimaryHandle(row) ? `@${getPrimaryHandle(row)}` : '—'}</div>
        </div>
        <div class="mini-list__value">${followers}</div>
      </div>
    `
  }).join('')
}

function buildMonthlyTrend(rows) {
  const counts = {}
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(key)
    counts[key] = 0
  }

  rows.forEach((row) => {
    const createdAt = row.created_at
    if (!createdAt) return
    const date = new Date(createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (counts[key] !== undefined) counts[key] += 1
  })

  return counts
}

function buildCategoryCounts(rows) {
  return rows.reduce((acc, row) => {
    const categories = Array.isArray(row.content_category) ? row.content_category : []
    categories.forEach((category) => {
      acc[category] = (acc[category] || 0) + 1
    })
    return acc
  }, {})
}

function isToday(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

function isInCurrentMonth(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('id-ID', { month: 'short' })
}

function labelCategory(category) {
  const labels = {
    lifestyle: 'Lifestyle',
    fashion: 'Fashion',
    beauty: 'Beauty',
    gaming: 'Gaming',
    food: 'Food & Kuliner',
    travel: 'Travel',
    education: 'Edukasi',
    entertainment: 'Entertainment',
    tech: 'Teknologi',
    fitness: 'Fitness & Health',
    business: 'Bisnis',
    other: 'Lainnya',
  }

  return labels[category] || category || 'Lainnya'
}

function escHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

await loadAnalytics()

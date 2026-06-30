// ============================================================
// kol-database.js
// Full table with search, filter, sort, pagination, detail panel, delete
// ============================================================

import '../css/admin-components.css'
import { requireAuth, logout, getCurrentUser } from './admin-auth.js'
import { supabase, updateVerificationStatus } from './admin-supabase.js'
import {
  formatDate, compactNumber, platformBadge,
  getPrimaryHandle, getPrimaryFollowers,
  getInitials, showToast, showConfirm,
  debounce, setHeaderDate, setSidebarUser
} from './admin-utils.js'
import ExcelJS from 'exceljs/dist/exceljs.min.js'

// ── Auth ──────────────────────────────────────────────────────
const session = await requireAuth()
if (!session) throw new Error('Unauthenticated')

setHeaderDate()
const user = await getCurrentUser()
setSidebarUser(user)
document.getElementById('logoutBtn').addEventListener('click', logout)

// ── State ─────────────────────────────────────────────────────
const state = {
  search:    '',
  platform:  '',
  category:  '',
  status:    '',
  viewMode:  'all',
  sortCol:   'created_at',
  sortDir:   'desc',
  page:      1,
  pageSize:  10,
  total:     0,
}

// ── Elements ──────────────────────────────────────────────────
const tableBody         = document.getElementById('tableBody')
const paginationInfo    = document.getElementById('paginationInfo')
const paginationControls= document.getElementById('paginationControls')
const searchInput       = document.getElementById('searchInput')
const filterPlatform    = document.getElementById('filterPlatform')
const filterCategory    = document.getElementById('filterCategory')
const filterStatus      = document.getElementById('filterStatus')
const filterView        = document.getElementById('filterView')
const pageSizeSelect    = document.getElementById('pageSize')

// ── Fetch data from Supabase ──────────────────────────────────
async function fetchData () {
  const from = (state.page - 1) * state.pageSize
  const to   = from + state.pageSize - 1

  const buildQuery = (tableName, statusField = 'verification_status') => {
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })

    if (state.search) {
      const term = state.search.trim()
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,tiktok_handle.ilike.%${term}%,instagram_handle.ilike.%${term}%,youtube_handle.ilike.%${term}%,whatsapp_number.ilike.%${term}%`
      )
    }

    if (state.platform) query = query.eq('primary_platform', state.platform)
    if (state.category) query = query.contains('content_category', [state.category])
    if (state.status) query = query.eq(statusField, state.status)
    if (state.viewMode === 'verified' && !state.status) query = query.neq(statusField, 'pending')

    if (state.sortCol === 'followers') {
      query = query.order('follower_count_tt', { ascending: state.sortDir === 'asc', nullsFirst: false })
    } else {
      query = query.order(state.sortCol, { ascending: state.sortDir === 'asc', nullsFirst: false })
    }

    return query.range(from, to)
  }

  let query = buildQuery('data_kol_koc', 'verification_status')
  let { data, count, error } = await query

  if (error) {
    const message = error.message?.toLowerCase() || ''
    const canFallback = message.includes('relation') || message.includes('does not exist') || message.includes('not found') || message.includes('column')
    if (canFallback) {
      query = buildQuery('data_kol_koc', 'status')
      const fallbackResult = await query
      data = fallbackResult.data
      count = fallbackResult.count
      error = fallbackResult.error
    }
  }

  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

// ── Render table ──────────────────────────────────────────────
function renderTable (rows) {
  if (!rows.length) {
    tableBody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>Tidak ada data</h3>
          <p>Coba ubah kata kunci atau filter pencarian.</p>
        </div>
      </td></tr>`
    return
  }

  tableBody.innerHTML = rows.map(row => {
    const handle    = getPrimaryHandle(row)
    const followers = getPrimaryFollowers(row)

    return `
      <tr data-id="${row.id}">
        <td class="cell-name">${escHtml(row.full_name)}</td>
        <td>${platformBadge(row.primary_platform)}</td>
        <td class="cell-muted">${handle ? `@${escHtml(handle)}` : '—'}</td>
        <td>${followers !== null ? compactNumber(followers) : '—'}</td>
        <td class="cell-muted">${escHtml(row.whatsapp_number)}</td>
        <td class="cell-muted">${escHtml(row.email)}</td>
        <td class="cell-muted">${escHtml(row.city ?? '—')}</td>
        <td>${statusBadgeInline(getRecordStatus(row))}</td>
        <td class="cell-muted">${formatDate(row.created_at)}</td>
        <td class="cell-actions">
          <button class="action-btn delete-btn" data-id="${row.id}" data-name="${escHtml(row.full_name)}" title="Hapus">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </td>
      </tr>`
  }).join('')

  // Row click → open detail (ignore delete button clicks)
  tableBody.querySelectorAll('tr[data-id]').forEach(tr => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return
      openDetail(tr.dataset.id)
    })
  })

  // Delete button clicks
  tableBody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleDelete(btn.dataset.id, btn.dataset.name)
    })
  })
}

// ── Render pagination ─────────────────────────────────────────
function renderPagination () {
  const totalPages = Math.ceil(state.total / state.pageSize)
  const from       = state.total === 0 ? 0 : (state.page - 1) * state.pageSize + 1
  const to         = Math.min(state.page * state.pageSize, state.total)

  paginationInfo.textContent = `Menampilkan ${from}–${to} dari ${state.total} pendaftar`

  // Build page buttons
  const pages = []
  pages.push(`<button class="admin-pagination__btn" id="prevBtn" ${state.page <= 1 ? 'disabled' : ''}>←</button>`)

  // Show max 5 page buttons around current
  const range = 2
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= state.page - range && i <= state.page + range)) {
      pages.push(`<button class="admin-pagination__btn ${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`)
    } else if (i === state.page - range - 1 || i === state.page + range + 1) {
      pages.push(`<span style="color:var(--admin-text-muted);padding:0 4px;">…</span>`)
    }
  }

  pages.push(`<button class="admin-pagination__btn" id="nextBtn" ${state.page >= totalPages ? 'disabled' : ''}>→</button>`)

  paginationControls.innerHTML = pages.join('')

  paginationControls.querySelector('#prevBtn')?.addEventListener('click', () => {
    if (state.page > 1) { state.page--; loadTable() }
  })

  paginationControls.querySelector('#nextBtn')?.addEventListener('click', () => {
    if (state.page < totalPages) { state.page++; loadTable() }
  })

  paginationControls.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = parseInt(btn.dataset.page)
      loadTable()
    })
  })
}

// ── Update sort headers ───────────────────────────────────────
function updateSortHeaders () {
  document.querySelectorAll('.admin-table th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc')
    if (th.dataset.col === state.sortCol) {
      th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc')
    }
  })
}

// ── Main load function ────────────────────────────────────────
async function loadTable () {
  tableBody.innerHTML = `<tr><td colspan="9"><div style="padding:40px 0;"><div class="empty-state"><div class="spinner"></div></div></div></td></tr>`

  try {
    const { data, count } = await fetchData()
    state.total = count
    renderTable(data)
    renderPagination()
    updateSortHeaders()
  } catch (err) {
    console.error(err)
    tableBody.innerHTML = `
      <tr><td colspan="10">
        <div class="empty-state">
          <h3>Gagal memuat data</h3>
          <p>${err?.message || 'Terjadi kesalahan yang tidak diketahui.'}</p>
        </div>
      </td></tr>`
  }
}

// ── Delete handler ────────────────────────────────────────────
function handleDelete (id, name) {
  showConfirm({
    title:         'Hapus Pendaftar',
    message:       `Yakin ingin menghapus data <strong>${name}</strong>? Tindakan ini tidak dapat dibatalkan.`,
    confirmLabel:  'Ya, Hapus',
    onConfirm:     async () => {
      try {
        const { error } = await supabase
          .from('data_kol_koc')
          .delete()
          .eq('id', id)

        if (error) throw error

        showToast(`Data ${name} berhasil dihapus.`)
        closeDetail()
        loadTable()
      } catch (err) {
        console.error('Delete error:', err)
        showToast('Gagal menghapus data.', 'error')
      }
    }
  })
}

// ── Detail panel ──────────────────────────────────────────────
function openDetail (id) {
  // Update URL without navigation
  const url = new URL(window.location)
  url.searchParams.set('open', id)
  window.history.pushState({}, '', url)

  renderDetailPanel(id)
}

function closeDetail () {
  const url = new URL(window.location)
  url.searchParams.delete('open')
  window.history.pushState({}, '', url)

  const overlay = document.getElementById('detailOverlay')
  const panel   = document.getElementById('detailPanel')
  if (panel)   panel.style.animation = 'slideIn 0.25s reverse forwards'
  if (overlay) overlay.style.animation = 'fadeIn 0.2s reverse forwards'
  setTimeout(() => {
    document.getElementById('detailMount').innerHTML = ''
  }, 250)
}

async function renderDetailPanel (id) {
  const mount = document.getElementById('detailMount')

  mount.innerHTML = `
    <div class="detail-overlay" id="detailOverlay"></div>
    <div class="detail-panel" id="detailPanel">
      <div class="detail-panel__header">
        <div class="detail-panel__title">Detail Pendaftar</div>
        <button class="detail-panel__close" id="closeDetail">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="detail-panel__body" id="detailBody">
        <div class="empty-state" style="padding:60px 0;"><div class="spinner"></div></div>
      </div>
      <div class="detail-panel__footer" id="detailFooter"></div>
    </div>`

  document.getElementById('closeDetail').addEventListener('click', closeDetail)
  document.getElementById('detailOverlay').addEventListener('click', closeDetail)

  // Fetch full record
  const { data, error } = await supabase
    .from('data_kol_koc')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    document.getElementById('detailBody').innerHTML = `
      <div class="empty-state"><h3>Data tidak ditemukan</h3></div>`
    return
  }

  document.getElementById('detailBody').innerHTML = buildDetailHTML(data)

  // Footer actions
  document.getElementById('detailFooter').innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between;width:100%;">
      <button class="btn btn--danger" id="detailDeleteBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        Hapus Data
      </button>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <select class="admin-filter" id="statusSelect">
          <option value="pending">Pending</option>
          <option value="reviewing">Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
        </select>
        <button class="btn btn--primary" id="detailSaveBtn">Simpan Status</button>
      </div>
    </div>`

  document.getElementById('statusSelect').value = data.verification_status ?? data.status ?? 'pending'

  document.getElementById('detailDeleteBtn').addEventListener('click', () => {
    handleDelete(data.id, data.full_name)
  })

  document.getElementById('detailSaveBtn').addEventListener('click', async () => {
    const nextStatus = document.getElementById('statusSelect').value
    try {
      await updateRecordStatus(data.id, nextStatus, data)

      showToast('Status berhasil diperbarui.')
      await loadTable()
      await renderDetailPanel(data.id)
    } catch (err) {
      console.error('Update status error:', err)
      showToast(getStatusUpdateErrorMessage(err), 'error')
    }
  })
}

function buildDetailHTML (d) {
  const field = (label, value, full = false) => `
    <div class="detail-field ${full ? 'detail-field--full' : ''}">
      <div class="detail-field__label">${label}</div>
      <div class="detail-field__value ${!value ? 'detail-field__value--muted' : ''}">${value || 'Tidak diisi'}</div>
    </div>`

  const link = (label, value, href, full = false) => `
    <div class="detail-field ${full ? 'detail-field--full' : ''}">
      <div class="detail-field__label">${label}</div>
      <div class="detail-field__value">${value ? `<a href="${href}" target="_blank" rel="noopener">${value}</a>` : '<span class="detail-field__value--muted">Tidak diisi</span>'}</div>
    </div>`

  const categories = (d.content_category ?? [])
    .map(c => `<span class="detail-tag">${c}</span>`).join('') || '<span class="detail-field__value--muted">Tidak diisi</span>'

  const genderMap = { male: 'Laki-laki', female: 'Perempuan', prefer_not_to_say: 'Tidak disebutkan' }

  return `
    <!-- Identity -->
    <div class="detail-section">
      <div class="detail-section__title">Data Diri</div>
      <div class="detail-grid">
        ${field('Nama Lengkap', escHtml(d.full_name), true)}
        ${field('Tanggal Lahir', d.date_of_birth ? formatDate(d.date_of_birth) : null)}
        ${field('Jenis Kelamin', genderMap[d.gender] ?? null)}
        ${field('Kota', escHtml(d.city))}
        ${field('Provinsi', escHtml(d.province))}
        ${field('Negara', escHtml(d.country))}
      </div>
    </div>

    <!-- Contact -->
    <div class="detail-section">
      <div class="detail-section__title">Kontak</div>
      <div class="detail-grid">
        ${field('Email', `<a href="mailto:${escHtml(d.email)}">${escHtml(d.email)}</a>`, true)}
        ${link('WhatsApp', d.whatsapp_number ? escHtml(d.whatsapp_number) : null, `https://wa.me/${d.whatsapp_number?.replace(/\D/g,'')}`, true)}
        ${link('TikTok', d.tiktok_handle ? `@${escHtml(d.tiktok_handle)}` : null, `https://tiktok.com/@${d.tiktok_handle}`)}
        ${link('Instagram', d.instagram_handle ? `@${escHtml(d.instagram_handle)}` : null, `https://instagram.com/${d.instagram_handle}`)}
        ${link('YouTube', d.youtube_handle ? `@${escHtml(d.youtube_handle)}` : null, `https://youtube.com/@${d.youtube_handle}`)}
        ${d.other_platform ? field('Platform Lain', escHtml(d.other_platform)) : ''}
      </div>
    </div>

    <!-- Creator Profile -->
    <div class="detail-section">
      <div class="detail-section__title">Profil Kreator</div>
      <div class="detail-grid">
        ${field('Platform Utama', d.primary_platform ? platformBadge(d.primary_platform) : null)}
        ${field('Followers TikTok', d.follower_count_tt?.toLocaleString('id-ID') ?? null)}
        ${field('Followers Instagram', d.follower_count_ig?.toLocaleString('id-ID') ?? null)}
        ${field('Subscribers YouTube', d.follower_count_yt?.toLocaleString('id-ID') ?? null)}
        <div class="detail-field detail-field--full">
          <div class="detail-field__label">Kategori Konten</div>
          <div class="detail-tags">${categories}</div>
        </div>
        ${field('Deskripsi Konten', escHtml(d.content_description), true)}
        ${d.portfolio_url ? link('Portfolio / Link', d.portfolio_url, d.portfolio_url, true) : field('Portfolio / Link', null, true)}
      </div>
    </div>

    <!-- Meta -->
    <div class="detail-section">
      <div class="detail-section__title">Informasi Pendaftaran</div>
      <div class="detail-grid">
        ${field('Status', statusBadgeInline(getRecordStatus(d)))}
        ${field('Tanggal Daftar', formatDate(d.created_at))}
        ${field('Terakhir Diperbarui', formatDate(d.updated_at))}
      </div>
    </div>`
}

function getRecordStatus (row) {
  return row?.verification_status ?? row?.status ?? 'pending'
}

function getStatusUpdateErrorMessage (error) {
  const message = error?.message || ''
  const lower = message.toLowerCase()

  if (lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('policy')) {
    return 'Update ditolak oleh policy Supabase. Periksa RLS table di dashboard Supabase.'
  }

  if (lower.includes('does not exist') || lower.includes('42703') || (lower.includes('column') && lower.includes('not exist'))) {
    return 'Kolom status belum tersedia di tabel Supabase. Tambahkan kolom status atau verification_status melalui SQL editor Supabase.'
  }

  return message || 'Gagal memperbarui status.'
}

async function updateRecordStatus (id, nextStatus, row) {
  try {
    await updateVerificationStatus('data_kol_koc', id, nextStatus)
    return
  } catch (error) {
    const lower = (error?.message || '').toLowerCase()
    const isPermissionIssue = lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('policy')

    if (!isPermissionIssue) {
      const candidates = [
        ...(row?.verification_status !== undefined ? ['verification_status'] : []),
        ...(row?.status !== undefined ? ['status'] : []),
        'verification_status',
        'status'
      ].filter((field, index, array) => array.indexOf(field) === index)

      let lastError = null

      for (const field of candidates) {
        const { error: directError } = await supabase
          .from('data_kol_koc')
          .update({ [field]: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', id)

        if (!directError) return
        lastError = directError
      }

      throw lastError
    }

    throw error
  }
}

function statusBadgeInline (status) {
  const map = {
    pending:   { label: 'Pending',   cls: 'badge--pending'   },
    reviewing: { label: 'Review',    cls: 'badge--reviewing' },
    approved:  { label: 'Approved',  cls: 'badge--approved'  },
    rejected:  { label: 'Rejected',  cls: 'badge--rejected'  },
    on_hold:   { label: 'On Hold',   cls: 'badge--on-hold'   },
  }
  const s = map[status] || { label: status ?? 'pending', cls: 'badge--pending' }
  return `<span class="badge ${s.cls}">${s.label}</span>`
}

// ── XSS protection ────────────────────────────────────────────
function escHtml (str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Sort header clicks ────────────────────────────────────────
document.querySelectorAll('.admin-table th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col
    if (state.sortCol === col) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      state.sortCol = col
      state.sortDir = col === 'created_at' ? 'desc' : 'asc'
    }
    state.page = 1
    loadTable()
  })
})

// ── Search ────────────────────────────────────────────────────
searchInput.addEventListener('input', debounce((e) => {
  state.search = e.target.value
  state.page   = 1
  loadTable()
}, 350))

// ── Filters ───────────────────────────────────────────────────
filterPlatform.addEventListener('change', (e) => {
  state.platform = e.target.value
  state.page     = 1
  loadTable()
})

filterCategory.addEventListener('change', (e) => {
  state.category = e.target.value
  state.page     = 1
  loadTable()
})

filterStatus.addEventListener('change', (e) => {
  state.status = e.target.value
  state.page   = 1
  loadTable()
})

filterView.addEventListener('change', (e) => {
  state.viewMode = e.target.value
  state.page     = 1
  loadTable()
})

// ── Page size ─────────────────────────────────────────────────
pageSizeSelect.addEventListener('change', (e) => {
  state.pageSize = parseInt(e.target.value)
  state.page     = 1
  loadTable()
})

// ── Export support ───────────────────────────────────────────
function slugify (value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'all'
}

function buildExportFilename () {
  const parts = ['kol-koc-export']

  if (state.status) {
    parts.push(slugify(state.status))
  } else if (state.viewMode === 'verified') {
    parts.push('verified')
  }

  if (state.platform) parts.push(`platform-${slugify(state.platform)}`)
  if (state.category) parts.push(`category-${slugify(state.category)}`)
  if (state.search.trim()) parts.push(`search-${slugify(state.search.trim())}`)

  if (parts.length === 1) parts.push('all')

  const datePart = new Date().toISOString().slice(0, 10)
  return `${parts.join('-')}-${datePart}.xlsx`
}

const exportBtn = document.getElementById('exportBtn')

exportBtn?.addEventListener('click', async () => {
  const originalText = exportBtn.textContent
  exportBtn.disabled = true
  exportBtn.textContent = 'Menyusun...'

  try {
    const { data } = await fetchExportRows()
    if (!data?.length) {
      showToast('Tidak ada data yang cocok untuk diekspor.', 'error')
      return
    }

    const filename = buildExportFilename()
    const workbook = buildWorkbook(data)
    downloadWorkbook(filename, workbook)
    showToast('Export berhasil. File sedang diunduh.')
  } catch (err) {
    console.error('Export error:', err)
    showToast('Gagal mengekspor data. Coba lagi.', 'error')
  } finally {
    exportBtn.disabled = false
    exportBtn.textContent = originalText
  }
})

// ── Check URL for ?open=id on load (from dashboard recent list) ──
const urlParams = new URLSearchParams(window.location.search)
const openId    = urlParams.get('open')

// ── Init ──────────────────────────────────────────────────────
await loadTable()
if (openId) openDetail(openId)

async function fetchExportRows () {
  let query = supabase
    .from('data_kol_koc')
    .select('*')

  if (state.search) {
    const term = state.search.trim()
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,tiktok_handle.ilike.%${term}%,instagram_handle.ilike.%${term}%,youtube_handle.ilike.%${term}%,whatsapp_number.ilike.%${term}%`
    )
  }

  if (state.platform) query = query.eq('primary_platform', state.platform)
  if (state.category) query = query.contains('content_category', [state.category])
  if (state.status) query = query.eq('verification_status', state.status)
  if (state.viewMode === 'verified' && !state.status) query = query.neq('verification_status', 'pending')

  if (state.sortCol === 'followers') {
    query = query.order('follower_count_tt', { ascending: state.sortDir === 'asc', nullsFirst: false })
  } else {
    query = query.order(state.sortCol, { ascending: state.sortDir === 'asc', nullsFirst: false })
  }

  const { data, error } = await query
  if (error) throw error
  return { data: data ?? [] }
}

function buildWorkbook (rows) {
  const headers = [
    'Nama Lengkap',
    'Email',
    'WhatsApp',
    'Platform Utama',
    'TikTok',
    'Instagram',
    'YouTube',
    'Followers TikTok',
    'Followers Instagram',
    'Subscribers YouTube',
    'Kota',
    'Provinsi',
    'Negara',
    'Kategori Konten',
    'Deskripsi Konten',
    'Tanggal Daftar',
    'Status'
  ]

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('KOL Database', {
    views: [{ state: 'frozen', ySplit: 3 }],
    properties: { defaultRowHeight: 20 }
  })

  const columnWidths = [24, 30, 18, 16, 20, 20, 18, 16, 18, 18, 16, 16, 16, 30, 36, 20, 14]
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width
  })

  const titleRow = worksheet.addRow(['Laporan Data Pendaftar KOL/KOC'])
  titleRow.font = { bold: true, size: 16, color: { argb: 'FF1F2937' } }
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 24
  worksheet.mergeCells(1, 1, 1, headers.length)

  const subtitleRow = worksheet.addRow(['Tanggal Ekspor:', new Date()])
  subtitleRow.getCell(1).font = { size: 11, color: { argb: 'FF374151' } }
  subtitleRow.getCell(2).font = { size: 11, color: { argb: 'FF374151' } }
  subtitleRow.getCell(2).numFmt = 'yyyy-mm-dd hh:mm:ss'
  subtitleRow.alignment = { vertical: 'middle' }
  subtitleRow.height = 18

  const border = {
    top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
    left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
    bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
    right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
  }

  const headerRow = worksheet.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FF111827' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD1D5DB' }
  }
  headerRow.height = 22
  headerRow.eachCell((cell) => {
    cell.border = border
  })

  titleRow.eachCell(cell => {
    cell.border = border
  })
  subtitleRow.eachCell(cell => {
    cell.border = border
  })
  headerRow.eachCell(cell => {
    cell.border = border
  })

  rows.forEach((row) => {
    const dataRow = worksheet.addRow([
      row.full_name,
      row.email,
      row.whatsapp_number,
      row.primary_platform,
      row.tiktok_handle,
      row.instagram_handle,
      row.youtube_handle,
      row.follower_count_tt,
      row.follower_count_ig,
      row.follower_count_yt,
      row.city,
      row.province,
      row.country,
      Array.isArray(row.content_category) ? row.content_category.join('; ') : row.content_category || '',
      row.content_description,
      row.created_at ? new Date(row.created_at) : null,
      row.verification_status ?? row.status,
    ])

    dataRow.eachCell((cell) => {
      cell.border = border
      cell.alignment = { vertical: 'middle', wrapText: true }
      if (cell.value instanceof Date) {
        cell.numFmt = 'yyyy-mm-dd hh:mm:ss'
      }
    })
  })

  const dateColumnIndex = headers.indexOf('Tanggal Daftar') + 1
  worksheet.getColumn(dateColumnIndex).numFmt = 'yyyy-mm-dd hh:mm:ss'
  worksheet.properties.defaultRowHeight = 20

  return workbook
}

async function downloadWorkbook (filename, workbook) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

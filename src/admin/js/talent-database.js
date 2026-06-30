import '../css/admin-components.css'
import { requireAuth, logout, getCurrentUser } from './admin-auth.js'
import { supabase, updateVerificationStatus } from './admin-supabase.js'
import {
  formatDate,
  compactNumber,
  showToast,
  showConfirm,
  debounce,
  setHeaderDate,
  setSidebarUser
} from './admin-utils.js'
import ExcelJS from 'exceljs/dist/exceljs.min.js'

const session = await requireAuth()
if (!session) throw new Error('Unauthenticated')

setHeaderDate()
const user = await getCurrentUser()
setSidebarUser(user)
document.getElementById('logoutBtn').addEventListener('click', logout)

const state = {
  search: '',
  status: '',
  viewMode: 'all',
  sortCol: 'created_at',
  sortDir: 'desc',
  page: 1,
  pageSize: 10,
  total: 0,
}

const tableBody = document.getElementById('tableBody')
const paginationInfo = document.getElementById('paginationInfo')
const paginationControls = document.getElementById('paginationControls')
const searchInput = document.getElementById('searchInput')
const filterStatus = document.getElementById('filterStatus')
const filterView = document.getElementById('filterView')
const pageSizeSelect = document.getElementById('pageSize')
const addTalentBtn = document.getElementById('addTalentBtn')
let currentOpenDetailId = null

function getSocialHandles(row) {
  const handles = [
    row.tiktok_username ? `@${row.tiktok_username}` : null,
    row.instagram_username ? `@${row.instagram_username}` : null,
    row.youtube_username ? `@${row.youtube_username}` : null,
  ].filter(Boolean)

  return handles.length ? handles.join(' · ') : '—'
}

function getRecordStatus (row) {
  return row?.verification_status ?? row?.status ?? 'pending'
}

function getStatusBadge(status) {
  const map = {
    pending: { label: 'Pending', cls: 'badge--pending' },
    reviewing: { label: 'Review', cls: 'badge--reviewing' },
    approved: { label: 'Approved', cls: 'badge--approved' },
    rejected: { label: 'Rejected', cls: 'badge--rejected' },
    on_hold: { label: 'On Hold', cls: 'badge--on-hold' },
  }
  const item = map[status] || { label: status || 'Pending', cls: 'badge--pending' }
  return `<span class="badge ${item.cls}">${item.label}</span>`
}

function getStatusUpdateErrorMessage (error) {
  const message = error?.message || ''
  const lower = message.toLowerCase()

  if (lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('policy')) {
    return 'Update ditolak oleh policy Supabase. Periksa RLS table di dashboard Supabase.'
  }

  if (lower.includes('does not exist') || lower.includes('42703') || (lower.includes('column') && lower.includes('not exist'))) {
    return 'Kolom status belum tersedia di tabel Supabase. Tambahkan kolom verification_status atau status melalui SQL editor Supabase.'
  }

  return message || 'Gagal memperbarui status.'
}

async function updateRecordStatus (id, nextStatus, row) {
  try {
    await updateVerificationStatus('data_talent', id, nextStatus)
    return
  } catch (error) {
    const lower = (error?.message || '').toLowerCase()
    const isPermissionIssue = lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('policy')

    if (!isPermissionIssue) {
      const candidates = row?.verification_status !== undefined
        ? ['verification_status', 'status']
        : ['status', 'verification_status']

      let lastError = null

      for (const field of candidates) {
        const { error: directError } = await supabase
          .from('data_talent')
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

function escHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeListInput(value) {
  if (!value) return []
  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getArrayValues(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return normalizeListInput(value)
  return []
}

function buildCheckboxGroupHtml(name, label, options, selectedValues = []) {
  const selected = new Set(getArrayValues(selectedValues).map((item) => String(item)))

  return `
    <div class="talent-crud-field talent-crud-field--full">
      <label>${label}</label>
      <div class="talent-crud-chip-group">
        ${options.map((option) => {
          const checked = selected.has(String(option.value)) ? 'checked' : ''
          return `<label class="talent-crud-chip-option"><input type="checkbox" name="${name}" value="${escHtml(option.value)}" ${checked} /><span>${escHtml(option.label)}</span></label>`
        }).join('')}
      </div>
    </div>
  `
}

function getSelectedCheckboxValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value)
}

function closeCrudModal() {
  document.getElementById('talentCrudMount')?.remove()
}

function buildTalentCrudFormHtml(mode, row = null) {
  const isEdit = mode === 'edit'
  const title = isEdit ? 'Edit Talent' : 'Tambah Talent'
  const values = row || {}

  return `
    <div class="detail-overlay" id="talentCrudOverlay"></div>
    <div class="detail-panel" id="talentCrudModal" style="max-width:760px; width:min(92vw, 760px);">
      <div class="detail-panel__header">
        <div class="detail-panel__title">${title}</div>
        <button class="detail-panel__close" id="closeCrudModal" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form id="talentCrudForm" class="detail-panel__body talent-crud-form">
        <div class="talent-crud-section">
          <div class="talent-crud-section__title">Informasi Personal</div>
          <div class="talent-crud-section__subtitle">Bagian utama identitas dan profil talent.</div>
          <div class="talent-crud-grid">
            <div class="talent-crud-field talent-crud-field--full">
              <label for="crudFullName">Nama Lengkap <span style="color:var(--brand-pink);">*</span></label>
              <input required id="crudFullName" name="full_name" value="${escHtml(values.full_name || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudStageName">Nama Panggung / Alias</label>
              <input id="crudStageName" name="stage_name" value="${escHtml(values.stage_name || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudGender">Gender</label>
              <select id="crudGender" name="gender">
                <option value="" ${!values.gender ? 'selected' : ''}>— Pilih —</option>
                <option value="male" ${values.gender === 'male' ? 'selected' : ''}>Laki-laki</option>
                <option value="female" ${values.gender === 'female' ? 'selected' : ''}>Perempuan</option>
                <option value="prefer_not_to_say" ${values.gender === 'prefer_not_to_say' ? 'selected' : ''}>Tidak disebutkan</option>
              </select>
            </div>
            <div class="talent-crud-field">
              <label for="crudDob">Tanggal Lahir</label>
              <input id="crudDob" type="date" name="date_of_birth" value="${escHtml(values.date_of_birth || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudCity">Kota <span style="color:var(--brand-pink);">*</span></label>
              <input required id="crudCity" name="city" value="${escHtml(values.city || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudProvince">Provinsi</label>
              <input id="crudProvince" name="province" value="${escHtml(values.province || '')}" />
            </div>
            <div class="talent-crud-field talent-crud-field--full">
              <label for="crudLanguages">Bahasa yang Dikuasai</label>
              <input id="crudLanguages" name="languages_spoken" value="${escHtml(Array.isArray(values.languages_spoken) ? values.languages_spoken.join(', ') : values.languages_spoken || '')}" />
              <span class="talent-crud-field__hint">Pisahkan dengan koma apabila lebih dari satu.</span>
            </div>
          </div>
        </div>

        <div class="talent-crud-section">
          <div class="talent-crud-section__title">Kontak & Profil Talenta</div>
          <div class="talent-crud-section__subtitle">Data kontak, social handle, dan bidang utama talent.</div>
          <div class="talent-crud-grid">
            <div class="talent-crud-field">
              <label for="crudEmail">Email <span style="color:var(--brand-pink);">*</span></label>
              <input required id="crudEmail" type="email" name="email" value="${escHtml(values.email || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudWhatsapp">WhatsApp <span style="color:var(--brand-pink);">*</span></label>
              <input required id="crudWhatsapp" name="whatsapp_number" value="${escHtml(values.whatsapp_number || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudPrimaryTalent">Talent Utama <span style="color:var(--brand-pink);">*</span></label>
              <select required id="crudPrimaryTalent" name="primary_talent">
                <option value="" ${!values.primary_talent ? 'selected' : ''}>— Pilih —</option>
                <option value="Singer" ${values.primary_talent === 'Singer' ? 'selected' : ''}>Singer</option>
                <option value="Dancer" ${values.primary_talent === 'Dancer' ? 'selected' : ''}>Dancer</option>
                <option value="Host" ${values.primary_talent === 'Host' ? 'selected' : ''}>Host</option>
                <option value="MC" ${values.primary_talent === 'MC' ? 'selected' : ''}>MC</option>
                <option value="Actor" ${values.primary_talent === 'Actor' ? 'selected' : ''}>Actor</option>
                <option value="Model" ${values.primary_talent === 'Model' ? 'selected' : ''}>Model</option>
                <option value="Live Streamer" ${values.primary_talent === 'Live Streamer' ? 'selected' : ''}>Live Streamer</option>
                <option value="Content Creator" ${values.primary_talent === 'Content Creator' ? 'selected' : ''}>Content Creator</option>
                <option value="Musician" ${values.primary_talent === 'Musician' ? 'selected' : ''}>Musician</option>
                <option value="DJ" ${values.primary_talent === 'DJ' ? 'selected' : ''}>DJ</option>
                <option value="Cosplayer" ${values.primary_talent === 'Cosplayer' ? 'selected' : ''}>Cosplayer</option>
                <option value="Voice Actor" ${values.primary_talent === 'Voice Actor' ? 'selected' : ''}>Voice Actor</option>
                <option value="Other" ${values.primary_talent === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div class="talent-crud-field">
              <label for="crudStatus">Status Verifikasi</label>
              <select id="crudStatus" name="verification_status">
                <option value="pending" ${!values.verification_status || values.verification_status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="reviewing" ${values.verification_status === 'reviewing' ? 'selected' : ''}>Review</option>
                <option value="approved" ${values.verification_status === 'approved' ? 'selected' : ''}>Approved</option>
                <option value="rejected" ${values.verification_status === 'rejected' ? 'selected' : ''}>Rejected</option>
                <option value="on_hold" ${values.verification_status === 'on_hold' ? 'selected' : ''}>On Hold</option>
              </select>
            </div>
            <div class="talent-crud-field">
              <label for="crudTiktok">TikTok</label>
              <input id="crudTiktok" name="tiktok_username" value="${escHtml(values.tiktok_username || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudInstagram">Instagram</label>
              <input id="crudInstagram" name="instagram_username" value="${escHtml(values.instagram_username || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudYoutube">YouTube</label>
              <input id="crudYoutube" name="youtube_username" value="${escHtml(values.youtube_username || '')}" />
            </div>
            <div class="talent-crud-field">
              <label for="crudFacebook">Facebook</label>
              <input id="crudFacebook" name="facebook_username" value="${escHtml(values.facebook_username || '')}" />
            </div>
            ${buildCheckboxGroupHtml(
              'secondary_talents',
              'Talent Sekunder',
              [
                { value: 'Singer', label: 'Singer' },
                { value: 'Dancer', label: 'Dancer' },
                { value: 'Host', label: 'Host' },
                { value: 'MC', label: 'MC' },
                { value: 'Actor', label: 'Actor' },
                { value: 'Model', label: 'Model' },
                { value: 'Live Streamer', label: 'Live Streamer' },
                { value: 'Content Creator', label: 'Content Creator' },
                { value: 'Musician', label: 'Musician' },
                { value: 'DJ', label: 'DJ' },
                { value: 'Cosplayer', label: 'Cosplayer' },
                { value: 'Voice Actor', label: 'Voice Actor' },
                { value: 'Other', label: 'Other' },
              ],
              values.secondary_talents
            )}
            ${buildCheckboxGroupHtml(
              'skills',
              'Skills',
              [
                { value: 'Singing', label: 'Singing' },
                { value: 'Dancing', label: 'Dancing' },
                { value: 'Acting', label: 'Acting' },
                { value: 'Hosting', label: 'Hosting' },
                { value: 'Gaming', label: 'Gaming' },
                { value: 'Public Speaking', label: 'Public Speaking' },
                { value: 'Video Editing', label: 'Video Editing' },
                { value: 'Makeup', label: 'Makeup' },
                { value: 'Comedy', label: 'Comedy' },
                { value: 'Instrument Playing', label: 'Instrument Playing' },
                { value: 'Other', label: 'Other' },
              ],
              values.skills
            )}
          </div>
        </div>

        <div class="talent-crud-section">
          <div class="talent-crud-section__title">Ketersediaan & Jadwal</div>
          <div class="talent-crud-section__subtitle">Informasi yang membantu tim menyesuaikan penempatan talent.</div>
          <div class="talent-crud-grid">
            ${buildCheckboxGroupHtml(
              'available_days',
              'Hari Tersedia',
              [
                { value: 'Weekdays', label: 'Weekdays (Senin–Jumat)' },
                { value: 'Monday', label: 'Senin' },
                { value: 'Tuesday', label: 'Selasa' },
                { value: 'Wednesday', label: 'Rabu' },
                { value: 'Thursday', label: 'Kamis' },
                { value: 'Friday', label: 'Jumat' },
                { value: 'Saturday', label: 'Sabtu' },
                { value: 'Sunday', label: 'Minggu' },
              ],
              values.available_days
            )}
            ${buildCheckboxGroupHtml(
              'available_time',
              'Waktu Tersedia',
              [
                { value: 'Morning', label: 'Pagi' },
                { value: 'Midday', label: 'Siang' },
                { value: 'Afternoon', label: 'Sore' },
                { value: 'Night', label: 'Malam' },
              ],
              values.available_time
            )}
          </div>
        </div>

        <div class="talent-crud-actions">
          <button type="button" class="btn btn--ghost" id="cancelCrudModal">Batal</button>
          <button type="submit" class="btn btn--primary">${isEdit ? 'Simpan Perubahan' : 'Simpan Talent'}</button>
        </div>
      </form>
    </div>`
}

function openTalentCrudModal(mode, row = null) {
  closeCrudModal()
  const mount = document.createElement('div')
  mount.id = 'talentCrudMount'
  mount.innerHTML = buildTalentCrudFormHtml(mode, row)
  document.body.appendChild(mount)

  document.getElementById('closeCrudModal').addEventListener('click', closeCrudModal)
  document.getElementById('talentCrudOverlay').addEventListener('click', closeCrudModal)
  document.getElementById('cancelCrudModal').addEventListener('click', closeCrudModal)

  const form = document.getElementById('talentCrudForm')
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const formData = new FormData(form)

    const payload = {
      full_name: formData.get('full_name')?.toString().trim() || null,
      stage_name: formData.get('stage_name')?.toString().trim() || null,
      date_of_birth: formData.get('date_of_birth')?.toString().trim() || null,
      gender: formData.get('gender')?.toString().trim() || null,
      city: formData.get('city')?.toString().trim() || null,
      province: formData.get('province')?.toString().trim() || null,
      email: formData.get('email')?.toString().trim() || null,
      whatsapp_number: formData.get('whatsapp_number')?.toString().trim() || null,
      primary_talent: formData.get('primary_talent')?.toString().trim() || null,
      languages_spoken: formData.get('languages_spoken')?.toString().trim() || null,
      tiktok_username: formData.get('tiktok_username')?.toString().trim() || null,
      instagram_username: formData.get('instagram_username')?.toString().trim() || null,
      youtube_username: formData.get('youtube_username')?.toString().trim() || null,
      facebook_username: formData.get('facebook_username')?.toString().trim() || null,
      secondary_talents: getSelectedCheckboxValues(form, 'secondary_talents'),
      skills: getSelectedCheckboxValues(form, 'skills'),
      available_days: getSelectedCheckboxValues(form, 'available_days'),
      available_time: getSelectedCheckboxValues(form, 'available_time'),
      verification_status: formData.get('verification_status')?.toString().trim() || 'pending',
      updated_at: new Date().toISOString(),
    }

    if (!payload.full_name || !payload.email || !payload.whatsapp_number || !payload.city || !payload.primary_talent) {
      showToast('Nama, email, WhatsApp, kota, dan talent utama wajib diisi.', 'error')
      return
    }

    try {
      if (mode === 'edit' && row?.id) {
        const { error } = await supabase.from('data_talent').update(payload).eq('id', row.id)
        if (error) throw error
        showToast('Data talent berhasil diperbarui.')
        if (currentOpenDetailId === row.id) {
          await renderDetailPanel(row.id)
        }
      } else {
        const { error } = await supabase.from('data_talent').insert([{ ...payload, created_at: new Date().toISOString() }])
        if (error) throw error
        showToast('Data talent berhasil ditambahkan.')
      }

      closeCrudModal()
      await loadTable()
    } catch (error) {
      console.error('Talent CRUD error:', error)
      showToast(error?.message || 'Gagal menyimpan data talent.', 'error')
    }
  })
}

async function fetchData () {
  const from = (state.page - 1) * state.pageSize
  const to = from + state.pageSize - 1

  let query = supabase
    .from('data_talent')
    .select('*', { count: 'exact' })

  if (state.search) {
    const term = state.search.trim()
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,primary_talent.ilike.%${term}%,city.ilike.%${term}%,stage_name.ilike.%${term}%`
    )
  }

  if (state.status) query = query.eq('verification_status', state.status)
  if (state.viewMode === 'verified' && !state.status) query = query.neq('verification_status', 'pending')

  if (state.sortCol === 'created_at') {
    query = query.order('created_at', { ascending: state.sortDir === 'asc', nullsFirst: false })
  } else {
    query = query.order(state.sortCol, { ascending: state.sortDir === 'asc', nullsFirst: false })
  }

  query = query.range(from, to)

  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

function renderTable(rows) {
  if (!rows.length) {
    tableBody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state">
          <h3>Tidak ada data</h3>
          <p>Coba ubah kata kunci atau filter pencarian.</p>
        </div>
      </td></tr>`
    return
  }

  tableBody.innerHTML = rows.map((row) => `
    <tr data-id="${row.id}">
      <td class="cell-name">${escHtml(row.full_name)}</td>
      <td>${escHtml(row.primary_talent || '—')}</td>
      <td>${escHtml(row.city || '—')}</td>
      <td>${escHtml(row.whatsapp_number || '—')}</td>
      <td class="cell-muted">${escHtml(row.email || '—')}</td>
      <td class="cell-muted">${escHtml(getSocialHandles(row))}</td>
      <td>${getStatusBadge(getRecordStatus(row))}</td>
      <td class="cell-muted">${formatDate(row.created_at)}</td>
      <td class="cell-actions">
        <button class="action-btn edit-btn" data-id="${row.id}" title="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
          </svg>
        </button>
        <button class="action-btn delete-btn" data-id="${row.id}" data-name="${escHtml(row.full_name)}" title="Hapus">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('')

  tableBody.querySelectorAll('tr[data-id]').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return
      openDetail(tr.dataset.id)
    })
  })

  tableBody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const row = rows.find((item) => String(item.id) === btn.dataset.id)
      if (row) openTalentCrudModal('edit', row)
    })
  })

  tableBody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleDelete(btn.dataset.id, btn.dataset.name)
    })
  })
}

function renderPagination () {
  const totalPages = Math.ceil(state.total / state.pageSize)
  const from = state.total === 0 ? 0 : (state.page - 1) * state.pageSize + 1
  const to = Math.min(state.page * state.pageSize, state.total)

  paginationInfo.textContent = `Menampilkan ${from}–${to} dari ${state.total} pendaftar`

  const pages = []
  pages.push(`<button class="admin-pagination__btn" id="prevBtn" ${state.page <= 1 ? 'disabled' : ''}>←</button>`)

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

  paginationControls.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.page = parseInt(btn.dataset.page, 10)
      loadTable()
    })
  })
}

function updateSortHeaders () {
  document.querySelectorAll('.admin-table th.sortable').forEach((th) => {
    th.classList.remove('sort-asc', 'sort-desc')
    if (th.dataset.col === state.sortCol) {
      th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc')
    }
  })
}

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
      <tr><td colspan="9">
        <div class="empty-state">
          <h3>Gagal memuat data</h3>
          <p>${err?.message || 'Terjadi kesalahan yang tidak diketahui.'}</p>
        </div>
      </td></tr>`
  }
}

function handleDelete (id, name) {
  showConfirm({
    title: 'Hapus Pendaftar',
    message: `Yakin ingin menghapus data <strong>${name}</strong>? Tindakan ini tidak dapat dibatalkan.`,
    confirmLabel: 'Ya, Hapus',
    onConfirm: async () => {
      try {
        const { error } = await supabase
          .from('data_talent')
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

function openDetail(id) {
  currentOpenDetailId = id
  const url = new URL(window.location)
  url.searchParams.set('open', id)
  window.history.pushState({}, '', url)
  renderDetailPanel(id)
}

function closeDetail () {
  currentOpenDetailId = null
  const url = new URL(window.location)
  url.searchParams.delete('open')
  window.history.pushState({}, '', url)

  const overlay = document.getElementById('detailOverlay')
  const panel = document.getElementById('detailPanel')
  if (panel) panel.style.animation = 'slideIn 0.25s reverse forwards'
  if (overlay) overlay.style.animation = 'fadeIn 0.2s reverse forwards'
  setTimeout(() => {
    document.getElementById('detailMount').innerHTML = ''
  }, 250)
}

async function renderDetailPanel(id) {
  const mount = document.getElementById('detailMount')

  mount.innerHTML = `
    <div class="detail-overlay" id="detailOverlay"></div>
    <div class="detail-panel" id="detailPanel">
      <div class="detail-panel__header">
        <div class="detail-panel__title">Detail Talent</div>
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

  const { data, error } = await supabase
    .from('data_talent')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    document.getElementById('detailBody').innerHTML = '<div class="empty-state"><h3>Data tidak ditemukan</h3></div>'
    return
  }

  document.getElementById('detailBody').innerHTML = buildDetailHTML(data)

  document.getElementById('detailFooter').innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between;width:100%;">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn--ghost" id="detailEditBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
          Edit Data
        </button>
        <button class="btn btn--danger" id="detailDeleteBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Hapus Data
        </button>
      </div>
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

  document.getElementById('statusSelect').value = data.verification_status || 'pending'

  document.getElementById('detailEditBtn').addEventListener('click', () => {
    openTalentCrudModal('edit', data)
  })

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

function getProfilePhotoUrl(row) {
  if (row?.profile_photo_url) return row.profile_photo_url
  if (row?.profile_photo_path) {
    return supabase.storage.from('talent-uploads').getPublicUrl(row.profile_photo_path).data.publicUrl || ''
  }
  return ''
}

function buildDetailHTML(d) {
  const field = (label, value, full = false) => `
    <div class="detail-field ${full ? 'detail-field--full' : ''}">
      <div class="detail-field__label">${label}</div>
      <div class="detail-field__value ${!value ? 'detail-field__value--muted' : ''}">${value || 'Tidak diisi'}</div>
    </div>`

  const badges = (d.secondary_talents || []).map((item) => `<span class="detail-tag">${escHtml(item)}</span>`).join('') || '<span class="detail-field__value--muted">Tidak diisi</span>'
  const skills = (d.skills || []).map((item) => `<span class="detail-tag">${escHtml(item)}</span>`).join('') || '<span class="detail-field__value--muted">Tidak diisi</span>'
  const profilePhotoUrl = getProfilePhotoUrl(d)
  const profilePhotoSection = profilePhotoUrl ? `
    <div class="detail-section">
      <div class="detail-section__title">Foto Profil</div>
      <div class="detail-photo-preview">
        <img src="${escHtml(profilePhotoUrl)}" alt="Foto profil ${escHtml(d.full_name || 'talent')}" loading="lazy" />
      </div>
    </div>` : ''

  return `
    ${profilePhotoSection}
    <div class="detail-section">
      <div class="detail-section__title">Data Diri</div>
      <div class="detail-grid">
        ${field('Nama Lengkap', escHtml(d.full_name), true)}
        ${field('Panggung', escHtml(d.stage_name))}
        ${field('Tanggal Lahir', escHtml(d.date_of_birth))}
        ${field('Gender', escHtml(d.gender))}
        ${field('Kota', escHtml(d.city))}
        ${field('Provinsi', escHtml(d.province))}
        ${field('Bahasa', escHtml(d.languages_spoken))}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section__title">Kontak</div>
      <div class="detail-grid">
        ${field('Email', `<a href="mailto:${escHtml(d.email)}">${escHtml(d.email)}</a>`, true)}
        ${field('WhatsApp', escHtml(d.whatsapp_number))}
        ${field('TikTok', d.tiktok_username ? `@${escHtml(d.tiktok_username)}` : null)}
        ${field('Instagram', d.instagram_username ? `@${escHtml(d.instagram_username)}` : null)}
        ${field('YouTube', d.youtube_username ? `@${escHtml(d.youtube_username)}` : null)}
        ${field('Facebook', d.facebook_username ? `@${escHtml(d.facebook_username)}` : null)}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section__title">Profil Talent</div>
      <div class="detail-grid">
        ${field('Talent Utama', escHtml(d.primary_talent), true)}
        <div class="detail-field detail-field--full">
          <div class="detail-field__label">Talent Sekunder</div>
          <div class="detail-tags">${badges}</div>
        </div>
        <div class="detail-field detail-field--full">
          <div class="detail-field__label">Skills</div>
          <div class="detail-tags">${skills}</div>
        </div>
        ${field('Ketersediaan Hari', (d.available_days || []).join(', '), true)}
        ${field('Ketersediaan Waktu', (d.available_time || []).join(', '), true)}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section__title">Informasi Pendaftaran</div>
      <div class="detail-grid">
        ${field('Status Verifikasi', getStatusBadge(getRecordStatus(d)))}
        ${field('Tanggal Daftar', formatDate(d.created_at))}
        ${field('Terakhir Diperbarui', formatDate(d.updated_at))}
      </div>
    </div>`
}

function statusBadgeInline(status) {
  return getStatusBadge(status)
}

document.querySelectorAll('.admin-table th.sortable').forEach((th) => {
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

searchInput.addEventListener('input', debounce((e) => {
  state.search = e.target.value
  state.page = 1
  loadTable()
}, 350))

filterStatus.addEventListener('change', (e) => {
  state.status = e.target.value
  state.page = 1
  loadTable()
})

filterView.addEventListener('change', (e) => {
  state.viewMode = e.target.value
  state.page = 1
  loadTable()
})

pageSizeSelect.addEventListener('change', (e) => {
  state.pageSize = parseInt(e.target.value, 10)
  state.page = 1
  loadTable()
})

addTalentBtn?.addEventListener('click', () => {
  openTalentCrudModal('create')
})

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
  const parts = ['talent-export']

  if (state.status) {
    parts.push(slugify(state.status))
  } else if (state.viewMode === 'verified') {
    parts.push('verified')
  }

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
    const { data } = await fetchData()
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

const urlParams = new URLSearchParams(window.location.search)
const openId = urlParams.get('open')

await loadTable()
if (openId) openDetail(openId)

async function fetchExportRows () {
  let query = supabase
    .from('data_talent')
    .select('*')

  if (state.search) {
    const term = state.search.trim()
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,primary_talent.ilike.%${term}%,city.ilike.%${term}%,stage_name.ilike.%${term}%`
    )
  }

  if (state.status) query = query.eq('verification_status', state.status)
  if (state.viewMode === 'verified' && !state.status) query = query.neq('verification_status', 'pending')

  if (state.sortCol === 'created_at') {
    query = query.order('created_at', { ascending: state.sortDir === 'asc', nullsFirst: false })
  } else {
    query = query.order(state.sortCol, { ascending: state.sortDir === 'asc', nullsFirst: false })
  }

  const { data, error } = await query
  if (error) throw error
  return { data: data ?? [] }
}

function buildWorkbook(rows) {
  const headers = [
    'Nama Lengkap',
    'Panggung',
    'Email',
    'WhatsApp',
    'Talent Utama',
    'Talent Sekunder',
    'Skills',
    'Kota',
    'Provinsi',
    'Bahasa',
    'TikTok',
    'Instagram',
    'YouTube',
    'Facebook',
    'Hari Tersedia',
    'Waktu Tersedia',
    'Tanggal Daftar',
    'Status'
  ]

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Talent Database', {
    views: [{ state: 'frozen', ySplit: 3 }],
    properties: { defaultRowHeight: 20 }
  })

  const columnWidths = [24, 20, 28, 18, 18, 24, 24, 16, 16, 18, 18, 18, 18, 18, 20, 20, 20, 16]
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width
  })

  const titleRow = worksheet.addRow(['Laporan Data Pendaftar Talent'])
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

  titleRow.eachCell((cell) => {
    cell.border = border
  })
  subtitleRow.eachCell((cell) => {
    cell.border = border
  })

  rows.forEach((row) => {
    const dataRow = worksheet.addRow([
      row.full_name,
      row.stage_name,
      row.email,
      row.whatsapp_number,
      row.primary_talent,
      Array.isArray(row.secondary_talents) ? row.secondary_talents.join('; ') : row.secondary_talents || '',
      Array.isArray(row.skills) ? row.skills.join('; ') : row.skills || '',
      row.city,
      row.province,
      row.languages_spoken,
      row.tiktok_username ? `@${row.tiktok_username}` : '',
      row.instagram_username ? `@${row.instagram_username}` : '',
      row.youtube_username ? `@${row.youtube_username}` : '',
      row.facebook_username ? `@${row.facebook_username}` : '',
      Array.isArray(row.available_days) ? row.available_days.join('; ') : row.available_days || '',
      Array.isArray(row.available_time) ? row.available_time.join('; ') : row.available_time || '',
      row.created_at ? new Date(row.created_at) : null,
      row.verification_status,
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

function downloadWorkbook(filename, workbook) {
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  })
}

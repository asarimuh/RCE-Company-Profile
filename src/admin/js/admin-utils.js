// ============================================================
// admin-utils.js — shared utility functions
// ============================================================

// ── Format date to Indonesian locale ─────────────────────────
export function formatDate (dateStr, opts = {}) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    ...opts
  })
}

// ── Format number with dots (Indonesian style) ───────────────
export function formatNumber (num) {
  if (num === null || num === undefined) return '—'
  return num.toLocaleString('id-ID')
}

// ── Compact number (1.2K, 3.4M) ─────────────────────────────
export function compactNumber (num) {
  if (!num) return '0'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (num >= 1_000)     return (num / 1_000).toFixed(1).replace('.0', '') + 'K'
  return num.toString()
}

// ── Platform badge HTML ───────────────────────────────────────
export function platformBadge (platform) {
  if (!platform) return '<span class="badge badge--other">—</span>'
  const map = {
    tiktok:    { label: 'TikTok',    cls: 'badge--tiktok'    },
    instagram: { label: 'Instagram', cls: 'badge--instagram' },
    youtube:   { label: 'YouTube',   cls: 'badge--youtube'   },
    other:     { label: 'Lainnya',   cls: 'badge--other'     },
  }
  const p = map[platform] || { label: platform, cls: 'badge--other' }
  return `<span class="badge ${p.cls}">${p.label}</span>`
}

// ── Status badge HTML ─────────────────────────────────────────
export function statusBadge (status) {
  const map = {
    pending:   { label: 'Pending',   cls: 'badge--pending'   },
    reviewing: { label: 'Review',    cls: 'badge--reviewing' },
    approved:  { label: 'Approved',  cls: 'badge--approved'  },
    rejected:  { label: 'Rejected',  cls: 'badge--rejected'  },
    on_hold:   { label: 'On Hold',   cls: 'badge--on-hold'   },
  }
  const s = map[status] || { label: status, cls: 'badge--other' }
  return `<span class="badge ${s.cls}">${s.label}</span>`
}

// ── Get initials from full name ───────────────────────────────
export function getInitials (name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Get primary followers count ───────────────────────────────
export function getPrimaryFollowers (row) {
  const map = {
    tiktok:    row.follower_count_tt,
    instagram: row.follower_count_ig,
    youtube:   row.follower_count_yt,
  }
  return map[row.primary_platform] ?? null
}

// ── Get primary handle ────────────────────────────────────────
export function getPrimaryHandle (row) {
  const map = {
    tiktok:    row.tiktok_handle,
    instagram: row.instagram_handle,
    youtube:   row.youtube_handle,
  }
  return map[row.primary_platform] || row.tiktok_handle || row.instagram_handle || '—'
}

// ── Show toast notification ───────────────────────────────────
export function showToast (message, type = 'success') {
  const existing = document.querySelector('.admin-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = `admin-toast admin-toast--${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => toast.remove(), 3500)
}

// ── Show confirm dialog ───────────────────────────────────────
export function showConfirm ({ title, message, confirmLabel = 'Hapus', onConfirm }) {
  const overlay = document.createElement('div')
  overlay.className = 'admin-overlay'
  overlay.innerHTML = `
    <div class="admin-dialog">
      <div class="admin-dialog__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </div>
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="admin-dialog__actions">
        <button class="btn btn--ghost" id="dialogCancel">Batal</button>
        <button class="btn btn--danger" id="dialogConfirm">${confirmLabel}</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  overlay.querySelector('#dialogCancel').addEventListener('click',  () => overlay.remove())
  overlay.querySelector('#dialogConfirm').addEventListener('click', () => {
    overlay.remove()
    onConfirm()
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove()
  })
}

// ── Debounce ──────────────────────────────────────────────────
export function debounce (fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ── Set header date ───────────────────────────────────────────
export function setHeaderDate () {
  const el = document.getElementById('headerDate')
  if (!el) return
  el.textContent = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ── Set user info in sidebar ──────────────────────────────────
export function setSidebarUser (user) {
  const emailEl  = document.getElementById('userEmail')
  const avatarEl = document.getElementById('userAvatar')
  if (emailEl)  emailEl.textContent  = user?.email ?? '—'
  if (avatarEl) avatarEl.textContent = getInitials(user?.email?.split('@')[0] ?? 'A')
}
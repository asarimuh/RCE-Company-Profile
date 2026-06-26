// ============================================================
// registration-form.js
// Handles multi-step form logic, validation, and Supabase submission
// ============================================================

import { supabase } from './supabase-client.js'

// ── Constants ────────────────────────────────────────────────
const COOLDOWN_MS = 60_000 // 60 seconds between submissions
const COOLDOWN_KEY = 'rce_last_submit'

// ── Element refs ─────────────────────────────────────────────
const form         = document.getElementById('registrationForm')
const submitBtn    = document.getElementById('submitBtn')
const submitLabel  = document.getElementById('submitLabel')
const submitSpinner= document.getElementById('submitSpinner')
const descTextarea = document.getElementById('contentDescription')
const descCount    = document.getElementById('descCount')
const agreeTerms   = document.getElementById('agreeTerms')
const progressFill = document.getElementById('progressFill')

// ── Step state ───────────────────────────────────────────────
let currentStep = 1
const TOTAL_STEPS = 3

// ============================================================
// PROGRESS BAR
// ============================================================
function updateProgress (step) {
  const pct = (step / TOTAL_STEPS) * 100
  progressFill.style.width = `${pct}%`

  document.querySelectorAll('.reg-progress__step').forEach(el => {
    const s = parseInt(el.dataset.step)
    el.classList.remove('active', 'completed')
    if (s === step)  el.classList.add('active')
    if (s < step)    el.classList.add('completed')
  })
}

// ============================================================
// SHOW / HIDE STEPS
// ============================================================
function goToStep (step) {
  document.getElementById(`step${currentStep}`).classList.remove('active')
  currentStep = step
  document.getElementById(`step${currentStep}`).classList.add('active')
  updateProgress(currentStep)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ============================================================
// VALIDATION HELPERS
// ============================================================
function showError (fieldId, wrapId, msg) {
  const errEl = document.getElementById(`${fieldId}Error`)
  const input = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`)
  if (errEl) errEl.textContent = msg
  if (input) {
    input.classList.add('error')
    input.classList.remove('valid')
    // handle prefix-wrap border
    const wrap = input.closest('.reg-field__prefix-wrap')
    if (wrap) { wrap.classList.add('error'); wrap.classList.remove('valid') }
  }
}

function clearError (fieldId) {
  const errEl = document.getElementById(`${fieldId}Error`)
  const input = document.getElementById(fieldId)
  if (errEl) errEl.textContent = ''
  if (input) {
    input.classList.remove('error')
    input.classList.add('valid')
    const wrap = input.closest('.reg-field__prefix-wrap')
    if (wrap) { wrap.classList.remove('error'); wrap.classList.add('valid') }
  }
}

function clearErrorOnly (fieldId) {
  const errEl = document.getElementById(`${fieldId}Error`)
  const input = document.getElementById(fieldId)
  if (errEl) errEl.textContent = ''
  if (input) {
    input.classList.remove('error', 'valid')
    const wrap = input.closest('.reg-field__prefix-wrap')
    if (wrap) wrap.classList.remove('error', 'valid')
  }
}

// ============================================================
// STEP VALIDATORS
// ============================================================
function validateStep1 () {
  let valid = true

  // Full name
  const name = document.getElementById('fullName').value.trim()
  if (!name) {
    showError('fullName', null, 'Nama lengkap wajib diisi.')
    valid = false
  } else if (name.length < 2) {
    showError('fullName', null, 'Nama minimal 2 karakter.')
    valid = false
  } else if (!/^[\p{L}\s'-]+$/u.test(name)) {
    showError('fullName', null, 'Nama hanya boleh berisi huruf dan spasi.')
    valid = false
  } else {
    clearError('fullName')
  }

  // Date of birth (optional but validated if filled)
  const dob = document.getElementById('dateOfBirth').value
  if (dob) {
    const dobDate = new Date(dob)
    const now     = new Date()
    const age     = (now - dobDate) / (1000 * 60 * 60 * 24 * 365.25)
    if (dobDate >= now) {
      showError('dateOfBirth', null, 'Tanggal lahir tidak valid.')
      valid = false
    } else if (age < 13) {
      showError('dateOfBirth', null, 'Kamu harus berusia minimal 13 tahun.')
      valid = false
    } else if (age > 80) {
      showError('dateOfBirth', null, 'Tanggal lahir tidak valid.')
      valid = false
    } else {
      clearError('dateOfBirth')
    }
  }

  // City
  const city = document.getElementById('city').value.trim()
  if (!city) {
    showError('city', null, 'Kota wajib diisi.')
    valid = false
  } else if (city.length < 2) {
    showError('city', null, 'Nama kota minimal 2 karakter.')
    valid = false
  } else {
    clearError('city')
  }

  return valid
}

function validateStep2 () {
  let valid = true

  // Email
  const email = document.getElementById('email').value.trim()
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    showError('email', null, 'Email wajib diisi.')
    valid = false
  } else if (!emailRe.test(email)) {
    showError('email', null, 'Format email tidak valid.')
    valid = false
  } else if (email.length > 254) {
    showError('email', null, 'Email terlalu panjang.')
    valid = false
  } else {
    clearError('email')
  }

  // WhatsApp
  const wa = document.getElementById('whatsappNumber').value.trim().replace(/\D/g, '')
  if (!wa) {
    showError('whatsapp', null, 'Nomor WhatsApp wajib diisi.')
    valid = false
  } else if (wa.length < 8 || wa.length > 13) {
    showError('whatsapp', null, 'Nomor WhatsApp tidak valid. Contoh: 81234567890')
    valid = false
  } else {
    clearError('whatsapp')
  }

  // TikTok handle (optional)
  const tiktok = document.getElementById('tiktokHandle').value.trim()
  if (tiktok && !/^[\w.]+$/.test(tiktok)) {
    showError('tiktok', null, 'Username TikTok hanya boleh berisi huruf, angka, titik, dan underscore.')
    valid = false
  } else {
    clearErrorOnly('tiktok')
  }

  // Instagram handle (optional)
  const ig = document.getElementById('instagramHandle').value.trim()
  if (ig && !/^[\w.]+$/.test(ig)) {
    showError('instagram', null, 'Username Instagram tidak valid.')
    valid = false
  } else {
    clearErrorOnly('instagram')
  }

  return valid
}

function validateStep3 () {
  let valid = true

  // Primary platform
  const platform = form.querySelector('input[name="primary_platform"]:checked')
  if (!platform) {
    document.getElementById('platformError').textContent = 'Pilih platform utama kamu.'
    valid = false
  } else {
    document.getElementById('platformError').textContent = ''
  }

  // Content category
  const categories = form.querySelectorAll('input[name="content_category"]:checked')
  if (categories.length === 0) {
    document.getElementById('categoryError').textContent = 'Pilih minimal satu kategori konten.'
    valid = false
  } else {
    document.getElementById('categoryError').textContent = ''
  }

  // Terms
  if (!agreeTerms.checked) {
    document.getElementById('termsError').textContent = 'Kamu harus menyetujui pernyataan ini untuk melanjutkan.'
    valid = false
  } else {
    document.getElementById('termsError').textContent = ''
  }

  // Portfolio URL (optional but validated if filled)
  const portfolio = document.getElementById('portfolioUrl').value.trim()
  if (portfolio) {
    try {
      new URL(portfolio)
      clearErrorOnly('portfolio')
    } catch {
      showError('portfolio', null, 'Format URL tidak valid. Contoh: https://linktr.ee/username')
      valid = false
    }
  }

  return valid
}

// ============================================================
// ANTI-SPAM: COOLDOWN
// ============================================================
function isOnCooldown () {
  const last = localStorage.getItem(COOLDOWN_KEY)
  if (!last) return false
  return (Date.now() - parseInt(last)) < COOLDOWN_MS
}

function setCooldown () {
  localStorage.setItem(COOLDOWN_KEY, Date.now().toString())
}

// ============================================================
// COLLECT FORM DATA
// ============================================================
function collectFormData () {
  const get = id => document.getElementById(id)?.value.trim() || null

  // WhatsApp: prepend +62
  const waRaw = document.getElementById('whatsappNumber').value.trim().replace(/\D/g, '')
  const whatsapp = `+62${waRaw}`

  // Social handles: strip leading @ if user typed it
  const stripAt = id => {
    const val = document.getElementById(id)?.value.trim().replace(/^@/, '') || null
    return val || null
  }

  // Categories
  const categories = [...form.querySelectorAll('input[name="content_category"]:checked')]
    .map(el => el.value)

  // Platform
  const platform = form.querySelector('input[name="primary_platform"]:checked')?.value || null

  // Follower counts
  const toInt = id => {
    const v = parseInt(document.getElementById(id)?.value)
    return isNaN(v) ? null : v
  }

  return {
    full_name:           get('fullName'),
    date_of_birth:       get('dateOfBirth') || null,
    gender:              get('gender') || null,
    city:                get('city'),
    province:            get('province') || null,
    country:             'Indonesia',
    email:               get('email'),
    whatsapp_number:     whatsapp,
    tiktok_handle:       stripAt('tiktokHandle'),
    instagram_handle:    stripAt('instagramHandle'),
    youtube_handle:      stripAt('youtubeHandle'),
    primary_platform:    platform,
    content_category:    categories,
    follower_count_tt:   toInt('followerTt'),
    follower_count_ig:   toInt('followerIg'),
    follower_count_yt:   toInt('followerYt'),
    content_description: get('contentDescription') || null,
    portfolio_url:       get('portfolioUrl') || null,
    user_agent:          navigator.userAgent,
    referrer_url:        document.referrer || null,
  }
}

// ============================================================
// SUBMIT
// ============================================================
async function handleSubmit (e) {
  e.preventDefault()

  // Honeypot check
  if (document.getElementById('honeypot').value !== '') return

  // Step 3 validation
  if (!validateStep3()) return

  // Cooldown check
  if (isOnCooldown()) {
    document.getElementById('termsError').textContent =
      'Kamu baru saja mengirim formulir. Silakan tunggu 60 detik sebelum mencoba lagi.'
    return
  }

  // UI: loading state
  submitLabel.textContent = 'Mengirim...'
  submitSpinner.hidden = false
  submitBtn.disabled = true

  try {
    const data = collectFormData()

    const { error } = await supabase
      .from('talent_registrations')
      .insert([data])

    if (error) throw error

    // Success
    setCooldown()
    window.location.href = '/pages/register-success.html'

  } catch (err) {
    console.error('Submission error:', err)

    // Show friendly error
    document.getElementById('termsError').textContent =
      'Terjadi kesalahan saat mengirim formulir. Silakan coba lagi.'

    // Reset button
    submitLabel.textContent = 'Kirim Pendaftaran'
    submitSpinner.hidden = true
    submitBtn.disabled = false
  }
}

// ============================================================
// TERMS CHECKBOX → enable/disable submit button
// ============================================================
agreeTerms.addEventListener('change', () => {
  submitBtn.disabled = !agreeTerms.checked
})

// ============================================================
// CHARACTER COUNT for textarea
// ============================================================
descTextarea.addEventListener('input', () => {
  descCount.textContent = descTextarea.value.length
})

// ============================================================
// STEP NAVIGATION
// ============================================================
document.getElementById('toStep2').addEventListener('click', () => {
  if (validateStep1()) goToStep(2)
})

document.getElementById('toStep3').addEventListener('click', () => {
  if (validateStep2()) goToStep(3)
})

document.getElementById('toStep1').addEventListener('click', () => goToStep(1))
document.getElementById('toStep2b').addEventListener('click', () => goToStep(2))

// ============================================================
// FORM SUBMIT
// ============================================================
form.addEventListener('submit', handleSubmit)

// ============================================================
// NAVBAR MOBILE TOGGLE (matches existing site pattern)
// ============================================================
const navToggle = document.getElementById('navToggle')
const navLinks  = document.getElementById('navLinks')
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active')
    navToggle.classList.toggle('active')
  })
}

// ── Init ─────────────────────────────────────────────────────
updateProgress(1)
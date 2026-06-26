// ============================================================
// registration-form.js
// Handles multi-step form logic, validation, and Supabase submission
// ============================================================

import { supabase } from './supabase-client.js'

// ── Constants ────────────────────────────────────────────────
const COOLDOWN_MS = 60_000 // 60 seconds between submissions
const COOLDOWN_KEY = 'rce_last_submit'

// ── Indonesian Cities and Provinces ──────────────────────────
const INDONESIAN_CITIES = [
  'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang',
  'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Yogyakarta', 'Malang', 'Pontianak',
  'Banjarmasin', 'Kupang', 'Manado', 'Mataram', 'Denpasar', 'Bangli', 'Serang',
  'Pekanbaru', 'Jambi', 'Palangkaraya', 'Tanjung Pinang', 'Batam', 'Padang',
  'Bengkulu', 'Lampung', 'Cilegon', 'Cirebon', 'Kudus', 'Pati', 'Jepara',
  'Batang', 'Purwokerto', 'Sorong', 'Jayapura', 'Ambon', 'Ternate', 'Manado',
  'Lhokseumawe', 'Langsa', 'Aceh Besar', 'Subulussalam', 'Pidie', 'Pidie Jaya',
  'Bireuen', 'Aceh Utara', 'Aceh Barat', 'Aceh Selatan', 'Aceh Tenggara',
  'Gayo Lues', 'Alas', 'Nagan Raya', 'Aceh Jaya', 'Simeulue', 'Pulau Weh'
]

const INDONESIAN_PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
  'Bengkulu', 'Lampung', 'Bangka Belitung', 'Riau Islands', 'DKI Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua Barat',
  'Papua', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan'
]

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
  // Scroll to progress bar with offset for fixed navbar
  const progressEl = document.querySelector('.reg-progress')
  if (progressEl) {
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 80
    const elementPosition = progressEl.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: elementPosition - navHeight - 20,
      behavior: 'smooth'
    })
  }
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

  // Full name - no numbers allowed
  const name = document.getElementById('fullName').value.trim()
  if (!name) {
    showError('fullName', null, 'Nama lengkap wajib diisi.')
    valid = false
  } else if (name.length < 2) {
    showError('fullName', null, 'Nama minimal 2 karakter.')
    valid = false
  } else if (!/^[\p{L}\s'-]+$/u.test(name)) {
    showError('fullName', null, 'Nama hanya boleh berisi huruf, spasi, koma, dan tanda hubung.')
    valid = false
  } else if (/\d/.test(name)) {
    showError('fullName', null, 'Nama tidak boleh mengandung angka.')
    valid = false
  } else {
    clearError('fullName')
  }

  // Date of birth - check age reasonably (13-120 years old)
  const dob = document.getElementById('dateOfBirth').value
  if (dob) {
    const dobDate = new Date(dob)
    const now     = new Date()
    const age     = (now - dobDate) / (1000 * 60 * 60 * 24 * 365.25)
    if (dobDate >= now) {
      showError('dateOfBirth', null, 'Tanggal lahir tidak boleh di masa depan.')
      valid = false
    } else if (age < 13) {
      showError('dateOfBirth', null, 'Kamu harus berusia minimal 13 tahun.')
      valid = false
    } else if (age > 120) {
      showError('dateOfBirth', null, 'Tanggal lahir tidak valid (umur tidak realistis).')
      valid = false
    } else {
      clearError('dateOfBirth')
    }
  }

  // City - must be a valid Indonesian city
  const city = document.getElementById('city').value.trim()
  if (!city) {
    showError('city', null, 'Kota wajib diisi.')
    valid = false
  } else if (city.length < 2) {
    showError('city', null, 'Nama kota minimal 2 karakter.')
    valid = false
  } else if (!INDONESIAN_CITIES.some(c => c.toLowerCase() === city.toLowerCase())) {
    showError('city', null, 'Kota harus valid dan berada di Indonesia. Contoh: Jakarta, Surabaya, Bandung.')
    valid = false
  } else {
    clearError('city')
  }

  // Province - must be a valid Indonesian province (optional but validated if filled)
  const province = document.getElementById('province').value.trim()
  if (province && !INDONESIAN_PROVINCES.some(p => p.toLowerCase() === province.toLowerCase())) {
    showError('province', null, 'Provinsi harus valid. Contoh: DKI Jakarta, Jawa Barat.')
    valid = false
  } else if (province) {
    clearErrorOnly('province')
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

  // WhatsApp - accept "085...", "81...", or "628..."
  let wa = document.getElementById('whatsappNumber').value.trim().replace(/\D/g, '')
  if (!wa) {
    showError('whatsapp', null, 'Nomor WhatsApp wajib diisi.')
    valid = false
  } else {
    // Accept leading 0 and remove it (085... → 85...)
    if (wa.startsWith('0')) {
      wa = wa.substring(1)
    }
    
    // After removing leading 0, must start with 8 (Indonesian mobile)
    if (!wa.startsWith('8')) {
      showError('whatsapp', null, 'Nomor harus dimulai dengan 0 atau 8 (Indonesia). Contoh: 085693040587 atau 81234567890')
      valid = false
    } else if (wa.length < 10 || wa.length > 12) {
      // After removing leading 0, typical length is 10-12 digits
      showError('whatsapp', null, 'Nomor WhatsApp tidak valid. Contoh: 085693040587 atau 81234567890')
      valid = false
    } else {
      clearError('whatsapp')
    }
  }

  // At least ONE social media is required
  const tiktok = document.getElementById('tiktokHandle').value.trim()
  const ig = document.getElementById('instagramHandle').value.trim()
  const youtube = document.getElementById('youtubeHandle').value.trim()
  
  if (!tiktok && !ig && !youtube) {
    showError('tiktok', null, 'Masukkan minimal satu media sosial (TikTok, Instagram, atau YouTube).')
    valid = false
  } else {
    clearErrorOnly('tiktok')
  }

  // TikTok handle (optional if filled, validate format)
  if (tiktok && !/^[\w.]+$/.test(tiktok)) {
    showError('tiktok', null, 'Username TikTok hanya boleh berisi huruf, angka, titik, dan underscore.')
    valid = false
  }

  // Instagram handle (optional if filled, validate format)
  if (ig && !/^[\w.]+$/.test(ig)) {
    showError('instagram', null, 'Username Instagram tidak valid.')
    valid = false
  }

  // YouTube handle (optional if filled, validate format)
  if (youtube && youtube.length < 3) {
    showError('youtube', null, 'Username YouTube minimal 3 karakter.')
    valid = false
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
    
    // If "Lainnya" selected, validate the custom input
    if (platform.value === 'other') {
      const otherPlatform = document.getElementById('otherPlatform').value.trim()
      if (!otherPlatform) {
        showError('otherPlatform', null, 'Sebutkan platform lainnya.')
        valid = false
      } else if (otherPlatform.length < 2) {
        showError('otherPlatform', null, 'Platform minimal 2 karakter.')
        valid = false
      } else {
        clearErrorOnly('otherPlatform')
      }
    }
  }

  // Content category
  const categories = form.querySelectorAll('input[name="content_category"]:checked')
  if (categories.length === 0) {
    document.getElementById('categoryError').textContent = 'Pilih minimal satu kategori konten.'
    valid = false
  } else {
    document.getElementById('categoryError').textContent = ''
    
    // If "Lainnya" is selected, validate custom input
    const hasOther = Array.from(categories).some(c => c.value === 'other')
    if (hasOther) {
      const otherCategory = document.getElementById('otherCategory').value.trim()
      if (!otherCategory) {
        showError('otherCategory', null, 'Sebutkan kategori lainnya.')
        valid = false
      } else if (otherCategory.length < 2) {
        showError('otherCategory', null, 'Kategori minimal 2 karakter.')
        valid = false
      } else {
        clearErrorOnly('otherCategory')
      }
    }
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
  const get = id => {
    const val = document.getElementById(id)?.value.trim()
    return val || null
  }

  const getWithDefault = id => {
    const val = document.getElementById(id)?.value.trim()
    return val || 'not_provided'
  }

  // WhatsApp: normalize to +62 format
  let waRaw = document.getElementById('whatsappNumber').value.trim().replace(/\D/g, '')
  let whatsapp
  
  if (waRaw.startsWith('0')) {
    // "085..." → "+6285..."
    whatsapp = `+62${waRaw.substring(1)}`
  } else if (waRaw.startsWith('8')) {
    // "81..." → "+6281..."
    whatsapp = `+62${waRaw}`
  } else if (waRaw.startsWith('62')) {
    // "628..." → "+628..."
    whatsapp = `+${waRaw}`
  } else {
    whatsapp = `+62${waRaw}`
  }

  // Social handles: strip leading @ if user typed it, use "not_provided" if empty
  const stripAt = id => {
    const val = document.getElementById(id)?.value.trim().replace(/^@/, '') || null
    return val || 'not_provided'
  }

  // Collect additional platforms
  const additionalPlatforms = []
  document.querySelectorAll('.additionalPlatformName').forEach(input => {
    const platformName = input.value.trim()
    const handleInput = input.closest('.reg-field').querySelector('.additionalPlatformHandle')
    const platformHandle = handleInput ? handleInput.value.trim().replace(/^@/, '') : ''
    // Try to read follower/subscriber count for the custom platform (optional)
    const followerInput = input.closest('.reg-field').querySelector('.additionalPlatformFollowers')
    let followers = null
    if (followerInput) {
      const v = parseInt(followerInput.value.replace(/[^0-9]/g, ''), 10)
      followers = Number.isNaN(v) ? null : v
    }

    if (platformName && platformHandle) {
      const platformObj = {
        platform: platformName,
        handle: platformHandle
      }
      if (followers !== null) platformObj.followers = followers
      additionalPlatforms.push(platformObj)
    }
  })

  // Platform: keep the selected value, but store custom name separately if needed
  const platform = form.querySelector('input[name="primary_platform"]:checked')?.value || null
  const otherPlatformValue = platform === 'other' ? get('otherPlatform') : null

  // Categories: if "other" is selected, include the custom input in the array
  let categories = [...form.querySelectorAll('input[name="content_category"]:checked')]
    .map(el => el.value)
  
  // If "other" was selected, replace it with the custom input value
  if (categories.includes('other')) {
    const customCategory = get('otherCategory')
    categories = categories.filter(c => c !== 'other') // Remove "other"
    if (customCategory) {
      categories.push(customCategory) // Add custom value
    }
  }

  // Follower counts
  const toInt = id => {
    const v = parseInt(document.getElementById(id)?.value)
    return isNaN(v) ? null : v
  }

  return {
    full_name:           get('fullName'),
    date_of_birth:       get('dateOfBirth') || 'not_provided',
    gender:              get('gender') || 'not_provided',
    city:                get('city'),
    province:            get('province') || 'not_provided',
    country:             'Indonesia',
    email:               get('email'),
    whatsapp_number:     whatsapp,
    tiktok_handle:       stripAt('tiktokHandle'),
    instagram_handle:    stripAt('instagramHandle'),
    youtube_handle:      stripAt('youtubeHandle'),
    primary_platform:    platform,
    other_platform:      otherPlatformValue || null,
    content_category:    categories,
    follower_count_tt:   toInt('followerTt'),
    follower_count_ig:   toInt('followerIg'),
    follower_count_yt:   toInt('followerYt'),
    content_description: get('contentDescription') || 'not_provided',
    portfolio_url:       get('portfolioUrl') || 'not_provided',
    additional_platforms: additionalPlatforms.length > 0 ? JSON.stringify(additionalPlatforms) : null,
    user_agent:          navigator.userAgent,
    referrer_url:        document.referrer || 'not_provided',
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
// PLATFORM UTAMA - Show/hide "Lainnya" input
// ============================================================
document.querySelectorAll('input[name="primary_platform"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const otherPlatformField = document.getElementById('otherPlatformField')
    if (radio.value === 'other') {
      otherPlatformField.style.display = 'block'
      document.getElementById('otherPlatform').focus()
    } else {
      otherPlatformField.style.display = 'none'
      document.getElementById('otherPlatform').value = ''
      clearErrorOnly('otherPlatform')
    }
  })
})

// ============================================================
// KATEGORI KONTEN - Show/hide "Lainnya" input
// ============================================================
document.querySelectorAll('input[name="content_category"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const otherCategoryField = document.getElementById('otherCategoryField')
    const hasOther = form.querySelector('input[name="content_category"][value="other"]:checked')
    if (hasOther) {
      otherCategoryField.style.display = 'block'
      document.getElementById('otherCategory').focus()
    } else {
      otherCategoryField.style.display = 'none'
      document.getElementById('otherCategory').value = ''
      clearErrorOnly('otherCategory')
    }
  })
})

// ============================================================
// DYNAMIC ADDITIONAL PLATFORMS
// ============================================================
let platformCount = 0

function addPlatformField () {
  platformCount++
  const container = document.getElementById('additionalPlatformsContainer')
  
  const platformField = document.createElement('div')
  platformField.className = 'reg-field'
  platformField.id = `additionalPlatform-${platformCount}`
  platformField.style.marginTop = '1rem'
  
  platformField.innerHTML = `
    <label for="additionalPlatformName-${platformCount}">Platform ${platformCount + 3}</label>
    <div style="display: flex; gap: 0.5rem;">
      <input
        type="text"
        id="additionalPlatformName-${platformCount}"
        class="additionalPlatformName"
        placeholder="Nama platform"
        maxlength="50"
        style="flex: 1; padding: 0.8rem; border: 1px solid #2e2e2e; border-radius: 8px; background: #111111; color: #ffffff; font-family: Poppins, sans-serif;"
      />
      <div class="reg-field__prefix-wrap" style="flex: 1;">
        <span class="reg-field__prefix">@</span>
        <input
          type="text"
          class="additionalPlatformHandle"
          placeholder="Username"
          maxlength="100"
        />
      </div>
      <input
        type="number"
        class="additionalPlatformFollowers"
        id="additionalPlatformFollowers-${platformCount}"
        placeholder="Followers"
        min="0"
        style="width: 120px; padding: 0.6rem; border: 1px solid #2e2e2e; border-radius: 8px; background: #111111; color: #ffffff;"
      />
      <button type="button" class="removePlatformBtn" data-id="${platformCount}" style="padding: 0.6rem 0.8rem; background: #ef4444; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: 500;">
        ✕
      </button>
    </div>
  `
  
  container.appendChild(platformField)
  
  // Add remove listener
  platformField.querySelector('.removePlatformBtn').addEventListener('click', () => {
    platformField.remove()
  })
}

document.getElementById('addPlatformBtn').addEventListener('click', (e) => {
  e.preventDefault()
  addPlatformField()
})

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
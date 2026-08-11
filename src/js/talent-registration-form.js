import { supabase } from './supabase-client.js'
import {
  showFieldError,
  clearFieldError,
  clearFieldErrorOnly,
  validateRequiredText,
  validateEmail,
  validateWhatsApp,
} from './form-utils.js'

const COOLDOWN_MS = 60_000
const COOLDOWN_KEY = 'rce_talent_last_submit'
const INDONESIAN_CITIES = [
  'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang',
  'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Yogyakarta', 'Malang', 'Pontianak',
  'Banjarmasin', 'Kupang', 'Manado', 'Mataram', 'Denpasar', 'Bangli', 'Serang',
  'Pekanbaru', 'Jambi', 'Palangkaraya', 'Tanjung Pinang', 'Batam', 'Padang',
  'Bengkulu', 'Lampung', 'Cilegon', 'Cirebon', 'Kudus', 'Pati', 'Jepara',
  'Batang', 'Purwokerto', 'Sorong', 'Jayapura', 'Ambon', 'Ternate', 'Lhokseumawe',
  'Langsa', 'Aceh Besar', 'Subulussalam', 'Pidie', 'Pidie Jaya', 'Bireuen',
  'Aceh Utara', 'Aceh Barat', 'Aceh Selatan', 'Aceh Tenggara', 'Gayo Lues',
  'Nagan Raya', 'Aceh Jaya', 'Simeulue', 'Pulau Weh'
]

const INDONESIAN_PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
  'Bengkulu', 'Lampung', 'Bangka Belitung', 'Riau Islands', 'DKI Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten', 'Bali',
  'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
  'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara',
  'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo',
  'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua Barat', 'Papua', 'Papua Selatan',
  'Papua Tengah', 'Papua Pegunungan'
]

const form = document.getElementById('talentRegistrationForm')
const submitBtn = document.getElementById('submitBtn')
const submitLabel = document.getElementById('submitLabel')
const submitSpinner = document.getElementById('submitSpinner')
const agreeTerms = document.getElementById('agreeTerms')
const progressFill = document.getElementById('progressFill')

let currentStep = 1
const TOTAL_STEPS = 3

function updateProgress (step) {
  const pct = (step / TOTAL_STEPS) * 100
  progressFill.style.width = `${pct}%`

  document.querySelectorAll('.reg-progress__step').forEach((el) => {
    const s = parseInt(el.dataset.step, 10)
    el.classList.remove('active', 'completed')
    if (s === step) el.classList.add('active')
    if (s < step) el.classList.add('completed')
  })
}

function goToStep (step) {
  document.getElementById(`step${currentStep}`).classList.remove('active')
  currentStep = step
  document.getElementById(`step${currentStep}`).classList.add('active')
  updateProgress(currentStep)

  const progressEl = document.querySelector('.reg-progress')
  if (progressEl) {
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 80
    const elementPosition = progressEl.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: elementPosition - navHeight - 20, behavior: 'smooth' })
  }
}

function validateStep1 () {
  let valid = true

  if (!validateRequiredText('fullName', 'Nama lengkap wajib diisi.', { regex: /^[\p{L}\s'-]+$/u, invalidMessage: 'Nama hanya boleh berisi huruf, spasi, koma, dan tanda hubung.' })) {
    valid = false
  }

  const dob = document.getElementById('dateOfBirth').value
  if (!dob) {
    showFieldError('dateOfBirth', 'Tanggal lahir wajib diisi.')
    valid = false
  } else {
    const dobDate = new Date(dob)
    const now = new Date()
    const age = (now - dobDate) / (1000 * 60 * 60 * 24 * 365.25)
    if (dobDate >= now) {
      showFieldError('dateOfBirth', 'Tanggal lahir tidak boleh di masa depan.')
      valid = false
    } else if (age < 13) {
      showFieldError('dateOfBirth', 'Kamu harus berusia minimal 13 tahun.')
      valid = false
    } else if (age > 120) {
      showFieldError('dateOfBirth', 'Tanggal lahir tidak valid (umur tidak realistis).')
      valid = false
    } else {
      clearFieldError('dateOfBirth')
    }
  }

  const gender = document.getElementById('gender').value
  if (!gender) {
    showFieldError('gender', 'Gender wajib dipilih.')
    valid = false
  } else {
    clearFieldError('gender')
  }

  const city = document.getElementById('city').value.trim()
  if (!city) {
    showFieldError('city', 'Kota wajib diisi.')
    valid = false
  } else if (!INDONESIAN_CITIES.some((item) => item.toLowerCase() === city.toLowerCase())) {
    showFieldError('city', 'Kota harus valid dan berada di Indonesia.')
    valid = false
  } else {
    clearFieldError('city')
  }

  const province = document.getElementById('province').value.trim()
  if (province && !INDONESIAN_PROVINCES.some((item) => item.toLowerCase() === province.toLowerCase())) {
    showFieldError('province', 'Provinsi harus valid.')
    valid = false
  } else if (province) {
    clearFieldErrorOnly('province')
  }

  return valid
}

function validateStep2 () {
  let valid = true

  if (!validateWhatsApp('whatsappNumber')) valid = false
  if (!validateEmail('email')) valid = false

  const primaryTalent = document.getElementById('primaryTalent').value
  if (!primaryTalent) {
    showFieldError('primaryTalent', 'Primary talent wajib dipilih.')
    valid = false
  } else {
    clearFieldError('primaryTalent')
  }

  return valid
}

function validateStep3 () {
  let valid = true

  const profilePhoto = document.getElementById('profilePhoto').files[0]
  if (!profilePhoto) {
    showFieldError('profilePhoto', 'Foto profil wajib diunggah.')
    valid = false
  } else {
    clearFieldError('profilePhoto')
  }

  const days = form.querySelectorAll('input[name="available_days"]:checked')
  if (days.length === 0) {
    showFieldError('availableDays', 'Pilih minimal satu hari ketersediaan.')
    valid = false
  } else {
    clearFieldErrorOnly('availableDays')
  }

  const times = form.querySelectorAll('input[name="available_time"]:checked')
  if (times.length === 0) {
    showFieldError('availableTime', 'Pilih minimal satu rentang waktu.')
    valid = false
  } else {
    clearFieldErrorOnly('availableTime')
  }

  if (!agreeTerms.checked) {
    document.getElementById('termsError').textContent = 'Kamu harus menyetujui pernyataan ini untuk melanjutkan.'
    valid = false
  } else {
    document.getElementById('termsError').textContent = ''
  }

  return valid
}

function isOnCooldown () {
  const last = localStorage.getItem(COOLDOWN_KEY)
  if (!last) return false
  return (Date.now() - parseInt(last, 10)) < COOLDOWN_MS
}

function setCooldown () {
  localStorage.setItem(COOLDOWN_KEY, Date.now().toString())
}

function collectFormData () {
  const getValue = (id) => document.getElementById(id)?.value.trim() || null
  const getOptionalValue = (id) => document.getElementById(id)?.value.trim() || 'not_provided'
  const getCheckedValues = (name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value)

  const whatsapp = document.getElementById('whatsappNumber').value.trim().replace(/\D/g, '')
  const normalizedWhatsapp = whatsapp.startsWith('0') ? `+62${whatsapp.substring(1)}` : whatsapp.startsWith('8') ? `+62${whatsapp}` : whatsapp.startsWith('62') ? `+${whatsapp}` : `+62${whatsapp}`

  const profilePhoto = document.getElementById('profilePhoto').files[0]
  const resumeFile = document.getElementById('resumeFile').files[0]

  return {
    full_name: getValue('fullName'),
    stage_name: getOptionalValue('stageName'),
    date_of_birth: getValue('dateOfBirth') || 'not_provided',
    gender: getValue('gender') || 'not_provided',
    city: getValue('city'),
    province: getOptionalValue('province'),
    languages_spoken: getOptionalValue('languages'),
    email: getValue('email'),
    whatsapp_number: normalizedWhatsapp,
    primary_talent: getValue('primaryTalent') || 'not_provided',
    secondary_talents: getCheckedValues('secondary_talents'),
    skills: getCheckedValues('skills'),
    tiktok_username: getOptionalValue('tiktokUsername'),
    instagram_username: getOptionalValue('instagramUsername'),
    youtube_username: getOptionalValue('youtubeUsername'),
    facebook_username: getOptionalValue('facebookUsername'),
    available_days: getCheckedValues('available_days'),
    available_time: getCheckedValues('available_time'),
    verification_status: 'pending',
    user_agent: navigator.userAgent,
    referrer_url: document.referrer || 'not_provided',
    profile_photo_filename: profilePhoto ? profilePhoto.name : null,
    resume_filename: resumeFile ? resumeFile.name : null,
  }
}

async function uploadFiles (payload) {
  const profilePhoto = document.getElementById('profilePhoto').files[0]
  const resumeFile = document.getElementById('resumeFile').files[0]
  const files = []

  if (profilePhoto) {
    const profilePath = `talent-registrations/${Date.now()}-${profilePhoto.name.replace(/\s+/g, '-')}`
    const { error: profileError } = await supabase.storage.from('talent-uploads').upload(profilePath, profilePhoto, {
      cacheControl: '3600',
      upsert: false,
    })

    if (profileError) throw profileError
    payload.profile_photo_url = supabase.storage.from('talent-uploads').getPublicUrl(profilePath).data.publicUrl
  }

  if (resumeFile) {
    const resumePath = `talent-registrations/${Date.now()}-${resumeFile.name.replace(/\s+/g, '-')}`
    const { error: resumeError } = await supabase.storage.from('talent-uploads').upload(resumePath, resumeFile, {
      cacheControl: '3600',
      upsert: false,
    })

    if (resumeError) throw resumeError
    payload.resume_url = supabase.storage.from('talent-uploads').getPublicUrl(resumePath).data.publicUrl
  }

  return payload
}

async function handleSubmit (event) {
  event.preventDefault()

  if (document.getElementById('honeypot').value !== '') return
  if (!validateStep3()) return
  if (isOnCooldown()) {
    document.getElementById('termsError').textContent = 'Kamu baru saja mengirim formulir. Silakan tunggu 60 detik sebelum mencoba lagi.'
    return
  }

  submitLabel.textContent = 'Mengirim...'
  submitSpinner.hidden = false
  submitBtn.disabled = true

  try {
    let payload = collectFormData()
    payload = await uploadFiles(payload)

    const { error } = await supabase.from('data_talent').insert([payload])
    if (error) throw error

    setCooldown()
    window.location.href = '/register/success'
  } catch (error) {
    console.error('Talent registration error:', error)
    document.getElementById('termsError').textContent = 'Terjadi kesalahan saat mengirim formulir. Silakan coba lagi.'
    submitLabel.textContent = 'Kirim Pendaftaran'
    submitSpinner.hidden = true
    submitBtn.disabled = false
  }
}

function updateProfilePhotoPreview () {
  const input = document.getElementById('profilePhoto')
  const preview = document.getElementById('profilePhotoPreview')
  const previewImg = document.getElementById('profilePhotoPreviewImg')
  const file = input?.files?.[0]

  if (!file || !file.type.startsWith('image/')) {
    preview.hidden = true
    previewImg.removeAttribute('src')
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    previewImg.src = event.target.result
    preview.hidden = false
  }
  reader.readAsDataURL(file)
}

function bindEvents () {
  document.getElementById('toStep2').addEventListener('click', () => {
    if (validateStep1()) goToStep(2)
  })

  document.getElementById('toStep3').addEventListener('click', () => {
    if (validateStep2()) goToStep(3)
  })

  document.getElementById('toStep1').addEventListener('click', () => goToStep(1))
  document.getElementById('toStep2b').addEventListener('click', () => goToStep(2))

  agreeTerms.addEventListener('change', () => {
    submitBtn.disabled = !agreeTerms.checked
  })

  document.getElementById('profilePhoto').addEventListener('change', updateProfilePhotoPreview)

  form.addEventListener('submit', handleSubmit)

  const navToggle = document.getElementById('navToggle')
  const navLinks = document.getElementById('navLinks')
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active')
      navToggle.classList.toggle('active')
    })
  }
}

bindEvents()
updateProgress(1)


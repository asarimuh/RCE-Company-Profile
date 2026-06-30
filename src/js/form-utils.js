function getInputById (fieldId) {
  return document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`)
}

function getErrorElement (fieldId) {
  return document.getElementById(`${fieldId}Error`)
}

function getInputWrap (fieldId) {
  const input = getInputById(fieldId)
  return input?.closest('.reg-field__prefix-wrap') || null
}

export function showFieldError (fieldId, message) {
  const errorEl = getErrorElement(fieldId)
  const input = getInputById(fieldId)

  if (errorEl) errorEl.textContent = message
  if (input) {
    input.classList.add('error')
    input.classList.remove('valid')
  }

  const wrap = getInputWrap(fieldId)
  if (wrap) {
    wrap.classList.add('error')
    wrap.classList.remove('valid')
  }
}

export function clearFieldError (fieldId) {
  const errorEl = getErrorElement(fieldId)
  const input = getInputById(fieldId)

  if (errorEl) errorEl.textContent = ''
  if (input) {
    input.classList.remove('error')
    input.classList.add('valid')
  }

  const wrap = getInputWrap(fieldId)
  if (wrap) {
    wrap.classList.remove('error')
    wrap.classList.add('valid')
  }
}

export function clearFieldErrorOnly (fieldId) {
  const errorEl = getErrorElement(fieldId)
  const input = getInputById(fieldId)

  if (errorEl) errorEl.textContent = ''
  if (input) {
    input.classList.remove('error', 'valid')
  }

  const wrap = getInputWrap(fieldId)
  if (wrap) wrap.classList.remove('error', 'valid')
}

export function validateRequiredText (fieldId, message, options = {}) {
  const input = getInputById(fieldId)
  const value = input?.value.trim() || ''
  const { minLength = 2, regex = null, invalidMessage = message } = options

  if (!value) {
    showFieldError(fieldId, message)
    return false
  }

  if (value.length < minLength) {
    showFieldError(fieldId, message)
    return false
  }

  if (regex && !regex.test(value)) {
    showFieldError(fieldId, invalidMessage)
    return false
  }

  clearFieldError(fieldId)
  return true
}

export function validateEmail (fieldId) {
  const input = getInputById(fieldId)
  const value = input?.value.trim() || ''
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!value) {
    showFieldError(fieldId, 'Email wajib diisi.')
    return false
  }

  if (!emailRe.test(value)) {
    showFieldError(fieldId, 'Format email tidak valid.')
    return false
  }

  clearFieldError(fieldId)
  return true
}

export function validateWhatsApp (fieldId) {
  const input = getInputById(fieldId)
  const value = input?.value.trim() || ''
  const digits = value.replace(/\D/g, '')

  if (!digits) {
    showFieldError(fieldId, 'Nomor WhatsApp wajib diisi.')
    return false
  }

  const normalized = digits.startsWith('0') ? digits.slice(1) : digits
  if (!normalized.startsWith('8')) {
    showFieldError(fieldId, 'Nomor harus dimulai dengan 0 atau 8 (Indonesia).')
    return false
  }

  if (normalized.length < 10 || normalized.length > 12) {
    showFieldError(fieldId, 'Nomor WhatsApp tidak valid.')
    return false
  }

  clearFieldError(fieldId)
  return true
}

export function validateOptionalUrl (fieldId) {
  const input = getInputById(fieldId)
  const value = input?.value.trim() || ''

  if (!value) {
    clearFieldErrorOnly(fieldId)
    return true
  }

  try {
    new URL(value)
    clearFieldErrorOnly(fieldId)
    return true
  } catch {
    showFieldError(fieldId, 'Format URL tidak valid.')
    return false
  }
}

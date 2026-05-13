'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLazyCheckEmailAvailabilityQuery, useLazyCheckReferralAvailabilityQuery, useLazyCheckUsernameAvailabilityQuery, useRegisterMutation } from '@/store/api/authApi'
import Loading from './Loading'
import { useSearchParams } from 'next/navigation'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import OtpVerification from './auth/OtpVerification'
import { clearStoredReferralCode, getStoredReferralCode, normalizeReferralCode } from '@/libs/referral'
import PrimaryButton from '@/components/ui/buttons/PrimaryButton'

const EyeIcon = ({ open }: { open: boolean }) => open
  ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-white/80 mb-1.5'
const inputClass = 'h-11 w-full rounded-[18px] border border-gray-300 dark:border-white/18 bg-white dark:bg-white/12 px-4 text-sm text-gray-900 dark:text-white outline-none transition-all duration-200 focus:border-sky-400 dark:focus:border-sky-400/60 focus:bg-white dark:focus:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60'

const formatPhilippineMobile = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  const first = digits.slice(0, 4)
  const second = digits.slice(4, 7)
  const third = digits.slice(7, 11)

  if (digits.length <= 4) return first
  if (digits.length <= 7) return `${first}-${second}`
  return `${first}-${second}-${third}`
}

type FloatingInputProps = {
  id: string
  type?: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void
  required?: boolean
  disabled?: boolean
  maxLength?: number
  endContent?: ReactNode
}

function FloatingInput({ id, type = 'text', label, value, onChange, onBlur, onPaste, required, disabled, maxLength, endContent }: FloatingInputProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className={labelClass}>
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="relative w-full">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onPaste={onPaste}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          className={inputClass}
        />
        {endContent ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/60">
            {endContent}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const passwordChecks = (password: string) => ([
  { label: 'At least 8 characters', passed: password.length >= 8 },
  { label: 'At least one uppercase letter', passed: /[A-Z]/.test(password) },
  { label: 'At least one lowercase letter', passed: /[a-z]/.test(password) },
  { label: 'At least one number', passed: /[0-9]/.test(password) },
  { label: 'At least one special character', passed: /[^A-Za-z0-9]/.test(password) },
])

const termsSections = [
  {
    title: '1. Independent Distributor Agreement',
    body: 'By becoming a distributor of our company, you agree to be bound by the terms and conditions outlined in this agreement. You acknowledge that you are an independent contractor and not an employee, partner, or agent of the company.',
  },
  {
    title: '2. Distributor Obligations',
    body: 'As a distributor, you agree to adhere to all applicable laws, regulations, and ethical guidelines in promoting and selling our products and services, represent the company honestly and accurately, maintain a positive and professional image, and attend company-provided training and development programs.',
  },
  {
    title: '3. Compensation Plan',
    body: 'Our company uses a compensation plan that rewards distributors for sales and building a network. The details of the compensation plan, including commission structure, bonus eligibility, and qualification criteria, are outlined in a separate document, which is an integral part of these terms and conditions.',
  },
  {
    title: '4. Product Purchase Requirements',
    body: 'To remain an active distributor and qualify for commissions and bonuses, you are required to meet monthly or quarterly product purchase requirements. These requirements may include personal consumption and or retail sales requirements. Failure to meet these requirements may result in the loss of commissions and bonuses.',
  },
  {
    title: '5. Downline Structure',
    body: 'You may build and manage a network of distributors, commonly referred to as your downline. You understand that your commissions and bonuses may be based on the sales performance and activities of your downline. However, you are responsible for training, supporting, and motivating your downline members.',
  },
  {
    title: '6. Termination and Resignation',
    body: 'Either party may terminate this agreement at any time with written notice. You understand that in the event of termination or resignation, you will no longer be eligible to receive commissions, bonuses, or other benefits associated with the MLM business.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All trademarks, logos, copyrighted materials, and other intellectual property owned by the company are protected and may not be used without written permission. Any unauthorized use of company intellectual property may result in legal action.',
  },
  {
    title: '8. Non-Disparagement',
    body: 'During and after the term of this agreement, you agree not to make any disparaging or defamatory statements about the company, its products, or other distributors. Violation of this clause may result in termination and legal consequences.',
  },
  {
    title: '9. Product Returns and Refunds',
    body: 'Our company has a product return policy that allows customers to request refunds or exchanges within a specified time frame. You understand that you are responsible for handling customer returns and refunds, and any costs associated with the process.',
  },
  {
    title: '10. Governing Law and Jurisdiction',
    body: 'This agreement shall be governed by and construed in accordance with the laws of the Philippines. Any disputes arising from this agreement shall be subject to the exclusive jurisdiction of the courts of the Philippines.',
  },
]

interface SignUpFormProps {
  onSwitchToLogin: () => void
  turnstileSiteKey?: string
  initialReferralCode?: string
  partnerSlug?: string
  otpSenderName?: string
}

type FieldAvailability = {
  status: 'idle' | 'checking' | 'available' | 'unavailable'
  message: string
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const candidate = error as { data?: { message?: string } }
  const message = candidate?.data?.message || fallback
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('could not be found') || lowerMessage.includes('route api/')) {
    return 'Unable to check referral code right now.'
  }

  return message
}

const isReferralCodeFormatValid = (value: string) => /^[A-Za-z0-9]+$/.test(value)

export default function SignUpForm({
  onSwitchToLogin,
  turnstileSiteKey = '',
  initialReferralCode = '',
  partnerSlug = '',
  otpSenderName = '',
}: SignUpFormProps) {
  const searchParams = useSearchParams()
  const [register, { isLoading }] = useRegisterMutation()
  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string>('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [checkEmailAvailability] = useLazyCheckEmailAvailabilityQuery()
  const [checkReferralAvailability] = useLazyCheckReferralAvailabilityQuery()
  const [checkUsernameAvailability] = useLazyCheckUsernameAvailabilityQuery()
  const initialReferral = normalizeReferralCode(initialReferralCode)
    || normalizeReferralCode(searchParams.get('ref') ?? searchParams.get('referred_by') ?? '')
    || getStoredReferralCode()

  const isReferralLocked = Boolean(initialReferral)

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [verificationToken, setVerificationToken] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [emailAvailability, setEmailAvailability] = useState<FieldAvailability>({ status: 'idle', message: '' })
  const [referralAvailability, setReferralAvailability] = useState<FieldAvailability>({ status: 'idle', message: '' })
  const [usernameAvailability, setUsernameAvailability] = useState<FieldAvailability>({ status: 'idle', message: '' })
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    username: '',
    referredBy: initialReferral,
    password: '',
    confirmPassword: '',
  })

  const passwordRequirements = passwordChecks(form.password)
  const mobileDigits = form.mobileNumber.replace(/\D/g, '')
  const normalizedEmail = form.email.trim()
  const normalizedReferral = normalizeReferralCode(form.referredBy)
  const normalizedUsername = form.username.trim()
  const mobileNumberStatus =
    mobileDigits.length === 0
      ? null
      : mobileDigits.length < 11
        ? { type: 'invalid' as const, message: 'Mobile number is incomplete. It must be 11 digits.' }
        : !/^09\d{9}$/.test(mobileDigits)
          ? { type: 'invalid' as const, message: 'Mobile number must start with 09 and contain exactly 11 digits.' }
          : { type: 'valid' as const, message: 'Mobile number format is valid.' }
  const confirmPasswordStatus =
    form.confirmPassword.length === 0
      ? null
      : form.password === form.confirmPassword
        ? { type: 'match' as const, message: 'Passwords match.' }
        : { type: 'mismatch' as const, message: 'Passwords do not match yet.' }

  const showError = (message: string): false => {
    setError(message)
    return false
  }

  const handleReferralInputChange = (value: string) => {
    if (isReferralLocked) return
    setForm((prev) => ({
      ...prev,
      referredBy: value,
    }))
  }

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!turnstileSiteKey) return

    let cancelled = false

    const doRender = () => {
      if (cancelled || !turnstileRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => { if (!cancelled) setTurnstileToken(token) },
        'expired-callback': () => { if (!cancelled) setTurnstileToken('') },
        'error-callback': () => { if (!cancelled) setTurnstileToken('') },
        theme: 'auto',
      })
    }

    const SCRIPT_ID = 'cf-turnstile-script'
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      document.head.appendChild(script)
    }

    if (window.turnstile) {
      doRender()
    } else {
      script.addEventListener('load', doRender, { once: true })
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch {}
        widgetIdRef.current = ''
      }
      setTurnstileToken('')
    }
  }, [turnstileSiteKey, isMounted])

  const resetTurnstile = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
    setTurnstileToken('')
  }

  useEffect(() => {
    const email = normalizedEmail

    if (!email) {
      setEmailAvailability({ status: 'idle', message: '' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailability({ status: 'unavailable', message: 'Enter a valid email address.' })
      return
    }

    setEmailAvailability({ status: 'checking', message: 'Checking email availability...' })

    const timer = window.setTimeout(async () => {
      try {
        const response = await checkEmailAvailability(email, true).unwrap()
        setEmailAvailability({
          status: response.available ? 'available' : 'unavailable',
          message: response.message,
        })
      } catch (apiError: unknown) {
        const message = getApiErrorMessage(apiError, 'Unable to check email availability right now.')
        setEmailAvailability({ status: 'unavailable', message })
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [checkEmailAvailability, normalizedEmail])

  useEffect(() => {
    const username = normalizedUsername

    if (!username) {
      setUsernameAvailability({ status: 'idle', message: '' })
      return
    }

    if (!/^[A-Za-z0-9]+$/.test(username)) {
      setUsernameAvailability({ status: 'unavailable', message: 'Username must contain letters and numbers only.' })
      return
    }

    setUsernameAvailability({ status: 'checking', message: 'Checking username availability...' })

    const timer = window.setTimeout(async () => {
      try {
        const response = await checkUsernameAvailability(username, true).unwrap()
        setUsernameAvailability({
          status: response.available ? 'available' : 'unavailable',
          message: response.message,
        })
      } catch (apiError: unknown) {
        const message = getApiErrorMessage(apiError, 'Unable to check username availability right now.')
        setUsernameAvailability({ status: 'unavailable', message })
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [checkUsernameAvailability, normalizedUsername])

  useEffect(() => {
    const referral = normalizedReferral

    if (!referral) {
      setReferralAvailability({ status: 'idle', message: '' })
      return
    }

    if (!isReferralCodeFormatValid(referral)) {
      setReferralAvailability({ status: 'unavailable', message: 'Invalid referral link or code.' })
      return
    }

    setReferralAvailability({ status: 'checking', message: 'Checking referral code...' })

    const timer = window.setTimeout(async () => {
      try {
        const response = await checkReferralAvailability(referral, true).unwrap()
        setReferralAvailability({
          status: response.available ? 'available' : 'unavailable',
          message: response.available ? 'Referral code is valid.' : 'Invalid referral code.',
        })
      } catch (apiError: unknown) {
        const message = getApiErrorMessage(apiError, 'Unable to check referral code right now.')
        setReferralAvailability({ status: 'unavailable', message })
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [checkReferralAvailability, normalizedReferral])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const mobileNumber = mobileDigits
    const email = form.email.trim()
    const username = form.username.trim()
    const referral = normalizeReferralCode(form.referredBy)

    if (!firstName) return showError('First name is required.')
    if (!lastName) return showError('Last name is required.')
    if (!mobileNumber) return showError('Mobile number is required.')
    if (mobileNumber.length < 11) return showError('Mobile number is incomplete. It must be 11 digits.')
    if (!/^09\d{9}$/.test(mobileNumber)) return showError('Enter a valid Philippine mobile number in 11-digit format, like 0929-226-0447.')
    if (!email) return showError('Email address is required.')
    if (emailAvailability.status === 'unavailable') return showError(emailAvailability.message || 'This email is already registered.')
    if (emailAvailability.status !== 'available') return showError('Please wait until email availability is confirmed.')
    if (!username) return showError('Username is required.')
    if (!/^[A-Za-z0-9]+$/.test(username)) return showError('Username must contain letters and numbers only.')
    if (usernameAvailability.status === 'unavailable') return showError(usernameAvailability.message || 'This username is already taken.')
    if (usernameAvailability.status !== 'available') return showError('Please wait until username availability is confirmed.')
    if (!referral) return showError('Referral code is required.')
    if (referralAvailability.status === 'unavailable') return showError(referralAvailability.message || 'Referral code is invalid or unavailable.')
    if (referralAvailability.status === 'checking') return showError('Please wait until referral code validation is confirmed.')
    if (!form.password) return showError('Password is required.')
    if (form.password.length < 8) return showError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return showError('Passwords do not match.')
    if (!acceptedTerms) return showError('You must read and accept the Terms and Conditions to continue.')

    const result = await register({
      name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      phone: mobileNumber,
      email,
      username,
      referred_by: referral,
      partner_slug: partnerSlug || undefined,
      password: form.password,
      password_confirmation: form.confirmPassword,
      cf_turnstile_response: turnstileToken || undefined,
    })

    if ('error' in result) {
      const errorData = (result.error as { data?: { errors?: Record<string, string[]>; message?: string } }).data
      const firstError = errorData?.errors
        ? Object.values(errorData.errors)[0]?.[0]
        : errorData?.message || 'Registration failed. Please try again.'
      showError(firstError)
      showErrorToast(firstError)
      resetTurnstile()
      return
    }

    setVerificationToken(result.data.verification_token)
    setPendingEmail(result.data.email || email)
    setStep('otp')
    showSuccessToast('A 4-digit verification code was sent to your email.')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Let&apos;s Get Started!</h2>
      <p className="text-gray-500 dark:text-white/70 text-sm mb-5">
        {step === 'otp'
          ? 'Enter the 4-digit code we sent to your email to finish your registration.'
          : 'Please enter the required details to create your account.'}
      </p>

      {step === 'otp' ? (
        <OtpVerification
          email={pendingEmail}
          verificationToken={verificationToken}
          senderName={otpSenderName}
          onSuccess={() => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('afhome_new_registration_email', pendingEmail)
            }
            clearStoredReferralCode()
            setStep('form')
            setVerificationToken('')
            setPendingEmail('')
            onSwitchToLogin()
          }}
          onBack={() => {
            setStep('form')
            setVerificationToken('')
            setPendingEmail('')
          }}
        />
      ) : (
        <form onSubmit={handleRegister} noValidate className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {/* First Name */}
            <div>
              <FloatingInput id="signup-first-name" label="First Name" required value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
            </div>

            {/* Last Name */}
            <div>
              <FloatingInput id="signup-last-name" label="Last Name" required value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
            </div>

            {/* Mobile Number */}
            <div>
              <FloatingInput
                id="signup-mobile-number"
                type="tel"
                label="Mobile Number"
                required
                value={form.mobileNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, mobileNumber: formatPhilippineMobile(e.target.value) }))}
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-white/55">Use 11 digits only. Format: 0929-226-0447.</p>
              {mobileNumberStatus ? (
                <p className={`mt-1 text-[11px] ${mobileNumberStatus.type === 'valid' ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                  {mobileNumberStatus.message}
                </p>
              ) : null}
            </div>

            {/* Email */}
            <div>
              <FloatingInput id="signup-email" type="email" label="Email Address" required value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              {emailAvailability.message ? (
                <p className={`mt-1 text-[11px] ${emailAvailability.status === 'available' ? 'text-emerald-600 dark:text-emerald-300' : emailAvailability.status === 'checking' ? 'text-sky-600 dark:text-sky-300' : 'text-red-600 dark:text-red-300'}`}>
                  {emailAvailability.message}
                </p>
              ) : null}
            </div>

            {/* Username */}
            <div>
              <FloatingInput
                id="signup-username"
                label="Username"
                required
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value.replace(/\s+/g, '') }))}
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-white/55">Letters and numbers only, no spaces or symbols.</p>
              {usernameAvailability.message ? (
                <p className={`mt-1 text-[11px] ${usernameAvailability.status === 'available' ? 'text-emerald-600 dark:text-emerald-300' : usernameAvailability.status === 'checking' ? 'text-sky-600 dark:text-sky-300' : 'text-red-600 dark:text-red-300'}`}>
                  {usernameAvailability.message}
                </p>
              ) : null}
            </div>

            {/* Referral Code */}
            <div>
              <FloatingInput
                id="signup-referred-by"
                label="Referral Code / Referral Link"
                value={form.referredBy}
                onChange={(e) => handleReferralInputChange(e.target.value)}
                required
                disabled={isReferralLocked}
              />
              {referralAvailability.message ? (
                <p className={`mt-1 text-[11px] ${
                  referralAvailability.status === 'available'
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : referralAvailability.status === 'checking'
                      ? 'text-sky-600 dark:text-sky-300'
                      : 'text-red-600 dark:text-red-300'
                }`}>
                  {referralAvailability.message}
                </p>
              ) : null}
            </div>

            {/* Password */}
            <div>
              <FloatingInput
                type={showPass ? 'text' : 'password'}
                id="signup-password"
                label="Password"
                required
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                endContent={(
                  <button type="button" onClick={() => setShowPass((p) => !p)} className="text-gray-400 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/80 transition-colors cursor-pointer">
                    <EyeIcon open={showPass} />
                  </button>
                )}
              />
              <div className="mt-2 grid grid-cols-1 gap-1">
                {passwordRequirements.map((item) => (
                  <p key={item.label} className={`text-[11px] flex items-center gap-2 ${item.passed ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-white/55'}`}>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${item.passed ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-white/25'}`} />
                    {item.label}
                  </p>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <FloatingInput
                type={showConfirm ? 'text' : 'password'}
                id="signup-confirm-password"
                label="Password Confirmation"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                endContent={(
                  <button type="button" onClick={() => setShowConfirm((p) => !p)} className="text-gray-400 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/80 transition-colors cursor-pointer">
                    <EyeIcon open={showConfirm} />
                  </button>
                )}
              />
              {confirmPasswordStatus ? (
                <p className={`mt-1 text-[11px] ${confirmPasswordStatus.type === 'match' ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                  {confirmPasswordStatus.message}
                </p>
              ) : null}
            </div>

            {/* Terms & Conditions — full width */}
            <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] font-bold ${
                  acceptedTerms
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-gray-300 bg-white text-transparent dark:border-white/20 dark:bg-transparent'
                }`}>
                  ✓
                </span>
                <span className="text-xs leading-relaxed text-gray-600 dark:text-white/70">
                  I have read and agree to the{' '}
                  <span className="font-semibold text-sky-600 dark:text-sky-300">Terms and Conditions</span>.
                  <span className="block mt-1 text-[11px] text-gray-500 dark:text-white/50">
                    Click here to review the agreement before continuing.
                  </span>
                </span>
              </button>
            </div>

            {/* Turnstile — full width */}
            {isMounted && turnstileSiteKey && (
              <div className="sm:col-span-2 flex justify-center">
                <div ref={turnstileRef} />
              </div>
            )}

            {/* Submit — full width */}
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <PrimaryButton type="submit" disabled={isLoading || (!!turnstileSiteKey && !turnstileToken)} className="flex-1 py-3 px-5 text-sm">
                {isLoading ? (
                  <>
                    <Loading size={14} />
                    <span>SENDING OTP...</span>
                  </>
                ) : (
                  <span>SIGN UP</span>
                )}
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {isMounted
        ? createPortal(
            <AnimatePresence>
              {showTermsModal ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/72 px-3 py-3 backdrop-blur-[2px] sm:px-4 sm:py-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900 sm:max-h-[calc(100dvh-3rem)]"
                  >
                <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10 sm:px-6 sm:py-5">
                  <div>
                    <img
                      src="/Images/af_home_logo.png"
                      alt="AF Home"
                      className="h-10 w-auto sm:h-12"
                    />
                    <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Terms and Conditions</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/60">
                      The following are the latest Terms and Conditions of AF Home.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:text-white/60 dark:hover:border-white/20 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
                  {termsSections.map((section) => (
                    <div key={section.title}>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{section.title}</h4>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-white/70">{section.body}</p>
                    </div>
                  ))}

                  <div>
                    <p className="text-sm leading-7 text-slate-600 dark:text-white/70">
                      By signing below or by accepting these terms and conditions electronically, you acknowledge that you have read,
                      understood, and agreed to abide by the terms and conditions of AF Home.
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-700 dark:text-white/80">
                      Need clarification? Reach us anytime through the Contact Us page.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-3 border-t border-slate-200 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
                  >
                    Not Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptedTerms(true)
                      setShowTermsModal(false)
                    }}
                    className="min-h-11 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
                  >
                    I Agree
                  </button>
                </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </motion.div>
  )
}

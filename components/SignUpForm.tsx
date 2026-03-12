'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRegisterMutation } from '@/store/api/authApi'
import Loading from './Loading'
import { usePhAddress } from '@/hooks/usePhAddress'
import { useSearchParams } from 'next/navigation'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import OtpVerification from './auth/OtpVerification'
import { clearStoredReferralCode, getStoredReferralCode, normalizeReferralCode } from '@/libs/referral'

const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

const inputClass = "w-full px-4 py-3 bg-white/15 border border-white/25 rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:bg-white/20 transition-all"
const selectClass = "w-full px-4 py-3 bg-white/15 border border-white/25 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:bg-white/20 transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
const labelClass = "block text-xs font-semibold text-white/80 mb-1.5"
const blockedWords = ['fuck', 'shit', 'bitch', 'asshole', 'puta', 'gago', 'ulol', 'tanga', 'tarantado', 'nigger', 'nigga', 'faggot', 'porn', 'sex']

const containsBlockedWord = (value: string) => {
    const lower = value.toLowerCase()
    const normalized = lower.replace(/[^a-z0-9]+/g, ' ')
    const compact = lower.replace(/[^a-z0-9]+/g, '')

    return blockedWords.some((word) => {
        const needle = word.toLowerCase()
        const needleCompact = needle.replace(/[^a-z0-9]+/g, '')
        return normalized.includes(needle) || (needleCompact.length > 0 && compact.includes(needleCompact))
    })
}

const getPasswordStrength = (password: string) => {
    let score = 0

    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    if (password.length >= 12) score += 1

    if (password.length === 0) {
        return {
            score: 0,
            label: 'Enter a password',
            color: 'bg-white/10',
            textColor: 'text-white/50',
            width: '0%',
        }
    }

    if (score <= 2) {
        return {
            score,
            label: 'Weak password',
            color: 'bg-red-400',
            textColor: 'text-red-300',
            width: '33%',
        }
    }

    if (score <= 4) {
        return {
            score,
            label: 'Medium strength',
            color: 'bg-yellow-400',
            textColor: 'text-yellow-300',
            width: '66%',
        }
    }

    return {
        score,
        label: 'Strong password',
        color: 'bg-emerald-400',
        textColor: 'text-emerald-300',
        width: '100%',
    }
}

const passwordChecks = (password: string) => ([
    {
        label: 'At least 8 characters',
        passed: password.length >= 8,
    },
    {
        label: 'At least one uppercase letter',
        passed: /[A-Z]/.test(password),
    },
    {
        label: 'At least one lowercase letter',
        passed: /[a-z]/.test(password),
    },
    {
        label: 'At least one number',
        passed: /[0-9]/.test(password),
    },
    {
        label: 'At least one special character',
        passed: /[^A-Za-z0-9]/.test(password),
    },
])

const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
        {children}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </div>
    </div>
)

interface SignUpFormProps {
    onSwitchToLogin: () => void
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
    const searchParams = useSearchParams()
    const [register, { isLoading }] = useRegisterMutation()

    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState<'form' | 'otp'>('form')
    const [otp, setOtp] = useState('')
    const [verificationToken, setVerificationToken] = useState('')
    const [pendingEmail, setPendingEmail] = useState('')
    const errorRef = useRef<HTMLDivElement | null>(null)

    const ph = usePhAddress()

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        gender: '',
        occupation: '',
        workLocation: 'local',
        country: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        username: '',
        referredBy: '',
        birthDate: '',
        address: '',
        zipCode: '',
        agreeTerms: false,
    })

    const passwordStrength = getPasswordStrength(form.password)
    const passwordRequirements = passwordChecks(form.password)

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

    useEffect(() => {
        const ref = normalizeReferralCode(searchParams.get('ref') ?? searchParams.get('referred_by') ?? '') || getStoredReferralCode()
        if (!ref) return
        setForm((prev) => (prev.referredBy ? prev : { ...prev, referredBy: ref }))
    }, [searchParams])


    const showError = (message: string) => {
        setError(message)
        requestAnimationFrame(() => {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
    }

    const resetOtpStep = () => {
        setStep('form')
        setOtp('')
        setVerificationToken('')
        setPendingEmail('')
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!form.agreeTerms) return showError('You must agree to the Terms & Conditions.')
        if (form.password !== form.confirmPassword) return showError('Passwords do not match.')
        if (form.password.length < 8) return showError('Password must be at least 8 characters.')
        if (!/[A-Z]/.test(form.password)) return showError('Password must include at least one uppercase letter.')
        if (!/[a-z]/.test(form.password)) return showError('Password must include at least one lowercase letter.')
        if (!/[0-9]/.test(form.password)) return showError('Password must include at least one number.')
        if (!/[^A-Za-z0-9]/.test(form.password)) return showError('Password must include at least one special character.')
        if (containsBlockedWord(form.firstName) || containsBlockedWord(form.lastName) || containsBlockedWord(form.username) || containsBlockedWord(form.middleName)) {
            return showError('Account details contain prohibited words. Please use appropriate name/username.')
        }

        const result = await register({
            name: `${form.firstName} ${form.lastName}`,
            first_name: form.firstName,
            last_name: form.lastName,
            middle_name: form.middleName,
            email: form.email,
            password: form.password,
            password_confirmation: form.confirmPassword,
            phone: form.phone,
            username: form.username,
            referred_by: normalizeReferralCode(form.referredBy),
            birth_date: form.birthDate,
            gender: form.gender === '' ? undefined : (form.gender as 'male' | 'female' | 'other'),
            occupation: form.occupation,
            work_location: form.workLocation as 'local' | 'overseas',
            country: form.workLocation === 'overseas' ? form.country : 'Philippines',
            address: form.address,
            barangay: ph.address.barangay,
            city: ph.address.city,
            province: ph.address.province,
            region: ph.address.region,
            zip_code: form.zipCode,
        })

        if ('error' in result) {
            const errorData = (result.error as { data?: { errors?: Record<string, string[]>; message?: string } }).data
            const firstError = errorData?.errors
                ? Object.values(errorData.errors)[0][0]
                : errorData?.message || 'Registration failed. Please try again.'
            showError(firstError)
            showErrorToast(firstError)
            return
        }

        setVerificationToken(result.data.verification_token)
        setPendingEmail(result.data.email || form.email)
        setOtp('')
        setStep('otp')
        setError('')
        showSuccessToast('A 4-digit verification code was sent to your email.')
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
        >
            <h2 className="text-2xl font-bold text-white mb-1">Let&apos;s Get Started!</h2>
            <p className="text-white/70 text-sm mb-6">
                {step === 'otp'
                    ? 'Enter the 4-digit code we sent to your email to finish your registration.'
                    : 'Please enter your details to start your online application'}
            </p>

            {step === 'otp' ? (
                <OtpVerification 
                    email={pendingEmail}
                    verificationToken={verificationToken}
                    onSuccess={() => {
                        clearStoredReferralCode()
                        resetOtpStep()
                        onSwitchToLogin()
                    }}
                    onBack={resetOtpStep}
                />
            ) : (
            <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                    <div ref={errorRef} className="bg-red-500/20 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* ── Personal Information ── */}
                <div className="space-y-1 pb-1">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Personal Information</p>
                    <div className="h-px bg-white/10" />
                </div>

                {/* First + Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>First Name <span className="text-orange-400">*</span></label>
                        <input type="text" placeholder="First name" required
                            value={form.firstName} onChange={set('firstName')} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Last Name <span className="text-orange-400">*</span></label>
                        <input type="text" placeholder="Last name" required
                            value={form.lastName} onChange={set('lastName')} className={inputClass} />
                    </div>
                </div>

                {/* Middle Name */}
                <div>
                    <label className={labelClass}>Middle Name</label>
                    <input type="text" placeholder="Middle name"
                        value={form.middleName} onChange={set('middleName')} className={inputClass} />
                </div>

                {/* Birth Date + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Birth Date <span className="text-orange-400">*</span></label>
                        <input 
                            type="date" 
                            required
                            value={form.birthDate} 
                            onChange={set('birthDate')} 
                            className={`${inputClass} scheme-dark`} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address <span className="text-orange-400">*</span></label>
                        <input type="email" placeholder="Enter email" required
                            value={form.email} onChange={set('email')} className={inputClass} />
                    </div>
                </div>

                {/* Gender + Occupation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Gender <span className="text-orange-400">*</span></label>
                        <SelectWrapper>
                            <select
                                className={selectClass}
                                value={form.gender}
                                onChange={set('gender')}
                                required
                            >
                                <option value="" className="bg-slate-800">- Select Gender -</option>
                                <option value="male" className="bg-slate-800">Male</option>
                                <option value="female" className="bg-slate-800">Female</option>
                                <option value="other" className="bg-slate-800">Other</option>
                            </select>
                        </SelectWrapper>
                    </div>
                    <div>
                        <label className={labelClass}>Occupation <span className="text-orange-400">*</span></label>
                        <input 
                            type="text" placeholder="e.g. Engineer, Nurse, OFW"
                            required
                            value={form.occupation} onChange={set('occupation')} className={inputClass} />
                    </div>
                </div>

                {/* Work Location + Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Work Location</label>
                        <SelectWrapper>
                            <select
                                className={selectClass}
                                value={form.workLocation}
                                onChange={set('workLocation')}
                            >
                                <option value="local" className="bg-slate-800">Local (Philippines)</option>
                                <option value="overseas" className="bg-slate-800">Overseas</option>
                            </select>
                        </SelectWrapper>
                    </div>
                    <div>
                        <label className={labelClass}>Country {form.workLocation === 'overseas' ? <span className="text-orange-400">*</span> : null}</label>
                        <input
                            type="text"
                            placeholder={form.workLocation === 'overseas' ? 'e.g. UAE, Saudi Arabia, Japan' : 'Philippines'}
                            value={form.workLocation === 'overseas' ? form.country : 'Philippines'}
                            onChange={set('country')}
                            className={inputClass}
                            disabled={form.workLocation !== 'overseas'}
                            required={form.workLocation === 'overseas'}
                        />
                    </div>
                </div>

                {/* Phone Number */}
                <div>
                    <label className={labelClass}>Phone Number <span className="text-orange-400">*</span></label>
                    <div className="flex gap-2">
                        <div className="flex items-center justify-center px-4 bg-white/10 border border-white/20 rounded-xl text-sm text-white/80 font-semibold shrink-0">
                            +63
                        </div>
                        <input type="tel" placeholder="9XX XXX XXXX" required
                            value={form.phone} onChange={set('phone')} className={inputClass} />
                    </div>
                </div>

                {/* Username + Referred By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Username <span className="text-orange-400">*</span></label>
                        <input type="text" placeholder="Username" required
                            value={form.username} onChange={set('username')} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Referred By <span className="text-orange-400">*</span></label>
                        <input 
                            type="text" 
                            placeholder="Referral code or link"
                            value={form.referredBy} 
                            onChange={(e) => setForm((prev) => ({ ...prev, referredBy: e.target.value }))} 
                            className={inputClass} 
                            required
                        />
                    </div>
                </div>

                {/* ── Address ── */}
                <div className="space-y-1 pb-1 pt-2">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Address</p>
                    <div className="h-px bg-white/10" />
                </div>

                {/* Street */}
                <div>
                    <label className={labelClass}>Street / House No. <span className="text-orange-400">*</span></label>
                    <input 
                        type="text" 
                        placeholder="e.g. 123 Rizal St."
                        required
                        value={form.address} onChange={set('address')} className={inputClass} />
                </div>

                {/* Region */}
                <div>
                    <label className={labelClass}>Region <span className="text-orange-400">*</span></label>
                    <SelectWrapper>
                        <select
                            className={selectClass}
                            value={ph.regionCode}
                            onChange={e => {
                                const opt = e.target.options[e.target.selectedIndex]
                                ph.setRegion(e.target.value, opt.text)
                            }}
                            required
                        >
                            <option value="" className="bg-slate-800">— Select Region —</option>
                            {ph.regions.map(r => (
                                <option key={r.code} value={r.code} className="bg-slate-800">{r.name}</option>
                            ))}
                        </select>
                    </SelectWrapper>
                </div>

                {/* Province — hidden for NCR and no-province regions */}
                {!ph.noProvince && (
                    <div>
                        <label className={labelClass}>Province <span className="text-orange-400">*</span></label>
                        <SelectWrapper>
                            <select
                                className={selectClass}
                                value={ph.provinceCode}
                                disabled={!ph.regionCode || ph.loadingProvinces}
                                onChange={e => {
                                    const opt = e.target.options[e.target.selectedIndex]
                                    ph.setProvince(e.target.value, opt.text)
                                }}
                                required
                            >
                                <option value="" className="bg-slate-800">
                                    {ph.loadingProvinces ? 'Loading provinces...' : '— Select Province —'}
                                </option>
                                {ph.provinces.map(p => (
                                    <option key={p.code} value={p.code} className="bg-slate-800">{p.name}</option>
                                ))}
                            </select>
                        </SelectWrapper>
                    </div>
                )}

                {/* City / Municipality */}
                <div>
                    <label className={labelClass}>City / Municipality <span className="text-orange-400">*</span></label>
                    <SelectWrapper>
                        <select
                            className={selectClass}
                            value={ph.cityCode}
                            disabled={ph.noProvince ? !ph.regionCode : (!ph.provinceCode || ph.loadingCities)}
                            onChange={e => {
                                const opt = e.target.options[e.target.selectedIndex]
                                ph.setCity(e.target.value, opt.text)
                            }}
                            required
                        >
                            <option value="" className="bg-slate-800">
                                {ph.loadingCities || ph.loadingProvinces ? 'Loading...' : '— Select City / Municipality —'}
                            </option>
                            {ph.cities.map(c => (
                                <option key={c.code} value={c.code} className="bg-slate-800">{c.name}</option>
                            ))}
                        </select>
                    </SelectWrapper>
                </div>

                {/* Barangay */}
                <div>
                    <label className={labelClass}>Barangay <span className="text-orange-400">*</span></label>
                    <SelectWrapper>
                        <select
                            className={selectClass}
                            value={ph.address.barangay}
                            disabled={!ph.cityCode || ph.loadingBarangays}
                            onChange={e => ph.setBarangay(e.target.value)}
                            required
                        >
                            <option value="" className="bg-slate-800">
                                {ph.loadingBarangays ? 'Loading...' : '— Select Barangay —'}
                            </option>
                            {ph.barangays.map(b => (
                                <option key={b.code} value={b.name} className="bg-slate-800">{b.name}</option>
                            ))}
                        </select>
                    </SelectWrapper>
                </div>

                {/* ZIP Code */}
                <div>
                    <label className={labelClass}>ZIP Code <span className="text-orange-400">*</span></label>
                    <input 
                        type="text" placeholder="ZIP code" 
                        maxLength={10}
                        value={form.zipCode} 
                        onChange={set('zipCode')} 
                        className={inputClass} 
                        required
                    />
                </div>

                {/* ── Account Security ── */}
                <div className="space-y-1 pb-1 pt-2">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Account Security</p>
                    <div className="h-px bg-white/10" />
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelClass}>Password <span className="text-orange-400">*</span></label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} placeholder="Password" required
                                value={form.password} onChange={set('password')} className={`${inputClass} pr-11`} />
                            <button type="button" onClick={() => setShowPass(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors">
                                <EyeIcon open={showPass} />
                            </button>
                        </div>
                        <div className="mt-2 space-y-1.5">
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                    style={{ width: passwordStrength.width }}
                                />
                            </div>
                            <p className={`text-[11px] font-medium ${passwordStrength.textColor}`}>
                                {passwordStrength.label}
                            </p>
                            <div className="grid grid-cols-1 gap-1 pt-1">
                                {passwordRequirements.map((item) => (
                                    <p
                                        key={item.label}
                                        className={`text-[11px] flex items-center gap-2 ${
                                            item.passed ? 'text-emerald-300' : 'text-white/55'
                                        }`}
                                    >
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                                            item.passed ? 'bg-emerald-400' : 'bg-white/25'
                                        }`} />
                                        {item.label}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Confirm Password <span className="text-orange-400">*</span></label>
                        <div className="relative">
                            <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm" required
                                value={form.confirmPassword} onChange={set('confirmPassword')} className={`${inputClass} pr-11`} />
                            <button type="button" onClick={() => setShowConfirm(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors">
                                <EyeIcon open={showConfirm} />
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-[11px] text-white/60 -mt-1">
                    Use at least 8 characters with uppercase, lowercase, number, and special character.
                </p>

                {/* Sign In link */}
                <p className="text-xs text-white/60">
                    Have an account?{' '}
                    <button type="button" onClick={onSwitchToLogin}
                        className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                        Sign In
                    </button>
                </p>

                {/* Terms */}
                <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.agreeTerms} onChange={set('agreeTerms')}
                        className="accent-orange-500 w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs text-white/60">
                        I agree to{' '}
                        <span className="text-orange-400 font-semibold hover:underline cursor-pointer">Terms &amp; Condition</span>
                        {' '}&amp;{' '}
                        <span className="text-orange-400 font-semibold hover:underline cursor-pointer">Privacy Policy</span>
                    </span>
                </label>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm tracking-widest transition-all duration-200 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loading size={14} />
                            <span>SENDING OTP...</span>
                        </>
                    ) : (
                        <span>SIGN UP</span>
                    )}
                </button>
            </form>
            )}
        </motion.div>
    )
}

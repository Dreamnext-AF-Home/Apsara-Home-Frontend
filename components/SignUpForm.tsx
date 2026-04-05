'use client'

import { useRef, useState, type Key } from 'react'
import { motion } from 'framer-motion'
import { useRegisterMutation } from '@/store/api/authApi'
import Loading from './Loading'
import { usePhAddress } from '@/hooks/usePhAddress'
import { useSearchParams } from 'next/navigation'
import { showErrorToast, showSuccessToast } from '@/libs/toast'
import OtpVerification from './auth/OtpVerification'
import { clearStoredReferralCode, getStoredReferralCode, normalizeReferralCode } from '@/libs/referral'
import { containsBlockedWord } from '@/libs/badWords'
import { Button, Calendar, DateField, DatePicker, Label, ListBox, ListBoxItem, Select } from '@heroui/react'
import { parseDate } from '@internationalized/date'

const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>

const labelClass = "block text-xs font-semibold text-white/80 mb-1.5"

type FloatingInputProps = {
    id: string;
    type?: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
    maxLength?: number;
    endContent?: React.ReactNode;
}

function FloatingInput({
    id,
    type = 'text',
    label,
    value,
    onChange,
    required,
    disabled,
    maxLength,
    endContent,
}: FloatingInputProps) {
    const hasValue = value.trim().length > 0

    return (
        <div className="relative w-full">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder=" "
                required={required}
                disabled={disabled}
                maxLength={maxLength}
                className="peer h-14 w-full rounded-[22px] border border-white/18 bg-white/12 px-4 pb-3 pt-6 text-sm text-white outline-none transition-all duration-200 placeholder:text-transparent focus:border-orange-400/60 focus:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <label
                htmlFor={id}
                className={`pointer-events-none absolute left-4 origin-left px-1 text-white/55 transition-all duration-200 ${
                    hasValue
                        ? 'top-2 text-[11px] text-orange-300'
                        : 'top-1/2 -translate-y-1/2 text-sm'
                } peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-orange-300`}
            >
                {label}
            </label>
            {endContent ? (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                    {endContent}
                </div>
            ) : null}
        </div>
    )
}

type HeroSelectFieldProps = {
    label: React.ReactNode;
    placeholder: string;
    selectedKey: string;
    selectedLabel?: string;
    onSelectionChange: (key: Key | null) => void;
    isDisabled?: boolean;
    children: React.ReactNode;
}

function HeroSelectField({
    label,
    placeholder,
    selectedKey,
    selectedLabel,
    onSelectionChange,
    isDisabled,
    children,
}: HeroSelectFieldProps) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <Select
                aria-label={typeof label === 'string' ? label : 'Select field'}
                selectedKey={selectedKey || null}
                onSelectionChange={onSelectionChange}
                isDisabled={isDisabled}
                className="w-full"
            >
                <Select.Trigger className="flex h-14 w-full items-center justify-between rounded-[22px] border border-white/18 bg-white/12 px-4 text-left text-sm text-white transition-all duration-200 hover:bg-white/16 focus:border-orange-400/60 focus:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60">
                    <span className={selectedKey ? 'text-white' : 'text-white/45'}>
                        {selectedLabel || placeholder}
                    </span>
                    <Select.Indicator className="h-4 w-4 text-white/55" />
                </Select.Trigger>
                <Select.Popover className="min-w-[var(--trigger-width)]">
                    <ListBox className="p-1">
                        {children}
                    </ListBox>
                </Select.Popover>
            </Select>
        </div>
    )
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

interface SignUpFormProps {
    onSwitchToLogin: () => void
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
    const searchParams = useSearchParams()
    const [register, { isLoading }] = useRegisterMutation()
    const initialReferral = normalizeReferralCode(searchParams.get('ref') ?? searchParams.get('referred_by') ?? '') || getStoredReferralCode()

    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState<'form' | 'otp'>('form')
    const [verificationToken, setVerificationToken] = useState('')
    const [pendingEmail, setPendingEmail] = useState('')
    const errorRef = useRef<HTMLDivElement | null>(null)

    const ph = usePhAddress({ legacyNoProvinceRegions: true, source: 'psgc' })

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
        referredBy: initialReferral,
        birthDate: '',
        address: '',
        zipCode: '',
        agreeTerms: false,
    })

    const passwordStrength = getPasswordStrength(form.password)
    const passwordRequirements = passwordChecks(form.password)
    const birthDateValue = (() => {
        if (!form.birthDate) return null
        try {
            return parseDate(form.birthDate)
        } catch {
            return null
        }
    })()
    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

    const showError = (message: string) => {
        setError(message)
        requestAnimationFrame(() => {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
    }

    const resetOtpStep = () => {
        setStep('form')
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

                {/* â”€â”€ Personal Information â”€â”€ */}
                <div className="space-y-1 pb-1">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Personal Information</p>
                    <div className="h-px bg-white/10" />
                </div>

                {/* First + Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FloatingInput id="signup-first-name" type="text" label="First Name" required
                        value={form.firstName} onChange={set('firstName')} />
                    <FloatingInput id="signup-last-name" type="text" label="Last Name" required
                        value={form.lastName} onChange={set('lastName')} />
                </div>

                {/* Middle Name */}
                <FloatingInput id="signup-middle-name" type="text" label="Middle Name"
                    value={form.middleName} onChange={set('middleName')} />

                {/* Birth Date + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <DatePicker
                            className="w-full"
                            aria-label="Birth Date"
                            name="birthDate"
                            value={birthDateValue ?? undefined}
                            onChange={(value) => setForm((prev) => ({ ...prev, birthDate: value ? value.toString() : '' }))}
                        >
                            <Label className="sr-only">
                                Birth Date <span className="text-orange-400">*</span>
                            </Label>
                            <DateField.Group
                                fullWidth
                                className="flex h-14 w-full items-center rounded-[22px] border border-white/18 bg-white/12 px-4 text-sm text-white transition-all duration-200 hover:bg-white/16 focus-within:border-orange-400/60 focus-within:bg-white/18"
                            >
                                <DateField.Input className="flex-1 text-sm text-white data-[placeholder=true]:text-white/45">
                                    {(segment) => (
                                        <DateField.Segment
                                            segment={segment}
                                            className="rounded-md px-0.5 outline-none transition data-[placeholder=true]:text-white/45 data-[focused=true]:bg-orange-500/15 data-[focused=true]:text-orange-200"
                                        />
                                    )}
                                </DateField.Input>
                                <DateField.Suffix className="ml-3 flex items-center">
                                    <DatePicker.Trigger className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/16 hover:text-white focus:outline-none">
                                        <DatePicker.TriggerIndicator />
                                    </DatePicker.Trigger>
                                </DateField.Suffix>
                            </DateField.Group>
                            <DatePicker.Popover className="p-2">
                                <Calendar className="rounded-2xl bg-white p-3 text-slate-800 shadow-xl">
                                    <Calendar.Header className="mb-3 flex items-center justify-between gap-3">
                                        <Calendar.YearPickerTrigger className="inline-flex min-w-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
                                            <Calendar.YearPickerTriggerHeading />
                                            <Calendar.YearPickerTriggerIndicator className="text-slate-500" />
                                        </Calendar.YearPickerTrigger>
                                        <div className="ml-auto flex items-center gap-2 pl-2">
                                            <Calendar.NavButton
                                                slot="previous"
                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
                                            />
                                            <Calendar.NavButton
                                                slot="next"
                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
                                            />
                                        </div>
                                    </Calendar.Header>
                                    <Calendar.Grid className="w-full">
                                        <Calendar.GridHeader>
                                            {(day) => (
                                                <Calendar.HeaderCell className="pb-2 text-center text-xs font-semibold text-slate-400">
                                                    {day}
                                                </Calendar.HeaderCell>
                                            )}
                                        </Calendar.GridHeader>
                                        <Calendar.GridBody>
                                            {(date) => (
                                                <Calendar.Cell
                                                    date={date}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm text-slate-700 transition hover:bg-orange-100 data-[focused=true]:bg-orange-100 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white data-[outside-month=true]:text-slate-300"
                                                />
                                            )}
                                        </Calendar.GridBody>
                                    </Calendar.Grid>
                                    <Calendar.YearPickerGrid className="mt-2">
                                        <Calendar.YearPickerGridBody>
                                            {({ year }) => (
                                                <Calendar.YearPickerCell
                                                    year={year}
                                                    className="flex h-10 items-center justify-center rounded-xl text-sm text-slate-700 transition hover:bg-orange-100 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white"
                                                />
                                            )}
                                        </Calendar.YearPickerGridBody>
                                    </Calendar.YearPickerGrid>
                                </Calendar>
                            </DatePicker.Popover>
                        </DatePicker>
                    </div>
                    <FloatingInput id="signup-email" type="email" label="Email Address" required
                        value={form.email} onChange={set('email')} />
                </div>

                {/* Gender + Occupation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <HeroSelectField
                        label={<>Gender <span className="text-orange-400">*</span></>}
                        placeholder="- Select Gender -"
                        selectedKey={form.gender}
                        selectedLabel={form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : ''}
                        onSelectionChange={(key) => setForm((prev) => ({ ...prev, gender: key ? String(key) : '' }))}
                    >
                        <ListBoxItem id="male">Male</ListBoxItem>
                        <ListBoxItem id="female">Female</ListBoxItem>
                        <ListBoxItem id="other">Other</ListBoxItem>
                    </HeroSelectField>
                    <FloatingInput 
                        id="signup-occupation"
                        type="text"
                        label="Occupation"
                        required
                        value={form.occupation} onChange={set('occupation')} />
                </div>

                {/* Work Location + Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <HeroSelectField
                        label="Work Location"
                        placeholder="Select work location"
                        selectedKey={form.workLocation}
                        selectedLabel={form.workLocation === 'overseas' ? 'Overseas' : 'Local (Philippines)'}
                        onSelectionChange={(key) => setForm((prev) => ({ ...prev, workLocation: key ? String(key) : 'local' }))}
                    >
                        <ListBoxItem id="local">Local (Philippines)</ListBoxItem>
                        <ListBoxItem id="overseas">Overseas</ListBoxItem>
                    </HeroSelectField>
                    <FloatingInput
                        id="signup-country"
                        type="text"
                        label="Country"
                        value={form.workLocation === 'overseas' ? form.country : 'Philippines'}
                        onChange={set('country')}
                        disabled={form.workLocation !== 'overseas'}
                        required={form.workLocation === 'overseas'}
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <div className="flex gap-2">
                        <div className="flex items-center justify-center rounded-[22px] border border-white/18 bg-white/12 px-4 text-sm font-semibold text-white/80 shrink-0">
                            +63
                        </div>
                        <FloatingInput id="signup-phone" type="tel" label="Phone Number" required
                            value={form.phone} onChange={set('phone')} />
                    </div>
                </div>

                {/* Username + Referred By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FloatingInput id="signup-username" type="text" label="Username" required
                        value={form.username} onChange={set('username')} />
                    <FloatingInput 
                        id="signup-referred-by"
                        type="text" 
                        label="Referral Code or Link"
                        value={form.referredBy} 
                        onChange={(e) => setForm((prev) => ({ ...prev, referredBy: e.target.value }))} 
                        required
                    />
                </div>

                {/* â”€â”€ Address â”€â”€ */}
                <div className="space-y-1 pb-1 pt-2">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Address</p>
                    <div className="h-px bg-white/10" />
                </div>

                {/* Street */}
                <FloatingInput 
                    id="signup-address"
                    type="text" 
                    label="Street / House No."
                    required
                    value={form.address} onChange={set('address')} />

                {/* Region */}
                <HeroSelectField
                    label={<>Region <span className="text-orange-400">*</span></>}
                    placeholder="Select Region"
                    selectedKey={ph.regionCode}
                    selectedLabel={ph.address.region}
                    onSelectionChange={(key) => {
                        const value = key ? String(key) : ''
                        const option = ph.regions.find((region) => region.code === value)
                        ph.setRegion(value, option?.name ?? '')
                    }}
                >
                    {ph.regions.map((region) => (
                        <ListBoxItem id={region.code} key={region.code}>
                            {region.name}
                        </ListBoxItem>
                    ))}
                </HeroSelectField>

                {/* Province */}
                {!ph.noProvince && (
                    <HeroSelectField
                        label={<>Province <span className="text-orange-400">*</span></>}
                        placeholder={ph.loadingProvinces ? 'Loading provinces...' : 'Select Province'}
                        selectedKey={ph.provinceCode}
                        selectedLabel={ph.address.province}
                        isDisabled={!ph.regionCode || ph.loadingProvinces}
                        onSelectionChange={(key) => {
                            const value = key ? String(key) : ''
                            const option = ph.provinces.find((province) => province.code === value)
                            ph.setProvince(value, option?.name ?? '')
                        }}
                    >
                        {ph.provinces.map((province) => (
                            <ListBoxItem id={province.code} key={province.code}>
                                {province.name}
                            </ListBoxItem>
                        ))}
                    </HeroSelectField>
                )}

                {/* City / Municipality */}
                <HeroSelectField
                    label={<>City / Municipality <span className="text-orange-400">*</span></>}
                    placeholder={ph.loadingCities || ph.loadingProvinces ? 'Loading...' : 'Select City / Municipality'}
                    selectedKey={ph.cityCode}
                    selectedLabel={ph.address.city}
                    isDisabled={ph.noProvince ? !ph.regionCode : (!ph.provinceCode || ph.loadingCities)}
                    onSelectionChange={(key) => {
                        const value = key ? String(key) : ''
                        const option = ph.cities.find((city) => city.code === value)
                        ph.setCity(value, option?.name ?? '')
                    }}
                >
                    {ph.cities.map((city) => (
                        <ListBoxItem id={city.code} key={city.code}>
                            {city.name}
                        </ListBoxItem>
                    ))}
                </HeroSelectField>

                {/* Barangay */}
                <HeroSelectField
                    label={<>Barangay <span className="text-orange-400">*</span></>}
                    placeholder={ph.loadingBarangays ? 'Loading...' : 'Select Barangay'}
                    selectedKey={ph.address.barangay}
                    selectedLabel={ph.address.barangay}
                    isDisabled={!ph.cityCode || ph.loadingBarangays}
                    onSelectionChange={(key) => ph.setBarangay(key ? String(key) : '')}
                >
                    {ph.barangays.map((barangay) => (
                        <ListBoxItem id={barangay.name} key={barangay.code}>
                            {barangay.name}
                        </ListBoxItem>
                    ))}
                </HeroSelectField>

                {/* ZIP Code */}
                <FloatingInput 
                    id="signup-zip"
                    type="text"
                    label="ZIP Code" 
                    maxLength={10}
                    value={form.zipCode} 
                    onChange={set('zipCode')} 
                    required
                />

                {/* â”€â”€ Account Security â”€â”€ */}
                <div className="space-y-1 pb-1 pt-2">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Account Security</p>
                    <div className="h-px bg-white/10" />
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <FloatingInput type={showPass ? 'text' : 'password'} id="signup-password" label="Password" required
                            value={form.password} onChange={set('password')}
                            endContent={(
                                <button type="button" onClick={() => setShowPass(p => !p)}
                                    className="text-white/60 hover:text-white/80 transition-colors">
                                    <EyeIcon open={showPass} />
                                </button>
                            )} />
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
                        <FloatingInput type={showConfirm ? 'text' : 'password'} id="signup-confirm-password" label="Confirm Password" required
                            value={form.confirmPassword} onChange={set('confirmPassword')}
                            endContent={(
                                <button type="button" onClick={() => setShowConfirm(p => !p)}
                                    className="text-white/60 hover:text-white/80 transition-colors">
                                    <EyeIcon open={showConfirm} />
                                </button>
                            )} />
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
                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={(e) => setForm((prev) => ({ ...prev, agreeTerms: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 accent-orange-500"
                    />
                    <span className="text-xs text-white/60">
                        I agree to{' '}
                        <span className="text-orange-400 font-semibold hover:underline cursor-pointer">Terms &amp; Condition</span>
                        {' '}&amp;{' '}
                        <span className="text-orange-400 font-semibold hover:underline cursor-pointer">Privacy Policy</span>
                    </span>
                </label>

                <Button
                    type="submit"
                    isDisabled={isLoading}
                    className="h-12 w-full bg-orange-500 text-sm font-bold tracking-widest text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 data-[pressed=true]:scale-[0.99]"
                >
                    {isLoading ? (
                        <>
                            <Loading size={14} />
                            <span>SENDING OTP...</span>
                        </>
                    ) : (
                        <span>SIGN UP</span>
                    )}
                </Button>
            </form>
            )}
        </motion.div>
    )
}



import { useContext, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileText,
  PawPrint,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
} from 'lucide-react'
import { registerWithFormData } from '../api/auth.js'
import { getApiOrigin } from '../lib/apiOrigin.js'
import { UserContext } from '../UserContext.jsx'

function GoogleBrandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
      />
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
    </svg>
  )
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/20'

function emailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useContext(UserContext)

  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [city, setCity] = useState('')

  const [specialty, setSpecialty] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const [experience, setExperience] = useState(0)
  const [licenseNumber, setLicenseNumber] = useState('')
  const [degreeFile, setDegreeFile] = useState(null)

  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const maxStep = role === 'professional' ? 3 : 2

  const stepLabels = useMemo(() => {
    if (role === 'professional') {
      return ['Your role', 'Your info', 'Pro details']
    }
    return ['Your role', 'Your info']
  }, [role])

  function validateStep2() {
    if (!firstName.trim() || !lastName.trim()) return 'First and last name are required.'
    if (!emailValid(email)) return 'Enter a valid email address.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    if (!city.trim()) return 'City is required.'
    return ''
  }

  function validateStep3() {
    if (!specialty) return 'Select your specialty.'
    if (!phone.trim()) return 'Phone number is required.'
    if (!location.trim()) return 'Location is required.'
    if (!description.trim()) return 'Please describe your services.'
    return ''
  }

  function appendCommonFields(fd) {
    fd.append('firstName', firstName.trim())
    fd.append('lastName', lastName.trim())
    fd.append('email', email.trim())
    fd.append('password', password)
    fd.append('confirmPassword', confirmPassword)
    fd.append('city', city.trim())
    fd.append('role', role)
  }

  async function submitOwner() {
    const err = validateStep2()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setPending(true)
    try {
      const fd = new FormData()
      appendCommonFields(fd)
      const { data } = await registerWithFormData(fd)
      const { ok, user: sessionUser } = data ?? {}
      if (!ok || !sessionUser?.email) {
        setError('Unexpected response from server.')
        return
      }
      setUser(sessionUser)
      navigate('/home', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Registration failed.')
    } finally {
      setPending(false)
    }
  }

  async function submitProfessional() {
    const err2 = validateStep2()
    if (err2) {
      setError(err2)
      return
    }
    const err3 = validateStep3()
    if (err3) {
      setError(err3)
      return
    }
    setError('')
    setPending(true)
    try {
      const fd = new FormData()
      appendCommonFields(fd)
      fd.append('specialty', specialty)
      fd.append('phone', phone.trim())
      fd.append('location', location.trim())
      fd.append('description', description.trim())
      fd.append('experience', String(experience))
      fd.append('licenseNumber', licenseNumber.trim())
      // Field name must match api/routes/auth.js → uploadDegree.single('degree')
      if (degreeFile) fd.append('degree', degreeFile)

      const { data } = await registerWithFormData(fd)
      const { ok, user: sessionUser } = data ?? {}
      if (!ok || !sessionUser?.email) {
        setError('Unexpected response from server.')
        return
      }
      setUser(sessionUser)
      navigate('/pro/dashboard', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Registration failed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-4 flex grow flex-col items-center px-4 pb-16 pt-2 md:px-8">
      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-center text-3xl font-semibold text-gray-900 sm:text-4xl">Create account</h1>
        <p className="mb-6 text-center text-sm text-gray-600">Join GaliPet in a few steps.</p>

        {step > 1 && role ? (
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {Array.from({ length: maxStep }, (_, i) => i + 1).map((n) => (
                <div key={n} className="flex items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      step >= n ? 'bg-[#D85A30] text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step > n ? <BadgeCheck className="h-4 w-4" /> : n}
                  </div>
                  {n < maxStep ? (
                    <div className={`mx-1 h-0.5 w-6 sm:w-8 ${step > n ? 'bg-[#D85A30]' : 'bg-gray-200'}`} />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 text-center text-[11px] font-medium text-gray-500 sm:text-xs">
              {stepLabels.map((label, i) => (
                <span key={label} className={step === i + 1 ? 'text-[#D85A30]' : ''}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-center text-sm font-medium text-gray-700">Who are you?</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setRole('owner')
                  setStep(2)
                }}
                className={`rounded-2xl border-2 p-6 text-center transition-all hover:border-[#D85A30] hover:bg-[#FAECE7] ${
                  role === 'owner' ? 'border-[#D85A30] bg-[#FAECE7]' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="mb-3 inline-flex rounded-2xl bg-[#FAECE7] p-3 text-[#D85A30]">
                  <PawPrint className="h-8 w-8" />
                </div>
                <h3 className="mb-1 font-bold text-gray-900">Pet Owner</h3>
                <p className="text-xs text-gray-500">
                  I&apos;m looking for vets, groomers, sitters and trainers for my pet
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setRole('professional')
                  setStep(2)
                }}
                className={`rounded-2xl border-2 p-6 text-center transition-all hover:border-[#D85A30] hover:bg-[#FAECE7] ${
                  role === 'professional' ? 'border-[#D85A30] bg-[#FAECE7]' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="mb-3 inline-flex rounded-2xl bg-[#FAECE7] p-3 text-[#D85A30]">
                  <BriefcaseBusiness className="h-8 w-8" />
                </div>
                <h3 className="mb-1 font-bold text-gray-900">Professional</h3>
                <p className="text-xs text-gray-500">I offer pet care services — vet, groomer, sitter or trainer</p>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = `${getApiOrigin()}/api/auth/google`
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#D85A30]/40 hover:bg-gray-50"
            >
              <GoogleBrandIcon />
              S&apos;inscrire avec Google
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              Compte propriétaire uniquement — les professionnels doivent utiliser le formulaire complet.
            </p>
          </>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="First name"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Last name"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              className={inputClass}
              placeholder="Email address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="City (e.g. Fes)"
              name="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            {role === 'owner' ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">ou</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${getApiOrigin()}/api/auth/google`
                  }}
                  className="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#D85A30]/40 hover:bg-gray-50"
                >
                  <GoogleBrandIcon />
                  S&apos;inscrire avec Google
                </button>
                <p className="text-center text-xs text-gray-400">
                  Les professionnels doivent s&apos;inscrire avec le formulaire complet.
                </p>
              </>
            ) : null}

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="secondary w-full sm:w-auto"
                onClick={() => {
                  setError('')
                  setStep(1)
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </span>
              </button>
              {role === 'owner' ? (
                <button
                  type="button"
                  className="primary w-full sm:min-w-[140px]"
                  disabled={pending}
                  onClick={submitOwner}
                >
                  {pending ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                        aria-hidden
                      />
                      Creating…
                    </span>
                  ) : (
                    'Create account'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="primary w-full sm:min-w-[140px]"
                  disabled={pending}
                  onClick={() => {
                    const err = validateStep2()
                    if (err) {
                      setError(err)
                      return
                    }
                    setError('')
                    setStep(3)
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : null}

        {step === 3 && role === 'professional' ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Specialty</label>
              <select
                name="specialty"
                className={inputClass}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">Select your specialty</option>
                <option value="vet">Veterinarian</option>
                <option value="grooming">Groomer</option>
                <option value="sitting">Pet sitter / walker</option>
                <option value="training">Trainer</option>
              </select>
            </div>
            <input
              className={inputClass}
              placeholder="Phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Location (e.g. Fes Medina)"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <textarea
              placeholder="Describe your services…"
              name="description"
              rows={3}
              className={`${inputClass} resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="mt-2 border-t border-gray-100 pt-4">
              <p className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <ShieldCheck className="h-4 w-4 text-[#D85A30]" />
                Trust &amp; credentials
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-normal normal-case text-green-700">
                  Builds client trust
                </span>
              </p>

              <div className="mb-3 flex flex-col gap-1">
                <label className="text-xs text-gray-500">
                  Professional license number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  name="licenseNumber"
                  placeholder="e.g. VET-MA-2024-00123"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#D85A30] focus:bg-white"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
                <p className="text-[11px] text-gray-400">Vets: Ordre National des Vétérinaires du Maroc number</p>
              </div>

              <div className="mb-3 flex flex-col gap-1">
                <label className="text-xs text-gray-500">
                  Years of experience
                  <span className="ml-2 font-semibold text-[#D85A30]">
                    {experience} {experience === 1 ? 'year' : 'years'}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#D85A30]"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0 (new)</span>
                  <span>5</span>
                  <span>10</span>
                  <span>20</span>
                  <span>30+</span>
                </div>
              </div>

              <div className="mb-3 flex flex-col gap-1">
                <label className="text-xs text-gray-500">
                  Diploma / certificate <span className="text-gray-400">(optional, recommended)</span>
                </label>
                <label className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-4 transition-all hover:border-[#D85A30] hover:bg-[#FAECE7]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl text-[#D85A30] transition-transform group-hover:scale-110">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {degreeFile ? degreeFile.name : 'Upload your diploma'}
                    </p>
                    <p className="text-xs text-gray-400">PDF, JPG or PNG · max 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => setDegreeFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {degreeFile ? (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {degreeFile.name} ready to upload
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-gradient-to-r from-[#FAECE7] to-[#FFF8F5] p-3">
                <div className="text-[#D85A30]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Your profile will show:</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {licenseNumber.trim() ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                        <UserCheck className="h-3 w-3" />
                        Licensed
                      </span>
                    ) : null}
                    {degreeFile ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">
                        <BadgeCheck className="h-3 w-3" />
                        Diploma uploaded
                      </span>
                    ) : null}
                    {experience >= 3 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-orange-700">
                        <BadgeCheck className="h-3 w-3" />
                        {experience}+ years exp.
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                      <ShieldCheck className="h-3 w-3" />
                      Pending review
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="secondary w-full sm:w-auto"
                onClick={() => {
                  setError('')
                  setStep(2)
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </span>
              </button>
              <button
                type="button"
                className="primary w-full sm:min-w-[160px]"
                disabled={pending}
                onClick={submitProfessional}
              >
                {pending ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                      aria-hidden
                    />
                    Creating…
                  </span>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 text-center text-sm text-gray-500">
          Already a member?{' '}
          <Link className="font-medium text-[#D85A30] underline underline-offset-2 hover:text-[#b84a28]" to="/login">
            Log in
          </Link>
        </div>

      </div>
    </div>
  )
}

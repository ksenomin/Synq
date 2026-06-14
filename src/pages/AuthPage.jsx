import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react'
import { Button, Input, Card } from '../components/common'
import { useAppContext } from '../store'
import { authApi } from '../api'
import { translateApiError } from '../utils/helpers'

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login')
  const { login } = useAppContext()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Client',
    agreeToPrivacy: false,
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!loginForm.email.trim()) newErrors.email = 'Введите email'
    if (!loginForm.password.trim()) newErrors.password = 'Введите пароль'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setApiError('')
    setNeedsVerification(false)

    try {
      const response = await authApi.login(loginForm.email, loginForm.password)
      login(response.user)
      if (response.needsVerification) {
        setNeedsVerification(true)
        setVerificationEmail(loginForm.email)
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error('Ошибка входа — статус:', err.response?.status)
      console.error('Ошибка входа — данные:', err.response?.data)
      setApiError(translateApiError(err.response?.data?.error) || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!registerForm.name.trim()) newErrors.name = 'Введите имя'
    if (!registerForm.email.trim()) newErrors.email = 'Введите email'
    if (!registerForm.password.trim()) newErrors.password = 'Введите пароль'
    if (registerForm.password.length < 6) newErrors.password = 'Минимум 6 символов'
    if (registerForm.password !== registerForm.confirmPassword)
      newErrors.confirmPassword = 'Пароли не совпадают'
    if (!registerForm.agreeToPrivacy)
      newErrors.agreeToPrivacy = 'Необходимо согласие с политикой конфиденциальности'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setApiError('')
    setNeedsVerification(false)

    try {
      const response = await authApi.register(
        registerForm.name,
        registerForm.email,
        registerForm.password,
        registerForm.role
      )
      login(response.user)
      if (response.needsVerification) {
        setNeedsVerification(true)
        setVerificationEmail(registerForm.email)
      } else {
        navigate('/')
      }
    } catch (err) {
      setApiError(translateApiError(err.response?.data?.error) || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const clearErrors = () => {
    setErrors({})
    setApiError('')
  }

  const switchTab = (tab) => {
    setActiveTab(tab)
    clearErrors()
    setNeedsVerification(false)
    setResendMessage('')
  }

  const handleResend = async () => {
    if (!verificationEmail) return
    setResendLoading(true)
    setResendMessage('')
    try {
      await authApi.resendVerification(verificationEmail)
      setResendMessage('Письмо отправлено повторно. Проверьте почту.')
    } catch (err) {
      setResendMessage(translateApiError(err.response?.data?.error) || 'Не удалось отправить письмо.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-gray-50 -z-10" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img
            src="/logos/logo-black.png"
            alt="SYNQ"
            className="h-14 w-auto rounded-2xl object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'login' ? 'Вход в SYNQ' : 'Регистрация в SYNQ'}
          </h1>
          <p className="text-gray-500 mt-2">
            {activeTab === 'login'
              ? 'Войдите, чтобы получить доступ к платформе'
              : 'Создайте аккаунт для начала работы'}
          </p>
        </div>

        <Card className="p-8">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Регистрация
            </button>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
              {apiError}
            </div>
          )}

          {needsVerification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800"
            >
              <p className="font-semibold mb-1">Подтвердите email</p>
              <p className="mb-2">
                На вашу почту отправлено письмо со ссылкой для подтверждения аккаунта.
                Перейдите по ссылке в письме, чтобы завершить регистрацию.
              </p>
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-primary-600 hover:text-primary-700 font-medium underline disabled:opacity-50"
              >
                {resendLoading ? 'Отправка…' : 'Выслать письмо повторно'}
              </button>
              {resendMessage && (
                <p className="mt-1 text-xs text-gray-600">{resendMessage}</p>
              )}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <Input
                  type="email"
                  label="Email"
                  placeholder="your@email.com"
                  value={loginForm.email}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, email: e.target.value })
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                  }}
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email}
                />

                <Input
                  type="password"
                  label="Пароль"
                  placeholder="Введите пароль"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value })
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                  }}
                  icon={<Lock className="w-5 h-5" />}
                  error={errors.password}
                />

                <div className="flex justify-end">
                  <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Забыли пароль?
                  </button>
                </div>

                <Button type="submit" fullWidth size="lg" className="mt-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Вход...
                    </span>
                  ) : (
                    <>
                      Войти
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <Input
                  type="text"
                  label="Имя"
                  placeholder="Как вас зовут?"
                  value={registerForm.name}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, name: e.target.value })
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                  }}
                  icon={<User className="w-5 h-5" />}
                  error={errors.name}
                />

                <Input
                  type="email"
                  label="Email"
                  placeholder="your@email.com"
                  value={registerForm.email}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, email: e.target.value })
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                  }}
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email}
                />

                <Input
                  type="password"
                  label="Пароль"
                  placeholder="Минимум 6 символов"
                  value={registerForm.password}
                  onChange={(e) => {
                    setRegisterForm({ ...registerForm, password: e.target.value })
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                  }}
                  icon={<Lock className="w-5 h-5" />}
                  error={errors.password}
                />

                <Input
                  type="password"
                  label="Подтвердите пароль"
                  placeholder="Повторите пароль"
                  value={registerForm.confirmPassword}
                  onChange={(e) => {
                    setRegisterForm({
                      ...registerForm,
                      confirmPassword: e.target.value,
                    })
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                  }}
                  error={errors.confirmPassword}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Роль на платформе
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setRegisterForm({ ...registerForm, role: 'Client' })
                      }
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        registerForm.role === 'Client'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Briefcase className="w-5 h-5" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Заказчик</p>
                        <p className="text-xs opacity-70">Публикую задания</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRegisterForm({ ...registerForm, role: 'Freelancer' })
                      }
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        registerForm.role === 'Freelancer'
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Исполнитель</p>
                        <p className="text-xs opacity-70">Выполняю задания</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registerForm.agreeToPrivacy}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, agreeToPrivacy: e.target.checked })
                        if (errors.agreeToPrivacy) setErrors(prev => ({ ...prev, agreeToPrivacy: '' }))
                      }}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">
                      Я согласен с{' '}
                      <Link
                        to="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary-600 hover:text-primary-700 font-medium underline"
                      >
                        политикой конфиденциальности
                      </Link>
                    </span>
                  </label>
                  {errors.agreeToPrivacy && (
                    <p className="mt-1 text-sm text-error">{errors.agreeToPrivacy}</p>
                  )}
                </div>

                <Button type="submit" fullWidth size="lg" className="mt-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Создание...
                    </span>
                  ) : (
                    <>
                      Создать аккаунт
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          {activeTab === 'login' ? (
            <>
              Нет аккаунта?{' '}
              <button
                onClick={() => switchTab('register')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{' '}
              <button
                onClick={() => switchTab('login')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Войти
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  )
}

export default AuthPage

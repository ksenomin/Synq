import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { Button, Card } from '../components/common'
import { authApi } from '../api'
import { useAppContext } from '../store'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAppContext()

  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Ссылка подтверждения недействительна или устарела.')
      return
    }

    authApi
      .verifyEmail(token)
      .then((response) => {
        if (response.user) {
          login(response.user)
        }
        setStatus('success')
        setMessage('Email успешно подтвержден! Ваш аккаунт верифицирован.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(
          err.response?.data?.error ||
            'Не удалось подтвердить email. Возможно, ссылка устарела.'
        )
      })
  }, [token, login])

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-gray-50 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
              <p className="text-gray-600">Подтверждаем ваш email…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <MailCheck className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Email подтвержден</h2>
              <p className="text-gray-600">{message}</p>
              <Button variant="primary" fullWidth onClick={() => navigate('/')}>
                Перейти на главную
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Ошибка подтверждения</h2>
              <p className="text-gray-600">{message}</p>
              <Button variant="primary" fullWidth onClick={() => navigate('/auth')}>
                Вернуться к входу
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

export default VerifyEmailPage

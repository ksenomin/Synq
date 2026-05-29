import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Menu,
  X,
  Search,
  MessageSquare,
  Plus,
  LogIn,
  LogOut,
  Briefcase,
  FileText,
} from 'lucide-react'
import { Avatar, Button } from '../common'
import { useAppContext } from '../../store'

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { state, logout } = useAppContext()
  const { isAuthenticated, currentUser } = state

  // Ссылки навигации
  const navLinks = [
    { label: 'Главная', path: '/' },
    { label: 'Категории', path: '/categories' },
    { label: 'Задания', path: '/jobs' },
  ]

  // Проверка активной ссылки
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const showVerificationBanner = isAuthenticated && currentUser && !currentUser.verified

  return (
    <>
      {showVerificationBanner && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-center text-sm">
          <span className="font-medium">Email не подтвержден.</span>{' '}
          Подтвердите почту, чтобы получить статус верифицированного пользователя.{' '}
          <button
            onClick={() => navigate('/profile/' + currentUser.slug)}
            className="underline hover:text-amber-900 font-medium"
          >
            Перейти в профиль
          </button>
        </div>
      )}
      <header className="sticky top-0 z-30 glass border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/synq-logo.jpg"
              alt="SYNQ"
              className="h-10 w-auto rounded-xl object-contain"
            />
          </Link>

          {/* Навигация (десктоп) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Главная навигация">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Правая часть: поиск, уведомления, профиль */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Поиск (десктоп) */}
            <div className="hidden lg:flex items-center bg-gray-100 rounded-xl px-4 py-2 w-64">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Поиск..."
                className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
                aria-label="Поиск по сайту"
              />
            </div>

            {isAuthenticated ? (
              <>
                {/* Кнопка создания задания (только для клиентов) */}
                {currentUser?.role === 'client' && (
                  <Link
                    to="/create-job"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Создать задание</span>
                  </Link>
                )}

                {/* Мои задания (только для клиентов) */}
                {currentUser?.role === 'client' && (
                  <Link
                    to="/my-jobs"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    aria-label="Мои задания"
                  >
                    <Briefcase className="w-5 h-5" />
                  </Link>
                )}

                {/* Мои отклики (только для фрилансеров) */}
                {currentUser?.role === 'freelancer' && (
                  <Link
                    to="/my-proposals"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    aria-label="Мои отклики"
                  >
                    <FileText className="w-5 h-5" />
                  </Link>
                )}

                {/* Чат */}
                <Link
                  to="/chat"
                  className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  aria-label="Сообщения"
                >
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                </Link>

                {/* Профиль */}
                <Link to={`/profile/${currentUser.slug}`} className="hidden sm:block">
                  <Avatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    size="sm"
                  />
                </Link>

                {/* Выход */}
                <button
                  onClick={async () => {
                    await logout()
                    navigate('/')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  aria-label="Выйти"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Войти
                </Button>
              </Link>
            )}

            {/* Мобильное меню */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Открыть меню"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-gray-100"
          >
            {/* Мобильный поиск */}
            <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Поиск..."
                className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
                aria-label="Поиск по сайту"
              />
            </div>

            {/* Мобильная навигация */}
            <nav className="flex flex-col gap-1" aria-label="Мобильная навигация">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  {/* Мои задания (мобильное) - только для клиентов */}
                  {currentUser?.role === 'client' && (
                    <Link
                      to="/my-jobs"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Мои задания</span>
                    </Link>
                  )}

                  {/* Мои отклики (мобильное) - только для фрилансеров */}
                  {currentUser?.role === 'freelancer' && (
                    <Link
                      to="/my-proposals"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Мои отклики</span>
                    </Link>
                  )}

                  <Link
                    to="/create-job"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white text-sm font-medium rounded-xl mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Создать задание</span>
                  </Link>
                  <button
                    onClick={async () => {
                      await logout()
                      setIsMobileMenuOpen(false)
                      navigate('/')
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 bg-primary-600 text-white text-sm font-medium rounded-xl mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Войти</span>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
    </>
  )
}

export default Header

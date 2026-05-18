import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Переиспользуемый компонент модального окна
 * @param {boolean} isOpen - открыто ли модальное окно
 * @param {function} onClose - функция закрытия
 * @param {string} title - заголовок модалки
 * @param {React.ReactNode} children - содержимое
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 */
const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Блокируем скролл страницы
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемнение фона */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Модальное окно */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div
              className={`w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}
            >
              {/* Шапка */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                {title && (
                  <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Содержимое с прокруткой */}
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Modal

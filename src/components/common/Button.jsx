import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Переиспользуемый компонент кнопки
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth - растянуть на всю ширину
 * @param {React.ReactNode} children - содержимое кнопки
 * @param {function} onClick - обработчик клика
 * @param {string} className - дополнительные классы
 * @param {object} props - остальные пропсы
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  onClick,
  className,
  disabled = false,
  type = 'button',
  ...props
}) => {
  // Базовые классы для всех кнопок
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

  // Стили в зависимости от варианта
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm',
    outline: 'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    danger: 'bg-error text-white hover:bg-red-600 shadow-md',
  }

  // Размеры
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export default Button

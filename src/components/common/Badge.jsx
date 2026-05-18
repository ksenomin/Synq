import clsx from 'clsx'

/**
 * Переиспользуемый компонент бейджа/тега
 * @param {string} variant - 'primary' | 'success' | 'warning' | 'error' | 'gray'
 * @param {string} size - 'sm' | 'md'
 * @param {React.ReactNode} children - содержимое бейджа
 * @param {string} className - дополнительные классы
 */
const Badge = ({
  variant = 'gray',
  size = 'sm',
  children,
  className,
}) => {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
  }

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge

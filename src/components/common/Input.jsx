import { useState } from 'react'
import { Search, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

/**
 * Переиспользуемый компонент поля ввода
 * @param {string} type - 'text' | 'email' | 'password' | 'search' | 'textarea' | 'select'
 * @param {string} label - подпись над полем
 * @param {string} placeholder - текст-подсказка
 * @param {string} value - текущее значение
 * @param {function} onChange - обработчик изменения
 * @param {string} error - текст ошибки
 * @param {React.ReactNode} icon - иконка слева
 * @param {string} className - дополнительные классы
 */
const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  icon,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)

  // Для textarea рендерим отдельный элемент
  if (type === 'textarea') {
    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
          className={clsx(
            'input-base resize-none',
            error && 'border-error focus:ring-error'
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    )
  }

  // Для search добавляем иконку поиска
  if (type === 'search') {
    return (
      <div className={clsx('relative w-full', className)}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(
            'input-base pl-12',
            error && 'border-error focus:ring-error'
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    )
  }

  // Для password добавляем кнопку показа/скрытия
  if (type === 'password') {
    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={clsx(
              'input-base pr-12',
              error && 'border-error focus:ring-error'
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    )
  }

  // Стандартный input с опциональной иконкой
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx(
            'input-base',
            icon && 'pl-12',
            error && 'border-error focus:ring-error'
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  )
}

export default Input

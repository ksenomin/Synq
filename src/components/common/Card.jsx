import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Переиспользуемый компонент карточки
 * @param {React.ReactNode} children - содержимое карточки
 * @param {string} className - дополнительные классы
 * @param {boolean} hoverable - добавлять hover эффект
 * @param {function} onClick - обработчик клика (делает карточку кликабельной)
 */
const Card = ({
  children,
  className,
  hoverable = false,
  onClick,
  ...props
}) => {
  const Component = onClick ? motion.button : 'div'

  return (
    <Component
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        hoverable && 'hover:shadow-lg hover:-translate-y-1 transition-all duration-300',
        onClick && 'cursor-pointer text-left w-full',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Card

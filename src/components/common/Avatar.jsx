import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { getInitials } from '../../utils/helpers'

const Avatar = ({
  src,
  name = '',
  size = 'md',
  online = false,
  verified = false,
  className,
}) => {
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
  }, [src])

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-2xl',
  }

  const indicatorSize = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-6 h-6 border-4',
  }

  return (
    <div className={clsx('relative inline-flex shrink-0 rounded-full', className)}>
      <div
        className={clsx(
          'rounded-full overflow-hidden bg-primary-100 text-primary-700 flex items-center justify-center font-semibold',
          sizeClasses[size]
        )}
      >
        {src && !error ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          getInitials(name)
        )}
      </div>

      {online && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 bg-success rounded-full',
            indicatorSize[size]
          )}
        />
      )}

      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary-600 rounded-full border-2 border-white flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </div>
  )
}

export default Avatar

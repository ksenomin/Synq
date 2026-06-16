import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Paperclip, Check, CheckCheck } from 'lucide-react'
import { Avatar } from '../common'
import { formatTime } from '../../utils/helpers'

/**
 * Сообщение в чате
 * @param {Object} message - объект сообщения
 * @param {boolean} isOwn - является ли сообщение своим
 */
const ChatMessage = ({ message, isOwn }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Аватар (только для входящих) */}
        {!isOwn && (
          <Link
            to={`/profile/${message.senderSlug}`}
            className="shrink-0"
            title={message.senderName}
          >
            <Avatar
              src={message.senderAvatar}
              name={message.senderName}
              size="sm"
            />
          </Link>
        )}

        {/* Пузырь сообщения */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isOwn
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
          }`}
        >
          {/* Текст */}
          <p className="text-sm leading-relaxed">{message.text}</p>

          {/* Вложения */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                    isOwn
                      ? 'bg-primary-700 text-primary-100'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Paperclip className="w-3 h-3" />
                  {file}
                </div>
              ))}
            </div>
          )}

          {/* Время и статус */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
              isOwn ? 'text-primary-200' : 'text-gray-400'
            }`}
          >
            {formatTime(message.timestamp)}
            {isOwn && (
              message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ChatMessage

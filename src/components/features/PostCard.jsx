import { motion } from 'framer-motion'
import {
  Image,
  Video,
  FileText,
  Megaphone,
  Sparkles,
} from 'lucide-react'
import { Avatar, Badge } from '../common'
import { formatRelativeDate } from '../../utils/helpers'

/**
 * Карточка публикации в ленте профиля
 * Стиль: Behance + LinkedIn + Instagram editorial
 * @param {Object} post - объект публикации
 */
const PostCard = ({ post }) => {

  // Иконка типа публикации
  const typeIcons = {
    text: <FileText className="w-4 h-4" />,
    image: <Image className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    case: <Sparkles className="w-4 h-4" />,
    announcement: <Megaphone className="w-4 h-4" />,
    process: <FileText className="w-4 h-4" />,
  }

  const typeLabels = {
    text: 'Текст',
    image: 'Изображение',
    video: 'Видео',
    case: 'Кейс',
    announcement: 'Анонс',
    process: 'Процесс',
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Шапка поста */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.author?.avatar}
              name={post.author?.name || 'Автор'}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-900">
                {post.author?.name || 'Автор'}
              </p>
              <p className="text-sm text-gray-500">
                {formatRelativeDate(post.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant="gray" size="sm" className="flex items-center gap-1">
            {typeIcons[post.type]}
            {typeLabels[post.type]}
          </Badge>
        </div>

        {/* Заголовок */}
        {post.title && (
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            {post.title}
          </h3>
        )}

        {/* Текст */}
        <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
          {post.content}
        </p>
      </div>

      {/* Изображения */}
      {post.images && post.images.length > 0 && (
        <div
          className={
            post.images.length === 1
              ? 'w-full'
              : 'grid grid-cols-2 gap-1'
          }
        >
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={post.title || 'Изображение'}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

    </motion.article>
  )
}

export default PostCard

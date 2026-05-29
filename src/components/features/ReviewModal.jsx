import { useState } from 'react'
import { Star, Send } from 'lucide-react'
import { Modal, Button, Input } from '../common'
import { reviewsApi } from '../../api'

/**
 * Универсальное модальное окно для оставления отзыва
 * @param {boolean} isOpen - открыто ли окно
 * @param {function} onClose - функция закрытия
 * @param {string} title - заголовок модалки
 * @param {string} targetName - имя того, кому оставляем отзыв
 * @param {string} jobTitle - название задания (опционально)
 * @param {string} userId - ID получателя отзыва
 * @param {string} jobId - ID задания (опционально)
 * @param {function} onSuccess - коллбек после успешной отправки
 */
const ReviewModal = ({ isOpen, onClose, title = 'Оставить отзыв', targetName, jobTitle, userId, jobId, onSuccess }) => {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setRating(5)
    setText('')
    setError('')
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      resetForm()
    }
  }

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Выберите оценку от 1 до 5 звёзд')
      return
    }
    if (!text.trim()) {
      setError('Напишите текст отзыва')
      return
    }

    setLoading(true)
    setError('')

    try {
      await reviewsApi.create({
        userId,
        rating,
        text: text.trim(),
        jobId: jobId || undefined,
      })

      onSuccess?.()
      handleClose()
    } catch (err) {
      console.error('Ошибка отправки отзыва:', err)
      setError(
        err.response?.data?.message ||
        err.message ||
        'Произошла ошибка. Попробуйте позже.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-6">
        {jobTitle && (
          <div>
            <p className="text-gray-600 mb-1">Задание</p>
            <p className="font-semibold text-gray-900">{jobTitle}</p>
          </div>
        )}

        <div>
          <p className="text-gray-600 mb-1">{targetName ? `Отзыв о ${targetName}` : 'Получатель отзыва'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Оценка
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Оценить на ${star} звёзд`}
                disabled={loading}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-gray-700">
              {rating} / 5
            </span>
          </div>
        </div>

        <Input
          type="textarea"
          label="Текст отзыва"
          placeholder="Расскажите о вашем опыте работы..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          error={error}
          disabled={loading}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Отправка...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Отправить отзыв
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ReviewModal

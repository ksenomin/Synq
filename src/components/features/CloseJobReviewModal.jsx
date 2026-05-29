import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Check } from 'lucide-react'
import { Modal, Button, Input } from '../common'
import { jobsApi, reviewsApi } from '../../api'

/**
 * Модальное окно для закрытия задания и оставления отзыва исполнителю
 * @param {boolean} isOpen - открыто ли окно
 * @param {function} onClose - функция закрытия
 * @param {Object} job - объект задания
 * @param {function} onSuccess - коллбек после успешного закрытия и отзыва
 */
const CloseJobReviewModal = ({ isOpen, onClose, job, onSuccess }) => {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobClosed, setJobClosed] = useState(false)
  const [freelancerId, setFreelancerId] = useState(null)

  const resetForm = () => {
    setRating(5)
    setText('')
    setError('')
    setJobClosed(false)
    setFreelancerId(null)
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
      let currentFreelancerId = freelancerId

      if (!jobClosed) {
        const closeResult = await jobsApi.closeJob(job.id)
        currentFreelancerId = closeResult.freelancerId
        setJobClosed(true)
        setFreelancerId(currentFreelancerId)

        if (!currentFreelancerId) {
          throw new Error('Не удалось определить исполнителя задания')
        }
      }

      await reviewsApi.create({
        userId: currentFreelancerId,
        rating,
        text: text.trim(),
        jobId: job.id,
      })

      onSuccess?.()
      handleClose()
    } catch (err) {
      console.error('Ошибка закрытия задания или отправки отзыва:', err)
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Завершить задание" size="md">
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-1">Задание</p>
          <p className="font-semibold text-gray-900">{job?.title}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Оценка исполнителя
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
          label="Отзыв о работе"
          placeholder="Расскажите о качестве выполненной работы..."
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
                <Check className="w-4 h-4" />
                {jobClosed ? 'Отправить отзыв' : 'Завершить и оставить отзыв'}
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

export default CloseJobReviewModal

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Paperclip,
  Upload,
  X,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Check,
} from 'lucide-react'
import { Button, Input, Card, Badge } from '../components/common'
import { categoriesApi, jobsApi } from '../api'
import { normalizeCategory } from '../utils/normalize'
import { translateApiError } from '../utils/helpers'

const CreateJobPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    description: '',
    skills: '',
    isUrgent: false,
  })
  const [attachments, setAttachments] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    categoriesApi.getAll().then((data) => {
      console.log('Ответ API категорий:', data)
      const normalized = data.map((c) => normalizeCategory(c))
      console.log('Нормализованные категории:', normalized)
      setCategories(normalized)
    }).catch((err) => console.error('Ошибка загрузки категорий:', err))
  }, [])

  useEffect(() => {
    if (editId) {
      setLoading(true)
      jobsApi.getById(editId)
        .then((job) => {
          setFormData({
            title: job.title || '',
            categoryId: job.categoryId || job.category || '',
            budgetMin: String(job.budgetMin || ''),
            budgetMax: String(job.budgetMax || ''),
            deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
            description: job.description || '',
            skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || ''),
            isUrgent: job.isUrgent || false,
          })
          const jobAttachments = Array.isArray(job.attachments)
            ? job.attachments.map((a) => (typeof a === 'string' ? a : a.fileName))
            : []
          setAttachments(jobAttachments)
        })
        .catch((err) => {
          console.error('Ошибка загрузки задания для редактирования:', err)
          setErrors({ submit: 'Ошибка при загрузке задания для редактирования' })
        })
        .finally(() => setLoading(false))
    }
  }, [editId])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileAdd = () => {
    const fakeFiles = ['brief.pdf', 'reference.jpg', 'spec.docx']
    const randomFile = fakeFiles[Math.floor(Math.random() * fakeFiles.length)]
    setAttachments((prev) => [...prev, randomFile])
  }

  const handleFileRemove = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Введите название'
    if (!formData.categoryId) newErrors.categoryId = 'Выберите категорию'
    if (!formData.budgetMin) newErrors.budgetMin = 'Укажите бюджет'
    if (!formData.deadline) newErrors.deadline = 'Укажите дедлайн'
    if (!formData.description.trim()) newErrors.description = 'Введите описание'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const category = categories.find((c) => c.id === formData.categoryId)
      const payload = {
        title: formData.title,
        description: formData.description,
        categoryId: category?.id || formData.categoryId,
        budgetMin: Number(formData.budgetMin),
        budgetMax: formData.budgetMax ? Number(formData.budgetMax) : Number(formData.budgetMin),
        budgetType: 'Fixed',
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        isUrgent: formData.isUrgent,
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
      console.log('Отправка данных задания:', payload)
      if (editId) {
        await jobsApi.update(editId, payload)
        navigate('/my-jobs')
      } else {
        await jobsApi.create(payload)
        navigate('/jobs')
      }
    } catch (err) {
      console.error('Ошибка создания задания:', err)
      console.error('Ответ ошибки:', err.response)
      console.error('Данные ответа ошибки:', err.response?.data)
      setErrors({ submit: translateApiError(err.response?.data?.error) || err.response?.data?.title || err.response?.data?.message || 'Ошибка при создании задания' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12 lg:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {editId ? 'Редактировать задание' : 'Создать задание'}
          </h1>
          <p className="text-lg text-gray-600">
            {editId
              ? 'Внесите изменения в ваше задание'
              : 'Опишите ваш проект и получите отклики от специалистов'}
          </p>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Основная информация</h2>
                <p className="text-sm text-gray-500">Расскажите о вашем проекте</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Название проекта"
                placeholder="Например: Редизайн интернет-магазина"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                error={errors.title}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                      console.log('Выбрана категория:', cat.name, 'с id:', cat.id)
                      handleChange('categoryId', cat.id)
                    }}
                      className={`p-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                        formData.categoryId === cat.id
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-error">{errors.categoryId}</p>
                )}
              </div>

              <Input
                type="textarea"
                label="Описание проекта"
                placeholder="Подробно опишите задачу, требования и ожидания..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                error={errors.description}
                rows={6}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Бюджет и сроки</h2>
                <p className="text-sm text-gray-500">Укажите бюджет и дедлайн</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Бюджет от (₽)"
                placeholder="50000"
                value={formData.budgetMin}
                onChange={(e) => handleChange('budgetMin', e.target.value)}
                error={errors.budgetMin}
              />
              <Input
                type="number"
                label="Бюджет до (₽)"
                placeholder="150000"
                value={formData.budgetMax}
                onChange={(e) => handleChange('budgetMax', e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                type="date"
                label="Дедлайн"
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                error={errors.deadline}
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => handleChange('isUrgent', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Срочное задание</span>
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Требуемые навыки</h2>
                <p className="text-sm text-gray-500">Какие навыки нужны для проекта</p>
              </div>
            </div>

            <Input
              label="Навыки (через запятую)"
              placeholder="Figma, UI/UX, Responsive Design"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
            />

            {formData.skills && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills
                  .split(',')
                  .filter((s) => s.trim())
                  .map((skill, index) => (
                    <Badge key={index} variant="primary" size="md">
                      {skill.trim()}
                    </Badge>
                  ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Вложения</h2>
                <p className="text-sm text-gray-500">Прикрепите файлы к заданию</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFileAdd}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Нажмите для загрузки файлов
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOC, ZIP, FIG до 50MB
              </p>
            </button>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{file}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(index)}
                      className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Удалить файл"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {editId ? 'Сохранение...' : 'Публикация...'}
              </span>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                {editId ? 'Сохранить изменения' : 'Опубликовать задание'}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default CreateJobPage

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star,
  MapPin,
  Briefcase,
  CheckCircle,
  MessageSquare,
  Plus,
  FileText,
  Send,
  Paperclip,
  X,
  Edit3,
  Save,
  Clock,
  DollarSign,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Camera,
} from 'lucide-react'
import { Button, Avatar, Badge, Card, Modal, Input } from '../components/common'
import { PostCard } from '../components/features'
import { usersApi, postsApi, reviewsApi, chatsApi } from '../api'
import { useAppContext } from '../store'
import { normalizeUser } from '../utils/normalize'
import { formatBudget, getRoleName, translateApiError } from '../utils/helpers'
import { jobs } from '../data/jobs'

const ProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, setCurrentUser } = useAppContext()
  const currentUserId = state.currentUser?.id

  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const [avatarFile, setAvatarFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [newPostType, setNewPostType] = useState('text')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [postLoading, setPostLoading] = useState(false)
  const [postError, setPostError] = useState('')

  const [coverError, setCoverError] = useState(false)

  const isOwnProfile = user && currentUserId === user.id
  const isClient = user?.role === 'client'

  // Подсчет выполненных заказов для заказчика
  const completedJobsCount = isClient && user
    ? jobs.filter(job => job.clientId === user.id && job.status === 'completed').length
    : 0

  const postTypes = [
    { id: 'text', label: 'Текст', icon: FileText },
    { id: 'case', label: 'Кейс', icon: Briefcase },
    { id: 'announcement', label: 'Анонс', icon: Send },
  ]

  useEffect(() => {
    setCoverError(false)
    usersApi.getBySlug(id).then((userData) => {
      setUser(normalizeUser(userData))
      return Promise.all([
        postsApi.getByUserId(userData.id),
        reviewsApi.getByUserId(userData.id),
      ])
    }).then(([postsData, reviewsData]) => {
      setPosts(Array.isArray(postsData?.items) ? postsData.items : [])
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
    }).catch((err) => console.error('Ошибка загрузки профиля:', err)).finally(() => setLoading(false))
  }, [id])

  const openEdit = () => {
    setEditForm({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      hourlyRate: user.hourlyRate || '',
      portfolioUrl: user.portfolioUrl || '',
      yearsOfExperience: user.yearsOfExperience || '',
    })
    setEditError('')
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    setEditLoading(true)
    setEditError('')
    try {
      const updated = await usersApi.update(user.id, {
        name: editForm.name,
        bio: editForm.bio || null,
        location: editForm.location || null,
        hourlyRate: editForm.hourlyRate ? Number(editForm.hourlyRate) : null,
        portfolioUrl: editForm.portfolioUrl || null,
        yearsOfExperience: editForm.yearsOfExperience ? Number(editForm.yearsOfExperience) : null,
      })
      const normalized = normalizeUser(updated)
      setUser(normalized)
      setIsEditOpen(false)
      if (isOwnProfile && state.currentUser) {
        setCurrentUser({
          ...state.currentUser,
          name: normalized.name,
          slug: normalized.slug,
          bio: normalized.bio,
          location: normalized.location,
          hourlyRate: normalized.hourlyRate,
          portfolioUrl: normalized.portfolioUrl,
          yearsOfExperience: normalized.yearsOfExperience,
        })
      }
    } catch (err) {
      setEditError(translateApiError(err.response?.data?.error) || 'Ошибка при сохранении')
    } finally {
      setEditLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    try {
      const updated = await usersApi.uploadAvatar(user.id, file)
      const normalized = normalizeUser(updated)
      setUser(normalized)
      if (isOwnProfile && state.currentUser) {
        setCurrentUser({ ...state.currentUser, avatar: normalized.avatar })
      }
    } catch (err) {
      console.error('Ошибка загрузки аватара:', err)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    try {
      const updated = await usersApi.uploadCover(user.id, file)
      const normalized = normalizeUser(updated)
      setUser(normalized)
      if (isOwnProfile && state.currentUser) {
        setCurrentUser({ ...state.currentUser, cover: normalized.cover })
      }
    } catch (err) {
      console.error('Ошибка загрузки обложки:', err)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setPostError('Заполните заголовок и содержимое')
      return
    }
    setPostLoading(true)
    setPostError('')
    try {
      await postsApi.create({
        title: newPostTitle,
        content: newPostContent,
        type: newPostType,
      })
      setIsCreatePostOpen(false)
      setNewPostTitle('')
      setNewPostContent('')
      setNewPostType('text')
      const postsData = await postsApi.getByUserId(user.id)
      setPosts(Array.isArray(postsData?.items) ? postsData.items : [])
    } catch (err) {
      setPostError(translateApiError(err.response?.data?.error) || 'Ошибка при создании публикации')
    } finally {
      setPostLoading(false)
    }
  }

  const handleWriteMessage = async () => {
    if (!user || isOwnProfile) return
    try {
      const chat = await chatsApi.create(user.id)
      navigate('/chat', { state: { chatId: chat.id } })
    } catch (err) {
      console.error('Не удалось создать чат:', err)
      navigate('/chat')
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Пользователь не найден
        </h2>
        <Link to="/jobs">
          <Button variant="primary">Вернуться к заданиям</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="relative h-48 lg:h-64 overflow-hidden">
        {user.cover && !coverError ? (
          <img src={user.cover} alt="Обложка профиля" className="w-full h-full object-cover" onError={() => setCoverError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-500 to-primary-700" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        {isOwnProfile && (
          <label className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-sm text-white text-sm rounded-xl cursor-pointer hover:bg-black/70 transition-colors">
            <ImageIcon className="w-4 h-4" />
            <span>Изменить обложку</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadLoading} />
          </label>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mt-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:gap-8">
            <div className="relative">
              <Avatar
                src={user.avatar}
                name={user.name}
                size="xl"
                className="shadow-lg"
              />
              {isOwnProfile && (
                <label className="absolute bottom-2 right-2 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-lg border-2 border-white">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadLoading} />
                </label>
              )}
            </div>
            <div className="mt-4 lg:mt-0 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{user.name}</h1>
                {user.verified && (
                  <Badge variant="success" size="sm">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Верифицирован
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mt-1">{getRoleName(user.role)}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-bold text-lg">{user.rating}</span>
                  <span className="text-gray-500 text-sm">({user.reviewsCount} отзывов)</span>
                </div>
                {!isClient && (
                  <span className="text-gray-600">{user.completedJobs} выполненных работ</span>
                )}
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {user.location || 'Не указано'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-4 lg:mt-0 flex-wrap">
              {isOwnProfile && (
                <Button variant="secondary" onClick={openEdit}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              )}
              {!isOwnProfile && (
                <Button variant="primary" onClick={handleWriteMessage}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Написать
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-2 ${isClient ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 sm:gap-4 mb-12`}>
          {isClient ? (
            <Card className="p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{completedJobsCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">Создано заказов</p>
            </Card>
          ) : (
            <Card className="p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{user.completedJobs}</p>
              <p className="text-xs sm:text-sm text-gray-500">Выполнено работ</p>
            </Card>
          )}
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{user.reviewsCount}</p>
            <p className="text-xs sm:text-sm text-gray-500">Отзывов</p>
          </Card>
          <Card className="p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{user.rating}</p>
            <p className="text-xs sm:text-sm text-gray-500">Рейтинг</p>
          </Card>
          {!isClient && (
            <Card className="p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {user.hourlyRate ? formatBudget(user.hourlyRate) : '—'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">В час</p>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {user.bio && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">О себе</h2>
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              </Card>
            )}

            {!isClient && !!user.yearsOfExperience && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Опыт</h2>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <p className="text-gray-700">{user.yearsOfExperience} лет</p>
                </div>
              </Card>
            )}

            {!isClient && user.portfolioUrl && (
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Портфолио</h2>
                <a
                  href={user.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-sm underline">Открыть портфолио</span>
                </a>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {!isClient && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">Публикации</h2>
                    {posts.length > 0 && (
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        {posts.length}
                      </span>
                    )}
                  </div>
                  {isOwnProfile && (
                    <Button variant="primary" size="sm" onClick={() => setIsCreatePostOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Создать публикацию
                    </Button>
                  )}
                </div>

                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Пока нет публикаций
                    </h3>
                    <p className="text-gray-600">
                      Пользователь ещё не создал ни одной публикации
                    </p>
                  </Card>
                )}
              </>
            )}

            {reviews.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Отзывы</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={review.authorAvatar || ''}
                          name={review.authorName || 'Аноним'}
                          size="md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900">
                              {review.authorName || 'Аноним'}
                            </p>
                            <div className="flex items-center gap-1 text-yellow-500">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                            </div>
                          </div>
                          {review.projectTitle && (
                            <p className="text-sm text-gray-500 mb-2">
                              Проект: {review.projectTitle}
                            </p>
                          )}
                          <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка редактирования профиля */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Редактировать профиль" size="lg">
        <div className="space-y-6">
          {editError && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
              {editError}
            </div>
          )}

          {/* Загрузка аватара и обложки */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Аватар</label>
              <div className="flex items-center gap-3">
                <Avatar src={user.avatar} name={user.name} size="md" />
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  <span>Загрузить</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadLoading} />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Обложка</label>
              <div className="flex items-center gap-3">
                {user.cover ? (
                  <img src={user.cover} alt="" className="w-16 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-10 rounded-lg bg-gradient-to-r from-primary-500 to-primary-700" />
                )}
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  <span>Загрузить</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadLoading} />
                </label>
              </div>
            </div>
          </div>

          <Input
            label="Имя"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />

          <Input
            type="textarea"
            label="О себе"
            placeholder="Расскажите о себе..."
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            rows={4}
          />

          <Input
            label="Город"
            placeholder="Москва, Россия"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          />

          {!isClient && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Ставка в час (₽)"
                  placeholder="3500"
                  value={editForm.hourlyRate}
                  onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                />
                <Input
                  type="number"
                  label="Опыт (лет)"
                  placeholder="5"
                  value={editForm.yearsOfExperience}
                  onChange={(e) => setEditForm({ ...editForm, yearsOfExperience: e.target.value })}
                />
              </div>

              <Input
                label="Ссылка на портфолио"
                placeholder="https://..."
                value={editForm.portfolioUrl}
                onChange={(e) => setEditForm({ ...editForm, portfolioUrl: e.target.value })}
              />
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="primary" fullWidth onClick={handleSave} disabled={editLoading}>
              {editLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Сохранение...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setIsEditOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модалка создания публикации */}
      <Modal isOpen={isCreatePostOpen} onClose={() => setIsCreatePostOpen(false)} title="Создать публикацию" size="lg">
        <div className="space-y-6">
          {postError && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
              {postError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Тип публикации</label>
            <div className="grid grid-cols-3 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setNewPostType(type.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                    newPostType === type.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Заголовок"
            placeholder="Введите заголовок публикации"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />

          <Input
            type="textarea"
            label="Содержимое"
            placeholder="Расскажите о своём проекте, процессе или идее..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={6}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Вложения</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
              <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Перетащите файлы сюда или нажмите для выбора</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, MP4, PDF до 50MB</p>
            </div>
          </div>

          <Button variant="primary" fullWidth onClick={handleCreatePost} disabled={postLoading}>
            {postLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Публикация...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Опубликовать
              </>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ProfilePage

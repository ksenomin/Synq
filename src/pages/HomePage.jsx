import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  ArrowRight,
  Briefcase,
  Users,
  Star,
  CheckCircle,
  TrendingUp,
  Clock,
  Quote,
} from 'lucide-react'
import { Button, Input, Card, Badge, Avatar } from '../components/common'
import { JobCard } from '../components/features'
import { useAppContext } from '../store'
import { jobsApi, categoriesApi, usersApi } from '../api'
import { normalizeJob, normalizeCategory, normalizeUser } from '../utils/normalize'
import { getRoleName } from '../utils/helpers'

const HomePage = () => {
  const navigate = useNavigate()
  const { openJobModal } = useAppContext()
  const [searchQuery, setSearchQuery] = useState('')

  const [featuredJobs, setFeaturedJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [featuredSpecialists, setFeaturedSpecialists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      jobsApi.getAll({ page: 1, pageSize: 4 }),
      categoriesApi.getAll(),
      usersApi.getFreelancers(1, 4),
    ]).then(([jobsData, categoriesData, freelancersData]) => {
      setFeaturedJobs((jobsData.items || []).map((j) => normalizeJob(j)))
      setCategories(categoriesData.map((c) => normalizeCategory(c)))
      setFeaturedSpecialists((freelancersData.items || []).map((u) => normalizeUser(u)))
    }).catch((err) => console.error('Ошибка загрузки данных главной страницы:', err)).finally(() => setLoading(false))
  }, [])

  const stats = [
    { icon: Briefcase, value: '2,500+', label: 'Заданий' },
    { icon: Users, value: '1,200+', label: 'Специалистов' },
    { icon: Star, value: '4.9', label: 'Средний рейтинг' },
    { icon: CheckCircle, value: '98%', label: 'Успешных проектов' },
  ]

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Быстрый поиск',
      description: 'Найдите идеального специалиста за минуты с помощью умных фильтров',
    },
    {
      icon: CheckCircle,
      title: 'Проверенные исполнители',
      description: 'Все специалисты проходят верификацию и имеют рейтинг',
    },
    {
      icon: Clock,
      title: 'Экономия времени',
      description: 'Публикуйте задания и получайте отклики в течение часа',
    },
    {
      icon: Star,
      title: 'Гарантия качества',
      description: 'Безопасные сделки и защита для обеих сторон',
    },
  ]

  const testimonials = [
    {
      name: 'Игорь Сидоров',
      role: 'Основатель стартапа',
      avatar: 'https://i.pravatar.cc/150?u=10',
      text: 'Нашли дизайнера за 2 часа. Проект был готов раньше срока и превзошёл ожидания.',
      rating: 5,
    },
    {
      name: 'Анна Кузнецова',
      role: 'Маркетолог',
      avatar: 'https://i.pravatar.cc/150?u=11',
      text: 'Удобная платформа, много талантливых специалистов. Рекомендую всем!',
      rating: 5,
    },
    {
      name: 'Сергей Морозов',
      role: 'Product Manager',
      avatar: 'https://i.pravatar.cc/150?u=12',
      text: 'За полгода работы через SYNQ закрыли 15 проектов. Отличный сервис.',
      rating: 5,
    },
  ]

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-gray-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-30 animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-20 animate-float-delayed" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge variant="primary" size="md" className="mb-6">
                  Платформа для digital-специалистов
                </Badge>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                  Находи{' '}
                  <span className="text-gradient">лучших</span>
                  <br />
                  специалистов
                </h1>

                <p className="text-lg text-gray-600 mb-8 max-w-lg">
                  Дизайнеры, разработчики, motion-дизайнеры — все в одном месте.
                  Создавайте задания и получайте отклики от проверенных профессионалов.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <div className="flex-1">
                    <Input
                      type="search"
                      placeholder="Поиск специалиста или задания..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (searchQuery.trim()) {
                        navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`)
                      } else {
                        navigate('/jobs')
                      }
                    }}
                    size="lg"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Найти
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link to="/jobs">
                    <Button variant="primary" size="lg">
                      Найти специалиста
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/create-job">
                    <Button variant="secondary" size="lg">
                      Создать задание
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {featuredSpecialists.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className={`card-float p-4 ${
                      index % 2 === 0 ? 'mt-8' : ''
                    }`}
                  >
                    <Link to={`/profile/${user.slug}`}>
                      <Avatar
                        src={user.avatar}
                        name={user.name}
                        size="lg"
                        verified={user.verified}
                        className="mb-3"
                      />
                      <p className="font-semibold text-gray-900 text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {getRoleName(user.role)}
                      </p>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-medium">{user.rating}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-12 sm:mt-16"
          >
            {stats.map((stat, index) => (
              <Card key={index} className="p-4 sm:p-6 text-center">
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mx-auto mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Категории услуг
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Найдите специалиста нужного профиля среди {categories.length} основных категорий
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to="/categories">
                  <Card hoverable className="overflow-hidden group">
                    <div className={`h-32 bg-gradient-to-r ${category.color} relative`}>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {category.description}
                      </p>
                      <p className="text-sm text-primary-600 font-medium">
                        {category.jobCount} заданий
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {featuredJobs.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Последние задания
                </h2>
                <p className="text-lg text-gray-600">
                  Свежие проекты от проверенных заказчиков
                </p>
              </div>
              <Link to="/jobs">
                <Button variant="ghost">
                  Все задания
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => openJobModal(job)}
                  className="cursor-pointer"
                >
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Почему выбирают SYNQ
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Мы создали платформу, которая делает сотрудничество простым и безопасным
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center h-full">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Отзывы клиентов
            </h2>
            <p className="text-lg text-gray-600">
              Что говорят о нас пользователи платформы
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <Quote className="w-8 h-8 text-primary-200 mb-4" />
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {testimonial.text}
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={testimonial.avatar}
                      name={testimonial.name}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage

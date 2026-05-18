import { Link } from 'react-router-dom'
import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

/**
 * Footer — подвал сайта с ссылками, соцсетями и копирайтом
 */
const Footer = () => {
  const currentYear = new Date().getFullYear()

  // Колонки ссылок
  const footerLinks = [
    {
      title: 'Платформа',
      links: [
        { label: 'Главная', href: '/' },
        { label: 'Категории', href: '/categories' },
        { label: 'Задания', href: '/jobs' },
        { label: 'Создать задание', href: '/create-job' },
      ],
    },
    {
      title: 'Поддержка',
      links: [
        { label: 'Помощь', href: '#' },
        { label: 'FAQ', href: '#' },
        { label: 'Контакты', href: '#' },
        { label: 'Правила', href: '#' },
      ],
    },
    {
      title: 'Компания',
      links: [
        { label: 'О нас', href: '#' },
        { label: 'Блог', href: '#' },
        { label: 'Карьера', href: '#' },
        { label: 'Партнёрам', href: '#' },
      ],
    },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Бренд */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold">SYNQ</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Платформа для digital-специалистов: дизайнеров, разработчиков,
              motion-дизайнеров. Находите проекты и таланты в одном месте.
            </p>

            {/* Соцсети */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Ссылки */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Нижняя строка */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} SYNQ. Все права защищены.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Конфиденциальность
            </a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Условия
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

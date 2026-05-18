# SYNQ — Платформа для Digital-специалистов

Фриланс-биржа для дизайнеров, разработчиков и motion-дизайнеров.

## Стек технологий

- **React 18** — функциональные компоненты, хуки
- **Vite** — сборщик
- **JavaScript (ES6+)** — без TypeScript
- **TailwindCSS** — утилитарный CSS
- **React Router v6** — роутинг
- **React Context + useReducer** — управление состоянием
- **Framer Motion** — анимации
- **Lucide React** — иконки
- **date-fns** — форматирование дат
- **clsx** — условные классы

## Структура проекта

```
synq-frontend/
├── src/
│   ├── components/
│   │   ├── common/       # Button, Input, Card, Badge, Avatar, Modal
│   │   ├── layout/       # Header, Footer
│   │   └── features/     # JobCard, JobModal, PostCard, ChatMessage, ProposalCard
│   ├── pages/            # HomePage, CategoriesPage, JobsPage, ProfilePage, ChatPage, CreateJobPage, JobProposalsPage
│   ├── store/            # React Context + useReducer
│   ├── hooks/            # Кастомные хуки
│   ├── utils/            # Вспомогательные функции
│   ├── data/             # Mock данные
│   ├── App.jsx           # Роутинг
│   ├── main.jsx          # Точка входа
│   └── index.css         # Глобальные стили + Tailwind
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Страницы

| Страница | Маршрут | Описание |
|----------|---------|----------|
| Главная | `/` | Hero, категории, задания, преимущества, отзывы |
| Категории | `/categories` | Асимметричные карточки категорий |
| Задания | `/jobs` | Поиск, фильтры, сортировка, masonry layout |
| Профиль | `/profile/:id` | Cover, info, навыки, портфолио, лента, отзывы |
| Чат | `/chat` | Список диалогов + активный чат + info panel |
| Создать задание | `/create-job` | Форма создания проекта |
| Отклики | `/job/:id/proposals` | Карточки откликов на задание |

## Запуск

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр сборки
npm run preview
```

## Особенности

- **Glassmorphism** — backdrop-blur, полупрозрачные панели
- **Floating UI cards** — парящие карточки с тенями
- **Editorial asymmetry** — асимметричная композиция
- **Hover animations** — плавные переходы через Framer Motion
- **Masonry layout** — для заданий и портфолио
- **Адаптивность** — mobile-first, breakpoints sm/md/lg/xl
- **Accessibility** — семантический HTML, ARIA, keyboard navigation

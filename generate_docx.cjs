const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, TableOfContents, PageBreak, ImageRun,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  TabStopType, TabStopPosition, convertInchesToTwip,
  Header, Footer, PageNumber, NumberFormat,
  TableBorders, VerticalAlign, ShadingType,
  UnderlineType, LineRuleType
} = require('docx');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'explanatory_note_assets');
const MD_FILE = path.join(__dirname, 'explanatory_note.md');

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// ============================================================
// MERMAID DIAGRAMS
// ============================================================
const diagrams = {
  usecase: `graph LR
  subgraph Заказчик
    C((Заказчик))
  end
  subgraph Фрилансер
    F((Фрилансер))
  end
  C --> UC1((Регистрация Авторизация))
  F --> UC1
  C --> UC2((Создание задания))
  C --> UC3((Редактирование задания))
  C --> UC4((Удаление задания))
  C --> UC5((Просмотр предложений))
  C --> UC6((Принятие отклонение предложения))
  C --> UC7((Обмен сообщениями))
  C --> UC8((Оставление отзыва))
  F --> UC9((Поиск заданий))
  F --> UC10((Подача предложения))
  F --> UC11((Отзыв предложения))
  F --> UC7
  F --> UC12((Ведение публикаций))
  F --> UC13((Редактирование профиля))`,

  architecture: `graph TB
  subgraph Клиентская часть
    UI[Пользовательский интерфейс React]
    State[Управление состоянием Context API]
    Router[Маршрутизация React Router]
  end
  subgraph Серверная часть
    API[REST API контроллеры]
    Hub[SignalR ChatHub]
    Auth[Аутентификация Cookie]
    Services[Сервисы приложений]
  end
  subgraph Инфраструктура
    DB[(PostgreSQL)]
    Storage[Файловое хранилище]
    SMTP[SMTP-сервер Mailpit]
  end

  UI --> State
  UI --> Router
  UI -->|HTTP + Cookie| API
  UI -->|WebSocket| Hub
  API --> Auth
  API --> Services
  Hub --> Auth
  Hub --> Services
  Services --> DB
  Services --> Storage
  Services --> SMTP`,

  layers: `graph LR
  subgraph Внешний уровень
    Browser[Браузер]
  end
  subgraph Презентационный слой
    Pages[Страницы React]
    Components[Компоненты UI]
  end
  subgraph Слой API
    Controllers[Контроллеры]
    Hub2[SignalR Hub]
  end
  subgraph Слой бизнес-логики
    AuthService[AuthService]
    JobService[JobService]
    ChatService[ChatService]
    OtherServices[Прочие сервисы]
  end
  subgraph Слой данных
    EF[EF Core]
    PgSQL[(PostgreSQL)]
  end

  Browser --> Pages --> Components
  Browser -->|REST| Controllers
  Browser -->|WS| Hub2
  Controllers --> AuthService
  Controllers --> JobService
  Controllers --> ChatService
  Controllers --> OtherServices
  Hub2 --> ChatService
  AuthService --> EF
  JobService --> EF
  ChatService --> EF
  OtherServices --> EF
  EF --> PgSQL`,

  proposal_flow: `flowchart TD
  A[Начало] --> B[Фрилансер открывает задание]
  B --> C{Уже подано предложение?}
  C -->|Да| D[Отображается статус поданного предложения]
  C -->|Нет| E[Отображается форма подачи предложения]
  E --> F[Ввод данных: стоимость, сроки, сопроводительное письмо]
  F --> G[Отправка запроса POST /api/proposals/job/:jobId]
  G --> H{Запрос успешен?}
  H -->|Да| I[Предложение создано со статусом Pending]
  H -->|Нет| J[Отображение ошибки]
  I --> K[Заказчик получает уведомление]
  K --> L[Заказчик просматривает предложения]
  L --> M{Действие заказчика}
  M -->|Принять| N[Статус Accepted]
  M -->|Отклонить| O[Статус Rejected]
  N --> P[Создание чата для коммуникации]
  P --> Q[Конец]
  O --> Q
  D --> Q`,

  er: `erDiagram
  User ||--o{ Job : creates
  User ||--o{ Proposal : submits
  User ||--o{ Post : writes
  User ||--o{ Review : receives
  User ||--o{ Review : writes
  User ||--o{ Chat : participates
  User ||--o{ Message : sends
  Category ||--o{ Job : contains
  Job ||--o{ Proposal : receives
  Job ||--o{ JobSkill : has
  Job ||--o{ JobAttachment : has
  Job ||--o{ Chat : linked
  Proposal ||--o{ ProposalSkill : has
  Chat ||--o{ Message : contains`,

  classes: `classDiagram
  class AuthController {
    +Register(request)
    +Login(request)
    +VerifyEmail(token)
    +Logout()
    +Me()
  }

  class JobsController {
    +GetAll(filter)
    +GetById(id)
    +Create(data)
    +Update(id, data)
    +Delete(id)
    +GetMyJobs()
  }

  class UsersController {
    +GetMe()
    +GetById(id)
    +Update(id, data)
    +UploadAvatar(id, file)
    +GetFreelancers(page)
  }

  class ProposalsController {
    +GetByJobId(jobId)
    +Create(jobId, data)
    +UpdateStatus(id, status)
    +Withdraw(id)
    +GetMyProposals()
  }

  class ChatsController {
    +GetMyChats()
    +Create(participantId)
    +GetMessages(chatId)
    +SendMessage(chatId, text)
    +MarkAsRead(chatId)
  }

  class AuthService {
    +RegisterAsync(data)
    +LoginAsync(email, password)
    +VerifyEmailAsync(token)
  }

  class JobService {
    +GetAllAsync(filter)
    +GetByIdAsync(id)
    +CreateAsync(data)
    +UpdateAsync(id, data)
    +DeleteAsync(id)
  }

  class ChatService {
    +GetUserChatsAsync(userId)
    +CreateChatAsync(userId, participantId)
    +SendMessageAsync(chatId, senderId, text)
  }

  AuthController --> AuthService
  JobsController --> JobService
  UsersController --> UserService
  ProposalsController --> ProposalService
  ChatsController --> ChatService`
};

// Generate PNG images from mermaid diagrams
function generateDiagramImages() {
  const configFile = path.join(ASSETS_DIR, 'mermaid-config.json');
  fs.writeFileSync(configFile, JSON.stringify({
    theme: 'default',
    themeVariables: {
      fontSize: '14px'
    }
  }));

  const imagePaths = {};
  for (const [name, code] of Object.entries(diagrams)) {
    const inputFile = path.join(ASSETS_DIR, `diagram_${name}.mmd`);
    const outputFile = path.join(ASSETS_DIR, `diagram_${name}.png`);
    fs.writeFileSync(inputFile, code);
    try {
      execSync(`mmdc -i "${inputFile}" -o "${outputFile}" -c "${configFile}" --scale 2`, {
        timeout: 30000,
        stdio: 'pipe'
      });
      imagePaths[name] = outputFile;
      console.log(`Generated: ${outputFile}`);
    } catch (e) {
      console.error(`Failed to generate ${name}: ${e.message}`);
      imagePaths[name] = null;
    }
  }
  return imagePaths;
}

const imagePaths = generateDiagramImages();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const FONT = 'Times New Roman';
const FONT_SIZE_BODY = 24; // 12pt in half-points
const FONT_SIZE_HEADING = 28; // 14pt in half-points
const FONT_SIZE_SUBHEADING = 26; // 13pt in half-points
const FONT_SIZE_CAPTION = 22; // 11pt in half-points
const LINE_SPACING = 276; // 1.15 line spacing (240 * 1.15)

function createParagraph(text, options = {}) {
  const {
    heading = null,
    alignment = AlignmentType.JUSTIFIED,
    bold = false,
    italic = false,
    fontSize = FONT_SIZE_BODY,
    font = FONT,
    spacing = { line: LINE_SPACING, after: 120 },
    indent = { firstLine: 706 }, // 1.25cm = 706 twips (for body text)
    pageBreak = false,
    children = null,
    underline = undefined,
  } = options;

  const runs = children || [new TextRun({
    text: text,
    bold: bold,
    italics: italic,
    size: fontSize,
    font: font,
    underline: underline ? { type: underline } : undefined,
  })];

  return new Paragraph({
    alignment: alignment,
    heading: heading,
    spacing: spacing,
    indent: indent,
    children: runs,
    ...(pageBreak ? {} : {}),
  });
}

function createHeading(text, level = 1, centered = false) {
  // Level 1 = chapter heading (e.g., "Введение", "1 Анализ предметной области")
  // Level 2 = section (e.g., "1.1 Описание предметной области")
  // Level 3 = subsection (e.g., "1.3.1 Функциональные требования")

  const alignment = centered ? AlignmentType.CENTER : AlignmentType.JUSTIFIED;
  const indent = centered ? {} : { firstLine: 706 };

  if (level === 1) {
    return new Paragraph({
      alignment: alignment,
      spacing: { before: 240, after: 120, line: LINE_SPACING },
      indent: centered ? undefined : { firstLine: 706 },
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({
        text: text,
        bold: true,
        size: FONT_SIZE_HEADING,
        font: FONT,
      })],
    });
  } else if (level === 2) {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 200, after: 120, line: LINE_SPACING },
      indent: { firstLine: 706 },
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({
        text: text,
        bold: true,
        size: FONT_SIZE_HEADING,
        font: FONT,
      })],
    });
  } else {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 160, after: 80, line: LINE_SPACING },
      indent: { firstLine: 706 },
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun({
        text: text,
        bold: true,
        size: FONT_SIZE_SUBHEADING,
        font: FONT,
      })],
    });
  }
}

function createBodyParagraph(text) {
  return createParagraph(text, { alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 706 } });
}

function createBulletItem(text, level = 0) {
  const dash = '\u2014'; // em dash
  const indent = { left: 706 * (level + 1), hanging: 283 };
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SPACING, after: 40 },
    indent: indent,
    children: [
      new TextRun({ text: `${dash} `, size: FONT_SIZE_BODY, font: FONT }),
      new TextRun({ text: text, size: FONT_SIZE_BODY, font: FONT }),
    ],
  });
}

function createNumberedItem(text, number, level = 0) {
  // Level 0: 1) 2) 3)
  // Level 1: a) b) c)
  // Level 2: 1) 2) 3) (subnumbers)
  const indent = { left: 706 * (level + 1), hanging: 283 };
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SPACING, after: 40 },
    indent: indent,
    children: [new TextRun({ text: `${number} ${text}`, size: FONT_SIZE_BODY, font: FONT })],
  });
}

function createPageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function createCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200, line: LINE_SPACING },
    children: [new TextRun({
      text: text,
      size: FONT_SIZE_CAPTION,
      font: FONT,
      italics: false,
    })],
  });
}

function createDiagramWithCaption(imagePath, captionText) {
  const elements = [];
  if (imagePath && fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    elements.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new ImageRun({
        data: imageBuffer,
        transformation: {
          width: 500,
          height: 380,
        },
        type: 'png',
      })],
    }));
  } else {
    elements.push(createParagraph('[ЗАМЕЧАНИЕ: Вставить диаграмму вручную]', {
      alignment: AlignmentType.CENTER,
      italic: true,
    }));
  }
  elements.push(createCaption(captionText));
  return elements;
}

function createTable(headers, rows) {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: '000000',
  };

  const borders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      borders: borders,
      shading: { type: ShadingType.SOLID, color: 'D9E2F3' },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: LINE_SPACING },
        children: [new TextRun({ text: h, bold: true, size: FONT_SIZE_BODY, font: FONT })],
      })],
    })),
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map(cell => new TableCell({
      borders: borders,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: LINE_SPACING },
        indent: {},
        children: [new TextRun({ text: String(cell), size: FONT_SIZE_BODY, font: FONT })],
      })],
    })),
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ============================================================
// BUILD DOCUMENT
// ============================================================

async function buildDocument() {
  const children = [];

  // ===== TITLE PAGE (kept as-is from template concept) =====
  // We'll create a simple title page
  children.push(new Paragraph({ spacing: { before: 2000 }, children: [] }));
  children.push(createParagraph('Правительство Санкт-Петербурга', { alignment: AlignmentType.CENTER, bold: true, fontSize: 24, indent: {} }));
  children.push(createParagraph('Комитет по науке и высшей школе', { alignment: AlignmentType.CENTER, bold: true, fontSize: 24, indent: {} }));
  children.push(new Paragraph({ spacing: { before: 400 }, children: [] }));
  children.push(createParagraph('Санкт-Петербургское государственное бюджетное', { alignment: AlignmentType.CENTER, bold: true, fontSize: 26, indent: {} }));
  children.push(createParagraph('профессиональное образовательное учреждение', { alignment: AlignmentType.CENTER, bold: true, fontSize: 26, indent: {} }));
  children.push(createParagraph('\u00ABПолитехнический колледж городского хозяйства\u00BB', { alignment: AlignmentType.CENTER, bold: true, fontSize: 26, indent: {} }));
  children.push(new Paragraph({ spacing: { before: 2000 }, children: [] }));
  children.push(createParagraph('ПОЯСНИТЕЛЬНАЯ ЗАПИСКА', { alignment: AlignmentType.CENTER, bold: true, fontSize: 32, indent: {} }));
  children.push(createParagraph('к дипломному проекту', { alignment: AlignmentType.CENTER, bold: true, fontSize: 28, indent: {} }));
  children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
  children.push(createParagraph('Тема: Разработка веб-приложения маркетплейса фриланс-услуг SYNQ', { alignment: AlignmentType.CENTER, fontSize: 24, indent: {} }));
  children.push(new Paragraph({ spacing: { before: 2000 }, children: [] }));
  children.push(createParagraph('[ЗАМЕЧАНИЕ: Заполнить данные студента, руководителя, год]', { alignment: AlignmentType.CENTER, italic: true, fontSize: 24, indent: {} }));
  children.push(new Paragraph({ spacing: { before: 1000 }, children: [] }));
  children.push(createParagraph('Санкт-Петербург', { alignment: AlignmentType.CENTER, fontSize: 24, indent: {} }));
  children.push(createParagraph('2026', { alignment: AlignmentType.CENTER, fontSize: 24, indent: {} }));

  // ===== TABLE OF CONTENTS (placeholder) =====
  children.push(createPageBreak());
  children.push(createHeading('СОДЕРЖАНИЕ', 1, true));
  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  children.push(createParagraph('[ЗАМЕЧАНИЕ: Обновить оглавление после формирования документа в Word]', { alignment: AlignmentType.CENTER, italic: true, indent: {} }));

  // ===== ВВЕДЕНИЕ =====
  children.push(createPageBreak());
  children.push(createHeading('Введение', 1, true));

  children.push(createBodyParagraph('В современном мире цифровизация затронула практически все сферы деятельности человека. Рынок фриланс-услуг стремительно растёт: по данным платформы Upwork, количество удалённых специалистов увеличилось на 24% за последние несколько лет [7]. При этом на российском рынке наблюдается дефицит удобных, локализованных платформ для поиска фрилансеров и размещения заказов. Существующие решения либо ориентированы на международную аудиторию и не учитывают специфику российского рынка, либо имеют устаревший интерфейс и ограниченный функционал.'));

  children.push(createBodyParagraph('Актуальность темы обусловлена необходимостью создания современной, доступной и удобной информационной системы, позволяющей заказчикам находить квалифицированных исполнителей, а фрилансерам \u2014 предлагать свои услуги и вести коммуникацию в единой среде.'));

  children.push(createBodyParagraph('Цель дипломного проекта \u2014 разработка веб-приложения SYNQ \u2014 маркетплейса фриланс-услуг, обеспечивающего полный цикл взаимодействия между заказчиками и исполнителями: от поиска и размещения заданий до обмена сообщениями и оставления отзывов.'));

  children.push(createBodyParagraph('Для достижения поставленной цели были сформулированы следующие задачи:'));

  const tasks = [
    'Провести анализ предметной области и существующих аналогов;',
    'Сформулировать функциональные и нефункциональные требования к системе;',
    'Обосновать выбор стека технологий;',
    'Спроектировать архитектуру приложения, базу данных и пользовательские интерфейсы;',
    'Реализовать серверную часть на платформе ASP.NET Core;',
    'Реализовать клиентскую часть на базе React;',
    'Разработать мероприятия по обеспечению информационной безопасности;',
    'Провести тестирование разработанной системы.',
  ];
  tasks.forEach((t, i) => {
    children.push(createNumberedItem(t, `${i + 1})`));
  });

  // ===== CHAPTER 1 =====
  children.push(createPageBreak());
  children.push(createHeading('1 Анализ предметной области', 1));

  // 1.1
  children.push(createHeading('1.1 Описание предметной области', 2));

  children.push(createBodyParagraph('Предметной областью проекта является рынок фриланс-услуг. Фриланс-маркетплейс представляет собой электронную платформу, которая объединяет две основные группы пользователей: заказчиков (клиентов), размещающих задания, и исполнителей (фрилансеров), предлагающих свои услуги для выполнения этих заданий.'));

  children.push(createBodyParagraph('Процесс взаимодействия на фриланс-маркетплейсе включает следующие этапы:'));

  const steps1 = [
    'Регистрация пользователя в системе с указанием роли (заказчик или фрилансер);',
    'Создание заказчиком задания с указанием категории, бюджета, срока выполнения и требуемых навыков;',
    'Просмотр доступных заданий фрилансерами и подача заявок (предложений) с указанием стоимости, сроков и сопроводительного письма;',
    'Выбор заказчиком подходящего исполнителя из числа подавших заявки;',
    'Обмен сообщениями между заказчиком и исполнителем для уточнения деталей;',
    'Завершение работы и оставление отзывов с оценкой.',
  ];
  steps1.forEach((s, i) => {
    children.push(createNumberedItem(s, `${i + 1})`));
  });

  children.push(createBodyParagraph('Ключевые сущности предметной области включают: пользователи, категории услуг, задания, предложения, чаты, сообщения, публикации и отзывы.'));

  // 1.2
  children.push(createHeading('1.2 Обзор аналогов', 2));

  children.push(createBodyParagraph('Для выявления достоинств и недостатков существующих решений были проанализированы следующие фриланс-платформы.'));

  children.push(createBodyParagraph('FL.ru \u2014 крупнейшая российская фриланс-биржа. Предлагает широкий спектр категорий услуг, систему безопасной сделки, рейтинги исполнителей. Однако платформа имеет перегруженный интерфейс, большое количество рекламы и платные тарифы для полноценного использования функций [8].'));

  children.push(createBodyParagraph('Kwork.ru \u2014 российский магазин услуг с фиксированными ценами. Отличается простотой публикации услуг и быстрой работой, но ограничивает фрилансеров фиксированной стоимостью и не даёт возможности вести гибкую коммуникацию по каждому заданию [9].'));

  children.push(createBodyParagraph('Upwork \u2014 международная платформа с расширенным функционалом, включая трекер времени, escrow-платежи, видеозвонки. Однако высокая комиссия (до 20%), сложная система оплаты и отсутствие локализации для российского рынка существенно ограничивают удобство использования для отечественных пользователей [10].'));

  children.push(createBodyParagraph('Fiverr \u2014 международная платформа с моделью \u00ABмагазин услуг\u00BB. Фрилансеры создают пакеты услуг с фиксированной ценой. Платформа имеет привлекательный дизайн и качественную систему отзывов, но ограничивает гибкость ценообразования и коммуникацию между сторонами [11].'));

  children.push(createBodyParagraph('Анализ аналогов показывает, что ни одна из существующих платформ не сочетает в себе современный интерфейс, локализацию на русский язык, гибкую систему обмена сообщениями и отсутствие высоких комиссий. Это подтверждает актуальность разработки собственного решения.'));

  // 1.3
  children.push(createHeading('1.3 Требования к разрабатываемой ИС', 2));

  children.push(createHeading('Функциональные требования', 3));

  const funcReqs = [
    'Регистрация и авторизация пользователей с разделением на роли (заказчик, фрилансер);',
    'Создание, редактирование и удаление заданий заказчиками;',
    'Просмотр каталога заданий с возможностью фильтрации по категориям, бюджету и поиску;',
    'Подача предложений на задания фрилансерами;',
    'Принятие или отклонение предложений заказчиками;',
    'Обмен сообщениями между пользователями в реальном времени;',
    'Просмотр и редактирование профиля пользователя;',
    'Загрузка и отображение аватара и обложки профиля;',
    'Система публикаций (постов) в профиле фрилансера;',
    'Система отзывов и рейтингов;',
    'Категоризация заданий по направлениям;',
    'Управление собственными заданиями и предложениями.',
  ];
  funcReqs.forEach((r, i) => {
    children.push(createNumberedItem(r, `${i + 1})`));
  });

  children.push(createHeading('Требования к интерфейсу', 3));

  const uiReqs = [
    'Доступность на различных устройствах (мобильные телефоны, планшеты, ПК) \u2014 адаптивная вёрстка;',
    'Пользовательский опыт: простота навигации, минимализм дизайна;',
    'Адаптивность интерфейса в зависимости от разрешения экрана;',
    'Единый визуальный стиль на всех страницах приложения (glassmorphism-дизайн, анимации переходов);',
    'Локализация интерфейса на русский язык.',
  ];
  uiReqs.forEach((r, i) => {
    children.push(createNumberedItem(r, `${i + 1})`));
  });

  // 1.4
  children.push(createHeading('1.4 Обоснование выбора стека технологий', 2));

  // Languages
  children.push(createHeading('Языки программирования', 3));

  children.push(createBodyParagraph('C# выбран для реализации серверной части. Преимущества: строгая типизация, богатая экосистема библиотек .NET, высокая производительность, кроссплатформенность благодаря .NET 8. По сравнению с Python, C# обеспечивает лучшую производительность для веб-приложений; по сравнению с Java \u2014 более лаконичный синтаксис и современная система асинхронного программирования [4].'));

  children.push(createBodyParagraph('JavaScript выбран для реализации клиентской части. Язык является стандартом де-факто для веб-разработки, обеспечивает нативную поддержку в браузерах и обладает широчайшей экосистемой библиотек. По сравнению с TypeScript, чистый JavaScript упрощает процесс разработки и снижает порог входа для данного проекта [5].'));

  // Frameworks
  children.push(createHeading('Фреймворки', 3));

  children.push(createBodyParagraph('ASP.NET Core 8 \u2014 фреймворк для серверной части. Обеспечивает высокую производительность (один из самых быстрых веб-фреймворков по бенчмаркам TechEmpower), встроенную поддержку dependency injection, модульную архитектуру и встроенную систему аутентификации [12].'));

  children.push(createBodyParagraph('React 18 \u2014 библиотека для построения пользовательского интерфейса. Обеспечивает компонентный подход, виртуальный DOM для эффективного обновления, богатую экосистему и высокую производительность. По сравнению с Vue.js, React имеет более широкое сообщество и больше доступных компонентов; по сравнению с Angular \u2014 меньший порог входа и более гибкая архитектура [5].'));

  // DBMS
  children.push(createHeading('Система управления базами данных', 3));

  children.push(createBodyParagraph('PostgreSQL выбрана в качестве СУБД. Преимущества: открытое программное обеспечение, поддержка сложных типов данных, надёжность и соответствие ACID, расширяемость. По сравнению с MySQL, PostgreSQL предоставляет более мощную систему индексов (включая GIN-индексы для полнотекстового поиска) и лучшую поддержку стандартов SQL. По сравнению с SQLite, PostgreSQL обеспечивает масштабируемость и поддержку конкурентных подключений, необходимых для многопользовательского приложения [14].'));

  // Additional tech
  children.push(createHeading('Дополнительные технологии', 3));

  const additionalTechs = [
    'Vite \u2014 быстрый сборщик клиентского приложения, обеспечивающий мгновенную перезагрузку модулей (HMR) и оптимизированную сборку для продакшена;',
    'TailwindCSS \u2014 утилитарный CSS-фреймворк для быстрого создания адаптивных интерфейсов;',
    'SignalR \u2014 библиотека для обмена сообщениями в реальном времени (WebSockets);',
    'Entity Framework Core \u2014 ORM-фреймворк для работы с PostgreSQL, миграции и LINQ-запросы;',
    'Framer Motion \u2014 библиотека анимаций для React, обеспечивающая плавные переходы;',
    'Axios \u2014 HTTP-клиент для запросов к серверному API;',
    'Docker \u2014 контейнеризация для развёртывания всех компонентов системы.',
  ];
  additionalTechs.forEach((t) => {
    children.push(createBulletItem(t));
  });

  // ===== CHAPTER 2 =====
  children.push(createPageBreak());
  children.push(createHeading('2 Проектирование', 1));

  children.push(createHeading('2.1 Проектирование системы', 2));

  // User groups
  children.push(createHeading('Определение группы пользователей', 3));

  children.push(createBodyParagraph('Система предусматривает две основные группы пользователей:'));

  children.push(createBulletItem('Заказчик (Client) \u2014 пользователь, размещающий задания. Функции: создание и редактирование заданий, просмотр предложений, принятие или отклонение предложений, обмен сообщениями, оставление отзывов, управление собственными заданиями;'));
  children.push(createBulletItem('Фрилансер (Freelancer) \u2014 пользователь, предлагающий услуги. Функции: поиск и просмотр заданий, подача предложений, отзыв предложений, обмен сообщениями, ведение публикаций в профиле, управление собственными предложениями.'));

  // UseCase diagram
  children.push(...(createDiagramWithCaption(imagePaths.usecase, 'Рисунок 1 \u2014 Диаграмма прецедентов')));

  // Architectural modeling
  children.push(createHeading('Функциональное моделирование', 3));

  children.push(createBodyParagraph('Архитектура приложения построена по принципу клиент-серверного взаимодействия. Клиентская часть (React SPA) взаимодействует с серверной частью (ASP.NET Core WebAPI) через REST API, а для обмена сообщениями в реальном времени используется SignalR WebSocket.'));

  children.push(...(createDiagramWithCaption(imagePaths.architecture, 'Рисунок 2 \u2014 Диаграмма взаимодействия компонентов системы')));

  children.push(...(createDiagramWithCaption(imagePaths.layers, 'Рисунок 3 \u2014 Многоуровневая архитектура приложения')));

  // Proposal algorithm
  children.push(createBodyParagraph('Алгоритм обработки предложения представлен на блок-схеме ниже.'));

  children.push(...(createDiagramWithCaption(imagePaths.proposal_flow, 'Рисунок 4 \u2014 Блок-схема алгоритма обработки предложения')));

  // 2.2 Database model
  children.push(createHeading('2.2 Разработка модели базы данных', 2));

  children.push(createBodyParagraph('База данных приложения содержит 14 таблиц, организованных в реляционную модель. Основные сущности и связи между ними представлены на диаграмме.'));

  children.push(...(createDiagramWithCaption(imagePaths.er, 'Рисунок 5 \u2014 Диаграмма базы данных')));

  children.push(createBodyParagraph('Основные ограничения целостности:'));

  const constraints = [
    'Уникальный индекс по полю Email таблицы Users;',
    'Уникальный индекс по полю Slug таблицы Categories;',
    'Каскадное удаление для зависимых сущностей (предложения при удалении задания, сообщения при удалении чата);',
    'Ограничение на удаление (Restrict) для ссылок на пользователей \u2014 нельзя удалить пользователя, если на него ссылаются другие записи;',
    'Составные первичные ключи для таблиц связей many-to-many (JobSkill, ProposalSkill).',
  ];
  constraints.forEach(c => children.push(createBulletItem(c)));

  // 2.3 Interface design
  children.push(createHeading('2.3 Проектирование интерфейсов', 2));

  children.push(createBodyParagraph('Проектирование интерфейсов выполнено с применением glassmorphism-стиля \u2014 современного подхода к визуальному дизайну, при котором элементы интерфейса выглядят как полупрозрачные стеклянные панели с размытием фона. Основные принципы дизайна:'));

  const designPrinciples = [
    'цветовая палитра: тёмная тема с акцентным фиолетовым цветом (primary);',
    'типографика: шрифт Inter, обеспечивающий высокую читаемость на экранах;',
    'анимации: плавные переходы между страницами с использованием Framer Motion;',
    'адаптивность: интерфейс адаптируется к размерам экрана от мобильных устройств до десктопов;',
    'карточный макет: задания и предложения представлены в виде карточек с masonry-раскладкой;',
    'модальные окна: для детального просмотра заданий и форм ввода.',
  ];
  designPrinciples.forEach(d => children.push(createBulletItem(d)));

  children.push(createBodyParagraph('Макеты ключевых экранов интерфейса:'));

  const screens = [
    'Главная страница \u2014 герой-секция с поиском, каталог категорий, последние задания;',
    'Страница регистрации/авторизации \u2014 форма с переключением вкладок;',
    'Каталог заданий \u2014 фильтры, поиск, карточки заданий;',
    'Профиль пользователя \u2014 аватар, обложка, статистика, публикации;',
    'Страница чата \u2014 список чатов и область сообщений в реальном времени;',
    'Страница создания задания \u2014 многосекционная форма.',
  ];
  screens.forEach((s, i) => children.push(createNumberedItem(s, `${i + 1})`)));

  children.push(createParagraph('[ЗАМЕЧАНИЕ: Здесь следует вставить макеты/скриншоты интерфейса приложения]', { alignment: AlignmentType.CENTER, italic: true, bold: true, indent: {} }));

  // ===== CHAPTER 3 =====
  children.push(createPageBreak());
  children.push(createHeading('3 Реализация', 1));

  children.push(createHeading('3.1 Реализация основных функций', 2));

  children.push(createBodyParagraph('Диаграмма классов серверной части приложения представлена ниже.'));

  children.push(...(createDiagramWithCaption(imagePaths.classes, 'Рисунок 6 \u2014 Диаграмма классов серверной части приложения')));

  // Auth implementation
  children.push(createHeading('Реализация аутентификации и авторизации', 3));

  children.push(createBodyParagraph('Аутентификация реализована на основе Cookie Authentication в ASP.NET Core. При регистрации пользователь указывает email, пароль и роль (заказчик или фрилансер). Пароль хешируется с использованием алгоритма PBKDF2 с SHA-256, 100000 итераций, 16-байтовым salt и 32-байтовым ключом.'));

  children.push(createBodyParagraph('При успешной аутентификации сервер устанавливает HttpOnly cookie с именем \u00ABsynq_session\u00BB со сроком действия 7 дней и скользящим обновлением (sliding expiration). Cookie содержит claims: идентификатор пользователя, email, имя и роль.'));

  children.push(createBodyParagraph('На клиентской стороне используется axios HTTP-клиент с параметром withCredentials: true для автоматической отправки cookie при каждом запросе. Контекст приложения (AppContext) хранит состояние аутентификации и информацию о текущем пользователе.'));

  // Messaging implementation
  children.push(createHeading('Реализация обмена сообщениями', 3));

  children.push(createBodyParagraph('Обмен сообщениями реализован с использованием SignalR \u2014 библиотеки для реального времени от Microsoft. На сервере определён ChatHub, доступный по маршруту /chatHub и защищённый атрибутом [Authorize].'));

  children.push(createBodyParagraph('ChatHub отслеживает подключения пользователей через статический словарь _userConnections и обеспечивает следующие операции:'));

  const chatOps = [
    'SendMessage \u2014 отправка сообщения с сохранением в базу данных и уведомлением получателя в реальном времени;',
    'MarkAsRead \u2014 отметка сообщений как прочитанных;',
    'Typing \u2014 индикация набора текста собеседником.',
  ];
  chatOps.forEach((c, i) => children.push(createNumberedItem(c, `${i + 1})`)));

  // REST API
  children.push(createHeading('Реализация REST API', 3));

  children.push(createBodyParagraph('Серверная часть предоставляет 8 контроллеров с REST-эндпоинтами, покрывающими все функциональные требования:'));

  const controllers = [
    'AuthController \u2014 регистрация, вход, выход, верификация email;',
    'JobsController \u2014 CRUD-операции с заданиями, фильтрация и пагинация;',
    'UsersController \u2014 управление профилем, загрузка аватара и обложки;',
    'ProposalsController \u2014 создание предложений, изменение статуса, отзыв;',
    'ChatsController \u2014 создание чатов, отправка сообщений, отметка прочитанных;',
    'CategoriesController \u2014 получение списка категорий;',
    'PostsController \u2014 CRUD публикаций в профиле;',
    'ReviewsController \u2014 создание и получение отзывов.',
  ];
  controllers.forEach(c => children.push(createBulletItem(c)));

  children.push(createBodyParagraph('Все контроллеры наследуются от BaseController, предоставляющего вспомогательные методы: GetCurrentUserId() для извлечения идентификатора текущего пользователя из claims и OkPaginated() для формирования ответов с пагинацией.'));

  // 3.2 Interface implementation
  children.push(createHeading('3.2 Реализация интерфейсов', 2));

  children.push(createBodyParagraph('Клиентская часть реализована как Single Page Application (SPA) на React 18 с использованием Vite в качестве сборщика.'));

  children.push(createHeading('Маршрутизация', 3));

  children.push(createBodyParagraph('Маршрутизация реализована с помощью React Router v6. Все маршруты, кроме главной страницы и страницы авторизации, защищены компонентом ProtectedRoute, проверяющим состояние аутентификации и перенаправляющим неавторизованных пользователей на страницу входа.'));

  children.push(createHeading('Управление состоянием', 3));

  children.push(createBodyParagraph('Глобальное состояние приложения управляется с помощью React Context API и useReducer. Единый контекст AppContext обеспечивает доступ к следующим данным: текущий пользователь, состояние аутентификации, фильтры заданий, активный чат, модальное окно задания и уведомления. Доступ к контексту осуществляется через кастомный хук useAppContext().'));

  children.push(createHeading('API-клиент', 3));

  children.push(createBodyParagraph('Для взаимодействия с сервером используется axios-клиент, сконфигурированный с базовым URL /api и параметром withCredentials: true. API разделён на доменные модули: auth, jobs, categories, users, proposals, posts, reviews, chats, signalr. Ответы сервера нормализуются через функции в src/utils/normalize.js перед отображением в компонентах.'));

  children.push(createHeading('Компоненты интерфейса', 3));

  children.push(createBodyParagraph('Переиспользуемые компоненты разделены на три категории:'));

  const componentCategories = [
    'Компоненты общего назначения (src/components/common/) \u2014 Button, Input, Card, Badge, Avatar, Modal;',
    'Компоненты layout (src/components/layout/) \u2014 Header, Footer;',
    'Компоненты предметной области (src/components/features/) \u2014 JobCard, JobModal, ProposalCard, ChatMessage, PostCard.',
  ];
  componentCategories.forEach(c => children.push(createBulletItem(c)));

  children.push(createBodyParagraph('Каждый компонент поддерживает анимации через Framer Motion и адаптируется к размеру экрана с помощью TailwindCSS.'));

  // 3.3 Testing
  children.push(createHeading('3.3 Тестирование', 2));

  children.push(createBodyParagraph('Тестирование разрабатываемой системы проводилось вручную, поскольку инфраструктура автоматизированного тестирования в проекте не предусмотрена. Основные направления тестирования:'));

  const testTypes = [
    'Функциональное тестирование \u2014 проверка всех пользовательских сценариев: регистрация, авторизация, создание задания, подача предложения, обмен сообщениями, редактирование профиля;',
    'Тестирование API \u2014 проверка всех REST-эндпоинтов через Swagger UI и прямые HTTP-запросы;',
    'Кроссбраузерное тестирование \u2014 проверка корректной работы в браузерах Chrome, Firefox, Edge;',
    'Адаптивное тестирование \u2014 проверка корректного отображения интерфейса на различных размерах экрана;',
    'Тестирование безопасности \u2014 проверка доступа к защищённым маршрутам без аутентификации, проверка валидации входных данных.',
  ];
  testTypes.forEach((t, i) => children.push(createNumberedItem(t, `${i + 1})`)));

  children.push(createBodyParagraph('Для развёртывания тестовой среды используется Docker Compose, включающий PostgreSQL, .NET backend, React frontend и Mailpit для тестирования email-отправки.'));

  // ===== CHAPTER 4 =====
  children.push(createPageBreak());
  children.push(createHeading('4 Руководство администратора/пользователя', 1, true));

  children.push(createHeading('4.1 Описание установки', 2));

  children.push(createBodyParagraph('Для установки и запуска приложения необходимо выполнить следующие шаги:'));

  const installSteps = [
    'Убедиться, что на компьютере установлен Docker и Docker Compose;',
    'Клонировать репозиторий проекта;',
    'В корневой директории проекта выполнить команду:',
  ];
  installSteps.forEach((s, i) => children.push(createNumberedItem(s, `${i + 1})`)));

  children.push(createParagraph('docker-compose up -d', { alignment: AlignmentType.LEFT, indent: { left: 1412 }, spacing: { line: LINE_SPACING, after: 40, before: 40 }, bold: false }));

  const installSteps2 = [
    'Дождаться загрузки и запуска всех контейнеров (PostgreSQL, backend, frontend, Mailpit);',
    'При первом запуске автоматически выполнятся миграции базы данных и заполнение начальными данными.',
  ];
  installSteps2.forEach((s, i) => children.push(createNumberedItem(s, `${i + 4})`)));

  children.push(createBodyParagraph('После запуска сервисы доступны по адресам:'));

  children.push(createBulletItem('Фронтенд: http://localhost:3000;'));
  children.push(createBulletItem('Бэкенд API: http://localhost:5000;'));
  children.push(createBulletItem('Swagger UI: http://localhost:5000/swagger;'));
  children.push(createBulletItem('Mailpit (тестовая почта): http://localhost:8025;'));
  children.push(createBulletItem('PostgreSQL: localhost:5438.'));

  children.push(createHeading('4.2 Описание запуска', 2));

  children.push(createBodyParagraph('После успешной установки все сервисы запускаются автоматически. Для доступа к приложению необходимо открыть браузер и перейти по адресу http://localhost:3000.'));

  children.push(createBodyParagraph('Тестовые учётные данные, создаваемые при инициализации:'));

  children.push(createBulletItem('Заказчик: email client@synq.app, пароль password123;'));
  children.push(createBulletItem('Фрилансер: email freelancer@synq.app, пароль password123.'));

  children.push(createHeading('4.3 Инструкции по работе', 2));

  children.push(createBodyParagraph('Для заказчика:'));

  const clientSteps = [
    'Зарегистрируйтесь с ролью \u00ABЗаказчик\u00BB или войдите под тестовой учётной записью;',
    'Нажмите \u00ABСоздать задание\u00BB на главной странице или в навигации;',
    'Заполните форму: название, категория, описание, бюджет, срок, навыки;',
    'Перейдите в раздел \u00ABМои задания\u00BB для управления созданными заданиями;',
    'Откройте задание для просмотра поступивших предложений;',
    'Принмите или отклоните предложение;',
    'Используйте чат для коммуникации с исполнителем;',
    'Оставьте отзыв после завершения работы.',
  ];
  clientSteps.forEach((s, i) => children.push(createNumberedItem(s, `${i + 1})`)));

  children.push(createBodyParagraph('Для фрилансера:'));

  const freelancerSteps = [
    'Зарегистрируйтесь с ролью \u00ABФрилансер\u00BB или войдите под тестовой учётной записью;',
    'Просматривайте каталог заданий с фильтрацией по категории и бюджету;',
    'Откройте задание и подайте предложение с указанием стоимости, сроков и сопроводительного письма;',
    'Перейдите в раздел \u00ABМои предложения\u00BB для отслеживания статуса;',
    'Заполните профиль: добавьте аватар, обложку, описание, опыт, портфолио;',
    'Создавайте публикации в профиле для привлечения заказчиков;',
    'Используйте чат для коммуникации с заказчиком.',
  ];
  freelancerSteps.forEach((s, i) => children.push(createNumberedItem(s, `${i + 1})`)));

  children.push(createHeading('4.4 Сообщения пользователю', 2));

  children.push(createBodyParagraph('При работе с приложением пользователь может столкнуться со следующими ситуациями:'));

  children.push(createBulletItem('Если при регистрации указан уже существующий email, система выведет сообщение об ошибке;'));
  children.push(createBulletItem('Если пароль не соответствует требованиям (минимум 6 символов), отобразится предупреждение;'));
  children.push(createBulletItem('При попытке доступа к защищённым страницам без авторизации пользователь будет перенаправлен на страницу входа;'));
  children.push(createBulletItem('При нарушении прав доступа (например, попытка редактирования чужого задания) сервер вернёт ошибку 403.'));

  // ===== CHAPTER 5 =====
  children.push(createPageBreak());
  children.push(createHeading('5 Мероприятия по информационной безопасности', 1));

  children.push(createHeading('5.1 Возможные угрозы информационной безопасности', 2));

  children.push(createBodyParagraph('При работе с приложением SYNQ возможны следующие угрозы информационной безопасности:'));

  const threats = [
    'Несанкционированный доступ к учётным записям \u2014 получение злоумышленником доступа к аккаунту легитимного пользователя путём подбора пароля или перехвата сессии;',
    'Перехват данных при передаче \u2014 возможность чтения и модификации данных между клиентом и сервером при передаче по незащищённому каналу;',
    'Межсайтовый скриптинг (XSS) \u2014 внедрение вредоносного кода в страницы приложения через пользовательский ввод, позволяющее похищать данные пользователей;',
    'SQL-инъекции \u2014 попытка внедрения SQL-кода через входные параметры для несанкционированного доступа к базе данных;',
    'Подделка межсайтовых запросов (CSRF) \u2014 выполнение действий от имени авторизованного пользователя без его согласия;',
    'Утечка данных пользователей \u2014 раскрытие персональных данных, паролей и другой конфиденциальной информации;',
    'Нарушение доступности сервиса \u2014 атаки типа DDoS, приводящие к неработоспособности приложения;',
    'Несанкционированный доступ к API \u2014 обращение к защищённым эндпоинтам без надлежащих прав.',
  ];
  threats.forEach((t, i) => children.push(createNumberedItem(t, `${i + 1})`)));

  children.push(createHeading('5.2 Принятые меры для предотвращения угроз', 2));

  // 5.2.1 Access control
  children.push(createHeading('5.2.1 Разграничение доступа', 3));

  children.push(createBodyParagraph('В приложении SYNQ реализована ролевая модель разграничения доступа. Система предусматривает две роли: \u00ABЗаказчик\u00BB (Client) и \u00ABФрилансер\u00BB (Freelancer). Каждая роль имеет определённый набор разрешений.'));

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  children.push(createCaption('Таблица 1 \u2014 Матрица доступа по ролям'));

  children.push(createTable(
    ['Функция', 'Заказчик', 'Фрилансер', 'Неавторизованный'],
    [
      ['Просмотр каталога заданий', 'Да', 'Да', 'Нет'],
      ['Создание задания', 'Да', 'Нет', 'Нет'],
      ['Подача предложения', 'Нет', 'Да', 'Нет'],
      ['Принятие/отклонение предложения', 'Да', 'Нет', 'Нет'],
      ['Обмен сообщениями', 'Да', 'Да', 'Нет'],
      ['Редактирование профиля', 'Да', 'Да', 'Нет'],
      ['Создание публикации', 'Нет', 'Да', 'Нет'],
      ['Оставление отзыва', 'Да', 'Да', 'Нет'],
    ]
  ));

  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  children.push(createBodyParagraph('Разграничение доступа реализовано на нескольких уровнях:'));

  children.push(createBulletItem('На уровне маршрутизации (клиент) \u2014 компонент ProtectedRoute проверяет статус аутентификации и перенаправляет неавторизованных пользователей на страницу входа;'));
  children.push(createBulletItem('На уровне API-контроллеров (сервер) \u2014 атрибут [Authorize] ограничивает доступ к защищённым эндпоинтам только для аутентифицированных пользователей;'));
  children.push(createBulletItem('На уровне бизнес-логики (сервер) \u2014 проверка прав владения: пользователь может редактировать/удалять только собственные задания, предложения и профили.'));

  children.push(createBodyParagraph('Выбор ролевой модели разграничения доступа обусловлен спецификой предметной области \u2014 фриланс-маркетплейс чётко разделяется на две категории пользователей с различными функциональными потребностями. По сравнению с дискреционной моделью, ролевая модель проще в управлении и масштабировании, а также не требует сложной системы назначения прав на отдельные объекты [6].'));

  // 5.2.2 Authentication
  children.push(createHeading('5.2.2 Безопасная идентификация, аутентификация и авторизация', 3));

  children.push(createBodyParagraph('Идентификация пользователей осуществляется по уникальному электронному адресу (email). Каждый пользователь в системе имеет уникальный email, что гарантируется уникальным индексом в базе данных.'));

  children.push(createBodyParagraph('Аутентификация реализована с использованием Cookie Authentication в ASP.NET Core. Данный механизм был выбран по следующим причинам:'));

  children.push(createBulletItem('Безопасность cookie \u2014 используется HttpOnly cookie, что исключает доступ к токену сессии через JavaScript и защищает от XSS-атак. По сравнению с хранением JWT-токена в localStorage, HttpOnly cookie не доступен для вредоносных скриптов;'));
  children.push(createBulletItem('Автоматическое управление сессией \u2014 браузер автоматически отправляет cookie с каждым запросом, что упрощает клиентскую логику и снижает вероятность ошибок при работе с токенами;'));
  children.push(createBulletItem('Sliding expiration \u2014 при каждом запросе срок действия cookie продлевается (7 дней), обеспечивая удобство для пользователя без необходимости повторной авторизации;'));
  children.push(createBulletItem('SameSite=Lax \u2014 защита от CSRF-атак, так как cookie не отправляется при кросс-сайтовых POST-запросах.'));

  children.push(createBodyParagraph('Хеширование паролей реализовано с использованием алгоритма PBKDF2 с параметрами: SHA-256, 100 000 итераций, 16-байтовый salt, 32-байтовый ключ. Данный алгоритм выбран по следующим причинам:'));

  children.push(createBulletItem('PBKDF2 является стандартом (RFC 8018) и рекомендован NIST для хеширования паролей;'));
  children.push(createBulletItem('Высокое количество итераций (100 000) делает атаку перебором (brute force) вычислительно затратной;'));
  children.push(createBulletItem('Использование случайного salt для каждого пароля предотвращает атаки по радужным таблицам (rainbow tables);'));
  children.push(createBulletItem('По сравнению с bcrypt, PBKDF2 с SHA-256 имеет встроенную поддержку в .NET без дополнительных зависимостей;'));
  children.push(createBulletItem('По сравнению с простыми хеш-функциями (MD5, SHA-1), PBKDF2 устойчив к атакам перебором благодаря механизму ключевого расширения.'));

  children.push(createBodyParagraph('Авторизация реализована на основе claims, встроенных в аутентификационный cookie. Claims включают: идентификатор пользователя (NameIdentifier), email, имя и роль. При каждом запросе middleware ASP.NET Core автоматически извлекает claims из cookie и создаёт объект ClaimsPrincipal, используемый контроллерами для проверки прав доступа.'));

  children.push(createBodyParagraph('Для верификации email-адреса генерируется криптографически случайный токен (64 байта, закодированный в base64url) с ограничением срока действия 24 часа. Это предотвращает регистрацию с несуществующими email-адресами.'));

  // 5.2.3 Data protection
  children.push(createHeading('5.2.3 Безопасное хранение данных и резервное копирование', 3));

  children.push(createBodyParagraph('Безопасное хранение данных пользователей обеспечивает несколько механизмов:'));

  children.push(createNumberedItem('Хеширование паролей \u2014 пароли хранятся исключительно в хешированном виде. Формат хранения: {hex_salt}:{hex_hash}:{iterations}. Процедура верификации пароля извлекает salt и количество итераций из сохранённой строки и повторно вычисляет хеш для сравнения. Исходные пароли не хранятся и не могут быть восстановлены.', '1)'));
  children.push(createNumberedItem('Защита от SQL-инъекций \u2014 все операции с базой данных выполняются через Entity Framework Core, который использует параметризованные запросы. Это исключает возможность внедрения SQL-кода через пользовательский ввод.', '2)'));
  children.push(createNumberedItem('Валидация входных данных \u2014 на сервере применяется валидация данных с помощью атрибутов DataAnnotations в DTO-классах (обязательные поля, ограничения длины, формат email). На клиенте также реализована валидация форм перед отправкой запросов.', '3)'));
  children.push(createNumberedItem('Защита от XSS \u2014 React по умолчанию экранирует выводимый контент, предотвращая внедрение скриптов. Дополнительно используется HttpOnly cookie, недоступный для JavaScript, что исключает кражу сессии через XSS.', '4)'));
  children.push(createNumberedItem('CORS-политика \u2014 сервер допускает запросы только с разрешённых доменов (localhost:3000 для разработки с передачей учётных данных), что предотвращает несанкционированный доступ к API со сторонних сайтов.', '5)'));

  children.push(createBodyParagraph('Для резервного копирования рекомендуется:'));

  children.push(createBulletItem('Настройка регулярных резервных копий базы данных PostgreSQL с помощью утилиты pg_dump по расписанию (ежедневное полное резервное копирование);'));
  children.push(createBulletItem('Хранение резервных копий на отдельном сервере или в облачном хранилище с шифрованием;'));
  children.push(createBulletItem('Использование Docker volumes для обеспечения сохранности данных PostgreSQL при пересоздании контейнеров;'));
  children.push(createBulletItem('Резервное копирование пользовательских файлов (аватары, обложки, вложения) из директории /uploads.'));

  // 5.2.4 Code protection
  children.push(createHeading('5.2.4 Защита кода от неправомерного использования, копирования и взлома', 3));

  children.push(createBodyParagraph('Обфускация кода для данного проекта не проводилась, так как приложение развёртывается на сервере и его исходный код недоступен конечным пользователям. Клиентская часть (JavaScript-bundle) минифицируется при сборке для продакшена с помощью Vite, что делает код трудночитаемым, но основная бизнес-логика и данные находятся на серверной стороне, доступ к которой ограничен.'));

  children.push(createBodyParagraph('Серверная часть (C# / .NET) компилируется в промежуточный язык (IL), который не содержит исходного кода и может быть дополнительно защищён средствами обфускации .NET при необходимости. Однако в рамках данного проекта исходный код серверной части не передаётся клиентам и защищён серверной инфраструктурой.'));

  children.push(createBodyParagraph('Для защиты от неправомерного использования применяются следующие меры:'));

  children.push(createBulletItem('Минификация и объединение (bundling) клиентского кода при продакшен-сборке;'));
  children.push(createBulletItem('Отсутствие исходных карт (source maps) в продакшен-сборке;'));
  children.push(createBulletItem('Ограничение доступа к серверной инфраструктуре (замена стандартных портов, firewall);'));
  children.push(createBulletItem('Использование HTTPS для шифрования трафика между клиентом и сервером.'));

  // 5.2.5 Copyright
  children.push(createHeading('5.2.5 Защита авторского права', 3));

  children.push(createBodyParagraph('В приложении SYNQ в footer-области размещён знак защиты авторского права: \u00A9 2024 SYNQ. Все права защищены. Знак \u00A9 информирует пользователей о том, что материалы и программное обеспечение являются объектом авторского права.'));

  // 5.3 Recommendations
  children.push(createHeading('5.3 Рекомендации пользователям по безопасной работе с приложением', 2));

  children.push(createBodyParagraph('Для безопасной работы с приложением SYNQ пользователям рекомендуется соблюдать следующие правила:'));

  const securityRecs = [
    'Использовать сложные пароли, содержащие не менее 8 символов, включающие буквы в разных регистрах, цифры и специальные символы;',
    'Не передавать свои учётные данные третьим лицам;',
    'Использовать VPN-подключение при работе с приложением через открытые Wi-Fi-сети;',
    'Регулярно проверять активные сессии и завершать подозрительные;',
    'Не переходить по подозрительным ссылкам, полученным в чате приложения;',
    'Использовать актуальную версию браузера с включёнными обновлениями безопасности;',
    'При завершении работы выполнять выход из учётной записи (logout);',
    'При обнаружении подозрительной активности сообщать администрации через форму обратной связи;',
    'Использовать межсетевой экран (firewall) и антивирусное ПО на устройстве;',
    'Не хранить пароли в открытом виде в браузере на общедоступных устройствах.',
  ];
  securityRecs.forEach((r, i) => children.push(createNumberedItem(r, `${i + 1})`)));

  // ===== ЗАКЛЮЧЕНИЕ =====
  children.push(createPageBreak());
  children.push(createHeading('Заключение', 1, true));

  children.push(createBodyParagraph('В ходе выполнения дипломного проекта была разработана информационная система SYNQ \u2014 веб-приложение маркетплейса фриланс-услуг, обеспечивающее полный цикл взаимодействия между заказчиками и исполнителями.'));

  children.push(createBodyParagraph('Результаты работы:'));

  const conclusions = [
    'Проведён анализ предметной области и существующих аналогов;',
    'Сформулированы функциональные и нефункциональные требования к системе;',
    'Обоснован выбор стека технологий: React 18 (клиент), ASP.NET Core 8 (сервер), PostgreSQL (база данных);',
    'Спроектирована архитектура приложения, включающая клиентскую часть (SPA на React), серверную часть (REST API + SignalR) и реляционную базу данных;',
    'Реализованы все основные функции: регистрация и авторизация, создание и управление заданиями, подача предложений, обмен сообщениями, управление профилем, отзывы и публикации;',
    'Разработаны мероприятия по информационной безопасности: ролевое разграничение доступа, безопасная аутентификация (Cookie Authentication + PBKDF2), защита данных, CSRF-защита;',
    'Проведено ручное тестирование всех функциональных модулей.',
  ];
  conclusions.forEach(c => children.push(createNumberedItem(c, `${conclusions.indexOf(c) + 1})`)));

  children.push(createBodyParagraph('Практическая значимость работы заключается в создании функционального прототипа фриланс-маркетплейса, который может быть использован как основа для полноценной платформы. Разработанная система демонстрирует современный подход к созданию веб-приложений с использованием актуальных технологий и лучших практик разработки.'));

  children.push(createBodyParagraph('Предложения по совершенствованию программного продукта в дальнейшем:'));

  const improvements = [
    'Внедрение системы онлайн-оплаты и безопасной сделки (escrow);',
    'Добавление уведомлений в реальном времени (push-уведомления, email-рассылка);',
    'Интеграция полноценного SignalR-подключения для мгновенного обмена сообщениями без polling;',
    'Реализация системы модерации контента;',
    'Добавление системы рейтингов и верификации исполнителей;',
    'Расширение функционала чата (поддержка файлов, изображений);',
    'Внедрение автоматизированного тестирования (unit-тесты, интеграционные тесты);',
    'Оптимизация производительности (кеширование, пагинация, ленивая загрузка).',
  ];
  improvements.forEach(imp => children.push(createBulletItem(imp)));

  // ===== СПИСОК ИСТОЧНИКОВ =====
  children.push(createPageBreak());
  children.push(createHeading('Список источников', 1, true));

  children.push(createParagraph('Нормативная документация', { bold: true, alignment: AlignmentType.LEFT, spacing: { after: 80 }, indent: {} }));

  const normative = [
    'ГОСТ 34.602-2020 Информационные технологии. Комплекс стандартов на автоматизированные системы. Техническое задание на создание автоматизированной системы [Электронный ресурс] \u2014 https://protect.gost.ru/document1.aspx?control=31&id=241754',
    'ГОСТ 34.201-2020 Информационные технологии. Комплекс стандартов на автоматизированные системы. Виды, комплектность и обозначение документов при создании автоматизированных систем [Электронный ресурс] \u2014 https://protect.gost.ru/document1.aspx?control=31&id=241756',
    'ГОСТ Р ИСО/МЭК 25051-2017 Информационные технологии. Системная и программная инженерия. Требования и оценка качества систем и программного обеспечения (SQuaRE). Требования к качеству готового к использованию программного продукта (RUSP) и инструкции по тестированию [Электронный ресурс] \u2014 https://protect.gost.ru/document.aspx?control=7&id=217667',
  ];
  normative.forEach((n, i) => {
    children.push(createParagraph(`${i + 1}) ${n}`, { alignment: AlignmentType.JUSTIFIED, indent: { left: 706, hanging: 283 }, spacing: { line: LINE_SPACING, after: 60 } }));
  });

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  children.push(createParagraph('Учебная и методическая литература', { bold: true, alignment: AlignmentType.LEFT, spacing: { after: 80 }, indent: {} }));

  const literature = [
    'Флэнаган Д. JavaScript. Подробное руководство. 7-е издание. \u2014 СПб.: БХВ-Петербург, 2023. \u2014 704 с.',
    'Банкелл С. React в действии. \u2014 М.: ДМК Пресс, 2019. \u2014 312 с.',
    'Щербаков А.Ю. Информационная безопасность. Организационное и правовое обеспечение. \u2014 М.: Национальный Открытый Университет \u00ABИНТУИТ\u00BB, 2021. \u2014 320 с.',
  ];
  literature.forEach((l, i) => {
    children.push(createParagraph(`${i + 4}) ${l}`, { alignment: AlignmentType.JUSTIFIED, indent: { left: 706, hanging: 283 }, spacing: { line: LINE_SPACING, after: 60 } }));
  });

  children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  children.push(createParagraph('Интернет-ресурсы', { bold: true, alignment: AlignmentType.LEFT, spacing: { after: 80 }, indent: {} }));

  const internet = [
    'Upwork. Freelance Trends Report 2023 [Электронный ресурс] \u2014 https://www.upwork.com/research/freelance-forward',
    'FL.ru \u2014 биржа фриланс-услуг [Электронный ресурс] \u2014 https://www.fl.ru',
    'Kwork.ru \u2014 магазин фриланс-услуг [Электронный ресурс] \u2014 https://kwork.ru',
    'Upwork \u2014 международная платформа фриланс-услуг [Электронный ресурс] \u2014 https://www.upwork.com',
    'Fiverr \u2014 международная платформа фриланс-услуг [Электронный ресурс] \u2014 https://www.fiverr.com',
    'ASP.NET Core Documentation [Электронный ресурс] \u2014 https://learn.microsoft.com/aspnet/core',
    'React Documentation [Электронный ресурс] \u2014 https://react.dev',
    'PostgreSQL Documentation [Электронный ресурс] \u2014 https://www.postgresql.org/docs',
  ];
  internet.forEach((r, i) => {
    children.push(createParagraph(`${i + 7}) ${r}`, { alignment: AlignmentType.JUSTIFIED, indent: { left: 706, hanging: 283 }, spacing: { line: LINE_SPACING, after: 60 } }));
  });

  // ===== ПРИЛОЖЕНИЕ А =====
  children.push(createPageBreak());
  children.push(createHeading('Приложение А', 1, true));

  children.push(createParagraph('Листинг ключевых модулей серверной части', { bold: true, alignment: AlignmentType.CENTER, spacing: { after: 200 }, indent: {} }));

  children.push(createBodyParagraph('Фрагменты кода приведены в ознакомительных целях. Полный исходный код доступен в репозитории проекта.'));

  children.push(createParagraph('Контроллер аутентификации (AuthController.cs)', { bold: true, spacing: { before: 200, after: 60 }, indent: {} }));
  children.push(createParagraph('[ЗАМЕЧАНИЕ: Вставить листинг контроллера аутентификации]', { italic: true, indent: {} }));

  children.push(createParagraph('Сервис аутентификации (AuthService.cs)', { bold: true, spacing: { before: 200, after: 60 }, indent: {} }));
  children.push(createParagraph('[ЗАМЕЧАНИЕ: Вставить листинг сервиса аутентификации]', { italic: true, indent: {} }));

  children.push(createParagraph('Конфигурация приложения (Program.cs)', { bold: true, spacing: { before: 200, after: 60 }, indent: {} }));
  children.push(createParagraph('[ЗАМЕЧАНИЕ: Вставить листинг Program.cs]', { italic: true, indent: {} }));

  // ===== BUILD DOCUMENT =====
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: FONT_SIZE_BODY,
            font: FONT,
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
          },
        },
        heading1: {
          run: {
            size: FONT_SIZE_HEADING,
            bold: true,
            font: FONT,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
            alignment: AlignmentType.CENTER,
          },
        },
        heading2: {
          run: {
            size: FONT_SIZE_HEADING,
            bold: true,
            font: FONT,
          },
          paragraph: {
            spacing: { before: 200, after: 120 },
          },
        },
        heading3: {
          run: {
            size: FONT_SIZE_SUBHEADING,
            bold: true,
            font: FONT,
          },
          paragraph: {
            spacing: { before: 160, after: 80 },
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.79),    // ~20mm
            bottom: convertInchesToTwip(0.59),  // ~15mm
            right: convertInchesToTwip(0.39),   // ~10mm
            left: convertInchesToTwip(0.98),    // ~25mm
          },
        },
      },
      children: children,
    }],
    numbering: {
      config: [],
    },
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(ASSETS_DIR, 'Пояснительная_записка_SYNQ.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document generated: ${outputPath}`);
}

buildDocument().catch(err => {
  console.error('Error generating document:', err);
  process.exit(1);
});
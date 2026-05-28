const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, PageBreak, Header, Footer, PageNumber, BorderStyle,
  WidthType, convertMillimetersToTwip, LineRuleType, TabStopPosition, TabStopType,
  SectionType, ShadingType, VerticalAlign, TableLayoutType, LeaderType,
  TableOfContents, VerticalMergeType } = require('docx');
const puppeteer = require('puppeteer');

const ASSETS_DIR = path.join(__dirname, 'explanatory_note_assets');
const OUTPUT_DOCX = path.join(__dirname, 'Пояснительная_записка_Synq.docx');

// Font constants
const FONT = 'Times New Roman';
const FONT_SIZE_BODY = 24; // 12pt in half-points
const FONT_SIZE_HEADER = 28; // 14pt in half-points
const FONT_SIZE_TITLE = 28; // 14pt
const FONT_SIZE_CAPTION = 22; // 11pt for captions
const LINE_SPACING = 276; // 1.15 * 240

// Margins in mm
const MARGIN_TOP = convertMillimetersToTwip(20);
const MARGIN_BOTTOM = convertMillimetersToTwip(15);
const MARGIN_LEFT = convertMillimetersToTwip(25);
const MARGIN_RIGHT = convertMillimetersToTwip(10);
const PARAGRAPH_INDENT = convertMillimetersToTwip(12.5);

// Mermaid diagrams
const MERMAID_DIAGRAMS = [
  {
    id: 'arch',
    caption: 'Рисунок 2.1 — Архитектура системы Synq',
    code: `graph TB
    subgraph Frontend["Клиентская часть (React SPA)"]
        UI["Пользовательский интерфейс<br/>React 18 + TailwindCSS"]
        State["Управление состоянием<br/>Context + useReducer"]
        APIClient["API-клиент<br/>Axios + SignalR"]
    end
    subgraph Backend["Серверная часть (.NET 8)"]
        WebApi["Слой представления<br/>Controllers + SignalR Hub"]
        Application["Слой прикладной логики<br/>Сервисы + Валидация"]
        Domain["Слой домена<br/>Сущности + Правила"]
        Infrastructure["Слой инфраструктуры<br/>EF Core + Файловая система"]
    end
    subgraph Data["Слой данных"]
        PG["PostgreSQL 16"]
        Files["Файловое хранилище<br/>/uploads"]
    end
    UI --> State
    State --> APIClient
    APIClient -->|"HTTP REST"| WebApi
    APIClient -->|"WebSocket"| WebApi
    WebApi --> Application
    Application --> Domain
    Infrastructure --> Domain
    Infrastructure --> PG
    Infrastructure --> Files
    Application -.->|"Инверсия зависимостей"| Infrastructure`
  },
  {
    id: 'usecase',
    caption: 'Рисунок 2.2 — Диаграмма прецедентов',
    code: `graph LR
    Client((Заказчик)) --> C1[Регистрация/Авторизация]
    Client --> C2[Создание заказа]
    Client --> C3[Редактирование заказа]
    Client --> C4[Просмотр предложений]
    Client --> C5[Принятие/отклонение предложения]
    Client --> C6[Обмен сообщениями]
    Client --> C7[Оставление отзывов]
    Client --> C8[Управление профилем]
    Freelancer((Исполнитель)) --> F1[Регистрация/Авторизация]
    Freelancer --> F2[Поиск заказов]
    Freelancer --> F3[Подача предложения]
    Freelancer --> F4[Отзыв предложения]
    Freelancer --> F5[Обмен сообщениями]
    Freelancer --> F6[Управление профилем]
    Freelancer --> F7[Публикация постов]
    Freelancer --> F8[Оставление отзывов]`
  },
  {
    id: 'sequence',
    caption: 'Рисунок 2.3 — Диаграмма последовательности основного бизнес-процесса',
    code: `sequenceDiagram
    participant З as Заказчик
    participant С as Система
    participant И as Исполнитель
    З->>С: Регистрация (роль: Заказчик)
    И->>С: Регистрация (роль: Исполнитель)
    З->>С: Создание заказа
    С->>И: Уведомление о новом заказе
    И->>С: Подача предложения
    С->>З: Уведомление о предложении
    З->>С: Принятие предложения
    С->>И: Уведомление о принятии
    З->>С: Отправка сообщения
    С->>И: Передача сообщения (SignalR)
    И->>С: Ответное сообщение
    С->>З: Передача сообщения (SignalR)
    З->>С: Изменение статуса заказа
    З->>С: Оставление отзыва об исполнителе
    И->>С: Оставление отзыва о заказчике`
  },
  {
    id: 'flowchart',
    caption: 'Рисунок 2.4 — Блок-схема основного алгоритма обработки информации',
    code: `flowchart TD
    A[Начало] --> B[Регистрация пользователя]
    B --> C{Роль}
    C -->|Заказчик| D[Создание заказа]
    C -->|Исполнитель| E[Поиск заказов]
    D --> F[Ожидание предложений]
    E --> G[Подача предложения]
    F --> H[Выбор исполнителя]
    G --> I[Ожидание решения]
    H --> J[Обмен сообщениями]
    I -->|Принято| J
    I -->|Отклонено| K[Поиск новых заказов]
    J --> L[Выполнение работы]
    L --> M[Завершение заказа]
    M --> N[Обмен отзывами]
    N --> O[Конец]`
  },
  {
    id: 'er',
    caption: 'Рисунок 2.5 — Диаграмма базы данных',
    code: `erDiagram
    Users ||--o{ Jobs : creates
    Users ||--o{ Proposals : submits
    Users ||--o{ Posts : publishes
    Users ||--o{ Reviews : receives
    Users ||--o{ Reviews : writes
    Users ||--o{ Chats : participates
    Categories ||--o{ Jobs : contains
    Jobs ||--o{ Proposals : has
    Jobs ||--o{ JobSkills : requires
    Jobs ||--o{ Chats : linked_to
    Skills ||--o{ JobSkills : included_in
    Skills ||--o{ ProposalSkills : specified_in
    Proposals ||--o{ ProposalSkills : requires
    Chats ||--o{ Messages : contains
    Users {
        guid Id PK
        string Email UK
        string PasswordHash
        string Name
        string Role
        string AvatarUrl
        string Bio
        decimal Rating
    }
    Jobs {
        guid Id PK
        string Title
        string Description
        guid CategoryId FK
        guid ClientId FK
        decimal BudgetMin
        decimal BudgetMax
        string Status
    }
    Proposals {
        guid Id PK
        guid JobId FK
        guid UserId FK
        decimal Price
        string CoverLetter
        string Status
    }
    Categories {
        guid Id PK
        string Name
        string Slug UK
    }
    Chats {
        guid Id PK
        guid UserId FK
        guid ParticipantId FK
        string LastMessage
    }
    Messages {
        guid Id PK
        guid ChatId FK
        guid SenderId FK
        string Text
    }
    Posts {
        guid Id PK
        guid UserId FK
        string Title
        string Content
    }
    Reviews {
        guid Id PK
        guid UserId FK
        guid AuthorId FK
        int Rating
        string Text
    }`
  },
  {
    id: 'classes',
    caption: 'Рисунок 3.1 — Диаграмма классов основных сервисов приложения',
    code: `classDiagram
    class AuthService {
        +Register(dto) Task~AuthResult~
        +Login(dto) Task~AuthResult~
        +Logout() Task
        +GetCurrentUser() Task~User~
        +VerifyEmail(token) Task
    }
    class JobService {
        +CreateJob(dto) Task~Job~
        +GetJobs(filters) Task~PagedResult~
        +GetJobById(id) Task~Job~
        +UpdateJob(id, dto) Task~Job~
        +DeleteJob(id) Task
        +UpdateJobStatus(id, status) Task
    }
    class ProposalService {
        +CreateProposal(jobId, dto) Task~Proposal~
        +GetProposalsByJob(jobId) Task~List~
        +UpdateProposalStatus(id, status) Task
        +WithdrawProposal(id) Task
    }
    class ChatService {
        +CreateChat(dto) Task~Chat~
        +GetUserChats(userId) Task~List~
        +GetMessages(chatId) Task~PagedResult~
        +SendMessage(chatId, text) Task~Message~
    }
    class UserService {
        +GetProfile(id) Task~User~
        +UpdateProfile(id, dto) Task~User~
        +UploadAvatar(id, file) Task
        +GetFreelancers(filters) Task~PagedResult~
    }
    class ReviewService {
        +CreateReview(dto) Task~Review~
        +GetUserReviews(userId) Task~List~
    }`
  }
];

// Helper functions
function bodyText(text, opts = {}) {
  const { bold = false, italic = false, size = FONT_SIZE_BODY, alignment = AlignmentType.BOTH } = opts;
  return new Paragraph({
    alignment,
    spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    indent: opts.noIndent ? {} : { firstLine: PARAGRAPH_INDENT },
    children: [
      new TextRun({ text, bold, italics: italic, font: FONT, size, locale: { languageId: 'ru-RU' } })
    ]
  });
}

function headerParagraph(text, level = 1, alignment = AlignmentType.START) {
  const isSectionTitle = ['Введение', 'Заключение', 'Список источников', 'Приложение А'].includes(text);
  const finalAlignment = isSectionTitle ? AlignmentType.CENTER : alignment;

  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: finalAlignment,
    spacing: { before: 240, after: 120, line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({
        text: text,
        bold: true,
        font: FONT,
        size: FONT_SIZE_HEADER,
        locale: { languageId: 'ru-RU' }
      })
    ]
  });
}

function subHeader(text, alignment = AlignmentType.START) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment,
    spacing: { before: 200, after: 60, line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    indent: { firstLine: PARAGRAPH_INDENT },
    children: [
      new TextRun({
        text,
        bold: true,
        font: FONT,
        size: FONT_SIZE_HEADER,
        locale: { languageId: 'ru-RU' }
      })
    ]
  });
}

function subSubHeader(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.START,
    spacing: { before: 160, after: 60, line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    indent: { firstLine: PARAGRAPH_INDENT },
    children: [
      new TextRun({
        text,
        bold: true,
        font: FONT,
        size: FONT_SIZE_BODY,
        locale: { languageId: 'ru-RU' }
      })
    ]
  });
}

function listItem(text, level = 0) {
  const prefix = level === 0 ? '— ' : level === 1 ? '  а) ' : '    1) ';
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    indent: level === 0
      ? { left: convertMillimetersToTwip(12.5), hanging: convertMillimetersToTwip(7) }
      : { left: convertMillimetersToTwip(25), hanging: convertMillimetersToTwip(7) },
    children: [
      new TextRun({ text: prefix, font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } }),
      new TextRun({ text: text.replace(/[.;]$/, ''), font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } }),
      new TextRun({ text: ';', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })
    ]
  });
}

function lastListItem(text, level = 0) {
  const prefix = level === 0 ? '— ' : level === 1 ? '  а) ' : '    1) ';
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    indent: level === 0
      ? { left: convertMillimetersToTwip(12.5), hanging: convertMillimetersToTwip(7) }
      : { left: convertMillimetersToTwip(25), hanging: convertMillimetersToTwip(7) },
    children: [
      new TextRun({ text: prefix, font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } }),
      new TextRun({ text: text.replace(/[.;]$/, ''), font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } }),
      new TextRun({ text: '.', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })
    ]
  });
}

function numberedItem(number, text) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    indent: { left: convertMillimetersToTwip(12.5), hanging: convertMillimetersToTwip(7) },
    children: [
      new TextRun({ text: `${number} `, font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } }),
      new TextRun({ text, font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })
    ]
  });
}

const TOC_RIGHT_POS = convertMillimetersToTwip(175);

function tocEntry(text, page, indent = 0) {
  const leftIndent = indent > 0 ? convertMillimetersToTwip(indent) : 0;
  return new Paragraph({
    alignment: AlignmentType.START,
    spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    indent: leftIndent > 0 ? { left: leftIndent } : {},
    tabStops: [{
      type: TabStopType.RIGHT,
      position: TOC_RIGHT_POS,
      leader: LeaderType.DOT
    }],
    children: [
      new TextRun({ text, font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } }),
      new TextRun({ text: '\t', font: FONT, size: FONT_SIZE_BODY }),
      new TextRun({ text: String(page), font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })
    ]
  });
}

function emptyParagraph() {
  return new Paragraph({
    spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    children: [new TextRun({ text: '', font: FONT, size: FONT_SIZE_BODY })]
  });
}

function captionParagraph(caption, isTable = false) {
  return new Paragraph({
    alignment: isTable ? AlignmentType.START : AlignmentType.CENTER,
    spacing: { before: 60, after: 120, line: LINE_SPACING, lineRule: LineRuleType.AUTO },
    children: [
      new TextRun({
        text: caption,
        font: FONT,
        size: FONT_SIZE_CAPTION,
        italics: false,
        locale: { languageId: 'ru-RU' }
      })
    ]
  });
}

function imageParagraph(imageBuffer, width, height, caption) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 0 },
      children: [new TextRun({ text: '', font: FONT, size: 2 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0, line: 240 * Math.ceil(height / 240), lineRule: LineRuleType.AT_LEAST },
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: { width, height },
          type: 'png'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: '', font: FONT, size: 2 })]
    }),
    captionParagraph(caption),
    new Paragraph({
      spacing: { before: 120, after: 0, line: LINE_SPACING, lineRule: LineRuleType.AUTO },
      children: [new TextRun({ text: '', font: FONT, size: 2 })]
    })
  ];
}

function pageBreakParagraph() {
  return new Paragraph({
    children: [new PageBreak()]
  });
}

function makeTableCell(text, isHeader = false, width = undefined, extraOpts = {}) {
  const opts = {
    children: [
      new Paragraph({
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.START,
        spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({
            text,
            bold: isHeader,
            font: FONT,
            size: isHeader ? FONT_SIZE_CAPTION : FONT_SIZE_BODY - 2,
            locale: { languageId: 'ru-RU' }
          })
        ]
      })
    ],
    verticalAlign: VerticalAlign.CENTER,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 }
    }
  };
  if (width) opts.width = { size: width, type: WidthType.DXA };
  if (isHeader) opts.shading = { type: ShadingType.CLEAR, fill: 'E8E8E8' };
  if (extraOpts.verticalMerge) opts.verticalMerge = extraOpts.verticalMerge;
  return new TableCell(opts);
}

function makeDbTable(fields) {
  const rows = [
    new TableRow({
      children: [
        makeTableCell('Поле', true, 2500),
        makeTableCell('Тип данных', true, 2500),
        makeTableCell('Описание', true, 4000),
      ]
    }),
    ...fields.map(([field, type, desc]) =>
      new TableRow({
        children: [
          makeTableCell(field, false, 2500),
          makeTableCell(type, false, 2500),
          makeTableCell(desc, false, 4000),
        ]
      })
    )
  ];
  return new Table({ width: { size: 9000, type: WidthType.DXA }, rows });
}

// Render mermaid diagrams to PNG
async function renderMermaidDiagrams() {
  console.log('Launching browser for mermaid rendering...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const results = {};

  for (const diag of MERMAID_DIAGRAMS) {
    console.log(`Rendering diagram: ${diag.id}`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: white; }
    .mermaid { max-width: 1000px; }
  </style>
</head>
<body>
  <div class="mermaid">${diag.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'loose' });
  </script>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for mermaid to render
    await page.waitForSelector('.mermaid svg', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Save mermaid text file
    fs.writeFileSync(path.join(ASSETS_DIR, `diagram_${diag.id}.mmd`), diag.code, 'utf-8');

    // Take screenshot of the mermaid diagram
    const svgElement = await page.$('.mermaid');
    if (svgElement) {
      const pngBuffer = await svgElement.screenshot({ type: 'png', omitBackground: false });
      const pngPath = path.join(ASSETS_DIR, `diagram_${diag.id}.png`);
      fs.writeFileSync(pngPath, pngBuffer);
      results[diag.id] = pngBuffer;
      console.log(`  Saved: ${pngPath} (${pngBuffer.length} bytes)`);
    }

    await page.close();
  }

  await browser.close();
  return results;
}

// Build the document
async function buildDocument(diagramImages) {
  const doc = new Document({
    features: { updateFields: true },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE_BODY },
          paragraph: { spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO } }
        }
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT, size: FONT_SIZE_HEADER, bold: true },
          paragraph: { spacing: { before: 240, after: 120, line: LINE_SPACING, lineRule: LineRuleType.AUTO } }
        },
        {
          id: 'Heading2',
          name: 'heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT, size: FONT_SIZE_HEADER, bold: true },
          paragraph: { spacing: { before: 200, after: 60, line: LINE_SPACING, lineRule: LineRuleType.AUTO } }
        },
        {
          id: 'Heading3',
          name: 'heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: FONT, size: FONT_SIZE_BODY, bold: true },
          paragraph: { spacing: { before: 160, after: 60, line: LINE_SPACING, lineRule: LineRuleType.AUTO } }
        }
      ]
    },
    sections: [
      // SECTION 1: Title page (no page number)
      {
        properties: {
          page: {
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) }
          },
          titlePage: true
        },
        headers: {
          default: new Header({ children: [] }),
          first: new Header({ children: [] })
        },
        footers: {
          default: new Footer({ children: [] }),
          first: new Footer({ children: [] })
        },
        children: [
          emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: 'Правительство Санкт-Петербурга', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })]
          }),
          emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: 'Комитет по науке и высшей школе', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })]
          }),
          emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: 'Санкт-Петербургское государственное бюджетное', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: 'профессиональное образовательное учреждение', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })]
          }),
          emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: '«Политехнический колледж городского хозяйства»', font: FONT, size: FONT_SIZE_BODY, bold: true, locale: { languageId: 'ru-RU' } })]
          }),
          emptyParagraph(), emptyParagraph(), emptyParagraph(), emptyParagraph(),
          emptyParagraph(), emptyParagraph(), emptyParagraph(), emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: 'ДИПЛОМНЫЙ ПРОЕКТ', font: FONT, size: 32, bold: true, locale: { languageId: 'ru-RU' } })]
          }),
          emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: '_________________________________________', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })]
          }),
          emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: 'Пояснительная записка', font: FONT, size: FONT_SIZE_BODY, bold: true, locale: { languageId: 'ru-RU' } })]
          }),
          emptyParagraph(), emptyParagraph(), emptyParagraph(), emptyParagraph(),
          emptyParagraph(), emptyParagraph(), emptyParagraph(), emptyParagraph(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [new TextRun({ text: 'Листов ___', font: FONT, size: FONT_SIZE_BODY, locale: { languageId: 'ru-RU' } })]
          }),
        ]
      },

      // SECTION 2: Content (with page numbers)
      {
        properties: {
          page: {
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: FONT_SIZE_BODY })]
              })
            ]
          })
        },
        footers: {
          default: new Footer({ children: [] })
        },
        children: [
          // СОДЕРЖАНИЕ
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120, line: LINE_SPACING, lineRule: LineRuleType.AUTO },
            children: [
              new TextRun({
                text: 'СОДЕРЖАНИЕ',
                bold: true,
                font: FONT,
                size: FONT_SIZE_HEADER,
                locale: { languageId: 'ru-RU' }
              })
            ]
          }),
          emptyParagraph(),

          new TableOfContents('Содержание', {
            hyperlink: true,
            headingStyleRange: '1-3',
          }),

          pageBreakParagraph(),

          // ВВЕДЕНИЕ
          headerParagraph('Введение', 1, AlignmentType.CENTER),
          bodyText('Развитие цифровой экономики и рост удалённой занятости привели к значительному увеличению спроса на платформы, связывающие заказчиков и исполнителей. По данным исследований, мировой рынок фриланс-платформ к 2028 году достигнет объёма более 12 млрд долларов. В России также наблюдается устойчивый рост числа самозанятых и фрилансеров, что обуславливает актуальность разработки отечественных решений в данной области.'),
          bodyText('Существующие платформы — такие как Kwork, FL.ru и Хабр Фриланс — обладают рядом ограничений: закрытый исходный код, высокая комиссия, недостаточная адаптация интерфейса под мобильные устройства, отсутствие полноценного real-time общения между участниками. Эти недостатки снижают удобство пользователей и эффективность взаимодействия заказчиков с исполнителями.'),
          bodyText('Цель дипломного проекта — разработка информационной системы «Synq» — веб-приложения маркетплейса фриланс-услуг, обеспечивающего поиск и размещение заказов, подачу предложений, обмен сообщениями в реальном времени и управление профилями пользователей.'),
          bodyText('Для достижения поставленной цели определены следующие задачи:'),
          listItem('проанализировать предметную область и существующие аналоги;'),
          listItem('сформулировать функциональные и нефункциональные требования к системе;'),
          listItem('спроектировать архитектуру, модель базы данных и пользовательские интерфейсы;'),
          listItem('реализовать клиентскую часть приложения с использованием React;'),
          listItem('реализовать серверную часть с использованием ASP.NET Core;'),
          listItem('разработать систему real-time обмена сообщениями на основе SignalR;'),
          listItem('обеспечить информационную безопасность приложения;'),
          lastListItem('провести тестирование разработанного решения.'),

          pageBreakParagraph(),

          // РАЗДЕЛ 1
          headerParagraph('1 Анализ предметной области'),
          subHeader('1.1 Описание предметной области'),
          bodyText('Предметная область проекта охватывает сферу фриланс-услуг — сегмент экономики, в котором заказчики формируют задания (проекты), а исполнители (фрилансеры) откликаются на них, предлагая свои условия выполнения. Взаимодействие сторон включает подбор исполнителя, согласование условий, обмен сообщениями, контроль выполнения и формирование отзывов.'),
          bodyText('Основные бизнес-процессы предметной области:'),
          listItem('регистрация пользователей с разделением на роли «Заказчик» и «Исполнитель»;'),
          listItem('создание и публикация заказов (заданий) с указанием категории, бюджета, сроков и требуемых навыков;'),
          listItem('поиск и фильтрация заказов исполнителями по различным критериям;'),
          listItem('подача предложений (откликов) на заказы с указанием цены, сроков и сопроводительного письма;'),
          listItem('обмен сообщениями между заказчиком и исполнителем в реальном времени;'),
          listItem('управление профилем: портфолио, опыт, навыки, часовая ставка;'),
          listItem('формирование отзывов и рейтингов по итогам сотрудничества;'),
          lastListItem('категоризация заказов по направлениям деятельности.'),
          bodyText('Структура взаимодействия участников включает две основные роли. Заказчик создаёт заказ, рассматривает предложения, выбирает исполнителя и коммуницирует с ним. Исполнитель ищет заказы, подаёт предложения, выполняет работу и получает отзывы. Система выступает посредником, обеспечивая удобный интерфейс для всех операций.'),

          subHeader('1.2 Обзор аналогов'),
          bodyText('Для анализа были выбраны следующие существующие решения: Kwork, FL.ru и Хабр Фриланс.'),
          bodyText('Kwork — сервис, ориентированный на оказание услуг по фиксированной цене. Заказчик выбирает услугу из каталога кворков, предложенных исполнителями. Преимущества: простой интерфейс, гарантия безопасности сделок, широкий каталог услуг. Недостатки: формат кворков не позволяет размещать индивидуальные заказы с произвольными условиями; высокая комиссия сервиса (до 20%); ограниченные возможности real-time коммуникации; отсутствие системы рейтингов и отзывов с детализацией по проектам.'),
          bodyText('FL.ru — одна из старейших фриланс-платформ в российском сегменте. Предлагает размещение проектов и конкурсный выбор исполнителя. Преимущества: большая база исполнителей, система портфолио и рейтингов, встроенный сервис «Безопасная сделка». Недостатки: устаревший дизайн интерфейса, отсутствие мобильной адаптации, платная регистрация для исполнителей, отсутствие мгновенного обмена сообщениями.'),
          bodyText('Хабр Фриланс — сервис, интегрированный в экосистему Хабра. Предназначен для IT-специалистов. Преимущества: целевая аудитория IT-проектов, интеграция с профилем Хабра. Недостатки: ограниченная категория проектов (преимущественно IT), отсутствие встроенного мессенджера, ограниченные функции управления заказами.'),
          bodyText('Анализ выявил следующие пробелы в существующих решениях:'),
          listItem('отсутствие полноценного обмена сообщениями в реальном времени;'),
          listItem('недостаточная адаптивность интерфейсов для мобильных устройств;'),
          listItem('высокие комиссии и ограничения для пользователей;'),
          lastListItem('отсутствие удобной системы фильтрации и поиска заказов по множеству критериев.'),
          bodyText('Разрабатываемая система Synq направлена на устранение данных недостатков.'),

          subHeader('1.3 Требования к разрабатываемой ИС'),
          subSubHeader('Функциональные требования'),
          bodyText('Система должна обеспечивать выполнение следующих функций:'),
          listItem('регистрация и аутентификация пользователей с разделением на роли «Заказчик» и «Исполнитель»;'),
          listItem('создание, редактирование и удаление заказов (заданий) с указанием категории, бюджета, сроков, навыков и вложений;'),
          listItem('просмотр каталога заказов с возможностью поиска по тексту, фильтрации по категории, бюджету и сортировки;'),
          listItem('подача предложений (откликов) на заказы с указанием цены, сроков и сопроводительного письма;'),
          listItem('управление статусами предложений: ожидание, принятие, отклонение, отзыв;'),
          listItem('обмен сообщениями между пользователями в реальном времени (WebSocket);'),
          listItem('создание и управление чатами, привязанными к заказу;'),
          listItem('просмотр и редактирование профиля пользователя: аватар, обложка, биография, навыки, опыт, портфолио;'),
          listItem('публикация постов (статей, кейс-стади) в профиле исполнителя;'),
          listItem('система отзывов и рейтингов;'),
          listItem('управление статусами заказов: открыт, в работе, завершён, отменён;'),
          listItem('просмотр каталога категорий с количеством заказов;'),
          lastListItem('верификация email-адреса.'),

          subSubHeader('Требования к интерфейсу'),
          bodyText('Графический интерфейс системы должен отвечать следующим требованиям:'),
          listItem('адаптивный дизайн, обеспечивающий корректное отображение на мобильных устройствах, планшетах и настольных компьютерах;'),
          listItem('минималистичный дизайн с интуитивной навигацией;'),
          listItem('применение стилистики glassmorphism для визуального оформления элементов;'),
          listItem('использование анимаций переходов между страницами для улучшения пользовательского опыта;'),
          listItem('поддержка русского языка во всех элементах интерфейса;'),
          listItem('информативные карточки заказов, предложений и профилей;'),
          lastListItem('модальные окна для детального просмотра информации.'),

          subHeader('1.4 Обоснование выбора стека технологий'),
          subSubHeader('Языки программирования'),
          bodyText('JavaScript (ES6+) — выбран в качестве основного языка разработки клиентской части приложения. JavaScript является стандартом де-факто для веб-разработки, обладает широкой экосистемой библиотек и компонентов, поддерживается всеми современными браузерами. Применение современных возможностей ECMAScript (стрелочные функции, деструктуризация, async/await, модули) значительно повышает читаемость и поддерживаемость кода.'),
          bodyText('C# — выбран для серверной части. C# является статически типизированным языком с развитой системой типов, LINQ-запросами и встроенной поддержкой асинхронного программирования. В сочетании с платформой .NET 8 обеспечивает высокую производительность, безопасность типов и эффективную разработку enterprise-уровня.'),

          subSubHeader('Фреймворки'),
          bodyText('React 18 — выбран для реализации пользовательского интерфейса. React обеспечивает компонентный подход к разработке, виртуальный DOM для эффективного рендеринга, богатую экосистему библиотек и широкое сообщество разработчиков. Версия 18 добавляет поддержку Concurrent Features и автоматическую batching-оптимизацию, что улучшает производительность приложения.'),
          bodyText('ASP.NET Core 8 — выбран для серверной части. Фреймворк обеспечивает высокую производительность, встроенную поддержку dependency injection, промежуточных обработчиков (middleware) и кроссплатформенность. Clean Architecture позволяет разделить логику на слои Domain, Application, Infrastructure и WebApi, что обеспечивает тестируемость и поддерживаемость кода.'),

          subSubHeader('Система управления базами данных'),
          bodyText('PostgreSQL 16 — выбрана в качестве СУБД. PostgreSQL является мощной объектно-реляционной СУБД с открытым исходным кодом, которая поддерживает расширенные типы данных (JSONB, UUID, массивы), полнотекстовый поиск, сложные запросы и транзакции с ACID-гарантиями. По сравнению с MySQL, PostgreSQL предоставляет более строгую систему типов, лучшую поддержку сложных запросов и расширяемость. Выбор PostgreSQL для данного проекта обусловлен необходимостью хранения структурированных данных пользователей, заказов и сообщений, а также требованиями к целостности данных.'),

          subSubHeader('Дополнительные технологии'),
          bodyText('SignalR — библиотека реального времени от Microsoft, выбрана для реализации мгновенного обмена сообщениями. SignalR автоматически выбирает оптимальный транспорт (WebSocket, Server-Sent Events, Long Polling) и обеспечивает автоматическое переподключение, что делает взаимодействие надёжным.'),
          bodyText('Entity Framework Core — ORM для работы с базой данных, обеспечивающий миграции, LINQ-запросы и отложенную загрузку. Позволяет работать с базой данных через объектно-ориентированную парадигму.'),
          bodyText('TailwindCSS — утилитарный CSS-фреймворк, обеспечивающий быструю разработку интерфейсов за счёт готовых CSS-классов. Позволяет создавать адаптивные интерфейсы без написания кастомного CSS, что ускоряет разработку и поддерживает единообразие стилей.'),
          bodyText('Vite — инструмент сборки нового поколения с быстрой горячей перезагрузкой (HMR) и оптимизированной сборкой на основе Rollup. По сравнению с Webpack, Vite обеспечивает значительно более быструю разработку и сборку проекта.'),
          bodyText('Docker — платформа контейнеризации, обеспечивающая изолированное и воспроизводимое развёртывание всех компонентов системы. Docker Compose позволяет описать многоконтейнерное приложение в одном файле конфигурации, что упрощает развёртывание и масштабирование.'),

          pageBreakParagraph(),

          // РАЗДЕЛ 2
          headerParagraph('2 Проектирование'),
          subHeader('2.1 Проектирование системы'),
          bodyText('Проектирование системы основано на архитектурном паттерне Clean Architecture, который разделяет приложение на концентрические слои с зависимостями, направленными внутрь. Данный паттерн обеспечивает слабую связность компонентов, высокую тестируемость и возможность замены инфраструктурных компонентов без изменения бизнес-логики.'),
          bodyText('Архитектура системы включает следующие слои:'),
          listItem('WebApi — слой представления (контроллеры, SignalR-хабы), обрабатывающий HTTP-запросы и возвращающий данные клиенту;'),
          listItem('Application — слой прикладной логики (сервисы, интерфейсы репозиториев, DTO, валидация);'),
          listItem('Domain — слой бизнес-логики (сущности, перечисления, правила предметной области);'),
          lastListItem('Infrastructure — слой инфраструктуры (реализация репозиториев через EF Core, работа с файловой системой, отправка email).'),
          bodyText('Архитектура системы представлена на рисунке 2.1.'),

          // Diagram 2.1 - Architecture
          ...(diagramImages.arch ? imageParagraph(diagramImages.arch, 380, 266, 'Рисунок 2.1 — Архитектура системы Synq') : [bodyText('[Диаграмма: Архитектура системы Synq]')]),

          subSubHeader('Определение групп пользователей'),
          bodyText('Система предусматривает две основные группы пользователей:'),
          bodyText('Заказчик (Client) — пользователь, создающий заказы на выполнение работ. Функции: регистрация и авторизация, создание и редактирование заказов, просмотр предложений исполнителей, принятие или отклонение предложений, обмен сообщениями с исполнителями, оставление отзывов, управление профилем.'),
          bodyText('Исполнитель (Freelancer) — пользователь, выполняющий заказы. Функции: регистрация и авторизация, просмотр каталога заказов с фильтрацией и поиском, подача предложений на заказы, обмен сообщениями с заказчиками, управление профилем (портфолио, навыки, опыт), публикация постов, оставление отзывов.'),
          bodyText('Диаграмма прецедентов представлена на рисунке 2.2.'),

          // Diagram 2.2 - Use cases
          ...(diagramImages.usecase ? imageParagraph(diagramImages.usecase, 380, 228, 'Рисунок 2.2 — Диаграмма прецедентов') : [bodyText('[Диаграмма: Диаграмма прецедентов]')]),

          subSubHeader('Функциональное моделирование'),
          bodyText('Разработана архитектура системы на основе модульного подхода. Ключевые модули и их взаимодействие:'),
          bodyText('Модуль аутентификации — обеспечивает регистрацию, вход, выход, верификацию email. Взаимодействует с модулем пользователей через общую сущность User.'),
          bodyText('Модуль заказов — обеспечивает CRUD-операции с заказами, управление статусами, фильтрацию и поиск. Взаимодействует с модулями категорий (для привязки заказа к категории), предложений (для связи заказа с откликами) и пользователей (для связи заказа с автором).'),
          bodyText('Модуль предложений — обеспечивает создание, просмотр, изменение статуса и отзыв предложений. Взаимодействует с модулями заказов и пользователей.'),
          bodyText('Модуль сообщений — обеспечивает создание чатов, отправку и получение сообщений, уведомления о прочтении и набор текста. Реализован на основе SignalR: постоянное соединение с хабом ChatHub обеспечивает мгновенную доставку сообщений и событий, REST API используется для первоначальной загрузки данных.'),
          bodyText('Модуль пользователей — обеспечивает управление профилями, загрузку аватаров и обложек, просмотр профилей исполнителей. Взаимодействует со всеми модулями через сущность User.'),
          bodyText('Модуль отзывов — обеспечивает создание и просмотр отзывов о пользователях с рейтингом.'),
          bodyText('Диаграмма последовательности основного бизнес-процесса представлена на рисунке 2.3.'),

          // Diagram 2.3 - Sequence
          ...(diagramImages.sequence ? imageParagraph(diagramImages.sequence, 380, 266, 'Рисунок 2.3 — Диаграмма последовательности основного бизнес-процесса') : [bodyText('[Диаграмма: Диаграмма последовательности]')]),

          bodyText('Блок-схема основного алгоритма обработки информации представлена на рисунке 2.4.'),

          // Diagram 2.4 - Flowchart
          ...(diagramImages.flowchart ? imageParagraph(diagramImages.flowchart, 300, 340, 'Рисунок 2.4 — Блок-схема основного алгоритма обработки информации') : [bodyText('[Диаграмма: Блок-схема алгоритма]')]),

          subHeader('2.2 Разработка модели базы данных'),
          bodyText('Модель базы данных разработана на основе анализа предметной области и включает следующие основные таблицы.'),
          bodyText('Структура таблицы Users представлена в таблице 2.1.'),

          captionParagraph('Таблица 2.1 — Структура таблицы Users', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['Email', 'VARCHAR(256)', 'Email-адрес (уникальный)'],
            ['PasswordHash', 'TEXT', 'Хеш пароля'],
            ['Name', 'VARCHAR(128)', 'Имя пользователя'],
            ['Role', 'VARCHAR(32)', 'Роль (Client/Freelancer)'],
            ['AvatarUrl', 'TEXT', 'URL аватара'],
            ['CoverUrl', 'TEXT', 'URL обложки профиля'],
            ['Bio', 'TEXT', 'Биография'],
            ['Location', 'VARCHAR(256)', 'Местоположение'],
            ['YearsOfExperience', 'INTEGER', 'Опыт работы (лет)'],
            ['HourlyRate', 'DECIMAL', 'Почасовая ставка'],
            ['PortfolioUrl', 'TEXT', 'URL портфолио'],
            ['IsVerified', 'BOOLEAN', 'Email подтверждён'],
            ['Rating', 'DECIMAL', 'Средний рейтинг'],
            ['ReviewsCount', 'INTEGER', 'Количество отзывов'],
            ['CompletedJobs', 'INTEGER', 'Завершённых заказов'],
            ['CreatedAt', 'TIMESTAMP', 'Дата создания'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Categories представлена в таблице 2.2.'),
          captionParagraph('Таблица 2.2 — Структура таблицы Categories', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['Name', 'VARCHAR(128)', 'Название категории'],
            ['Slug', 'VARCHAR(128)', 'URL-идентификатор (уникальный)'],
            ['Icon', 'VARCHAR(64)', 'Иконка категории'],
            ['Description', 'TEXT', 'Описание категории'],
            ['ImageUrl', 'TEXT', 'URL изображения'],
            ['Color', 'VARCHAR(32)', 'Цвет категории'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Jobs представлена в таблице 2.3.'),
          captionParagraph('Таблица 2.3 — Структура таблицы Jobs', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['Title', 'VARCHAR(256)', 'Название заказа'],
            ['Description', 'TEXT', 'Описание заказа'],
            ['CategoryId', 'GUID', 'Внешний ключ на Categories'],
            ['BudgetMin', 'DECIMAL', 'Минимальный бюджет'],
            ['BudgetMax', 'DECIMAL', 'Максимальный бюджет'],
            ['BudgetType', 'VARCHAR(32)', 'Тип бюджета (Fixed/Hourly)'],
            ['Deadline', 'TIMESTAMP', 'Срок выполнения'],
            ['IsUrgent', 'BOOLEAN', 'Срочный заказ'],
            ['Status', 'VARCHAR(32)', 'Статус (Open/InProgress/Completed/Cancelled)'],
            ['ClientId', 'GUID', 'Внешний ключ на Users (заказчик)'],
            ['CreatedAt', 'TIMESTAMP', 'Дата создания'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Skills представлена в таблице 2.4.'),
          captionParagraph('Таблица 2.4 — Структура таблицы Skills', true),
          makeDbTable([
            ['Name', 'VARCHAR(128)', 'Название навыка (первичный ключ)'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы JobSkills представлена в таблице 2.5.'),
          captionParagraph('Таблица 2.5 — Структура таблицы JobSkills', true),
          makeDbTable([
            ['JobId', 'GUID', 'Внешний ключ на Jobs (составной PK)'],
            ['SkillName', 'VARCHAR(128)', 'Внешний ключ на Skills (составной PK)'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Proposals представлена в таблице 2.6.'),
          captionParagraph('Таблица 2.6 — Структура таблицы Proposals', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['JobId', 'GUID', 'Внешний ключ на Jobs'],
            ['UserId', 'GUID', 'Внешний ключ на Users (исполнитель)'],
            ['Price', 'DECIMAL', 'Предлагаемая цена'],
            ['DeadlineDays', 'INTEGER', 'Срок выполнения (дней)'],
            ['CoverLetter', 'TEXT', 'Сопроводительное письмо'],
            ['Status', 'VARCHAR(32)', 'Статус (Pending/Accepted/Rejected/Withdrawn)'],
            ['CreatedAt', 'TIMESTAMP', 'Дата создания'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Chats представлена в таблице 2.7.'),
          captionParagraph('Таблица 2.7 — Структура таблицы Chats', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['UserId', 'GUID', 'Внешний ключ на Users (инициатор)'],
            ['ParticipantId', 'GUID', 'Внешний ключ на Users (участник)'],
            ['JobId', 'GUID', 'Внешний ключ на Jobs (nullable)'],
            ['LastMessage', 'TEXT', 'Последнее сообщение'],
            ['LastMessageAt', 'TIMESTAMP', 'Время последнего сообщения'],
            ['UnreadCount', 'INTEGER', 'Количество непрочитанных'],
            ['IsLeftByUser', 'BOOLEAN', 'Покинут инициатором'],
            ['IsLeftByParticipant', 'BOOLEAN', 'Покинут участником'],
            ['CreatedAt', 'TIMESTAMP', 'Дата создания'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Messages представлена в таблице 2.8.'),
          captionParagraph('Таблица 2.8 — Структура таблицы Messages', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['ChatId', 'GUID', 'Внешний ключ на Chats'],
            ['SenderId', 'GUID', 'Внешний ключ на Users (отправитель)'],
            ['Text', 'TEXT', 'Текст сообщения'],
            ['CreatedAt', 'TIMESTAMP', 'Дата отправки'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Posts представлена в таблице 2.9.'),
          captionParagraph('Таблица 2.9 — Структура таблицы Posts', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['UserId', 'GUID', 'Внешний ключ на Users (автор)'],
            ['Title', 'VARCHAR(256)', 'Заголовок публикации'],
            ['Content', 'TEXT', 'Содержимое публикации'],
            ['LikesCount', 'INTEGER', 'Количество лайков'],
            ['CommentsCount', 'INTEGER', 'Количество комментариев'],
            ['CreatedAt', 'TIMESTAMP', 'Дата создания'],
          ]),
          emptyParagraph(),

          bodyText('Структура таблицы Reviews представлена в таблице 2.10.'),
          captionParagraph('Таблица 2.10 — Структура таблицы Reviews', true),
          makeDbTable([
            ['Id', 'GUID', 'Первичный ключ'],
            ['UserId', 'GUID', 'Внешний ключ на Users (получатель)'],
            ['AuthorId', 'GUID', 'Внешний ключ на Users (автор)'],
            ['Rating', 'INTEGER', 'Рейтинг (1-5)'],
            ['Text', 'TEXT', 'Текст отзыва'],
            ['JobId', 'GUID', 'Внешний ключ на Jobs (nullable)'],
            ['CreatedAt', 'TIMESTAMP', 'Дата создания'],
          ]),
          emptyParagraph(),

          bodyText('Диаграмма базы данных представлена на рисунке 2.5.'),

          // Diagram 2.5 - ER
          ...(diagramImages.er ? imageParagraph(diagramImages.er, 380, 304, 'Рисунок 2.5 — Диаграмма базы данных') : [bodyText('[Диаграмма: Диаграмма базы данных]')]),

          bodyText('Связи между таблицами:'),
          listItem('User (1) → (N) Job — один заказчик может иметь несколько заказов;'),
          listItem('User (1) → (N) Proposal — один исполнитель может подать несколько предложений;'),
          listItem('Category (1) → (N) Job — одна категория содержит несколько заказов;'),
          listItem('Job (1) → (N) Proposal — на один заказ может быть подано несколько предложений;'),
          listItem('Job (1) → (N) JobSkill — заказ может требовать несколько навыков;'),
          listItem('User (1) → (N) Chat — пользователь может участвовать в нескольких чатах;'),
          listItem('Chat (1) → (N) Message — чат содержит несколько сообщений;'),
          listItem('User (1) → (N) Review — пользователь может получить несколько отзывов;'),
          lastListItem('User (1) → (N) Post — исполнитель может иметь несколько публикаций.'),

          subHeader('2.3 Проектирование интерфейсов'),
          bodyText('Проектирование интерфейсов основано на принципах минимализма, адаптивности и удобства использования. Выбрана стилистика glassmorphism — современный дизайн-подход с полупрозрачными элементами и размытием фона, создающий визуальную глубину и лёгкость интерфейса.'),
          bodyText('Цветовая палитра: основной цвет — синий (#3b82f6), дополнительные — серый (#6b7280), зелёный (#10b981) для позитивных действий, жёлтый (#f59e0b) для предупреждений, красный (#ef4444) для ошибок. Шрифт — Inter, обеспечивающий хорошую читаемость на различных устройствах.'),
          bodyText('Основные страницы интерфейса:'),
          listItem('Главная страница — герой-секция с поиском, статистика платформы, каталог категорий, избранные заказы, отзывы;'),
          listItem('Страница авторизации — табы входа/регистрации с выбором роли;'),
          listItem('Каталог заказов — сетка карточек с фильтрацией и поиском;'),
          listItem('Карточка заказа (модальное окно) — полная информация о заказе с возможностью подачи предложения;'),
          listItem('Профиль пользователя — обложка, аватар, статистика, портфолио, посты, отзывы;'),
          listItem('Чат — трёхпанельный интерфейс: список чатов, сообщения, информация о заказе;'),
          listItem('Создание заказа — форма с указанием параметров заказа;'),
          lastListItem('Мои заказы / Мои предложения — списки с управлением статусами.'),
          pageBreakParagraph(),

          // РАЗДЕЛ 3
          headerParagraph('3 Реализация'),
          subHeader('3.1 Реализация основных функций'),
          bodyText('Реализация клиентской части выполнена в виде SPA (Single Page Application) на базе React 18. Управление состоянием реализовано через Context API и useReducer — единый контекст приложения (AppContext) хранит все данные о пользователе, авторизации и текущем состоянии интерфейса. Доступ к состоянию осуществляется через кастомный хук useAppContext().'),
          bodyText('Нормализация данных осуществляется через модуль normalize.js, который преобразует ответы сервера в единый формат, принятый на клиенте. Это обеспечивает стабильность структуры данных независимо от изменений на сервере.'),
          bodyText('Серверная часть реализована по архитектуре Clean Architecture с четырьмя слоями: Domain (сущности, перечисления), Application (сервисы, интерфейсы), Infrastructure (репозитории через EF Core, работа с файлами), WebApi (контроллеры, SignalR-хаб).'),
          bodyText('Диаграмма классов основных сервисов приложения представлена на рисунке 3.1.'),

          // Diagram 3.1 - Class diagram
          ...(diagramImages.classes ? imageParagraph(diagramImages.classes, 380, 266, 'Рисунок 3.1 — Диаграмма классов основных сервисов приложения') : [bodyText('[Диаграмма: Диаграмма классов сервисов]')]),

          bodyText('Ключевые реализованные функции:'),
          bodyText('Аутентификация и авторизация — реализована через cookie-аутентификацию ASP.NET Core. При регистрации создаётся пользователь с хешированным паролем (PBKDF2-HMAC-SHA256, 100 000 итераций), устанавливается cookie-токен «synq_session» с продолжительностью 7 дней. На клиенте состояние авторизации хранится в AppContext и localStorage; при загрузке приложения вызывается authApi.me() для проверки текущей сессии.'),
          bodyText('CRUD-операции с заказами — контроллер JobsController обеспечивает создание, просмотр, обновление, удаление и изменение статуса заказов. Доступ к операциям модификации ограничен авторизацией и принадлежностью заказа текущему пользователю.'),
          bodyText('Подача и управление предложениями — исполнители могут подавать предложения с указанием цены, сроков и сопроводительного письма. Заказчики могут принимать или отклонять предложения. Статус предложения может быть: Pending, Accepted, Rejected, Withdrawn.'),
          bodyText('Real-time обмен сообщениями — реализовано через SignalR-хаб ChatHub. На клиенте используется сервис SignalRService, который устанавливает постоянное соединение с хабом через cookie-аутентификацию. При отправке сообщения клиент вызывает метод SendMessage, сервер сохраняет сообщение в БД и рассылает его участникам чата через события ReceiveMessage и MessageSent. Поддерживаются уведомления о наборе текста (Typing), прочтении сообщений (MarkAsRead с визуализацией статуса прочтения — одна/две галочки), а также статусы онлайн/офлайн (UserOnline/UserOffline). При обрыве соединения SignalR автоматически переподключается с нарастающим интервалом (0, 2, 5, 10, 30 секунд) и заново загружает актуальные данные. REST API используется только для первоначальной загрузки списка чатов и истории сообщений.'),
          bodyText('Управление профилем — пользователи могут редактировать данные профиля, загружать аватар и обложку через multipart/form-data запросы, публиковать посты.'),

          subHeader('3.2 Реализация интерфейсов'),
          bodyText('Реализация интерфейсов выполнена с использованием React 18 и TailwindCSS. Компонентная архитектура разделена на три уровня:'),
          listItem('компоненты общего назначения (src/components/common/) — Button, Input, Card, Badge, Avatar, Modal, ProtectedRoute;'),
          listItem('компоненты предметной области (src/components/features/) — JobCard, JobModal, ProposalCard, ChatMessage, PostCard;'),
          lastListItem('компоненты компоновки (src/components/layout/) — Header, Footer.'),
          bodyText('Маршрутизация реализована с помощью React Router DOM v6. Все маршруты, кроме главной страницы и страницы авторизации, защищены компонентом ProtectedRoute, проверяющим состояние аутентификации.'),
          bodyText('Переходы между страницами реализованы через AnimatePresence (Framer Motion) с режимом wait, что обеспечивает плавные анимации при смене маршрутов.'),
          bodyText('Адаптивная вёрстка основана на системе breakpoint\'ов TailwindCSS (sm: 640px, md: 768px, lg: 1024px, xl: 1280px) и обеспечивает корректное отображение на всех типах устройств. Для карточек заказов используется masonry-раскладка с CSS-колонками.'),
          bodyText('Взаимодействие с сервером реализовано через Axios-клиент с конфигурацией withCredentials: true для автоматической передачи cookie. Модули API разделены по доменам: auth, jobs, categories, users, proposals, posts, reviews, chats. Все запросы направляются через префикс /api.'),
          bodyText('Локализация интерфейса выполнена на русском языке. Форматирование дат осуществляется с помощью date-fns с русской локалью, форматирование валют — через Intl.NumberFormat с локалью ru-RU.'),

          subHeader('3.3 Тестирование'),
          bodyText('Тестирование разработанной информационной системы проводилось методами ручного функционального тестирования, приёмочного тестирования и кроссбраузерного тестирования.'),
          bodyText('Функциональное тестирование проводилось для проверки корректности работы всех функций системы:'),
          listItem('аутентификация: регистрация с различными ролями, вход с валидными и невалидными данными, выход из системы, проверка сохранения сессии при обновлении страницы;'),
          listItem('CRUD-операции: создание, просмотр, редактирование и удаление заказов, подача и отзыв предложений, публикация и удаление постов;'),
          listItem('обмен сообщениями: отправка и получение сообщений в реальном времени, уведомления о наборе текста, пометка сообщений как прочитанных, корректное отображение истории сообщений;'),
          lastListItem('профиль: редактирование данных, загрузка изображений, просмотр профилей других пользователей.'),
          bodyText('Результаты тестирования основных функций представлены в таблице 3.1.'),

          // Test results table
          captionParagraph('Таблица 3.1 — Результаты тестирования основных функций', true),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  makeTableCell('Действие', true, 1600),
                  makeTableCell('№ шага', true, 500),
                  makeTableCell('Описание шага', true, 2500),
                  makeTableCell('Ожидаемый результат', true, 2200),
                  makeTableCell('Фактический результат', true, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Регистрация заказчика', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Открыть страницу авторизации, перейти на вкладку «Регистрация»', false, 2500),
                  makeTableCell('Отображается форма регистрации с выбором роли', false, 2200),
                  makeTableCell('Форма регистрации отображена корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Ввести имя, email, пароль, выбрать роль «Заказчик», нажать кнопку регистрации', false, 2500),
                  makeTableCell('Отправлено письмо для подтверждения email', false, 2200),
                  makeTableCell('Письмо отправлено, пользователь создан с ролью Client', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Перейти по ссылке подтверждения в письме', false, 2500),
                  makeTableCell('Email верифицирован, выполнен вход в систему', false, 2200),
                  makeTableCell('Email подтверждён, cookie установлена', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Регистрация исполнителя', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Открыть страницу авторизации, перейти на вкладку «Регистрация»', false, 2500),
                  makeTableCell('Отображается форма регистрации с выбором роли', false, 2200),
                  makeTableCell('Форма регистрации отображена корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Ввести имя, email, пароль, выбрать роль «Исполнитель», нажать кнопку регистрации', false, 2500),
                  makeTableCell('Отправлено письмо для подтверждения email', false, 2200),
                  makeTableCell('Письмо отправлено, пользователь создан с ролью Freelancer', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Перейти по ссылке подтверждения в письме', false, 2500),
                  makeTableCell('Email верифицирован, выполнен вход в систему', false, 2200),
                  makeTableCell('Email подтверждён, cookie установлена', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Авторизация пользователя', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Открыть страницу авторизации, перейти на вкладку «Вход»', false, 2500),
                  makeTableCell('Отображается форма входа', false, 2200),
                  makeTableCell('Форма входа отображена корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Ввести email и пароль зарегистрированного пользователя, нажать кнопку входа', false, 2500),
                  makeTableCell('Установка cookie-токена, редирект на главную страницу', false, 2200),
                  makeTableCell('Cookie установлена, редирект выполнен', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Обновить страницу (проверка сохранения сессии)', false, 2500),
                  makeTableCell('Сессия сохранена, пользователь остаётся авторизованным', false, 2200),
                  makeTableCell('Сессия сохранена, данные пользователя загружены', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Создание заказа', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Перейти на страницу создания заказа', false, 2500),
                  makeTableCell('Отображается форма создания заказа', false, 2200),
                  makeTableCell('Форма создания заказа отображена', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Заполнить форму: указать название, описание, категорию, бюджет, сроки, требуемые навыки', false, 2500),
                  makeTableCell('Все поля заполнены корректно, валидация пройдена', false, 2200),
                  makeTableCell('Данные формы приняты, ошибок валидации нет', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Нажать кнопку создания заказа', false, 2500),
                  makeTableCell('Заказ создан и появляется в каталоге', false, 2200),
                  makeTableCell('Заказ отображается в каталоге с корректными данными', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Подача предложения', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Открыть каталог заказов, выбрать заказ и открыть его карточку', false, 2500),
                  makeTableCell('Отображается полная информация о заказе', false, 2200),
                  makeTableCell('Карточка заказа отображена корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Нажать «Подать предложение», ввести цену, сроки и сопроводительное письмо', false, 2500),
                  makeTableCell('Форма предложения заполнена', false, 2200),
                  makeTableCell('Данные предложения введены корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Нажать кнопку отправки предложения', false, 2500),
                  makeTableCell('Предложение создано со статусом Pending', false, 2200),
                  makeTableCell('Предложение отображается в списке, статус Pending', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Обмен сообщениями', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Открыть раздел чатов, выбрать существующий чат', false, 2500),
                  makeTableCell('Отображается история сообщений чата', false, 2200),
                  makeTableCell('История сообщений загружена корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Ввести текст сообщения, нажать кнопку отправки', false, 2500),
                  makeTableCell('Сообщение отправлено и отображается в чате', false, 2200),
                  makeTableCell('Сообщение отправлено через SignalR, отображено у отправителя', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Проверить доставку сообщения собеседнику', false, 2500),
                  makeTableCell('Сообщение доставлено собеседнику в реальном времени', false, 2200),
                  makeTableCell('Сообщение получено собеседником, статус прочтения обновлён', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Редактирование профиля', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Перейти на страницу своего профиля', false, 2500),
                  makeTableCell('Отображаются текущие данные профиля', false, 2200),
                  makeTableCell('Данные профиля загружены корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Изменить данные (биография, навыки, опыт работы), нажать кнопку сохранения', false, 2500),
                  makeTableCell('Данные профиля обновлены', false, 2200),
                  makeTableCell('Изменения сохранены, отображаются обновлённые данные', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Загрузить аватар и обложку профиля', false, 2500),
                  makeTableCell('Изображения загружены и отображаются', false, 2200),
                  makeTableCell('Аватар и обложка загружены и отображены корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('Фильтрация и поиск заказов', false, 1600, { verticalMerge: VerticalMergeType.RESTART }),
                  makeTableCell('1', false, 500),
                  makeTableCell('Перейти в каталог заказов', false, 2500),
                  makeTableCell('Отображается полный список заказов', false, 2200),
                  makeTableCell('Каталог заказов загружен корректно', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('2', false, 500),
                  makeTableCell('Выбрать категорию из фильтра, указать диапазон бюджета', false, 2500),
                  makeTableCell('Список заказов отфильтрован по категории и бюджету', false, 2200),
                  makeTableCell('Отображаются только заказы выбранной категории и диапазона', false, 2200),
                ]
              }),
              new TableRow({
                children: [
                  makeTableCell('', false, 1600, { verticalMerge: VerticalMergeType.CONTINUE }),
                  makeTableCell('3', false, 500),
                  makeTableCell('Ввести поисковый запрос, применить фильтры', false, 2500),
                  makeTableCell('Отображаются только соответствующие заказы', false, 2200),
                  makeTableCell('Фильтрация и поиск работают корректно', false, 2200),
                ]
              }),
            ]
          }),
          emptyParagraph(),

          pageBreakParagraph(),

          // РАЗДЕЛ 4
          headerParagraph('4 Руководство администратора/пользователя'),
          subHeader('4.1 Руководство пользователя'),
          bodyText('Для работы с системой Synq пользователь должен иметь доступ к сети Интернет и современный веб-браузер (Google Chrome, Mozilla Firefox, Microsoft Edge последних версий).'),
          bodyText('Регистрация. Для создания аккаунта необходимо перейти на страницу авторизации, выбрать вкладку «Регистрация», указать имя, email, пароль и роль (Заказчик или Исполнитель). После отправки формы на указанный email будет направлено письмо для подтверждения.'),
          bodyText('Вход в систему. На странице авторизации необходимо ввести email и пароль, после чего система выполнит вход и перенаправит на главную страницу.'),
          bodyText('Создание заказа (для Заказчиков). В разделе «Создать заказ» необходимо заполнить форму: название, описание, категория, бюджет (минимальный/максимальный), срок выполнения, срочность, требуемые навыки. После отправки заказ появляется в каталоге.'),
          bodyText('Поиск заказов (для Исполнителей). На странице каталога заказов доступны поиск по тексту, фильтрация по категории, диапазону бюджета и сортировка. Для детального просмотра необходимо нажать на карточку заказа.'),
          bodyText('Подача предложения. На странице заказа необходимо нажать «Подать предложение», указать предлагаемую цену, срок выполнения и сопроводительное письмо.'),
          bodyText('Обмен сообщениями. В разделе «Чаты» доступен список переписок. Выбрав чат, можно обмениваться сообщениями в реальном времени. Система отображает уведомления о наборе текста собеседником и статус прочтения сообщений.'),
          bodyText('Управление профилем. В профиле доступны редактирование данных, загрузка аватара и обложки, добавление информации о себе, навыках, опыте работы и портфолио. Исполнители могут публиковать посты.'),

          subHeader('4.2 Руководство администратора'),
          bodyText('Для развёртывания системы администратору необходимо выполнить следующие действия:'),
          numberedItem('1.', 'Установить Docker и Docker Compose на сервер;'),
          numberedItem('2.', 'Склонировать репозиторий проекта;'),
          numberedItem('3.', 'Перейти в корневую директорию проекта и выполнить команду docker-compose up -d;'),
          numberedItem('4.', 'Дождаться запуска всех контейнеров (PostgreSQL, backend, mailpit, frontend);'),
          numberedItem('5.', 'Убедиться в доступности приложения по адресу http://localhost:3000.'),
          bodyText('Конфигурация сервисов:'),
          listItem('PostgreSQL: порт 5438, данные хранятся в Docker-томе postgres_data;'),
          listItem('Backend (.NET 8): порт 5000 (HTTP), 5001 (HTTPS), применяет миграции при запуске;'),
          listItem('Frontend (Vite): порт 3000, проксирует запросы к backend;'),
          lastListItem('Mailpit: порт 8025 (веб-интерфейс), порт 1025 (SMTP), предназначен для тестирования email.'),
          bodyText('Для мониторинга системы администратор может использовать:'),
          listItem('Swagger UI backend (доступен в режиме разработки);'),
          listItem('веб-интерфейс Mailpit для просмотра отправленных писем;'),
          lastListItem('логи контейнеров Docker.'),

          pageBreakParagraph(),

          // РАЗДЕЛ 5
          headerParagraph('5 Мероприятия по информационной безопасности'),
          subHeader('5.1 Возможные угрозы информационной безопасности'),
          bodyText('При работе с приложением Synq возможны следующие угрозы информационной безопасности:'),
          listItem('несанкционированный доступ к аккаунту пользователя путём подбора или утечки пароля;'),
          listItem('перехват передаваемых данных (учётные записи, сообщения, личная информация) при передаче по сети;'),
          listItem('межсайтовый скриптинг (XSS) — внедрение вредоносного кода в веб-страницы приложения;'),
          listItem('подделка межсайтовых запросов (CSRF) — выполнение действий от имени авторизованного пользователя без его ведома;'),
          listItem('SQL-инъекции — внедрение вредоносного SQL-кода через входные данные;'),
          listItem('несанкционированный доступ к API-эндпоинтам без авторизации;'),
          listItem('утечка конфиденциальных данных (пароли, личная информация) из базы данных;'),
          listItem('атаки типа DDoS, направленные на нарушение доступности сервиса;'),
          listItem('нарушение целостности данных при concurrent-доступе к заказам и предложениям;'),
          lastListItem('социальная инженерия — фишинг, манипуляция пользователями.'),

          subHeader('5.2 Принятые меры для предотвращения угроз'),
          subSubHeader('5.2.1 Разграничение доступа'),
          bodyText('Модель разграничения доступа в системе Synq основана на ролевой модели (RBAC — Role-Based Access Control). Система предусматривает две роли: «Заказчик» (Client) и «Исполнитель» (Freelancer). Каждая роль определяет набор доступных функций.'),
          bodyText('Выбор модели RBAC обусловлен простотой реализации и поддержки для приложения с чётко разграниченными ролями. В отличие от моделей MAC (Mandatory Access Control) и ABAC (Attribute-Based Access Control), RBAC не требует сложной конфигурации правил и атрибутов, что делает его оптимальным для маркетплейса фриланс-услуг с двумя основными типами пользователей.'),
          bodyText('Матрица разграничения доступа представлена в таблице 5.1.'),

          // Access matrix table
          captionParagraph('Таблица 5.1 — Матрица разграничения доступа', true),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  makeTableCell('Функция', true, 3000),
                  makeTableCell('Заказчик', true, 2000),
                  makeTableCell('Исполнитель', true, 2000),
                  makeTableCell('Неавторизованный', true, 2000),
                ]
              }),
              new TableRow({ children: [makeTableCell('Регистрация и вход', false, 3000), makeTableCell('Да', false, 2000), makeTableCell('Да', false, 2000), makeTableCell('Да', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Просмотр каталога заказов', false, 3000), makeTableCell('Да', false, 2000), makeTableCell('Да', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Создание заказа', false, 3000), makeTableCell('Да', false, 2000), makeTableCell('Нет', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Редактирование/удаление заказа', false, 3000), makeTableCell('Да (своего)', false, 2000), makeTableCell('Нет', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Подача предложения', false, 3000), makeTableCell('Нет', false, 2000), makeTableCell('Да', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Принятие/отклонение предложения', false, 3000), makeTableCell('Да (на свой заказ)', false, 2000), makeTableCell('Нет', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Обмен сообщениями', false, 3000), makeTableCell('Да', false, 2000), makeTableCell('Да', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Редактирование профиля', false, 3000), makeTableCell('Да (своего)', false, 2000), makeTableCell('Да (своего)', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Публикация постов', false, 3000), makeTableCell('Нет', false, 2000), makeTableCell('Да', false, 2000), makeTableCell('Нет', false, 2000)] }),
              new TableRow({ children: [makeTableCell('Оставление отзывов', false, 3000), makeTableCell('Да', false, 2000), makeTableCell('Да', false, 2000), makeTableCell('Нет', false, 2000)] }),
            ]
          }),
          emptyParagraph(),

          bodyText('Реализация разграничения доступа выполнена на двух уровнях:'),
          listItem('на уровне маршрутов — компонент ProtectedRoute проверяет состояние авторизации и перенаправляет неавторизованных пользователей на страницу входа;'),
          lastListItem('на уровне API — контроллеры используют атрибут [Authorize] для ограничения доступа к защищённым эндпоинтам, а в методах проверяется принадлежность ресурса текущему пользователю.'),

          subSubHeader('5.2.2 Безопасная идентификация, аутентификация и авторизация'),
          bodyText('Процедура идентификации в системе Synq осуществляется по email-адресу пользователя. Каждый пользователь имеет уникальный email, что исключает возможность дублирования аккаунтов.'),
          bodyText('Аутентификация реализована на основе cookie-аутентификации ASP.NET Core Identity. При регистрации пароль пользователя хешируется с использованием алгоритма PBKDF2-HMAC-SHA256 с 100 000 итераций и 16-байтовой криптографической солью. Выбор PBKDF2 обоснован следующими преимуществами по сравнению с альтернативами:'),
          listItem('PBKDF2 автоматически генерирует криптографическую соль (16 байт) с помощью RandomNumberGenerator, что защищает от атак с радужными таблицами. Каждый пароль получает уникальную соль, что делает невозможным использование предварительно вычисленных хешей;'),
          listItem('PBKDF2 использует адаптивное количество итераций (100 000), что делает атаку перебором вычислительно затратной. Увеличение количества итераций прямо пропорционально увеличивает время хеширования, что позволяет масштабировать защиту по мере роста вычислительных мощностей. В отличие от простых хешей (MD5, SHA-256 без итераций), PBKDF2 намеренно замедляет вычисление хеша;'),
          listItem('PBKDF2 реализован средствами встроенной библиотеки System.Security.Cryptography платформы .NET, что исключает необходимость подключения сторонних зависимостей и обеспечивает совместимость с платформой;'),
          lastListItem('для верификации пароля применяется сравнение за постоянное время (CryptographicOperations.FixedTimeEquals), что предотвращает атаки по времени (timing-атаки), позволяющие определить правильность части пароля по времени выполнения сравнения;'),
          bodyText('Cookie-токен «synq_session» создаётся с следующими параметрами безопасности:'),
          listItem('HttpOnly — предотвращает доступ к cookie через JavaScript, что защищает от XSS-атак по краже сессии;'),
          listItem('SameSite=Lax — ограничивает отправку cookie при кросс-сайтовых запросах, что защищает от CSRF-атак;'),
          lastListItem('SlidingExpiration — продлевает срок действия cookie при активном использовании (7 дней), автоматически завершая неактивные сессии.'),
          bodyText('Авторизация осуществляется на основе Claims, извлекаемых из cookie: ClaimTypes.NameIdentifier (идентификатор), ClaimTypes.Email (email), ClaimTypes.Name (имя), ClaimTypes.Role (роль). Контроллеры и сервисы проверяют Claims для определения прав доступа текущего пользователя.'),
          bodyText('Процедура регистрации включает верификацию email-адреса: после регистрации на указанный email отправляется уникальный токен верификации с ограниченным сроком действия. Это предотвращает регистрацию с несуществующими email-адресами и обеспечивает возможность восстановления пароля.'),

          subSubHeader('5.2.3 Безопасное хранение данных и резервное копирование'),
          bodyText('Хранение данных пользователей и паролей в системе Synq реализовано с применением следующих мер безопасности:'),
          listItem('пароли хранятся исключительно в хешированном виде (PBKDF2-HMAC-SHA256 с 100 000 итераций), исходные пароли не сохраняются и не могут быть восстановлены;'),
          listItem('конфиденциальные данные (содержание сообщений, личная информация) хранятся в базе данных PostgreSQL с применением шифрования на уровне соединения (SSL/TLS при развёртывании в production);'),
          listItem('файловые данные (аватары, обложки, вложения) хранятся в файловой системе сервера с ограничением доступа на уровне ОС;'),
          listItem('идентификаторы записей используют тип GUID (UUID v4), что предотвращает перебор записей по последовательным идентификаторам;'),
          lastListItem('при развёртывании в Docker используются переменные окружения для хранения конфиденциальных настроек (строки подключения к БД, секреты), которые не включаются в исходный код.'),
          bodyText('Выбор PostgreSQL для хранения данных обоснован следующими преимуществами:'),
          listItem('поддержка UUID как нативного типа данных, что упрощает работу с неsequential идентификаторами и повышает безопасность за счёт непредсказуемости ключей;'),
          listItem('поддержка JSONB для гибкого хранения полуструктурированных данных без потери возможностей индексирования;'),
          listItem('встроенная поддержка SSL-соединений, обеспечивающих шифрование данных при передаче между приложением и БД;'),
          listItem('возможность создания полнотекстовых индексов для эффективного поиска по тексту заказов и предложений;'),
          lastListItem('соответствие требованиям ACID (атомарность, согласованность, изолированность, долговечность), что гарантирует целостность данных при concurrent-доступе.'),
          bodyText('В сравнении с MySQL, PostgreSQL предлагает более строгую систему типизации, лучшую поддержку сложных запросов и расширяемость, что критически важно для маркетплейса с разнообразными типами данных (пользователи, заказы, чаты, файлы).'),
          bodyText('Резервное копирование данных реализовано через механизм Docker-томов (postgres_data), который обеспечивает сохранение данных при пересоздании контейнеров. Для production-развёртывания рекомендуются следующие дополнительные меры:'),
          listItem('ежедневное полное резервное копирование базы данных с помощью pg_dump;'),
          listItem('хранение резервных копий на отдельном сервере или в облачном хранилище;'),
          listItem('ротация резервных копий (хранение ежедневных копий за последние 7 дней, еженедельных — за месяц, ежемесячных — за год);'),
          lastListItem('регулярное тестирование восстановления из резервных копий.'),

          subSubHeader('5.2.4 Защита кода от неправомерного использования, копирования и взлома'),
          bodyText('Для данного проекта обфускация кода не проводилась, так как приложение развёртывается на сервере и его исходный код недоступен конечным пользователям. Клиентская часть приложения (JavaScript-бundle) поставляется в минифицированном виде средствами сборщика Vite, что затрудняет чтение и анализ кода, однако не обеспечивает полной защиты от реверс-инжиниринга.'),
          bodyText('Серверная часть (.NET) компилируется в промежуточный код (IL), который не содержит исходных текстов и не может быть декомпилирован обратно в оригинальный C#-код с сохранением всей структуры и имён. Размещение серверного кода на сервере без публичного доступа к бинарным файлам исключает возможность его несанкционированного копирования.'),
          bodyText('Дополнительные меры защиты кода включают:'),
          listItem('использование переменных окружения для хранения секретов (строки подключения, ключи) вместо хранения в исходном коде;'),
          listItem('настройку CORS на серверной стороне, ограничивающую запросы к API только с разрешённых доменов;'),
          lastListItem('закрытый репозиторий исходного кода с ограниченным доступом.'),

          subSubHeader('5.2.5 Защита авторского права'),
          bodyText('Для защиты авторских прав в приложении Synq предусмотрен знак защиты авторского права (copyright), размещённый в подвале (Footer) каждой страницы: «© 2025 Synq. Все права защищены.»'),
          bodyText('Знак содержит все требуемые атрибуты: символ ©, год публикации и наименование правообладателя. Дополнительно в подвале размещена ссылка на условия использования сервиса.'),
          bodyText('Исходный код проекта защищён лицензией, размещённой в репозитории. Использование материалов проекта без согласия правообладателя не допускается.'),

          subHeader('5.3 Рекомендации пользователям по безопасной работе с приложением'),
          bodyText('Для обеспечения безопасной работы с приложением Synq пользователям рекомендуется соблюдать следующие правила:'),
          listItem('использовать надёжные пароли длиной не менее 8 символов, содержащие заглавные и строчные буквы, цифры и специальные символы;'),
          listItem('не передавать учётные данные третьим лицам;'),
          listItem('завершать сеанс работы (выход из системы) при использовании общественного или чужого устройства;'),
          listItem('регулярно просматривать активные сессии и завершать подозрительные;'),
          listItem('использовать актуальную версию веб-браузера с включёнными обновлениями безопасности;'),
          listItem('не переходить по подозрительным ссылкам, полученным в сообщениях от незнакомых пользователей;'),
          lastListItem('при обнаружении подозрительной активности обратиться в службу поддержки.'),
          bodyText('Дополнительные технологии защиты информации, рекомендуемые при работе с приложением:'),
          listItem('использование VPN-соединения при работе в общественных Wi-Fi-сетях для предотвращения перехвата трафика;'),
          listItem('использование антивирусного программного обеспечения для защиты от вредоносных программ;'),
          listItem('включение межсетевого экрана (firewall) операционной системы для блокировки несанкционированных сетевых подключений;'),
          lastListItem('использование менеджеров паролей для генерации и хранения уникальных паролей.'),

          pageBreakParagraph(),

          // ЗАКЛЮЧЕНИЕ
          headerParagraph('Заключение', 1, AlignmentType.CENTER),
          bodyText('В ходе дипломного проекта была разработана информационная система «Synq» — веб-приложение маркетплейса фриланс-услуг, обеспечивающее полный цикл взаимодействия между заказчиками и исполнителями.'),
          bodyText('В проекте были решены следующие задачи:'),
          listItem('проведён анализ предметной области и существующих аналогов (Kwork, FL.ru, Хабр Фриланс), выявлены их ограничения и определены направления улучшений;'),
          listItem('сформулированы функциональные и нефункциональные требования к системе;'),
          listItem('спроектирована архитектура приложения на основе Clean Architecture с разделением на слои Domain, Application, Infrastructure и WebApi;'),
          listItem('разработана модель базы данных PostgreSQL, включающая 10 основных таблиц с реляционными связями;'),
          listItem('реализована клиентская часть на React 18 с адаптивным интерфейсом в стиле glassmorphism;'),
          listItem('реализована серверная часть на ASP.NET Core 8 с REST API и SignalR для real-time коммуникации;'),
          listItem('реализована система обмена сообщениями в реальном времени на основе SignalR с автоматическим переподключением и доставкой уведлений о прочтении;'),
          listItem('обеспечены мероприятия по информационной безопасности: аутентификация на основе cookie с PBKDF2-хешированием паролей, разграничение доступа по ролям, защита от XSS и CSRF;'),
          lastListItem('проведено тестирование основных функций системы.'),
          bodyText('Практическая значимость проекта заключается в создании готового к развёртыванию веб-приложения, которое может быть использовано как основа для запуска фриланс-платформы. Контейнеризация через Docker Compose обеспечивает простое и воспроизводимое развёртывание всей инфраструктуры.'),
          bodyText('Предложения по совершенствованию программного продукта:'),
          listItem('внедрение системы онлайн-платежей для обеспечения безопасных сделок между заказчиками и исполнителями;'),
          listItem('добавление уведомлений в реальном времени (push-уведомления, email-рассылка) о новых предложениях и сообщениях;'),
          listItem('реализация системы администрирования для модерации контента и управления пользователями;'),
          listItem('внедрение полнотекстового поиска на основе возможностей PostgreSQL с улучшенной релевантностью;'),
          listItem('добавление системы файловых вложений для обмена документами в чатах;'),
          listItem('расширение системы отзывов с возможностью оценки по нескольким критериям;'),
          listItem('оптимизация производительности через кэширование (Redis) и CDN для статических ресурсов;'),
          lastListItem('внедрение автоматизированного тестирования (unit-тесты, интеграционные тесты, E2E-тесты).'),

          pageBreakParagraph(),

          // СПИСОК ИСТОЧНИКОВ
          headerParagraph('Список источников', 1, AlignmentType.CENTER),
          bodyText('Нормативная документация', { bold: true, noIndent: true }),
          numberedItem('1)', 'ГОСТ 34.602-2020 Информационная технология. Комплекс стандартов на автоматизированные системы. Техническое задание на создание автоматизированной системы [Электронный ресурс] — https://protect.gost.ru/document1.aspx?control=31&id=241754'),
          numberedItem('2)', 'ГОСТ 34.201-2020 Информационная технология. Комплекс стандартов на автоматизированные системы. Виды, комплектность и обозначение документов при создании автоматизированных систем [Электронный ресурс] — https://protect.gost.ru/document1.aspx?control=31&id=241756'),
          numberedItem('3)', 'ГОСТ Р ИСО/МЭК 25051-2017 Информационная технология. Системная и программная инженерия. Требования и оценка качества систем и программного обеспечения (SQuaRE). Требования к качеству готового к использованию программного продукта (RUSP) и инструкции по тестированию [Электронный ресурс] — https://protect.gost.ru/document.aspx?control=7&id=217667'),
          numberedItem('4)', 'ГОСТ 19.106-78 Единая система программной документации. Требования к программным документам, выполненным печатным способом [Электронный ресурс] — https://protect.gost.ru/document.aspx?control=7&id=156370'),
          numberedItem('5)', 'ГОСТ 19.401-78 Единая система программной документации. Текст программы. Требования к содержанию и оформлению [Электронный ресурс] — https://protect.gost.ru/document.aspx?control=7&id=155463'),
          numberedItem('6)', 'ГОСТ Р 2.105-2019 Единая система конструкторской документации. Общие требования к текстовым документам [Электронный ресурс] — https://protect.gost.ru/document1.aspx?control=31&baseC=6&page=0&month=1&year=2025&search=%D0%93%D0%9E%D0%A1%D0%A2%20%D0%A0%202.105-2019&id=237857'),
          emptyParagraph(),
          bodyText('Интернет-ресурсы', { bold: true, noIndent: true }),
          numberedItem('7)', 'Документация React [Электронный ресурс] — https://react.dev'),
          numberedItem('8)', 'Документация ASP.NET Core [Электронный ресурс] — https://learn.microsoft.com/ru-ru/aspnet/core'),
          numberedItem('9)', 'Документация PostgreSQL [Электронный ресурс] — https://www.postgresql.org/docs'),
          numberedItem('10)', 'Документация SignalR [Электронный ресурс] — https://learn.microsoft.com/ru-ru/aspnet/core/signalr'),
          numberedItem('11)', 'Документация TailwindCSS [Электронный ресурс] — https://tailwindcss.com/docs'),
          numberedItem('12)', 'Документация Vite [Электронный ресурс] — https://vitejs.dev'),
          numberedItem('13)', 'Документация Docker [Электронный ресурс] — https://docs.docker.com'),
          numberedItem('14)', 'Документация Entity Framework Core [Электронный ресурс] — https://learn.microsoft.com/ru-ru/ef/core'),
          numberedItem('15)', 'Документация System.Security.Cryptography [Электронный ресурс] — https://learn.microsoft.com/ru-ru/dotnet/api/system.security.cryptography'),

          pageBreakParagraph(),

          // ПРИЛОЖЕНИЕ А
          headerParagraph('Приложение А', 1, AlignmentType.CENTER),
          bodyText('Листинг модуля аутентификации (AuthController.cs)', { bold: true, noIndent: true }),
          bodyText('[ЗАМЕСТИТЕЛЬ: здесь необходимо вставить листинг кода модуля аутентификации из backend/src/Synq.WebApi/Controllers/AuthController.cs]', { italic: true }),
          emptyParagraph(),
          bodyText('Листинг модуля управления состоянием (AppContext.jsx)', { bold: true, noIndent: true }),
          bodyText('[ЗАМЕСТИТЕЛЬ: здесь необходимо вставить листинг кода модуля управления состоянием из src/store/index.jsx]', { italic: true }),
          emptyParagraph(),
          bodyText('Листинг модуля SignalR (signalr.js)', { bold: true, noIndent: true }),
          bodyText('[ЗАМЕСТИТЕЛЬ: здесь необходимо вставить листинг кода модуля SignalR из src/api/signalr.js]', { italic: true }),
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_DOCX, buffer);
  console.log(`\nDocument saved to: ${OUTPUT_DOCX}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log('=== Synq Explanatory Note Generator ===\n');

  // Step 1: Render mermaid diagrams
  console.log('Step 1: Rendering mermaid diagrams...');
  let diagramImages = {};
  try {
    diagramImages = await renderMermaidDiagrams();
    console.log('All diagrams rendered successfully.\n');
  } catch (err) {
    console.error('Error rendering diagrams:', err.message);
    console.log('Continuing without diagrams...\n');
  }

  // Step 2: Generate .docx
  console.log('Step 2: Generating .docx document...');
  try {
    await buildDocument(diagramImages);
    console.log('Document generated successfully!\n');
  } catch (err) {
    console.error('Error generating document:', err.message);
    console.error(err.stack);
    process.exit(1);
  }

  // Step 3: Copy markdown file to assets
  const mdSrc = path.join(__dirname, 'explanatory_note.md');
  const mdDst = path.join(ASSETS_DIR, 'explanatory_note.md');
  if (fs.existsSync(mdSrc)) {
    fs.copyFileSync(mdSrc, mdDst);
    console.log(`Markdown file copied to: ${mdDst}`);
  }

  console.log('\n=== Done! ===');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
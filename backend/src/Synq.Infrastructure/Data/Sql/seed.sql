-- Seed data for SYNQ database
-- Run: docker exec -i synq-postgres psql -U postgres -d synq < seed.sql

-- Categories
INSERT INTO "Categories" ("Id", "Name", "Slug", "Icon", "Description", "Color") VALUES
(gen_random_uuid(), 'Веб-дизайн', 'web-design', 'Layout', 'Дизайн сайтов, лендингов и веб-приложений', 'from-blue-500 to-cyan-400'),
(gen_random_uuid(), 'UI/UX Дизайн', 'ui-ux', 'Palette', 'Проектирование интерфейсов и пользовательского опыта', 'from-purple-500 to-pink-400'),
(gen_random_uuid(), 'Графический дизайн', 'graphic-design', 'Image', 'Логотипы, баннеры, фирменный стиль', 'from-orange-500 to-yellow-400'),
(gen_random_uuid(), 'Моушн-дизайн', 'motion', 'Film', 'Анимация, видеоролики, моушн-графика', 'from-red-500 to-orange-400'),
(gen_random_uuid(), 'Разработка', 'development', 'Code', 'Фронтенд, бэкенд, мобильная разработка', 'from-green-500 to-emerald-400'),
(gen_random_uuid(), '3D Моделирование', '3d', 'Box', '3D модели, визуализация, анимация', 'from-indigo-500 to-blue-400');

-- Skills
INSERT INTO "Skills" ("Name") VALUES
('Figma'), ('UI/UX'), ('E-commerce'), ('Responsive Design'), ('React'),
('TypeScript'), ('Node.js'), ('Python'), ('After Effects'), ('Blender'),
('Photoshop'), ('Illustrator'), ('CSS'), ('HTML'), ('TailwindCSS');

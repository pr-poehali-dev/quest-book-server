CREATE TABLE IF NOT EXISTS t_p88778265_quest_book_server.branches (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Star',
  color TEXT NOT NULL DEFAULT '#c0a830',
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p88778265_quest_book_server.quests (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL REFERENCES t_p88778265_quest_book_server.branches(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  reward TEXT NOT NULL DEFAULT '',
  xp INT NOT NULL DEFAULT 100,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic')),
  icon TEXT NOT NULL DEFAULT 'Star',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p88778265_quest_book_server.player_progress (
  id SERIAL PRIMARY KEY,
  player_nick TEXT NOT NULL,
  quest_id INT NOT NULL REFERENCES t_p88778265_quest_book_server.quests(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_nick, quest_id)
);

INSERT INTO t_p88778265_quest_book_server.branches (title, icon, color, description, sort_order) VALUES
  ('Выживание', 'Sword', '#c0392b', 'Докажи, что способен выжить в суровом мире', 1),
  ('Исследование', 'Compass', '#2980b9', 'Открой все уголки бесконечного мира', 2),
  ('Крафт и наука', 'Hammer', '#8e44ad', 'Создавай легендарные артефакты', 3),
  ('Сообщество', 'Users', '#27ae60', 'Стань легендой среди игроков сервера', 4);

INSERT INTO t_p88778265_quest_book_server.quests (branch_id, title, description, reward, xp, rarity, icon, sort_order) VALUES
  (1, 'Первая ночь', 'Переживи первую ночь без укрытия', 'Кожаная броня', 50, 'common', 'Moon', 1),
  (1, 'Охотник', 'Убей 10 мобов с помощью лука', 'Лук Охотника', 120, 'common', 'Target', 2),
  (1, 'Мастер меча', 'Получи 1000 единиц урона в бою', 'Меч Кровожад', 300, 'rare', 'Swords', 3),
  (1, 'Легенда войны', 'Выживи в 5 осадах подряд', 'Кираса Ветерана', 800, 'epic', 'Shield', 4),
  (2, 'Первые шаги', 'Пройди 500 блоков от спавна', 'Компас странника', 40, 'common', 'MapPin', 1),
  (2, 'Картограф', 'Исследуй 3 различных биома', 'Карта мира', 150, 'rare', 'Map', 2),
  (2, 'Мореплаватель', 'Переплыви океан на корабле', 'Капитанская шляпа', 250, 'rare', 'Anchor', 3),
  (2, 'Конец света', 'Достигни края карты (10 000 блоков)', 'Звание Первопроходец', 1000, 'epic', 'Globe', 4),
  (3, 'Кузнец', 'Скрафти железный инструмент', 'Молот кузнеца', 60, 'common', 'Wrench', 1),
  (3, 'Алхимик', 'Создай 5 зелий разных видов', 'Зелье силы II', 180, 'rare', 'FlaskConical', 2),
  (3, 'Чародей', 'Зачаруй оружие уровнем 30+', 'Кристалл чар', 350, 'epic', 'Sparkles', 3),
  (3, 'Творец богов', 'Создай артефакт легендарного качества', 'Реликвия Эпохи', 1200, 'epic', 'Crown', 4),
  (4, 'Новичок', 'Войди на сервер первый раз', 'Тег Новичок', 10, 'common', 'UserPlus', 1),
  (4, 'Торговец', 'Совершни 10 сделок с игроками', 'Торговый сундук', 100, 'common', 'ShoppingBag', 2),
  (4, 'Гильдмастер', 'Создай гильдию из 5+ игроков', 'Знамя гильдии', 500, 'rare', 'Flag', 3),
  (4, 'Легенда сервера', 'Получи 100 голосов от игроков', 'Легендарный статус', 2000, 'epic', 'Star', 4);

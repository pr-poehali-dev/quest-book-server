ALTER TABLE t_p88778265_quest_book_server.player_progress
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

UPDATE t_p88778265_quest_book_server.player_progress SET status = 'approved' WHERE status IS NULL;

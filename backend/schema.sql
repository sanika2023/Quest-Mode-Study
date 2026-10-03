CREATE TABLE IF NOT EXISTS campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  notes_text    TEXT,                 -- null in topic-only mode
  campaign_json JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  position      INT  NOT NULL,
  title         TEXT NOT NULL,
  concepts_json JSONB NOT NULL,       -- story_beat, concepts, quiz, misconception
  villains_json JSONB NOT NULL DEFAULT '[]', -- missed concepts carried in from earlier chapters
  status        TEXT NOT NULL DEFAULT 'locked'
);

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  planned_minutes INT  NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ
);

-- Primary key includes created_at so this can become a Tiger Data hypertable later.
CREATE TABLE IF NOT EXISTS attempts (
  id          UUID NOT NULL DEFAULT gen_random_uuid(),
  chapter_id  UUID NOT NULL,
  concept     TEXT NOT NULL,
  mode        TEXT NOT NULL,          -- quiz | teachback
  verdict     TEXT NOT NULL,          -- correct | partial | missed | wrong
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
);

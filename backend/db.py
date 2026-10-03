import os
import uuid

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

import config  # noqa: F401  (loads .env)


def connect():
    return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)


def save_campaign(campaign, notes_text):
    """Insert the campaign and its chapters (chapter 1 active, the rest locked). Returns the campaign id."""
    with connect() as conn:
        campaign_id = conn.execute(
            "INSERT INTO campaigns (title, notes_text, campaign_json) VALUES (%s, %s, %s) RETURNING id",
            (campaign["title"], notes_text, Jsonb(campaign)),
        ).fetchone()["id"]
        for ch in campaign["chapters"]:
            detail = {k: ch[k] for k in ("story_beat", "concepts", "quiz", "misconception")}
            conn.execute(
                "INSERT INTO chapters (campaign_id, position, title, concepts_json, status) "
                "VALUES (%s, %s, %s, %s, %s)",
                (campaign_id, ch["position"], ch["title"], Jsonb(detail),
                 "active" if ch["position"] == 1 else "locked"),
            )
    return str(campaign_id)


def get_campaign(campaign_id):
    """Read a campaign with its chapters, or None. Never calls a model."""
    try:
        uuid.UUID(campaign_id)
    except ValueError:
        return None
    with connect() as conn:
        row = conn.execute(
            "SELECT id, title, campaign_json, notes_text IS NOT NULL AS has_notes "
            "FROM campaigns WHERE id = %s",
            (campaign_id,),
        ).fetchone()
        if row is None:
            return None
        chapters = conn.execute(
            "SELECT id, position, title, concepts_json, villains_json, status "
            "FROM chapters WHERE campaign_id = %s ORDER BY position",
            (campaign_id,),
        ).fetchall()
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "premise": row["campaign_json"]["premise"],
        "has_notes": row["has_notes"],
        "chapters": [_chapter(c) for c in chapters],
    }


def _chapter(row):
    return {
        "id": str(row["id"]),
        "position": row["position"],
        "title": row["title"],
        "villains": row["villains_json"],
        "status": row["status"],
        **row["concepts_json"],
    }


def update_chapter_status(chapter_id, status):
    """Set a chapter's status; finishing it activates the next locked chapter. Returns the chapter or None."""
    try:
        uuid.UUID(chapter_id)
    except ValueError:
        return None
    with connect() as conn:
        row = conn.execute(
            "UPDATE chapters SET status = %s WHERE id = %s "
            "RETURNING id, campaign_id, position, title, concepts_json, villains_json, status",
            (status, chapter_id),
        ).fetchone()
        if row is None:
            return None
        if status == "done":
            conn.execute(
                "UPDATE chapters SET status = 'active' "
                "WHERE campaign_id = %s AND position = %s AND status = 'locked'",
                (row["campaign_id"], row["position"] + 1),
            )
    return _chapter(row)

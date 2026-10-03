import os
from pathlib import Path

import psycopg
import pytest

import config  # noqa: F401  (loads .env)

SCHEMA = Path(__file__).parent.parent / "schema.sql"
pytestmark = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="DATABASE_URL not set")


def test_schema_creates_expected_tables_and_columns():
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        conn.execute(SCHEMA.read_text())
        rows = conn.execute(
            "SELECT table_name, column_name FROM information_schema.columns "
            "WHERE table_schema = current_schema()"
        ).fetchall()
        conn.rollback()  # leave the database untouched
    cols = {}
    for table, column in rows:
        cols.setdefault(table, set()).add(column)
    assert {"id", "title", "notes_text", "campaign_json", "created_at"} <= cols["campaigns"]
    assert {"id", "campaign_id", "position", "title", "concepts_json", "villains_json", "status"} <= cols["chapters"]
    assert {"id", "campaign_id", "planned_minutes", "started_at", "ended_at"} <= cols["sessions"]
    assert {"id", "chapter_id", "concept", "mode", "verdict", "created_at"} <= cols["attempts"]

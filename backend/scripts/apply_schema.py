"""Apply schema.sql. Run from backend/: python scripts/apply_schema.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import db


def main():
    with db.connect() as conn:
        conn.execute((Path(__file__).parent.parent / "schema.sql").read_text())
        rows = conn.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1"
        ).fetchall()
    print("tables:", [r["table_name"] for r in rows])


if __name__ == "__main__":
    main()

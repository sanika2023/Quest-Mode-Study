"""One real call to each service. Run from backend/: python scripts/smoke_test.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import db
from services import gemini_client


def main():
    with db.connect() as conn:
        print("db:", conn.execute("SELECT version()").fetchone()["version"])
    print("gemini:", gemini_client.generate_json('Reply with JSON {"ok": true}'))


if __name__ == "__main__":
    main()

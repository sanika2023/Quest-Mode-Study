import logging

from flask import Blueprint, jsonify, request

import db
from services import review_service

bp = Blueprint("review", __name__)
log = logging.getLogger(__name__)


def _error(message, status):
    return jsonify(error=message), status


def _valid_transcript(transcript):
    return isinstance(transcript, list) and all(
        isinstance(t, dict) and t.get("role") in ("character", "student") and isinstance(t.get("text"), str)
        for t in transcript
    )


@bp.post("/api/review/turn")
def review_turn():
    data = request.get_json(silent=True) or {}
    mode = data.get("mode")
    transcript = data.get("transcript", [])
    if mode not in ("quiz", "teachback"):
        return _error("mode must be quiz or teachback", 400)
    if not _valid_transcript(transcript):
        return _error("transcript must be a list of {role, text}", 400)
    chapter = db.get_chapter(str(data.get("chapter_id")))
    if chapter is None:
        return _error("Chapter not found", 404)
    try:
        return jsonify(review_service.next_turn(chapter, mode, transcript, data.get("message"), data.get("skip") is True))
    except ValueError as e:
        return _error(str(e), 400)
    except Exception:
        log.exception("review turn failed")
        return _error("The character is unavailable. Please try again.", 502)

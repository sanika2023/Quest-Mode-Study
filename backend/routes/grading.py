import logging

from flask import Blueprint, jsonify, request

import db
from routes.review import valid_transcript
from services import grading_service

bp = Blueprint("grading", __name__)
log = logging.getLogger(__name__)


def _error(message, status):
    return jsonify(error=message), status


@bp.post("/api/chapters/<chapter_id>/grade")
def grade_chapter(chapter_id):
    data = request.get_json(silent=True) or {}
    mode = data.get("mode")
    transcript = data.get("transcript")
    if mode not in ("quiz", "teachback"):
        return _error("mode must be quiz or teachback", 400)
    if not valid_transcript(transcript):
        return _error("transcript must be a list of {role, text}", 400)
    practice = data.get("practice", False)
    if not isinstance(practice, bool):
        return _error("practice must be a boolean", 400)
    chapter = db.get_chapter(chapter_id)
    if chapter is None:
        return _error("Chapter not found", 404)
    try:
        results = grading_service.grade(chapter, mode, transcript, db.get_notes(chapter_id))
    except ValueError as e:
        return _error(str(e), 400)
    except Exception:
        log.exception("grading failed")
        return _error("Grading failed. Please try again.", 502)
    # Practice runs (demo breaks) leave attempts and villains untouched.
    if not practice:
        db.record_grading(chapter_id, mode, results, grading_service.villains_for(chapter, results))
    return jsonify(results=results)

import logging

from flask import Blueprint, jsonify, request

import db
from services import campaign_service, pdf_text

bp = Blueprint("campaigns", __name__)
log = logging.getLogger(__name__)


def _error(message, status):
    return jsonify(error=message), status


@bp.post("/api/campaigns")
def create_campaign():
    data = request.get_json(silent=True) if request.is_json else request.form
    try:
        planned_minutes = int(data.get("planned_minutes"))
    except (TypeError, ValueError):
        return _error("planned_minutes must be a number", 400)
    if planned_minutes <= 0:
        return _error("planned_minutes must be positive", 400)

    notes_text = data.get("notes_text")
    topic = data.get("topic")
    if "file" in request.files:
        notes_text = pdf_text.extract_text(request.files["file"])
        if not notes_text.strip():
            return _error("No text found in the PDF. Try a text-based PDF or paste the notes.", 400)
    if not (notes_text and notes_text.strip()) and not (topic and topic.strip()):
        return _error("Provide notes_text, a PDF file, or a topic", 400)
    if notes_text is not None and not notes_text.strip():
        notes_text = None

    try:
        campaign = campaign_service.generate_campaign(planned_minutes, notes_text=notes_text, topic=topic)
    except Exception:
        log.exception("campaign generation failed")
        return _error("Campaign generation failed. Please try again.", 502)
    campaign_id = db.save_campaign(campaign, notes_text)
    return jsonify(db.get_campaign(campaign_id)), 201


@bp.patch("/api/chapters/<chapter_id>")
def update_chapter(chapter_id):
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("locked", "active", "done"):
        return _error("status must be locked, active, or done", 400)
    chapter = db.update_chapter_status(chapter_id, status)
    if chapter is None:
        return _error("Chapter not found", 404)
    return jsonify(chapter)


@bp.get("/api/campaigns/<campaign_id>")
def get_campaign(campaign_id):
    campaign = db.get_campaign(campaign_id)
    if campaign is None:
        return _error("Campaign not found", 404)
    return jsonify(campaign)

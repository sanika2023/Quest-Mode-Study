from pypdf import PdfReader


def extract_text(file) -> str:
    return "\n".join(page.extract_text() or "" for page in PdfReader(file).pages)

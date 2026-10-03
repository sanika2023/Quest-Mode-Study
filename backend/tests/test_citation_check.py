from services.citation_check import citation_check

NOTES = "The mitochondria is the powerhouse of the cell.\n\nIt produces ATP — the cell's energy currency."


def test_exact_quote_passes():
    assert citation_check("The mitochondria is the powerhouse of the cell.", NOTES)


def test_paraphrase_fails():
    assert not citation_check("Mitochondria generate most of a cell's power.", NOTES)


def test_case_difference_passes():
    assert citation_check("THE MITOCHONDRIA IS THE POWERHOUSE", NOTES)


def test_whitespace_difference_passes():
    assert citation_check("powerhouse   of\nthe cell.  It produces ATP", NOTES)


def test_curly_quotes_and_dashes_pass():
    assert citation_check("It produces ATP - the cell’s energy currency.", NOTES)
    curly_notes = "She said “hello” to the cell’s nucleus."
    assert citation_check('She said "hello" to the cell\'s nucleus.', curly_notes)


def test_empty_quote_fails():
    assert not citation_check("", NOTES)
    assert not citation_check("   ", NOTES)

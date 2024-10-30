INSERT INTO
    authors (
        first_name,
        last_name,
        username,
        email,
        website,
        affiliation
    )
VALUES
    (?, ?, ?, ?, ?, ?);

INSERT INTO
    papers (
        paper_title,
        published_in,
        date,
        keywords_raw,
        abstract,
        paper_reference,
        lingbuzz_id,
        download_link
    )
VALUES
    (?, ?, ?, ?, ?, ?, ?, ?);

INSERT INTO
    keywords (keyword)
VALUES
    (?);

INSERT INTO
    papers_authors (paper_id, author_id)
VALUES
    (?, ?);

INSERT INTO
    papers_keywords (paper_id, keyword_id)
VALUES
    (?, ?);
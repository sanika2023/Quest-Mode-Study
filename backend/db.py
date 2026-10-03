import os

import psycopg
from psycopg.rows import dict_row

import config  # noqa: F401  (loads .env)


def connect():
    return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)

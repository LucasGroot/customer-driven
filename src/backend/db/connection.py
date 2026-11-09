import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv

load_dotenv()


@contextmanager
def get_conn():
    """One connection per use: committed when the block ends, rolled back on error."""
    conn = psycopg2.connect(
        dbname=os.getenv("DBNAME"), user=os.getenv("DBUSER"),
        password=os.getenv("DBPASSWORD"), host=os.getenv("DBHOST"),
    )
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
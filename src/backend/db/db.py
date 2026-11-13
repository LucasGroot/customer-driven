import os
from contextlib import contextmanager
import psycopg2
from dotenv import load_dotenv
from datetime import date

load_dotenv()

@contextmanager
def get_conn():
    conn = psycopg2.connect(
        dbname=os.getenv("DBNAME"), user=os.getenv("DBUSER"),
        password=os.getenv("DBPASSWORD"), host=os.getenv("DBHOST"),
    )
    try:
        yield conn
        conn.commit()      # tout ou rien
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

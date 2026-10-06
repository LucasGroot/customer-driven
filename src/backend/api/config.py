import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Everything the API needs to know about its environment."""

    tenant_id: str
    client_id: str
    admin_emails: frozenset[str]
    allowed_origin: str


def parse_admin_emails(raw: str) -> frozenset[str]:
    """
    Turn a comma-separated list into a set of lower-cased emails.

    Emails are compared case-insensitively, so they are stored lower-cased.
    """
    return frozenset(email.strip().lower() for email in raw.split(",") if email.strip())


def load_settings() -> Settings:
    """
    Read the settings from the environment.

    Raises a clear error at startup instead of failing on the first request.
    """
    missing = [name for name in ("ENTRA_TENANT_ID", "ENTRA_CLIENT_ID") if not os.environ.get(name)]
    if missing:
        raise RuntimeError(f"Missing environment variables: {', '.join(missing)}")
    return Settings(
        tenant_id=os.environ["ENTRA_TENANT_ID"],
        client_id=os.environ["ENTRA_CLIENT_ID"],
        admin_emails=parse_admin_emails(os.environ.get("ADMIN_EMAILS", "")),
        allowed_origin=os.environ.get("ALLOWED_ORIGIN", "http://localhost:5173"),
    )

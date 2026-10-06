"""
Decides which role a signed-in user has.
"""

from typing import Literal

Role = Literal["user", "admin"]


def role_for(email: str, admin_emails: frozenset[str]) -> Role:
    """
    Return "admin" if the email is on the admin list, otherwise "user".

    The list is lower-cased when loaded, so the email is lower-cased here too.
    """
    return "admin" if email.lower() in admin_emails else "user"

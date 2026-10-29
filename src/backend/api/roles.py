"""
Decides which role a signed-in user has, from the app roles assigned to them
in Entra (see README).
"""

from typing import Literal

Role = Literal["user", "admin"]


def role_from_token(token_roles: list[str]) -> Role | None:
    """
    Return the highest role in the token's roles claim, or None if it has none.

    A user can be assigned both roles in Entra; admin includes what a user can do.
    """
    if "admin" in token_roles:
        return "admin"
    if "user" in token_roles:
        return "user"
    return None

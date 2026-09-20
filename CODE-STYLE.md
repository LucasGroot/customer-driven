# Code Style Conventions

This file describes the code styling conventions used in this project.

## Rules

- **File header**: A short description of what the file does should be placed at the top of the code file.
- **Function spacing**: Leave two blank lines between functions.
- **Docstrings**: Include a concise description after `def`, no longer than 5 lines.
- **Blank lines within functions**: At most one blank line within a function body.
- **Comments**: Use one-line comments within functions to clarify non-obvious steps.

## Python Example

```python
"""
This file handles user authentication, including password hashing
and login validation against the database.
"""


def hash_password(password):
    """
    Hash a plaintext password using a secure algorithm.

    Returns the hashed password as a string.
    """
    salt = generate_salt()
    # Combine password and salt before hashing
    combined = password + salt

    hashed = sha256(combined)
    return hashed


def verify_password(password, hashed):
    """
    Check whether a plaintext password matches a given hash.

    Returns True if valid, False otherwise.
    """
    salt = extract_salt(hashed)
    candidate = hash_password(password)
    # Compare the newly hashed password with the stored hash
    return candidate == hashed
```

## Other examples
**TODO**
"""Create the first admin account, or promote an existing user to admin.

Public registration can only create USER accounts, so admins are bootstrapped from the command line
by someone with access to the server and its database.

Usage (from backend/, virtualenv active):
    python -m scripts.create_admin --email admin@example.com --name "Admin User"

The password is read from the ADMIN_PASSWORD environment variable, or prompted for securely.
"""

import argparse
import getpass
import os
import sys

from pydantic import ValidationError

from app.database.session import SessionLocal
from app.models import UserRole
from app.schemas.user import UserCreate
from app.services import auth_service


def main() -> int:
    parser = argparse.ArgumentParser(description="Create or promote a TaskFlow admin account.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", default="Administrator")
    args = parser.parse_args()

    with SessionLocal() as db:
        existing = auth_service.get_user_by_email(db, args.email.lower())
        if existing is not None:
            existing.role = UserRole.ADMIN
            db.commit()
            print(f"Promoted existing user {existing.email} to ADMIN.")
            return 0

        password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Admin password (min 8 characters): ")
        try:
            data = UserCreate(full_name=args.name, email=args.email, password=password)
        except ValidationError as exc:
            print(f"Invalid input:\n{exc}", file=sys.stderr)
            return 1

        user = auth_service.register_user(db, data, role=UserRole.ADMIN)
        print(f"Created admin {user.email} (id={user.id}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

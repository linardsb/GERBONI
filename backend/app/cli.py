#!/usr/bin/env python3
"""
CLI tool for admin management in GERBONI.

Usage:
    python -m app.cli promote-admin <email>
    python -m app.cli promote-superadmin <email>
    python -m app.cli demote <email>
    python -m app.cli list-admins
"""
import argparse
import asyncio
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import async_session_maker
from .models.user import User, UserRole


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Fetch user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def promote_admin(email: str) -> None:
    """Promote user to admin role."""
    async with async_session_maker() as db:
        user = await get_user_by_email(db, email)
        if not user:
            print(f"Error: User '{email}' not found.")
            sys.exit(1)

        if user.role == UserRole.ADMIN.value:
            print(f"User '{email}' is already an admin.")
            return

        if user.role == UserRole.SUPER_ADMIN.value:
            print(f"User '{email}' is already a super_admin (higher than admin).")
            return

        user.role = UserRole.ADMIN.value
        await db.commit()
        print(f"Successfully promoted '{email}' to admin.")


async def promote_superadmin(email: str) -> None:
    """Promote user to super_admin role."""
    async with async_session_maker() as db:
        user = await get_user_by_email(db, email)
        if not user:
            print(f"Error: User '{email}' not found.")
            sys.exit(1)

        if user.role == UserRole.SUPER_ADMIN.value:
            print(f"User '{email}' is already a super_admin.")
            return

        user.role = UserRole.SUPER_ADMIN.value
        await db.commit()
        print(f"Successfully promoted '{email}' to super_admin.")


async def demote_user(email: str) -> None:
    """Demote user to customer role."""
    async with async_session_maker() as db:
        user = await get_user_by_email(db, email)
        if not user:
            print(f"Error: User '{email}' not found.")
            sys.exit(1)

        if user.role == UserRole.CUSTOMER.value:
            print(f"User '{email}' is already a customer.")
            return

        # Safety check: prevent demoting the last super_admin
        if user.role == UserRole.SUPER_ADMIN.value:
            result = await db.execute(
                select(User).where(User.role == UserRole.SUPER_ADMIN.value)
            )
            super_admins = result.scalars().all()
            if len(super_admins) <= 1:
                print("Error: Cannot demote the last super_admin.")
                sys.exit(1)

        old_role = user.role
        user.role = UserRole.CUSTOMER.value
        await db.commit()
        print(f"Successfully demoted '{email}' from {old_role} to customer.")


async def list_admins() -> None:
    """List all admin and super_admin users."""
    async with async_session_maker() as db:
        result = await db.execute(
            select(User).where(
                User.role.in_([UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value])
            )
        )
        admins = result.scalars().all()

        if not admins:
            print("No admin users found.")
            return

        print(f"\n{'Email':<40} {'Role':<15} {'Active':<8} {'Created'}")
        print("-" * 80)
        for admin in admins:
            created = admin.created_at.strftime("%Y-%m-%d %H:%M") if admin.created_at else "N/A"
            active = "Yes" if admin.is_active else "No"
            print(f"{admin.email:<40} {admin.role:<15} {active:<8} {created}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="GERBONI Admin Management CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python -m app.cli promote-admin user@example.com
    python -m app.cli promote-superadmin linardsberzins@gmail.com
    python -m app.cli demote user@example.com
    python -m app.cli list-admins
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # promote-admin command
    promote_admin_parser = subparsers.add_parser(
        "promote-admin", help="Promote user to admin role"
    )
    promote_admin_parser.add_argument("email", help="Email of the user to promote")

    # promote-superadmin command
    promote_superadmin_parser = subparsers.add_parser(
        "promote-superadmin", help="Promote user to super_admin role"
    )
    promote_superadmin_parser.add_argument("email", help="Email of the user to promote")

    # demote command
    demote_parser = subparsers.add_parser(
        "demote", help="Demote user to customer role"
    )
    demote_parser.add_argument("email", help="Email of the user to demote")

    # list-admins command
    subparsers.add_parser("list-admins", help="List all admin users")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "promote-admin":
        asyncio.run(promote_admin(args.email))
    elif args.command == "promote-superadmin":
        asyncio.run(promote_superadmin(args.email))
    elif args.command == "demote":
        asyncio.run(demote_user(args.email))
    elif args.command == "list-admins":
        asyncio.run(list_admins())


if __name__ == "__main__":
    main()

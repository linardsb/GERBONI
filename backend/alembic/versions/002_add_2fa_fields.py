"""Add 2FA fields to users

Revision ID: 002_add_2fa_fields
Revises: 001_add_user_role
Create Date: 2026-02-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_2fa_fields'
down_revision: Union[str, None] = '001_add_user_role'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('two_factor_enabled', sa.Boolean(), nullable=False, server_default='false')
    )
    op.add_column(
        'users',
        sa.Column('two_factor_secret', sa.String(64), nullable=True)
    )
    op.add_column(
        'users',
        sa.Column('backup_codes', sa.String(500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('users', 'backup_codes')
    op.drop_column('users', 'two_factor_secret')
    op.drop_column('users', 'two_factor_enabled')

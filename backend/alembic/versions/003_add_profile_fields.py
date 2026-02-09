"""Add profile fields to users

Revision ID: 003_add_profile_fields
Revises: 002_add_2fa_fields
Create Date: 2026-02-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_add_profile_fields'
down_revision: Union[str, None] = '002_add_2fa_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('display_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(30), nullable=True))
    op.add_column('users', sa.Column('birthday', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('preferred_size', sa.String(10), nullable=True))
    op.add_column('users', sa.Column('preferred_colors', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('preferred_cities', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'preferred_cities')
    op.drop_column('users', 'preferred_colors')
    op.drop_column('users', 'preferred_size')
    op.drop_column('users', 'birthday')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'display_name')

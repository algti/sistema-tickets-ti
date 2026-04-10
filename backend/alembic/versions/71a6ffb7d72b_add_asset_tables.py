"""add_asset_tables

Revision ID: 71a6ffb7d72b
Revises: 31a761281fa3
Create Date: 2026-04-09 23:26:24.971895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '71a6ffb7d72b'
down_revision: Union[str, Sequence[str], None] = '31a761281fa3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create asset_categories table
    op.create_table(
        'asset_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_asset_categories_id'), 'asset_categories', ['id'], unique=False)
    
    # Create assets table
    op.create_table(
        'assets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('asset_tag', sa.String(length=100), nullable=False),
        sa.Column('serial_number', sa.String(length=255), nullable=True),
        sa.Column('status', sa.Enum('active', 'maintenance', 'retired', name='assetstatus'), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('purchase_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('warranty_expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('purchase_cost', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('in_maintenance', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('assigned_to_id', sa.Integer(), nullable=True),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['category_id'], ['asset_categories.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('asset_tag')
    )
    op.create_index(op.f('ix_assets_asset_tag'), 'assets', ['asset_tag'], unique=True)
    op.create_index(op.f('ix_assets_id'), 'assets', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_assets_id'), table_name='assets')
    op.drop_index(op.f('ix_assets_asset_tag'), table_name='assets')
    op.drop_table('assets')
    op.drop_index(op.f('ix_asset_categories_id'), table_name='asset_categories')
    op.drop_table('asset_categories')
    op.execute('DROP TYPE IF EXISTS assetstatus')

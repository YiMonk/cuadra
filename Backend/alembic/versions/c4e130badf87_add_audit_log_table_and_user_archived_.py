"""add audit_log table and user archived field

Revision ID: c4e130badf87
Revises: 96d75e3b390e
Create Date: 2026-06-10 16:00:09.635230

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e130badf87'
down_revision: Union[str, Sequence[str], None] = '96d75e3b390e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from alembic import context
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # Create audit_log table only if it doesn't exist
    if 'audit_log' not in existing_tables:
        op.create_table(
            'audit_log',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('company_id', sa.String(), nullable=False),
            sa.Column('user_id', sa.String(), nullable=False),
            sa.Column('user_name', sa.String(), nullable=False),
            sa.Column('action', sa.String(), nullable=False),
            sa.Column('entity_type', sa.String(), nullable=False),
            sa.Column('entity_id', sa.String(), nullable=False),
            sa.Column('payload_before', sa.Text(), nullable=True),
            sa.Column('payload_after', sa.Text(), nullable=True),
            sa.Column('ip', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_audit_log_company_created', 'audit_log', ['company_id', 'created_at'])
        op.create_index('ix_audit_log_company_user', 'audit_log', ['company_id', 'user_id'])
        op.create_index('ix_audit_log_company_entity_type', 'audit_log', ['company_id', 'entity_type'])

    # Add archived field to users if it doesn't exist
    existing_columns = [c['name'] for c in inspector.get_columns('users')]
    if 'archived' not in existing_columns:
        op.add_column('users', sa.Column('archived', sa.Boolean(), nullable=False, server_default=sa.text('0')))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_audit_log_company_entity_type', table_name='audit_log')
    op.drop_index('ix_audit_log_company_user', table_name='audit_log')
    op.drop_index('ix_audit_log_company_created', table_name='audit_log')
    op.drop_table('audit_log')
    op.drop_column('users', 'archived')

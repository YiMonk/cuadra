import json
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.access_account import (
    AccessAccountCreate,
    AccessAccountUpdate,
)
from app.services.auth_service import hash_password


async def create_access_account(
    db: AsyncSession, company_id: str, data: AccessAccountCreate
) -> User:
    """Create a new access account for a company."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="email already registered")

    # Create access account user
    user = User(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password),
        role=data.role,
        owner_id=company_id,  # multi-tenancy: owner_id = company_id
        company_id=company_id,  # access account is bound to company
        module_access=json.dumps(data.module_access),
        active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def list_access_accounts(db: AsyncSession, company_id: str) -> list[User]:
    """List all access accounts for a company."""
    result = await db.execute(
        select(User)
        .where(User.company_id == company_id)
        .order_by(User.created_at)
    )
    return result.scalars().all()


async def get_access_account_by_id(
    db: AsyncSession, account_id: str, company_id: str
) -> User | None:
    """Get a specific access account by ID, verifying it belongs to the company."""
    result = await db.execute(
        select(User).where(User.id == account_id, User.company_id == company_id)
    )
    return result.scalar_one_or_none()


async def update_access_account(
    db: AsyncSession, account: User, data: AccessAccountUpdate
) -> User:
    """Update an access account."""
    updates = data.model_dump(exclude_unset=True)
    if "module_access" in updates:
        updates["module_access"] = json.dumps(updates["module_access"])
    for k, v in updates.items():
        setattr(account, k, v)
    await db.commit()
    await db.refresh(account)
    return account


async def set_account_password(
    db: AsyncSession, account: User, new_password: str
) -> User:
    """Update an access account's password."""
    account.password_hash = hash_password(new_password)
    await db.commit()
    await db.refresh(account)
    return account


async def set_account_status(
    db: AsyncSession, account: User, active: bool
) -> User:
    """Enable or disable an access account."""
    account.active = active
    await db.commit()
    await db.refresh(account)
    return account

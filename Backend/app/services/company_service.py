import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate


async def create_company(db: AsyncSession, owner_user_id: str, data: CompanyCreate) -> Company:
    company = Company(
        owner_user_id=owner_user_id,
        name=data.name,
        rif=data.rif,
        modules_enabled=json.dumps(data.modules_enabled),
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


async def get_companies_by_owner(db: AsyncSession, owner_user_id: str) -> list[Company]:
    result = await db.execute(
        select(Company)
        .where(Company.owner_user_id == owner_user_id)
        .order_by(Company.created_at)
    )
    return result.scalars().all()


async def get_company_by_id(db: AsyncSession, company_id: str, owner_user_id: str) -> Company | None:
    result = await db.execute(
        select(Company).where(
            Company.id == company_id,
            Company.owner_user_id == owner_user_id,
        )
    )
    return result.scalar_one_or_none()


async def update_company(db: AsyncSession, company: Company, data: CompanyUpdate) -> Company:
    updates = data.model_dump(exclude_unset=True)
    if "modules_enabled" in updates:
        updates["modules_enabled"] = json.dumps(updates["modules_enabled"])
    for k, v in updates.items():
        setattr(company, k, v)
    await db.commit()
    await db.refresh(company)
    return company

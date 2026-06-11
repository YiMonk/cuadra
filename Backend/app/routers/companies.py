from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user, get_db, require_roles
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.services import company_service

router = APIRouter(prefix="/api/v1/companies", tags=["companies"])


@router.post("", response_model=CompanyOut, status_code=201, dependencies=[Depends(require_roles("owner"))])
async def create_company(
    body: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await company_service.create_company(db, user.id, body)


@router.get("", response_model=list[CompanyOut], dependencies=[Depends(require_roles("owner"))])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await company_service.get_companies_by_owner(db, user.id)


@router.get("/{company_id}", response_model=CompanyOut, dependencies=[Depends(require_roles("owner"))])
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(404, "empresa no encontrada")
    return company


@router.patch("/{company_id}", response_model=CompanyOut, dependencies=[Depends(require_roles("owner"))])
async def update_company(
    company_id: str,
    body: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    company = await company_service.get_company_by_id(db, company_id, user.id)
    if not company:
        raise HTTPException(404, "empresa no encontrada")
    return await company_service.update_company(db, company, body)


@router.delete("/{company_id}", status_code=405)
async def delete_company_not_allowed():
    raise HTTPException(405, "las empresas no se pueden eliminar")

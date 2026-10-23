from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.options import OptionsResponse
from app.services.options import get_options

router = APIRouter(prefix="/options", tags=["options"])


@router.get("", response_model=OptionsResponse)
def options_endpoint(db: Annotated[Session, Depends(get_db)]):
    return get_options(db)

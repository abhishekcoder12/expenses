"""Request/response validation schemas."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterUser(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginUser(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=50)
    payment_method: str = Field(min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)
    expense_date: date


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=2, max_length=50)
    payment_method: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)
    expense_date: Optional[date] = None


class IncomeCreate(BaseModel):
    amount: float = Field(gt=0)
    source: str = Field(min_length=2, max_length=80)
    note: Optional[str] = Field(default=None, max_length=255)
    income_date: date


class IncomeUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    source: Optional[str] = Field(default=None, min_length=2, max_length=80)
    note: Optional[str] = Field(default=None, max_length=255)
    income_date: Optional[date] = None

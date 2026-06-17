"""Income / salary CRUD routes."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user_id
from database import supabase
from schemas import IncomeCreate, IncomeUpdate

router = APIRouter(prefix="/income", tags=["Income"])


def serialize_income_data(income: IncomeCreate | IncomeUpdate) -> dict:
    data = income.model_dump(exclude_unset=True)
    if "income_date" in data and data["income_date"] is not None:
        data["income_date"] = str(data["income_date"])
    return data


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_income(
    income: IncomeCreate,
    user_id: str = Depends(get_current_user_id),
):
    new_income = serialize_income_data(income)
    new_income["user_id"] = user_id

    response = supabase.table("income").insert(new_income).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Could not add income")

    return {
        "message": "Income added successfully",
        "income": response.data[0],
    }


@router.get("/")
def get_income(
    user_id: str = Depends(get_current_user_id),
    source: Optional[str] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
):
    query = supabase.table("income").select("*").eq("user_id", user_id)

    if source and source.lower() != "all":
        query = query.eq("source", source)

    if start_date:
        query = query.gte("income_date", str(start_date))

    if end_date:
        query = query.lte("income_date", str(end_date))

    response = query.order("income_date", desc=True).order("created_at", desc=True).execute()

    return {"income": response.data or []}


@router.get("/summary/total")
def income_total(user_id: str = Depends(get_current_user_id)):
    response = (
        supabase.table("income")
        .select("amount")
        .eq("user_id", user_id)
        .execute()
    )

    total = sum(float(item["amount"]) for item in (response.data or []))

    return {"total_income": round(total, 2)}


@router.get("/{income_id}")
def get_single_income(
    income_id: str,
    user_id: str = Depends(get_current_user_id),
):
    response = (
        supabase.table("income")
        .select("*")
        .eq("id", income_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Income record not found")

    return response.data[0]


@router.put("/{income_id}")
def update_income(
    income_id: str,
    income: IncomeUpdate,
    user_id: str = Depends(get_current_user_id),
):
    update_data = serialize_income_data(income)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    existing = (
        supabase.table("income")
        .select("id")
        .eq("id", income_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Income record not found")

    response = (
        supabase.table("income")
        .update(update_data)
        .eq("id", income_id)
        .eq("user_id", user_id)
        .execute()
    )

    return {
        "message": "Income updated successfully",
        "income": response.data[0],
    }


@router.delete("/{income_id}")
def delete_income(
    income_id: str,
    user_id: str = Depends(get_current_user_id),
):
    existing = (
        supabase.table("income")
        .select("id")
        .eq("id", income_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Income record not found")

    supabase.table("income").delete().eq("id", income_id).eq("user_id", user_id).execute()

    return {"message": "Income deleted successfully"}

"""Expense CRUD and summary routes."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user_id
from database import supabase
from schemas import ExpenseCreate, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def serialize_expense_data(expense: ExpenseCreate | ExpenseUpdate) -> dict:
    data = expense.model_dump(exclude_unset=True)
    if "expense_date" in data and data["expense_date"] is not None:
        data["expense_date"] = str(data["expense_date"])
    return data


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_expense(
    expense: ExpenseCreate,
    user_id: str = Depends(get_current_user_id),
):
    new_expense = serialize_expense_data(expense)
    new_expense["user_id"] = user_id

    response = supabase.table("expenses").insert(new_expense).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Could not add expense")

    return {
        "message": "Expense added successfully",
        "expense": response.data[0],
    }


@router.get("/")
def get_expenses(
    user_id: str = Depends(get_current_user_id),
    category: Optional[str] = Query(default=None),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
):
    query = supabase.table("expenses").select("*").eq("user_id", user_id)

    if category and category.lower() != "all":
        query = query.eq("category", category)

    if start_date:
        query = query.gte("expense_date", str(start_date))

    if end_date:
        query = query.lte("expense_date", str(end_date))

    response = query.order("expense_date", desc=True).order("created_at", desc=True).execute()

    return {"expenses": response.data or []}


@router.get("/summary/monthly-total")
def monthly_total(user_id: str = Depends(get_current_user_id)):
    today = date.today()
    month_start = today.replace(day=1)

    response = (
        supabase.table("expenses")
        .select("amount")
        .eq("user_id", user_id)
        .gte("expense_date", str(month_start))
        .lte("expense_date", str(today))
        .execute()
    )

    total = sum(float(item["amount"]) for item in (response.data or []))

    return {
        "month": today.month,
        "year": today.year,
        "total_expense": round(total, 2),
    }


@router.get("/summary/category-total")
def category_total(user_id: str = Depends(get_current_user_id)):
    response = (
        supabase.table("expenses")
        .select("category, amount")
        .eq("user_id", user_id)
        .execute()
    )

    totals: dict[str, float] = {}
    for row in response.data or []:
        category = row["category"]
        totals[category] = totals.get(category, 0) + float(row["amount"])

    return {
        "category_totals": [
            {"category": category, "total": round(total, 2)}
            for category, total in sorted(totals.items())
        ]
    }


@router.get("/{expense_id}")
def get_single_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user_id),
):
    response = (
        supabase.table("expenses")
        .select("*")
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Expense not found")

    return response.data[0]


@router.put("/{expense_id}")
def update_expense(
    expense_id: str,
    expense: ExpenseUpdate,
    user_id: str = Depends(get_current_user_id),
):
    update_data = serialize_expense_data(expense)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    existing = (
        supabase.table("expenses")
        .select("id")
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")

    response = (
        supabase.table("expenses")
        .update(update_data)
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )

    return {
        "message": "Expense updated successfully",
        "expense": response.data[0],
    }


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user_id),
):
    existing = (
        supabase.table("expenses")
        .select("id")
        .eq("id", expense_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Expense not found")

    supabase.table("expenses").delete().eq("id", expense_id).eq("user_id", user_id).execute()

    return {"message": "Expense deleted successfully"}

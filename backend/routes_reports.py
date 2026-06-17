"""Dashboard and chart/report routes."""

from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends

from auth import get_current_user_id
from database import supabase

router = APIRouter(prefix="/reports", tags=["Reports"])


def _rows(table: str, user_id: str, columns: str = "*") -> list[dict]:
    response = supabase.table(table).select(columns).eq("user_id", user_id).execute()
    return response.data or []


def _month_label(value: str | None) -> str:
    # Supabase returns date as YYYY-MM-DD. Keeping YYYY-MM makes chart grouping simple.
    return value[:7] if value else "Unknown"


@router.get("/overview")
def overview(user_id: str = Depends(get_current_user_id)):
    today = date.today()
    month_start = today.replace(day=1)

    expenses = _rows("expenses", user_id, "amount, category, expense_date")
    incomes = _rows("income", user_id, "amount, source, income_date")

    total_expense = sum(float(row["amount"]) for row in expenses)
    total_income = sum(float(row["amount"]) for row in incomes)

    current_month_expense = sum(
        float(row["amount"])
        for row in expenses
        if str(month_start) <= row.get("expense_date", "") <= str(today)
    )
    current_month_income = sum(
        float(row["amount"])
        for row in incomes
        if str(month_start) <= row.get("income_date", "") <= str(today)
    )

    category_totals: dict[str, float] = defaultdict(float)
    for row in expenses:
        category_totals[row.get("category") or "Other"] += float(row["amount"])

    top_category = None
    if category_totals:
        category, total = max(category_totals.items(), key=lambda item: item[1])
        top_category = {"category": category, "total": round(total, 2)}

    highest_expense = max([float(row["amount"]) for row in expenses], default=0)

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "available_balance": round(total_income - total_expense, 2),
        "savings": round(total_income - total_expense, 2),
        "current_month_income": round(current_month_income, 2),
        "current_month_expense": round(current_month_expense, 2),
        "current_month_savings": round(current_month_income - current_month_expense, 2),
        "expense_records": len(expenses),
        "income_records": len(incomes),
        "highest_expense": round(highest_expense, 2),
        "top_category": top_category,
    }


@router.get("/category-breakdown")
def category_breakdown(user_id: str = Depends(get_current_user_id)):
    expenses = _rows("expenses", user_id, "amount, category")
    totals: dict[str, float] = defaultdict(float)

    for row in expenses:
        totals[row.get("category") or "Other"] += float(row["amount"])

    return {
        "category_totals": [
            {"category": category, "total": round(total, 2)}
            for category, total in sorted(totals.items(), key=lambda item: item[1], reverse=True)
        ]
    }


@router.get("/monthly-trend")
def monthly_trend(user_id: str = Depends(get_current_user_id)):
    expenses = _rows("expenses", user_id, "amount, expense_date")
    incomes = _rows("income", user_id, "amount, income_date")

    months = set()
    expense_by_month: dict[str, float] = defaultdict(float)
    income_by_month: dict[str, float] = defaultdict(float)

    for row in expenses:
        month = _month_label(row.get("expense_date"))
        months.add(month)
        expense_by_month[month] += float(row["amount"])

    for row in incomes:
        month = _month_label(row.get("income_date"))
        months.add(month)
        income_by_month[month] += float(row["amount"])

    return {
        "months": [
            {
                "month": month,
                "income": round(income_by_month[month], 2),
                "expense": round(expense_by_month[month], 2),
                "savings": round(income_by_month[month] - expense_by_month[month], 2),
            }
            for month in sorted(months)[-12:]
        ]
    }

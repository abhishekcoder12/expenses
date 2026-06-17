# Smart Expense Tracker - Level 2

A beginner-friendly full-stack expense tracker with:

- FastAPI backend
- Supabase PostgreSQL database
- Static HTML/CSS/JavaScript frontend served by FastAPI
- JWT register/login/auth protection
- User-specific data
- Salary/income tracking
- Expense CRUD
- Savings/balance block
- Dashboard charts for category spending and monthly trend
- Postman collection for API testing

## 1. Setup Supabase

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Copy and run `docs/database.sql`.
4. Go to **Project Settings → API**.
5. Copy:
   - `Project URL`
   - `service_role` key

Use the `service_role` key only in the backend `.env` file. Never place it in frontend JavaScript or public GitHub.

## 2. Setup Backend

Open terminal inside the project:

```bash
cd backend
python -m venv .venv
```

Activate virtual environment on Windows:

```bash
.venv\Scripts\activate
```

Activate on macOS/Linux:

```bash
source .venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Create `.env`:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Fill `.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SECRET_KEY=put_any_long_random_secret_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run app:

```bash
uvicorn main:app --reload
```

## 3. Open App

Frontend:

```text
http://127.0.0.1:8000
```

Swagger API docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

## 4. Import Postman Collection

1. Open Postman.
2. Click **Import**.
3. Import `docs/postman_collection.json`.
4. Run `Register User` or `Login User`.
5. The login/register request saves the JWT token automatically in collection variable `access_token`.
6. Run protected APIs like add salary, add expense, overview, and charts.

## Features Added

### JWT Authentication

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- Protected routes use `Authorization: Bearer <token>`.
- Frontend stores token in `localStorage` and sends it automatically.

### Salary / Income

- Add salary more than once.
- Add freelance, bonus, business income, gift, or other income.
- Edit/delete salary records.

### Expenses & Savings Logic

The app does not manually update a balance column. It calculates balance safely like this:

```text
Savings / Available Balance = Total Income - Total Expenses
```

So whenever you add salary, balance increases. Whenever you add expense, balance decreases.

### Charts

- Expense by category chart
- Monthly income vs expense chart
- Shows where spending is high/low and which category takes the most money

## Project Structure

```text
smart-expense-supabase-level1/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── auth.py
│   ├── schemas.py
│   ├── routes_auth.py
│   ├── routes_expenses.py
│   ├── routes_income.py
│   ├── routes_reports.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── docs/
    ├── database.sql
    ├── postman_collection.json
    └── README.md
```

## Important Notes

- Run `docs/database.sql` again after replacing the files, because income table is new.
- Keep `SUPABASE_SERVICE_ROLE_KEY` private.
- Use Python 3.10+.
- The app uses normal HTML/CSS/JS, so you do not need React for this version.

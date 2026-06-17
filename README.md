# Smart Expense Tracker Level 2

Open `docs/README.md` for complete setup instructions.

Added in this upgrade:

- JWT auth: register, login, protected routes, logout
- Salary/income button and salary history
- Add salary multiple times
- Expenses deduct from total income automatically
- Savings / balance block
- Category spending chart
- Monthly income vs expense chart
- More attractive responsive UI

Fast start:

1. Run `docs/database.sql` in Supabase SQL Editor.
2. Copy `backend/.env.example` to `backend/.env` and add Supabase URL + service role key.
3. Run:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

4. Open `http://127.0.0.1:8000`.
5. Import `docs/postman_collection.json` in Postman.

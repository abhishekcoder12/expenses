const app = document.getElementById("app");
const navLinks = document.getElementById("navLinks");

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Education",
  "Medical",
  "Entertainment",
  "Other",
];

const paymentMethods = ["UPI", "Cash", "Debit Card", "Credit Card", "Net Banking"];
const incomeSources = ["Salary", "Freelance", "Business", "Gift", "Bonus", "Other"];

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user || {}));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function money(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      showNav();
      if (!location.hash.includes("login")) location.hash = "#/login";
    }
    const message = data?.detail || data?.message || "Something went wrong";
    throw new Error(message);
  }

  return data;
}

function optionList(items, selected = "") {
  return items
    .map((item) => `<option value="${escapeHTML(item)}" ${item === selected ? "selected" : ""}>${escapeHTML(item)}</option>`)
    .join("");
}

function showNav() {
  const token = getToken();
  const user = getUser();

  if (!token) {
    navLinks.innerHTML = `
      <a href="#/login">Login</a>
      <a class="nav-cta" href="#/register">Register</a>
    `;
    return;
  }

  navLinks.innerHTML = `
    <a href="#/dashboard">Dashboard</a>
    <a href="#/add-income">Add Salary</a>
    <a href="#/add-expense">Add Expense</a>
    <a href="#/expenses">Expenses</a>
    <a href="#/income">Salary History</a>
    <span class="nav-user">${escapeHTML(user.name || "User")}</span>
    <button id="logoutBtn">Logout</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearToken();
    location.hash = "#/login";
    router();
  });
}

function requireLogin() {
  if (!getToken()) {
    location.hash = "#/login";
    return false;
  }
  return true;
}

function showMessage(type, message) {
  return message ? `<div class="${type}">${escapeHTML(message)}</div>` : "";
}

function emptyState(title, text, action = "") {
  return `
    <div class="empty-state">
      <div class="empty-icon">🧾</div>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(text)}</p>
      ${action}
    </div>
  `;
}

function renderRegister() {
  app.innerHTML = `
    <section class="auth-shell">
      <div class="auth-card">
        <div class="mini-badge">JWT protected</div>
        <h1>Create account</h1>
        <p class="muted">Your salary, expenses, and savings stay attached to your login only.</p>
        <div id="message"></div>
        <form id="registerForm" class="form-grid">
          <label>Name</label>
          <input name="name" placeholder="Enter your name" required minlength="2" />

          <label>Email</label>
          <input name="email" type="email" placeholder="Enter your email" required />

          <label>Password</label>
          <input name="password" type="password" placeholder="Minimum 6 characters" required minlength="6" />

          <button type="submit">Register & enter dashboard</button>
        </form>
        <p class="muted">Already registered? <a href="#/login">Login</a></p>
      </div>
    </section>
  `;

  document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setToken(result.access_token);
      setUser(result.user);
      location.hash = "#/dashboard";
      router();
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

function renderLogin() {
  app.innerHTML = `
    <section class="auth-shell">
      <div class="auth-card">
        <div class="mini-badge">Welcome back</div>
        <h1>Login</h1>
        <p class="muted">Money doesn’t track itself. Sadly, it has no discipline.</p>
        <div id="message"></div>
        <form id="loginForm" class="form-grid">
          <label>Email</label>
          <input name="email" type="email" placeholder="Enter your email" required />

          <label>Password</label>
          <input name="password" type="password" placeholder="Enter your password" required minlength="6" />

          <button type="submit">Login</button>
        </form>
        <p class="muted">New user? <a href="#/register">Create account</a></p>
      </div>
    </section>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setToken(result.access_token);
      setUser(result.user);
      location.hash = "#/dashboard";
      router();
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

async function renderDashboard() {
  if (!requireLogin()) return;

  const user = getUser();
  app.innerHTML = `
    <section class="page">
      <div class="hero hero-upgraded">
        <div class="panel hero-panel">
          <div class="mini-badge">Smart wallet command center</div>
          <h1>Hey ${escapeHTML(user.name || "there")}, track salary, spending & savings.</h1>
          <p class="muted">Add salary many times — monthly salary, freelance, bonus, pocket money. Expenses automatically reduce your available balance.</p>
          <div class="actions">
            <a class="btn" href="#/add-income">+ Add Salary</a>
            <a class="btn btn-light" href="#/add-expense">− Add Expense</a>
            <a class="btn btn-secondary" href="#/expenses">View Records</a>
          </div>
        </div>
        <div class="panel savings-card" id="savingsCard">
          <span>Savings / Balance</span>
          <strong>Loading...</strong>
          <p class="muted">Income minus expenses</p>
        </div>
      </div>

      <div id="dashboardMessage"></div>

      <div class="grid stats-grid" id="statsGrid">
        <div class="stat-card"><span>Total Income</span><strong>Loading...</strong></div>
        <div class="stat-card"><span>Total Expenses</span><strong>Loading...</strong></div>
        <div class="stat-card"><span>This Month Saved</span><strong>Loading...</strong></div>
        <div class="stat-card"><span>Highest Expense</span><strong>Loading...</strong></div>
      </div>

      <div class="charts-grid">
        <div class="panel chart-card">
          <div class="section-title">
            <div>
              <h2>Expense by category</h2>
              <p class="muted">See where your money disappears like magic.</p>
            </div>
          </div>
          <canvas id="categoryChart" height="270"></canvas>
        </div>
        <div class="panel chart-card">
          <div class="section-title">
            <div>
              <h2>Monthly trend</h2>
              <p class="muted">Income vs expenses vs savings.</p>
            </div>
          </div>
          <canvas id="trendChart" height="270"></canvas>
        </div>
      </div>
    </section>
  `;

  const messageBox = document.getElementById("dashboardMessage");
  const statsGrid = document.getElementById("statsGrid");
  const savingsCard = document.getElementById("savingsCard");

  try {
    const [overview, categoryResult, trendResult] = await Promise.all([
      apiRequest("/reports/overview"),
      apiRequest("/reports/category-breakdown"),
      apiRequest("/reports/monthly-trend"),
    ]);

    const balanceClass = Number(overview.available_balance) >= 0 ? "positive" : "negative";
    const topCategory = overview.top_category
      ? `${overview.top_category.category} • ${money(overview.top_category.total)}`
      : "No expense yet";

    savingsCard.innerHTML = `
      <span>Savings / Balance</span>
      <strong class="${balanceClass}">${money(overview.available_balance)}</strong>
      <p class="muted">Total income ${money(overview.total_income)} − total expenses ${money(overview.total_expense)}</p>
    `;

    statsGrid.innerHTML = `
      <div class="stat-card income-stat"><span>Total Income</span><strong>${money(overview.total_income)}</strong><small>${overview.income_records} salary entries</small></div>
      <div class="stat-card expense-stat"><span>Total Expenses</span><strong>${money(overview.total_expense)}</strong><small>${overview.expense_records} expense entries</small></div>
      <div class="stat-card"><span>This Month Saved</span><strong>${money(overview.current_month_savings)}</strong><small>Income ${money(overview.current_month_income)} / Expense ${money(overview.current_month_expense)}</small></div>
      <div class="stat-card"><span>Most Spending On</span><strong>${escapeHTML(topCategory)}</strong><small>Highest single expense ${money(overview.highest_expense)}</small></div>
    `;

    drawBarChart("categoryChart", categoryResult.category_totals || [], {
      labelKey: "category",
      valueKey: "total",
      emptyText: "Add expenses to see category chart",
    });

    drawTrendChart("trendChart", trendResult.months || []);
  } catch (error) {
    messageBox.innerHTML = showMessage("error", error.message);
  }
}

function renderExpenseForm(mode = "add", expense = null) {
  const isEdit = mode === "edit";
  const today = todayISO();

  app.innerHTML = `
    <section class="page narrow-page">
      <div class="form-card wide-form">
        <div class="mini-badge">Expense deduction</div>
        <h1>${isEdit ? "Edit" : "Add"} Expense</h1>
        <p class="muted">Every expense reduces your savings automatically. No manual balance math needed.</p>
        <div id="message"></div>
        <form id="expenseForm" class="form-grid two-col-form">
          <div>
            <label>Amount</label>
            <input name="amount" type="number" step="0.01" min="1" placeholder="Example: 250" required value="${escapeHTML(expense?.amount || "")}" />
          </div>

          <div>
            <label>Category</label>
            <select name="category" required>${optionList(categories, expense?.category || "Food")}</select>
          </div>

          <div>
            <label>Payment Method</label>
            <select name="payment_method" required>${optionList(paymentMethods, expense?.payment_method || "UPI")}</select>
          </div>

          <div>
            <label>Date</label>
            <input name="expense_date" type="date" required value="${escapeHTML(expense?.expense_date || today)}" />
          </div>

          <div class="full-span">
            <label>Description</label>
            <input name="description" maxlength="255" placeholder="Example: College canteen" value="${escapeHTML(expense?.description || "")}" />
          </div>

          <button class="full-span" type="submit">${isEdit ? "Update" : "Add"} Expense</button>
        </form>
        <div class="actions"><a class="btn btn-secondary" href="#/expenses">Back to Expenses</a></div>
      </div>
    </section>
  `;

  document.getElementById("expenseForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    payload.amount = Number(payload.amount);

    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const endpoint = isEdit ? `/expenses/${expense.id}` : "/expenses/";
      const method = isEdit ? "PUT" : "POST";
      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      location.hash = "#/dashboard";
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

function renderAddExpense() {
  if (!requireLogin()) return;
  renderExpenseForm("add");
}

async function renderEditExpense(id) {
  if (!requireLogin()) return;

  app.innerHTML = `<section class="page"><div class="panel"><h1>Loading expense...</h1></div></section>`;

  try {
    const expense = await apiRequest(`/expenses/${id}`);
    renderExpenseForm("edit", expense);
  } catch (error) {
    app.innerHTML = `
      <section class="page">
        <div class="panel">
          ${showMessage("error", error.message)}
          <a class="btn" href="#/expenses">Back</a>
        </div>
      </section>
    `;
  }
}

function renderIncomeForm(mode = "add", income = null) {
  const isEdit = mode === "edit";
  const today = todayISO();

  app.innerHTML = `
    <section class="page narrow-page">
      <div class="form-card wide-form">
        <div class="mini-badge">Income boost</div>
        <h1>${isEdit ? "Edit" : "Add"} Salary / Income</h1>
        <p class="muted">You can add salary more than once — monthly salary, bonus, freelance, business income, everything counts.</p>
        <div id="message"></div>
        <form id="incomeForm" class="form-grid two-col-form">
          <div>
            <label>Amount</label>
            <input name="amount" type="number" step="0.01" min="1" placeholder="Example: 25000" required value="${escapeHTML(income?.amount || "")}" />
          </div>

          <div>
            <label>Source</label>
            <select name="source" required>${optionList(incomeSources, income?.source || "Salary")}</select>
          </div>

          <div>
            <label>Date</label>
            <input name="income_date" type="date" required value="${escapeHTML(income?.income_date || today)}" />
          </div>

          <div>
            <label>Note</label>
            <input name="note" maxlength="255" placeholder="Example: June salary / freelance client" value="${escapeHTML(income?.note || "")}" />
          </div>

          <button class="full-span" type="submit">${isEdit ? "Update" : "Add"} Salary</button>
        </form>
        <div class="actions"><a class="btn btn-secondary" href="#/income">Back to Salary History</a></div>
      </div>
    </section>
  `;

  document.getElementById("incomeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = Object.fromEntries(form.entries());
    payload.amount = Number(payload.amount);

    const messageBox = document.getElementById("message");
    messageBox.innerHTML = "";

    try {
      const endpoint = isEdit ? `/income/${income.id}` : "/income/";
      const method = isEdit ? "PUT" : "POST";
      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      location.hash = "#/dashboard";
    } catch (error) {
      messageBox.innerHTML = showMessage("error", error.message);
    }
  });
}

function renderAddIncome() {
  if (!requireLogin()) return;
  renderIncomeForm("add");
}

async function renderEditIncome(id) {
  if (!requireLogin()) return;

  app.innerHTML = `<section class="page"><div class="panel"><h1>Loading salary record...</h1></div></section>`;

  try {
    const income = await apiRequest(`/income/${id}`);
    renderIncomeForm("edit", income);
  } catch (error) {
    app.innerHTML = `
      <section class="page">
        <div class="panel">
          ${showMessage("error", error.message)}
          <a class="btn" href="#/income">Back</a>
        </div>
      </section>
    `;
  }
}

async function renderExpenses() {
  if (!requireLogin()) return;

  app.innerHTML = `
    <section class="page">
      <div class="panel">
        <div class="section-title">
          <div>
            <div class="mini-badge">Expense history</div>
            <h1>Expenses</h1>
            <p class="muted">Filter by category and date range. Edit/delete when needed.</p>
          </div>
          <a class="btn" href="#/add-expense">+ Add Expense</a>
        </div>
        <div id="message"></div>
        <div class="filters">
          <div>
            <label>Category</label>
            <select id="filterCategory">
              <option value="All">All</option>
              ${optionList(categories)}
            </select>
          </div>
          <div>
            <label>Start Date</label>
            <input type="date" id="filterStart" />
          </div>
          <div>
            <label>End Date</label>
            <input type="date" id="filterEnd" />
          </div>
          <button id="applyFilter">Apply</button>
        </div>
      </div>

      <div class="table-card" id="expenseTableWrap">
        <p class="empty">Loading expenses...</p>
      </div>
    </section>
  `;

  document.getElementById("applyFilter").addEventListener("click", loadAndRenderExpensesTable);
  await loadAndRenderExpensesTable();
}

function buildExpenseQuery() {
  const category = document.getElementById("filterCategory")?.value || "All";
  const startDate = document.getElementById("filterStart")?.value || "";
  const endDate = document.getElementById("filterEnd")?.value || "";
  const params = new URLSearchParams();

  if (category !== "All") params.set("category", category);
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  return params.toString() ? `/expenses/?${params.toString()}` : "/expenses/";
}

async function loadAndRenderExpensesTable() {
  const wrap = document.getElementById("expenseTableWrap");
  const messageBox = document.getElementById("message");
  messageBox.innerHTML = "";
  wrap.innerHTML = `<p class="empty">Loading expenses...</p>`;

  try {
    const result = await apiRequest(buildExpenseQuery());
    const expenses = result.expenses || [];

    if (expenses.length === 0) {
      wrap.innerHTML = emptyState(
        "No expenses found",
        "Add your first expense and the dashboard will deduct it from your savings.",
        `<a class="btn" href="#/add-expense">+ Add Expense</a>`
      );
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${expenses
            .map(
              (expense) => `
              <tr>
                <td>${escapeHTML(expense.expense_date)}</td>
                <td><span class="pill">${escapeHTML(expense.category)}</span></td>
                <td class="money-cell negative-text">${money(expense.amount)}</td>
                <td>${escapeHTML(expense.payment_method)}</td>
                <td>${escapeHTML(expense.description || "-")}</td>
                <td>
                  <div class="row-actions">
                    <a class="btn btn-secondary" href="#/edit-expense/${expense.id}">Edit</a>
                    <button class="btn-danger" data-delete-id="${expense.id}">Delete</button>
                  </div>
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;

    document.querySelectorAll("[data-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-delete-id");
        if (!confirm("Delete this expense?")) return;

        try {
          await apiRequest(`/expenses/${id}`, { method: "DELETE" });
          await loadAndRenderExpensesTable();
        } catch (error) {
          messageBox.innerHTML = showMessage("error", error.message);
        }
      });
    });
  } catch (error) {
    wrap.innerHTML = "";
    messageBox.innerHTML = showMessage("error", error.message);
  }
}

async function renderIncomeHistory() {
  if (!requireLogin()) return;

  app.innerHTML = `
    <section class="page">
      <div class="panel">
        <div class="section-title">
          <div>
            <div class="mini-badge">Salary history</div>
            <h1>Income / Salary</h1>
            <p class="muted">Add salary multiple times whenever you earn. Bonus? Freelance? Add it. Balance goes up.</p>
          </div>
          <a class="btn" href="#/add-income">+ Add Salary</a>
        </div>
        <div id="message"></div>
        <div class="filters small-filters">
          <div>
            <label>Start Date</label>
            <input type="date" id="incomeStart" />
          </div>
          <div>
            <label>End Date</label>
            <input type="date" id="incomeEnd" />
          </div>
          <button id="applyIncomeFilter">Apply</button>
        </div>
      </div>

      <div class="table-card" id="incomeTableWrap">
        <p class="empty">Loading salary records...</p>
      </div>
    </section>
  `;

  document.getElementById("applyIncomeFilter").addEventListener("click", loadAndRenderIncomeTable);
  await loadAndRenderIncomeTable();
}

function buildIncomeQuery() {
  const startDate = document.getElementById("incomeStart")?.value || "";
  const endDate = document.getElementById("incomeEnd")?.value || "";
  const params = new URLSearchParams();

  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  return params.toString() ? `/income/?${params.toString()}` : "/income/";
}

async function loadAndRenderIncomeTable() {
  const wrap = document.getElementById("incomeTableWrap");
  const messageBox = document.getElementById("message");
  messageBox.innerHTML = "";
  wrap.innerHTML = `<p class="empty">Loading salary records...</p>`;

  try {
    const result = await apiRequest(buildIncomeQuery());
    const incomeRows = result.income || [];

    if (incomeRows.length === 0) {
      wrap.innerHTML = emptyState(
        "No salary/income added yet",
        "Add salary first, then expenses will deduct from your savings block.",
        `<a class="btn" href="#/add-income">+ Add Salary</a>`
      );
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Source</th>
            <th>Amount</th>
            <th>Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${incomeRows
            .map(
              (income) => `
              <tr>
                <td>${escapeHTML(income.income_date)}</td>
                <td><span class="pill income-pill">${escapeHTML(income.source)}</span></td>
                <td class="money-cell positive-text">${money(income.amount)}</td>
                <td>${escapeHTML(income.note || "-")}</td>
                <td>
                  <div class="row-actions">
                    <a class="btn btn-secondary" href="#/edit-income/${income.id}">Edit</a>
                    <button class="btn-danger" data-delete-income-id="${income.id}">Delete</button>
                  </div>
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;

    document.querySelectorAll("[data-delete-income-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-delete-income-id");
        if (!confirm("Delete this salary/income record?")) return;

        try {
          await apiRequest(`/income/${id}`, { method: "DELETE" });
          await loadAndRenderIncomeTable();
        } catch (error) {
          messageBox.innerHTML = showMessage("error", error.message);
        }
      });
    });
  } catch (error) {
    wrap.innerHTML = "";
    messageBox.innerHTML = showMessage("error", error.message);
  }
}

function drawBarChart(canvasId, rows, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
  const height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.font = "13px Arial";
  ctx.fillStyle = "#64748b";

  if (!rows.length) {
    ctx.textAlign = "center";
    ctx.fillText(config.emptyText || "No data yet", w / 2, h / 2);
    return;
  }

  const topRows = [...rows].slice(0, 7);
  const maxValue = Math.max(...topRows.map((row) => Number(row[config.valueKey] || 0)), 1);
  const left = 110;
  const right = 24;
  const top = 18;
  const rowHeight = Math.min(34, (h - top - 20) / topRows.length);
  const barMax = w - left - right;

  topRows.forEach((row, index) => {
    const y = top + index * rowHeight;
    const value = Number(row[config.valueKey] || 0);
    const barWidth = Math.max(4, (value / maxValue) * barMax);

    ctx.fillStyle = "#334155";
    ctx.textAlign = "right";
    ctx.fillText(String(row[config.labelKey]).slice(0, 14), left - 12, y + 19);

    const gradient = ctx.createLinearGradient(left, 0, left + barWidth, 0);
    gradient.addColorStop(0, "#2563eb");
    gradient.addColorStop(1, "#14b8a6");
    ctx.fillStyle = gradient;
    roundRect(ctx, left, y, barWidth, 20, 8);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    ctx.fillText(money(value), left + barWidth + 8, y + 15);
  });
}

function drawTrendChart(canvasId, rows) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.font = "13px Arial";

  if (!rows.length) {
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText("Add salary and expenses to see monthly trend", w / 2, h / 2);
    return;
  }

  const data = rows.slice(-8);
  const maxValue = Math.max(...data.flatMap((row) => [Number(row.income || 0), Number(row.expense || 0)]), 1);
  const chartLeft = 46;
  const chartRight = 16;
  const chartTop = 20;
  const chartBottom = 46;
  const chartW = w - chartLeft - chartRight;
  const chartH = h - chartTop - chartBottom;
  const groupWidth = chartW / data.length;
  const barWidth = Math.min(24, groupWidth / 4);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(w - chartRight, y);
    ctx.stroke();
  }

  data.forEach((row, index) => {
    const xCenter = chartLeft + groupWidth * index + groupWidth / 2;
    const incomeHeight = (Number(row.income || 0) / maxValue) * chartH;
    const expenseHeight = (Number(row.expense || 0) / maxValue) * chartH;

    ctx.fillStyle = "#16a34a";
    roundRect(ctx, xCenter - barWidth - 3, chartTop + chartH - incomeHeight, barWidth, incomeHeight, 6);
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    roundRect(ctx, xCenter + 3, chartTop + chartH - expenseHeight, barWidth, expenseHeight, 6);
    ctx.fill();

    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText(row.month, xCenter, h - 18);
  });

  drawLegend(ctx, w - 170, 14, "Income", "#16a34a");
  drawLegend(ctx, w - 90, 14, "Expense", "#ef4444");
}

function drawLegend(ctx, x, y, label, color) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, 12, 12, 4);
  ctx.fill();
  ctx.fillStyle = "#475569";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 18, y + 11);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function renderNotFound() {
  app.innerHTML = `
    <section class="page">
      <div class="panel">
        <h1>Page not found</h1>
        <p class="muted">This route does not exist.</p>
        <a class="btn" href="#/dashboard">Go to Dashboard</a>
      </div>
    </section>
  `;
}

function router() {
  showNav();
  const hash = location.hash || "#/dashboard";
  const parts = hash.replace("#", "").split("/").filter(Boolean);
  const route = parts[0];

  if (!getToken() && !["login", "register"].includes(route)) {
    location.hash = "#/login";
    showNav();
    renderLogin();
    return;
  }

  switch (route) {
    case "login":
      renderLogin();
      break;
    case "register":
      renderRegister();
      break;
    case "dashboard":
      renderDashboard();
      break;
    case "add-income":
      renderAddIncome();
      break;
    case "income":
      renderIncomeHistory();
      break;
    case "edit-income":
      renderEditIncome(parts[1]);
      break;
    case "add-expense":
      renderAddExpense();
      break;
    case "expenses":
      renderExpenses();
      break;
    case "edit-expense":
      renderEditExpense(parts[1]);
      break;
    default:
      renderNotFound();
  }
}

window.addEventListener("resize", () => {
  if ((location.hash || "#/dashboard") === "#/dashboard") renderDashboard();
});
window.addEventListener("hashchange", router);
window.addEventListener("load", router);

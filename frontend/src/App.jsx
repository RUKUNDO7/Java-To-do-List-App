import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const statusLabel = (value) => (value ? "Done" : "Open");

const StatusPill = ({ value }) => (
  <span className={`pill ${value ? "pill--done" : "pill--open"}`}>
    {statusLabel(value)}
  </span>
);

const initialAuthForm = {
  username: "",
  email: "",
  password: "",
};

const evaluatePassword = (password) => {
  const checks = [
    { key: "length", label: "At least 12 characters", met: password.length >= 12 },
    { key: "upper", label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { key: "lower", label: "One lowercase letter", met: /[a-z]/.test(password) },
    { key: "number", label: "One number", met: /[0-9]/.test(password) },
    { key: "special", label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    { key: "space", label: "No spaces", met: !/\s/.test(password) },
  ];
  const score = checks.filter((check) => check.met).length;
  const progress = Math.round((score / checks.length) * 100);
  const label = score <= 2 ? "Weak" : score <= 4 ? "Medium" : score < 6 ? "Almost strong" : "Strong";

  return {
    checks,
    score,
    progress,
    label,
    isStrong: score === checks.length,
  };
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("Ready.");
  const [lookupTitle, setLookupTitle] = useState("");
  const [lookupResult, setLookupResult] = useState("");
  const [lookupHasSearched, setLookupHasSearched] = useState(false);
  const [filter, setFilter] = useState("all");
  const [createTitle, setCreateTitle] = useState("");
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [authError, setAuthError] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);

  const stats = useMemo(() => {
    const done = tasks.filter((task) => task.status).length;
    const open = tasks.length - done;
    return { done, open };
  }, [tasks]);

  const filteredTasks = useMemo(() => tasks, [tasks]);
  const passwordStrength = useMemo(
    () => evaluatePassword(authForm.password),
    [authForm.password]
  );
  const signupDisabled = authMode === "signup" && !passwordStrength.isStrong;

  const clearAppState = () => {
    setTasks([]);
    setDashboard(null);
    setLookupResult("");
    setLookupHasSearched(false);
    setCreateTitle("");
    setLookupTitle("");
  };

  const loadDashboard = async () => {
    const data = await api.dashboard();
    setDashboard(data);
  };

  const loadByFilter = async (nextFilter) => {
    setStatus("Loading tasks...");
    setLookupResult("");
    try {
      if (nextFilter === "all") {
        const data = await api.list();
        setTasks(data);
        setStatus(`Loaded ${data.length} task(s).`);
        return;
      }
      const data = await api.byStatus(nextFilter === "done");
      setTasks(data);
      setStatus(`Loaded ${data.length} task(s).`);
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        clearAppState();
      }
      setStatus(`Error: ${error.message}`);
    }
  };

  const hydrateForUser = async (nextUser) => {
    setUser(nextUser);
    setStatus("Loading your dashboard...");
    await Promise.all([loadDashboard(), loadByFilter("all")]);
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const me = await api.me();
        await hydrateForUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoadingSession(false);
      }
    };

    initSession();
  }, []);

  const handleLookup = async () => {
    if (!lookupTitle.trim()) {
      return;
    }

    setStatus("Fetching task...");
    setLookupHasSearched(true);
    try {
      const data = await api.byTitle(lookupTitle.trim());
      const inFilter =
        filter === "all" ||
        (filter === "done" && data.status) ||
        (filter === "open" && !data.status);
      const filterNote = inFilter ? "" : " (not in current filter)";
      setLookupResult(`Found: ${data.title} (${statusLabel(data.status)})${filterNote}`);
      setStatus("Lookup complete.");
    } catch (error) {
      if (error.status === 404) {
        setLookupResult("");
      } else {
        setLookupResult(`Error: ${error.message}`);
      }
      setStatus("Lookup failed.");
    }
  };

  const handleToggle = async (task) => {
    setStatus("Updating task...");
    try {
      await api.updateById(task.id, {
        title: task.title,
        status: !task.status,
      });
      await Promise.all([loadByFilter(filter), loadDashboard()]);
      setStatus("Task updated.");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleFilter = async (nextFilter) => {
    setFilter(nextFilter);
    await loadByFilter(nextFilter);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!createTitle.trim()) {
      return;
    }

    setStatus("Creating task...");
    try {
      await api.create({ title: createTitle.trim(), status: false });
      setCreateTitle("");
      await Promise.all([loadByFilter(filter), loadDashboard()]);
      setStatus("Task created.");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    if (authMode === "signup" && !passwordStrength.isStrong) {
      setAuthError("Use a stronger password to continue.");
      return;
    }
    try {
      const authUser =
        authMode === "signup"
          ? await api.signup(authForm)
          : await api.login({ username: authForm.username, password: authForm.password });
      setAuthForm(initialAuthForm);
      await hydrateForUser(authUser);
      setLoadingSession(false);
    } catch (error) {
      setAuthError(error.message || "Authentication failed");
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      clearAppState();
      setStatus("Signed out.");
    }
  };

  if (loadingSession) {
    return <div className="panel">Loading session...</div>;
  }

  if (!user) {
    return (
      <div className="auth-wrap">
        <section className="panel auth-panel">
          <p className="hero__eyebrow">Account</p>
          <h1>{authMode === "login" ? "Log in" : "Create account"}</h1>
          <p className="panel__subtitle">{authMode === "login" ? "Welcome back." : "Start your personalized to-do dashboard."}</p>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <input
              value={authForm.username}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="Username"
              required
            />
            {authMode === "signup" ? (
              <input
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="Email"
                required
              />
            ) : null}
            <input
              type="password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Password"
              required
            />
            {authMode === "signup" ? (
              <div className="password-meter">
                <div className="password-meter__head">
                  <span>Password strength</span>
                  <strong>{passwordStrength.label}</strong>
                </div>
                <div
                  className="password-meter__bar"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={passwordStrength.progress}
                >
                  <span style={{ width: `${passwordStrength.progress}%` }} />
                </div>
                <ul className="password-rules">
                  {passwordStrength.checks.map((check) => (
                    <li
                      key={check.key}
                      className={check.met ? "is-met" : ""}
                    >
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {authError ? <div className="callout">{authError}</div> : null}
            <button className="solid" type="submit" disabled={signupDisabled}>
              {authMode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <button
            className="ghost"
            type="button"
            onClick={() => {
              setAuthError("");
              setAuthMode((prev) => (prev === "login" ? "signup" : "login"));
            }}
          >
            {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__top">
          <div>
            <p className="hero__eyebrow">Task Console</p>
            <h1>{dashboard?.username || user.username}&apos;s Dashboard</h1>
            <p className="hero__subtitle">Authenticated workspace with account-based task isolation.</p>
            <p className="panel__subtitle">Role: {dashboard?.role || user.role}</p>
          </div>
          <div className="hero__actions">
            <button className="ghost" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
        <div className="hero__actions">
          <button
            className={`ghost ${filter === "all" ? "is-active" : ""}`}
            type="button"
            onClick={() => handleFilter("all")}
          >
            All Tasks
          </button>
          <button
            className={`ghost ${filter === "open" ? "is-active" : ""}`}
            type="button"
            onClick={() => handleFilter("open")}
          >
            Open
          </button>
          <button
            className={`ghost ${filter === "done" ? "is-active" : ""}`}
            type="button"
            onClick={() => handleFilter("done")}
          >
            Done
          </button>
        </div>
      </header>

      <section className="panel overview">
        <div className="overview__title">Overview</div>
        <div className="overview__list">
          <div className="overview__item">
            <span>Total tasks</span>
            <strong>{dashboard?.totalTasks ?? tasks.length}</strong>
          </div>
          <div className="overview__item">
            <span>Open</span>
            <strong>{dashboard?.openTasks ?? stats.open}</strong>
          </div>
          <div className="overview__item">
            <span>Completed</span>
            <strong>{dashboard?.completedTasks ?? stats.done}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="progress-card">
          <div>
            <p className="progress-card__label">Progress</p>
            <p className="progress-card__value">
              {tasks.length === 0
                ? "0% complete"
                : `${Math.round((stats.done / tasks.length) * 100)}% complete`}
            </p>
          </div>
          <div
            className="progress-ring"
            style={{
              "--progress": tasks.length === 0 ? 0 : (stats.done / tasks.length) * 100,
            }}
            aria-label={`Progress ${stats.done}/${tasks.length}`}
          >
            <span>
              {stats.done}/{tasks.length}
            </span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Add Task</h2>
            <p className="panel__subtitle">Create a new task in your list.</p>
          </div>
        </div>
        <form className="add-task" onSubmit={handleCreate}>
          <input
            value={createTitle}
            onChange={(event) => setCreateTitle(event.target.value)}
            placeholder="New task title"
            aria-label="New task title"
          />
          <button className="solid" type="submit">
            Add Task
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Find Task</h2>
          </div>
        </div>
        <form
          className="search"
          onSubmit={(event) => {
            event.preventDefault();
            handleLookup();
          }}
        >
          <div className="search__field">
            <span className="search__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M10.5 3a7.5 7.5 0 1 0 4.77 13.3l3.96 3.97a1 1 0 0 0 1.41-1.42l-3.96-3.96A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              value={lookupTitle}
              onChange={(event) => setLookupTitle(event.target.value)}
              placeholder="Search task by exact title"
              aria-label="Search tasks by title"
            />
          </div>
        </form>
        {lookupResult ? <div className="callout">{lookupResult}</div> : null}
        {!lookupResult && lookupHasSearched ? (
          <div className="empty-search">
            <div className="empty-search__icon" aria-hidden="true">
              <svg viewBox="0 0 64 64">
                <rect x="14" y="14" width="10" height="10" rx="2" />
                <rect x="30" y="16" width="20" height="4" rx="2" />
                <rect x="30" y="28" width="16" height="4" rx="2" />
                <path d="M14 38l6 6l10-12" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="30" y="40" width="18" height="4" rx="2" />
              </svg>
            </div>
            <h3>No matching tasks.</h3>
            <p>Try clearing filters or add a new one.</p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Tasks</h2>
            <p className="panel__subtitle">
              Showing {filter === "all" ? "all tasks" : filter === "done" ? "done tasks" : "open tasks"}.
            </p>
          </div>
          <div className="panel__meta">
            <strong>{filteredTasks.length}</strong> items
          </div>
        </div>
        <div className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="task task--empty">No tasks loaded.</div>
          ) : (
            filteredTasks.map((task) => (
              <div className="task" key={task.id ?? task.title}>
                <div>
                  <div className="task__title">{task.title}</div>
                </div>
                <div className="task__status">
                  <StatusPill value={task.status} />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={task.status}
                      onChange={() => handleToggle(task)}
                    />
                    <span>Done</span>
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

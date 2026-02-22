import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const emptyLookup = { id: "", title: "" };

const statusLabel = (value) => (value ? "Done" : "Open");

const StatusPill = ({ value }) => (
  <span className={`pill ${value ? "pill--done" : "pill--open"}`}>
    {statusLabel(value)}
  </span>
);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("Ready.");
  const [lookup, setLookup] = useState(emptyLookup);
  const [lookupResult, setLookupResult] = useState("");
  const [lookupHasSearched, setLookupHasSearched] = useState(false);
  const [filter, setFilter] = useState("all");
  const [createTitle, setCreateTitle] = useState("");

  const stats = useMemo(() => {
    const done = tasks.filter((task) => task.status).length;
    const open = tasks.length - done;
    return { done, open };
  }, [tasks]);

  const filteredTasks = useMemo(() => tasks, [tasks]);

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
      const statusValue = nextFilter === "done";
      const data = await api.byStatus(statusValue);
      setTasks(data);
      setStatus(`Loaded ${data.length} task(s).`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleLookup = async (mode) => {
    setStatus("Fetching task...");
    setLookupHasSearched(true);
    try {
      const data =
        mode === "id" ? await api.byId(lookup.id) : await api.byTitle(lookup.title);
      const inFilter =
        filter === "all" ||
        (filter === "done" && data.status) ||
        (filter === "open" && !data.status);
      const filterNote = inFilter ? "" : " (not in current filter)";
      setLookupResult(
        `Found: ${data.title} (${statusLabel(data.status)})${filterNote}`
      );
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
      await loadByFilter(filter);
      setStatus("Task updated.");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleFilter = async (nextFilter) => {
    setFilter(nextFilter);
    await loadByFilter(nextFilter);
  };

  useEffect(() => {
    loadByFilter("all");
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!createTitle.trim()) {
      return;
    }
    setStatus("Creating task...");
    try {
      await api.create({ title: createTitle.trim(), status: false });
      setCreateTitle("");
      await loadByFilter(filter);
      setStatus("Task created.");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__top">
          <div>
            <p className="hero__eyebrow">Task Console</p>
            <h1>To-do Board</h1>
            <p className="hero__subtitle">
              A focused workspace for reviewing and completing tasks.
            </p>
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
            <strong>{tasks.length}</strong>
          </div>
          <div className="overview__item">
            <span>Open</span>
            <strong>{stats.open}</strong>
          </div>
          <div className="overview__item">
            <span>Completed</span>
            <strong>{stats.done}</strong>
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
            handleLookup("title");
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
              value={lookup.title}
              onChange={(event) =>
                setLookup((prev) => ({ ...prev, title: event.target.value }))
              }
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

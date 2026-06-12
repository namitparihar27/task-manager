const API = '/api/tasks';

let allTasks = [];
let currentFilter = 'all';
let searchQuery = '';
let pendingDeleteId = null;

// ── API helpers ──────────────────────────────────────────
async function fetchTasks() {
  const res = await fetch(API);
  allTasks = await res.json();
  render();
}

async function createTask(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); showToast('⚠ ' + e.error); return; }
  const task = await res.json();
  allTasks.unshift(task);
  render();
  showToast('✓ Task added');
}

async function updateTask(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); showToast('⚠ ' + e.error); return false; }
  const updated = await res.json();
  allTasks = allTasks.map(t => t.id === id ? updated : t);
  render();
  return true;
}

async function deleteTask(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) { showToast('⚠ Delete failed'); return; }
  allTasks = allTasks.filter(t => t.id !== id);
  render();
  showToast('🗑 Task deleted');
}

// ── Render ──────────────────────────────────────────────
function getFilteredTasks() {
  return allTasks.filter(t => {
    const matchFilter =
      currentFilter === 'all' ||
      (currentFilter === 'active' && !t.completed) ||
      (currentFilter === 'completed' && t.completed);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(iso.split('T')[0]);
}

function render() {
  renderStats();
  renderTasks();
}

function renderStats() {
  const active = allTasks.filter(t => !t.completed).length;
  const done = allTasks.filter(t => t.completed).length;
  const overdue = allTasks.filter(t => isOverdue(t)).length;

  document.getElementById('statActive').textContent = active;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statOverdue').textContent = overdue;

  const overdueEl = document.querySelector('.stat-pill.overdue');
  overdueEl.style.display = overdue > 0 ? 'flex' : 'none';
}

function renderTasks() {
  const list = document.getElementById('taskList');
  const tasks = getFilteredTasks();

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>${searchQuery ? 'No results found' : currentFilter === 'completed' ? 'No completed tasks yet' : currentFilter === 'active' ? 'All clear — no active tasks' : 'No tasks yet'}</h3>
        <p>${searchQuery ? 'Try a different search term.' : 'Add a task above to get started.'}</p>
      </div>`;
    return;
  }

  list.innerHTML = '';
  tasks.forEach(task => {
    const overdue = isOverdue(task);
    const card = document.createElement('div');
    card.className = `task-card${overdue ? ' overdue' : ''}${task.completed ? ' completed' : ''}`;
    card.dataset.id = task.id;

    let dateBadge = '';
    if (task.dueDate) {
      const cls = task.completed ? 'done' : overdue ? 'overdue' : 'normal';
      const label = task.completed ? '✓ ' : overdue ? '⚠ ' : '';
      dateBadge = `<span class="task-date ${cls}">${label}${formatDate(task.dueDate)}</span>`;
    }

    card.innerHTML = `
      <div class="task-check${task.completed ? ' checked' : ''}" data-id="${task.id}" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}"></div>
      <div class="task-body">
        <div class="task-title">${escHtml(task.title)}</div>
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          ${dateBadge}
          <span class="task-created">${timeAgo(task.createdAt)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-ghost btn-sm edit-btn" data-id="${task.id}" title="Edit">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></svg>
          Edit
        </button>
        <button class="btn btn-danger btn-sm delete-btn" data-id="${task.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete
        </button>
      </div>
    `;
    list.appendChild(card);
  });
}

// ── Edit inline ──────────────────────────────────────────
function openEditMode(id) {
  const task = allTasks.find(t => t.id === id);
  if (!task) return;

  const card = document.querySelector(`.task-card[data-id="${id}"]`);
  if (!card) return;

  card.classList.add('editing');
  card.innerHTML = `
    <div class="edit-form">
      <div class="form-group">
        <label>Title *</label>
        <input type="text" class="edit-title" value="${escHtml(task.title)}" placeholder="Task title" />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="edit-desc" placeholder="Optional description">${escHtml(task.description || '')}</textarea>
      </div>
      <div class="edit-row">
        <div class="form-group">
          <label>Due Date</label>
          <input type="date" class="edit-due" value="${task.dueDate || ''}" />
        </div>
      </div>
      <div class="edit-actions">
        <button class="btn btn-ghost btn-sm cancel-edit-btn" data-id="${id}">Cancel</button>
        <button class="btn btn-primary btn-sm save-edit-btn" data-id="${id}">Save changes</button>
      </div>
    </div>
  `;

  card.querySelector('.edit-title').focus();
}

// ── Delete modal ─────────────────────────────────────────
function openDeleteModal(id) {
  pendingDeleteId = id;
  const task = allTasks.find(t => t.id === id);
  document.getElementById('deleteTaskTitle').textContent = task ? task.title : '';
  document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('deleteModal').style.display = 'none';
}

// ── Toast ────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Util ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Event delegation ─────────────────────────────────────
document.getElementById('taskList').addEventListener('click', async (e) => {
  // Toggle complete
  const checkEl = e.target.closest('.task-check');
  if (checkEl) {
    const id = checkEl.dataset.id;
    const task = allTasks.find(t => t.id === id);
    if (task) await updateTask(id, { completed: !task.completed });
    return;
  }

  // Edit button
  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) { openEditMode(editBtn.dataset.id); return; }

  // Delete button
  const delBtn = e.target.closest('.delete-btn');
  if (delBtn) { openDeleteModal(delBtn.dataset.id); return; }

  // Save edit
  const saveBtn = e.target.closest('.save-edit-btn');
  if (saveBtn) {
    const id = saveBtn.dataset.id;
    const card = document.querySelector(`.task-card[data-id="${id}"]`);
    const title = card.querySelector('.edit-title').value;
    const description = card.querySelector('.edit-desc').value;
    const dueDate = card.querySelector('.edit-due').value;
    const ok = await updateTask(id, { title, description, dueDate });
    if (ok) showToast('✓ Task updated');
    return;
  }

  // Cancel edit
  const cancelBtn = e.target.closest('.cancel-edit-btn');
  if (cancelBtn) { render(); return; }
});

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    currentFilter = tab.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderTasks();
  });
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTasks();
});

// Add task form
document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('newTitle').value;
  const description = document.getElementById('newDesc').value;
  const dueDate = document.getElementById('newDue').value;
  await createTask({ title, description, dueDate });
  e.target.reset();
});

// Delete modal
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (pendingDeleteId) {
    await deleteTask(pendingDeleteId);
    closeDeleteModal();
  }
});

document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
document.getElementById('deleteModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeDeleteModal();
});

// Init
fetchTasks();
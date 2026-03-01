const els = {
  form: document.querySelector('#addForm'),
  input: document.querySelector('#taskInput'),
  list: document.querySelector('#taskList'),
  stats: document.querySelector('#stats'),
  clearDone: document.querySelector('#clearDone'),
  search: document.querySelector('#searchInput'),
  filterBtns: Array.from(document.querySelectorAll('.chip')),
};

const STORAGE_KEY = 'taskflow:v1';

let state = {
  tasks: loadTasks(),
  filter: 'all',      // all | active | done
  searchText: '',
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function addTask(title) {
  state.tasks.unshift({ id: uid(), title: title.trim(), done: false, createdAt: Date.now() });
  saveTasks();
  render();
}

function toggleDone(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  saveTasks();
  render();
}

function removeTask(id) {
  state.tasks = state.tasks.filter(x => x.id !== id);
  saveTasks();
  render();
}

function editTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;

  const next = prompt('Editar tarefa:', t.title);
  if (next === null) return;          // cancelou
  const trimmed = next.trim();
  if (!trimmed) return;               // vazio
  t.title = trimmed;
  saveTasks();
  render();
}

function clearDone() {
  state.tasks = state.tasks.filter(t => !t.done);
  saveTasks();
  render();
}

function setFilter(next) {
  state.filter = next;
  els.filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === next));
  render();
}

function setSearchText(text) {
  state.searchText = text.toLowerCase();
  render();
}

function filteredTasks() {
  return state.tasks
    .filter(t => {
      if (state.filter === 'active') return !t.done;
      if (state.filter === 'done') return t.done;
      return true;
    })
    .filter(t => t.title.toLowerCase().includes(state.searchText));
}

function updateStats() {
  const remaining = state.tasks.filter(t => !t.done).length;
  els.stats.textContent = `${remaining} restantes`;
}

function render() {
  const tasks = filteredTasks();

  els.list.innerHTML = tasks.map(t => `
    <li class="item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="left">
        <input class="check" type="checkbox" ${t.done ? 'checked' : ''} aria-label="Concluir tarefa">
        <span class="title" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</span>
      </div>
      <div class="actions">
        <button class="icon" data-action="edit" type="button">Editar</button>
        <button class="icon danger" data-action="remove" type="button">Excluir</button>
      </div>
    </li>
  `).join('');

  updateStats();
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* Events */
els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = els.input.value;
  if (!title.trim()) return;
  addTask(title);
  els.input.value = '';
  els.input.focus();
});

els.list.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (!item) return;

  const id = item.dataset.id;
  const actionBtn = e.target.closest('button[data-action]');
  if (!actionBtn) return;

  const action = actionBtn.dataset.action;
  if (action === 'edit') editTask(id);
  if (action === 'remove') removeTask(id);
});

els.list.addEventListener('change', (e) => {
  if (!e.target.classList.contains('check')) return;
  const item = e.target.closest('.item');
  if (!item) return;
  toggleDone(item.dataset.id);
});

els.clearDone.addEventListener('click', clearDone);

els.search.addEventListener('input', (e) => {
  setSearchText(e.target.value);
});

els.filterBtns.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

/* init */
render(); 
/* ============================================================
   app.js  –  To-Do Life Dashboard
   All features: Greeting, Clock, Focus Timer (Pomodoro),
   To-Do List, Quick Links, Dark/Light mode, Custom name
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   STORAGE HELPERS
──────────────────────────────────────────────────────────── */
const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

/* ────────────────────────────────────────────────────────────
   CHALLENGE 1 – DARK / LIGHT MODE
──────────────────────────────────────────────────────────── */
const themeToggleBtn = document.getElementById('themeToggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function initTheme() {
  const saved = Storage.get('theme', 'light');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  Storage.set('theme', next);
  applyTheme(next);
});

/* ────────────────────────────────────────────────────────────
   CHALLENGE 2 – CUSTOM NAME IN GREETING
──────────────────────────────────────────────────────────── */
const editNameBtn   = document.getElementById('editNameBtn');
const nameModal     = document.getElementById('nameModal');
const nameInput     = document.getElementById('nameInput');
const saveNameBtn   = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');

function openNameModal() {
  nameInput.value = Storage.get('userName', '');
  nameModal.hidden = false;
  nameInput.focus();
}

function closeNameModal() {
  nameModal.hidden = true;
}

function saveName() {
  const name = nameInput.value.trim();
  Storage.set('userName', name);
  closeNameModal();
  updateGreeting();
}

editNameBtn.addEventListener('click', openNameModal);
saveNameBtn.addEventListener('click', saveName);
cancelNameBtn.addEventListener('click', closeNameModal);
nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) closeNameModal();
});
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveName();
  if (e.key === 'Escape') closeNameModal();
});

/* ────────────────────────────────────────────────────────────
   GREETING + CLOCK
──────────────────────────────────────────────────────────── */
const greetingEl    = document.getElementById('greeting');
const clockEl       = document.getElementById('clock');
const dateDisplayEl = document.getElementById('dateDisplay');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function getGreetingPhrase(hour) {
  if (hour <  5) return '🌌 Good night';
  if (hour < 12) return '☀️ Good morning';
  if (hour < 17) return '🌤 Good afternoon';
  if (hour < 21) return '🌆 Good evening';
  return '🌙 Good night';
}

function updateGreeting() {
  const hour = new Date().getHours();
  const name = Storage.get('userName', '');
  const phrase = getGreetingPhrase(hour);
  greetingEl.textContent = name ? `${phrase}, ${name}!` : `${phrase}!`;
}

function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;

  const day   = DAYS[now.getDay()];
  const date  = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year  = now.getFullYear();
  dateDisplayEl.textContent = `${day}, ${date} ${month} ${year}`;
}

// Update greeting once per minute so it stays accurate
setInterval(updateGreeting, 60_000);
setInterval(updateClock,        1_000);

/* ────────────────────────────────────────────────────────────
   CHALLENGE 3 – FOCUS TIMER (with changeable Pomodoro time)
──────────────────────────────────────────────────────────── */
const timerDisplay    = document.getElementById('timerDisplay');
const startTimerBtn   = document.getElementById('startTimer');
const stopTimerBtn    = document.getElementById('stopTimer');
const resetTimerBtn   = document.getElementById('resetTimer');
const pomodoroInput   = document.getElementById('pomodoroMinutes');
const applyTimeBtn    = document.getElementById('applyTime');

let timerInterval  = null;
let timerTotal     = 0;   // total seconds for current session
let timerRemaining = 0;   // seconds left
let timerRunning   = false;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function setTimerDisplay(seconds, state = '') {
  timerDisplay.textContent = formatTime(seconds);
  timerDisplay.className   = `timer__display${state ? ' ' + state : ''}`;
}

function initTimer() {
  const savedMinutes = Storage.get('pomodoroMinutes', 25);
  pomodoroInput.value = savedMinutes;
  timerTotal     = savedMinutes * 60;
  timerRemaining = timerTotal;
  setTimerDisplay(timerRemaining);
}

function startTimer() {
  if (timerRunning || timerRemaining <= 0) return;
  timerRunning = true;
  setTimerDisplay(timerRemaining, 'running');

  timerInterval = setInterval(() => {
    timerRemaining--;
    if (timerRemaining <= 0) {
      timerRemaining = 0;
      clearInterval(timerInterval);
      timerRunning = false;
      setTimerDisplay(0, 'finished');
      notifyTimerDone();
    } else {
      setTimerDisplay(timerRemaining, 'running');
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  setTimerDisplay(timerRemaining);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning   = false;
  timerRemaining = timerTotal;
  setTimerDisplay(timerRemaining);
}

function applyCustomTime() {
  const mins = parseInt(pomodoroInput.value, 10);
  if (isNaN(mins) || mins < 1 || mins > 120) {
    pomodoroInput.style.borderColor = 'var(--danger)';
    setTimeout(() => (pomodoroInput.style.borderColor = ''), 1200);
    return;
  }
  clearInterval(timerInterval);
  timerRunning   = false;
  timerTotal     = mins * 60;
  timerRemaining = timerTotal;
  Storage.set('pomodoroMinutes', mins);
  setTimerDisplay(timerRemaining);
}

function notifyTimerDone() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ Focus session complete!', {
      body: 'Great work! Time for a break.',
      icon: ''
    });
  }
  // Fallback: visual flash already handled by .finished class
}

// Request notification permission on first interaction
document.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

startTimerBtn.addEventListener('click', startTimer);
stopTimerBtn.addEventListener('click',  stopTimer);
resetTimerBtn.addEventListener('click', resetTimer);
applyTimeBtn.addEventListener('click',  applyCustomTime);
pomodoroInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyCustomTime();
});

/* ────────────────────────────────────────────────────────────
   TO-DO LIST
──────────────────────────────────────────────────────────── */
const todoForm  = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList  = document.getElementById('todoList');
const todoEmpty = document.getElementById('todoEmpty');

/** @type {{ id: number, text: string, done: boolean }[]} */
let todos = [];

function saveTodos() {
  Storage.set('todos', todos);
}

function loadTodos() {
  todos = Storage.get('todos', []);
}

function renderTodos() {
  todoList.innerHTML = '';
  todoEmpty.style.display = todos.length === 0 ? 'block' : 'none';

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo__item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    // checkbox
    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'todo__checkbox';
    cb.checked   = todo.done;
    cb.setAttribute('aria-label', `Mark "${todo.text}" as done`);
    cb.addEventListener('change', () => toggleTodo(todo.id));

    // text span
    const span = document.createElement('span');
    span.className   = 'todo__text';
    span.textContent = todo.text;

    // actions
    const actions = document.createElement('div');
    actions.className = 'todo__actions';

    const editBtn = document.createElement('button');
    editBtn.className   = 'btn--edit';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit "${todo.text}"`);
    editBtn.addEventListener('click', () => startEditTodo(todo.id, li, span));

    const delBtn = document.createElement('button');
    delBtn.className   = 'btn--delete';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', `Delete "${todo.text}"`);
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    todoList.append(li);
  });
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const id = Date.now();
  todos.push({ id, text: trimmed, done: false });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function startEditTodo(id, li, span) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  // Replace span with input
  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'todo__edit-input';
  input.value     = todo.text;
  li.replaceChild(input, span);
  input.focus();

  function commitEdit() {
    const newText = input.value.trim();
    if (newText && newText !== todo.text) {
      todo.text = newText;
      saveTodos();
    }
    renderTodos();
  }

  input.addEventListener('blur',   commitEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { input.blur(); }
    if (e.key === 'Escape') { renderTodos(); } // cancel
  });
}

todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
});

/* ────────────────────────────────────────────────────────────
   QUICK LINKS
──────────────────────────────────────────────────────────── */
const linkForm  = document.getElementById('linkForm');
const linkNameI = document.getElementById('linkName');
const linkUrlI  = document.getElementById('linkUrl');
const linkList  = document.getElementById('linkList');
const linkEmpty = document.getElementById('linkEmpty');

/** @type {{ id: number, name: string, url: string }[]} */
let links = [];

function saveLinks() {
  Storage.set('quickLinks', links);
}

function loadLinks() {
  links = Storage.get('quickLinks', []);
}

/** Normalise a URL – add https:// if protocol missing */
function normaliseUrl(raw) {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return 'https://' + trimmed;
  return trimmed;
}

/** Extract a simple favicon URL from the link's hostname */
function faviconUrl(url) {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?sz=16&domain=${origin}`;
  } catch {
    return '';
  }
}

function renderLinks() {
  linkList.innerHTML = '';
  linkEmpty.style.display = links.length === 0 ? 'block' : 'none';

  links.forEach(link => {
    const wrapper = document.createElement('div');
    wrapper.className = 'link__item';

    const a = document.createElement('a');
    a.href          = link.url;
    a.target        = '_blank';
    a.rel           = 'noopener noreferrer';
    a.className     = 'link__btn';
    a.setAttribute('aria-label', `Open ${link.name}`);

    const favicon = document.createElement('img');
    favicon.src    = faviconUrl(link.url);
    favicon.width  = 16;
    favicon.height = 16;
    favicon.alt    = '';
    favicon.style.borderRadius = '3px';
    // hide broken image icons
    favicon.onerror = () => (favicon.style.display = 'none');

    a.append(favicon, document.createTextNode(link.name));

    const removeBtn = document.createElement('button');
    removeBtn.className   = 'link__remove';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
    removeBtn.addEventListener('click', () => removeLink(link.id));

    wrapper.append(a, removeBtn);
    linkList.append(wrapper);
  });
}

function addLink(name, url) {
  const trimmedName = name.trim();
  const normUrl     = normaliseUrl(url);
  if (!trimmedName || !normUrl) return;

  links.push({ id: Date.now(), name: trimmedName, url: normUrl });
  saveLinks();
  renderLinks();
}

function removeLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = linkNameI.value;
  const url  = linkUrlI.value;
  if (!name.trim() || !url.trim()) return;
  addLink(name, url);
  linkNameI.value = '';
  linkUrlI.value  = '';
});

/* ────────────────────────────────────────────────────────────
   INIT – run everything
──────────────────────────────────────────────────────────── */
function init() {
  initTheme();       // Challenge 1 – theme
  updateGreeting();  // Challenge 2 – custom name used here
  updateClock();     // live clock
  initTimer();       // Challenge 3 – Pomodoro with custom time
  loadTodos();
  renderTodos();
  loadLinks();
  renderLinks();
}

init();

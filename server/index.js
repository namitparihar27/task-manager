const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { readTasks, writeTasks } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// GET /api/tasks - list all tasks, sorted newest first
app.get('/api/tasks', (req, res) => {
  const tasks = readTasks();
  const sorted = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted);
});

// POST /api/tasks - create a task
app.post('/api/tasks', (req, res) => {
  const { title, description, dueDate } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  const task = {
    id: uuidv4(),
    title: title.trim(),
    description: description ? description.trim() : '',
    dueDate: dueDate || null,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const tasks = readTasks();
  tasks.push(task);
  writeTasks(tasks);
  res.status(201).json(task);
});

// PATCH /api/tasks/:id - update a task (edit fields or toggle complete)
app.patch('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found.' });

  const { title, description, dueDate, completed } = req.body;
  const task = tasks[idx];

  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
    task.title = title.trim();
  }
  if (description !== undefined) task.description = description.trim();
  if (dueDate !== undefined) task.dueDate = dueDate || null;
  if (completed !== undefined) task.completed = Boolean(completed);
  task.updatedAt = new Date().toISOString();

  tasks[idx] = task;
  writeTasks(tasks);
  res.json(task);
});


});
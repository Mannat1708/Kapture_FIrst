// ===== Select Elements =====
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const dateInput = document.getElementById("dateInput");
const addTaskBtn = document.getElementById("addTaskBtn");

const createdList = document.getElementById("createdList");
const progressList = document.getElementById("progressList");
const completedList = document.getElementById("completedList");

const taskCounter = document.getElementById("taskCounter");
const progressBar = document.getElementById("progressBar");
const themeToggle = document.getElementById("themeToggle");

const sortPriorityBtn = document.getElementById("sortPriorityBtn");
const sortDateBtn = document.getElementById("sortDateBtn");
const resetOrderBtn = document.getElementById("resetOrderBtn"); 


// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  setMinDeadline();   // prevent past dates
  loadTasks();
  loadTheme();
});

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

// Theme Toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Sorting
sortPriorityBtn.addEventListener("click", () => sortTasks("priority"));
sortDateBtn.addEventListener("click", () => sortTasks("date"));
resetOrderBtn.addEventListener("click", resetOrder); 


// Functions 

// Prevent selecting past dates
function setMinDeadline() {
  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);
}

function addTask() {
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;
  const dueDate = dateInput.value;

  if (text === "") return;

  const order = Date.now(); 

  const li = createTaskElement(text, priority, dueDate, "created", order);
  createdList.appendChild(li);

  saveTasks();
  updateUI();

  taskInput.value = "";
  dateInput.value = "";
  prioritySelect.value = "low";
}

function createTaskElement(text, priority, dueDate, status, order) {
  const li = document.createElement("li");
  li.classList.add(`priority-${priority}`);
  li.dataset.order = order; 

  // Task text
  const span = document.createElement("span");
  span.textContent = text;
  li.appendChild(span);

  // Priority badge
  const priorityBadge = document.createElement("span");
  priorityBadge.className = `badge priority-badge ${priority}`;
  priorityBadge.textContent = priority;
  li.appendChild(priorityBadge);

  // Due date
  if (dueDate) {
    const dateBadge = document.createElement("span");
    dateBadge.className = "badge category-badge";
    dateBadge.textContent = dueDate;
    li.appendChild(dateBadge);
  }

  // Status dropdown
  const statusSelect = document.createElement("select");
  ["created", "progress", "completed"].forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
    if (s === status) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusSelect.addEventListener("change", () => moveTask(li, statusSelect.value));
  li.appendChild(statusSelect);

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "X";
  deleteBtn.classList.add("delete-btn");
  deleteBtn.addEventListener("click", () => {
    li.remove();
    saveTasks();
    updateUI();
  });
  li.appendChild(deleteBtn);

  return li;
}

function moveTask(li, newStatus) {
  if (newStatus === "created") createdList.appendChild(li);
  if (newStatus === "progress") progressList.appendChild(li);
  if (newStatus === "completed") {
    completedList.appendChild(li);
    li.classList.add("completed");
  } else {
    li.classList.remove("completed");
  }
  saveTasks();
  updateUI();
}

// Save tasks
function saveTasks() {
  const tasks = [];
  document.querySelectorAll(".taskList li").forEach((li) => {
    const status = li.parentElement.id === "createdList" ? "created" :
                   li.parentElement.id === "progressList" ? "progress" : "completed";
    tasks.push({
      text: li.querySelector("span").textContent,
      priority: li.classList.contains("priority-high") ? "high" :
                li.classList.contains("priority-medium") ? "medium" : "low",
      dueDate: li.querySelector(".category-badge")?.textContent || "",
      status: status,
      order: li.dataset.order 
    });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks
function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach((task) => {
    const li = createTaskElement(task.text, task.priority, task.dueDate, task.status, task.order);
    if (task.status === "created") createdList.appendChild(li);
    if (task.status === "progress") progressList.appendChild(li);
    if (task.status === "completed") {
      completedList.appendChild(li);
      li.classList.add("completed");
    }
  });
  updateUI();
}

// Update progress
function updateUI() {
  const total = document.querySelectorAll(".taskList li").length;
  const completed = completedList.querySelectorAll("li").length;
  const left = total - completed;
  taskCounter.textContent = `${left} task${left !== 1 ? "s" : ""} left`;

  const percent = total > 0 ? (completed / total) * 100 : 0;
  progressBar.style.width = `${percent}%`;
}

// Load theme
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }
}

// Sorting
function sortTasks(type) {
  ["createdList", "progressList", "completedList"].forEach(listId => {
    const list = document.getElementById(listId);
    const tasks = Array.from(list.querySelectorAll("li"));

    tasks.sort((a, b) => {
      if (type === "priority") {
        const order = { high: 3, medium: 2, low: 1 };
        const aPri = a.classList.contains("priority-high") ? "high" :
                     a.classList.contains("priority-medium") ? "medium" : "low";
        const bPri = b.classList.contains("priority-high") ? "high" :
                     b.classList.contains("priority-medium") ? "medium" : "low";
        return order[bPri] - order[aPri];
      } else if (type === "date") {
        const aDate = new Date(a.querySelector(".category-badge")?.textContent || "2100-01-01");
        const bDate = new Date(b.querySelector(".category-badge")?.textContent || "2100-01-01");
        return aDate - bDate;
      }
    });

    list.innerHTML = "";
    tasks.forEach(t => list.appendChild(t));
  });
}

// Reset to natural/manual order
function resetOrder() {
  ["createdList", "progressList", "completedList"].forEach(listId => {
    const list = document.getElementById(listId);
    const tasks = Array.from(list.querySelectorAll("li"));

    tasks.sort((a, b) => a.dataset.order - b.dataset.order);

    list.innerHTML = "";
    tasks.forEach(t => list.appendChild(t));
  });
}

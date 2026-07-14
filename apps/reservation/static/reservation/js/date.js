const dayGrid = document.getElementById("dayGrid");
const calendarTitle = document.getElementById("calendarTitle");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedDate = null;

function renderCalendar() {
  calendarTitle.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  dayGrid.innerHTML = "";

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    dayGrid.appendChild(cell);
  }

  for (let d = 1; d <= lastDate; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-btn";
    btn.textContent = d;

    const weekday = new Date(viewYear, viewMonth, d).getDay();
    if (weekday === 0) btn.classList.add("sun");
    if (weekday === 6) btn.classList.add("sat");

    const cellDate = new Date(viewYear, viewMonth, d);
    const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) btn.disabled = true;

    if (
      selectedDate &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === d
    ) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      selectedDate = new Date(viewYear, viewMonth, d);
      renderCalendar();
      confirmBtn.disabled = false;
    });

    cell.appendChild(btn);
    dayGrid.appendChild(cell);
  }
}

const confirmBtn = document.getElementById("confirmDate");

confirmBtn.addEventListener("click", () => {
  if (!selectedDate) return;
  const nextUrl = confirmBtn.dataset.nextUrl;
  window.location.href = nextUrl;
});

prevMonthBtn.addEventListener("click", () => {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderCalendar();
});

renderCalendar();

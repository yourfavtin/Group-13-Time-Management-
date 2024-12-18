document.addEventListener("DOMContentLoaded", () => {
  const prevMonthButton = document.getElementById("prevMonth");
  const nextMonthButton = document.getElementById("nextMonth");
  const monthName = document.getElementById("monthName");
  const calendar = document.getElementById("calendar");
  const taskForm = document.getElementById("taskForm");
  const popup = document.getElementById("popup");
  const searchInput = document.getElementById("searchInput");

  let currentDate = new Date();
  let events = {};
  let timerInterval;
  let timerState = {
      isRunning: false,
      startTime: null,
      elapsed: 0,
      estimatedSeconds: 0
  };

  // Load events from localStorage
  function loadEvents() {
      const storedEvents = localStorage.getItem("events");
      if (storedEvents) {
          events = JSON.parse(storedEvents);
      }
  }

  // Save events to localStorage
  function saveEvents() {
      localStorage.setItem("events", JSON.stringify(events));
  }

  function getMonthName(monthIndex) {
      const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
      ];
      return months[monthIndex];
  }

  // Show notification
  function showNotification(message) {
      const notification = document.getElementById("notification");
      const notificationMessage = document.getElementById("notificationMessage");
      notificationMessage.textContent = message;
      notification.classList.remove("hidden");
      setTimeout(() => {
          notification.classList.add("hidden");
      }, 3000);
  }

  // Timer functionality
  function startTimer(estimatedTime) {
      const [hours, minutes] = estimatedTime.split(':');
      timerState.estimatedSeconds = (parseInt(hours) * 3600) + (parseInt(minutes) * 60);
      timerState.startTime = Date.now() - timerState.elapsed;
      timerState.isRunning = true;
      
      timerInterval = setInterval(() => {
          if (timerState.isRunning) {
              timerState.elapsed = Date.now() - timerState.startTime;
              updateTimerDisplay();
              
              if (timerState.elapsed >= timerState.estimatedSeconds * 1000) {
                  clearInterval(timerInterval);
                  timerState.isRunning = false;
                  showNotification("Time's up! Task duration reached.");
              }
          }
      }, 1000);
  }

  function updateTimerDisplay() {
      const timerDisplay = document.getElementById("timer-display");
      if (timerDisplay) {
          const totalSeconds = Math.floor(timerState.elapsed / 1000);
          const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
          const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
          const seconds = String(totalSeconds % 60).padStart(2, "0");
          timerDisplay.innerText = `${hours}:${minutes}:${seconds}`;
      }
  }

  function initializeTimer(task) {
      const startPauseBtn = document.getElementById("startPauseBtn");
      const resetBtn = document.getElementById("resetBtn");

      if (startPauseBtn && resetBtn) {
          startPauseBtn.addEventListener("click", () => {
              if (timerState.isRunning) {
                  clearInterval(timerInterval);
                  startPauseBtn.innerText = "Start";
                  timerState.isRunning = false;
              } else {
                  startTimer(task.estimatedTime);
                  startPauseBtn.innerText = "Pause";
              }
          });

          resetBtn.addEventListener("click", () => {
              clearInterval(timerInterval);
              timerState.elapsed = 0;
              timerState.isRunning = false;
              updateTimerDisplay();
              startPauseBtn.innerText = "Start";
          });
      }
  }

  // Render calendar
  function renderCalendar() {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const today = new Date();

      monthName.innerText = `${getMonthName(currentMonth)} ${currentYear}`;
      calendar.innerHTML = "";

      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      daysOfWeek.forEach(day => {
          const dayElement = document.createElement("div");
          dayElement.classList.add("daysname");
          dayElement.innerText = day;
          calendar.appendChild(dayElement);
      });

      const firstDay = firstDayOfMonth.getDay();
      const totalDays = lastDayOfMonth.getDate();
      const totalCells = 42;
      
      // Add empty cells before first day
      for (let i = 0; i < firstDay; i++) {
          const emptyCell = document.createElement("div");
          emptyCell.classList.add("dates");
          calendar.appendChild(emptyCell);
      }

      for (let day = 1; day <= totalDays; day++) {
          const dateElement = document.createElement("div");
          dateElement.classList.add("dates");
          dateElement.innerText = day;

          const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          if (events[dateKey]) {
              dateElement.classList.add("task-added");
          }

          if (currentMonth === today.getMonth() && 
              currentYear === today.getFullYear() && 
              day < today.getDate()) {
              dateElement.classList.add("disabled");
          } else {
              dateElement.addEventListener("click", () => openPopup(dateKey));
          }

          calendar.appendChild(dateElement);
      }

      // Add remaining empty cells
      const remainingCells = totalCells - (firstDay + totalDays);
      for (let i = 0; i < remainingCells; i++) {
          const emptyCell = document.createElement("div");
          emptyCell.classList.add("dates");
          calendar.appendChild(emptyCell);
      }
  }

  function openPopup(dateKey) {
      const popupTitle = document.getElementById("popup-title");
      const popupDetails = document.getElementById("popup-details");
      const popupStartTime = document.getElementById("popup-startTime");
      const popupEstimatedTime = document.getElementById("popup-estimatedTime");
      const popupContent = document.querySelector(".popup-content");
      
      // Set dateKey for delete/complete functionality
      popupTitle.dataset.dateKey = dateKey;
      
      const task = events[dateKey];
      const [year, month, day] = dateKey.split('-');

      if (task) {
          popupTitle.innerText = `Date: ${day} ${getMonthName(parseInt(month) - 1)} ${year}`;
          popupDetails.innerText = `Task: ${task.title}\nDescription: ${task.description}\nPriority: ${task.priority}`;
          popupStartTime.innerText = `Start Time: ${task.startTime}`;
          popupEstimatedTime.innerText = `Estimated Time: ${task.estimatedTime}`;
          
          // Create timer
          const taskTimer = document.createElement("div");
          taskTimer.id = "task-timer";
          popupContent.appendChild(taskTimer);
          
          initializeTimer(task);
          
          // Show task actions
          document.querySelector(".task-actions").style.display = "flex";
      } else {
          popupTitle.innerText = `Date: ${day} ${getMonthName(parseInt(month) - 1)} ${year}`;
          popupDetails.innerText = "No events available for this day.";
          popupStartTime.innerText = "";
          popupEstimatedTime.innerText = "";
          document.querySelector(".task-actions").style.display = "none";
      }

      popup.classList.remove("hidden");
  }

  // Update task summary
  
  function updateTaskSummary() {
    const taskList = document.getElementById("taskList");
    const today = new Date();
    const currentTab = document.querySelector('.tab-btn.active').dataset.tab;

    taskList.innerHTML = "";

    Object.entries(events).forEach(([date, task]) => {
        const taskDate = new Date(date);
        const showTask = currentTab === 'daily' 
            ? taskDate.toDateString() === today.toDateString()
            : isWithinLastWeek(taskDate, today);

        if (showTask) {
            const taskElement = document.createElement("div");
            taskElement.classList.add("task-item");
            taskElement.innerHTML = `
                <h4>${task.title}</h4>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Start Time:</strong> ${task.startTime}</p>
                <div class="task-timer" id="timer-${date.replace(/-/g, '')}">
                    <div id="timer-display-${date.replace(/-/g, '')}">00:00:00</div>
                    <button class="timer-btn" data-date="${date}">Start</button>
                    <button class="reset-btn" data-date="${date}">Reset</button>
                </div>
                ${task.completed ? '<p class="completed">✓ Completed</p>' : ''}
                <button class="delete-btn" data-date="${date}">Delete</button>
            `;

            // Add delete button functionality
            taskElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                const dateKey = e.target.dataset.date;
                if (dateKey && events[dateKey]) {
                    delete events[dateKey];
                    saveEvents();
                    renderCalendar();
                    updateTaskSummary();
                    showNotification("Task deleted successfully");
                }
            });

              // Add timer functionality
              const startPauseBtn = taskElement.querySelector('.timer-btn');
              const resetBtn = taskElement.querySelector('.reset-btn');
              const timerDisplay = taskElement.querySelector(`#timer-display-${date.replace(/-/g, '')}`);
  
              let timerInterval;
              let elapsedSeconds = 0;
  
              startPauseBtn.addEventListener('click', () => {
                  if (startPauseBtn.textContent === "Start") {
                      startPauseBtn.textContent = "Pause";
                      const startTime = Date.now() - elapsedSeconds * 1000;
  
                      timerInterval = setInterval(() => {
                          elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                          const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
                          const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
                          const seconds = String(elapsedSeconds % 60).padStart(2, "0");
                          timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
                      }, 1000);
                  } else {
                      clearInterval(timerInterval);
                      startPauseBtn.textContent = "Start";
                  }
              });
  
              resetBtn.addEventListener('click', () => {
                  clearInterval(timerInterval);
                  elapsedSeconds = 0;
                  timerDisplay.textContent = "00:00:00";
                  startPauseBtn.textContent = "Start";
              });
  
              taskList.appendChild(taskElement);
          }
      });
  }
            
  function isWithinLastWeek(date, today) {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo && date <= today;
  }

  document.getElementById("closePopup").addEventListener("click", () => {
      popup.classList.add("hidden");
      const taskTimer = document.getElementById("task-timer");
      if (taskTimer) {
          taskTimer.remove();
      }
  });

  prevMonthButton.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
  });

  nextMonthButton.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
  });



  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const taskTitle = document.getElementById("taskTitle").value;
    const taskDescription = document.getElementById("taskDescription").value;
    const taskPriority = document.getElementById("taskPriority").value;
    const taskDay = document.getElementById("taskDay").value;
    const taskStartTime = document.getElementById("taskStartTime").value;
    const taskEstimatedTime = document.getElementById("taskEstimatedTime").value;

    // Check if in edit mode
    const editingDate = taskForm.dataset.editingDate;

    if (editingDate) {
        delete events[editingDate]; // Remove the old entry
        delete taskForm.dataset.editingDate; // Clear edit mode
        showNotification("Task updated successfully!");
    } else {
        showNotification("Task added successfully!");
    }

    // Add or update task
    events[taskDay] = {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        startTime: taskStartTime,
        estimatedTime: taskEstimatedTime,
        completed: false
    };

    taskForm.reset();
    saveEvents();
    renderCalendar();
    updateTaskSummary();
});
document.getElementById("editTask").addEventListener("click", () => {
    const dateKey = document.getElementById("popup-title").dataset.dateKey;

    if (dateKey && events[dateKey]) {
        const task = events[dateKey];

        // Populate the form with the task's details
        document.getElementById("taskTitle").value = task.title;
        document.getElementById("taskDescription").value = task.description;
        document.getElementById("taskPriority").value = task.priority;
        document.getElementById("taskDay").value = dateKey;
        document.getElementById("taskStartTime").value = task.startTime;
        document.getElementById("taskEstimatedTime").value = task.estimatedTime;

        // Add a hidden field to indicate edit mode
        taskForm.dataset.editingDate = dateKey;

        // Close the popup
        document.getElementById("popup").classList.add("hidden");
    }
});


  // Search 
  searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const taskItems = document.getElementsByClassName("task-item");

      Array.from(taskItems).forEach(item => {
          const title = item.querySelector("h4").textContent.toLowerCase();
          item.style.display = title.includes(searchTerm) ? "block" : "none";
      });
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          updateTaskSummary();
      });
  });
  document.getElementById("taskForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const taskTitle = document.getElementById("taskTitle").value;
    const taskDescription = document.getElementById("taskDescription").value;
    const taskPriority = document.getElementById("taskPriority").value;
    const taskDay = document.getElementById("taskDay").value;
    const taskStartTime = document.getElementById("taskStartTime").value;
    const taskEstimatedTime = document.getElementById("taskEstimatedTime").value;

    events[taskDay] = {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        startTime: taskStartTime,
        estimatedTime: taskEstimatedTime,
        completed: false
    };

    showNotification("Task added successfully!");
    taskForm.reset();
    saveEvents();
    renderCalendar();
    updateTaskSummary();
});



  document.getElementById("deleteTask").addEventListener("click", () => {
      const dateKey = document.getElementById("popup-title").dataset.dateKey;
      if (dateKey && events[dateKey]) {
          delete events[dateKey];
          saveEvents();
          renderCalendar();
          updateTaskSummary();
          popup.classList.add("hidden");
          showNotification("Task deleted successfully");
      }
  });
  document.getElementById("completeTask").addEventListener("click", () => {
    const dateKey = document.getElementById("popup-title").dataset.dateKey;
    if (dateKey && events[dateKey]) {
        events[dateKey].completed = true;
        delete events[dateKey]; 
        saveEvents();
        renderCalendar();
        updateTaskSummary();
        popup.classList.add("hidden");
        showNotification("Task marked as complete");
    }
});

  // Save timer state
  window.addEventListener('beforeunload', () => {
      if (timerState.isRunning) {
          localStorage.setItem('timerState', JSON.stringify(timerState));
      }
  });

  // Restore timer state
  const savedTimerState = localStorage.getItem('timerState');
  if (savedTimerState) {
      timerState = JSON.parse(savedTimerState);
      if (timerState.isRunning) {
          startTimer(timerState.estimatedTime);
      }
  }

  // Initialize the application
  loadEvents();
  renderCalendar();
  updateTaskSummary();
});
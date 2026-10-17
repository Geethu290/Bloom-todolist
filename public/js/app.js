/**
 * app.js
 * Bloom — Your Gentle To-Do List
 * Frontend logic using jQuery, Event Handling, DOM Manipulation, and AJAX.
 */

$(document).ready(function () {
  'use strict';

  // =========================================================================
  // 1. APPLICATION STATE
  // =========================================================================
  const state = {
    currentUser: null,         // Currently authenticated user profile
    currentFilter: 'all',      // 'all' | 'today' | 'upcoming' | 'in-progress' | 'completed'
    searchQuery: '',           // Current search string
    sortBy: 'newest',          // 'newest' | 'dueDateSoon' | 'dueDateLate' | 'priorityHigh' | 'priorityLow' | 'titleAsc'
    tasks: [],                 // Cached array of tasks from the server
    isSubmitting: false,       // Prevent double form submissions
    selectedMood: 'Blooming',  // Current mood check-in
  };

  // Predefined gentle motivational quotes
  const quotes = [
    'Bloom where you are planted. 🌸',
    'Little by little, a little becomes a lot. 🌿',
    'Rest and gentle action walk hand in hand. 🤍',
    'Your dreams are blooming in their own sweet time. 🌷',
    'Be soft with yourself today. You are doing enough. 🍃',
    'Every petal matters, every small step counts. 🌼',
    'Take a deep breath and nurture one thing at a time. ✨',
  ];
  let quoteIndex = 0;

  // Filter heading and icon map
  const filterMeta = {
    all: { heading: 'All Tasks 🌸', icon: '🌸', text: 'All Tasks' },
    today: { heading: "Today's Blooms 🌷", icon: '🌷', text: "Today's Tasks" },
    upcoming: { heading: 'Upcoming Seeds 🌿', icon: '🌿', text: 'Upcoming Tasks' },
    'in-progress': { heading: 'Blooming Now ⏳', icon: '🌼', text: 'In Progress' },
    completed: { heading: 'Cherished Blossoms 🤍', icon: '🤍', text: 'Completed Tasks' },
  };

  // =========================================================================
  // 2. UTILITY & HELPER FUNCTIONS
  // =========================================================================

  /**
   * Safe HTML Escaping to prevent Cross-Site Scripting (XSS)
   */
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Get formatted local date string YYYY-MM-DD from a Date object
   */
  function getLocalDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a date string safely into local date components to avoid timezone shifting
   */
  function parseDateSafely(dateStr) {
    if (!dateStr) return null;
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  /**
   * Format display date (e.g. "Oct 18, 2026")
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = parseDateSafely(dateStr);
    if (!date || isNaN(date.getTime())) return '';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Check if a task's due date is today or overdue
   */
  function getDateStatus(dueDateStr, isCompleted) {
    if (!dueDateStr) return { isToday: false, isOverdue: false };
    const todayStr = getLocalDateString(new Date());
    const dueStr = dueDateStr.split('T')[0];

    if (dueStr === todayStr) {
      return { isToday: true, isOverdue: false };
    }
    if (dueStr < todayStr && !isCompleted) {
      return { isToday: false, isOverdue: true };
    }
    return { isToday: false, isOverdue: false };
  }

  /**
   * Toast notification display
   */
  function showToast(message, type = 'info') {
    const iconMap = {
      success: '🌸',
      error: '⚠️',
      info: '✨',
    };
    const icon = iconMap[type] || '✨';

    const $toast = $(`
      <div class="toast toast-${type}" role="alert">
        <span class="toast-icon">${icon}</span>
        <span class="toast-msg">${escapeHtml(message)}</span>
      </div>
    `);

    $('#toastContainer').append($toast);

    // Auto dismiss after 4 seconds
    setTimeout(function () {
      $toast.addClass('fade-out');
      setTimeout(function () {
        $toast.remove();
      }, 300);
    }, 4000);
  }

  /**
   * Update header date display
   */
  function renderHeaderDate() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    $('#currentDateDisplay').text(now.toLocaleDateString('en-US', options));
  }

  /**
   * Set dynamic motivational quote
   */
  function rotateQuote() {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    $('#headerQuoteText').text(quotes[quoteIndex]);
  }

  // =========================================================================
  // 3. SERVER HEALTH & DATABASE CONNECTION CHECK
  // =========================================================================
  function checkDatabaseHealth() {
    $.ajax({
      url: '/api/health',
      method: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.databaseConnected) {
          $('#dbStatusPill')
            .removeClass('disconnected')
            .addClass('connected')
            .attr('title', 'MongoDB is connected and ready');
          $('#dbStatusText').text('MongoDB Connected 🌸');
          $('#dbWarningBanner').slideUp(200);
        } else {
          $('#dbStatusPill')
            .removeClass('connected')
            .addClass('disconnected')
            .attr('title', 'MongoDB is not running');
          $('#dbStatusText').text('MongoDB Disconnected ⚠️');
          $('#dbWarningBanner').slideDown(200);
        }
      },
      error: function () {
        $('#dbStatusPill')
          .removeClass('connected')
          .addClass('disconnected');
        $('#dbStatusText').text('Server Unreachable');
        $('#dbWarningBanner').slideDown(200);
      },
    });
  }

  // =========================================================================
  // 3. USER AUTHENTICATION & SESSION MANAGEMENT
  // =========================================================================

  /**
   * Verify server session on page load; redirect to login if unauthenticated
   */
  function checkUserSession() {
    $.ajax({
      url: '/api/auth/me',
      method: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.success && res.isAuthenticated && res.user) {
          state.currentUser = res.user;
          updateUserUI(res.user);
        } else {
          window.location.href = '/login.html';
        }
      },
      error: function () {
        window.location.href = '/login.html';
      },
    });
  }

  /**
   * Update header personalized greeting and sidebar profile card
   */
  function updateUserUI(user) {
    if (!user || !user.name) return;
    // Personalized greeting in header
    $('#headerGreeting').text(`A little space for you, ${escapeHtml(user.name)} ✨`);
    // Sidebar profile card
    $('#sidebarUserName').text(escapeHtml(user.name));
    $('#userAvatar').text(user.name.charAt(0).toUpperCase());
  }

  /**
   * Destroy session and redirect to login
   */
  function handleLogout() {
    $.ajax({
      url: '/api/auth/logout',
      method: 'POST',
      dataType: 'json',
      success: function (res) {
        showToast(res.message || 'Logged out gently. See you soon! 🌿', 'info');
        setTimeout(function () {
          window.location.href = '/login.html';
        }, 500);
      },
      error: function () {
        window.location.href = '/login.html';
      },
    });
  }

  // =========================================================================
  // 4. AJAX API CALLS (CRUD OPERATIONS)
  // =========================================================================

  /**
   * GET /api/tasks: Retrieve all tasks from MongoDB
   */
  function loadTasks() {
    $('#taskListContainer').html(`
      <div class="loading-state">
        <div class="bloom-spinner">🌸</div>
        <p>Gathering your blooms...</p>
      </div>
    `);

    $.ajax({
      url: '/api/tasks',
      method: 'GET',
      dataType: 'json',
      success: function (response) {
        if (response.success && Array.isArray(response.data)) {
          state.tasks = response.data;
          renderApp();
        } else {
          showToast('Could not read tasks from server.', 'error');
        }
      },
      error: function (xhr) {
        if (xhr.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        const errorMsg = xhr.responseJSON && xhr.responseJSON.message
          ? xhr.responseJSON.message
          : 'Unable to connect to database.';
        
        $('#taskListContainer').html(`
          <div class="empty-garden-state">
            <div class="empty-flower-icon">⚠️</div>
            <h4 class="empty-title">Database Unavailable</h4>
            <p class="empty-subtitle">${escapeHtml(errorMsg)}</p>
          </div>
        `);
        showToast(errorMsg, 'error');
        checkDatabaseHealth();
      },
    });
  }

  /**
   * POST /api/tasks: Plant a new task in MongoDB
   */
  function createNewTask(taskData) {
    const $submitBtn = $('#submitTaskBtn');
    $submitBtn.prop('disabled', true);
    $submitBtn.find('.btn-text').hide();
    $submitBtn.find('.btn-spinner').show();

    $.ajax({
      url: '/api/tasks',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(taskData),
      dataType: 'json',
      success: function (response) {
        showToast(response.message || 'Task planted successfully! 🌸', 'success');
        // Reset form fields
        $('#addTaskForm')[0].reset();
        $('#taskPriority').val('Medium');
        $('#taskStatus').val('To Do');
        $('#titleError').removeClass('visible').text('');
        $('#taskTitle').removeClass('error');
        // Refresh tasks
        loadTasks();
      },
      error: function (xhr) {
        const msg = xhr.responseJSON && xhr.responseJSON.message
          ? xhr.responseJSON.message
          : 'Failed to plant task.';
        showToast(msg, 'error');
      },
      complete: function () {
        $submitBtn.prop('disabled', false);
        $submitBtn.find('.btn-spinner').hide();
        $submitBtn.find('.btn-text').show();
      },
    });
  }

  /**
   * PUT /api/tasks/:id: Update existing task details in MongoDB
   */
  function updateExistingTask(id, taskData) {
    const $saveBtn = $('#saveEditBtn');
    $saveBtn.prop('disabled', true);
    $saveBtn.find('.btn-text').hide();
    $saveBtn.find('.btn-spinner').show();

    $.ajax({
      url: `/api/tasks/${id}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(taskData),
      dataType: 'json',
      success: function (response) {
        showToast(response.message || 'Task updated! 🌿', 'success');
        closeEditModal();
        loadTasks();
      },
      error: function (xhr) {
        const msg = xhr.responseJSON && xhr.responseJSON.message
          ? xhr.responseJSON.message
          : 'Failed to update task.';
        showToast(msg, 'error');
      },
      complete: function () {
        $saveBtn.prop('disabled', false);
        $saveBtn.find('.btn-spinner').hide();
        $saveBtn.find('.btn-text').show();
      },
    });
  }

  /**
   * PATCH /api/tasks/:id/status: Toggle task status (Completed <-> To Do)
   */
  function toggleTaskStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Completed' ? 'To Do' : 'Completed';

    $.ajax({
      url: `/api/tasks/${id}/status`,
      method: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({ status: newStatus }),
      dataType: 'json',
      success: function (response) {
        showToast(response.message || 'Status updated! ✨', 'success');
        loadTasks();
      },
      error: function (xhr) {
        const msg = xhr.responseJSON && xhr.responseJSON.message
          ? xhr.responseJSON.message
          : 'Failed to update status.';
        showToast(msg, 'error');
      },
    });
  }

  /**
   * DELETE /api/tasks/:id: Delete a task from MongoDB
   */
  function deleteConfirmedTask(id) {
    const $deleteBtn = $('#confirmDeleteBtn');
    $deleteBtn.prop('disabled', true);
    $deleteBtn.find('.btn-text').hide();
    $deleteBtn.find('.btn-spinner').show();

    $.ajax({
      url: `/api/tasks/${id}`,
      method: 'DELETE',
      dataType: 'json',
      success: function (response) {
        showToast(response.message || 'Task gently removed 🍃', 'info');
        closeDeleteModal();
        loadTasks();
      },
      error: function (xhr) {
        const msg = xhr.responseJSON && xhr.responseJSON.message
          ? xhr.responseJSON.message
          : 'Failed to remove task.';
        showToast(msg, 'error');
      },
      complete: function () {
        $deleteBtn.prop('disabled', false);
        $deleteBtn.find('.btn-spinner').hide();
        $deleteBtn.find('.btn-text').show();
      },
    });
  }

  // =========================================================================
  // 5. DOM MANIPULATION & RENDERING
  // =========================================================================

  /**
   * Master render method: computes metrics and renders cards
   */
  function renderApp() {
    updateDashboardMetrics();
    renderFilteredTasks();
  }

  /**
   * Calculate dashboard metrics and sidebar counts from state.tasks
   */
  function updateDashboardMetrics() {
    const all = state.tasks;
    const total = all.length;
    const todayStr = getLocalDateString(new Date());

    let countAll = total;
    let countToday = 0;
    let countUpcoming = 0;
    let countInProgress = 0;
    let countCompleted = 0;
    let completedToday = 0;

    all.forEach(function (t) {
      const isDone = t.status === 'Completed';
      const isInProg = t.status === 'In Progress';
      const dueStr = t.dueDate ? t.dueDate.split('T')[0] : null;

      // Status counters
      if (isDone) countCompleted++;
      if (isInProg) countInProgress++;

      // Today filter counter: due today
      if (dueStr === todayStr) {
        countToday++;
      }

      // Upcoming filter counter: future date and not completed
      if (dueStr && dueStr > todayStr && !isDone) {
        countUpcoming++;
      }

      // Completed today counter: completed status and updated/created today
      if (isDone) {
        const updatedStr = (t.updatedAt || t.createdAt || '').split('T')[0];
        if (updatedStr === todayStr || dueStr === todayStr) {
          completedToday++;
        }
      }
    });

    const pendingTotal = total - countCompleted;
    const progressPercent = total > 0 ? Math.round((countCompleted / total) * 100) : 0;

    // Update Sidebar Badges
    $('#countAll').text(countAll);
    $('#countToday').text(countToday);
    $('#countUpcoming').text(countUpcoming);
    $('#countInProgress').text(countInProgress);
    $('#countCompleted').text(countCompleted);

    // Update Sidebar Progress Card
    $('#sidebarCompletedCount').text(countCompleted);
    $('#sidebarProgressFill').css('width', `${progressPercent}%`);
    $('#sidebarProgressLabel').text(`${progressPercent}% completed`);

    // Update Dashboard Cards
    $('#dashCompletedToday').text(completedToday);
    $('#dashPendingTotal').text(pendingTotal);
    $('#dashProgressPercent').text(`${progressPercent}%`);
    $('#dashProgressFill').css('width', `${progressPercent}%`);
  }

  /**
   * Filter, search, and sort tasks, then render cards into DOM
   */
  function renderFilteredTasks() {
    const todayStr = getLocalDateString(new Date());
    let list = [...state.tasks];

    // 1. Apply active filter
    if (state.currentFilter === 'today') {
      list = list.filter((t) => t.dueDate && t.dueDate.split('T')[0] === todayStr);
    } else if (state.currentFilter === 'upcoming') {
      list = list.filter((t) => t.dueDate && t.dueDate.split('T')[0] > todayStr && t.status !== 'Completed');
    } else if (state.currentFilter === 'in-progress') {
      list = list.filter((t) => t.status === 'In Progress');
    } else if (state.currentFilter === 'completed') {
      list = list.filter((t) => t.status === 'Completed');
    }

    // 2. Apply search query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.trim().toLowerCase();
      list = list.filter((t) => {
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        return titleMatch || descMatch;
      });
    }

    // 3. Apply sorting
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };

    list.sort(function (a, b) {
      if (state.sortBy === 'dueDateSoon') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (state.sortBy === 'dueDateLate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
      if (state.sortBy === 'priorityHigh') {
        const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        return diff !== 0 ? diff : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (state.sortBy === 'priorityLow') {
        const diff = (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        return diff !== 0 ? diff : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (state.sortBy === 'titleAsc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      // Default: newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Update filter indicators in UI
    const meta = filterMeta[state.currentFilter] || filterMeta.all;
    $('#dynamicHeading').text(meta.heading);
    $('#currentFilterIcon').text(meta.icon);
    $('#currentFilterText').text(`Showing: ${meta.text}`);
    $('#taskCountIndicator').text(`${list.length} ${list.length === 1 ? 'task' : 'tasks'}`);

    // Render cards into container
    const $container = $('#taskListContainer');
    const $empty = $('#emptyStateContainer');

    $container.empty();

    if (list.length === 0) {
      $empty.show();
      // Customize empty message based on context
      if (state.searchQuery.trim() !== '') {
        $empty.find('.empty-flower-icon').text('🔍');
        $empty.find('.empty-title').text('No blossoms match your search');
        $empty.find('.empty-subtitle').text('Try searching with different keywords.');
      } else if (state.currentFilter === 'today') {
        $empty.find('.empty-flower-icon').text('🌷');
        $empty.find('.empty-title').text('No tasks scheduled for today');
        $empty.find('.empty-subtitle').text('A peaceful day! Plant or schedule a task for today above.');
      } else if (state.currentFilter === 'upcoming') {
        $empty.find('.empty-flower-icon').text('🌿');
        $empty.find('.empty-title').text('No upcoming tasks found');
        $empty.find('.empty-subtitle').text('Future days are clear and open.');
      } else if (state.currentFilter === 'in-progress') {
        $empty.find('.empty-flower-icon').text('🌼');
        $empty.find('.empty-title').text('No tasks currently in progress');
        $empty.find('.empty-subtitle').text('Pick a seed from your to-do list and nurture it.');
      } else if (state.currentFilter === 'completed') {
        $empty.find('.empty-flower-icon').text('🤍');
        $empty.find('.empty-title').text('No completed blossoms yet');
        $empty.find('.empty-subtitle').text('Check off tasks when finished and watch your garden harvest grow.');
      } else {
        $empty.find('.empty-flower-icon').text('🌷');
        $empty.find('.empty-title').text('Your little garden is empty 🌷');
        $empty.find('.empty-subtitle').text('Plant a task above and watch it bloom.');
      }
      return;
    }

    $empty.hide();

    // Append each task card
    list.forEach(function (task) {
      const cardHtml = createTaskCardHtml(task);
      $container.append(cardHtml);
    });
  }

  /**
   * Generate safe HTML for a single task card
   */
  function createTaskCardHtml(task) {
    const isCompleted = task.status === 'Completed';
    const completedClass = isCompleted ? 'is-completed' : '';

    // Date calculations
    const displayDate = task.dueDate ? formatDisplayDate(task.dueDate) : '';
    const dateStatus = getDateStatus(task.dueDate, isCompleted);
    let dueDateClass = 'badge-due-date';
    let dueDateLabel = displayDate;

    if (dateStatus.isToday) {
      dueDateClass += ' is-today';
      dueDateLabel = `Today (${displayDate})`;
    } else if (dateStatus.isOverdue) {
      dueDateClass += ' is-overdue';
      dueDateLabel = `Overdue (${displayDate})`;
    }

    // Priority formatting
    const priority = task.priority || 'Medium';
    const priorityClass = `badge-priority-${priority.toLowerCase()}`;
    const priorityIcon = priority === 'High' ? '🌸' : priority === 'Medium' ? '🌾' : '🌿';

    // Status formatting
    const status = task.status || 'To Do';
    const statusSlug = status.toLowerCase().replace(/\s+/g, '-');
    const statusClass = `badge-status-${statusSlug}`;
    const statusIcon = status === 'Completed' ? '✅' : status === 'In Progress' ? '⏳' : '📝';

    // Created date
    const plantedDate = task.createdAt ? formatDisplayDate(task.createdAt) : '';

    return `
      <article class="task-card ${completedClass}" data-id="${task._id}">
        <!-- Completion Checkbox Toggle -->
        <div class="task-check-wrapper">
          <button
            type="button"
            class="task-checkbox-btn"
            data-id="${task._id}"
            data-status="${escapeHtml(status)}"
            aria-label="${isCompleted ? 'Mark as incomplete' : 'Mark as completed'}"
            title="${isCompleted ? 'Mark as to do' : 'Mark as completed'}"
          ></button>
        </div>

        <!-- Task Content -->
        <div class="task-content">
          <h4 class="task-title">${escapeHtml(task.title)}</h4>
          ${
            task.description
              ? `<p class="task-desc">${escapeHtml(task.description)}</p>`
              : ''
          }

          <!-- Metadata Badges -->
          <div class="task-meta-row">
            ${
              displayDate
                ? `<span class="badge ${dueDateClass}" title="Due Date">📅 ${escapeHtml(dueDateLabel)}</span>`
                : ''
            }
            <span class="badge ${priorityClass}" title="Priority">${priorityIcon} ${escapeHtml(priority)}</span>
            <span class="badge ${statusClass}" title="Status">${statusIcon} ${escapeHtml(status)}</span>
            ${
              plantedDate
                ? `<span class="badge-created-date" title="Creation Date">Planted ${escapeHtml(plantedDate)}</span>`
                : ''
            }
          </div>
        </div>

        <!-- Action Buttons (Edit & Delete) -->
        <div class="task-actions">
          <button
            type="button"
            class="action-btn edit-btn"
            data-id="${task._id}"
            aria-label="Edit task"
            title="Edit task"
          >✏️</button>
          <button
            type="button"
            class="action-btn delete-btn"
            data-id="${task._id}"
            data-title="${escapeHtml(task.title)}"
            aria-label="Delete task"
            title="Delete task"
          >🗑️</button>
        </div>
      </article>
    `;
  }

  // =========================================================================
  // 6. MODAL CONTROLLERS (EDIT & DELETE)
  // =========================================================================

  function openEditModal(task) {
    $('#editTaskId').val(task._id);
    $('#editTaskTitle').val(task.title);
    $('#editTaskDescription').val(task.description || '');
    
    // Format due date for date input: YYYY-MM-DD
    if (task.dueDate) {
      $('#editTaskDueDate').val(task.dueDate.split('T')[0]);
    } else {
      $('#editTaskDueDate').val('');
    }

    $('#editTaskPriority').val(task.priority || 'Medium');
    $('#editTaskStatus').val(task.status || 'To Do');

    $('#editTitleError').removeClass('visible').text('');
    $('#editTaskTitle').removeClass('error');

    $('#editTaskModal').fadeIn(200);
    $('#editTaskTitle').focus();
  }

  function closeEditModal() {
    $('#editTaskModal').fadeOut(150);
  }

  function openDeleteModal(id, title) {
    $('#deleteTaskId').val(id);
    $('#deleteTaskTitleDisplay').text(`"${title}"`);
    $('#deleteModal').fadeIn(200);
  }

  function closeDeleteModal() {
    $('#deleteModal').fadeOut(150);
  }

  // =========================================================================
  // 7. EVENT HANDLERS
  // =========================================================================

  /**
   * Filter Navigation Buttons (Sidebar)
   */
  $('.nav-filter-btn').on('click', function () {
    const filter = $(this).data('filter');
    state.currentFilter = filter;

    $('.nav-filter-btn').removeClass('active');
    $(this).addClass('active');

    // Close mobile drawer if open
    closeMobileSidebar();

    renderFilteredTasks();
  });

  /**
   * Search Input with real-time feedback
   */
  let searchDebounceTimer = null;
  $('#taskSearchInput').on('input', function () {
    const val = $(this).val();
    state.searchQuery = val;

    if (val.trim() !== '') {
      $('#clearSearchBtn').show();
    } else {
      $('#clearSearchBtn').hide();
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function () {
      renderFilteredTasks();
    }, 200);
  });

  /**
   * Clear Search Button
   */
  $('#clearSearchBtn').on('click', function () {
    $('#taskSearchInput').val('').focus();
    state.searchQuery = '';
    $(this).hide();
    renderFilteredTasks();
  });

  /**
   * Sort Dropdown Change
   */
  $('#taskSortSelect').on('change', function () {
    state.sortBy = $(this).val();
    renderFilteredTasks();
  });

  /**
   * Add Task Form Submit
   */
  $('#addTaskForm').on('submit', function (e) {
    e.preventDefault();

    const title = $('#taskTitle').val().trim();
    const description = $('#taskDescription').val().trim();
    const dueDate = $('#taskDueDate').val();
    const priority = $('#taskPriority').val();
    const status = $('#taskStatus').val();

    // Validation
    if (!title) {
      $('#taskTitle').addClass('error').focus();
      $('#titleError').addClass('visible').text('Please enter a gentle task title.');
      return;
    }

    $('#taskTitle').removeClass('error');
    $('#titleError').removeClass('visible').text('');

    const payload = {
      title,
      description,
      dueDate: dueDate || null,
      priority,
      status,
    };

    createNewTask(payload);
  });

  // Remove error state upon typing
  $('#taskTitle').on('input', function () {
    if ($(this).val().trim() !== '') {
      $(this).removeClass('error');
      $('#titleError').removeClass('visible').text('');
    }
  });

  /**
   * Reset Add Task Form Button
   */
  $('#resetTaskBtn').on('click', function () {
    $('#addTaskForm')[0].reset();
    $('#taskPriority').val('Medium');
    $('#taskStatus').val('To Do');
    $('#taskTitle').removeClass('error');
    $('#titleError').removeClass('visible').text('');
  });

  /**
   * Checkbox / Task Status Toggle (Event Delegation)
   */
  $('#taskListContainer').on('click', '.task-checkbox-btn', function (e) {
    e.stopPropagation();
    const id = $(this).data('id');
    const currentStatus = $(this).data('status');
    toggleTaskStatus(id, currentStatus);
  });

  /**
   * Edit Task Button Click (Event Delegation)
   */
  $('#taskListContainer').on('click', '.edit-btn', function (e) {
    e.stopPropagation();
    const id = $(this).data('id');
    const task = state.tasks.find((t) => t._id === id);
    if (task) {
      openEditModal(task);
    }
  });

  /**
   * Edit Task Form Submit
   */
  $('#editTaskForm').on('submit', function (e) {
    e.preventDefault();

    const id = $('#editTaskId').val();
    const title = $('#editTaskTitle').val().trim();
    const description = $('#editTaskDescription').val().trim();
    const dueDate = $('#editTaskDueDate').val();
    const priority = $('#editTaskPriority').val();
    const status = $('#editTaskStatus').val();

    if (!title) {
      $('#editTaskTitle').addClass('error').focus();
      $('#editTitleError').addClass('visible').text('Task title cannot be empty.');
      return;
    }

    $('#editTaskTitle').removeClass('error');
    $('#editTitleError').removeClass('visible').text('');

    const payload = {
      title,
      description,
      dueDate: dueDate || null,
      priority,
      status,
    };

    updateExistingTask(id, payload);
  });

  $('#editTaskTitle').on('input', function () {
    if ($(this).val().trim() !== '') {
      $(this).removeClass('error');
      $('#editTitleError').removeClass('visible').text('');
    }
  });

  $('#closeEditModalBtn, #cancelEditBtn').on('click', closeEditModal);

  /**
   * Delete Task Button Click (Event Delegation)
   */
  $('#taskListContainer').on('click', '.delete-btn', function (e) {
    e.stopPropagation();
    const id = $(this).data('id');
    const title = $(this).data('title');
    openDeleteModal(id, title);
  });

  /**
   * Confirm Delete Button
   */
  $('#confirmDeleteBtn').on('click', function () {
    const id = $('#deleteTaskId').val();
    if (id) {
      deleteConfirmedTask(id);
    }
  });

  $('#cancelDeleteBtn').on('click', closeDeleteModal);

  /**
   * Close Modals on Overlay Click or Escape Key
   */
  $('.modal-overlay').on('click', function (e) {
    if ($(e.target).hasClass('modal-overlay')) {
      closeEditModal();
      closeDeleteModal();
    }
  });

  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      closeEditModal();
      closeDeleteModal();
      closeMobileSidebar();
    }
  });

  /**
   * Motivational Quote Banner Click
   */
  $('#motivationalBanner').on('click', rotateQuote);

  /**
   * Mood Check-in Buttons
   */
  $('.mood-btn').on('click', function () {
    $('.mood-btn').removeClass('active');
    $(this).addClass('active');

    const mood = $(this).data('mood');
    const message = $(this).data('message');
    state.selectedMood = mood;

    $('#moodResponse').text(message);
    showToast(message, 'info');
  });

  /**
   * Mobile Sidebar Drawer Toggle
   */
  function openMobileSidebar() {
    $('#sidebar').addClass('open');
    $('#sidebarBackdrop').addClass('active');
  }

  function closeMobileSidebar() {
    $('#sidebar').removeClass('open');
    $('#sidebarBackdrop').removeClass('active');
  }

  $('#mobileNavToggle').on('click', openMobileSidebar);
  $('#sidebarBackdrop').on('click', closeMobileSidebar);

  /**
   * Logout Button Handlers (Header, Sidebar, Mobile)
   */
  $('#headerLogoutBtn, #sidebarLogoutBtn, #mobileLogoutBtn').on('click', function (e) {
    e.preventDefault();
    handleLogout();
  });

  // =========================================================================
  // 8. INITIALIZATION
  // =========================================================================
  checkUserSession();
  renderHeaderDate();
  checkDatabaseHealth();
  loadTasks();

  // Periodic health check every 15 seconds
  setInterval(checkDatabaseHealth, 15000);
});

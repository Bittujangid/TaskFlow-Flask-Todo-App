/**
 * TaskFlow Interactive Client Script - Phase 6
 * Orchestrates client-side features: AJAX (Fetch), Dark Mode, Search, Filters, Toasts, and Progress.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const toastContainer = document.getElementById('toast-container');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('task-search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tasksContainer = document.getElementById('tasks-container');
    const addTaskForm = document.getElementById('add-task-form');
    const clearAllBtn = document.getElementById('clear-all-btn');
    
    // Progress Selectors
    const percentageText = document.getElementById('progress-percentage-text');
    const fractionText = document.getElementById('progress-fraction-text');
    const barFill = document.getElementById('progress-bar-fill');
    const workspaceCountBadge = document.getElementById('task-workspace-badge');

    /* ==========================================================================
       1. Toast Notifications Engine
       ========================================================================== */
    function showToast(message, type = 'success') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-slide-in`;
        
        let iconClass = 'fa-circle-check';
        if (type === 'danger') iconClass = 'fa-circle-xmark';
        else if (type === 'info') iconClass = 'fa-circle-info';
        else if (type === 'warning') iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-content">${message}</div>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Animate progress bar inside toast
        const progressBar = toast.querySelector('.toast-progress-bar');
        progressBar.style.transition = 'transform 4s linear';
        progressBar.style.transform = 'scaleX(1)';
        
        requestAnimationFrame(() => {
            progressBar.style.transform = 'scaleX(0)';
        });

        // Safe removal after 4 seconds
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Process Flask Flash Alerts as dynamic Toast notifications on load
    function processFlaskFlashes() {
        const items = document.querySelectorAll('#flash-messages-source .flash-message-item');
        items.forEach(item => {
            const category = item.getAttribute('data-category');
            const message = item.getAttribute('data-message');
            showToast(message, category);
        });
        
        // Remove the source element to keep the DOM clean
        const source = document.getElementById('flash-messages-source');
        if (source) source.remove();
    }

    /* ==========================================================================
       2. Dark Mode Toggle
       ========================================================================== */
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            showToast(`Theme switched to ${newTheme} mode!`, 'info');
            
        });
    }

    /* ==========================================================================
       3. Dynamic Stats & Progress updates
       ========================================================================== */
    function updateDashboardStats(stats) {
        // Update Stats Values
        const totalEl = document.getElementById('stats-total');
        const pendingEl = document.getElementById('stats-pending');
        const workingEl = document.getElementById('stats-working');
        const completedEl = document.getElementById('stats-completed');
        
        if (totalEl) totalEl.textContent = stats.total;
        if (pendingEl) pendingEl.textContent = stats.pending;
        if (workingEl) workingEl.textContent = stats.working;
        if (completedEl) completedEl.textContent = stats.done;

        // Update list badge count
        if (workspaceCountBadge) {
            workspaceCountBadge.textContent = `${stats.total} ${stats.total === 1 ? 'task' : 'tasks'}`;
        }

        // Update Progress Bar
        const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
        
        if (percentageText) percentageText.textContent = `${completionRate}%`;
        if (fractionText) fractionText.textContent = `Completed ${stats.done} / ${stats.total}`;
        if (barFill) barFill.style.width = `${completionRate}%`;
    }

    /* ==========================================================================
       4. Client-Side Live Search & Multi-criteria Filtering
       ========================================================================== */
    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';

        const cards = document.querySelectorAll('.task-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.task-title-text').textContent.toLowerCase();
            const status = card.getAttribute('data-status');

            const matchesSearch = title.includes(query);
            const matchesFilter = (activeFilter === 'all' || status === activeFilter);

            if (matchesSearch && matchesFilter) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Empty state placeholder handling
        let placeholder = document.getElementById('no-tasks-placeholder');
        if (visibleCount === 0) {
            if (!placeholder && tasksContainer) {
                placeholder = document.createElement('div');
                placeholder.id = 'no-tasks-placeholder';
                placeholder.className = 'no-tasks-state animate-fade-in';
                placeholder.innerHTML = `
                    <div class="no-tasks-icon"><i class="fa-solid fa-clipboard-question"></i></div>
                    <h3>No tasks match your filters</h3>
                    <p>Try refining your search text or filter options.</p>
                `;
                tasksContainer.appendChild(placeholder);
            } else if (placeholder) {
                placeholder.style.display = 'flex';
                const subtext = placeholder.querySelector('p');
                if (subtext) subtext.textContent = 'Try adjusting your search criteria.';
            }
        } else if (placeholder) {
            placeholder.style.display = 'none';
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    /* ==========================================================================
       5. AJAX Fetch Operations & Dynamic HTML Rendering
       ========================================================================== */

    // Dynamically build a task card
    function createTaskCardNode(task, index) {
        const card = document.createElement('div');
        card.className = 'task-card glassmorphic animate-fade-in';
        card.setAttribute('data-id', task.id);
        card.setAttribute('data-status', task.status);

        let prioBadgeClass = 'badge-prio-medium';
        let emoji = '🟡 Medium';
        if (task.priority === 'High') {
            prioBadgeClass = 'badge-prio-high';
            emoji = '🔥 High';
        } else if (task.priority === 'Low') {
            prioBadgeClass = 'badge-prio-low';
            emoji = '🟢 Low';
        }

        card.innerHTML = `
            <div class="task-card-content">
                <div class="task-title-group">
                    <span class="task-card-index">#${index}</span>
                    <h3 class="task-title-text">${task.title}</h3>
                </div>
                <div class="task-badges">
                    <span class="badge badge-status badge-${task.status.toLowerCase()}">${task.status}</span>
                    <span class="badge badge-priority ${prioBadgeClass}">${emoji}</span>
                </div>
            </div>
            <div class="task-card-actions">
                <button class="action-btn btn-status-toggle" data-id="${task.id}" title="Cycle Status">
                    <i class="fa-solid fa-circle-notch"></i>
                    <span>Cycle Status</span>
                </button>
                <button class="action-btn btn-task-delete" data-id="${task.id}" title="Delete Task">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        return card;
    }

    // 5a. Intercept Add Task Form Submission
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('task-title-input');
            const priorityInput = document.getElementById('task-priority-input');

            if (!titleInput) return;

            const title = titleInput.value.trim();
            const priority = priorityInput ? priorityInput.value : 'Medium';

            fetch('/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, priority })
            })
            .then(res => {
                if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Server error') });
                return res.json();
            })
            .then(data => {
                // Clear inputs
                titleInput.value = '';
                if (priorityInput) priorityInput.value = 'Medium';

                // Success toast
                showToast(data.message || 'Task added successfully!', 'success');

                // Remove placeholder empty state if present
                const placeholder = document.getElementById('no-tasks-placeholder');
                if (placeholder) placeholder.remove();

                // Dynamically Append new Card to DOM
                const index = document.querySelectorAll('.task-card').length + 1;
                const cardNode = createTaskCardNode(data.task, index);
                if (tasksContainer) tasksContainer.appendChild(cardNode);

                // Update Stats and re-filter
                updateDashboardStats(data.stats);
                applyFilters();
            })
            .catch(err => {
                showToast(err.message || 'Failed to add task.', 'danger');
            });
        });
    }

    // 5b. AJAX Event Delegation inside Tasks Container (Toggle & Delete actions)
    if (tasksContainer) {
        tasksContainer.addEventListener('click', (e) => {
            // Find closest button target
            const toggleBtn = e.target.closest('.btn-status-toggle');
            const deleteBtn = e.target.closest('.btn-task-delete');

            if (toggleBtn) {
                const taskId = toggleBtn.getAttribute('data-id');
                handleToggleStatus(taskId);
            } else if (deleteBtn) {
                const taskId = deleteBtn.getAttribute('data-id');
                const card = deleteBtn.closest('.task-card');
                const title = card ? card.querySelector('.task-title-text').textContent.trim() : 'this task';
                
                if (confirm(`Are you sure you want to delete "${title}"?`)) {
                    handleDeleteTask(taskId);
                }
            }
        });
    }

    // 5c. Toggle Status AJAX Logic
    function handleToggleStatus(taskId) {
        fetch(`/toggle/${taskId}`, {
            method: 'POST'
        })
        .then(res => {
            if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Server error') });
            return res.json();
        })
        .then(data => {
            showToast(data.message || 'Status updated!', 'info');

            // Find specific task card in DOM and update details
            const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
            if (card) {
                card.setAttribute('data-status', data.task.status);
                
                // Update badge
                const badge = card.querySelector('.badge-status');
                if (badge) {
                    badge.textContent = data.task.status;
                    badge.className = `badge badge-status badge-${data.task.status.toLowerCase()}`;
                }

                // Update strike-through
                const text = card.querySelector('.task-title-text');
                if (text) {
                    if (data.task.status === 'Done') {
                        text.style.textDecoration = 'line-through';
                        text.style.color = 'var(--text-muted)';
                    } else {
                        text.style.textDecoration = 'none';
                        text.style.color = 'var(--text-primary)';
                    }
                }
            }

            // Sync stats
            updateDashboardStats(data.stats);
            applyFilters();
        })
        .catch(err => {
            showToast(err.message || 'Failed to update status.', 'danger');
        });
    }

    // 5d. Delete Task AJAX Logic
    function handleDeleteTask(taskId) {
        fetch(`/delete/${taskId}`, {
            method: 'POST'
        })
        .then(res => {
            if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Server error') });
            return res.json();
        })
        .then(data => {
            showToast(data.message || 'Task deleted.', 'danger');

            const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
            if (card) {
                // Smooth removal animation
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateY(-8px)';
                
                setTimeout(() => {
                    card.remove();
                    // Re-calculate visible indices
                    document.querySelectorAll('.task-card').forEach((remCard, i) => {
                        const idx = remCard.querySelector('.task-card-index');
                        if (idx) idx.textContent = `#${i + 1}`;
                    });
                    applyFilters();
                }, 300);
            }

            // Sync stats
            updateDashboardStats(data.stats);
        })
        .catch(err => {
            showToast(err.message || 'Failed to delete task.', 'danger');
        });
    }

    // 5e. AJAX Clear Workspace logic
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            const count = document.querySelectorAll('.task-card').length;
            if (count === 0) {
                showToast('Your workspace is already clear.', 'warning');
                return;
            }

            if (confirm('Are you absolutely sure you want to clear all tasks? This action is permanent.')) {
                fetch('/clear', {
                    method: 'POST'
                })
                .then(res => {
                    if (!res.ok) return res.json().then(d => { throw new Error(d.error || 'Server error') });
                    return res.json();
                })
                .then(data => {
                    showToast(data.message || 'Workspace cleared successfully.', 'danger');
                    
                    if (tasksContainer) {
                        tasksContainer.innerHTML = '';
                    }

                    // Reset stats
                    updateDashboardStats(data.stats);
                    applyFilters();
                })
                .catch(err => {
                    showToast(err.message || 'Failed to clear workspace.', 'danger');
                });
            }
        });
    }

    // Initialize statistics on boot
    function loadInitialStats() {
        fetch('/stats')
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Unauthorized');
            })
            .then(stats => {
                updateDashboardStats(stats);
            })
            .catch(err => {
                console.warn('Initial dashboard sync ignored or guest mode active.', err);
            });
    }

    // Bootstrapping
    processFlaskFlashes();
    loadInitialStats();
});
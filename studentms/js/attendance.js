/* ==========================================================================
   STUDENT MANAGEMENT SYSTEM - DAILY ATTENDANCE MANAGER (js/attendance.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const attendanceTbody = document.getElementById('attendance-tbody');
    const isAttendancePage = attendanceTbody !== null;
    if (!isAttendancePage) return;

    const attendanceSessionDate = document.getElementById('attendance-session-date');
    const deptFilter = document.getElementById('attendance-dept-filter');
    const searchInput = document.getElementById('attendance-search-input');
    const btnMarkAllPresent = document.getElementById('btn-mark-all-present');
    const btnMarkAllAbsent = document.getElementById('btn-mark-all-absent');
    const saveAttendanceBtn = document.getElementById('save-attendance-btn');
    const attendanceEmptyState = document.getElementById('attendance-empty-state');

    // Stats Counters
    const statTotalEl = document.getElementById('att-stat-total');
    const statPresentEl = document.getElementById('att-stat-present');
    const statAbsentEl = document.getElementById('att-stat-absent');
    const statRateEl = document.getElementById('att-stat-rate');

    let allStudents = [];
    let attendanceStateMap = {}; // { roll: 'Present' | 'Absent' }

    // Helper: today's date string YYYY-MM-DD
    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Fetch student list & attendance status for selected date and department
    function fetchAttendanceChecklist() {
        if (!attendanceTbody) return;
        const dateVal = attendanceSessionDate ? attendanceSessionDate.value : getTodayString();
        const selectedDept = (deptFilter && deptFilter.value) ? deptFilter.value : '';

        if (!selectedDept || selectedDept === 'ALL') {
            allStudents = [];
            attendanceStateMap = {};
            if (attendanceTbody) attendanceTbody.innerHTML = '';
            if (attendanceEmptyState) {
                attendanceEmptyState.classList.remove('hidden');
                const titleEl = document.getElementById('attendance-empty-title');
                const descEl = document.getElementById('attendance-empty-desc');
                if (titleEl) titleEl.textContent = "Select Date & Department";
                if (descEl) descEl.textContent = "Please choose a session date and department above to load class attendance register.";
            }
            updateStatsSummary();
            return;
        }

        showLoading("Loading class attendance checklist...");
        fetch(`../php/attendance.php?date=${encodeURIComponent(dateVal)}&department=${encodeURIComponent(selectedDept)}`)
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    allStudents = data.records || [];
                    
                    // Initialize state map from server records
                    attendanceStateMap = {};
                    allStudents.forEach(student => {
                        attendanceStateMap[student.roll] = (student.status === 'Absent') ? 'Absent' : 'Present';
                    });

                    renderAttendanceTable();
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                hideLoading();
                showToast("Could not load attendance session.", "error");
                console.error(err);
            });
    }

    window.fetchAttendanceChecklist = fetchAttendanceChecklist;

    // Set default session date input to today
    if (attendanceSessionDate) {
        attendanceSessionDate.value = getTodayString();
        attendanceSessionDate.addEventListener('change', fetchAttendanceChecklist);
    }

    // Render Filtered Table Rows
    function renderAttendanceTable() {
        if (!attendanceTbody) return;
        attendanceTbody.innerHTML = '';

        const selectedDept = (deptFilter && deptFilter.value) ? deptFilter.value : '';
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        if (!selectedDept || selectedDept === 'ALL') {
            if (attendanceEmptyState) {
                attendanceEmptyState.classList.remove('hidden');
                const titleEl = document.getElementById('attendance-empty-title');
                const descEl = document.getElementById('attendance-empty-desc');
                if (titleEl) titleEl.textContent = "Select Date & Department";
                if (descEl) descEl.textContent = "Please choose a session date and department above to load class attendance register.";
            }
            updateStatsSummary();
            return;
        }

        const filtered = allStudents.filter(student => {
            const matchDept = (student.department === selectedDept);
            const matchQuery = !query || 
                (student.name && student.name.toLowerCase().includes(query)) ||
                (student.roll && student.roll.toLowerCase().includes(query));
            return matchDept && matchQuery;
        });

        if (filtered.length === 0) {
            if (attendanceEmptyState) {
                attendanceEmptyState.classList.remove('hidden');
                const titleEl = document.getElementById('attendance-empty-title');
                const descEl = document.getElementById('attendance-empty-desc');
                if (titleEl) titleEl.textContent = "No Students Found";
                if (descEl) descEl.textContent = `No student profiles registered in ${selectedDept} Department.`;
            }
        } else {
            if (attendanceEmptyState) attendanceEmptyState.classList.add('hidden');

            filtered.forEach(student => {
                const currentStatus = attendanceStateMap[student.roll] || 'Present';
                const isChecked = currentStatus === 'Present' ? 'checked' : '';

                // Build Avatar HTML
                let avatarHTML = '';
                if (student.photo) {
                    avatarHTML = `<div class="avatar-sm"><img src="../${student.photo}" alt="${student.name}"></div>`;
                } else {
                    const initials = (student.name || 'S').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    avatarHTML = `<div class="avatar-sm">${initials}</div>`;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 700; color: var(--accent-color);">#${student.id}</td>
                    <td>
                        <div class="name-cell-wrapper">
                            ${avatarHTML}
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 600; color: var(--text-primary);">${student.name}</span>
                            </div>
                        </div>
                    </td>
                    <td style="font-weight: 500;">${student.roll}</td>
                    <td><span class="dept-badge badge-${student.department}">${student.department}</span></td>
                    <td style="text-align: center;">
                        <div style="display: inline-flex; align-items: center; gap: 12px;">
                            <label class="attendance-switch">
                                <input type="checkbox" class="attendance-check" data-roll="${student.roll}" ${isChecked}>
                                <span class="switch-slider"></span>
                            </label>
                            <span class="status-pill ${currentStatus.toLowerCase()}" id="status-pill-${student.roll}">
                                <i class="fa-solid ${currentStatus === 'Present' ? 'fa-check' : 'fa-xmark'}"></i>
                                ${currentStatus.toUpperCase()}
                            </span>
                        </div>
                    </td>
                `;

                const checkbox = tr.querySelector('.attendance-check');
                checkbox.addEventListener('change', () => {
                    const newStatus = checkbox.checked ? 'Present' : 'Absent';
                    attendanceStateMap[student.roll] = newStatus;
                    updateRowPill(student.roll, newStatus);
                    updateStatsSummary();
                });

                attendanceTbody.appendChild(tr);
            });
        }

        updateStatsSummary();
    }

    // Update single row status pill text & style
    function updateRowPill(roll, status) {
        const pill = document.getElementById(`status-pill-${roll}`);
        if (pill) {
            if (status === 'Present') {
                pill.className = 'status-pill present';
                pill.innerHTML = `<i class="fa-solid fa-check"></i> PRESENT`;
            } else {
                pill.className = 'status-pill absent';
                pill.innerHTML = `<i class="fa-solid fa-xmark"></i> ABSENT`;
            }
        }
    }

    // Recalculate summary metrics cards
    function updateStatsSummary() {
        const total = allStudents.length;
        let present = 0;
        let absent = 0;

        allStudents.forEach(s => {
            if (attendanceStateMap[s.roll] === 'Present') {
                present++;
            } else {
                absent++;
            }
        });

        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

        if (statTotalEl) statTotalEl.textContent = total;
        if (statPresentEl) statPresentEl.textContent = present;
        if (statAbsentEl) statAbsentEl.textContent = absent;
        if (statRateEl) statRateEl.textContent = `${rate}%`;
    }

    // Filter Listeners
    if (deptFilter) {
        deptFilter.addEventListener('change', fetchAttendanceChecklist);
    }
    if (searchInput) {
        searchInput.addEventListener('input', renderAttendanceTable);
    }

    // Bulk Mark Actions
    if (btnMarkAllPresent) {
        btnMarkAllPresent.addEventListener('click', () => {
            const selectedDept = deptFilter ? deptFilter.value : '';
            if (!selectedDept) {
                showToast('Please select a Department first.', 'warning');
                return;
            }
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

            allStudents.forEach(student => {
                const matchDept = (student.department === selectedDept);
                const matchQuery = !query || 
                    (student.name && student.name.toLowerCase().includes(query)) ||
                    (student.roll && student.roll.toLowerCase().includes(query));

                if (matchDept && matchQuery) {
                    attendanceStateMap[student.roll] = 'Present';
                }
            });

            renderAttendanceTable();
            showToast(`Marked all ${selectedDept} students as Present.`, 'info');
        });
    }

    if (btnMarkAllAbsent) {
        btnMarkAllAbsent.addEventListener('click', () => {
            const selectedDept = deptFilter ? deptFilter.value : '';
            if (!selectedDept) {
                showToast('Please select a Department first.', 'warning');
                return;
            }
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

            allStudents.forEach(student => {
                const matchDept = (student.department === selectedDept);
                const matchQuery = !query || 
                    (student.name && student.name.toLowerCase().includes(query)) ||
                    (student.roll && student.roll.toLowerCase().includes(query));

                if (matchDept && matchQuery) {
                    attendanceStateMap[student.roll] = 'Absent';
                }
            });

            renderAttendanceTable();
            showToast(`Marked all ${selectedDept} students as Absent.`, 'warning');
        });
    }

    // Save Attendance Session to Backend SQL Database
    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener('click', () => {
            const selectedDept = deptFilter ? deptFilter.value : '';
            if (!selectedDept) {
                showToast('Please select a Department first.', 'warning');
                return;
            }

            const dateVal = attendanceSessionDate ? attendanceSessionDate.value : getTodayString();
            if (Object.keys(attendanceStateMap).length === 0) {
                showToast('No student records found in selected department.', 'warning');
                return;
            }

            showLoading(`Saving ${selectedDept} attendance to database...`);
            fetch('../php/attendance.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateVal, records: attendanceStateMap })
            })
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    showToast(`Attendance saved for ${selectedDept} Department on ${dateVal}!`);
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1200);
                } else {
                    showToast(data.message, 'error');
                }
            })
            .catch(err => {
                hideLoading();
                showToast("Failed to save attendance logs.", "error");
                console.error(err);
            });
        });
    }

    // Initial load trigger
    fetchAttendanceChecklist();
});

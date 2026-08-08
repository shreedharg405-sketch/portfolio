/* ==========================================================================
   STUDENT MANAGEMENT SYSTEM - DASHBOARD & ROTATING METRICS LOGIC (js/dashboard.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const isDashboardPage = document.getElementById('dashboard-view') !== null;
    if (!isDashboardPage) return;

    // --- Router DOM Elements ---
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const viewTitle = document.getElementById('view-title');
    const viewSubtitle = document.getElementById('view-path-subtitle');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');

    const VIEW_METRICS = {
        'dashboard': { title: 'Dashboard', desc: 'Welcome to the Student Database Portal' },
        'count-students': { title: 'Registry Analytics', desc: 'Registry statistics and department ratios' },
        'settings': { title: 'Visual Settings', desc: 'Configure visual styles and data backups' }
    };

    function getViewFromHash(hash) {
        if (hash === 'analytics') return 'count-students';
        if (hash === 'settings') return 'settings';
        if (hash === 'dashboard') return 'dashboard';
        return hash;
    }

    function str_pad(val, size) {
        let s = String(val);
        while (s.length < size) { s = "0" + s; }
        return s;
    }

    // --- Statistics Aggregation Loader ---
    function updateDashboardStats() {
        showLoading("Updating metrics dashboards...");
        fetch('../php/dashboard_stats.php')
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    // Populate counts counters
                    const totalStudEl = document.getElementById('dash-total-students');
                    const presTodayEl = document.getElementById('dash-present-today');
                    const absTodayEl = document.getElementById('dash-absent-today');
                    const totalDeptEl = document.getElementById('dash-total-depts');

                    if (totalStudEl) totalStudEl.textContent = data.total_students;
                    if (presTodayEl) presTodayEl.textContent = data.present_today;
                    if (absTodayEl) absTodayEl.textContent = data.absent_today;
                    if (totalDeptEl) totalDeptEl.textContent = data.total_departments;

                    // Fill department break details with student list chips
                    const statsList = document.getElementById('dept-stats-list');
                    if (statsList) {
                        statsList.innerHTML = '';
                        const deptCounts = data.department_counts || {};
                        const deptStudents = data.department_students || {};
                        const depts = Object.keys(deptCounts);

                        if (depts.length === 0) {
                            statsList.innerHTML = `<p style="font-size:13px; color:var(--text-secondary); text-align:center;">No departments found.</p>`;
                        } else {
                            const counts = Object.values(deptCounts);
                            const maxVal = Math.max(...counts);
                            
                            depts.forEach(dept => {
                                const count = deptCounts[dept];
                                const studentsInDept = deptStudents[dept] || [];
                                const percentage = maxVal > 0 ? ((count / maxVal) * 100).toFixed(0) : 0;
                                
                                const item = document.createElement('div');
                                item.className = 'dept-stat-item';
                                item.style.marginBottom = '16px';
                                item.style.padding = '14px';
                                item.style.borderRadius = 'var(--radius-md)';
                                item.style.backgroundColor = 'var(--bg-secondary)';
                                item.style.border = '1px solid var(--border-color)';
                                item.innerHTML = `
                                    <div class="dept-stat-info" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="window.location.href='view-students.html?department=${encodeURIComponent(dept)}'">
                                        <span class="dept-stat-name" style="font-weight:700; color:var(--text-primary); font-size:14px;">
                                            <i class="fa-solid fa-graduation-cap" style="color:var(--accent-color); margin-right:6px;"></i> ${dept} Department
                                        </span>
                                        <span class="dept-stat-count"><span class="dept-badge badge-${dept}">${count} ${count === 1 ? 'student' : 'students'}</span></span>
                                    </div>
                                    <div class="dept-stat-bar-bg" style="margin:10px 0 0 0; height:8px; background-color:var(--bg-primary); border-radius:6px; overflow:hidden;">
                                        <div class="dept-stat-bar-fill" style="width: 0%; height:100%; background-color:var(--accent-color); transition:width 0.8s ease;"></div>
                                    </div>
                                `;
                                statsList.appendChild(item);
                                
                                // Delayed fill animation
                                setTimeout(() => {
                                    const fill = item.querySelector('.dept-stat-bar-fill');
                                    if (fill) fill.style.width = `${percentage}%`;
                                }, 150);
                            });
                        }
                    }

                    // Populate recent registrations table rows
                    const recentTbody = document.getElementById('recent-students-tbody');
                    const recentEmpty = document.getElementById('recent-empty-state');
                    if (recentTbody) {
                        recentTbody.innerHTML = '';
                        const recents = data.recent_students || [];
                        
                        if (recents.length === 0) {
                            if (recentEmpty) recentEmpty.classList.remove('hidden');
                        } else {
                            if (recentEmpty) recentEmpty.classList.add('hidden');
                            
                            recents.forEach(student => {
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td style="font-weight: 700; color: var(--accent-color);">#${str_pad(student.id, 3)}</td>
                                    <td>
                                        <div class="name-cell-wrapper">
                                            <span style="font-weight: 600;">${student.name}</span>
                                        </div>
                                    </td>
                                    <td>${student.roll}</td>
                                    <td><span class="dept-badge badge-${student.department}">${student.department}</span></td>
                                    <td>${student.email}</td>
                                    <td>${student.phone || '-'}</td>
                                `;
                                recentTbody.appendChild(tr);
                            });
                        }
                    }
                }
            })
            .catch(err => {
                hideLoading();
                console.error("Failed to query dashboard statistics:", err);
            });
    }

    // Analytics Summary Loader
    function loadAnalyticsSummary() {
        const deptList = document.getElementById('analytics-dept-list');
        const genderList = document.getElementById('analytics-gender-list');

        showLoading("Loading analytics breaks...");
        fetch('../php/dashboard_stats.php')
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    // Load departments fills
                    if (deptList) {
                        deptList.innerHTML = '';
                        const deptCounts = data.department_counts || {};
                        const depts = Object.keys(deptCounts);

                        if (depts.length === 0) {
                            deptList.innerHTML = `<p style="font-size:13px; color:var(--text-secondary); text-align:center;">No student statistics compiled.</p>`;
                        } else {
                            const counts = Object.values(deptCounts);
                            const maxVal = Math.max(...counts);
                            
                            depts.forEach(dept => {
                                const count = deptCounts[dept];
                                const pct = maxVal > 0 ? ((count / maxVal) * 100).toFixed(0) : 0;
                                
                                const item = document.createElement('div');
                                item.className = 'dept-stat-item';
                                item.style.marginBottom = '14px';
                                item.innerHTML = `
                                    <div class="dept-stat-info">
                                        <span class="dept-stat-name">${dept} Department</span>
                                        <span class="dept-stat-count">${count} Students</span>
                                    </div>
                                    <div class="dept-stat-bar-bg">
                                        <div class="dept-stat-bar-fill" style="width: ${pct}%;"></div>
                                    </div>
                                `;
                                deptList.appendChild(item);
                            });
                        }
                    }

                    // Load genders breakdown
                    if (genderList) {
                        genderList.innerHTML = '';
                        const genderCounts = data.gender_counts || {};
                        const genders = Object.keys(genderCounts);
                        const total = data.total_students || 0;

                        if (genders.length === 0 || total === 0) {
                            genderList.innerHTML = `<p style="font-size:13px; color:var(--text-secondary); text-align:center;">No gender distributions available.</p>`;
                        } else {
                            genders.forEach(gender => {
                                const count = genderCounts[gender];
                                const ratio = ((count / total) * 100).toFixed(1);
                                
                                let color = 'var(--accent-color)';
                                if (gender === 'Female') color = '#ec4899';
                                if (gender === 'Other') color = '#14b8a6';

                                const block = document.createElement('div');
                                block.style.display = 'flex';
                                block.style.flexDirection = 'column';
                                block.style.gap = '8px';
                                block.innerHTML = `
                                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600;">
                                        <span>${gender}</span>
                                        <span>${count} Students (${ratio}%)</span>
                                    </div>
                                    <div style="height:10px; background-color:var(--bg-primary); border-radius:10px; overflow:hidden;">
                                        <div style="width:${ratio}%; height:100%; background-color:${color}; border-radius:10px;"></div>
                                    </div>
                                `;
                                genderList.appendChild(block);
                            });
                        }
                    }
                }
            })
            .catch(err => {
                hideLoading();
                console.error(err);
            });
    }

    // Expose functions globally for cross-module calls
    window.updateDashboardStats = updateDashboardStats;
    window.loadAnalyticsSummary = loadAnalyticsSummary;

    // --- Switch View Router ---
    window.switchView = function(viewName) {
        const internalViewName = viewName === 'analytics' ? 'count-students' : viewName;

        viewSections.forEach(section => {
            if (section.id === `${internalViewName}-view`) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        navItems.forEach(item => {
            const dataView = item.getAttribute('data-view');
            if (dataView === internalViewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        const hashName = internalViewName === 'count-students' ? 'analytics' : internalViewName;
        const info = VIEW_METRICS[internalViewName] || { title: 'Portal', desc: 'ERP System' };
        if (viewTitle) viewTitle.textContent = info.title;
        if (viewSubtitle) viewSubtitle.textContent = info.desc;
        const breadcrumbContainer = document.querySelector('.breadcrumb-container');
        if (breadcrumbContainer) {
            if (internalViewName === 'dashboard') {
                breadcrumbContainer.innerHTML = `<span class="breadcrumb-item active" id="breadcrumb-current">Dashboard</span>`;
            } else {
                breadcrumbContainer.innerHTML = `
                    <span class="breadcrumb-item" style="cursor: pointer;" onclick="switchView('dashboard')">Dashboard</span>
                    <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
                    <span class="breadcrumb-item active" id="breadcrumb-current">${info.title}</span>
                `;
            }
        }

        // Update URL hash if it differs
        if (window.location.hash !== `#${hashName}`) {
            history.pushState(null, null, `#${hashName}`);
        }

        // Fetch statistics
        if (internalViewName === 'dashboard') {
            if (typeof window.updateDashboardStats === 'function') {
                window.updateDashboardStats();
            }
        } else if (internalViewName === 'count-students') {
            if (typeof window.loadAnalyticsSummary === 'function') {
                window.loadAnalyticsSummary();
            }
        }
    };

    // Listen to hash change
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        const mappedView = getViewFromHash(hash);
        if (mappedView && VIEW_METRICS[mappedView]) {
            switchView(mappedView);
        } else {
            switchView('dashboard');
        }
    });

    // Parse URL hash on page load
    const initialHash = window.location.hash.substring(1);
    const mappedInitialView = getViewFromHash(initialHash);
    if (mappedInitialView && VIEW_METRICS[mappedInitialView]) {
        switchView(mappedInitialView);
    } else {
        switchView('dashboard');
    }

    // Dashboard navigation links
    const welcomeAddBtn = document.getElementById('welcome-add-student-btn');
    if (welcomeAddBtn) {
        welcomeAddBtn.addEventListener('click', () => {
            window.location.href = 'add-student.html';
        });
    }

    const viewAllDashLink = document.getElementById('view-all-dash-link');
    if (viewAllDashLink) {
        viewAllDashLink.addEventListener('click', () => {
            window.location.href = 'view-students.html';
        });
    }

    // --- CSV Export downloads ---
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            showLoading("Exporting database backups...");
            window.location.href = '../php/export_students.php';
            setTimeout(() => {
                hideLoading();
                showToast("Spreadsheet CSV download initiated.");
            }, 1200);
        });
    }
});

/* ==========================================================================
   STUDENT MANAGEMENT SYSTEM - CORE UTILITIES & SYSTEM ROUTER (js/app.js)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Detect active page context
    const isLoginPage = document.getElementById('login-form') !== null;
    const isSignupPage = document.getElementById('signup-form') !== null;
    const isAuthPage = isLoginPage || isSignupPage;

    // --- Core UI Elements ---
    const networkStatusPill = document.getElementById('network-status-pill');
    const networkStatusText = document.getElementById('network-status-text');
    const themeToggleBtn = document.getElementById('header-theme-toggle');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('app-sidebar');

    // --- Theme System ---
    const savedTheme = localStorage.getItem('sms-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    syncThemeIcon(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('sms-theme', newTheme);
            syncThemeIcon(newTheme);
            showToast(`Theme changed to ${newTheme} mode.`, 'info');
        });
    }

    // Settings page theme controls (if available on current page)
    const themeLightBtn = document.getElementById('theme-light-btn');
    const themeDarkBtn = document.getElementById('theme-dark-btn');
    if (themeLightBtn && themeDarkBtn) {
        themeLightBtn.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('sms-theme', 'light');
            syncThemeIcon('light');
            showToast('Theme changed to light mode.', 'info');
        });
        themeDarkBtn.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('sms-theme', 'dark');
            syncThemeIcon('dark');
            showToast('Theme changed to dark mode.', 'info');
        });
    }

    function syncThemeIcon(theme) {
        if (!themeToggleBtn) return;
        const icon = themeToggleBtn.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }

    // --- Collapsible Mobile Sidebar Drawer ---
    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // Click outside closes sidebar drawer
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== menuToggleBtn) {
                sidebar.classList.remove('active');
            }
        });
    }

    // --- Loading Indicators ---
    window.showLoading = function(text = "Loading...") {
        if (!networkStatusPill || !networkStatusText) return;
        networkStatusText.textContent = text;
        networkStatusPill.classList.remove('hidden');
    };

    window.hideLoading = function() {
        if (!networkStatusPill) return;
        networkStatusPill.classList.add('hidden');
    };

    // --- Toast Notifications System ---
    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-xmark';
        if (type === 'warning') iconClass = 'fa-triangle-exclamation';
        if (type === 'info') iconClass = 'fa-circle-info';

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-solid ${iconClass}" style="font-size: 16px;"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Click to close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };

    // --- Session Verification and Autoredirects ---
    function checkSession() {
        showLoading("Verifying portal session...");
        fetch('../php/check_session.php')
            .then(res => res.json())
            .then(data => {
                hideLoading();
                if (data.status === 'success') {
                    if (data.logged_in) {
                        if (isAuthPage) {
                            window.location.href = 'dashboard.html';
                        } else {
                            window.currentUser = data.user;
                            window.currentAdmin = data.user;
                            
                            const isStudent = data.user.role === 'student';
                            if (isStudent) {
                                document.body.classList.add('role-student');
                                document.body.classList.remove('role-admin');
                            } else {
                                document.body.classList.add('role-admin');
                                document.body.classList.remove('role-student');
                            }

                            // Populate header widgets
                            const headerUserAvatar = document.getElementById('header-user-avatar');
                            const headerUserName = document.getElementById('header-user-name');
                            const headerUserRole = document.getElementById('header-user-role') || document.querySelector('.user-role');
                            
                            if (headerUserAvatar) {
                                headerUserAvatar.textContent = data.user.name.charAt(0).toUpperCase();
                            }
                            if (headerUserName) {
                                headerUserName.textContent = data.user.name;
                            }
                            if (headerUserRole) {
                                headerUserRole.textContent = isStudent ? 'Student' : 'Administrator';
                            }
                            // Reveal main page container
                            const appScreen = document.getElementById('app-screen');
                            if (appScreen) appScreen.classList.remove('hidden');

                            // Apply View-Only Mode locks if user is Student
                            if (isStudent) {
                                applyStudentViewOnlyLocks();
                            }

                            // Trigger page specific data loads if available
                            if (typeof window.fetchAttendanceChecklist === 'function') {
                                window.fetchAttendanceChecklist();
                            }

                            // Attach click listeners to user profile widget across page
                            document.querySelectorAll('.user-profile-widget').forEach(widget => {
                                widget.setAttribute('title', isStudent ? 'Click to view Student Details' : 'Click to view Administrator Details');
                                widget.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    window.showAdminProfileModal();
                                });
                            });
                        }
                    } else {
                        redirectToLogin();
                    }
                } else {
                    redirectToLogin();
                }
            })
            .catch(err => {
                hideLoading();
                console.error("Session check fail:", err);
                redirectToLogin();
            });
    }

    // Helper to lock form editing for Student role
    function applyStudentViewOnlyLocks() {
        // Add notice banner to management pages
        const contentBody = document.querySelector('.content-body');
        const formContainer = document.querySelector('form') || document.querySelector('.form-card');
        
        if (formContainer && (window.location.pathname.includes('add-student') || window.location.pathname.includes('edit-student') || window.location.pathname.includes('attendance'))) {
            let existingNotice = document.getElementById('student-view-notice');
            if (!existingNotice) {
                const notice = document.createElement('div');
                notice.id = 'student-view-notice';
                notice.style.cssText = `
                    background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 14px 18px;
                    border-radius: var(--radius-md); color: #d97706; font-weight: 600; margin-bottom: 20px;
                    display: flex; align-items: center; gap: 12px; font-size: 13px;
                `;
                notice.innerHTML = `<i class="fa-solid fa-lock" style="font-size: 18px;"></i> <span><strong>View-Only Mode:</strong> You are logged in as a Student. Registering, editing, or modifying records is restricted to Administrators.</span>`;
                formContainer.parentNode.insertBefore(notice, formContainer);
            }

            // Disable all form submit buttons & input fields
            document.querySelectorAll('form input, form select, form textarea, form button[type="submit"]').forEach(el => {
                el.disabled = true;
                el.style.cursor = 'not-allowed';
            });
        }
    }

    // --- Admin Profile Modal Popup ---
    window.showAdminProfileModal = function() {
        let existingModal = document.getElementById('admin-profile-modal-overlay');
        if (existingModal) existingModal.remove();

        const user = window.currentUser || window.currentAdmin || { name: 'User', email: 'user@studentms.com', id: 1, role: 'admin' };
        const initial = (user.name || 'U').charAt(0).toUpperCase();
        const isStudent = user.role === 'student';

        const roleBadgeTitle = isStudent ? 'Student Account' : 'System Administrator';
        const roleFullTitle = isStudent ? 'Student Portal' : 'Super Administrator';
        const detailsHeader = isStudent ? 'Student Profile Details' : 'Administrator Profile Details';
        const idLabel = isStudent ? 'Student ID' : 'Administrator ID';
        const idCode = isStudent ? `#STD-${String(user.id || 1).padStart(3, '0')}` : `#ADM-${String(user.id || 1).padStart(3, '0')}`;

        const overlay = document.createElement('div');
        overlay.id = 'admin-profile-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999; animation: fadeIn 0.25s ease; padding: 20px;
        `;

        overlay.innerHTML = `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: var(--shadow-xl); overflow: hidden; animation: slideUp 0.3s ease;">
                <!-- Modal Top Accent Banner -->
                <div style="background: linear-gradient(135deg, var(--accent-color), #4f46e5); padding: 28px 24px 20px 24px; color: #ffffff; position: relative;">
                    <button id="close-admin-modal-btn" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; color: #fff; border-radius: 50%; width: 32px; height: 32px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: #ffffff; color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 3px solid rgba(255,255,255,0.8);">
                            ${initial}
                        </div>
                        <div>
                            <h2 style="font-size: 20px; font-weight: 700; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${user.name}</h2>
                            <span style="font-size: 12px; background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 20px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-top: 4px; display: inline-block;">${roleBadgeTitle}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Modal Body Information -->
                <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
                    <h3 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        ${detailsHeader}
                    </h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: var(--bg-primary); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <div>
                            <span style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 2px;">${idLabel}</span>
                            <strong style="font-size: 14px; color: var(--text-primary);">${idCode}</strong>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 2px;">Account Role</span>
                            <strong style="font-size: 14px; color: var(--accent-color);">${roleFullTitle}</strong>
                        </div>
                        <div style="grid-column: span 2;">
                            <span style="font-size: 11px; color: var(--text-secondary); display: block; margin-bottom: 2px;">Registered Email Address</span>
                            <strong style="font-size: 14px; color: var(--text-primary);">${user.email}</strong>
                        </div>
                    </div>

                    <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-shield-halved" style="color: #10b981; font-size: 18px;"></i>
                            <div>
                                <span style="font-size: 13px; font-weight: 600; display: block; color: var(--text-primary);">Session Status</span>
                                <span style="font-size: 11px; color: var(--text-secondary);">${isStudent ? 'Authenticated Student Session (View Only)' : 'Active Authenticated ERP Session'}</span>
                            </div>
                        </div>
                        <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; padding: 4px 10px; border-radius: 20px;">ONLINE</span>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
                        <button id="admin-modal-close-btn" class="btn btn-secondary" style="padding: 10px 24px; font-weight: 600;">Close Profile</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeBtn = document.getElementById('close-admin-modal-btn');
        const closeBtnBottom = document.getElementById('admin-modal-close-btn');

        const closeModal = () => overlay.remove();
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    };

    function redirectToLogin() {
        if (!isAuthPage) {
            window.location.href = 'login.html';
        } else {
            const appScreen = document.getElementById('app-screen');
            if (appScreen) appScreen.classList.add('hidden');
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) loginScreen.classList.remove('hidden');
        }
    }

    // Trigger session check
    checkSession();

    // --- Common Menu & Navigation Handler ---
    if (!isAuthPage) {
        // Sign Out Listener
        const signOutBtn = document.getElementById('nav-sign-out');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to sign out from the portal?')) {
                    showLoading("Signing out...");
                    fetch('../php/logout.php')
                        .then(res => res.json())
                        .then(() => {
                            hideLoading();
                            window.location.href = 'login.html';
                        })
                        .catch(err => {
                            hideLoading();
                            showToast("Sign out request failed.", "error");
                            console.error(err);
                        });
                }
            });
        }

        // Shared sidebar navigation transitions
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const targetView = this.getAttribute('data-view');
                if (targetView) {
                    if (targetView === 'dashboard') {
                        window.location.href = 'dashboard.html';
                    } else if (targetView === 'count-students' || targetView === 'analytics') {
                        window.location.href = 'dashboard.html#analytics';
                    } else if (targetView === 'settings') {
                        window.location.href = 'dashboard.html#settings';
                    } else {
                        window.location.href = `${targetView}.html`;
                    }
                }
            });
        });

        // Header back button logic (directory transitions)
        const backBtn = document.getElementById('header-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'view-students.html';
            });
        }
    }

    // --- Floating Labels State Sync Helpers ---
    window.syncFloatingLabels = function() {
        document.querySelectorAll('.floating-group input, .floating-group select, .floating-group textarea').forEach(input => {
            const group = input.closest('.floating-group');
            if (group) {
                if (input.value !== '' && input.value !== null) {
                    group.classList.add('has-value');
                } else {
                    group.classList.remove('has-value');
                }
            }
        });
    };

    // Bind inputs event listeners for live animations sync
    document.addEventListener('input', (e) => {
        if (e.target.closest('.floating-group')) {
            const input = e.target;
            const group = input.closest('.floating-group');
            if (input.value !== '' && input.value !== null) {
                group.classList.add('has-value');
            } else {
                group.classList.remove('has-value');
            }
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target.closest('.floating-group')) {
            const input = e.target;
            const group = input.closest('.floating-group');
            if (input.value !== '' && input.value !== null) {
                group.classList.add('has-value');
            } else {
                group.classList.remove('has-value');
            }
        }
    });

    // Run once on page startup (after any JS values population)
    setTimeout(window.syncFloatingLabels, 100);
    setTimeout(window.syncFloatingLabels, 500);
});


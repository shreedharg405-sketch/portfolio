// Admin Panel JS Module
document.addEventListener('DOMContentLoaded', () => {
    const adminSwitch = document.getElementById('adminThemeSwitchBtn');
    const adminIcon   = document.getElementById('adminThemeIcon');

    function updateAdminIcon(theme) {
        if (adminIcon) {
            adminIcon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    updateAdminIcon(current);

    if (adminSwitch) {
        adminSwitch.addEventListener('click', () => {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('admin_theme', nextTheme);
            updateAdminIcon(nextTheme);
        });
    }
});

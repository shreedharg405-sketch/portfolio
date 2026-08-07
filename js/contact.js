// Contact UI Helper Module (Native FormSubmit Submission Enabled)
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Create Toast Container dynamically if it doesn't exist
    function getToastContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Export showToast helper for global UI notifications
    window.showToast = function(message, type = 'success', duration = 6000) {
        const container = getToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;

        const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle');
        
        toast.innerHTML = `
            <i class="fas ${iconClass} toast-icon"></i>
            <span class="toast-text">${message}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('toast-show');
                setTimeout(() => toast.remove(), 300);
            });
        }

        // Auto dismiss after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('toast-show');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    };
});

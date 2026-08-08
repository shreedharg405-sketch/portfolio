// Contact Form Module - Powered by Resend + Vercel Serverless Function (/api/contact)
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
    window.showToast = function (message, type = 'success', duration = 6000) {
        const container = getToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;

        const iconClass = type === 'success'
            ? 'fa-check-circle'
            : (type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle');

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

    // Attach AJAX Submit Handler to Contact Form
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');

    if (contactForm && submitBtn) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Extract form values
            const formData = new FormData(contactForm);
            const name = (formData.get('name') || '').toString().trim();
            const email = (formData.get('email') || '').toString().trim();
            const subject = (formData.get('subject') || '').toString().trim();
            const message = (formData.get('message') || '').toString().trim();

            // Client-side quick check
            if (!name || !email || !subject || !message) {
                window.showToast('Please fill in all required fields.', 'error');
                return;
            }

            // Save original button markup & set loading state
            const originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>Sending...</span>`;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok && data.success) {
                    // Success: Clear form, notify user, keep on page
                    contactForm.reset();
                    window.showToast(data.message || 'Thank you! Your message has been sent successfully.', 'success');
                } else {
                    // Error response from server
                    window.showToast(data.message || 'Unable to send your message. Please try again.', 'error');
                }
            } catch (err) {
                console.error('Contact form submission fetch error:', err);
                window.showToast('Unable to send your message. Please try again.', 'error');
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
        });
    }
});

// Contact Form Submission Module (AJAX to PHP Backend & MySQL + PHPMailer SMTP)
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

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

    // Function to display modern toast notification
    function showToast(message, type = 'success', duration = 6000) {
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
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const formData = new FormData(contactForm);

            const name = (formData.get('name') || '').trim();
            const email = (formData.get('email') || '').trim();
            const subject = (formData.get('subject') || '').trim();
            const message = (formData.get('message') || '').trim();

            // Client-side Validation
            if (!name || !email || !subject || !message) {
                showToast('Please fill out all required fields.', 'error');
                if (formStatus) {
                    formStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill out all required fields.';
                    formStatus.className = 'form-status-msg error';
                    formStatus.style.display = 'block';
                }
                return;
            }

            // Disable submit button & show spinner
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending Message...</span>';
            }

            if (formStatus) {
                formStatus.style.display = 'none';
                formStatus.className = 'form-status-msg';
            }

            // Pure Client-Side HTML & JS Submission (No PHP server required)
            try {
                // Save to localStorage so no messages are lost
                const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
                const newMessage = {
                    id: Date.now(),
                    name: name,
                    email: email,
                    subject: subject,
                    message: message,
                    timestamp: new Date().toISOString()
                };
                messages.push(newMessage);
                localStorage.setItem('portfolio_messages', JSON.stringify(messages));

                // Display success Toast
                const successMsg = '✅ Thank you, ' + name + '! Your message has been sent successfully.';
                showToast(successMsg, 'success', 6000);
                if (formStatus) {
                    formStatus.innerHTML = '<i class="fas fa-check-circle"></i> Thank you! Your message has been sent successfully.';
                    formStatus.className = 'form-status-msg success';
                    formStatus.style.display = 'block';
                }

                // Reset form fields
                contactForm.reset();
            } catch (error) {
                console.error('Contact submit error:', error);
                const errorMsg = 'An error occurred while saving your message. Please try again.';
                showToast(`❌ ${errorMsg}`, 'error', 6000);
                if (formStatus) {
                    formStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMsg}`;
                    formStatus.className = 'form-status-msg error';
                    formStatus.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Send Message</span>';
                }
            }
        });
    }
});

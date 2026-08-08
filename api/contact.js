const { Resend } = require('resend');

// Helper to escape HTML special characters to prevent XSS in HTML emails
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Basic email validation regex
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email.trim());
}

module.exports = async (req, res) => {
    // 1. Allow POST requests only
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            message: 'Method Not Allowed. Contact form accepts POST requests only.'
        });
    }

    try {
        // 2. Extract fields from request body
        const { name, email, subject, message } = req.body || {};

        // 3. Reject empty/missing submissions
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const trimmedEmail = typeof email === 'string' ? email.trim() : '';
        const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
        const trimmedMessage = typeof message === 'string' ? message.trim() : '';

        if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
            return res.status(400).json({
                success: false,
                message: 'All fields (Name, Email, Subject, Message) are required.'
            });
        }

        // 4. Validate email format
        if (!isValidEmail(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // 5. Input length constraints
        if (trimmedName.length > 100 || trimmedEmail.length > 150 || trimmedSubject.length > 200 || trimmedMessage.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Input exceeds maximum allowed length.'
            });
        }

        // 6. Check Resend API Key presence
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('RESEND_API_KEY environment variable is not defined.');
            return res.status(500).json({
                success: false,
                message: 'Unable to send your message. Server configuration error.'
            });
        }

        const resend = new Resend(apiKey);
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';
        const toAddress = 'shreedharg405@gmail.com';
        const formattedSubject = `[Portfolio Contact] ${trimmedSubject}`;
        const submissionDate = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'medium'
        });

        // Safely escaped HTML content
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 8px; margin-top: 0;">New Message From Portfolio</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 100px; color: #333333;">Name:</td>
                        <td style="padding: 8px 0; color: #555555;">${escapeHtml(trimmedName)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Email:</td>
                        <td style="padding: 8px 0; color: #555555;"><a href="mailto:${escapeHtml(trimmedEmail)}" style="color: #0070f3;">${escapeHtml(trimmedEmail)}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Subject:</td>
                        <td style="padding: 8px 0; color: #555555;">${escapeHtml(trimmedSubject)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #333333;">Date:</td>
                        <td style="padding: 8px 0; color: #777777; font-size: 13px;">${submissionDate} (IST)</td>
                    </tr>
                </table>
                <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #d4af37; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #333333; font-size: 15px;">Message:</h3>
                    <p style="white-space: pre-wrap; color: #444444; line-height: 1.6; margin-bottom: 0;">${escapeHtml(trimmedMessage)}</p>
                </div>
                <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eeeeee; font-size: 12px; color: #888888; text-align: center;">
                    Sent via Portfolio Contact Form (Vercel + Resend)
                </div>
            </div>
        `;

        const textContent = `New message from your portfolio\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}\nSubject: ${trimmedSubject}\nDate: ${submissionDate} (IST)\n\nMessage:\n${trimmedMessage}`;

        // 7. Dispatch Email via Resend SDK
        const response = await resend.emails.send({
            from: fromAddress,
            to: [toAddress],
            replyTo: trimmedEmail,
            subject: formattedSubject,
            html: htmlContent,
            text: textContent
        });

        if (response.error) {
            console.error('Resend API returned error:', response.error);
            return res.status(500).json({
                success: false,
                message: 'Unable to send your message. Please try again.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Thank you! Your message has been sent successfully.'
        });

    } catch (err) {
        console.error('Unhandled error in /api/contact handler:', err);
        return res.status(500).json({
            success: false,
            message: 'Unable to send your message. Please try again.'
        });
    }
};

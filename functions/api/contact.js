// Cloudflare Pages Function: POST /api/contact
// Native Fetch API & Cloudflare Workers runtime compatible

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email.trim());
}

export async function onRequestPost(context) {
    const { request, env } = context;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };

    try {
        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(JSON.stringify({
                success: false,
                message: 'Invalid JSON payload.'
            }), { status: 400, headers });
        }

        const { name, email, subject, message } = body || {};

        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const trimmedEmail = typeof email === 'string' ? email.trim() : '';
        const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
        const trimmedMessage = typeof message === 'string' ? message.trim() : '';

        if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
            return new Response(JSON.stringify({
                success: false,
                message: 'All fields (Name, Email, Subject, Message) are required.'
            }), { status: 400, headers });
        }

        if (!isValidEmail(trimmedEmail)) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Please provide a valid email address.'
            }), { status: 400, headers });
        }

        if (trimmedName.length > 100 || trimmedEmail.length > 150 || trimmedSubject.length > 200 || trimmedMessage.length > 5000) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Input exceeds maximum allowed length.'
            }), { status: 400, headers });
        }

        const apiKey = env ? env.RESEND_API_KEY : undefined;
        if (!apiKey) {
            console.error('RESEND_API_KEY environment variable is not defined in Cloudflare.');
            return new Response(JSON.stringify({
                success: false,
                message: 'Unable to send your message. Server configuration error.'
            }), { status: 500, headers });
        }

        const fromAddress = (env && env.RESEND_FROM_EMAIL) || 'Portfolio Contact <onboarding@resend.dev>';
        const toAddress = 'shreedharg405@gmail.com';
        const formattedSubject = `[Portfolio Contact] ${trimmedSubject}`;
        const submissionDate = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'medium'
        });

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
                    Sent via Portfolio Contact Form (Cloudflare Pages + Resend)
                </div>
            </div>
        `;

        const textContent = `New message from your portfolio\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}\nSubject: ${trimmedSubject}\nDate: ${submissionDate} (IST)\n\nMessage:\n${trimmedMessage}`;

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromAddress,
                to: [toAddress],
                reply_to: trimmedEmail,
                subject: formattedSubject,
                html: htmlContent,
                text: textContent
            })
        });

        const resendData = await resendRes.json().catch(() => ({}));

        if (!resendRes.ok || (resendData && resendData.error)) {
            console.error('Resend API returned error:', resendData);
            return new Response(JSON.stringify({
                success: false,
                message: 'Unable to send your message. Please try again.'
            }), { status: 500, headers });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Thank you! Your message has been sent successfully.'
        }), { status: 200, headers });

    } catch (err) {
        console.error('Unhandled error in Cloudflare Pages Function /api/contact:', err);
        return new Response(JSON.stringify({
            success: false,
            message: 'Unable to send your message. Please try again.'
        }), { status: 500, headers });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
        }
    });
}

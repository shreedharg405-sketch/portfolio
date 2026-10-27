import { onRequestPost, onRequestOptions } from './api/contact.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle API routes
        if (url.pathname === '/api/contact') {
            if (request.method === 'POST') {
                return onRequestPost({
                    request,
                    env,
                    waitUntil: (p) => (ctx && ctx.waitUntil ? ctx.waitUntil(p) : Promise.resolve(p))
                });
            }
            if (request.method === 'OPTIONS') {
                return onRequestOptions();
            }
            return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delegate all other requests to static assets bundle (dist/)
        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }

        return new Response('Not Found', { status: 404 });
    }
};

// NOTE: This is a proxy middleware for Nitro server.
// It proxies requests to a client server (e.g., Vite dev server) while allowing Nitro to handle API routes.

// TODO: Add support for building the client in production

import { createProxyServer } from "httpxy";

// Create an instance of http-proxy
const proxy = createProxyServer({});

// Target server – adjust this URL as needed.
const CLIENT_SERVER = "http://localhost:5173";

export default defineEventHandler(async (event) => {
	const url = getRequestURL(event);

	// If the request path starts with "/api/", skip proxying.
	if (url.pathname.startsWith("/api")) {
		return; // Let Nitro handle API routes.
	}

	// Wrap proxying in a promise so we can await completion.
	await new Promise<void>((resolve, reject) => {
		// Proxy the request from Nitro's request/response to the target.
		// Pass the target as a base URL and let http-proxy handle path resolution
		proxy.web(
			event.node.req,
			event.node.res,
			{
				target: CLIENT_SERVER,
				changeOrigin: true,
				ws: true,
			},
			(err: any) => {
				if (err) return reject(err);
				resolve();
			},
		);
	});

	// Return null since the proxy handled the response.
	return null;
});

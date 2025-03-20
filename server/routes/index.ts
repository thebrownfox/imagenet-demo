import { readFile } from 'node:fs/promises';

export default defineEventHandler(async (event) => {
  // In development mode, requests will be proxied to Vite dev server
  if (process.env.NODE_ENV === 'development') {
    return; // Let the proxy handle it
  }

  // Serve the index.html for client-side routing in production
  const html = await readFile('./public/index.html', 'utf8');
  event.node.res.setHeader('Content-Type', 'text/html');
  return html;
});

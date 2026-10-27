// Serves the site's files as they are. Only "/" is mapped to index.html, because
// html_handling is "none" (so /about.html is never redirected to /about, which
// would break the service worker's offline copy of those pages).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      url.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      // Keep the /api prefix when forwarding
      pathRewrite: (path) => path, // don't rewrite, keep as-is
    })
  );
};

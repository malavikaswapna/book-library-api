const Koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const registerRouter = require('./register');
const swaggerUi = require('koa2-swagger-ui');
const fs = require('fs');
const path = require('path');
const ratelimit = require('koa-ratelimit');
const jwtAuth = require('./jwtMiddleware');
const db = require('./db');
const http = require('http');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const compress = require('koa-compress');
const logger = require('koa-logger');
require('dotenv').config();

const app = new Koa();
const router = new Router();

// Middleware setup
app.use(conditional());
app.use(etag());
app.use(async (ctx, next) => {
  await next();

  if (ctx.method === 'GET' && (ctx.status === 200 || ctx.status === 304) && ctx.body) {

    if (!ctx.response.get('ETag')) {
      const bodyString = JSON.stringify(ctx.body);
      const etag = `"${Buffer.from(bodyString).toString('base64')}"`;
      ctx.set('ETag', etag);
    }

    const ifNoneMatch = ctx.request.get ('If-None-Match');
    if (ifNoneMatch && ifNoneMatch === ctx.response.get('ETag')) {
      ctx.status = 304;
      ctx.body = null;
    }
  }
});


app.use(cors({ origin: '*' }));
app.use(bodyParser());
app.use(logger());

app.use(compress({
  threshold: 2048,
  gzip: {
    flush: require('zlib').constants.Z_SYNC_FLUSH
  },
  deflate: {
    flush: require('zlib').constants.Z_SYNC_FLUSH
  },
  br: false
}));

app.use(async (ctx, next) => {
  ctx.set('X-Content-Type-Options', 'nosniff');
  ctx.set('X-Frame-Options', 'DENY');
  ctx.set('X-XSS-Protection', '1; mode=block');
  ctx.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  await next();
});

app.use(
  ratelimit({
    driver: 'memory',
    db: new Map(),
    duration: 60000, // 1 minute
    max: 50, // Increase the max requests per minute
    errorMessage: 'Too many requests, please slow down!',
  })
);

// Load OpenAPI JSON file
const swaggerSpec = JSON.parse(fs.readFileSync(path.join(__dirname, 'book-library-api.json'), 'utf8'));

// Use the registration route
app.use(registerRouter.routes()).use(registerRouter.allowedMethods());

// Public Routes (No authentication required for these routes)
app.use(authRoutes.routes()).use(authRoutes.allowedMethods());
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());

// Swagger UI Middleware
router.get('/docs', swaggerUi.koaSwagger({
  title: 'Book Library API Documentation',
  swaggerOptions: { spec: swaggerSpec }
}));

// Apply all routes
app.use(router.routes()).use(router.allowedMethods());

app.use(jwtAuth);

// Protected Routes (Require Authentication)
app.use(bookRoutes.routes()).use(bookRoutes.allowedMethods());
app.use(adminRoutes.routes()).use(adminRoutes.allowedMethods());

// Create HTTP server
const server = http.createServer(app.callback());

// Start the server
if (process.env.NODE_ENV !== 'test') {
  server.listen(1025, '0.0.0.0', () => {
    console.log('Server running on https://harlembazaar-londonfiber-1025.codio-box.uk');
    console.log('API documentation available at https://harlembazaar-londonfiber-1025.codio-box.uk/docs');
  });
}

// Export server for testing
module.exports = server;
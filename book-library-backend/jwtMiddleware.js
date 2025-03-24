const { verifyToken } = require('./jwt');

const jwtAuth = async (ctx, next) => {
  try {
    const authHeader = ctx.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = { 
        message: 'Authorization token missing',
        _links: {
          login: { href: '/login' }
        }
      };
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);

    if (!user) {
      ctx.status = 401;
      ctx.body = {
        message: 'Invalid or expired token',
        _links: {
          login: { href: '/login' }
        } 
      };
      return;
    }
    
    ctx.state.user = user;

    console.log('User set in JWT middleware:', ctx.state.user);
    await next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    ctx.status = 401;
    ctx.body = {
      message: 'Authentication failed',
      _links: {
        login: { href: '/login' }
      }
    };
  }
};

module.exports = jwtAuth;
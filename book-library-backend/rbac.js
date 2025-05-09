const db = require('./db');

const authorize = (requiredRole) => async (ctx, next) => {
  console.log('In authorize middleware, user:', ctx.state.user);

  if (!requiredRole) {
    return await next();
  }

  if (!ctx.state || !ctx.state.user || !ctx.state.user.id) {
    console.log('Missing user in context state');
    ctx.status = 401;
    ctx.body = {
      message: 'Authentication required',
      _links: {
        login: { href: '/login' }
      }
    };
    return;
  }

  try {
    console.log(`Checking role for user ID: ${ctx.state.user.id}`);

    const userRole = ctx.state.user.role || 'user';

    const roleHierarchy = {
      'admin': ['admin', 'editor', 'user'],
      'editor': ['editor', 'user'],
      'user': ['user']
    };

    const allowedRoles = roleHierarchy[userRole] || [];

    if (allowedRoles.includes(requiredRole)) {
      console.log(`Authorization successful: User ${ctx.state.user.username} with role ${userRole} accessed resource requiring ${requiredRole} role`);
      await next();
    } else {
      console.log(`Authorization failed: User ${ctx.state.user.username} with role ${userRole} attempted to access resource requiring ${requiredRole} role`);
      ctx.status = 403;
      ctx.body = {
        message: 'Insufficient permissions',
        _links: {
          login: { href: '/login' }
        }
      };
    }
  } catch (error) {
    console.error(`Authorization error:`, error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error during authorization',
      _links: {
        login: { href: '/login' }
      }
    };
  }
};

const checkScope = (requiredScope) => async (ctx, next) => {
  console.log(`In checkScope middleware, required scope: ${requiredScope}`);

  if (!ctx.state || !ctx.state.user || !ctx.state.user.id) {
    console.log('Missing user in context state');
    ctx.status = 401;
    ctx.body = {
      message: 'Authentication required',
      _links: {
        login: { href: '/login' }
      }
    };
    return;
  }

  try {
    const userScopes = ctx.state.user.scopes || [];
    console.log(`User ${ctx.state.user.username} has scopes:`, userScopes);

    if (userScopes.includes(requiredScope)) {
      console.log(`Scope check successful: User has required scope '${requiredScope}'`);
      await next();
    } else {
      console.log(`Scope check failed: User lacks required scope '${requiredScope}'`);
      ctx.status = 403;
      ctx.body = {
        message: 'Insufficient permissions - required scope not granted',
        _links: {
          login: { href: '/login' }
        }
      };
    }
  } catch (error) {
    console.error(`Scope authorization error:`, error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error during scope authorization',
      _links: {
        login: { href: '/login' }
      }
    };
  }
};

module.exports = { authorize, checkScope };
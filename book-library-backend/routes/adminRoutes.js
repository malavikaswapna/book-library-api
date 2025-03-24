const Router = require('koa-router');
const db = require('../db');
const jwtAuth = require('../jwtMiddleware');
const { authorize } = require('../rbac');

const router = new Router();

router.put('/admin/users/:userId/role', jwtAuth, authorize('admin'), async (ctx) => {
  const { userId } = ctx.params;
  const { role } = ctx.request.body;

  if (!role) {
    ctx.status = 400;
    ctx.body = { message: 'Role name is required' };
    return;
  }

  try {
     const [roles] = await db.query('SELECT id FROM roles WHERE name = ?', [role]);

     if (!roles.length) {
       ctx.status = 400;
       ctx.body = { message: 'Invalid role name' };
       return;
     }

     const roleId = roles[0].id;

     const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);

     if (!users.length) {
       ctx.status = 404;
       ctx.body = { message: 'User not found' };
       return;
     }

     await db.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);

     ctx.body = {
       message: `User ${userId} assigned to role ${role}`,
       _links: {
         user: { href: `/admin/users/${userId}` }
       }
     };
  } catch (error) {
    console.error('Error assigning role:', error);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }
});

router.get('/admin/users', jwtAuth, authorize('admin'), async (ctx) => {
  try {
    const [users] = await db.query(`
    SELECT u.id, u.username, r.name as role
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
   `);

   const userWithLinks = users.map(user => ({
     ...user,
     _links: {
       self: { href: `/admin/users/${user.id}` },
       assign_role: { href: `/admin/users/${user.id}/role` }
     }
   }));

   ctx.body = {
     users: userWithLinks,
     _links: {
       self: { href: '/admin/users' }
     }
   };
  } catch (error) {
    console.error('Error listing users:', error);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }
});

router.delete('/admin/users/:userId', jwtAuth, authorize('admin'), async(ctx) => {
  const { userId } = ctx.params;

  try {

    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);

    if (!users.length) {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
      return;
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    ctx.status = 200;
    ctx.body = {
      message: `User ${userId} deleted successfully`,
      _links: {
        users: { href: '/admin/users' }
      }
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    ctx.status = 500;
    ctx.body = {message: 'Internal server error'};
  }
});

module.exports = router;
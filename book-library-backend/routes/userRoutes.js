const Router = require('koa-router');
const userController = require('../controllers/userController');

const router = new Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

module.exports = router;
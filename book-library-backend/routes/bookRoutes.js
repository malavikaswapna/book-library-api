const Router = require("koa-router");
const bookController = require("../controllers/bookController");
const jwtAuth = require("../jwtMiddleware");
const { authorize, checkScope } = require("../rbac");

const router = new Router();

// 📚 Book Routes
//no role required, need read scope
router.get("/books", jwtAuth, checkScope('books:read'), bookController.getBooks);
router.get("/book/:id", jwtAuth, checkScope('books:read'), bookController.getBookById);
//editor role required, need write scope
router.post("/books", jwtAuth, checkScope('books:write'), bookController.createBook);
router.put("/book/:id", jwtAuth, checkScope('books:write'), bookController.updateBook);
router.delete("/book/:id", jwtAuth, checkScope('books:write'), bookController.deleteBook);

// 📝 Review Routes
//no role required, need read scope
router.get("/book/:bookId/reviews", jwtAuth, checkScope('reviews:read'), bookController.getReviewsForBook);
//user role required, need write scope
router.post("/book/:bookId/reviews", jwtAuth, checkScope('reviews:write'), bookController.addReviewForBook);
//editor role required, need write scope
router.put("/review/:reviewId", jwtAuth, checkScope('reviews:write'), bookController.updateReview);
router.delete("/review/:reviewId", jwtAuth, checkScope('reviews:delete'), bookController.deleteReview);

module.exports = router;

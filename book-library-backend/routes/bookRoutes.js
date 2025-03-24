const Router = require("koa-router");
const bookController = require("../controllers/bookController");
const jwtAuth = require("../jwtMiddleware");
const { authorize } = require("../rbac");

const router = new Router();

// 📚 Book Routes
//no role required
router.get("/books", bookController.getBooks);
router.get("/book/:id", bookController.getBookById);
//editor role required
router.post("/books", jwtAuth, authorize('editor'), bookController.createBook);
router.put("/book/:id", jwtAuth, authorize('editor'), bookController.updateBook);
router.delete("/book/:id", jwtAuth, authorize('editor'), bookController.deleteBook);

// 📝 Review Routes
//no role required
router.get("/book/:bookId/reviews", bookController.getReviewsForBook);
//user role required
router.post("/book/:bookId/reviews", jwtAuth, authorize('user'), bookController.addReviewForBook);
//editor role required
router.put("/review/:reviewId", jwtAuth, authorize('editor'), bookController.updateReview);
router.delete("/review/:reviewId", jwtAuth, authorize('editor'), bookController.deleteReview);

module.exports = router;

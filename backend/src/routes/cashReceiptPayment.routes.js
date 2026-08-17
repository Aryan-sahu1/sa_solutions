const express = require("express");
const cashReceiptPaymentController = require("../controller/cashReceiptPayment.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", cashReceiptPaymentController.create);
router.get("/", cashReceiptPaymentController.findAll);
router.get("/:id", cashReceiptPaymentController.findById);
router.put("/:id", cashReceiptPaymentController.update);
router.delete("/:id", cashReceiptPaymentController.remove);

module.exports = router;

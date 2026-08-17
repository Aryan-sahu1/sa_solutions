const express = require("express");
const voucherController = require("../controller/voucher.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", voucherController.create);
router.get("/", voucherController.findAll);
router.get("/:id", voucherController.findById);
router.put("/:id", voucherController.update);
router.delete("/:id", voucherController.remove);

module.exports = router;

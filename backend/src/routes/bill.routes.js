const express = require("express");
const billController = require("../controller/bill.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", billController.create);
router.get("/", billController.findAll);
router.get("/next-bill-no", billController.findNextBillNo);
router.get("/sales-total", billController.findSalesTotal);
router.get("/:id", billController.findById);
router.put("/:id", billController.update);
router.delete("/:id", billController.remove);

module.exports = router;

const express = require("express");
const purchaseController = require("../controller/purchase.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", purchaseController.create);
router.get("/", purchaseController.findAll);
router.get("/:id", purchaseController.findById);
router.put("/:id", purchaseController.update);
router.delete("/:id", purchaseController.remove);

module.exports = router;

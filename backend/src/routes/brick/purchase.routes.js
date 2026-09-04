const express = require("express");
const brickPurchaseController = require("../../controller/brick/purchase.controller");
const customerAuthMiddleware = require("../../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", brickPurchaseController.create);
router.get("/", brickPurchaseController.findAll);
router.get("/:id", brickPurchaseController.findById);
router.put("/:id", brickPurchaseController.update);
router.delete("/:id", brickPurchaseController.remove);

module.exports = router;

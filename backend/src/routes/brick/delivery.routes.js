const express = require("express");
const brickDeliveryController = require("../../controller/brick/delivery.controller");
const customerAuthMiddleware = require("../../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", brickDeliveryController.create);
router.get("/", brickDeliveryController.findAll);
router.get("/:id", brickDeliveryController.findById);
router.put("/:id", brickDeliveryController.update);
router.delete("/:id", brickDeliveryController.remove);

module.exports = router;

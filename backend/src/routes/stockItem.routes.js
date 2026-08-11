const express = require("express");
const stockItemController = require("../controller/stockItem.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", stockItemController.create);
router.get("/", stockItemController.findAll);
router.get("/:id", stockItemController.findById);
router.put("/:id", stockItemController.update);
router.delete("/:id", stockItemController.remove);

module.exports = router;

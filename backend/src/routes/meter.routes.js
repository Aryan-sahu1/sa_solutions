const express = require("express");
const meterController = require("../controller/meter.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", meterController.create);
router.get("/", meterController.findAll);
router.get("/:id", meterController.findById);
router.put("/:id", meterController.update);
router.delete("/:id", meterController.remove);

module.exports = router;

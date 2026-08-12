const express = require("express");
const vehicleMasterController = require("../controller/vehicleMaster.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", vehicleMasterController.create);
router.get("/", vehicleMasterController.findAll);
router.get("/:id", vehicleMasterController.findById);
router.put("/:id", vehicleMasterController.update);
router.delete("/:id", vehicleMasterController.remove);

module.exports = router;

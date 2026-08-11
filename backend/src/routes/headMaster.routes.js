const express = require("express");
const headMasterController = require("../controller/headMaster.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", headMasterController.create);
router.get("/", headMasterController.findAll);
router.get("/:id", headMasterController.findById);
router.put("/:id", headMasterController.update);
router.delete("/:id", headMasterController.remove);

module.exports = router;

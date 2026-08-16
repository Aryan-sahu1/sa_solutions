const express = require("express");
const leakController = require("../controller/leak.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", leakController.create);
router.get("/", leakController.findAll);
router.get("/:id", leakController.findById);
router.put("/:id", leakController.update);
router.delete("/:id", leakController.remove);

module.exports = router;

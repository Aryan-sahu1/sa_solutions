const express = require("express");
const salesController = require("../controller/sales.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", salesController.create);
router.get("/", salesController.findAll);
router.get("/:id", salesController.findById);
router.put("/:id", salesController.update);
router.delete("/:id", salesController.remove);

module.exports = router;

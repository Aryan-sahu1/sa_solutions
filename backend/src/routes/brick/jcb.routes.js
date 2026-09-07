const express = require("express");
const brickJcbController = require("../../controller/brick/jcb.controller");
const customerAuthMiddleware = require("../../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", brickJcbController.create);
router.get("/", brickJcbController.findAll);
router.get("/:id", brickJcbController.findById);
router.put("/:id", brickJcbController.update);
router.delete("/:id", brickJcbController.remove);

module.exports = router;

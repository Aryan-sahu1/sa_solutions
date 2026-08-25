const express = require("express");
const nozelController = require("../controller/nozel.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", nozelController.create);
router.get("/", nozelController.findAll);
router.get("/:id", nozelController.findById);
router.put("/:id", nozelController.update);
router.delete("/:id", nozelController.remove);

module.exports = router;

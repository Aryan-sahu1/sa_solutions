const express = require("express");
const brickDumperController = require("../../controller/brick/dumper.controller");
const customerAuthMiddleware = require("../../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", brickDumperController.create);
router.get("/", brickDumperController.findAll);
router.get("/:id", brickDumperController.findById);
router.put("/:id", brickDumperController.update);
router.delete("/:id", brickDumperController.remove);

module.exports = router;

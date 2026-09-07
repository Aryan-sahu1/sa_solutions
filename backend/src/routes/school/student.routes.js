const express = require("express");
const studentController = require("../../controller/school/student.controller");
const customerAuthMiddleware = require("../../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", studentController.create);
router.get("/", studentController.findAll);
router.get("/:id", studentController.findById);
router.put("/:id", studentController.update);
router.delete("/:id", studentController.remove);

module.exports = router;

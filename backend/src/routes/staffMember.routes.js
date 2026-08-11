const express = require("express");
const staffMemberController = require("../controller/staffMember.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", staffMemberController.create);
router.get("/", staffMemberController.findAll);
router.get("/:id", staffMemberController.findById);
router.put("/:id", staffMemberController.update);
router.delete("/:id", staffMemberController.remove);

module.exports = router;

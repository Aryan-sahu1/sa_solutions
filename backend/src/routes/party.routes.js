const express = require("express");
const partyController = require("../controller/party.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", partyController.create);
router.get("/", partyController.findAll);
router.get("/:id", partyController.findById);
router.put("/:id", partyController.update);
router.delete("/:id", partyController.remove);

module.exports = router;

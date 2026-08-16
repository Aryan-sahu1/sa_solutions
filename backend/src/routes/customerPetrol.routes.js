const express = require("express");
const customerPetrolController = require("../controller/customerPetrol.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", customerPetrolController.create);
router.get("/", customerPetrolController.findAll);
router.get("/:id", customerPetrolController.findById);
router.put("/:id", customerPetrolController.update);
router.delete("/:id", customerPetrolController.remove);

module.exports = router;

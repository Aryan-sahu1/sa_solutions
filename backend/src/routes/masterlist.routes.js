const express = require("express");
const router = express.Router();
const masterListController = require("../controller/masterList.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

router.post("/", masterListController.create);
router.get("/", masterListController.findAll);
router.get(
    "/customer-options",
    customerAuthMiddleware,
    masterListController.findByCustomerProduct
);
router.get("/:id", masterListController.findById);
router.put("/:id", masterListController.update);
router.delete("/:id", masterListController.remove);
module.exports = router;

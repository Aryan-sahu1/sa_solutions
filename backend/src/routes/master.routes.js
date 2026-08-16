const express = require("express");

const router = express.Router();

const masterController = require("../controller/master.controller");
const customerAuthMiddleware =
    require("../middleware/customer.auth.middleware");

// Create staff category
router.post("/", masterController.create);

// Get all staff categories
router.get("/", masterController.findAll);

// Get staff categories for logged-in customer's selected product
router.get(
    "/customer-options",
    customerAuthMiddleware,
    masterController.findByCustomerProduct
);

// Get staff category by ID
router.get("/:id", masterController.findById);

// Update staff category
router.put("/:id", masterController.update);

// Delete staff category
router.delete("/:id", masterController.remove);

module.exports = router;

const express = require("express");

const router = express.Router();

const staffCategoryController = require("../controller/staff.controller");
const customerAuthMiddleware =
    require("../middleware/customer.auth.middleware");

// Create staff category
router.post("/", staffCategoryController.create);

// Get all staff categories
router.get("/", staffCategoryController.findAll);

// Get staff categories for logged-in customer's selected product
router.get(
    "/customer-options",
    customerAuthMiddleware,
    staffCategoryController.findByCustomerProduct
);

// Get staff category by ID
router.get("/:id", staffCategoryController.findById);

// Update staff category
router.put("/:id", staffCategoryController.update);

// Delete staff category
router.delete("/:id", staffCategoryController.remove);

module.exports = router;

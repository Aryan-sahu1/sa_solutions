const express = require("express");

const router = express.Router();

const customerController =
    require("../controller/customer.controller");
const customerAuthMiddleware =
    require("../middleware/customer.auth.middleware");


// Create customer
router.post("/", customerController.create);

// Create customer
router.post("/customer-login", customerController.login);

// Verify customer token
router.get(
    "/verify-customer",
    customerAuthMiddleware,
    customerController.verifyCustomer
);

// Get all customers
router.get("/", customerController.findAll);


// Get customer by ID
router.get("/:id", customerController.findById);


// Update customer
router.put("/:id", customerController.update);


// Delete customer
router.delete("/:id", customerController.remove);


module.exports = router;

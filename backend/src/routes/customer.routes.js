const express = require("express");

const router = express.Router();

const customerController =
    require("../controller/customer.controller");


// Create customer
router.post("/", customerController.create);


// Get all customers
router.get("/", customerController.findAll);


// Get customer by ID
router.get("/:id", customerController.findById);


// Update customer
router.put("/:id", customerController.update);


// Delete customer
router.delete("/:id", customerController.remove);


module.exports = router;
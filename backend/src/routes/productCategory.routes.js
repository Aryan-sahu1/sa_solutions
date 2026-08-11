const express = require("express");
const productCategoryController = require("../controller/productCategory.controller");
const customerAuthMiddleware = require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", productCategoryController.create);
router.get("/", productCategoryController.findAll);
router.get("/:id", productCategoryController.findById);
router.put("/:id", productCategoryController.update);
router.delete("/:id", productCategoryController.remove);

module.exports = router;

const express = require("express");
const schoolMasterController = require("../../controller/school/schoolMaster.controller");
const customerAuthMiddleware = require("../../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.post("/", schoolMasterController.create);
router.get("/", schoolMasterController.findAll);
router.get("/options", schoolMasterController.findMasterOptions);
router.get("/:id", schoolMasterController.findById);
router.put("/:id", schoolMasterController.update);
router.delete("/:id", schoolMasterController.remove);

module.exports = router;

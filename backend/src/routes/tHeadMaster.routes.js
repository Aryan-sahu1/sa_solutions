const express = require("express");
const tHeadMasterController = require("../controller/tHeadMaster.controller");
const companyOrCustomerAuthMiddleware = require("../middleware/companyOrCustomer.auth.middleware");

const router = express.Router();

router.use(companyOrCustomerAuthMiddleware);

router.post("/", tHeadMasterController.create);
router.get("/", tHeadMasterController.findAll);
router.get("/:id", tHeadMasterController.findById);
router.put("/:id", tHeadMasterController.update);
router.delete("/:id", tHeadMasterController.remove);

module.exports = router;

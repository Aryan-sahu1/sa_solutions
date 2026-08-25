const express = require("express");
const trialBalanceController =
    require("../controller/reports/trialBalance.controller");
const customerAuthMiddleware =
    require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.get("/trial-balance", trialBalanceController.findAll);

module.exports = router;

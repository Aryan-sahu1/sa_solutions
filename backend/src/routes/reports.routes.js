const express = require("express");
const trialBalanceController =
    require("../controller/reports/trialBalance.controller");
const accountStatementController =
    require("../controller/reports/accountStatement.controller");
const customerAuthMiddleware =
    require("../middleware/customer.auth.middleware");

const router = express.Router();

router.use(customerAuthMiddleware);

router.get("/trial-balance", trialBalanceController.findAll);
router.get("/account-statement", accountStatementController.findAll);

module.exports = router;

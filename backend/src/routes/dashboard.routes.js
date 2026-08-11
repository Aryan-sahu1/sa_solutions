const express = require("express");
const { getStats } = require("../controller/dashboard.controller");

const router = express.Router();

router.get("/stats", getStats);

module.exports = router;

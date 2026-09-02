const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");
const importController = require("../controller/import.controller");

const router = express.Router();

router.post(
    "/excel",
    authenticateToken,
    express.raw({
        type: [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/octet-stream"
        ],
        limit: "50mb"
    }),
    importController.importExcel
);

module.exports = router;

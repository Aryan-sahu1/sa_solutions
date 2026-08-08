
const express = require("express");
const { create, findAll } = require("../controller/product.controller");

const router = express.Router();


router.post("/create", create)
router.get("/list", findAll)
module.exports = router
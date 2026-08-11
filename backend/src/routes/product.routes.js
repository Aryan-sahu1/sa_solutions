
const express = require("express");
const { create, findAll, update, remove } = require("../controller/product.controller");

const router = express.Router();


router.post("/create", create)
router.get("/list", findAll)
router.put("/:id", update)
router.delete("/:id", remove)
module.exports = router


const { generateToken } = require("../utils/jwt")

const productService = require("../service/product.service")
const create = async (req, res) => {
    try {

        if (!req.body.name) {
            return res.json(400).json({
                message: "name is required"
            })
        }

        const data = await productService.create(req.body);

        res.status(200).json({
            status: true,
            message: "company created successfully",
            data: data
        })
    } catch (error) {
        res.status(200).json({
            status: false,
            message: error.message
        })
    }


}

const findAll = async (req, res) => {
    try {
        const data = await productService.findAll();
        res.status(200).json({
            status: true,
            message: "data fetch successfully",
            data: data
        })
    } catch (error) {
        res.status(200).json({
            status: false,
            message: error.message,
        })
    }
}

module.exports = { create, findAll }
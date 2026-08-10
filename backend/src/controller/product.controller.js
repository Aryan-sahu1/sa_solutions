
const { generateToken } = require("../utils/jwt")
const productService = require("../service/product.service")
const create = async (req, res, next) => {
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
        next(error);
    }
}

const findAll = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
          const search =  req.query.search || "";
        console.log(page, limit)
        const data = await productService.findAll(page, limit,search);
        res.status(200).json({
            status: true,
            message: "data fetch successfully",
           data:data.data,
           pagination:data.pagination
        })
    } catch (error) {
        next(error);
    }
}

module.exports = { create, findAll }
const productCategoryService = require("../service/productCategory.service");

const create = async (req, res, next) => {
    try {
        const result = await productCategoryService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Product category created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const result = await productCategoryService.findAll({
            userId: req.user.id,
            page,
            limit,
            search
        });

        return res.status(200).json({
            status: true,
            message: "Product categories fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await productCategoryService.findById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Product category fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await productCategoryService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Product category updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await productCategoryService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Product category deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};

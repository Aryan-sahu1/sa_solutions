const stockItemService = require("../service/stockItem.service");

const create = async (req, res, next) => {
    try {
        const result = await stockItemService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Stock item created successfully",
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

        const result = await stockItemService.findAll({
            userId: req.user.id,
            page,
            limit,
            search
        });

        return res.status(200).json({
            status: true,
            message: "Stock items fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await stockItemService.findById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Stock item fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await stockItemService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Stock item updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await stockItemService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Stock item deleted successfully"
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

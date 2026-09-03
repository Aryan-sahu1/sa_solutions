const purchaseService = require("../service/purchase.service");

const create = async (req, res, next) => {
    try {
        const result = await purchaseService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Purchase entry created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const result = await purchaseService.findAll({
            userId: req.user.id,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search || "",
            date: req.query.date || "",
            purchase_type: req.query.purchase_type || ""
        });

        return res.status(200).json({
            status: true,
            message: "Purchase entries fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await purchaseService.findById(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Purchase entry fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await purchaseService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Purchase entry updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await purchaseService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Purchase entry deleted successfully"
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

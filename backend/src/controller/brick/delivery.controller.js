const brickDeliveryService = require("../../service/brick/delivery.service");

const create = async (req, res, next) => {
    try {
        const result = await brickDeliveryService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Delivery entry created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const result = await brickDeliveryService.findAll({
            userId: req.user.id,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search || "",
            date: req.query.date || ""
        });

        return res.status(200).json({
            status: true,
            message: "Delivery entries fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await brickDeliveryService.findById(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Delivery entry fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await brickDeliveryService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Delivery entry updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await brickDeliveryService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Delivery entry deleted successfully"
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

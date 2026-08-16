const leakService = require("../service/leak.service");

const create = async (req, res, next) => {
    try {
        const result = await leakService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Leak entry created successfully",
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
        const iid = req.query.iid || "";

        const result = await leakService.findAll({
            userId: req.user.id,
            page,
            limit,
            search,
            iid
        });

        return res.status(200).json({
            status: true,
            message: "Leak entries fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await leakService.findById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Leak entry fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await leakService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Leak entry updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await leakService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Leak entry deleted successfully"
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

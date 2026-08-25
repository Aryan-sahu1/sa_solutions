const nozelService = require("../service/nozel.service");

const create = async (req, res, next) => {
    try {
        const result = await nozelService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Nozel created successfully",
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

        const result = await nozelService.findAll({
            userId: req.user.id,
            page,
            limit,
            search,
            productId: req.query.pid || ""
        });

        return res.status(200).json({
            status: true,
            message: "Nozels fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await nozelService.findById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Nozel fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await nozelService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Nozel updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await nozelService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Nozel deleted successfully"
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

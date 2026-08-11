const headMasterService = require("../service/headMaster.service");

const create = async (req, res, next) => {
    try {
        const result = await headMasterService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Head master created successfully",
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

        const result = await headMasterService.findAll({
            userId: req.user.id,
            page,
            limit,
            search
        });

        return res.status(200).json({
            status: true,
            message: "Head masters fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await headMasterService.findById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Head master fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await headMasterService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Head master updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await headMasterService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Head master deleted successfully"
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

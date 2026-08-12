const tHeadMasterService = require("../service/tHeadMaster.service");

const create = async (req, res, next) => {
    try {
        const result = await tHeadMasterService.create(req.body);

        return res.status(201).json({
            status: true,
            message: "T head master created successfully",
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

        const result = await tHeadMasterService.findAll({
            page,
            limit,
            search
        });

        return res.status(200).json({
            status: true,
            message: "T head masters fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await tHeadMasterService.findById(req.params.id);

        return res.status(200).json({
            status: true,
            message: "T head master fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await tHeadMasterService.update(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            status: true,
            message: "T head master updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await tHeadMasterService.remove(req.params.id);

        return res.status(200).json({
            status: true,
            message: "T head master deleted successfully"
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

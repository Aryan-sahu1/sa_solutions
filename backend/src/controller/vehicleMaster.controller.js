const vehicleMasterService = require("../service/vehicleMaster.service");

const create = async (req, res, next) => {
    try {
        const result = await vehicleMasterService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Vehicle created successfully",
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
        const sid = req.query.sid || "";

        const result = await vehicleMasterService.findAll({
            userId: req.user.id,
            page,
            limit,
            search,
            sid
        });

        return res.status(200).json({
            status: true,
            message: "Vehicles fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await vehicleMasterService.findById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Vehicle fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await vehicleMasterService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Vehicle updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await vehicleMasterService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Vehicle deleted successfully"
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

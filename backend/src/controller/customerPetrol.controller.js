const customerPetrolService = require("../service/customerPetrol.service");

const create = async (req, res, next) => {
    try {
        const result = await customerPetrolService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Customer petrol entry created successfully",
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
        const pid = req.query.pid || "";
        const sid = req.query.sid || "";

        const result = await customerPetrolService.findAll({
            userId: req.user.id,
            page,
            limit,
            search,
            pid,
            sid
        });

        return res.status(200).json({
            status: true,
            message: "Customer petrol entries fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await customerPetrolService.findById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Customer petrol entry fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await customerPetrolService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Customer petrol entry updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await customerPetrolService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Customer petrol entry deleted successfully"
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

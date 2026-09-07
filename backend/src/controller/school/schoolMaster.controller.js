const schoolMasterService = require("../../service/school/schoolMaster.service");

const create = async (req, res, next) => {
    try {
        const result = await schoolMasterService.create(
            req.body,
            req.user.id,
            req.customer.product_id
        );

        return res.status(201).json({
            status: true,
            message: "School master entry created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const findMasterOptions = async (req, res, next) => {
    try {
        const data = await schoolMasterService.findMasterOptions({
            productId: req.customer.product_id
        });

        return res.status(200).json({
            status: true,
            message: "School master options fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const result = await schoolMasterService.findAll({
            userId: req.user.id,
            productId: req.customer.product_id,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search || "",
            mid: req.query.mid || ""
        });

        return res.status(200).json({
            status: true,
            message: "School master entries fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await schoolMasterService.findById(
            req.params.id,
            req.user.id,
            req.customer.product_id
        );

        return res.status(200).json({
            status: true,
            message: "School master entry fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await schoolMasterService.update(
            req.params.id,
            req.body,
            req.user.id,
            req.customer.product_id
        );

        return res.status(200).json({
            status: true,
            message: "School master entry updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await schoolMasterService.remove(
            req.params.id,
            req.user.id,
            req.customer.product_id
        );

        return res.status(200).json({
            status: true,
            message: "School master entry deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    findMasterOptions,
    findAll,
    findById,
    update,
    remove
};

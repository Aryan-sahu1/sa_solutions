const billService = require("../service/bill.service");

const findNextBillNo = async (req, res, next) => {
    try {
        const billno = await billService.findNextBillNo(req.user.id);

        return res.status(200).json({
            status: true,
            message: "Next bill no fetched successfully",
            data: {
                billno
            }
        });
    } catch (error) {
        next(error);
    }
};

const findSalesTotal = async (req, res, next) => {
    try {
        const data = await billService.findSalesTotal(req.query, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Sales total fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await billService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: result.count > 1
                ? `${result.count} bill entries created successfully`
                : "Bill entry created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const result = await billService.findAll({
            userId: req.user.id,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search || ""
        });

        return res.status(200).json({
            status: true,
            message: "Bill entries fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await billService.findById(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Bill entry fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await billService.update(req.params.id, req.body, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Bill entry updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await billService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Bill entry deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    findNextBillNo,
    findSalesTotal,
    create,
    findAll,
    findById,
    update,
    remove
};

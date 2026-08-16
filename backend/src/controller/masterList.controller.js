const masterListService = require("../service/masterList.service");

const create = async (req, res, next) => {
    try {
        const result = await masterListService.create(req.body);

        return res.status(201).json({
            status: true,
            message: "Master created successfully",
            data: result
        });

    } catch (error) {
        next(error)
    }
};

const findAll = async (req, res, next) => {
    try {
        const { limit, page, search, product_id, pid } = req.query;

        const options = {
            limit: parseInt(limit, 10) || 10,
            page: parseInt(page, 10) || 1,
            search: search ? String(search) : "",
            productId: product_id || pid || ""
        };


        const result = await masterListService.findAll(options);
        const totalPages = Math.ceil(result.total / options.limit);
        return res.status(200).json({
            status: true,
            message: "Staff categories fetched successfully",
            data: result.rows,
            pagination: {
                total: result.total || 0,
                page: options.page,
                limit: options.limit,
                totalPages: totalPages
            }
        });

    } catch (error) {
        next(error)
    }
};

const findByCustomerProduct = async (req, res, next) => {
    try {
        const { limit, page, search } = req.query;

        const options = {
            limit: parseInt(limit, 10) || 1000,
            page: parseInt(page, 10) || 1,
            search: search ? String(search) : "",
            productId: req.customer?.product_id
        };

        const result = await masterListService.findAll(options);
        const totalPages = Math.ceil(result.total / options.limit);

        return res.status(200).json({
            status: true,
            message: "Staff categories fetched successfully",
            data: result.rows,
            pagination: {
                total: result.total || 0,
                page: options.page,
                limit: options.limit,
                totalPages
            }
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const data = await masterListService.findById(id);

        return res.status(200).json({
            status: true,
            message: "Staff category fetched successfully",
            data
        });

    } catch (error) {
        next(error)
    }
};

const update = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await masterListService.update(
            id,
            req.body
        );

        return res.status(200).json({
            status: true,
            message: "Master updated successfully",
            data: result
        });

    } catch (error) {
        next(error)
    }
};

const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await masterListService.remove(id);

        return res.status(200).json({
            status: true,
            message: "Master deleted successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    findAll,
    findByCustomerProduct,
    findById,
    update,
    remove
};

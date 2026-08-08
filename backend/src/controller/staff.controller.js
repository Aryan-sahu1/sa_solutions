const staffCategoryService = require("../service/staff.service");

const create = async (req, res) => {
    try {
        const result = await staffCategoryService.create(req.body);

        return res.status(201).json({
            status: true,
            message: "Staff category created successfully",
            data: result
        });

    } catch (error) {
        console.error(error);

        return res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

const findAll = async (req, res) => {
    try {
        const data = await staffCategoryService.findAll();

        return res.status(200).json({
            status: true,
            message: "Staff categories fetched successfully",
            data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

const findById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await staffCategoryService.findById(id);

        return res.status(200).json({
            status: true,
            message: "Staff category fetched successfully",
            data
        });

    } catch (error) {
        console.error(error);

        return res.status(404).json({
            status: false,
            message: error.message
        });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffCategoryService.update(
            id,
            req.body
        );

        return res.status(200).json({
            status: true,
            message: "Staff category updated successfully",
            data: result
        });

    } catch (error) {
        console.error(error);

        return res.status(400).json({
            status: false,
            message: error.message
        });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await staffCategoryService.remove(id);

        return res.status(200).json({
            status: true,
            message: "Staff category deleted successfully",
            data: result
        });

    } catch (error) {
        console.error(error);

        return res.status(404).json({
            status: false,
            message: error.message
        });
    }
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
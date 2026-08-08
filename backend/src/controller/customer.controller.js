const customerService = require("../service/customer.service");


// CREATE
const create = async (req, res) => {
    try {
        const result = await customerService.create(req.body);

        return res.status(201).json({
            status: true,
            message: "Customer created successfully",
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


// GET ALL
const findAll = async (req, res) => {
    try {
        const data = await customerService.findAll();

        return res.status(200).json({
            status: true,
            message: "Customers fetched successfully",
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


// GET BY ID
const findById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await customerService.findById(id);

        return res.status(200).json({
            status: true,
            message: "Customer fetched successfully",
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


// UPDATE
const update = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await customerService.update(
            id,
            req.body
        );

        return res.status(200).json({
            status: true,
            message: "Customer updated successfully",
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


// DELETE
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await customerService.remove(id);

        return res.status(200).json({
            status: true,
            message: "Customer deleted successfully",
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
const studentService = require("../../service/school/student.service");

const create = async (req, res, next) => {
    try {
        const result = await studentService.create(req.body, req.user.id);

        return res.status(201).json({
            status: true,
            message: "Student created successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const result = await studentService.findAll({
            userId: req.user.id,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            search: req.query.search || ""
        });

        return res.status(200).json({
            status: true,
            message: "Students fetched successfully",
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const data = await studentService.findById(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Student fetched successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const data = await studentService.update(
            req.params.id,
            req.body,
            req.user.id
        );

        return res.status(200).json({
            status: true,
            message: "Student updated successfully",
            data
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await studentService.remove(req.params.id, req.user.id);

        return res.status(200).json({
            status: true,
            message: "Student deleted successfully"
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

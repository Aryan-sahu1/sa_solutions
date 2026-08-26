const dailyReportRepository =
    require("../../repository/reports/dailyReport.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isValidDate = (value) => {
    if (!value) return false;

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
};

const findAll = async (options = {}) => {
    if (!options.userId) {
        throw createError("userId is required");
    }

    if (!isValidDate(options.date)) {
        throw createError("date must be a valid date");
    }

    return await dailyReportRepository.findAll({
        userId: options.userId,
        date: String(options.date).slice(0, 10)
    });
};

module.exports = {
    findAll
};

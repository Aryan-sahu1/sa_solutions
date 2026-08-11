const dashboardService = require("../service/dashboard.service");

const getStats = async (req, res, next) => {
    try {
        const data = await dashboardService.getStats();

        return res.status(200).json({
            status: true,
            message: "Dashboard stats fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
};

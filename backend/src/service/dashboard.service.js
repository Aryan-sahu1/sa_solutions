const dashboardRepository = require("../repository/dashboard.repository");

const getStats = async () => {
    return await dashboardRepository.getStats();
};

module.exports = {
    getStats,
};

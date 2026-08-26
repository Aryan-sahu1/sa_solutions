const dailyReportService =
    require("../../service/reports/dailyReport.service");

const findAll = async (req, res, next) => {
    try {
        const result = await dailyReportService.findAll({
            userId: req.user.id,
            date: req.query.date || ""
        });

        return res.status(200).json({
            status: true,
            message: "Daily report fetched successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    findAll
};

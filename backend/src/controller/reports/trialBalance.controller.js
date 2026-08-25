const trialBalanceService =
    require("../../service/reports/trialBalance.service");

const findAll = async (req, res, next) => {
    try {
        const result = await trialBalanceService.findAll({
            userId: req.user.id,
            fromDate: req.query.fromDate || req.query.from_date || "",
            toDate: req.query.toDate || req.query.to_date || "",
            partyId: req.query.partyId || req.query.party_id || "",
            search: req.query.search || "",
            includeZero: req.query.includeZero || req.query.include_zero || false
        });

        return res.status(200).json({
            status: true,
            message: "Trial balance fetched successfully",
            data: result.data,
            totals: result.totals
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    findAll
};

const accountStatementService =
    require("../../service/reports/accountStatement.service");

const findAll = async (req, res, next) => {
    try {
        const result = await accountStatementService.findAll({
            userId: req.user.id,
            partyId: req.query.partyId || req.query.party_id || "",
            fromDate: req.query.fromDate || req.query.from_date || "",
            toDate: req.query.toDate || req.query.to_date || ""
        });

        return res.status(200).json({
            status: true,
            message: "Account statement fetched successfully",
            party: result.party,
            opening_balance: result.opening_balance,
            closing_balance: result.closing_balance,
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

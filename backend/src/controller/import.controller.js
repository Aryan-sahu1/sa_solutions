const importService = require("../service/import.service");

const importExcel = async (req, res, next) => {
    try {
        const result = await importService.importWorkbook({
            customerId: req.query.customer_id || req.body?.customer_id,
            buffer: req.body
        });

        return res.status(201).json({
            status: true,
            message: "Data imported successfully",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    importExcel
};

const db = require("../config/db");

const getStats = async () => {
    const [
        [productsRows],
        [customersRows],
        [staffRows],
    ] = await Promise.all([
        db.query("SELECT COUNT(*) AS total FROM products WHERE deleted_at IS NULL"),
        db.query("SELECT COUNT(*) AS total FROM customers WHERE deleted_at IS NULL"),
        db.query("SELECT COUNT(*) AS total FROM staff_categories WHERE deleted_at IS NULL"),
    ]);

    return {
        products: productsRows[0].total || 0,
        customers: customersRows[0].total || 0,
        staff: staffRows[0].total || 0,
    };
};

module.exports = {
    getStats,
};

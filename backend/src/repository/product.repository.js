const db = require("../config/db")

const create = async (body) => {
    const sql = ` INSERT INTO products(name) VALUES(?)`
    const [result] = await db.query(sql, [body.name])
    return result;
}

const findAll = async (page, limit, search) => {
    const offset = (page - 1) * limit;

    let where = `WHERE deleted_at IS NULL`;
    let params = [];

    // Search
    if (search && search.trim() !== "") {
        console.log(search,"kbfwehwebfjebhfjhw")
        where += ` AND name LIKE ?`;
        params.push(`%${search.trim()}%`);
    }

    // Get products
    const sql = `
        SELECT *
        FROM products
        ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [
        ...params,
        limit,
        offset
    ]);

    // Get total records
    const countSql = `
        SELECT COUNT(*) AS total
        FROM products
        ${where}
    `;

    const [countRows] = await db.query(countSql, params);

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);

    return {
        data: rows,
        pagination: {
            currentPage: page,
            limit: limit,
            total: total,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
};

module.exports = {
    create,
    findAll

};
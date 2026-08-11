const db = require("../config/db");

const create = async (body) => {
    const sql = `
        INSERT INTO staff_categories (product_id, name)
        VALUES (?, ?)
    `;

    const [result] = await db.query(sql, [
        body.product_id,
        body.name
    ]);

    return result;
};

const findAll = async ({ limit = 10, page = 1, search = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE sc.deleted_at IS NULL`;
    const params = [];

    if (search && String(search).trim().length) {
        where += ` AND (sc.name LIKE ? OR p.name LIKE ?)`;
        const like = `%${search}%`;
        params.push(like, like);
    }

    const countSql = `
        SELECT
            COUNT(*) AS total
        FROM staff_categories sc
        LEFT JOIN products p
            ON p.id = sc.product_id
        ${where}
    `;

    const dataSql = `
        SELECT
            sc.id,
            sc.product_id,
            sc.name,
            sc.created_at,
            sc.updated_at,
            sc.deleted_at,
            p.name AS product_name
        FROM staff_categories sc
        LEFT JOIN products p
            ON p.id = sc.product_id
        ${where}
        ORDER BY sc.id DESC
        LIMIT ?
        OFFSET ?
    `;

    const countParams = params.slice();
    const dataParams = params.slice();
    dataParams.push(limit, offset);

    const [countResult] = await db.query(countSql, countParams);
    const [rows] = await db.query(dataSql, dataParams);
    const total = (countResult && countResult[0] && countResult[0].total) || 0;

    return { rows, total };
};

const findById = async (id) => {
    const sql = `
        SELECT 
            id,
            product_id,
            name,
            created_at,
            updated_at,
            deleted_at
        FROM staff_categories
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id]);

    return rows[0] || null;
};

const update = async (id, body) => {
    const sql = `
        UPDATE staff_categories
        SET product_id = ?,
            name = ?
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.product_id,
        body.name,
        id
    ]);

    return result;
};

const remove = async (id) => {
    const sql = `
        UPDATE staff_categories
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const [result] = await db.query(sql, [id]);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};

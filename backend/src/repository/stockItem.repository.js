const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO stock_item (name, cid, inLtr)
        VALUES (?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.name,
        userId,
        body.inLtr
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE deleted_at IS NULL AND cid = ?`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += ` AND (name LIKE ? OR inLtr LIKE ?)`;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            id,
            name,
            cid,
            inLtr,
            created_at,
            updated_at,
            deleted_at
        FROM stock_item
        ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM stock_item
        ${where}
    `;

    const [rows] = await db.query(dataSql, [
        ...params,
        limit,
        offset
    ]);
    const [countRows] = await db.query(countSql, params);

    const total = countRows[0].total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        data: rows,
        pagination: {
            currentPage: page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
};

const findById = async (id, userId) => {
    const sql = `
        SELECT
            id,
            name,
            cid,
            inLtr,
            created_at,
            updated_at,
            deleted_at
        FROM stock_item
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE stock_item
        SET name = ?,
            inLtr = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.inLtr,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE stock_item
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [id, userId]);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};

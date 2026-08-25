const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO nozel (name, snno, pid, cid)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.snno,
        body.pid,
        userId
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", productId = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE n.deleted_at IS NULL AND n.cid = ?`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += ` AND (n.name LIKE ? OR n.snno LIKE ? OR pc.name LIKE ?)`;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (productId && String(productId).trim() !== "") {
        where += ` AND n.pid = ?`;
        params.push(productId);
    }

    const dataSql = `
        SELECT
            n.id,
            n.name,
            n.snno,
            n.pid,
            n.cid,
            pc.name AS product_name,
            n.created_at,
            n.updated_at,
            n.deleted_at
        FROM nozel n
        LEFT JOIN product_category pc
            ON pc.id = n.pid
            AND pc.cid = n.cid
            AND pc.deleted_at IS NULL
        ${where}
        ORDER BY n.snno DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM nozel n
        LEFT JOIN product_category pc
            ON pc.id = n.pid
            AND pc.cid = n.cid
            AND pc.deleted_at IS NULL
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
            n.id,
            n.name,
            n.snno,
            n.pid,
            n.cid,
            pc.name AS product_name,
            n.created_at,
            n.updated_at,
            n.deleted_at
        FROM nozel n
        LEFT JOIN product_category pc
            ON pc.id = n.pid
            AND pc.cid = n.cid
            AND pc.deleted_at IS NULL
        WHERE n.id = ?
        AND n.cid = ?
        AND n.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE nozel
        SET name = ?,
            snno = ?,
            pid = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.snno,
        body.pid,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE nozel
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

const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO t_head_master (cid, name, head_type)
        VALUES (?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        userId,
        body.name,
        body.head_type
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE cid = ?`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += ` AND (name LIKE ? OR head_type LIKE ?)`;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            id,
            cid,
            name,
            head_type,
            created_at,
            updated_at
        FROM t_head_master
        ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM t_head_master
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
            cid,
            name,
            head_type,
            created_at,
            updated_at
        FROM t_head_master
        WHERE id = ?
        AND cid = ?
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE t_head_master
        SET name = ?,
            head_type = ?
        WHERE id = ?
        AND cid = ?
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.head_type,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        DELETE FROM t_head_master
        WHERE id = ?
        AND cid = ?
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

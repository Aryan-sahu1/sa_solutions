const db = require("../config/db");

const create = async (body) => {
    const sql = `
        INSERT INTO t_head_master (name)
        VALUES (?)
    `;

    const [result] = await db.query(sql, [
        body.name
    ]);

    return result;
};

const findAll = async ({ page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE deleted_at IS NULL`;
    const params = [];

    if (search && String(search).trim() !== "") {
        where += ` AND name LIKE ?`;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm);
    }

    const dataSql = `
        SELECT
            id,
            name,
            created_at,
            updated_at,
            deleted_at
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

const findById = async (id) => {
    const sql = `
        SELECT
            id,
            name,
            created_at,
            updated_at,
            deleted_at
        FROM t_head_master
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id]);

    return rows[0] || null;
};

const update = async (id, body) => {
    const sql = `
        UPDATE t_head_master
        SET name = ?
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        id
    ]);

    return result;
};

const remove = async (id) => {
    const sql = `
        UPDATE t_head_master
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND deleted_at IS NULL
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

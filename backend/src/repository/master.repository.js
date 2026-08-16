const db = require("../config/db");

const create = async (body) => {
    const sql = `
        INSERT INTO master (sid, name)
        VALUES (?, ?)
    `;

    const [result] = await db.query(sql, [
        body.product_id,
        body.name
    ]);

    return result;
};

const findAll = async ({
    limit = 10,
    page = 1,
    search = "",
    productId = "",
    masterListName = ""
} = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE sc.deleted_at IS NULL`;
    const params = [];

    if (productId && String(productId).trim() !== "") {
        where += ` AND sc.sid = ?`;
        params.push(productId);
    }

    if (masterListName && String(masterListName).trim() !== "") {
        where += ` AND sc.name = ?`;
        params.push(String(masterListName).trim());
    }

    if (search && String(search).trim().length) {
        where += ` AND (sc.name LIKE ? OR p.name LIKE ?)`;
        const like = `%${search}%`;
        params.push(like, like);
    }

    const countSql = `
        SELECT
            COUNT(*) AS total
        FROM master sc
        LEFT JOIN masterlist p
            ON p.id = sc.sid
        ${where}
    `;

    const dataSql = `
        SELECT
            sc.id,
            sc.sid,
            sc.name,
            sc.created_at,
            sc.updated_at,
            sc.deleted_at,
            p.name AS product_name
        FROM master sc
        LEFT JOIN masterlist p
            ON p.id = sc.sid
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
            sid,
            name,
            created_at,
            updated_at,
            deleted_at
        FROM master
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id]);

    return rows[0] || null;
};

const findMasterListById = async (id) => {
    const sql = `
        SELECT
            id,
            pid,
            name
        FROM masterlist
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id]);

    return rows[0] || null;
};

const update = async (id, body) => {
    const sql = `
        UPDATE master
        SET sid = ?,
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
        UPDATE master
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
    findMasterListById,
    update,
    remove
};

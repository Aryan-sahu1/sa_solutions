const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO leak1 (
            date,
            qty,
            cid,
            iid
        )
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.date,
        body.qty,
        userId,
        body.iid
    ]);

    return result;
};

const findAll = async ({
    userId,
    page = 1,
    limit = 10,
    search = "",
    iid = ""
} = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE l.deleted_at IS NULL AND l.cid = ?`;
    const params = [userId];

    if (iid && String(iid).trim() !== "") {
        where += ` AND l.iid = ?`;
        params.push(iid);
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                l.qty LIKE ?
                OR si.name LIKE ?
                OR si.measure_unit LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            l.id,
            l.date,
            l.qty,
            l.cid,
            l.iid,
            l.created_at,
            l.updated_at,
            l.deleted_at,
            si.name AS stock_item_name,
            si.inLtr AS stock_item_in_ltr,
            si.measure_unit AS stock_item_measure_unit
        FROM leak1 l
        LEFT JOIN stock_item si
            ON si.id = l.iid
            AND si.cid = l.cid
            AND si.deleted_at IS NULL
        ${where}
        ORDER BY l.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM leak1 l
        LEFT JOIN stock_item si
            ON si.id = l.iid
            AND si.cid = l.cid
            AND si.deleted_at IS NULL
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
            l.id,
            l.date,
            l.qty,
            l.cid,
            l.iid,
            l.created_at,
            l.updated_at,
            l.deleted_at,
            si.name AS stock_item_name,
            si.inLtr AS stock_item_in_ltr,
            si.measure_unit AS stock_item_measure_unit
        FROM leak1 l
        LEFT JOIN stock_item si
            ON si.id = l.iid
            AND si.cid = l.cid
            AND si.deleted_at IS NULL
        WHERE l.id = ?
        AND l.cid = ?
        AND l.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE leak1
        SET date = ?,
            qty = ?,
            iid = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.date,
        body.qty,
        body.iid,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE leak1
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

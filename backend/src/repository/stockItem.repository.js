const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO stock_item (
            name,
            inLtr,
            pid,
            measure_unit,
            o_quantity,
            o_rate,
            gst,
            gst_code,
            cid,
            measurement_data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.inLtr || null,
        body.pid || 0,
        body.measure_unit || null,
        body.o_quantity || null,
        body.o_rate || null,
        body.gst || null,
        body.gst_code || null,
        userId,
        body.measurement_data || null
    ]);

    return result;
};

const findAll = async ({
    userId,
    page = 1,
    limit = 10,
    search = "",
    pid = ""
} = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE si.deleted_at IS NULL AND si.cid = ?`;
    const params = [userId];

    if (pid && String(pid).trim() !== "") {
        where += ` AND si.pid = ?`;
        params.push(pid);
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                si.name LIKE ?
                OR si.inLtr LIKE ?
                OR pc.name LIKE ?
                OR pc.unit LIKE ?
                OR si.measure_unit LIKE ?
                OR si.o_quantity LIKE ?
                OR si.o_rate LIKE ?
                OR si.gst LIKE ?
                OR si.gst_code LIKE ?
                OR si.measurement_data LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm
        );
    }

    const dataSql = `
        SELECT
            si.id,
            si.name,
            si.cid,
            si.inLtr,
            si.pid,
            si.measure_unit,
            si.o_quantity,
            si.o_rate,
            si.gst,
            si.gst_code,
            si.measurement_data,
            si.created_at,
            si.updated_at,
            si.deleted_at,
            pc.name AS product_category_name,
            pc.unit AS product_category_unit
        FROM stock_item si
        LEFT JOIN product_category pc
            ON pc.id = si.pid
            AND pc.cid = si.cid
            AND pc.deleted_at IS NULL
        ${where}
        ORDER BY si.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM stock_item si
        LEFT JOIN product_category pc
            ON pc.id = si.pid
            AND pc.cid = si.cid
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
            si.id,
            si.name,
            si.cid,
            si.inLtr,
            si.pid,
            si.measure_unit,
            si.o_quantity,
            si.o_rate,
            si.gst,
            si.gst_code,
            si.measurement_data,
            si.created_at,
            si.updated_at,
            si.deleted_at,
            pc.name AS product_category_name,
            pc.unit AS product_category_unit
        FROM stock_item si
        LEFT JOIN product_category pc
            ON pc.id = si.pid
            AND pc.cid = si.cid
            AND pc.deleted_at IS NULL
        WHERE si.id = ?
        AND si.cid = ?
        AND si.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE stock_item
        SET name = ?,
            inLtr = ?,
            pid = ?,
            measure_unit = ?,
            o_quantity = ?,
            o_rate = ?,
            gst = ?,
            gst_code = ?,
            measurement_data = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.inLtr || null,
        body.pid,
        body.measure_unit || null,
        body.o_quantity || null,
        body.o_rate || null,
        body.gst || null,
        body.gst_code || null,
        body.measurement_data || null,
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

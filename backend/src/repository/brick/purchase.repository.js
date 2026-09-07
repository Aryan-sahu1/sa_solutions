const db = require("../../config/db");

const BRICK_PURCHASE_TYPE = "BP";

const create = async (body, userId) => {
    const sql = `
        INSERT INTO tran (
            pid,
            crid,
            date,
            type,
            type1,
            remarks,
            amt,
            cid,
            vehicle_text,
            cash,
            cgst,
            igst,
            iid,
            qty
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        BRICK_PURCHASE_TYPE,
        null,
        body.remarks || null,
        body.amt,
        userId,
        body.vehicle_text || null,
        body.cash || null,
        body.cgst || null,
        body.igst || null,
        body.iid,
        body.qty
    ]);

    return { id: result.insertId };
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", date = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE tr.deleted_at IS NULL AND tr.cid = ? AND tr.type = ?`;
    const params = [userId, BRICK_PURCHASE_TYPE];

    if (date && String(date).trim() !== "") {
        where += ` AND DATE(tr.date) = ?`;
        params.push(String(date).trim());
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                tr.remarks LIKE ?
                OR tr.amt LIKE ?
                OR tr.vehicle_text LIKE ?
                OR tr.cash LIKE ?
                OR tr.cgst LIKE ?
                OR tr.igst LIKE ?
                OR tr.qty LIKE ?
                OR selected_party.name LIKE ?
                OR si.name LIKE ?
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
            searchTerm
        );
    }

    const dataSql = `
        SELECT
            tr.id,
            tr.pid,
            tr.crid,
            tr.date,
            tr.type,
            tr.type1,
            tr.remarks,
            tr.amt,
            tr.cid,
            tr.vehicle_text,
            tr.cash,
            tr.cgst,
            tr.igst,
            tr.iid,
            tr.qty,
            tr.created_at,
            tr.updated_at,
            tr.deleted_at,
            purchase_party.name AS purchase_account_name,
            selected_party.name AS party_name,
            si.name AS stock_item_name
        FROM tran tr
        LEFT JOIN party purchase_party
            ON purchase_party.id = tr.pid
            AND purchase_party.cid = tr.cid
            AND purchase_party.deleted_at IS NULL
        LEFT JOIN party selected_party
            ON selected_party.id = tr.crid
            AND selected_party.cid = tr.cid
            AND selected_party.deleted_at IS NULL
        LEFT JOIN stock_item si
            ON si.id = tr.iid
            AND si.cid = tr.cid
            AND si.deleted_at IS NULL
        ${where}
        ORDER BY tr.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM tran tr
        LEFT JOIN party selected_party
            ON selected_party.id = tr.crid
            AND selected_party.cid = tr.cid
            AND selected_party.deleted_at IS NULL
        LEFT JOIN stock_item si
            ON si.id = tr.iid
            AND si.cid = tr.cid
            AND si.deleted_at IS NULL
        ${where}
    `;

    const [rows] = await db.query(dataSql, [...params, limit, offset]);
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
    const [rows] = await db.query(
        `
            SELECT
                tr.id,
                tr.pid,
                tr.crid,
                tr.date,
                tr.type,
                tr.type1,
                tr.remarks,
                tr.amt,
                tr.cid,
                tr.vehicle_text,
                tr.cash,
                tr.cgst,
                tr.igst,
                tr.iid,
                tr.qty,
                selected_party.name AS party_name,
                si.name AS stock_item_name
            FROM tran tr
            LEFT JOIN party selected_party
                ON selected_party.id = tr.crid
                AND selected_party.cid = tr.cid
                AND selected_party.deleted_at IS NULL
            LEFT JOIN stock_item si
                ON si.id = tr.iid
                AND si.cid = tr.cid
                AND si.deleted_at IS NULL
            WHERE tr.id = ?
            AND tr.cid = ?
            AND tr.type = ?
            AND tr.deleted_at IS NULL
            LIMIT 1
        `,
        [id, userId, BRICK_PURCHASE_TYPE]
    );

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE tran
        SET pid = ?,
            crid = ?,
            date = ?,
            remarks = ?,
            amt = ?,
            vehicle_text = ?,
            cash = ?,
            cgst = ?,
            igst = ?,
            iid = ?,
            qty = ?
        WHERE id = ?
        AND cid = ?
        AND type = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        body.remarks || null,
        body.amt,
        body.vehicle_text || null,
        body.cash || null,
        body.cgst || null,
        body.igst || null,
        body.iid,
        body.qty,
        id,
        userId,
        BRICK_PURCHASE_TYPE
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE tran
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND type = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [id, userId, BRICK_PURCHASE_TYPE]);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};

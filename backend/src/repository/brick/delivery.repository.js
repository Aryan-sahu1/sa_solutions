const db = require("../../config/db");

const BRICK_DELIVERY_TYPE = "S";

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
            vehicle_no,
            vamt,
            dqty,
            damt,
            lamt,
            creturn,
            iid,
            qty
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        BRICK_DELIVERY_TYPE,
        null,
        body.remarks || "",
        body.amt,
        userId,
        body.vehicle_no,
        body.vamt || null,
        body.dqty || null,
        body.damt || null,
        body.lamt || null,
        body.creturn ? 1 : 0,
        body.iid,
        body.qty
    ]);

    return { id: result.insertId };
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", date = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `
        WHERE tr.deleted_at IS NULL
        AND tr.cid = ?
        AND tr.type = ?
        AND tr.type1 IS NULL
        AND tr.iid IS NOT NULL
    `;
    const params = [userId, BRICK_DELIVERY_TYPE];

    if (date && String(date).trim() !== "") {
        where += ` AND DATE(tr.date) = ?`;
        params.push(String(date).trim());
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                tr.remarks LIKE ?
                OR tr.amt LIKE ?
                OR vm.name LIKE ?
                OR tr.vamt LIKE ?
                OR tr.dqty LIKE ?
                OR tr.damt LIKE ?
                OR tr.lamt LIKE ?
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
            tr.vehicle_no,
            tr.vamt,
            tr.dqty,
            tr.damt,
            tr.lamt,
            tr.creturn,
            tr.iid,
            tr.qty,
            tr.created_at,
            tr.updated_at,
            tr.deleted_at,
            sales_party.name AS sales_account_name,
            selected_party.name AS party_name,
            vm.name AS vehicle_name,
            si.name AS stock_item_name
        FROM tran tr
        LEFT JOIN party sales_party
            ON sales_party.id = tr.crid
            AND sales_party.cid = tr.cid
            AND sales_party.deleted_at IS NULL
        LEFT JOIN party selected_party
            ON selected_party.id = tr.pid
            AND selected_party.cid = tr.cid
            AND selected_party.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = tr.vehicle_no
            AND vm.cid = tr.cid
            AND vm.deleted_at IS NULL
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
            ON selected_party.id = tr.pid
            AND selected_party.cid = tr.cid
            AND selected_party.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = tr.vehicle_no
            AND vm.cid = tr.cid
            AND vm.deleted_at IS NULL
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
                tr.vehicle_no,
                tr.vamt,
                tr.dqty,
                tr.damt,
                tr.lamt,
                tr.creturn,
                tr.iid,
                tr.qty,
                selected_party.name AS party_name,
                vm.name AS vehicle_name,
                si.name AS stock_item_name
            FROM tran tr
            LEFT JOIN party selected_party
                ON selected_party.id = tr.pid
                AND selected_party.cid = tr.cid
                AND selected_party.deleted_at IS NULL
            LEFT JOIN vehicle_master vm
                ON vm.id = tr.vehicle_no
                AND vm.cid = tr.cid
                AND vm.deleted_at IS NULL
            LEFT JOIN stock_item si
                ON si.id = tr.iid
                AND si.cid = tr.cid
                AND si.deleted_at IS NULL
            WHERE tr.id = ?
            AND tr.cid = ?
            AND tr.type = ?
            AND tr.type1 IS NULL
            AND tr.iid IS NOT NULL
            AND tr.deleted_at IS NULL
            LIMIT 1
        `,
        [id, userId, BRICK_DELIVERY_TYPE]
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
            vehicle_no = ?,
            vamt = ?,
            dqty = ?,
            damt = ?,
            lamt = ?,
            creturn = ?,
            iid = ?,
            qty = ?
        WHERE id = ?
        AND cid = ?
        AND type = ?
        AND type1 IS NULL
        AND iid IS NOT NULL
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        body.remarks || "",
        body.amt,
        body.vehicle_no,
        body.vamt || null,
        body.dqty || null,
        body.damt || null,
        body.lamt || null,
        body.creturn ? 1 : 0,
        body.iid,
        body.qty,
        id,
        userId,
        BRICK_DELIVERY_TYPE
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
        AND type1 IS NULL
        AND iid IS NOT NULL
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [id, userId, BRICK_DELIVERY_TYPE]);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};

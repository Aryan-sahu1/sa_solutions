const db = require("../config/db");

const create = async (body) => {
    console.log(body,"bodybody")
    const sql = `
        INSERT INTO customers (
            name,
            address,
            address1,
            contact_person,
            gstno,
            mobile,
            product_id,
            start_date,
            end_date,
            product_price,
            amc_price,
            username,
            password,
            company_code,
            remarks
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.address,
        body.address1,
        body.contact_person,
        body.gstno,
        body.mobile,
        body.product_id,
        body.start_date,
        body.end_date,
        body.product_price,
        body.amc_price,
        body.username,
        body.password,
        body.company_code,
        body.remarks
    ]);

    return result;
};


const findAll = async () => {
    const sql = `
        SELECT
            id,
            name,
            address,
            address1,
            contact_person,
            gstno,
            mobile,
            product_id,
            start_date,
            end_date,
            product_price,
            amc_price,
            username,
            company_code,
            remarks,
            created_at,
            updated_at,
            deleted_at
        FROM customers
        WHERE deleted_at IS NULL
        ORDER BY id DESC
    `;

    const [rows] = await db.query(sql);

    return rows;
};


const findById = async (id) => {
    const sql = `
        SELECT
            id,
            name,
            address,
            address1,
            contact_person,
            gstno,
            mobile,
            product_id,
            start_date,
            end_date,
            product_price,
            amc_price,
            username,
            company_code,
            remarks,
            created_at,
            updated_at,
            deleted_at
        FROM customers
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id]);

    return rows[0] || null;
};


const update = async (id, body) => {
    const sql = `
        UPDATE customers
        SET
            name = ?,
            address = ?,
            address1 = ?,
            contact_person = ?,
            gstno = ?,
            mobile = ?,
            product_id = ?,
            start_date = ?,
            end_date = ?,
            product_price = ?,
            amc_price = ?,
            username = ?,
            company_code = ?,
            remarks = ?
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.address,
        body.address1,
        body.contact_person,
        body.gstno,
        body.mobile,
        body.product_id,
        body.start_date,
        body.end_date,
        body.product_price,
        body.amc_price,
        body.username,
        body.company_code,
        body.remarks,
        id
    ]);

    return result;
};


const remove = async (id) => {
    const sql = `
        UPDATE customers
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
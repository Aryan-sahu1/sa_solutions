const db = require("../config/db");

const create = async (body) => {
    const sql = `
        INSERT INTO customers (
            name,
            dealer,
            panno,
            udyamno,
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.dealer,
        body.panno,
        body.udyamno,
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


const findAll = async (page, limit, search) => {
    const offset = (page - 1) * limit;
    let where = `WHERE c.deleted_at IS NULL`;
    const params = [];

    if (search && search.trim() !== "") {
        const searchTerm = `%${search.trim()}%`;
        where += `
            AND (
                c.name LIKE ?
                OR c.dealer LIKE ?
                OR c.panno LIKE ?
                OR c.udyamno LIKE ?
                OR c.address LIKE ?
                OR c.address1 LIKE ?
                OR c.contact_person LIKE ?
                OR c.gstno LIKE ?
                OR c.mobile LIKE ?
                OR c.username LIKE ?
                OR c.company_code LIKE ?
                OR c.remarks LIKE ?
                OR p.name LIKE ?
            )
        `;
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
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm
        );
    }

    const sql = `
        SELECT
            c.id,
            c.name,
            c.dealer,
            c.panno,
            c.udyamno,
            c.address,
            c.address1,
            c.contact_person,
            c.gstno,
            c.mobile,
            c.product_id,
            c.start_date,
            c.end_date,
            c.product_price,
            c.amc_price,
            c.username,
            c.company_code,
            c.remarks,
            c.created_at,
            c.updated_at,
            c.deleted_at,
            p.name AS product_name
        FROM customers c
        LEFT JOIN products p
            ON c.product_id = p.id
            AND p.deleted_at IS NULL
        ${where}
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [
        ...params,
        limit,
        offset
    ]);

    const countSql = `
        SELECT COUNT(*) AS total
        FROM customers c
        LEFT JOIN products p
            ON c.product_id = p.id
            AND p.deleted_at IS NULL
        ${where}
    `;

    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    const data = rows.map((row) => {
        const { product_name, ...customer } = row;

        return {
            ...customer,
            product: row.product_id
                ? {
                    id: row.product_id,
                    name: product_name
                }
                : null
        };
    });

    return {
        data,
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
            c.id,
            c.name,
            c.dealer,
            c.panno,
            c.udyamno,
            c.address,
            c.address1,
            c.contact_person,
            c.gstno,
            c.mobile,
            c.product_id,
            c.start_date,
            c.end_date,
            c.product_price,
            c.amc_price,
            c.username,
            c.company_code,
            c.remarks,
            c.created_at,
            c.updated_at,
            c.deleted_at,
            p.name AS product_name
        FROM customers c
        LEFT JOIN products p
            ON c.product_id = p.id
            AND p.deleted_at IS NULL
        WHERE c.id = ?
        AND c.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id]);

    if (!rows[0]) {
        return null;
    }

    const { product_name, ...customer } = rows[0];

    return {
        ...customer,
        product: customer.product_id
            ? {
                id: customer.product_id,
                name: product_name
            }
            : null
    };
};


const update = async (id, body) => {
    const sql = `
        UPDATE customers
        SET
            name = ?,
            dealer = ?,
            panno = ?,
            udyamno = ?,
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
            password = COALESCE(?, password),
            company_code = ?,
            remarks = ?
        WHERE id = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.dealer,
        body.panno,
        body.udyamno,
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
        body.password || null,
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

const findByUsername = async (username) => {
    let rows;

    // First check customer
    [rows] = await db.query(
        `SELECT 
            id,
            name,
            username,
            password,
            'customer' AS user_type
         FROM customers
         WHERE username = ?
         AND deleted_at IS NULL`,
        [username]
    );

    // If customer not found, check staff
    if (rows.length === 0) {
        [rows] = await db.query(
            `SELECT 
                cid AS id,
                id AS staff_id,
                cid AS customer_id,
                name,
                name AS username,
                password,
                'staff' AS user_type
             FROM staff
             WHERE name = ?
             AND deleted_at IS NULL`,
            [username]
        );
    }

    console.log("Login user:", rows[0] || null);

    return rows[0] || null;
};

const findByIdWithPassword = async (id) => {
    const [rows] = await db.query(
        `SELECT id, name, username, password
         FROM customers
         WHERE id = ?
         AND deleted_at IS NULL`,
        [id]
    );

    return rows[0] || null;
};

const updatePassword = async (id, password) => {
    const sql = `
        UPDATE customers
        SET password = ?
        WHERE id = ?
        AND deleted_at IS NULL
    `;
    const [result] = await db.query(sql, [password, id]);
    return result;
}

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,
    findByUsername,
    findByIdWithPassword,
    updatePassword
};

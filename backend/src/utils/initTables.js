const db = require("../config/db");

const initCustomerPetrolTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS customer_petrol (
            id INT(11) NOT NULL AUTO_INCREMENT,
            date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            ship_no VARCHAR(20) NOT NULL,
            pid INT(11) NOT NULL COMMENT 'relation with party table',
            sid INT(11) NOT NULL COMMENT 'relation with stock_item id',
            qty INT(11) NOT NULL,
            rate VARCHAR(20) NOT NULL,
            amount VARCHAR(20) NOT NULL,
            cid INT(11) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            INDEX idx_customer_petrol_cid_deleted (cid, deleted_at),
            INDEX idx_customer_petrol_pid (pid),
            INDEX idx_customer_petrol_sid (sid)
        )
    `;

    await db.query(sql);
};

const initTables = async () => {
    await initCustomerPetrolTable();
};

module.exports = initTables;

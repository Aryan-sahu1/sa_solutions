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

const initLeakTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS leak1 (
            id INT(11) NOT NULL AUTO_INCREMENT,
            date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            qty INT(11) NOT NULL,
            cid INT(11) NOT NULL COMMENT 'relation with customers table',
            iid INT(11) NOT NULL COMMENT 'relation with stock_item table',
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            INDEX idx_leak1_cid_deleted (cid, deleted_at),
            INDEX idx_leak1_iid (iid)
        )
    `;

    await db.query(sql);
};

const syncMasterForeignKey = async () => {
    const [constraints] = await db.query(
        `
            SELECT
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'master'
                AND COLUMN_NAME = 'sid'
                AND REFERENCED_TABLE_NAME IS NOT NULL
        `
    );

    for (const constraint of constraints) {
        if (constraint.REFERENCED_TABLE_NAME !== "masterlist") {
            await db.query(
                `ALTER TABLE master DROP FOREIGN KEY \`${constraint.CONSTRAINT_NAME}\``
            );
        }
    }

    const [correctConstraints] = await db.query(
        `
            SELECT
                CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'master'
                AND COLUMN_NAME = 'sid'
                AND REFERENCED_TABLE_NAME = 'masterlist'
                AND REFERENCED_COLUMN_NAME = 'id'
        `
    );

    if (correctConstraints.length > 0) {
        return;
    }

    try {
        await db.query(`
            ALTER TABLE master
            ADD CONSTRAINT fk_master_masterlist
            FOREIGN KEY (sid)
            REFERENCES masterlist(id)
            ON UPDATE CASCADE
        `);
    } catch (error) {
        console.warn(
            "Could not add fk_master_masterlist. Existing master.sid values may need cleanup.",
            error.message
        );
    }
};

const initTables = async () => {
    await initCustomerPetrolTable();
    await initLeakTable();
    await syncMasterForeignKey();
};

module.exports = initTables;

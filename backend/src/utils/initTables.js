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

const initTranTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS tran (
            id INT(11) NOT NULL AUTO_INCREMENT,
            pid INT(11) NOT NULL COMMENT 'Relation with party',
            crid INT(11) NOT NULL COMMENT 'Relation with party',
            date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            type VARCHAR(10) NULL DEFAULT 'O',
            type1 VARCHAR(15) NULL DEFAULT NULL,
            remarks VARCHAR(255) NOT NULL,
            amt VARCHAR(10) NOT NULL,
            cid INT(11) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            INDEX idx_tran_cid_deleted (cid, deleted_at),
            INDEX idx_tran_pid (pid),
            INDEX idx_tran_crid (crid),
            INDEX idx_tran_type (type, type1)
        )
    `;

    await db.query(sql);
};

const initTrandeTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS trande (
            id INT(11) NOT NULL AUTO_INCREMENT,
            iid INT(11) NOT NULL COMMENT 'relation with stock_item_table',
            sid INT(11) NOT NULL COMMENT 'Relation with tran',
            product_id INT(11) NULL DEFAULT NULL,
            qty INT(11) NOT NULL,
            rate VARCHAR(20) NULL DEFAULT NULL,
            amt VARCHAR(20) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            INDEX idx_trande_sid_deleted (sid, deleted_at),
            INDEX idx_trande_iid (iid)
        )
    `;

    await db.query(sql);
};

const initBillTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS bill (
            id INT(11) NOT NULL AUTO_INCREMENT,
            sdate DATETIME NULL DEFAULT NULL,
            edate DATETIME NULL DEFAULT NULL,
            date DATETIME NULL DEFAULT NULL,
            billno VARCHAR(50) NULL DEFAULT NULL,
            vehicleno INT(11) NULL DEFAULT NULL,
            party INT(11) NULL DEFAULT NULL,
            remarks TEXT NULL DEFAULT NULL,
            amt DECIMAL(15,2) NULL DEFAULT 0.00,
            type VARCHAR(100) NULL DEFAULT NULL,
            tcs DECIMAL(15,2) NULL DEFAULT 0.00,
            cid INT(11) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            INDEX idx_bill_cid_deleted (cid, deleted_at),
            INDEX idx_bill_party (party),
            INDEX idx_bill_vehicle (vehicleno)
        )
    `;

    await db.query(sql);
};

const addColumnIfMissing = async (tableName, columnName, definition) => {
    const [columns] = await db.query(
        `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                AND COLUMN_NAME = ?
        `,
        [tableName, columnName]
    );

    if (columns.length > 0) {
        return;
    }

    await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`);
};

const addIndexIfMissing = async (tableName, indexName, definition) => {
    const [indexes] = await db.query(
        `
            SELECT INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                AND INDEX_NAME = ?
        `,
        [tableName, indexName]
    );

    if (indexes.length > 0) {
        return;
    }

    await db.query(`ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` ${definition}`);
};

const renameColumnIfExists = async (tableName, oldColumnName, newColumnName, definition) => {
    const [columns] = await db.query(
        `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                AND COLUMN_NAME IN (?, ?)
        `,
        [tableName, oldColumnName, newColumnName]
    );

    const columnNames = columns.map((column) => column.COLUMN_NAME);

    if (!columnNames.includes(oldColumnName) || columnNames.includes(newColumnName)) {
        return;
    }

    await db.query(
        `ALTER TABLE \`${tableName}\` CHANGE COLUMN \`${oldColumnName}\` ${definition}`
    );
};

const syncBillColumns = async () => {
    await addColumnIfMissing("bill", "cid", "`cid` INT(11) NULL DEFAULT NULL");
    await addColumnIfMissing("bill", "created_at", "`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await addColumnIfMissing("bill", "updated_at", "`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    await addColumnIfMissing("bill", "deleted_at", "`deleted_at` TIMESTAMP NULL DEFAULT NULL");
};

const syncCustomerColumns = async () => {
    await addColumnIfMissing("customers", "dealer", "`dealer` VARCHAR(100) NULL DEFAULT NULL AFTER `name`");
    await addColumnIfMissing("customers", "panno", "`panno` VARCHAR(20) NULL DEFAULT NULL AFTER `dealer`");
    await addColumnIfMissing("customers", "udyamno", "`udyamno` VARCHAR(55) NULL DEFAULT NULL AFTER `panno`");
};

const syncStockItemColumns = async () => {
    await addColumnIfMissing("stock_item", "measurement_data", "`measurement_data` VARCHAR(20) NULL DEFAULT NULL");
};

const syncPartyColumns = async () => {
    await addColumnIfMissing("party", "gstno", "`gstno` VARCHAR(30) NULL DEFAULT NULL");
    await addColumnIfMissing("party", "email_id", "`email_id` VARCHAR(100) NULL DEFAULT NULL");
    await addColumnIfMissing("party", "brick_type", "`brick_type` INT(11) NULL DEFAULT NULL COMMENT 'relation with stock_item id'");
    await addIndexIfMissing("party", "idx_party_brick_type", "(`brick_type`)");
};

const syncTranSalesColumns = async () => {
    await addColumnIfMissing("tran", "vehicle_no", "`vehicle_no` INT(11) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "vehicle_text", "`vehicle_text` VARCHAR(50) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "slip_no", "`slip_no` VARCHAR(50) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "cash", "`cash` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "cgst", "`cgst` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "igst", "`igst` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "start_time", "`start_time` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "end_time", "`end_time` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "total_time", "`total_time` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "round", "`round` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "rate", "`rate` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "iid", "`iid` INT(11) NULL DEFAULT NULL COMMENT 'relation with stock_item id'");
    await addColumnIfMissing("tran", "qty", "`qty` VARCHAR(20) NULL DEFAULT NULL");
    await renameColumnIfExists("tran", "vehicle_amount", "vamt", "`vamt` VARCHAR(20) NULL DEFAULT NULL");
    await renameColumnIfExists("tran", "diesel_qty", "dqty", "`dqty` VARCHAR(20) NULL DEFAULT NULL");
    await renameColumnIfExists("tran", "diesel_amount", "damt", "`damt` VARCHAR(20) NULL DEFAULT NULL");
    await renameColumnIfExists("tran", "labour_amount", "lamt", "`lamt` VARCHAR(20) NULL DEFAULT NULL");
    await renameColumnIfExists("tran", "signed_challan", "creturn", "`creturn` TINYINT(1) NOT NULL DEFAULT 0");
    await addColumnIfMissing("tran", "vamt", "`vamt` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "dqty", "`dqty` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "damt", "`damt` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "lamt", "`lamt` VARCHAR(20) NULL DEFAULT NULL");
    await addColumnIfMissing("tran", "creturn", "`creturn` TINYINT(1) NOT NULL DEFAULT 0");
    await addIndexIfMissing("tran", "idx_tran_iid", "(`iid`)");
    await addColumnIfMissing("trande", "product_id", "`product_id` INT(11) NULL DEFAULT NULL");
    await addColumnIfMissing("trande", "rate", "`rate` VARCHAR(20) NULL DEFAULT NULL");
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
    await initTranTable();
    await initTrandeTable();
    await initBillTable();
    await syncBillColumns();
    await syncCustomerColumns();
    await syncStockItemColumns();
    await syncPartyColumns();
    await syncTranSalesColumns();
    await syncMasterForeignKey();
};

module.exports = initTables;

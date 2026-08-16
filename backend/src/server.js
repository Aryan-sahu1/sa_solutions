const app = require("./app")
require("dotenv").config();
const PORT = process.env.PORT;
const db = require("./config/db")
const initTables = require("./utils/initTables")

async function startServer() {
    try {
        await db.query("SELECT 1")
        await initTables()
        console.log("database connected")
        app.listen(PORT, () => {
            console.log(`server start ${PORT}`)
        })
    } catch (error) {
        console.log("❌ Database Connection Failed");

        console.log(error.message);
            process.exit(1);
    }
}

startServer();

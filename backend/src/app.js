const express = require("express");
const app = express();
const cors = require("cors")
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes")
const productRoutes = require("./routes/product.routes")
const dashboardRoutes = require("./routes/dashboard.routes")
const staffRoutes = require("./routes/staff.routes");
const headMasterRoutes = require("./routes/headMaster.routes");
const tHeadMasterRoutes = require("./routes/tHeadMaster.routes");
const customerRoutes =
    require("./routes/customer.routes");
const errorHandler = require("./middleware/errorHandler");
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello World")
})
app.use("/api/product", productRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/staff", staffRoutes);
app.use("/api/head-master", headMasterRoutes);
app.use("/api/t-head-master", tHeadMasterRoutes);
app.use("/api/customers", customerRoutes);


app.use(errorHandler);
module.exports = app

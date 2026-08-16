const express = require("express");
const app = express();
const cors = require("cors")
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes")
const productRoutes = require("./routes/product.routes")
const dashboardRoutes = require("./routes/dashboard.routes")
const masterRoutes = require("./routes/master.routes");
const headMasterRoutes = require("./routes/headMaster.routes");
const tHeadMasterRoutes = require("./routes/tHeadMaster.routes");
const partyRoutes = require("./routes/party.routes");
const productCategoryRoutes = require("./routes/productCategory.routes");
const stockItemRoutes = require("./routes/stockItem.routes");
const staffMemberRoutes = require("./routes/staffMember.routes");
const vehicleMasterRoutes = require("./routes/vehicleMaster.routes");
const customerPetrolRoutes = require("./routes/customerPetrol.routes");
const masterListRoutes = require("./routes/masterlist.routes");
const leakRoutes = require("./routes/leak.routes");
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
app.use("/api/staff", masterRoutes);
app.use("/api/head-master", headMasterRoutes);
app.use("/api/t-head-master", tHeadMasterRoutes);
app.use("/api/party", partyRoutes);
app.use("/api/product-category", productCategoryRoutes);
app.use("/api/stock-item", stockItemRoutes);
app.use("/api/staff-member", staffMemberRoutes);
app.use("/api/vehicle-master", vehicleMasterRoutes);
app.use("/api/customer-petrol", customerPetrolRoutes);
app.use("/api/leak", leakRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/master-list", masterListRoutes);


app.use(errorHandler);
module.exports = app

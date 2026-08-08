const express = require("express");
const app = express();
const cors = require("cors")
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes")
const productRoutes = require("./routes/product.routes")
const staffRoutes = require("./routes/staff.routes");
const customerRoutes =
    require("./routes/customer.routes");
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello World")
})
app.use("/api/product", productRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/staff", staffRoutes);


app.use("/api/customers", customerRoutes);

module.exports = app
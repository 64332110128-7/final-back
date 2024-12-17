require("dotenv").config();
const express = require("express");
const cors = require("cors");

const errorHandler = require("./middlewares/error");
const notFoundHandler = require("./middlewares/notFound");
const authenticate = require("./middlewares/authenticate");
const admin = require("./middlewares/admin");
const authRoute = require("./routes/auth-route");
const adminRoute = require("./routes/admin-route");
const user = require("./routes/user-route")
const location = require("./routes/location-route")

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoute);
app.use("/admin", authenticate, admin, adminRoute);
app.use("/user", authenticate, user);
app.use("/location", location)

app.use(errorHandler);
app.use("*", notFoundHandler);

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server run in port" + " " + port);
});

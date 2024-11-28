require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
console.log("Halo")

app.get("/test", (req, res) => {
  res.json({ message: "Server is working fine!" });
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server run in port" + " " + port);
});
sadasdasdsa
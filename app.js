const cors = require("cors")
const mainRouter = require("./router/routes")
const express = require('express');
const app = express();
const mongoose = require('mongoose');
require("dotenv").config();

const sockets = require("./modules/sockets");

sockets.listen(3002)

mongoose
    .connect(process.env.MONGO_KEY)
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.log(err);
    })

app.use(cors());
app.use(express.json());

app.use("/", mainRouter)

app.listen(2001);
console.log("Server runs on port 2001")

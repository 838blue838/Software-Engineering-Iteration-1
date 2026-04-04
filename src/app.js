require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

app.locals.baseUrl = process.env.BASE_URL || "http://localhost:3000";
app.locals.casBaseUrl = process.env.CAS_BASE_URL || "https://cas.rutgers.edu";

app.use(express.static(path.join(__dirname, "views")));

app.use("/", pageRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;
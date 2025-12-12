import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1d" }));

// Visit counter
let sessionVisits = 0;
app.use((req, res, next) => {
  sessionVisits++;
  res.locals.sessionVisits = sessionVisits;
  next();
});

// Global request logger
app.use((req, res, next) => {
  const now = new Date().toISOString();
  const ua = req.headers["user-agent"] || "";
  const deviceType = /mobile/i.test(ua) ? "Mobile" : "Desktop";

  console.log(`[${now}] ${req.method} ${req.path} — ${deviceType}`);

  res.locals.requestTime = now;
  res.locals.deviceType = deviceType;

  next();
});

//View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//routes

//Home
app.get("/", (req, res) => {
  res.render("home", { title: "PC Part Picker" });
});

//PC Parts List
app.get("/parts", (req, res) => {
  const pcParts = [
    "Case",
    "Power Supply",
    "Motherboard",
    "CPU",
    "RAM",
    "GPU",
    "NVMe",
    "Hard Drive",
    "CPU Cooler",
    "Fans"
  ];

  res.render("parts", { pageTitle: "PC Parts List", parts: pcParts });
});

//About
app.get("/about", (req, res) => {
  res.send(`
    <p>This project was created by Landon Black for CST 217 💻</p>
    <img src="/PCPARTPICKER.png" alt="Example image">
  `);
});

//Static HTML example
app.get("/Hello", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

//Sample routes
app.get("/list", (req, res) => {
  res.send("<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>");
});

app.get("/hello/:name", (req, res) => {
  res.send(`Hello, ${req.params.name}! 👋`);
});

app.get("/part/:name", (req, res) => {
  res.send(`You chose the part: ${req.params.name} 🖥️`);
});

app.get("/parts/:id", (req, res) => {
  res.send(`Details about part #${req.params.id} 🖥️`);
});

//Budget form submit
app.post("/budget", (req, res) => {
  res.send(`Noted! Your budget is: ${req.body.budget}! 💵`);
});

//Admin
app.get("/admin", (req, res) => {
  if (req.query.key !== "omega") {
    return res.status(401).send("ACCESS DENIED");
  }
  res.render("admin", { pageTitle: "Admin" });
});

//Force error to test 500 handler
app.get("/trigger-500", (req, res, next) => {
  next(new Error("Intentional test error"));
});

//404 HANDLER
app.use((req, res) => {
  res.status(404).render("404", {
    pageTitle: "Not Found",
    url: req.originalUrl
  });
});

//500 ERROR HANDLER
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  const status = err.status || 500;

  console.error(`[ERROR] ${status} ${req.method} ${req.url}`, err.message);

  res.status(status).render("500", {
    pageTitle: "Server Error",
    message: isProd ? "Something went wrong." : err.message,
    stack: isProd ? null : err.stack
  });
});

//start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// server.js (ESM — package.json: { "type": "module" })
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 3000;   // <-- added this

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//State File Cache
app.use(express.static('public', { maxAge: '1d' })); // 1 day cache

// Middleware (set these BEFORE your routes)
app.use(express.urlencoded({ extended: true })); // reads form data
app.use(express.static(path.join(__dirname, "public"))); // serve /public

let sessionVisits = 0;
app.use((req, res, next) => {
  sessionVisits++;
  res.locals.sessionVisits = sessionVisits;
  next();
});


// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Routes ---
//Global logger middleware — runs on every request
app.use((req, res, next) => {
  const now = new Date().toISOString();
  const ua = req.headers["user-agent"] || "";
  const deviceType = /mobile/i.test(ua) ? "Mobile" : "Desktop";

  console.log(`[${now}] ${req.method} ${req.path} — ${deviceType}`);

  // share with EJS
  res.locals.requestTime = now;
  res.locals.deviceType = deviceType;

  next(); // important! passes request to next middleware or route
});

// Home (render EJS view named "home.ejs" in ./views)
app.get("/", (req, res) => {
  res.render("home", { title: "PC Part Picker" });
});

// Simple parts list
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

// About (serves inline HTML referencing /public/PCPARTPICKER.png)
app.get("/about", (req, res) => {
  res.send(`
    <p>This project was created by Landon Black for CST 217 💻</p>
    <img src="/PCPARTPICKER.png" alt="Example image">
  `);
});

// Serve static HTML file from public (if you have public/about.html)
app.get("/Hello", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

// Example simple routes
app.get("/list", (req, res) => {
  res.send("<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>");
});

app.get("/hello/:name", (req, res) => {
  const { name } = req.params;
  res.send(`Hello, ${name}! 👋`);
});

app.get("/part/:name", (req, res) => {
  const { name } = req.params;
  res.send(`You chose the part: ${name} 🖥️`);
});

app.get("/parts/:id", (req, res) => {
  const { id } = req.params;
  res.send(`Details about part #${id} 🖥️`);
});

// Form handler (POST /budget)
app.post("/budget", (req, res) => {
  const budget = req.body.budget; // requires express.urlencoded middleware
  res.send(`Noted! Your budget is: ${budget}! 💵`);
});

//Admin
app.get("/admin", (req, res) => {
  if (req.query.key !== "omega") {
    return res.status(401).send("ACCESS DENIED");
  }

  res.render("admin", { pageTitle: "Admin" });
});

//404
app.use((req, res) => {
  res.status(404).render("404", { pageTitle: "Not Found" });
});

// Start server (after routes)
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

//Test error
app.get("/trigger-500", (req, res, next) => {
  next(new Error("Intentional test error"));
});

//404
app.use((req, res) => {
  res.status(404).render("404", {
    pageTitle: "Not Found",
    url: req.originalUrl
  });
});

//500
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  const status = err.status || 500;

  // Minimal logging
  console.error(`[ERROR] ${status} ${req.method} ${req.url}`, err.message);

  res.status(status).render("500", {
    pageTitle: "Server Error",
    message: isProd ? "Something went wrong." : (err.message || "Error"),
    stack: isProd ? null : err.stack
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).render('500', { message: 'Something went wrong! Our team is looking into it.' });
  } else {
    res.status(500).send(err.stack);
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

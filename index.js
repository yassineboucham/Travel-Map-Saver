import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "2002",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// ✅ Function to get all visited countries
async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  return result.rows.map((row) => row.country_code.trim());
}

// 🌍 GET home page
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  res.render("index.ejs", { countries: countries, total: countries.length });
});

// ➕ POST route to add a visited country
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT flag FROM flags WHERE LOWER(name) LIKE '%' || $1 || '%'",
      [input.toLowerCase()]
    );

    if (result.rows.length === 0) {
      const countries = await checkVisited();
      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country not found. Please try again.",
      });
    }

    const countryCode = result.rows[0].flag.trim();

    // Check for duplicate
    const check = await db.query(
      "SELECT * FROM visited_countries WHERE country_code = $1",
      [countryCode]
    );

    if (check.rows.length > 0) {
      const countries = await checkVisited();
      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country already added.",
      });
    }

    // Insert if not duplicate
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
    res.redirect("/");

  } catch (err) {
    console.error("Error:", err);
    const countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Something went wrong. Try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

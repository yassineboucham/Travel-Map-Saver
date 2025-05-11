import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'world',
  password: '2002',
  port: 5432,
});

db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  //Write your code here.
    const result = await db.query('SELECT country_code FROM visited_countries');
    console.log(result.rows);
    res.render("index.ejs", {countries: result.rows, total: result.rows.length });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT flag FROM flags WHERE name = $1",
      [input]
    );

    if (result.rows.length !== 0) {
      const countryCode = result.rows[0].flag;

      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );

      res.redirect("/");
    } else {
      res.status(404).send("Country not found in flags table.");
    }
  } catch (err) {
    console.error("Error inserting country:", err);
    res.status(500).send("Database insert failed");
  }
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

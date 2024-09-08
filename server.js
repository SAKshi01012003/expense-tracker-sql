const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.set("view engine", "ejs");

// MySQL database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Return@0",
  database: "expense_tracker",
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Home route to display all expenses

app.get("/", (req, res) => {
  res.sendFile(path.join("public", "index.html"));
});

app.get("/expense", (req, res) => {
  const sql = "SELECT * FROM expenses ORDER BY date DESC LIMIT 9";
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.render("expense.ejs", { expenses: results });
  });
});


app.get("/expenses", (req, res) => {
    const {page, pagesize}= req.query;
    const sql = `SELECT * FROM expenses LIMIT ${pagesize} offSet ${page}`;
    db.query(sql, (err, results) => {
      if (err) throw err;
      res.render("expense.ejs", { expenses: results });
    });
  });


  app.get("/csexpenses", (req, res) => {
    const {page, pagesize}= req.query;
    const tens = page-1;
    const from  = tens*pagesize + 1;
    const sql = `SELECT * FROM expenses LIMIT ${pagesize} offSet ${from}`;
    db.query(sql, (err, results) => {
      if (err) throw err;
      res.send({ expenses: results });
    });
  });

  app.get("/totalExpenses", (req, res) => {
    const sql = `SELECT COUNT(*) as count FROM expenses`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
            const count = results[0].count;
            return res.status(200).json({ count });
        } else {
            return res.status(404).send('No data found');
        }
    });
});



// Route to add a new expense
app.post("/add-expense", (req, res) => {
  const { date, category, description, amount } = req.body;
  const sql =
    "INSERT INTO expenses (date, category, description, amount) VALUES (?, ?, ?, ?)";
  db.query(sql, [date, category, description, amount], (err, result) => {
    if (err) throw err;
    res.redirect("/");
  });
});

// Route to delete an expense
app.delete("/delete-expense/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM expenses WHERE id = ?";
  
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting expense:', err);
        return res.status(500).json({ error: 'Failed to delete expense' });
      }
  
      // Check if any rows were affected
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }
  
      res.status(200).json({ message: 'Expense deleted successfully' });
    });
  });
  



app.get("/income", (req, res) => {
  db.query("SELECT * FROM incomes", (err, results) => {
    if (err) throw err;

    const totalIncome = results.reduce(
      (sum, income) => sum + parseFloat(income.salaryAmount),
      0
    );

    res.render("income.ejs", { incomes: results, totalIncome: totalIncome });
  });
});

// Add new income to the database
app.post("/add-income", (req, res) => {
  const { salaryType, salaryAmount, salaryDate, description } = req.body;
  const sql =
    "INSERT INTO incomes (salaryType, salaryAmount, salaryDate, description) VALUES (?, ?, ?, ?)";
  db.query(
    sql,
    [salaryType, salaryAmount, salaryDate, description],
    (err, result) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
});

// Delete an income from the database
app.post("/delete-income/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM incomes WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.redirect("/income");
  });
});

//DASHBOARD DYNAMIC CONTENT

app.get("/api/expenses-totals", (req, res) => {
  // console.log("api request received .....")

  const dailyQuery =
    "SELECT SUM(amount) AS totalDailyExpenses FROM expenses WHERE date = CURDATE()";
  const weeklyQuery =
    "SELECT SUM(amount) AS totalWeeklyExpenses FROM expenses WHERE YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)";
  const monthlyQuery =
    "SELECT SUM(amount) AS totalMonthlyExpenses FROM expenses WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())";
  const totalIncomeQuery = "SELECT SUM(salaryAmount) AS totalIncome FROM incomes";

  db.query(dailyQuery, (err, dailyResult) => {
    if (err) throw err;

    db.query(weeklyQuery, (err, weeklyResult) => {
      if (err) throw err;

      db.query(monthlyQuery, (err, monthlyResult) => {
        if (err) throw err;

        db.query(totalIncomeQuery, (err, incomeResult) => {
          if (err) throw err;
          // Return totals as JSON
          res.json({
            totalDailyExpenses: dailyResult[0].totalDailyExpenses || 0,
            totalWeeklyExpenses: weeklyResult[0].totalWeeklyExpenses || 0,
            totalMonthlyExpenses: monthlyResult[0].totalMonthlyExpenses || 0,
            totalIncome: incomeResult[0].totalIncome || 0,
          });
        });
      });
    });
  });
});



app.get("/category-expenses", (req, res) => {
  db.query(
    "SELECT category, SUM(amount) AS totalAmount FROM expenses GROUP BY category",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/monthly-expenses-growth", (req, res) => {
  db.query(
    `
        SELECT 
            MONTH(date) AS month, 
            SUM(amount) AS totalAmount 
        FROM expenses 
        GROUP BY YEAR(date), MONTH(date)
        ORDER BY YEAR(date), MONTH(date)
    `,
    (err, results) => {
      if (err) throw err;

      // Calculate month-over-month growth
      const data = results.map((row, index) => {
        const previousMonthAmount =
          index > 0 ? results[index - 1].totalAmount : 0;
        const growth =
          previousMonthAmount > 0
            ? ((row.totalAmount - previousMonthAmount) / previousMonthAmount) *
              100
            : 0;

        return {
          month: row.month,
          growth: growth,
        };
      });

      res.json(data);
    }
  );
});

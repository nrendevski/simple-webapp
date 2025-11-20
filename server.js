const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const PDFDocument = require("pdfkit");
const fs = require("fs");

const app = express();
const db = new sqlite3.Database("users.db");

app.use(bodyParser.urlencoded({ extended: true }));

// -------------------------------------------------------------
// HOME PAGE (ADD + LIST USERS)
// -------------------------------------------------------------
app.get("/", (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) throw err;

        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>User Management</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f0f2f5;
            padding: 40px;
            display: flex;
            justify-content: center;
        }

        .container {
            background: #fff;
            padding: 30px;
            width: 850px;
            border-radius: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        h1, h2 {
            text-align: center;
            color: #333;
        }

        form {
            margin-bottom: 20px;
            display: flex;
            justify-content: center;
            gap: 10px;
        }

        input {
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            width: 220px;
        }

        button {
            padding: 10px 20px;
            background: #0066ff;
            border: none;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }

        button:hover {
            background: #004ecc;
        }

        .pdf-btn {
            display: inline-block;
            padding: 8px 15px;
            background: #28a745;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            margin-bottom: 20px;
        }

        .pdf-btn:hover {
            background: #1d7e34;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th {
            background: #0066ff;
            color: white;
            padding: 12px;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }

        .action-btn {
            padding: 6px 12px;
            border-radius: 5px;
            text-decoration: none;
            font-size: 13px;
            color: white;
            margin-right: 8px;
        }

        .edit { background: #ffc107; }
        .edit:hover { background: #d39e00; }

        .delete { background: #dc3545; }
        .delete:hover { background: #b52a37; }
    </style>
</head>
<body>
<div class="container">

    <h1>User Management</h1>

    <h2>Add User</h2>
    <form method="POST" action="/add">
        <input name="name" placeholder="Name" required>
        <input name="email" placeholder="Email" required>
        <button type="submit">Add</button>
    </form>

    <a href="/export-pdf" class="pdf-btn">Export to PDF</a>

    <h2>User List</h2>

    <table>
        <tr>
            <th>ID</th><th>Name</th><th>Email</th><th>Actions</th>
        </tr>
`;

        rows.forEach(u => {
            html += `
        <tr>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>
                <a class="action-btn edit" href="/edit/${u.id}">Edit</a>
                <a class="action-btn delete" href="/delete/${u.id}">Delete</a>
            </td>
        </tr>
`;
        });

        html += `
    </table>

</div>
</body>
</html>
`;

        res.send(html);
    });
});


// -------------------------------------------------------------
// ADD USER
// -------------------------------------------------------------
app.post("/add", (req, res) => {
    const { name, email } = req.body;
    db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email], () => {
        res.redirect("/");
    });
});


// -------------------------------------------------------------
// DELETE USER
// -------------------------------------------------------------
app.get("/delete/:id", (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], () => {
        res.redirect("/");
    });
});


// -------------------------------------------------------------
// EDIT USER PAGE (STYLED)
// -------------------------------------------------------------
app.get("/edit/:id", (req, res) => {
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, user) => {
        if (err) throw err;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Edit User</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #eef1f5;
            display: flex;
            justify-content: center;
            padding-top: 60px;
        }

        .card {
            background: #fff;
            padding: 30px;
            width: 400px;
            border-radius: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        h1 {
            text-align: center;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        input {
            padding: 12px;
            border: 1px solid #bbb;
            border-radius: 6px;
        }

        button {
            padding: 12px;
            background: #007bff;
            border: none;
            color: white;
            border-radius: 6px;
            font-size: 16px;
        }

        button:hover {
            background: #005fcc;
        }

        a {
            display: inline-block;
            margin-top: 15px;
            text-align: center;
            color: #333;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Edit User</h1>

        <form method="POST" action="/edit/${user.id}">
            <input name="name" value="${user.name}" required>
            <input name="email" value="${user.email}" required>
            <button type="submit">Save</button>
        </form>

        <a href="/">← Back to list</a>
    </div>
</body>
</html>
`;

        res.send(html);
    });
});


// -------------------------------------------------------------
// EDIT USER (SAVE)
// -------------------------------------------------------------
app.post("/edit/:id", (req, res) => {
    const { name, email } = req.body;

    db.run(
        "UPDATE users SET name = ?, email = ? WHERE id = ?",
        [name, email, req.params.id],
        () => res.redirect("/")
    );
});


// -------------------------------------------------------------
// API ROUTE: 2^n
// -------------------------------------------------------------
app.get("/api/power/:num", (req, res) => {
    const n = Number(req.params.num);

    if (isNaN(n)) {
        return res.status(400).json({ error: "Input must be a number" });
    }

    res.json({
        input: n,
        result: Math.pow(2, n)
    });
});


// -------------------------------------------------------------
// EXPORT PDF
// -------------------------------------------------------------
// PDF download (prompts Save As)
app.get('/export-pdf', (req, res) => {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    // Collect PDF in memory
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);

        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=users.pdf",
            "Content-Length": pdfData.length
        });

        res.end(pdfData);
    });

    // PDF content
    doc.fontSize(22).text("User List", { underline: true });
    doc.moveDown();

    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            doc.fontSize(14).text("Error loading users.");
            return doc.end();
        }

        rows.forEach(user => {
            doc.fontSize(14).text(`ID: ${user.id} | Name: ${user.name} | Email: ${user.email}`);
        });

        doc.end(); // finalize PDF
    });
});





// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------
app.listen(3000, () => console.log("Running at http://localhost:3000"));

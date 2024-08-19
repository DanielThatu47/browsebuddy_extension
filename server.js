const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let submittedScores = {}; // In-memory storage for simplicity; use a database in production

// Endpoint to submit a new score
app.post('/api/submit', (req, res) => {
    const { url, score, user } = req.body;
    if (!url || !score || !user) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    submittedScores[url] = { score, user, approved: false };
    res.json({ message: 'Score submitted successfully' });
});

// Endpoint for admin to approve scores
app.post('/api/approve', (req, res) => {
    const { url } = req.body;
    if (submittedScores[url]) {
        submittedScores[url].approved = true;
        res.json({ message: 'Score approved successfully' });
    } else {
        res.status(404).json({ message: 'Score not found' });
    }
});

// Endpoint to fetch all scores
app.get('/api/scores', (req, res) => {
    res.json(submittedScores);
});

// Serve the welcome page directly
app.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to the Extension Backend</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .container {
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                text-align: center;
                max-width: 500px;
                width: 100%;
            }
            h1 {
                color: #333;
            }
            p {
                color: #555;
            }
            ul {
                list-style-type: none;
                padding: 0;
            }
            ul li {
                background: #f7f7f7;
                margin: 5px 0;
                padding: 10px;
                border-radius: 5px;
                border: 1px solid #ddd;
            }
            code {
                font-weight: bold;
                color: #c7254e;
                background-color: #f9f2f4;
                padding: 2px 4px;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to the Extension Backend</h1>
            <p>This is the backend server for the extension. Use the provided API endpoints to interact with the server.</p>
            <p>API Endpoints:</p>
            <ul>
                <li><code>POST /api/submit</code> - Submit a new score.</li>
                <li><code>POST /api/approve</code> - Approve a submitted score (admin only).</li>
                <li><code>GET /api/scores</code> - Fetch all submitted scores.</li>
            </ul>
        </div>
    </body>
    </html>`;
    res.send(htmlContent);
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
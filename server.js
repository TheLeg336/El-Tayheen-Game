const express = require('express');
const path = require('path');
const fs = require('fs'); // For reading/writing data.json
const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port (important for Render)

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to read data.json
app.get('/api/data', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8'));
        res.json(data); // Send the data as a JSON response
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data.json' });
    }
});

// API endpoint to write to data.json
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body; // Data sent from the frontend
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(newData, null, 2)); // Write to data.json
        res.json({ message: 'Data updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to write data.json' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

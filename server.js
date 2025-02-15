const express = require('express');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDBDPjNAuc8ScJ2oqH4sISXQ1jZEdUnxTc",
  authDomain: "compassapp11.firebaseapp.com",
  projectId: "compassapp11",
  storageBucket: "compassapp11.firebasestorage.app",
  messagingSenderId: "223152942317",
  appId: "1:223152942317:web:37cbeadf1fb4b34ad130e4"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Middleware to parse JSON
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to read data from Firestore
app.get('/api/data', async (req, res) => {
    try {
        const docRef = doc(db, "gameData", "tasks");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            res.json(docSnap.data());
        } else {
            res.json({ tasks: [], points: { troop1: 0, troop2: 0 } });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// API endpoint to write data to Firestore
app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body;
        await setDoc(doc(db, "gameData", "tasks"), newData);
        res.json({ message: 'Data updated successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to write data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

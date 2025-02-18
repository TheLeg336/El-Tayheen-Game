// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Initialize Firebase with your configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBDPjNAuc8ScJ2oqH4sISXQ1jZEdUnxTc",
  authDomain: "compassapp11.firebaseapp.com",
  projectId: "compassapp11",
  storageBucket: "compassapp11.firebasestorage.app",
  messagingSenderId: "223152942317",
  appId: "1:223152942317:web:"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Reference to the Firestore document
const gameDataRef = doc(db, "gameData", "tasks");

// Test Firestore Connection
const testFirestoreConnection = async () => {
    try {
        const testRef = doc(db, "test", "connection");
        await setDoc(testRef, { message: "Firebase connection successful!" });
        console.log("Firestore connection successful!");
    } catch (error) {
        console.error("Firestore connection error:", error);
    }
};
testFirestoreConnection();

// Global Variables
let playerCoordinates = null; // Current user location
let taskCoordinates = null; // Target coordinates
let currentHeading = 0; // Device's current heading (from gyroscope)
let targetBearing = 0; // Bearing to the target coordinates
let timerInterval = null;

// Function to handle navigation between pages
function navigateTo(pageId) {
    console.log(`Navigating to: ${pageId}`);
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    } else {
        console.error(`Page with ID "${pageId}" not found.`);
    }

    // Handle specific page logic
    if (pageId === 'leader-page') {
        initializeLeaderPage();
    } else if (pageId === 'player-page') {
        initializePlayerPage();
    } else if (pageId === 'create-task-page') {
        updateCreateTaskButtons();
    } else if (pageId === 'view-current-task-page') {
        initializeViewCurrentTaskPage();
    } else if (pageId === 'points-page') {
        initializePointsPage();
    }
}

// Leader Page Logic
function initializeLeaderPage() {
    const leaderContent = document.getElementById('leader-content');
    leaderContent.style.display = 'block';
}

// Save Leader Password
function savePassword() {
    const newPassword = document.getElementById('new-password').value;
    if (newPassword.trim()) {
        saveDataToFirestore({ leaderPassword: newPassword });
        alert('Password saved successfully!');
        initializeLeaderPage(); // Reinitialize the leader page
    } else {
        alert('Password cannot be empty!');
    }
}

// Validate Leader Password
function validatePassword() {
    const enteredPassword = document.getElementById('existing-password').value;
    // Fetch the leader password from Firestore
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const savedPassword = data.leaderPassword;
            if (enteredPassword === savedPassword) {
                // Password correct, show leader content
                document.getElementById('password-setup').style.display = 'none';
                document.getElementById('password-input').style.display = 'none';
                document.getElementById('leader-content').style.display = 'block';
            } else {
                alert('Incorrect password. Please try again.');
            }
        }
    });
}

// Player Page Logic
function initializePlayerPage() {
    const troopSelection = document.getElementById('troop-selection');
    const troopSetup = document.getElementById('troop-setup');
    const troopLogin = document.getElementById('troop-login');
    const troopContent = document.getElementById('troop-content');

    // Reset visibility
    troopSelection.style.display = 'block';
    troopSetup.style.display = 'none';
    troopLogin.style.display = 'none';
    troopContent.style.display = 'none';

    // Clear any previously selected troop
    localStorage.removeItem('selectedTroop');

    // Fetch troop names from Firestore
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const troop1Name = data.troop1Name || 'Troop 1';
            const troop2Name = data.troop2Name || 'Troop 2';
            document.querySelector('#troop-selection button:nth-child(1)').textContent = troop1Name;
            document.querySelector('#troop-selection button:nth-child(2)').textContent = troop2Name;
        }
    });
}

// Select Troop
function selectTroop(troopKey) {
    localStorage.setItem('selectedTroop', troopKey);
    // Fetch troop data from Firestore
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const troopPassword = data[`${troopKey}Password`];
            if (troopPassword) {
                // Troop already has a password, show login
                document.getElementById('troop-selection').style.display = 'none';
                document.getElementById('troop-login').style.display = 'block';
            } else {
                // Troop does not have a password, show setup
                document.getElementById('troop-selection').style.display = 'none';
                document.getElementById('troop-setup').style.display = 'block';
            }
        }
    });
}

// Save Troop Name and Password
function saveTroop() {
    const troopKey = localStorage.getItem('selectedTroop');
    const troopName = document.getElementById('troop-name').value;
    const troopPassword = document.getElementById('troop-password').value;
    if (troopName.trim() && troopPassword.trim()) {
        saveDataToFirestore({
            [`${troopKey}Name`]: troopName,
            [`${troopKey}Password`]: troopPassword
        });
        alert('Troop saved successfully!');
        initializePlayerPage(); // Reinitialize the player page
    } else {
        alert('Both troop name and password are required!');
    }
}

// Validate Troop Password
function validateTroopPassword() {
    const troopKey = localStorage.getItem('selectedTroop');
    const enteredPassword = document.getElementById('troop-login-password').value;
    // Fetch troop data from Firestore
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const troopPassword = data[`${troopKey}Password`];
            const troopName = data[`${troopKey}Name`];
            if (enteredPassword === troopPassword) {
                // Password correct, show troop content
                document.getElementById('troop-display-name').textContent = `Welcome to ${troopName}`;
                document.getElementById('troop-login').style.display = 'none';
                document.getElementById('troop-content').style.display = 'block';

                // Load active task for the troop
                const activeTask = data[`active-${troopKey}-task`];
                if (activeTask) {
                    taskCoordinates = {
                        latitude: parseFloat(activeTask.latitude),
                        longitude: parseFloat(activeTask.longitude)
                    };
                    // Display task details and start timer
                    document.getElementById('task-description-player').textContent = activeTask.taskDescription;
                    document.getElementById('submission-details-player').textContent = activeTask.submissionDetails;
                    // Start timer
                    startTimer(parseInt(activeTask.time));
                    // Fetch player location and activate compass
                    fetchPlayerLocation();
                }
            } else {
                alert('Incorrect password. Please try again.');
            }
        }
    });
}

// Update Create Task Buttons
function updateCreateTaskButtons() {
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const troop1Name = data.troop1Name || 'Troop 1';
            const troop2Name = data.troop2Name || 'Troop 2';
            document.getElementById('troop1-task-button').textContent = troop1Name;
            document.getElementById('troop2-task-button').textContent = troop2Name;
        }
    });
}

// Extract Coordinates Using Geolocation
function extractCoordinates(troopKey) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude.toFixed(6);
                const longitude = position.coords.longitude.toFixed(6);
                // Populate the input fields based on troopKey
                if (troopKey === 'troop1') {
                    document.getElementById('latitude-troop1').value = latitude;
                    document.getElementById('longitude-troop1').value = longitude;
                } else if (troopKey === 'troop2') {
                    document.getElementById('latitude-troop2').value = latitude;
                    document.getElementById('longitude-troop2').value = longitude;
                }
                alert(`Coordinates extracted for ${troopKey}: Latitude ${latitude}, Longitude ${longitude}`);
            },
            (error) => {
                alert('Error extracting coordinates: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Save Task
function saveTask(troopKey) {
    // Get form values
    const taskDescription = document.getElementById('task-description').value;
    const submissionDetails = document.getElementById('submission-details').value;
    const time = document.getElementById('time').value;
    const rewardDetails = document.getElementById('reward-details').value;
    const latitude = document.getElementById(`latitude-${troopKey}`).value;
    const longitude = document.getElementById(`longitude-${troopKey}`).value;

    // Validate inputs
    if (!taskDescription || !submissionDetails || !time || !rewardDetails || !latitude || !longitude) {
        alert('All fields are required!');
        return;
    }

    // Save task details to Firestore
    const taskData = {
        taskDescription,
        submissionDetails,
        time,
        rewardDetails,
        latitude,
        longitude
    };
    saveDataToFirestore({ [`${troopKey}-task`]: taskData });
    alert(`Task saved for ${troopKey}`);
    // Navigate to the next troop's task page or show "Send Tasks" button
    if (troopKey === 'troop1' && !document.getElementById('troop2-task')) {
        navigateTo('troop2-task-page');
    } else if (troopKey === 'troop2' && !document.getElementById('troop1-task')) {
        navigateTo('troop1-task-page');
    } else {
        // Both tasks are created, show "Send Tasks" button
        const createTaskPage = document.getElementById('create-task-page');
        const sendTasksButton = document.createElement('button');
        sendTasksButton.textContent = 'Send Tasks';
        sendTasksButton.onclick = () => sendTasks();
        createTaskPage.appendChild(sendTasksButton);
        navigateTo('create-task-page');
    }
}

// Send Tasks Button Logic
function sendTasks() {
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const troop1Task = data['troop1-task'];
            const troop2Task = data['troop2-task'];
            if (!troop1Task || !troop2Task) {
                alert('Tasks must be created for both troops before sending.');
                return;
            }
            // Assign tasks to troops in Firestore
            saveDataToFirestore({
                'active-troop1-task': troop1Task,
                'active-troop2-task': troop2Task
            });
            alert('Tasks sent successfully! Players can now access their tasks.');
            navigateTo('leader-page');
        }
    });
}

// View Current Task Page Logic
function initializeViewCurrentTaskPage() {
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const troop1Task = data['active-troop1-task'];
            const troop2Task = data['active-troop2-task'];
            if (troop1Task) {
                document.getElementById('troop1-task-description').textContent = troop1Task.taskDescription;
            } else {
                document.getElementById('troop1-task-description').textContent = 'No active task.';
            }
            if (troop2Task) {
                document.getElementById('troop2-task-description').textContent = troop2Task.taskDescription;
            } else {
                document.getElementById('troop2-task-description').textContent = 'No active task.';
            }
        }
    });
}

// Declare Winner and Update Points
function declareWinner(winningTroop) {
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            let winningTroopPoints = data.points?.[winningTroop] || 0;
            winningTroopPoints += 1; // Increment points for the winning troop
            // Update points in Firestore
            saveDataToFirestore({ [`points.${winningTroop}`]: winningTroopPoints });
            alert(`${winningTroop.toUpperCase()} has been declared the winner!`);
            navigateTo('leader-page');
        }
    });
}

// Points Page Logic
function initializePointsPage() {
    onSnapshot(gameDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const troop1Points = data.points?.troop1 || 0;
            const troop2Points = data.points?.troop2 || 0;
            document.getElementById('troop1-points').textContent = troop1Points;
            document.getElementById('troop2-points').textContent = troop2Points;
        }
    });
}

// Gyroscope-based Compass Logic
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
        if (event.alpha !== null) {
            currentHeading = event.alpha; // Alpha ranges from 0 to 360 degrees
            updateCompassNeedleWithGyro();
        }
    });
} else {
    alert('Device orientation is not supported by this browser.');
}

// Function to calculate bearing to target coordinates
function calculateBearing(playerLat, playerLon, targetLat, targetLon) {
    const φ1 = playerLat * Math.PI / 180; // Convert latitude to radians
    const φ2 = targetLat * Math.PI / 180;
    const Δλ = (targetLon - playerLon) * Math.PI / 180; // Difference in longitude
    // Calculate bearing using spherical trigonometry
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    let bearing = Math.atan2(y, x) * (180 / Math.PI); // Convert to degrees
    // Normalize bearing to range [0, 360)
    bearing = (bearing + 360) % 360;
    return bearing;
}

// Update Compass Needle with Gyroscope Data
function updateCompassNeedleWithGyro() {
    if (playerCoordinates && taskCoordinates) {
        // Calculate the bearing to the target coordinates
        targetBearing = calculateBearing(
            playerCoordinates.latitude,
            playerCoordinates.longitude,
            taskCoordinates.latitude,
            taskCoordinates.longitude
        );
        // Calculate the relative angle between the device's heading and the target bearing
        let relativeAngle = targetBearing - currentHeading;
        // Normalize the angle to range [-180, 180]
        if (relativeAngle > 180) relativeAngle -= 360;
        if (relativeAngle < -180) relativeAngle += 360;
        // Rotate the compass needle
        document.querySelector('.compass-needle').style.transform = `translate(-50%, -100%) rotate(${relativeAngle}deg)`;
    }
}

// Fetch Player Location
function fetchPlayerLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                playerCoordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                // Update compass and check proximity
                if (taskCoordinates) {
                    updateCompassNeedleWithGyro(); // Update needle with gyroscope data
                    checkProximity();
                }
            },
            (error) => {
                alert('Error fetching location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Calculate Distance Between Two Coordinates (Haversine Formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Convert to meters
    return distance;
}

// Check Proximity and Reveal Task Details
function checkProximity() {
    if (playerCoordinates && taskCoordinates) {
        const distance = calculateDistance(
            playerCoordinates.latitude,
            playerCoordinates.longitude,
            taskCoordinates.latitude,
            taskCoordinates.longitude
        );
        if (distance <= 20) { // 20 feet (converted to meters)
            document.getElementById('task-details').style.display = 'block';
            clearInterval(timerInterval); // Stop the timer when the task is revealed
        } else {
            document.getElementById('task-details').style.display = 'none';
        }
    }
}

// Start Timer
function startTimer(durationMinutes) {
    let timeLeft = durationMinutes * 60; // Convert minutes to seconds
    const timerElement = document.getElementById('timer');
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            timerElement.textContent = '00:00';
            alert('Time is up!');
        }
    }, 1000);
}

// Reset Game
function resetGame() {
    const resetPassword = prompt('Enter the reset password:');
    if (resetPassword === '2055108') {
        // Clear all stored data in Firestore
        saveDataToFirestore({
            'troop1-points': 0,
            'troop2-points': 0,
            'troop1-task': null,
            'troop2-task': null,
            'active-troop1-task': null,
            'active-troop2-task': null
        });
        alert('Game reset successfully! All data has been cleared.');
        navigateTo('main-page');
    } else {
        alert('Incorrect reset password. Access denied.');
    }
}

// Save Data to Firestore
async function saveDataToFirestore(newData) {
    try {
        await setDoc(gameDataRef, newData, { merge: true });
        console.log("Data saved to Firestore successfully!");
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        alert("Failed to save data. Please try again later.");
    }
}

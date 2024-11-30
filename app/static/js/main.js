import { ActivityManager } from './activities.js';
import { MapManager } from './map.js';
import { debounce } from './utils.js';

// Initialize managers
const mapManager = new MapManager();
const activityManager = new ActivityManager(mapManager);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const rawData = document.getElementById('strava-data').textContent;
    console.log('Raw Strava data:', rawData);  // Debug

    try {
        const activities = JSON.parse(rawData);
        console.log('Parsed activities:', activities);  // Debug

        const activityManager = new ActivityManager();
        activityManager.init();
    } catch (e) {
        console.error('Error initializing:', e);  // Debug
    }
});

// Handle window resize
window.addEventListener('resize', debounce(() => {
    mapManager.map.resize();
}, 250));
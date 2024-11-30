import { ActivityManager } from './activities.js';
import { MapManager } from './map.js';
import { debounce } from './utils.js';

// Initialize managers
const mapManager = new MapManager();
const activityManager = new ActivityManager(mapManager);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    activityManager.init();
});

// Handle window resize
window.addEventListener('resize', debounce(() => {
    mapManager.map.resize();
}, 250));
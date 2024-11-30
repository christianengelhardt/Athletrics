// Utility functions for the Strava dashboard
export const formatters = {
    /**
     * Format pace from speed (m/s)
     */
    formatPace(speed) {
        const paceInMinutesPerKm = 60 / (speed * 3.6);
        const minutes = Math.floor(paceInMinutesPerKm);
        const seconds = Math.round((paceInMinutesPerKm - minutes) * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
    },

    /**
     * Format distance in meters to km
     */
    formatDistance(meters) {
        const km = meters / 1000;
        return km >= 10 ? km.toFixed(1) : km.toFixed(2);
    },

    /**
     * Format duration from seconds
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
};

/**
 * Activity type colors
 */
export const sportTypeColors = {
    'Run': '#fc5e02',
    'Ride': '#ce2323',
    'Swim': '#00FF00',
    'Hike': '#ffb700',
    'Walk': '#FFD700',
    'AlpineSki': '#FF00FF',
    'NordicSki': '#FF69B4',
    'Workout': '#00FF7F',
    'WeightTraining': '#FF1493',
    'Yoga': '#40E0D0'
};

export function getColorForSportType(sportType) {
    return sportTypeColors[sportType] || '#B0BEC5';
}

/**
 * Decode polyline to coordinates array
 */
export function decodePolyline(encoded) {
    const points = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        points.push([lng * 1e-5, lat * 1e-5]);
    }

    return points;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
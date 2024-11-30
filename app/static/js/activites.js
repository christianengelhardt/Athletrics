import { formatters, getColorForSportType } from './utils.js';

export class ActivityManager {
    constructor(mapManager) {
        this.activities = JSON.parse(document.getElementById('strava-data').textContent || '[]');
        this.selectedActivityId = null;
        this.mapManager = mapManager;
        this.chartManager = new ChartManager();  // Add this line
    }
    init() {
        // Initialize map with activities
        this.mapManager.setActivities(this.activities);
        this.mapManager.onRouteClick = (activityId) => this.selectActivity(activityId);

        // Initialize activity list
        this.updateActivityList();

        // Select first activity if exists
        if (this.activities.length > 0) {
            this.selectActivity(this.activities[0].id);
        }
    }

    updateActivityList() {
        const listContainer = document.getElementById('activity-list');
        const content = listContainer.querySelector('.tile-content');

        content.innerHTML = this.activities.map(activity => `
            <div class="activity-item" data-activity-id="${activity.id}">
                <div class="activity-item-date">
                    ${new Date(activity.start_date).toLocaleDateString('de-DE', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })}
                </div>
                <div class="activity-item-header">
                    <span class="activity-item-type" style="background-color: ${getColorForSportType(activity.sport_type)}">
                        ${activity.sport_type}
                    </span>
                    <span class="activity-item-title">${activity.name}</span>
                </div>
                <div class="activity-item-stats">
                    <span class="activity-item-stat">
                        <span class="activity-item-stat-value">${formatters.formatDistance(activity.distance)}</span>
                        <span>km</span>
                    </span>
                    <span class="activity-item-stat">
                        <span class="activity-item-stat-value">${formatters.formatDuration(activity.elapsed_time)}</span>
                    </span>
                    <span class="activity-item-stat">
                        <span class="activity-item-stat-value">${activity.total_elevation_gain}</span>
                        <span>m</span>
                    </span>
                </div>
            </div>
        `).join('');

        // Add click handlers
        content.querySelectorAll('.activity-item').forEach(item => {
            item.addEventListener('click', () => {
                const activityId = parseInt(item.dataset.activityId);
                this.selectActivity(activityId);
            });
        });
    }

    selectActivity(activityId) {
        const activity = this.activities.find(a => a.id === activityId);
        if (!activity) return;

        this.selectedActivityId = activityId;

        // Update UI
        this.updateActivityDetails(activity);
        this.highlightSelectedActivity(activityId);
        this.mapManager.focusOnActivity(activity);

        // Load activity streams if needed
        this.loadActivityStreams(activityId);
    }

    updateActivityDetails(activity) {
        const detailsContainer = document.getElementById('activity-details');
        const content = detailsContainer.querySelector('.tile-content');

        content.innerHTML = `
            <div class="activity-header">
                <h2>${activity.name}</h2>
                <div class="activity-badges">
                    <span class="activity-type" style="background-color: ${getColorForSportType(activity.sport_type)}">
                        ${activity.sport_type}
                    </span>
                    ${this.activities.indexOf(activity) === 0 ? `
                        <div class="latest-activity-info">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v8m0-8h.01"/>
                            </svg>
                            Latest activity
                        </div>
                    ` : ''}
                </div>
                <div class="date-info">${new Date(activity.start_date).toLocaleString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
            </div>
            <div class="activity-stats">
                <div class="stat-item">
                    <div class="stat-label">Distance</div>
                    <div class="stat-value">${formatters.formatDistance(activity.distance)} km</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Duration</div>
                    <div class="stat-value">${formatters.formatDuration(activity.elapsed_time)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Elevation Gain</div>
                    <div class="stat-value">${activity.total_elevation_gain}m</div>
                </div>
                ${activity.average_speed ? `
                    <div class="stat-item">
                        <div class="stat-label">${activity.sport_type === 'Run' ? 'Pace' : 'Average Speed'}</div>
                        <div class="stat-value">${activity.sport_type === 'Run' ?
                    formatters.formatPace(activity.average_speed) :
                    (activity.average_speed * 3.6).toFixed(1) + ' km/h'}</div>
                    </div>
                ` : ''}
                ${activity.average_heartrate ? `
                    <div class="stat-item">
                        <div class="stat-label">Average Heart Rate</div>
                        <div class="stat-value">${Math.round(activity.average_heartrate)} bpm</div>
                    </div>
                ` : ''}
                ${activity.max_heartrate ? `
                    <div class="stat-item">
                        <div class="stat-label">Max Heart Rate</div>
                        <div class="stat-value">${Math.round(activity.max_heartrate)} bpm</div>
                    </div>
                ` : ''}
                ${activity.average_cadence ? `
                    <div class="stat-item">
                        <div class="stat-label">Average Cadence</div>
                        <div class="stat-value">${Math.round(activity.average_cadence)} rpm</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    highlightSelectedActivity(activityId) {
        document.querySelectorAll('.activity-item').forEach(item => {
            const isSelected = parseInt(item.dataset.activityId) === activityId;
            item.classList.toggle('activity-item-selected', isSelected);
        });
    }

    async loadActivityStreams(activityId) {
        try {
            const response = await fetch(`/api/activity_streams/${activityId}`);
            if (!response.ok) throw new Error('Failed to load activity data');
            const streams = await response.json();

            // Update activity with streams
            const activity = this.activities.find(a => a.id === activityId);
            if (activity) {
                activity.streams = streams;
                this.chartManager.updateCharts(activity);  // Add this line
            }
        } catch (error) {
            console.error('Error loading activity streams:', error);
        }
    }
}
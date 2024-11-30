import { getColorForSportType, decodePolyline } from './utils.js';

export class MapManager {
    constructor() {
        this.map = null;
        this.selectedRouteIndex = null;
        this.activities = [];
        this.initialize();
    }

    initialize() {
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2VuZ2VsaGFyZHQiLCJhIjoiY20yamlkZ3dnMDN5NjJyc2I0angzbHF3OCJ9.RTpMrPEE4FTx_b6xsTJvVA';

        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10',
            center: [0, 0],
            zoom: 2
        });

        this.map.addControl(new mapboxgl.NavigationControl());

        // Add style control
        this.addStyleControl();

        // Add maximize control
        this.addMaximizeControl();
    }

    addStyleControl() {
        const styles = {
            'Dark': 'mapbox://styles/mapbox/dark-v10',
            'Light': 'mapbox://styles/mapbox/light-v10',
            'Outdoors': 'mapbox://styles/mapbox/outdoors-v11',
            'Satellite': 'mapbox://styles/mapbox/satellite-streets-v11'
        };

        const styleControl = document.createElement('div');
        styleControl.className = 'map-style-control';

        const select = document.createElement('select');
        Object.keys(styles).forEach(style => {
            const option = document.createElement('option');
            option.value = styles[style];
            option.text = style;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            this.map.setStyle(e.target.value);
            this.map.once('style.load', () => {
                this.addRoutesToMap(this.activities);
            });
        });

        styleControl.appendChild(select);
        this.map.getContainer().appendChild(styleControl);
    }

    addMaximizeControl() {
        const button = document.createElement('button');
        button.className = 'map-maximize-button';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
        `;

        let isMaximized = false;
        button.addEventListener('click', () => {
            isMaximized = !isMaximized;
            document.querySelector('.dashboard-grid').classList.toggle('map-maximized', isMaximized);
            this.map.resize();
        });

        this.map.getContainer().appendChild(button);
    }

    setActivities(activities) {
        this.activities = activities;
        this.map.once('style.load', () => {
            this.addRoutesToMap(activities);
        });
    }

    addRoutesToMap(activities) {
        activities.forEach((activity, index) => {
            if (!activity.map?.summary_polyline) return;

            const coordinates = decodePolyline(activity.map.summary_polyline);

            // Add source
            this.map.addSource(`route-${index}`, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {
                        ...activity,
                        color: getColorForSportType(activity.sport_type)
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                }
            });

            // Add layer
            this.map.addLayer({
                id: `route-${index}`,
                type: 'line',
                source: `route-${index}`,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': getColorForSportType(activity.sport_type),
                    'line-width': 3,
                    'line-opacity': 0.8
                }
            });

            // Add hover effects
            this.addRouteInteractions(index);
        });

        // Fit bounds to show all routes
        this.fitToAllRoutes();
    }

    addRouteInteractions(index) {
        this.map.on('mouseenter', `route-${index}`, () => {
            this.map.getCanvas().style.cursor = 'pointer';
            this.highlightRoute(index);
        });

        this.map.on('mouseleave', `route-${index}`, () => {
            this.map.getCanvas().style.cursor = '';
            if (index !== this.selectedRouteIndex) {
                this.resetRoute(index);
            }
        });

        this.map.on('click', `route-${index}`, () => {
            const activity = this.activities[index];
            if (this.onRouteClick) {
                this.onRouteClick(activity.id);
            }
        });
    }

    highlightRoute(index) {
        if (this.map.getLayer(`route-${index}`)) {
            this.map.setPaintProperty(`route-${index}`, 'line-width', 5);
            this.map.setPaintProperty(`route-${index}`, 'line-opacity', 1);
        }
    }

    resetRoute(index) {
        if (this.map.getLayer(`route-${index}`)) {
            this.map.setPaintProperty(`route-${index}`, 'line-width', 3);
            this.map.setPaintProperty(`route-${index}`, 'line-opacity', 0.8);
        }
    }

    fitToAllRoutes() {
        const bounds = new mapboxgl.LngLatBounds();

        this.activities.forEach(activity => {
            if (activity.map?.summary_polyline) {
                const coordinates = decodePolyline(activity.map.summary_polyline);
                coordinates.forEach(coord => bounds.extend(coord));
            }
        });

        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds, {
                padding: 50,
                duration: 0
            });
        }
    }

    focusOnActivity(activity) {
        if (!activity.map?.summary_polyline) return;

        const coordinates = decodePolyline(activity.map.summary_polyline);
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        this.map.fitBounds(bounds, {
            padding: 50,
            duration: 1000
        });
    }
}
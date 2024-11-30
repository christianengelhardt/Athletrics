import { getColorForSportType } from './utils.js';

export class ChartManager {
    constructor() {
        this.heartRateZones = [
            { name: 'Zone 1 - Recovery', min: 0, max: 120, color: '#4ECDC4' },
            { name: 'Zone 2 - Aerobic', min: 120, max: 140, color: '#45B7D1' },
            { name: 'Zone 3 - Tempo', min: 140, max: 160, color: '#556FB5' },
            { name: 'Zone 4 - Threshold', min: 160, max: 180, color: '#9B5DE5' },
            { name: 'Zone 5 - Maximum', min: 180, max: 200, color: '#F15BB5' }
        ];
    }

    updateCharts(activity) {
        if (!activity || !activity.streams) {
            this.showNoDataMessage();
            return;
        }

        this.createScatterPlot(activity);
        this.createZoneChart(activity);
        this.createTimeDomainGraph(activity);
    }

    createScatterPlot(activity) {
        const container = d3.select('#scatter-plot');
        container.html('');

        if (!activity.streams.heartrate?.data || !activity.streams.velocity_smooth?.data) {
            this.showNoDataMessage(container, 'No heart rate or speed data available');
            return;
        }

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Prepare data
        const data = activity.streams.time.data.map((t, i) => ({
            heartrate: activity.streams.heartrate.data[i],
            speed: activity.streams.velocity_smooth.data[i] * 3.6, // Convert to km/h
            time: t
        })).filter(d => d.heartrate && d.speed);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.speed)])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(data, d => d.heartrate) - 5, d3.max(data, d => d.heartrate) + 5])
            .range([height, 0]);

        // Add heart rate zones background
        this.heartRateZones.forEach(zone => {
            svg.append('rect')
                .attr('x', 0)
                .attr('y', yScale(zone.max))
                .attr('width', width)
                .attr('height', yScale(zone.min) - yScale(zone.max))
                .attr('fill', zone.color)
                .attr('opacity', 0.1);
        });

        // Add points
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.speed))
            .attr('cy', d => yScale(d.heartrate))
            .attr('r', 3)
            .attr('fill', getColorForSportType(activity.sport_type))
            .attr('opacity', 0.6);

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'middle')
            .text('Speed (km/h)');

        svg.append('g')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -height / 2)
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'middle')
            .text('Heart Rate (bpm)');

        // Add hover interaction
        const tooltip = container.append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mousemove', (event) => {
                const [x, y] = d3.pointer(event);
                const xValue = xScale.invert(x);
                const yValue = yScale.invert(y);

                const closest = data.reduce((prev, curr) => {
                    const prevDist = Math.hypot(xScale(prev.speed) - x, yScale(prev.heartrate) - y);
                    const currDist = Math.hypot(xScale(curr.speed) - x, yScale(curr.heartrate) - y);
                    return currDist < prevDist ? curr : prev;
                });

                tooltip.style('opacity', 1)
                    .html(`Speed: ${closest.speed.toFixed(1)} km/h<br>Heart Rate: ${Math.round(closest.heartrate)} bpm`)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('opacity', 0);
            });
    }

    createZoneChart(activity) {
        const container = d3.select('#zone-chart');
        container.html('');

        if (!activity.streams.heartrate?.data) {
            this.showNoDataMessage(container, 'No heart rate data available');
            return;
        }

        const heartRateData = activity.streams.heartrate.data;
        const timeData = activity.streams.time.data;

        // Calculate time in each zone
        const zoneData = this.heartRateZones.map(zone => {
            const timeInZone = heartRateData.reduce((total, hr, i) => {
                if (hr >= zone.min && hr < zone.max) {
                    const timeSpent = i === 0 ? timeData[i] : timeData[i] - timeData[i - 1];
                    return total + timeSpent;
                }
                return total;
            }, 0);

            return {
                ...zone,
                timeInZone,
                percentage: 0 // Will be calculated after total is known
            };
        });

        const totalTime = zoneData.reduce((sum, zone) => sum + zone.timeInZone, 0);
        zoneData.forEach(zone => {
            zone.percentage = (zone.timeInZone / totalTime * 100).toFixed(1);
        });

        // Create donut chart
        const width = 240;
        const height = 240;
        const radius = Math.min(width, height) / 2;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        const pie = d3.pie()
            .value(d => d.timeInZone)
            .sort(null);

        const paths = svg.selectAll('path')
            .data(pie(zoneData))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        // Create zone list
        const list = container.append('div')
            .attr('class', 'zone-list');

        const items = list.selectAll('.zone-item')
            .data(zoneData)
            .enter()
            .append('div')
            .attr('class', 'zone-list-item');

        items.append('div')
            .attr('class', 'zone-color')
            .style('background-color', d => d.color);

        items.append('div')
            .attr('class', 'zone-info')
            .html(d => `
                <div class="zone-name">${d.name}</div>
                <div class="zone-range">${d.min}-${d.max} bpm</div>
                <div class="zone-percentage">${d.percentage}%</div>
            `);
    }

    createTimeDomainGraph(activity) {
        const container = d3.select('#time-domain-graph');
        container.html('');

        if (!activity.streams.heartrate?.data || !activity.streams.distance?.data) {
            this.showNoDataMessage(container, 'No heart rate or distance data available');
            return;
        }

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Prepare data
        const data = activity.streams.time.data.map((t, i) => ({
            distance: activity.streams.distance.data[i] / 1000, // Convert to km
            heartrate: activity.streams.heartrate.data[i],
            time: t
        }));

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.distance)])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => d.heartrate) - 5,
                d3.max(data, d => d.heartrate) + 5
            ])
            .range([height, 0]);

        // Add heart rate zones background
        this.heartRateZones.forEach(zone => {
            svg.append('rect')
                .attr('x', 0)
                .attr('y', yScale(zone.max))
                .attr('width', width)
                .attr('height', yScale(zone.min) - yScale(zone.max))
                .attr('fill', zone.color)
                .attr('opacity', 0.1);
        });

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.distance))
            .y(d => yScale(d.heartrate));

        // Add the line path
        svg.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', getColorForSportType(activity.sport_type))
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add axes
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'middle')
            .text('Distance (km)');

        svg.append('g')
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -40)
            .attr('x', -height / 2)
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'middle')
            .text('Heart Rate (bpm)');

        // Add hover effect
        const tooltip = container.append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        const bisect = d3.bisector(d => d.distance).left;

        const hoverLine = svg.append('line')
            .attr('class', 'hover-line')
            .attr('y1', 0)
            .attr('y2', height)
            .style('opacity', 0);

        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .on('mousemove', (event) => {
                const [x] = d3.pointer(event);
                const distance = xScale.invert(x);
                const index = bisect(data, distance);
                const d = data[index];

                if (d) {
                    hoverLine
                        .attr('x1', x)
                        .attr('x2', x)
                        .style('opacity', 1);

                    tooltip
                        .style('opacity', 1)
                        .html(`Distance: ${d.distance.toFixed(2)} km<br>Heart Rate: ${Math.round(d.heartrate)} bpm`)
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 10}px`);
                }
            })
            .on('mouseout', () => {
                hoverLine.style('opacity', 0);
                tooltip.style('opacity', 0);
            });
    }

    showNoDataMessage(container, message = 'No data available') {
        container.html('');
        container.append('div')
            .attr('class', 'no-data-message')
            .text(message);
    }
}
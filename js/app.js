// 1. Inicjalizacja Mapy
var bounds = [
    [51.90, 20.35], 
    [52.60, 21.70]  
];

var mymap = L.map('map', {
    zoomControl: true,
    maxZoom: 22,            
    minZoom: 11,            
    maxBounds: bounds,      
    maxBoundsViscosity: 1.0 
}).setView([52.2297, 21.0122], 13);

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 22,       
    maxNativeZoom: 19  
});

var satelita = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 22,
    maxNativeZoom: 19
});

osm.addTo(mymap);

// 2. Konfiguracja API
const API_KEY = 'd8e69a5f-3dbb-440b-a1ab-e969194f5591'; 
const RESOURCE_ID = 'f2e5503e-927d-4ad3-9500-4ab9e55deb59';
const WORKER_URL = 'https://withered-art-f355.adas-szczesniak.workers.dev/';

var linesToStops = {};
var stopsData = null;
var stopsLayer = null;

// --- WCZYTYWANIE PLIKÓW LOKALNYCH ---
// Zaktualizowano ścieżki do folderu "data"
Promise.all([
    fetch('data/lines_stops.json').then(r => r.json()),
    fetch('data/stops.geojson').then(r => r.json())
]).then(([lines, geo]) => {
    linesToStops = lines;
    stopsData = geo;
    console.log("Załadowano dane o przystankach i liniach.");
}).catch(err => console.error("Błąd wczytywania plików lokalnych:", err));

// 3. Warstwa dla autobusów
var busesLayer = L.markerClusterGroup({
    disableClusteringAtZoom: 16, 
    maxClusterRadius: 50 
}).addTo(mymap);

var baseLayers = { 
    "Mapa OpenStreetMap": osm,
    "Satelite map (Esri)": satelita
};
var overlays = { "Buses": busesLayer };

L.control.layers(baseLayers, overlays).addTo(mymap);

L.control.locate({
    position: 'topleft',
    strings: { title: "Show my location" }
}).addTo(mymap);

L.control.scale().addTo(mymap);

// --- LOGIKA FILTROWANIA ---
var selectedLines = new Set(); 
var lastBusData = [];          
var linesGenerated = false;   

function toggleMenu() {
    var panel = document.getElementById('filter-panel');
    panel.classList.toggle('open');
}

function toggleLineFilter(line) {
    if (selectedLines.has(line)) {
        selectedLines.delete(line);
    } else {
        selectedLines.add(line);
    }
    renderTiles();     
    drawMap(lastBusData); 
    updateStopsOnMap();
}

function clearFilters() {
    selectedLines.clear();
    renderTiles();
    drawMap(lastBusData);
    updateStopsOnMap();
}

function generateTiles(allLines) {
    if (linesGenerated) return;

    var container = document.getElementById('lines-container');
    container.innerHTML = '';
    
    allLines.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    allLines.forEach(line => {
        var btn = document.createElement('div');
        btn.className = 'line-tile';
        btn.innerText = line;
        btn.onclick = () => toggleLineFilter(line);
        btn.id = `line-btn-${line}`;
        container.appendChild(btn);
    });
    
    linesGenerated = true;
}

function renderTiles() {
    var tiles = document.querySelectorAll('.line-tile');
    tiles.forEach(tile => {
        if (selectedLines.has(tile.innerText)) {
            tile.classList.add('active');
        } else {
            tile.classList.remove('active');
        }
    });
}

var panel = document.getElementById('filter-panel');
L.DomEvent.disableClickPropagation(panel);
L.DomEvent.disableScrollPropagation(panel);

// 4. Funkcja pobierająca dane
function updateBuses() {
    console.log("Pobieram dane o autobusach...");
    
    const url = `${WORKER_URL}?resource_id=${RESOURCE_ID}&apikey=${API_KEY}&type=1`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data.result || typeof data.result === 'string') {
                console.error("Błąd API (puste lub błędne dane):", data);
                return;
            }

            lastBusData = data.result;
            const currentLines = [...new Set(data.result.map(bus => bus.Lines))];
            generateTiles(currentLines);
            drawMap(data.result);

            document.getElementById('loading-screen').style.display = 'none';
            console.log(`Pobrano ${data.result.length} pojazdów.`);
        })
        .catch(error => console.error("Błąd pobierania:", error));
}

// 5. Funkcja rysująca
function drawMap(buses) {
    busesLayer.clearLayers();
    var markersToAdd = []; 

    buses.forEach(bus => {
        var line = bus.Lines;

        if (selectedLines.size > 0 && !selectedLines.has(line)) {
            return;
        }

        var lat = parseFloat(bus.Lat);
        var lon = parseFloat(bus.Lon);
        
        var busIcon = L.divIcon({
            className: 'custom-bus-icon',
            html: `<div class="bus-marker-content">🚌${line}</div>`,
            iconSize: [52, 24],       
            iconAnchor: [26, 12]      
        });

        var marker = L.marker([lat, lon], { icon: busIcon });
        marker.bindTooltip(`<b>Linia: ${line}</b><br>Numer boczny pojazdu: ${bus.VehicleNumber}`);
        
        markersToAdd.push(marker);
    });

    busesLayer.addLayers(markersToAdd);
}

// RYSOWANIE PRZYSTANKÓW DLA WYBRANYCH LINII
function updateStopsOnMap() {
    if (stopsLayer) {
        mymap.removeLayer(stopsLayer);
        stopsLayer = null;
    }

    if (selectedLines.size === 0 || !stopsData || !linesToStops) {
        return;
    }

    const validStopIds = new Set();
    selectedLines.forEach(line => {
        if (linesToStops[line]) {
            linesToStops[line].forEach(stopId => validStopIds.add(stopId));
        }
    });

    stopsLayer = L.geoJSON(stopsData, {
        filter: function(feature) {
            return validStopIds.has(feature.properties.stop_id);
        },
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 4,          
                fillColor: "blue",  
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.6
            }).bindPopup(`<b>${feature.properties.stop_name}</b>`);
        }
    }).addTo(mymap);
}

// 6. Uruchomienie
updateBuses(); 
setInterval(updateBuses, 10000); 

mymap.attributionControl.setPrefix('Leaflet | Dane: UM Warszawa | Created by Adas Szczęśniak');
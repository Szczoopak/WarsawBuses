# 🚌 Warsaw Transit Live Tracker

W pełni responsywna, renderowana w czasie rzeczywistym mapa pozycji warszawskich autobusów. Projekt rozwiązuje problem limitów zapytań API za pomocą autorskiego proxy w chmurze (Cloudflare Workers) i optymalizuje renderowanie tysięcy obiektów na mapie.

**🌐 Zobacz aplikację na żywo:** [https://szczoopak.github.io/WarsawBuses/](https://szczoopak.github.io/WarsawBuses/)

![Wersja](https://img.shields.io/badge/wersja-1.0.0-blue)
![Technologia](https://img.shields.io/badge/tech-Vanilla_JS_%7C_Leaflet-yellow)
![Dane](https://img.shields.io/badge/API-UM_Warszawa-red)

## 🌟 Główne funkcje
* **Live Tracking:** Pozycje autobusów aktualizowane na bieżąco (co 10 sekund).
* **Klasteryzacja Danych:** Płynne działanie na mapie dzięki użyciu `MarkerCluster` (nawet przy tysiącach aktywnych węzłów).
* **Filtrowanie Linii:** Błyskawiczny panel pozwalający na izolację konkretnych linii na mapie.
* **Integracja z Przystankami:** Nałożenie siatki przystanków z WTP na podstawie GeoJSON.
* **Bypass CORS / Rate Limits:** Dedykowany Cloudflare Worker buforujący zapytania do oficjalnego API Warszawy.

## 🛠️ Technologia
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (Zero ciężkich frameworków!)
* **Mapy:** Leaflet.js, OpenStreetMap, kafelki satelitarne Esri.
* **Backend / Proxy:** Cloudflare Workers (Edge Computing).

## 📁 Struktura Projektu

Projekt został podzielony na moduły dla zachowania czystości kodu i łatwiejszego utrzymania:

\`\`\`text
📂 WarsawBuses/
├── 📂 assets/       # Ikony i grafiki (np. favicon)
├── 📂 css/          # Arkusze stylów (style.css)
├── 📂 data/         # Statyczne dane JSON/GeoJSON (przystanki i relacje linii)
├── 📂 js/           # Główna logika aplikacji (app.js)
├── 📄 index.html    # Czysty szkielet aplikacji
└── 📄 README.md     # Dokumentacja projektu
\`\`\`

## 🚀 Jak uruchomić to lokalnie?

Z racji wykorzystania modułów i plików `.json`, projekt musi zostać uruchomiony przez lokalny serwer WWW (aby uniknąć błędów CORS przeglądarki).

1. Sklonuj repozytorium: `git clone https://github.com/szczoopak/WarsawBuses.git`
2. Uruchom lokalny serwer w głównym folderze. Możesz użyć np. Python:
   ```bash
   python -m http.server 8000
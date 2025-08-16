# Rasta — Smart Delivery Routing for Restaurants (Android & iOS)

<div align="center">

Fast, direction-aware delivery planning on Google Maps for Android & iOS.

![Flutter](https://img.shields.io/badge/Flutter-Ready-02569B?logo=flutter&logoColor=white)
![Android](https://img.shields.io/badge/Android-Supported-3DDC84?logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-Supported-000000?logo=apple&logoColor=white)
![Maps](https://img.shields.io/badge/Google%20Maps-Integrated-4285F4?logo=googlemaps&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## What is Rasta?
**Rasta** finds the fastest route to deliver restaurant orders. It starts with the **nearest order by travel time**, favors stops in the **same direction** to reduce backtracking, and enforces a **last‑delivery time cap** to keep runs tight — with an automatic **20→40 minute** exception near closing.

---

## Why you’ll like it
- ✅ Nearest stop first (by travel time, not straight‑line distance)
- 🧭 Direction bias (±35°) to cut backtracking
- ⏱ Single driver: last delivery **≤ 20 min**
- 🕔 If **≤ 30 min** to close and **only 1 driver** → cap becomes **≤ 40 min**
- 👥 Multiple drivers: splits orders to minimize total finish time (makespan)
- 🗺 Map polylines, ETAs, shareable Google Maps links + JSON

---

## Inputs → Output
**Inputs:** Restaurant address, number of drivers (≥1), order addresses, closing time  
**Output:** Best route(s) per driver with ordered stops, ETAs, totals, and shareable Google Maps links.

---

## How it works (quick)
1. **Geocode & travel times** with Google Geocoding + Distance Matrix/Directions  
2. **Build a route:** nearest‑first, then greedy by direction bonus + duration; refine with small swaps (**2‑opt**)  
3. **Multiple drivers:** cluster by bearing/distance; route each cluster and rebalance to reduce makespan

---

## Config (example)
```bash
# .env or lib/config.dart (placeholders)
GOOGLE_MAPS_API_KEY=YOUR_KEY
GOOGLE_GEOCODING_API_KEY=YOUR_KEY
GOOGLE_DISTANCE_MATRIX_API_KEY=YOUR_KEY
GOOGLE_DIRECTIONS_API_KEY=YOUR_KEY
```

## License
MIT

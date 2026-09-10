# Eagle Creek Golf Club — Stay & Play

A single-page site (HTML/CSS from the original design) now served by a small
Express.js backend, plus two API endpoints required by the assignment.

## How to run it

1. Install [Node.js](https://nodejs.org) (LTS version) if you don't have it.
   Check it worked by running `node -v` in a terminal — it should print a version number.
2. Open a terminal **inside this folder** (the one with `package.json` in it).
3. Install the one dependency (Express):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser to **http://localhost:3000**

## JavaScript Features Implemented

- Implemented the Express.js server and API endpoints for property data.
- Implemented the `/images` API endpoint to fetch property images.
- Implemented the interactive image gallery with modal, navigation, and image counter.
- Added touch swipe functionality and dynamic slider indicators for mobile and tablet views.
- Implemented the Read More and Collapse functionality for the description section.
- Implemented the Hotel Datepicker with check-in and check-out date selection.
- Implemented guest selection with a minimum of one guest.
- Implemented dynamic total price calculation based on the selected date range.
- Implemented the Nearby Properties dropdown with Most Popular, Highest Price, and Lowest Price options.
- Implemented API-based property fetching with responsive limits for desktop and mobile.
- Implemented the Favorites feature using localStorage to persist selected properties.
- Implemented interactive Google Maps markers linked to the Nearby Properties section.
- Implemented synchronization between property cards and their corresponding map markers.

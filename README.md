# Eagle Creek Golf Club — Stay & Play

A single-page site (HTML/CSS from the original design) now served by a small
Express.js backend, plus two API endpoints required by the assignment.

## What's in this folder

```
server.js       <- the whole backend (one file, read top to bottom)
package.json    <- lists "express" as a dependency, and the "start" command
data/           <- the 3 property datasets (most_popular / highest_price / lowest_price)
images/         <- 10 property images returned by GET /images
public/         <- the frontend: index.html, styles.css, and the site's own images
```

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

That's it — the same server that serves the webpage also answers the API
requests the page makes.

## API endpoints

- `GET /get-property?most-popular=true&limit=4` — returns an array of
  properties from `most_popular.json` (swap `most-popular` for `highest-price`
  or `lowest-price`; `limit` is optional).
- `GET /images` — returns `["/images/image1.jpg", ...]`, and those paths are
  themselves servable image files.

## Notes

- No Google Maps API key is committed. Add your own in a `.env` file (see
  `.gitignore`) if/when you wire up the map.
- Restarting after every code change is annoying — install
  [nodemon](https://www.npmjs.com/package/nodemon) (already listed as a dev
  dependency) and run `npm run dev` instead of `npm start` to auto-restart on
  save.

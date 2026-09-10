

// This is the entire backend for the assignment.

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// 1) GET /images  ->  JSON array of the gallery image paths
//    This route is registered FIRST, before any static file middleware.
//    Express checks routes top-to-bottom, in the order they're written.
//    If a static middleware for "/images" ran first, it would try to serve
//    a folder listing for "/images" instead of running our JSON handler
//    below - so the order here matters a lot.
//
//    Expected response shape (from the assignment):
//    ["/images/image1.jpg", "/images/image2.jpg", ...]
// ---------------------------------------------------------------------------
app.get("/images", (req, res) => {
  const imagesDir = path.join(__dirname, "images");

  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error("Could not read images folder:", err);
      return res.status(500).json({ error: "Could not read images folder" });
    }

    // Only keep actual image files, and put them in a sensible order
    // (image1.jpg, image2.jpg, ... image10.jpg) instead of alphabetical
    // order (which would put "image10" before "image2").
    const imageFiles = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
        return numA - numB;
      });

    const paths = imageFiles.map((f) => `/images/${f}`);
    res.json(paths);
  });
});

// ---------------------------------------------------------------------------
// 2) Serve the actual image files themselves, e.g. GET /images/image1.jpg
//    This has to come AFTER the app.get("/images") route above.
// ---------------------------------------------------------------------------
app.use("/images", express.static(path.join(__dirname, "images")));

// ---------------------------------------------------------------------------
// 3) GET /get-property  ->  the property list endpoint
//    Query params:
//      most-popular=true   -> data/most_popular.json
//      highest-price=true  -> data/highest_price.json
//      lowest-price=true   -> data/lowest_price.json
//      limit=N             -> only return the first N items
// ---------------------------------------------------------------------------

// Small in-memory cache so we don't re-read the JSON files from disk on
// every single request. We load each file once and keep it in this object.
const propertyCache = {};

function loadDataset(fileName) {
  if (propertyCache[fileName]) {
    return propertyCache[fileName];
  }
  const filePath = path.join(__dirname, "data", fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  propertyCache[fileName] = data;
  return data;
}

app.get("/get-property", (req, res) => {
  const {
    "most-popular": mostPopular,
    "highest-price": highestPrice,
    "lowest-price": lowestPrice,
    limit,
  } = req.query;

  let fileName = null;

  if (mostPopular === "true") {
    fileName = "most_popular.json";
  } else if (highestPrice === "true") {
    fileName = "highest_price.json";
  } else if (lowestPrice === "true") {
    fileName = "lowest_price.json";
  }

  if (!fileName) {
    return res.status(400).json({
      error:
        "Please provide one of: most-popular=true, highest-price=true, or lowest-price=true",
    });
  }

  try {
    let items = loadDataset(fileName);

    if (limit !== undefined) {
      const limitNumber = parseInt(limit, 10);
      if (!Number.isNaN(limitNumber) && limitNumber > 0) {
        items = items.slice(0, limitNumber);
      }
    }

    res.json(items);
  } catch (err) {
    console.error(`Could not load ${fileName}:`, err);
    res.status(500).json({ error: "Could not load property data" });
  }
});

// ---------------------------------------------------------------------------
// 4) Serve the frontend (index.html, styles.css, and the site's own images)
//    Registered LAST as a fallback - any request not matched by a route
//    above (e.g. "/", "/styles.css", "/images/hero-main.jpg" used by the
//    page itself) is looked up inside the public/ folder.
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// 5) Start the server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});





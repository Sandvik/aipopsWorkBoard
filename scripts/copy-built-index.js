const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const source = path.join(rootDir, "dist-client", "index.html");
const target = path.join(rootDir, "index.html");

fs.copyFile(source, target, (err) => {
  if (err) {
    console.error("Kunne ikke kopiere dist-client/index.html til projektroden:", err);
    process.exit(1);
  }
  console.log("Kopierede dist-client/index.html til projektroden som index.html");
});


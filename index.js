const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const apiRouter = require("./routes/api");
const updateData = require("./routes/apiPost");
const EntryCache = require("./CustomModule/cacheManager");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors()); // Use cors middleware here
app.use(express.json());
app.use("/api/post", updateData);
app.use("/api", apiRouter);

app.listen(port, () => {
  console.log("Server is online at port 3000 over!");
  EntryCache.updateCache("entryLog");
});

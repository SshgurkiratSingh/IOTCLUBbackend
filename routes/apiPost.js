const express = require("express");
const router = express.Router();
const customisationFile = "customisation.json";
router.use(express.json());
const fs = require("fs").promises;
// const { PrismaClient } = require("@prisma/client");
const { SensorLog } = require("../Database");
const EntryCache = require("../CustomModule/cacheManager");
// const prisma = new PrismaClient();
// const axios = require("axios");
router.use(express.urlencoded({ extended: false }));
const auth = "1234a";
// -------------------UpdateMessage------------------//
router.post("/updateMsg", async (req, res) => {
  const data = req.body;
  console.log(`Clear Copy, updateReq received from ${req.ip}`);
  if (data.auth == auth) {
    if (data.message.length > 0) {
      const jsonData = await fs.readFile(customisationFile, "utf8");
      let fileData = JSON.parse(jsonData);

      fileData["dashboard"].message = data.message;
      await fs.writeFile(customisationFile, JSON.stringify(fileData));
      console.log(`file Data updated to ${fileData["dashboard"]}`);
      res.json({
        status: "success",
        msg: `file Data message field updated to ${fileData["dashboard"].message}`,
      });
    }
  } else {
    res.send("Wrong auth");
  }
});

//---------------------TeamToDisplay-------------------------//
router.post("/teamToDisplayonDash", async (req, res) => {
  const data = req.body;
  console.log(`Clear Copy, updateReq received from ${req.ip}`);
  if (data.auth == auth) {
    const jsonData = await fs.readFile(customisationFile, "utf8");
    let fileData = JSON.parse(jsonData);
    fileData.teamDash = data.teamDash;
    await fs.writeFile(customisationFile, JSON.stringify(fileData));
  } else {
    res.send("Wrong auth");
  }
});
// -------------------Alert----------------------------//
router.post("/alert", async (req, res) => {
  const data = req.body;
  console.log(`Clear Copy, updateReq received from ${req.ip}`);
  if (data.auth == auth) {
    const jsonData = await fs.readFile(customisationFile, "utf8");
    let fileData = JSON.parse(jsonData);
    fileData.alert = data.alert;
    await fs.writeFile(customisationFile, JSON.stringify(fileData));
  } else {
    res.send("Wrong auth");
  }
});
// -------------------updateSubtitle------------------------//
router.post("/updateSubtitle", async (req, res) => {
  const data = req.body;
  console.log(`Clear Copy, updateReq received from ${req.ip}`);
  if (data.auth == auth) {
    const jsonData = await fs.readFile(customisationFile, "utf8");
    let fileData = JSON.parse(jsonData);
    fileData.subtitle = data.subtitle;
    await fs.writeFile(customisationFile, JSON.stringify(fileData));
  } else {
    res.send("Wrong auth");
  }
});

// ----------------------Sensor Log-----------------------//
router.post("/sensor", async (req, res) => {
  const dataRes = req.body;
  console.log(`Clear Copy, updateReq received from ${req.ip}`);
  console.log(dataRes);
  if (dataRes.teamId > 10 || !dataRes.teamId) {
    res.json({ status: "fail", problem: "teamId is too high" });
  } else if (dataRes.teamId < 1) {
    res.json({ status: "fail", problem: "teamId is too low" });
  } else if (!dataRes.sensor1Name || !dataRes.sensor1Value) {
    res.json({
      status: "fail",
      problem: "sensor1Name or sensor1Value missing",
    });
  } else {
    try {
      let data;
      teamId = parseInt(dataRes.teamId);
      if (dataRes.sensor2Name && dataRes.sensor2Value) {
        data = await SensorLog.create({
          teamId: teamId,
          projectTitle: dataRes.projectTitle || "test",
          sensor1Name: dataRes.sensor1Name,
          sensor1Value: String(dataRes.sensor1Value),
          sensor2Name: dataRes.sensor2Name,
          sensor2Value: String(dataRes.sensor2Value),
        });
      } else {
        data = await SensorLog.create({
          teamId: teamId,
          projectTitle: dataRes.projectTitle || "test",
          sensor1Name: dataRes.sensor1Name,
          sensor1Value: parseInt(dataRes.sensor1Value),
        });
      }

      res.json({ status: "success", data }); // Send the created data in the response
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: "fail", problem: "Internal server error" });
    }
  }
});

// ----------------------Create Team-----------------------//
router.post("/createTeam", async (req, res) => {
  if (!req.body.teamId || req.body.Members.length < 3) {
    res.send("Wrong data");
  } else {
    const data = prisma.team.create({
      data: {
        teamId: req.body.teamId,
        Members: req.body.Members,
      },
    });
  }
});
// ----------------------SetMaxValue-----------------------//
router.post("/setMaxValue", async (req, res) => {
  if (!req.body.teamId || req.body.MaxValue1 < 0 || req.body.MaxValue2 < 0) {
    res.send("Invalid Req");
  } else {
    const jsonData = await fs.readFile(customisationFile, "utf8");
    let fileData = JSON.parse(jsonData);
    fileData["maxValue"][req.body.teamId - 1] = [
      req.body.MaxValue1,
      req.body.MaxValue2,
    ];
    await fs.writeFile(customisationFile, JSON.stringify(fileData));
  }
  res.json({ status: "success" });
});
// -----------------------Validate a User-----------------------//
router.post("/validateUser", async (req, res) => {
  try {
    const fileData = await fs.readFile("dataFiles/RFID.json", "utf-8");
    const data = JSON.parse(fileData);
    console.log(req.body);

    // Check if UID exists in the request body
    if (!req.body.UID) {
      return res.json({
        status: "error",
        description: "No UID provided",
        code: 400,
      });
    }

    const { UID } = req.body;

    // Check if UID exists in the tags array (case-insensitive)
    const user = data.tags.find(
      (tag) =>
        tag.UID.toLowerCase().split(" ").join("") ===
        UID.toLowerCase().split(" ").join("")
    );

    const logFileData = await fs.readFile("dataFiles/Entrylog.json", "utf-8");
    const entryLog = JSON.parse(logFileData);
    const timestamp = new Date().toISOString();

    if (user) {
      if (user.userAllowed == true) {
        entryLog.push({
          UID: user.UID,
          timestamp,
          description: "Attendence Marked Successfully",
          status: "Approved",
          userName: user.userName,
        });

        await fs.writeFile(
          "dataFiles/Entrylog.json",
          JSON.stringify(entryLog, null, 2)
        );
        await EntryCache.updateCache("entryLog");

        return res.json({
          permissionToUnlock: true,
          isValid: true,
          ...user,
          timestamp,
          code: 1,
        });
      } else {
        // Handle entry denial logic
        entryLog.push({
          UID: user.UID,
          timestamp,

          description:
            "Attendance was Denied because of permissions not granted to user",
          status: "denied",
          userName: user.userName,
        });

        await fs.writeFile(
          "dataFiles/Entrylog.json",
          JSON.stringify(entryLog, null, 2)
        );
        await EntryCache.updateCache("entryLog");
        return res.json({
          permissionToUnlock: false,
          isValid: true,

          ...user,
          timestamp,
          code: 2, // Status code for entry denied
        });
      }
    } else {
      // Handle unknown card logic
      entryLog.push({
        UID: UID,

        timestamp,
        description: "Attendance was Denied because of an unknown card",
        status: "unknown",
      });

      await fs.writeFile(
        "dataFiles/Entrylog.json",
        JSON.stringify(entryLog, null, 2)
      );
      await EntryCache.updateCache("entryLog");

      return res.json({
        isValid: false,

        timestamp,
        code: 3, // Status code for unknown card
      });
    }
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ----------------------Create a User-----------------------//
router.post("/addUser", async (req, res) => {
  try {
    // Validate user input
    const {
      UID,
      userType,
      userName,
      email,
      userAllowed,
      userDescription,
      userRollNo,
    } = req.body;

    if (!UID || !userType || !userName || !email) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    const fileData = await fs.readFile("dataFiles/RFID.json", "utf-8");
    const data = JSON.parse(fileData);

    // Check if userUID exists in the tags array
    const user = data.tags.find((tag) => tag.UID === UID);

    if (user) {
      return res.status(409).json({
        error: "User already exists",
        user: user,
      });
    } else {
      data.tags.push({
        UID: UID,
        userName: userName,
        userType: userType,
        userDescription: userDescription,
        userAllowed: userAllowed,
        email: email,
        userRollNo: userRollNo,
      });

      // Write updated data back to the file
      await fs.writeFile("dataFiles/RFID.json", JSON.stringify(data));

      return res.status(201).json({
        message: "User added successfully",
        user: data.tags.find((tag) => tag.UID === UID),
      });
    }
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;

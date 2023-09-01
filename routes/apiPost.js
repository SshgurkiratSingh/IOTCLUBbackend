const express = require("express");
const router = express.Router();
const customisationFile = "customisation.json";
router.use(express.json());
const fs = require("fs").promises;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
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

  if (dataRes.teamId > 10) {
    res.json({ status: "fail", problem: "teamId is too high" });
  } else if (dataRes.teamId < 1) {
    // Fixed the condition here
    res.json({ status: "fail", problem: "teamId is too low" });
  } else if (!dataRes.sensor1Name || !dataRes.sensor1Value) {
    // Combined the conditions here
    res.json({
      status: "fail",
      problem: "sensor1Name or sensor1Value missing",
    });
  } else {
    try {
      let data;
      teamId = parseInt(dataRes.teamId);
      if (dataRes.sensor2Name && dataRes.sensor2Value) {
        data = await prisma.SensorLog.create({
          data: {
            teamId: teamId,
            projectTitle: dataRes.projectTitle || "test",
            sensor1Name: dataRes.sensor1Name,
            sensor1Value: dataRes.sensor1Value,
            sensor2Name: dataRes.sensor2Name,
            sensor2Value: dataRes.sensor2Value,
          },
        });
      } else {
        data = await prisma.SensorLog.create({
          data: {
            teamId: teamId,
            projectTitle: dataRes.projectTitle || "test",
            sensor1Name: dataRes.sensor1Name,
            sensor1Value: dataRes.sensor1Value,
          },
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

// ----------------------Create Project-----------------------//

module.exports = router;

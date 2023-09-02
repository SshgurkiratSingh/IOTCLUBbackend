const express = require("express");
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: false }));
const customisationFile = "customisation.json";
const fs = require("fs").promises;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
let clearTeamInterval = null;
let teamArr = null;
const SteinStore = require("stein-js-client");
const store = new SteinStore(
  "https://api.steinhq.com/v1/storages/64f307aad27cdd09f013520b"
);

// ----------------------Get Team Member---------------------//
router.get("/teamMember/:teamId", async (req, res) => {
  if (!req.params.teamId) {
    res.send("Please provide teamId");
  } else if (req.params.teamId < 1 || req.params.teamId > 10) {
    res.send("Invalid Team ID");
  } else {
    store.read("Sheet1").then((data) => {
      let dataToReturn = data.find(
        (team) => team["Team ID"] === req.params.teamId
      );
      console.log(dataToReturn);
      res.json(dataToReturn);
    });
  }
});

// ------------------------Reset Team List ------------------//
function resetTeamList() {
  if (clearTeamInterval) {
    clearInterval(clearTeamInterval);
  }
  clearTeamInterval = setInterval(() => {
    teamArr = null;
    console.log("Team List cleared");
  }, 60);
}

// --------------------------Get Config Data-----------------------//
router.get("/config", async (req, res) => {
  const jsonData = await fs.readFile(customisationFile, "utf8");
  const fileData = JSON.parse(jsonData);
  res.send(fileData);
});

// ---------------------------Get Sensor Data-----------------------//
router.get("/getDashboardData", async (req, res) => {
  const jsonData = await fs.readFile(customisationFile, "utf8");
  const fileData = JSON.parse(jsonData);

  if (!teamArr) {
    const jsonData = await fs.readFile(customisationFile, "utf8");
    const fileData = JSON.parse(jsonData);
    teamArr = fileData["dashboard"].teamToDisplayonDash;
  }

  const teamDataPromises = teamArr.map(async (teamId, index) => {
    const teamData = await prisma.SensorLog.findFirst({
      where: {
        teamId: teamId,
      },
      orderBy: {
        date: "desc", // Sort by timestamp in descending order
      },
    });
    return { teamId, teamData, index };
  });

  // Wait for all promises to resolve
  const teamDataArray = await Promise.all(teamDataPromises);

  // Convert the array into a final combined data object
  const finalCombinedData = teamDataArray.reduce(
    (result, { teamId, teamData, index }) => {
      result[`sensor${index + 1}`] = {
        teamData,
        maxValue: fileData["maxValue"][index],
      };
      return result;
    },
    {}
  );

  res.json(finalCombinedData);
});

// --------------------------Get Specific Team Data--------------------------//
router.get("/getDashboardData/:teamId", async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const teamData = await prisma.SensorLog.findMany({
    where: {
      teamId: teamId,
    },
    orderBy: {
      date: "desc",
    },
  });
  res.json(teamData);
});

// -------------------- Get Specific Team Data with Sensor Name ------------------//
router.get("/getDashboardData/:teamId/:sensorName", async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const sensorName = req.params.sensorName;
  const teamData = await prisma.SensorLog.findMany({
    where: {
      teamId: teamId,
      sensor1Name: sensorName,
    },
    orderBy: {
      date: "desc",
    },
  });
  res.json(teamData);
});
// --------------------------Get Sensor Data-----------------------//
router.get("/getSensorData", async (req, res) => {
  const sensorData = await prisma.SensorLog.findMany();
  res.json(sensorData);
});
// -------------------------Get Online Status---------------------//
router.get("/getOnlineStatus", async (req, res) => {
  res.json({ online: true });
});
// -------------------------Get Team Dashboard Data---------------------//
router.get("/getTeamDashboardData/:teamId", async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  if (teamId > 10) {
    res.json({ status: "fail", problem: "teamId is too high" });
  }
  const teamData = await prisma.SensorLog.findMany({
    where: {
      teamId: teamId,
    },
    orderBy: {
      date: "desc",
    },
  });
  res.json(teamData);
});
// -----------------------Get Team Dashboard latest Data with maxValue---------------//
router.get("/getSensorDataByTeamid/:teamId", async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const jsonData = await fs.readFile(customisationFile, "utf8");
  const fileData = JSON.parse(jsonData);
  if (teamId > 10) {
    res.json({ status: "fail", problem: "teamId is too high" });
  }
  const teamData = await prisma.SensorLog.findFirst({
    where: {
      teamId: teamId,
    },
    orderBy: {
      date: "desc",
    },
  });
  const finalRes = {
    teamData,
    maxValue: fileData["maxValue"][teamId - 1],
  };
  res.json(finalRes);
});
module.exports = router;

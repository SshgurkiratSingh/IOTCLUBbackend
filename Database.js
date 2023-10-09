const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

class FileSystemDB {
  static readFileSync(fileName) {
    try {
      const data = fs.readFileSync(fileName, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  static writeFileSync(fileName, data) {
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
  }
}
class SensorLog {
  constructor(data) {
    this.id = uuidv4();
    this.teamId = data.teamId;
    this.projectTitle = data.projectTitle;
    this.sensor1Name = data.sensor1Name || null;
    this.sensor1Value = data.sensor1Value || null;
    this.sensor2Name = data.sensor2Name || null;
    this.sensor2Value = data.sensor2Value || null;
    this.date = new Date().toISOString();
    this.remarks = data.remarks || null;
  }

  static async create(data) {
    const sensorLog = new SensorLog(data);
    const sensorLogs = FileSystemDB.readFileSync("sensorLogs.json");
    sensorLogs.push(sensorLog);
    FileSystemDB.writeFileSync("sensorLogs.json", sensorLogs);
    return sensorLog;
  }

  static async findFirst(query) {
    const sensorLogs = FileSystemDB.readFileSync("sensorLogs.json");
    const filteredLogs = sensorLogs.filter(
      (log) => log.teamId === query.where.teamId
    );
    if (query.orderBy && query.orderBy.date === "desc") {
      filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return filteredLogs[0] || null;
  }

  static async findMany(query) {
    const sensorLogs = FileSystemDB.readFileSync("sensorLogs.json");
    let filteredLogs = sensorLogs.filter(
      (log) => log.teamId === query.where.teamId
    );
    if (query.where.sensor1Name) {
      filteredLogs = filteredLogs.filter(
        (log) => log.sensor1Name === query.where.sensor1Name
      );
    }
    if (query.orderBy && query.orderBy.date === "desc") {
      filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return filteredLogs;
  }
  /**
   * Find the first sensor log that matches the given query.
   *
   * @param {Object} query - The query object used to filter the sensor logs.
   * @param {string} query.where.teamId - The team ID used to filter the sensor logs.
   * @param {Object} query.orderBy - The ordering object used to sort the sensor logs.
   * @param {string} query.orderBy.date - The date ordering used to sort the sensor logs.
   * @param {string} query.orderBy.date.desc - The descending order used to sort the sensor logs.
   * @returns {Object|null} The first filtered sensor log or null if no logs match the query.
   */
  static async findFirst(query) {
    const sensorLogs = FileSystemDB.readFileSync("sensorLogs.json");
    const filteredLogs = sensorLogs.filter(
      (log) => log.teamId === query.where.teamId
    );
    if (query.orderBy && query.orderBy.date === "desc") {
      filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return filteredLogs[0] || null;
  }
}

module.exports = {
  FileSystemDB,
  SensorLog,
};

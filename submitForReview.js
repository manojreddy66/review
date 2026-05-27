/**
 * @description This file contains DB operations for submit for review API
 */
const { dbConnect } = require("prismaORM/index");
const { simulationData } = require("prismaORM/services/simulationService");
const { getCurrentTimestamp } = require("utils/common_utils");

/**
 * @description Function to update simulation status to "Submitted For Review"
 * @param {Object} payload: request body (simulationId, userName, userEmail)
 * @param {Promise<Object>} simulationRecord: existing simulation record
 */
async function updateSimulationStatus(payload, simulationRecord) {
  const rdb = await dbConnect();
  const simulationService = new simulationData(rdb);
  try {
    const { simulationId, userName, userEmail } = payload;
    /**
     * @description Build updated activity log by appending submit for review entry
     */
    const updatedActivityLog = createLatestActivityLog(
      simulationRecord,
      userName
    );
    /**
     * @description Update simulation status, activity_log, updated_by, updated_by_user_name and timestamp
     */
    await simulationService.submitSimulationForReview(
      simulationId,
      userName,
      userEmail,
      updatedActivityLog
    );
    console.log("Simulation status updated to Submitted For Review.");
  } catch (error) {
    console.log("Error in updateSimulationStatus:", error);
    throw error;
  }
}

/**
 * @description Function to append a new entry to activity log when a simulation is submitted for review
 * @param {*} simulationDetails - existing simulation details from DB (includes existing activity_log)
 * @param {*} userName - name of the user performing the submit action
 * @returns Updated activity log as a JSON string
 */
function createLatestActivityLog(simulationDetails, userName) {
  const existingLog = simulationDetails.activity_log || [];
  /* Get current CT timestamp */
  const timestamp = getCurrentTimestamp();
  const simulationName = simulationDetails.simulation_scenario_name;
  const newLogEntry = `User ${userName} has submitted the simulation ${simulationName} for review on ${timestamp}`;
  return JSON.stringify([...existingLog, newLogEntry]);
}

module.exports = { updateSimulationStatus };

/**
 * @description This file contains input request validation for submit for review API
 */
const {
  getValidationSchema,
} = require("schemaValidator/supplyPlanning/simulation/submitForReviewSchema");
const { dbConnect } = require("prismaORM/index");
const { simulationData } = require("prismaORM/services/simulationService");
const { emptyInputCheck } = require("utils/common_utils");
const { SIMULATION_STATUSES } = require("constants/customConstants");

/**
 * @description Function to validate input request body
 * @param {Object} requestPayload: API input request body
 * @returns {Promise<Object>} { errorMessages, simulationRecord } - Validation error messages (empty if valid) & simulation record
 */
async function validateInput(requestPayload) {
  const errorMessages = [];
  /**
   * @description Check if request body is empty
   */
  emptyInputCheck(requestPayload);
  /**
   * @description Validate request body using Joi schema
   */
  validateParams(requestPayload, errorMessages);
  let simulationRecord = null;
  /**
   * @description If Joi validation passed, perform DB validations
   */
  if (errorMessages.length === 0) {
    /**
     * @description Function to check if simulation exists
     * returns {Promise<Object>} Simulation data if simulation exists else null
     */
    simulationRecord = await checkSimulationExists(
      requestPayload,
      errorMessages
    );
  }
  return { errorMessages: [...new Set(errorMessages)], simulationRecord };
}

/**
 * @description Function to validate request params using Joi schema
 * @param {Object} requestPayload - request body
 * @param {Array} errorMessages - array to collect validation errors
 */
function validateParams(requestPayload, errorMessages) {
  const schema = getValidationSchema();
  const { error } = schema.validate(requestPayload, { abortEarly: false });
  if (error?.details?.length) {
    error.details.forEach((e) => errorMessages.push(e.message));
  }
}

/**
 * @description Function to check if simulation exists and is not already submitted
 * @param {Object} requestPayload - request body
 * @param {Array} errorMessages - array to collect validation errors
 * @returns {Promise<Object|null>} Simulation data if exists else null
 */
async function checkSimulationExists(requestPayload, errorMessages) {
  const rdb = await dbConnect();
  const simulationService = new simulationData(rdb);
  try {
    /**
     * @description Get simulation by simulationId
     */
    const simulationResult = await simulationService.getSimulationById(
      requestPayload.simulationId
    );
    /**
     * @description If simulation doesn't exist, add validation error
     */
    if (!simulationResult || simulationResult.length === 0) {
      errorMessages.push("ValidationError: simulationId doesn't exist.");
      return null;
    }
    /**
     * @description If simulation is already submitted for review, add validation error
     */
    if (
      simulationResult[0].simulation_status ===
      SIMULATION_STATUSES.SUBMITTED_FOR_REVIEW
    ) {
      errorMessages.push(
        "ValidationError: Rundown was already submitted for review."
      );
      return null;
    } else if (
      simulationResult[0].simulation_status === SIMULATION_STATUSES.APPROVED
    ) {
      errorMessages.push("ValidationError: Rundown was already approved.");
      return null;
    } else if (
      simulationResult[0].simulation_status === SIMULATION_STATUSES.REJECTED
    ) {
      errorMessages.push("ValidationError: Rundown was already rejected.");
      return null;
    } else if (
      simulationResult[0].simulation_status === SIMULATION_STATUSES.PROMOTED
    ) {
      errorMessages.push("ValidationError: Rundown was already promoted.");
      return null;
    } else {
      return simulationResult[0];
    }
  } catch (error) {
    console.log("Error in checkSimulationExists:", error);
    throw error;
  }
}

module.exports = { validateInput };

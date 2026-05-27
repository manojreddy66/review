/**
 * @description This file contains routing to input validation, DB operations and prepare response
 */
const { BadRequest } = require("utils/api_response_utils");
const { validateInput } = require("./validateRequest");
const { updateSimulationStatus } = require("./submitForReview");
const { prepareResponse } = require("./utils");

/**
 * @description Function to validate input, update simulation status and prepare response
 * @param {Object} event - Lambda event object
 * @returns {Promise<Object>} formatted response object
 */
async function submitForReview(event) {
  try {
    const payload = event?.body ? JSON.parse(event.body) : {};
    console.log("requestBody:", payload);
    /**
     * @description Function to validate input request body
     * @param {Object} payload: API input request body
     * @returns {Promise<Object>} { errorMessages, simulationRecord }
     */
    const { errorMessages, simulationRecord } = await validateInput(payload);
    /* If validation errors exist, throw a BadRequest error */
    if (errorMessages.length > 0) {
      throw new BadRequest(errorMessages);
    }
    /**
     * @description Update simulation status to "Submitted For Review"
     * @param {Object} payload: request body (scenarioId, groupId, simulationName, userName, userEmail)
     * @param {Object} simulationRecord: existing simulation record
     * @returns {Promise<void>} Void if update was successful
     */
    await updateSimulationStatus(payload, simulationRecord);
    /**
     * @description Prepare and return success response
     * @returns {Object} success response
     */
    return prepareResponse();
  } catch (error) {
    console.log("Error in submitForReview service:", error);
    throw error;
  }
}

module.exports = { submitForReview };

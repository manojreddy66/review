/**
 * @name submit-for-review
 * @description Post API to submit a simulation rundown for review
 * @createdOn Apr 20th, 2026
 * @modifiedBy
 * @modifiedOn
 * @modificationSummary
 */

const {
  sendResponse,
  BadRequest,
  HTTP_RESPONSE_CODES,
} = require("utils/api_response_utils");
const { submitForReview } = require("./submitForReviewService");
const { API_ERROR_MESSAGE } = require("constants/customConstants");

/**
 * @description Lambda handler for Submit for Review POST API.
 * @param {Object} event: API event with request body:
    {
      "simulationId": "uniqueSimulationId",
      "userName": "Priyadarshini Gangone",
      "userEmail": "gangone.priyadarshini@toyota.com"
    }
 * @returns {Promise<Object>}: response sample is detailed below.
 * Success response with status code 200:
 * {
    "message": "Successfully submitted the rundown for review."
   }
 * In-valid input error with status 400:
  {
    "errorMessage": [<"ValidationError: validation error message">]
  }
 * Internal server error with status code 500:
  {
    "errorMessage": "Internal Server Error"
  }
 */
exports.handler = async (event) => {
  try {
    /**
     * @description Function to validate input and submit rundown for review.
     * @param {Object} event: Input parameters
     * @returns {Promise<Object>} submitForReviewResponse - success response
     */
    const submitForReviewResponse = await submitForReview(event);
    console.log("submitForReviewResponse:", submitForReviewResponse);
    return sendResponse(HTTP_RESPONSE_CODES.SUCCESS, submitForReviewResponse);
  } catch (error) {
    console.log("Handler Error - Submit for Review Post API:", error);
    let errorMessage = API_ERROR_MESSAGE.INTERNAL_SERVER_ERROR;
    let statusCode = HTTP_RESPONSE_CODES.INTERNAL_SERVER_ERROR;
    /**
     * @description If error is BadRequest, return 400 with validation messages
     */
    if (error instanceof BadRequest) {
      statusCode = HTTP_RESPONSE_CODES.BAD_REQUEST;
      errorMessage = error.message
        .split(/,(?=ValidationError:)/)
        .map((e) => e.trim());
      console.log(
        "Validation error messages - Submit for Review Post API: ",
        errorMessage
      );
    }
    return sendResponse(statusCode, { errorMessage: errorMessage });
  }
};

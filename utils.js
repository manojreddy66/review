/**
 * @description This file contains utility functions for submit for review API
 */

/**
 * @description Function to prepare success response for Submit for Review API
 * @returns {Object} response - success response
 */
function prepareResponse() {
  return {
    message: "Successfully submitted the rundown for review.",
  };
}

module.exports = { prepareResponse };

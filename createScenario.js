/**
 * @description this file contain lambda invocation call to create new scenario and upsert user config
 */
const { dbConnect } = require("prismaORM/index");
const { scenariosData } = require("prismaORM/services/scenariosService");
const { userDetailsData } = require("prismaORM/services/userDetailsService");
const { formatMonthYear } = require("./utils");
const { lambdaInvoke } = require("utils/lambda_utils");

/**
 * @description Function to insert new scenario details, upsert user config details,
 * and invoke DE async lambda for prepopulating data for newly created scenario
 * @param {Array} body: input request
 * @param {*} scenarioDetails: scenarioName - {PlanType}/{PLANT}/{Line}_{Cycle}_V{version} & cycle
 * @returns {Promise<Object>} Response object
 */
async function postScenarioData(body, scenarioDetails) {
  /* Connecting to DB instance */
  const rdb = await dbConnect();
  const scenariosDataService = new scenariosData(rdb);
  const userDetailsDataService = new userDetailsData(rdb);

  try {
    const { scenarioName, cycle } = scenarioDetails;
    /**
     * @description Function to format month and year - YYYYMM
     * @returns {*} formattedStartMonthYear - Formatted startMonth & startYear YYYYMM
     */
    const formattedStartMonthYear = formatMonthYear(
      body.startMonth,
      body.startYear
    );
    /**
     * @description Function to format month and year - YYYYMM
     * @returns {*} formattedEndtMonthYear - Formatted endMonth & endYear YYYYMM
     */
    const formattedEndMonthYear = formatMonthYear(body.endMonth, body.endYear);
    /**
     * @description Insert new scenario details into scenarios table
     * and upsert user config details
     */
    await rdb.prisma.$transaction(async (tx) => {
      await userDetailsDataService.upsertUserConfig(body, tx);
      const scenarioData = await scenariosDataService.createScenario(
        body,
        scenarioName,
        cycle,
        formattedStartMonthYear,
        formattedEndMonthYear,
        tx
      );
      /**
       * @description Function to invoke DE async lambda for prepopulating data
       * for newly created scenario
       * @param {*} scenarioId: Unique scenarioId for the newly created scenario
       */
      await invokeAsyncLambda(scenarioData[0].scenario_id, body.userEmail);
    });
  } catch (err) {
    console.log("Error in postScenarioData:", err);
    throw err;
  }
}

/**
 * @description Function to invoke DE async lambda for data prepopulation
 * for newly created scenario
 * @param {*} scenarioId: Unique scenarioId for the newly created scenario
 * @param {*} createdBy: Email of the user who created the scenario
 * @returns {Promise<Object>} Response object
 */
async function invokeAsyncLambda(scenarioId, createdBy) {
  const params = {
    FunctionName: process.env.DE_DATA_PREPOPULATION_LAMBDA, // required
    InvocationType: "Event", // required for async invocation
    Payload: JSON.stringify({
      scenarioId,
      createdBy,
    }),
  };
  /**
   * @description Function to invoke Processing Lambda (Async)
   * @param {*} params: Lambda invocation params
   */
  await lambdaInvoke(params);
}

module.exports = { postScenarioData };

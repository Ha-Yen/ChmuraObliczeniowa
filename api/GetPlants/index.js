const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

module.exports = async function (context, req) {
  context.log("GetPlants HTTP trigger function processed a request.");

  const githubUserPartitionKey = "Ha-Yen";
  const tableName = "plants";
  const connectionString = process.env["ConnectionKey"];

  if (!connectionString) {
    context.res = {
      status: 500,
      body: "ConnectionKey connection string is not configured.",
    };
    return;
  }

  let targetPartitionKey = githubUserPartitionKey;

  const filter = `PartitionKey eq '${targetPartitionKey}'`;

  try {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );

    const plants = [];
    for await (const entity of tableClient.listEntities({
      queryOptions: { filter: filter },
    })) {
      // TE DWIE LINIE SĄ KRYTYCZNE I MUSZĄ BYĆ OBECNE I NIEZAKOMENTOWANE
      plants.push({
        PartitionKey: entity.PartitionKey, // TA LINIA MUSI BYĆ TAK JAK JEST
        RowKey: entity.RowKey, // TA LINIA MUSI BYĆ TAK JAK JEST
        name: entity.name,
        species: entity.species,
        lastWateringDate: entity.lastWateringDate,
        coverImageSrc: entity.coverImageSrc,
        wikipediaUrl: entity.wikipediaUrl,
      });
    }

    context.res = {
      status: 200,
      body: plants,
    };
  } catch (error) {
    context.log.error("Error getting plants:", error);
    if (error.statusCode === 404) {
      context.res = {
        status: 200,
        body: [],
      };
    } else {
      context.res = {
        status: 500,
        body: `Error getting plants: ${error.message}. Please check function logs for more details.`,
      };
    }
  }
};

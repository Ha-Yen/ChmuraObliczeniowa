const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
  context.log("UpdatePlant HTTP trigger function processed a request.");

  // Zmienna środowiskowa z Connection String do Azure Table Storage
  const connectionString = process.env["ConnectionKey"];
  const tableName = "plants"; // Nazwa Twojej tabeli (mała litera 'p', zgodnie z potwierdzeniem)

  if (!connectionString) {
    context.res = {
      status: 500,
      body: "ConnectionKey connection string is not configured.",
    };
    return;
  }

  // Oczekujemy, że żądanie będzie zawierać PartitionKey, RowKey i lastWateringDate
  const { PartitionKey, RowKey, lastWateringDate } = req.body;

  if (!PartitionKey || !RowKey || !lastWateringDate) {
    context.res = {
      status: 400,
      body: "Please provide PartitionKey, RowKey, and lastWateringDate in the request body.",
    };
    return;
  }

  try {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );

    // Tworzymy encję do aktualizacji. Tylko te pola zostaną zaktualizowane.
    // Tryb "Merge" aktualizuje tylko podane pola, pozostawiając resztę bez zmian.
    const updatedEntity = {
      PartitionKey: PartitionKey,
      RowKey: RowKey,
      lastWateringDate: lastWateringDate, // Data w formacie ISO string
    };

    // Aktualizuj encję w trybie "Merge"
    await tableClient.updateEntity(updatedEntity, "Merge");

    context.res = {
      status: 200,
      body: `Plant ${RowKey} watering date updated successfully!`,
    };
  } catch (error) {
    context.log.error("Error updating plant:", error);
    if (error.statusCode === 404) {
      context.res = {
        status: 404,
        body: "Plant not found or table does not exist.",
      };
    } else {
      context.res = {
        status: 500,
        body: `Failed to update plant: ${error.message}`,
      };
    }
  }
};

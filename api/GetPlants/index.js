const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

module.exports = async function (context, req) {
  context.log("GetPlants HTTP trigger function processed a request.");

  const githubUserPartitionKey = "Ha-Yen"; // Potwierdzony PartitionKey, którego używasz
  const tableName = "plants"; // Zostaje "plants"
  const connectionString = process.env["ConnectionKey"];

  if (!connectionString) {
    context.res = {
      status: 500,
      body: "ConnectionKey connection string is not configured.",
    };
    return;
  }

  // >>> TYMCZASOWA ZMIANA TYLKO DLA CELÓW DEBUGOWANIA (jeśli nadal używasz jej na localhost) <<<
  let targetPartitionKey = githubUserPartitionKey;

  // Poniższy blok kodu, który dekoduje clientPrincipal i potencjalnie zmienia
  // targetPartitionKey na userId, jest teraz nieistotny, jeśli `targetPartitionKey`
  // jest ustawiony na stałe powyżej.
  /*
  const clientPrincipal = req.headers["x-ms-client-principal"];
  if (clientPrincipal) {
    try {
      const decodedClientPrincipal = Buffer.from(
        clientPrincipal,
        "base64"
      ).toString("ascii");
      const principal = JSON.parse(decodedClientPrincipal);
      const userId =
        principal.userId || principal.nameId || principal.userDetails;
      context.log(`Logged in user ID: ${userId}`);
      // targetPartitionKey = userId;
    } catch (error) {
      context.log.error("Error decoding client principal:", error);
    }
  } else {
    context.log(
      "No client principal found. Fetching plants for default PartitionKey (Ha-Yen)."
    );
  }
  */
  // >>> KONIEC TYMCZASOWEJ ZMIANY <<<

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
      // >>> WAŻNA POPRAWKA TUTAJ: DODANIE PartitionKey i RowKey <<<
      plants.push({
        PartitionKey: entity.PartitionKey, // Upewnij się, że to jest dodane!
        RowKey: entity.RowKey, // Upewnij się, że to jest dodane!
        name: entity.name,
        species: entity.species,
        lastWateringDate: entity.lastWateringDate,
        coverImageSrc: entity.coverImageSrc,
        wikipediaUrl: entity.wikipediaUrl,
        // Tutaj możesz dodać inne właściwości encji, jeśli są potrzebne na front-endzie.
        // Jeśli masz inne kolumny w tabeli, możesz je tutaj również przekazać:
        // description: entity.description,
        // ...
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

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

  // >>> TYMCZASOWA ZMIANA TYLKO DLA CELÓW DEBUGOWANIA <<<
  // Ta linia wymusza, aby targetPartitionKey ZAWSZE był "Ha-Yen"
  let targetPartitionKey = githubUserPartitionKey;

  // Poniższy blok kodu, który dekoduje clientPrincipal i potencjalnie zmienia
  // targetPartitionKey na userId, jest teraz nieistotny, ponieważ
  // targetPartitionKey już zostało ustawione na "Ha-Yen".
  // Możesz go nawet zakomentować na czas testów, aby było to bardziej oczywiste:
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
      // targetPartitionKey = userId; // Ta linia jest teraz ignorowana
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

  // Budowanie filtra na podstawie wybranego PartitionKey (który teraz zawsze będzie "Ha-Yen")
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
      plants.push({
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

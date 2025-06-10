const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
const { v4: uuidv4 } = require("uuid"); // Import uuid

module.exports = async function (context, req) {
  context.log("AddPlant HTTP trigger function processed a request.");

  // 1. Zabezpieczenia: Pobierz informacje o użytkowniku zalogowanym przez Static Web Apps
  // Azure Static Web Apps wstrzykuje te nagłówki po udanym uwierzytelnieniu
  const clientPrincipal = req.headers["x-ms-client-principal"];
  let userId = "anonymous"; // Domyślna wartość dla niezalogowanych lub testów

  if (clientPrincipal) {
    try {
      const decodedClientPrincipal = Buffer.from(
        clientPrincipal,
        "base64"
      ).toString("ascii");
      const principal = JSON.parse(decodedClientPrincipal);
      userId = principal.userId || principal.nameId || principal.userDetails; // Użyj userId, nameId lub userDetails jako identyfikatora
      context.log(`Logged in user ID: ${userId}`);
    } catch (error) {
      context.log.error("Error decoding client principal:", error);
    }
  } else {
    context.log(
      "No client principal found. User is anonymous or not authenticated by SWA."
    );
  }

  const plantData = req.body;

  if (!plantData || !plantData.name || !plantData.species) {
    context.res = {
      status: 400,
      body: "Please pass a plant name and species in the request body.",
    };
    return;
  }

  const tableName = "plants"; // Nazwa tabeli Azure Table Storage
  const connectionString = process.env.AzureWebJobsStorage; // Pobierz connection string ze zmiennych środowiskowych

  if (!connectionString) {
    context.res = {
      status: 500,
      body: "AzureWebJobsStorage connection string is not configured.",
    };
    return;
  }

  try {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );

    // Upewnij się, że tabela istnieje
    await tableClient.createTable();

    // Użyj userId jako PartitionKey, aby grupować rośliny po użytkowniku
    // RowKey musi być unikalny w ramach PartitionKey
    const newPlant = {
      partitionKey: userId,
      rowKey: uuidv4(), // Unikalny identyfikator dla każdej rośliny
      name: plantData.name,
      species: plantData.species,
      // Dodaj inne pola, jeśli masz
      description: plantData.description || "",
      addedDate: new Date().toISOString(),
    };

    await tableClient.createEntity(newPlant);

    context.res = {
      status: 200,
      body: `Plant '${plantData.name}' added successfully for user ${userId}.`,
    };
  } catch (error) {
    context.log.error("Error adding plant:", error);
    context.res = {
      status: 500,
      body: `Error adding plant: ${error.message}`,
    };
  }
};

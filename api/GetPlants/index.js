const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

module.exports = async function (context, req) {
  context.log("GetPlants HTTP trigger function processed a request.");

  // 1. Zabezpieczenia: Pobierz informacje o użytkowniku zalogowanym przez Static Web Apps
  const clientPrincipal = req.headers["x-ms-client-principal"];
  let userId = "anonymous"; // Domyślna wartość dla niezalogowanych lub testów
  let filter = "";

  if (clientPrincipal) {
    try {
      const decodedClientPrincipal = Buffer.from(
        clientPrincipal,
        "base64"
      ).toString("ascii");
      const principal = JSON.parse(decodedClientPrincipal);
      userId = principal.userId || principal.nameId || principal.userDetails;
      context.log(`Logged in user ID: ${userId}`);
      // Filtruj po PartitionKey dla zalogowanego użytkownika
      filter = `PartitionKey eq '${userId}'`;
    } catch (error) {
      context.log.error("Error decoding client principal:", error);
    }
  } else {
    context.log(
      "No client principal found. User is anonymous or not authenticated by SWA."
    );
    // Jeśli użytkownik jest anonimowy, możesz zwrócić puste dane lub błąd
    // Dla ułatwienia debugowania, możemy pozwolić na pobieranie "anonimowych" danych,
    // ale w rzeczywistej aplikacji raczej zwrócilibyśmy błąd 401 Unauthorized.
    // Obecnie filter pozostaje pusty, co pobierze wszystkie dane,
    // jeśli nie ma PartitionKey 'anonymous'.
    // Możesz zmienić to na:
    // context.res = { status: 401, body: "Unauthorized: Please log in." };
    // return;
    filter = `PartitionKey eq 'anonymous'`; // Lub jakąkolś inną strategię dla anonimowych
  }

  const tableName = "plants";
  const connectionString = process.env.AzureWebJobsStorage;

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

    // Sprawdź, czy tabela istnieje, jeśli nie, zwróć pustą listę
    const { status } = await tableClient.getTableAccessPolicy();
    if (status === 404) {
      // Table not found
      context.res = {
        status: 200,
        body: [], // Zwróć pustą listę, jeśli tabela nie istnieje
      };
      return;
    }

    const plants = [];
    // Użyj filter (jeśli istnieje) do pobierania tylko roślin dla danego użytkownika
    for await (const entity of tableClient.listEntities({
      queryOptions: { filter: filter },
    })) {
      plants.push(entity);
    }

    context.res = {
      status: 200,
      body: plants,
    };
  } catch (error) {
    context.log.error("Error getting plants:", error);
    // Specyficzne sprawdzenie dla 404, jeśli tabela nie istnieje
    if (error.statusCode === 404) {
      context.res = {
        status: 200,
        body: [], // Zwróć pustą listę, jeśli tabela nie istnieje
      };
    } else {
      context.res = {
        status: 500,
        body: `Error getting plants: ${error.message}`,
      };
    }
  }
};

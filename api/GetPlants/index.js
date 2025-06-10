const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

module.exports = async function (context, req) {
  context.log("GetPlants HTTP trigger function processed a request.");

  const githubUserPartitionKey = "Ha-Yen"; // Użyj tego samego PartitionKey co w PopulatePlants
  const tableName = "plants"; // Zmień na dużą literę 'P', aby pasowało do "PopulatePlants"
  const connectionString = process.env["ConnectionKey"];

  if (!connectionString) {
    context.res = {
      status: 500,
      body: "ConnectionKey connection string is not configured.",
    };
    return;
  }

  // 1. Zabezpieczenia: Pobierz informacje o użytkowniku zalogowanym przez Static Web Apps
  let filter = "";
  const clientPrincipal = req.headers["x-ms-client-principal"];

  if (clientPrincipal) {
    try {
      const decodedClientPrincipal = Buffer.from(
        clientPrincipal,
        "base64"
      ).toString("ascii");
      const principal = JSON.parse(decodedClientPrincipal);
      const userId =
        principal.userId || principal.nameId || principal.userDetails; // Użyj userId z SWA
      context.log(`Logged in user ID: ${userId}`);
      filter = `PartitionKey eq '${userId}'`; // Filtruj po zalogowanym user ID
    } catch (error) {
      context.log.error("Error decoding client principal:", error);
      // Fallback, jeśli dekodowanie się nie powiedzie, ale jest clientPrincipal
      filter = `PartitionKey eq '${githubUserPartitionKey}'`; // Domyślny dla testów
    }
  } else {
    context.log("No client principal found. Fetching default plants.");
    // Jeśli użytkownik jest anonimowy, nadal chcemy pobrać "Twoje" testowe rośliny
    filter = `PartitionKey eq '${githubUserPartitionKey}'`;
  }

  try {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );

    // --- Zmieniona sekcja sprawdzania istnienia tabeli i odczytu ---
    // Możesz pominąć jawne sprawdzanie istnienia tabeli przed zapytaniem,
    // ponieważ zapytanie na nieistniejącej tabeli zwykle samo zgłosi błąd 404,
    // który zostanie złapany i obsłużony.
    // Usunięta linia: const { status } = await tableClient.getTableAccessPolicy();

    const plants = [];
    // Użyj filter do pobierania tylko roślin dla danego użytkownika
    // Jeśli zapytanie do nieistniejącej tabeli rzuci błąd, zostanie to złapane.
    for await (const entity of tableClient.listEntities({
      queryOptions: { filter: filter },
    })) {
      // Konwertuj datę z powrotem na format, który może być użyteczny na frontendzie
      // (choć JS Date string powinien być w porządku)
      // Możesz dodać inne konwersje, jeśli potrzebne
      plants.push(entity);
    }

    context.res = {
      status: 200,
      body: plants,
    };
  } catch (error) {
    context.log.error("Error getting plants:", error);
    // Sprawdź, czy błąd wynika z nieistniejącej tabeli (statusCode 404)
    if (error.statusCode === 404) {
      context.res = {
        status: 200, // Nadal zwracamy 200 OK, ale z pustą tablicą
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

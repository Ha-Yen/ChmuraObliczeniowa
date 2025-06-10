const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

module.exports = async function (context, req) {
  context.log("GetPlants HTTP trigger function processed a request.");

  const githubUserPartitionKey = "Ha-Yen"; // Potwierdzony PartitionKey, którego używasz
  const tableName = "plants"; // ***POTWIERDZONO: Zostało "plants" (mała litera 'p')***
  const connectionString = process.env["ConnectionKey"];

  if (!connectionString) {
    context.res = {
      status: 500,
      body: "ConnectionKey connection string is not configured.",
    };
    return;
  }

  let targetPartitionKey = githubUserPartitionKey; // Domyślnie użyjemy "Ha-Yen"

  // 1. Zabezpieczenia: Pobierz informacje o użytkowniku zalogowanym przez Static Web Apps
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
      // Jeśli użytkownik jest zalogowany i ma inny userId niż "Ha-Yen", użyj jego userId
      // W docelowej aplikacji najlepiej, żeby użytkownik miał swój własny PartitionKey
      // Na razie, dla testów, możemy pozostać przy Ha-Yen, jeśli użytkownik nie ma swoich danych.
      targetPartitionKey = userId; // Użyj zalogowanego userId
    } catch (error) {
      context.log.error("Error decoding client principal:", error);
      // W przypadku błędu dekodowania, wracamy do domyślnego
      targetPartitionKey = githubUserPartitionKey;
    }
  } else {
    context.log(
      "No client principal found. Fetching plants for default PartitionKey (Ha-Yen)."
    );
    // Jeśli użytkownik jest anonimowy, nadal chcemy pobrać Twoje testowe rośliny
    targetPartitionKey = githubUserPartitionKey;
  }

  // Budowanie filtra na podstawie wybranego PartitionKey
  const filter = `PartitionKey eq '${targetPartitionKey}'`;

  try {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );

    const plants = [];
    // Użyj listEntities z filtrem. Ta metoda jest odporna na brak wyników.
    // Jeśli tabela nie istnieje, rzuci błąd 404, który zostanie złapany.
    for await (const entity of tableClient.listEntities({
      queryOptions: { filter: filter },
    })) {
      // Azure Table Storage zwraca encje z PartitionKey i RowKey.
      // Jeśli chcesz pominąć te pola w odpowiedzi do frontendu, możesz zrobić mapowanie
      // Przykład mapowania do czystszego obiektu (opcjonalnie, ale dobre dla frontendu):
      plants.push({
        name: entity.name,
        species: entity.species,
        lastWateringDate: entity.lastWateringDate,
        coverImageSrc: entity.coverImageSrc,
        wikipediaUrl: entity.wikipediaUrl,
        // Możesz dodać inne pola, jeśli są w encji i chcesz je mieć na frontendzie
        // np. id: entity.RowKey, jeśli Twój frontend tego wymaga.
      });
    }

    context.res = {
      status: 200,
      body: plants, // Zwróć tablicę roślin
    };
  } catch (error) {
    context.log.error("Error getting plants:", error);

    // Nadal ważne, aby sprawdzać status błędu i odpowiednio odpowiadać
    if (error.statusCode === 404) {
      context.res = {
        status: 200, // Zwróć 200 OK, nawet jeśli tabela nie istnieje
        body: [], // Ale z pustą tablicą
      };
    } else {
      // Dla wszystkich innych błędów, nadal zwracamy 500, ale z konkretnym komunikatem
      context.res = {
        status: 500,
        body: `Error getting plants: ${error.message}. Please check function logs for more details.`,
      };
    }
  }
};

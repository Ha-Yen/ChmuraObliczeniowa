const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
const { v4: uuidv4 } = require("uuid"); // Potrzebujesz pakietu 'uuid'

module.exports = async function (context, req) {
  context.log("PopulatePlants function processed a request.");

  const connectionString = process.env["ConnectionKey"]; // Twoja zmienna ConnectionKey
  const tableName = "Plants"; // Nazwa Twojej tabeli

  // Sprawdzenie, czy connection string jest dostępny
  if (!connectionString) {
    context.res = {
      status: 500,
      body: "ConnectionKey environment variable is not set.",
    };
    return;
  }

  try {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );

    // Upewnij się, że tabela istnieje
    await tableClient.createTable(); // Ta metoda tworzy tabelę, jeśli nie istnieje.

    // Twoja lista roślin
    const plantsToImport = [
      {
        name: "Marlena",
        species: "Monstera deliciosa",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/monstera_deliciosa_1.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Monstera_deliciosa",
      },
      {
        name: "Madzia",
        species: "Monstera deliciosa",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/monstera_deliciosa_2.webp",
        wikipediaUrl: "https://nl.wikipedia.org/wiki/Monstera_deliciosa",
      },
      {
        name: "Monika",
        species: "Monstera deliciosa",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/monstera_deliciosa_3.webp",
        wikipediaUrl: "https://nl.wikipedia.org/wiki/Monstera_deliciosa",
      },
      {
        name: "Tajka",
        species: "Monstera deliciosa thai constellation",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/monstera_deliciosa_thai.webp",
        wikipediaUrl: "https://nl.wikipedia.org/wiki/Monstera_deliciosa",
      },
      {
        name: "Dziurawiec",
        species: "Monstera esqueleto/epipremnoides",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/monstera_esqueleto.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Monstera_epipremnoides",
      },
      {
        name: "Sanderka",
        species: "Calathea sanderiana",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/calathea_sanderiana.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Goeppertia_sanderiana",
      },
      {
        name: "Kaletka",
        species: "Calathea burle marx",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/calathea_burle_marx.webp",
        wikipediaUrl:
          "https://en.wikipedia.org/w/index.php?search=Burle+Marx+Calathea&title=Special%3ASearch&ns0=1",
      },
      {
        name: "Fiona",
        species: "Fittonia",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/fittonia.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Fittonia",
      },
      {
        name: "Burrito",
        species: "Sedum morganium",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/sedum_morganianum .webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Sedum_morganianum",
      },
      {
        name: "Zenek",
        species: "Zamioculcas",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/zamioculcas.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Zamioculcas",
      },
      {
        name: "Zbyszek",
        species: "Spathiphyllum",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/spathiphyllum.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Zamioculcas",
      },
      {
        name: "Bolek",
        species: "Haworthia attenuata",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/haworthia_1.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Haworthiopsis_attenuata",
      },
      {
        name: "Lolek",
        species: "Haworthia attenuata",
        lastWateringDate: new Date().toISOString(),
        coverImageSrc: "src/haworthia_2.webp",
        wikipediaUrl: "https://en.wikipedia.org/wiki/Haworthiopsis_attenuata",
      },
    ];

    const importResults = [];
    const githubUser = "Ha-Yen"; // Tutaj Twój login GitHub

    for (const plantData of plantsToImport) {
      // Generowanie unikalnego RowKey (GUID) dla każdej rośliny
      const rowKey = uuidv4();

      const entity = {
        PartitionKey: githubUser, // Używamy loginu GitHub jako PartitionKey
        RowKey: rowKey,
        ...plantData,
      };
      try {
        await tableClient.createEntity(entity);
        importResults.push(`Added: ${plantData.name} (RowKey: ${rowKey})`);
        context.log(`Successfully added plant: ${plantData.name}`);
      } catch (error) {
        // Jeśli encja już istnieje, pomijamy błąd i logujemy
        if (error.statusCode === 409) {
          // 409 Conflict - entity already exists
          importResults.push(
            `Skipped (already exists): ${plantData.name} (RowKey: ${rowKey})`
          );
          context.log(
            `Skipped adding plant (already exists): ${plantData.name}`
          );
        } else {
          importResults.push(
            `Error adding ${plantData.name}: ${error.message}`
          );
          context.error(`Error adding plant ${plantData.name}:`, error);
        }
      }
    }

    context.res = {
      status: 200,
      body: {
        message: "Plant import process completed.",
        results: importResults,
      },
    };
  } catch (error) {
    context.error("Global error in PopulatePlants:", error);
    context.res = {
      status: 500,
      body: `Failed to import plants: ${error.message}`,
    };
  }
};

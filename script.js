// === Selektory DOM ===
const undraggableImages = document.querySelectorAll(".undraggable");

const currentMonthElement = document.getElementById("currentMonth");
const calendarDaysElement = document.getElementById("calendarDays");
const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const waterButton = document.querySelector(".buttons button:nth-child(2)");
const lastWateredText = document.querySelector(".progress-text p:nth-child(1)");
const lastWateredTimeText = document.querySelector(
  ".progress-text p:nth-child(2)"
);
const progressBarFill = document.querySelector(".progress-bar-fill");
const plantNameElement = document.querySelector(".description h3");
const plantSpeciesElement = document.querySelector(".description h5");
const plantCoverImage = document.querySelector(".image-container .cover");
const plantBlurImage = document.querySelector(".image-container .blur");
const previousPlantButton = document.querySelector(
  ".buttons button:nth-child(1)"
);
const nextPlantButton = document.querySelector(".buttons button:nth-child(3)");

// === Elementy UI dla Dropdownu i Formularza Roślin ===
const mainDropdownImage = document.querySelector(".dropdown img.undraggable"); // Obrazek, który otwiera dropdown "Moje roślinki"
const plantsDropdownContent = document.getElementById(
  "plants-dropdown-content"
); // Kontener zawartości dropdowna roślin
const addPlantLink = document.getElementById("add-plant-link"); // Link "+ Add New Plant"
const plantFormContainer = document.getElementById("plant-form-container"); // Kontener formularza dodawania roślin
const plantsListUI = document.getElementById("plants-list"); // Lista roślin wyświetlana w dropdownie UI
const addPlantForm = document.getElementById("add-plant-form"); // Sam formularz dodawania rośliny

// === Elementy UI dla Logowania i Linku Wikipedia ===
const wikipediaLink = document.getElementById("wikipedia-link"); // Poprawny selektor dla linku Wikipedia (wymaga ID w HTML)
const loginGithubBtn = document.getElementById("login-github");
const logoutBtn = document.getElementById("logout");
const userDisplay = document.getElementById("user-display");

// === Zmienne Stanu Globalnego ===
let currentDate = new Date();
let plants = []; // Globalna tablica roślin pobrana z API
let currentPlantIndex = 0;
let timerInterval;
let lastWateringDate = null; // Data ostatniego podlewania dla aktualnie wyświetlanej rośliny
let currentUser = null; // Informacje o zalogowanym użytkowniku

// --- Funkcje Pomocnicze ---

// Zapobieganie przeciąganiu obrazków
undraggableImages.forEach((img) => {
  img.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});

// === Funkcje Aktualizacji UI (Rośliny) ===
function updatePlantDisplay(plant) {
  if (!plant) {
    plantNameElement.textContent = "No Plants";
    plantSpeciesElement.textContent = "Add a plant!";
    lastWateredTimeText.textContent = "N/A";
    progressBarFill.style.width = "0%";
    plantCoverImage.src = "src/default_plant.webp"; // Domyślny obrazek
    plantBlurImage.src = "src/default_plant.webp";
    wikipediaLink.href = "#";
    wikipediaLink.target = "_self"; // Reset target
    renderCalendar();
    return;
  }

  plantNameElement.textContent = plant.name;
  plantSpeciesElement.textContent = plant.species;
  plantCoverImage.src = plant.coverImageSrc || "src/default_plant.webp"; // Domyślny, jeśli brak
  plantBlurImage.src = plant.coverImageSrc || "src/default_plant.webp";
  wikipediaLink.href = plant.wikipediaUrl || "#";
  wikipediaLink.target = plant.wikipediaUrl ? "_blank" : "_self"; // Otwórz w nowej karcie tylko jeśli jest URL

  if (plant.lastWateringDate) {
    lastWateringDate = new Date(plant.lastWateringDate);
    updateLastWateredDisplay();
    updateProgressBar();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateElapsedTime, 1000);
  } else {
    lastWateringDate = null;
    updateLastWateredDisplay();
    updateProgressBar();
    clearInterval(timerInterval);
    lastWateredTimeText.textContent = "Nigdy";
    progressBarFill.style.width = "0%";
  }
  renderCalendar();
}

function updateLastWateredDisplay() {
  lastWateredText.textContent = "Ostatnie podlanie";
  // Czas będzie aktualizowany przez timerInterval
}

function updateProgressBar() {
  if (lastWateringDate) {
    const now = new Date();
    const timeSinceWatering = now.getTime() - lastWateringDate.getTime();
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    const progress = Math.min(1, timeSinceWatering / sevenDaysInMillis);
    progressBarFill.style.width = `${progress * 100}%`;
  } else {
    progressBarFill.style.width = "0%";
  }
}

function updateElapsedTime() {
  if (lastWateringDate) {
    const now = new Date();
    const timeDifference = now.getTime() - lastWateringDate.getTime();

    const seconds = Math.floor((timeDifference / 1000) % 60);
    const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    const formattedTime = `${days} dni, ${hours} godzin, ${minutes} minut, ${seconds} sekund`;
    lastWateredTimeText.textContent = formattedTime;
  }
}

// === Funkcje Kalendarza ===
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  currentMonthElement.textContent = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentDate);
  calendarDaysElement.innerHTML = "";

  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("empty");
    calendarDaysElement.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.textContent = day;

    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      dayCell.classList.add("today");
    }

    if (lastWateringDate) {
      const wateredYear = lastWateringDate.getFullYear();
      const wateredMonth = lastWateringDate.getMonth();
      const wateredDay = lastWateringDate.getDate();

      if (
        year === wateredYear &&
        month === wateredMonth &&
        day === wateredDay
      ) {
        dayCell.classList.add("watered");
      }
    }

    calendarDaysElement.appendChild(dayCell);
  }
}

function goToPreviousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function goToNextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// === Funkcje Autoryzacji i API ===
async function getUserInfo() {
  try {
    const response = await fetch("/.auth/me");
    const data = await response.json();
    return data.clientPrincipal;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}

async function updateAuthUI() {
  currentUser = await getUserInfo();

  if (currentUser) {
    userDisplay.textContent = `Logged in as: ${currentUser.userDetails}`;
    loginGithubBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    mainDropdownImage.style.display = "block"; // Pokaż ikonę dropdownu po zalogowaniu
    await fetchPlants(); // Pobierz rośliny po zalogowaniu
  } else {
    userDisplay.textContent = "Not logged in";
    loginGithubBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    mainDropdownImage.style.display = "none"; // Ukryj ikonę dropdownu, jeśli niezalogowany
    plantsDropdownContent.style.display = "none"; // Ukryj zawartość dropdownu
    plantsListUI.innerHTML = "<li>Please log in to see your plants.</li>";
    addPlantLink.style.display = "none"; // Ukryj link "+ Add New Plant"
    plantFormContainer.style.display = "none"; // Ukryj formularz dodawania
    updatePlantDisplay(null); // Resetuj wyświetlanie rośliny
  }
}

async function fetchPlants() {
  if (!currentUser) {
    plantsListUI.innerHTML = "<li>Please log in to see your plants.</li>";
    addPlantLink.style.display = "none";
    plantFormContainer.style.display = "none";
    return;
  }

  try {
    const response = await fetch("/api/GetPlants");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    plants = await response.json(); // Aktualizuj globalną tablicę 'plants'

    plantsListUI.innerHTML = ""; // Wyczyść listę UI

    if (plants.length === 0) {
      addPlantLink.textContent = "+ Add New Plant";
      addPlantLink.style.display = "block"; // Pokaż link dodawania roślin
      plantsListUI.style.display = "none"; // Ukryj ul (bo pusta)
      plantFormContainer.style.display = "none"; // Upewnij się, że formularz jest ukryty
      currentPlantIndex = 0; // Reset index
      updatePlantDisplay(null); // Wyświetl stan "brak roślin"
    } else {
      addPlantLink.textContent = "+ Add New Plant";
      addPlantLink.style.display = "block"; // Pokaż link dodawania roślin
      plantsListUI.style.display = "block"; // Pokaż ul (bo są rośliny)

      // Posortuj rośliny alfabetycznie po nazwie
      plants.sort((a, b) => a.name.localeCompare(b.name));

      plants.forEach((plant, index) => {
        const li = document.createElement("li");
        li.textContent = `${plant.name} (${plant.species})`;
        li.addEventListener("click", () => {
          currentPlantIndex = index;
          updatePlantDisplay(plants[currentPlantIndex]);
          plantsDropdownContent.style.display = "none"; // Zamknij dropdown po wyborze
          plantFormContainer.style.display = "none"; // Ukryj formularz po wyborze
          plantsListUI.style.display = "block"; // Pokaż listę po wyborze rośliny i zamknięciu formularza
        });
        plantsListUI.appendChild(li);
      });
      // Ustaw aktualnie wyświetlaną roślinę na podstawie (np. pierwszej lub zapamiętanej)
      if (currentPlantIndex >= plants.length) {
        currentPlantIndex = 0;
      }
      updatePlantDisplay(plants[currentPlantIndex]);
    }
  } catch (error) {
    console.error("Error fetching plants:", error);
    plantsListUI.innerHTML = "<li>Error loading plants.</li>";
    addPlantLink.style.display = "none";
    plantFormContainer.style.display = "none";
    updatePlantDisplay(null);
  }
}

// === Event Listeners ===

// Obsługa przycisku "Podlej"
waterButton.addEventListener("click", async () => {
  if (plants.length > 0 && plants[currentPlantIndex]) {
    const plantToUpdate = plants[currentPlantIndex];
    plantToUpdate.lastWateringDate = new Date().toISOString(); // Aktualizuj datę lokalnie

    // WAŻNE: Aby zmiana daty podlewania była trwała, musisz zaimplementować funkcję API (np. "/api/UpdatePlant")
    // która zaktualizuje rekord w Azure Table Storage. Bez tego, po odświeżeniu strony, data wróci do poprzedniego stanu.
    // Pamiętaj, że w Azure Table Storage, do aktualizacji potrzebujesz PartitionKey i RowKey.
    // Musisz zmodyfikować swoją funkcję API "AddPlant" aby zapisywała te klucze, lub dodać nową funkcję "UpdatePlant"
    // która je przyjmuje.
    //
    // Przykład (zakładając, że Twoja roślina ma właściwości PartitionKey i RowKey):
    // try {
    //     const response = await fetch('/api/UpdatePlant', { // Musisz stworzyć taką funkcję API
    //         method: 'POST', // lub 'PUT'
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(plantToUpdate)
    //     });
    //     if (!response.ok) throw new Error('Failed to update plant');
    //     console.log('Plant watering date updated successfully in DB.');
    // } catch (error) {
    //     console.error('Error updating plant watering date in DB:', error);
    //     alert('Failed to update watering date permanently.');
    // }

    updatePlantDisplay(plantToUpdate); // Aktualizuj UI natychmiast
  }
});

// Przełączanie roślin
previousPlantButton.addEventListener("click", () => {
  if (plants.length > 0) {
    currentPlantIndex = (currentPlantIndex - 1 + plants.length) % plants.length;
    updatePlantDisplay(plants[currentPlantIndex]);
  }
});

nextPlantButton.addEventListener("click", () => {
  if (plants.length > 0) {
    currentPlantIndex = (currentPlantIndex + 1) % plants.length;
    updatePlantDisplay(plants[currentPlantIndex]);
  }
});

// Kalendarz
prevMonthButton.addEventListener("click", goToPreviousMonth);
nextMonthButton.addEventListener("click", goToNextMonth);

// === Obsługa Dropdownu głównego "Moje roślinki" ===
mainDropdownImage.addEventListener("click", () => {
  // Przełącz widoczność zawartości dropdowna
  plantsDropdownContent.style.display =
    plantsDropdownContent.style.display === "block" ? "none" : "block";

  // Zawsze ukryj formularz i upewnij się, że lista jest widoczna (jeśli są rośliny) po otwarciu/zamknięciu głównego dropdowna
  plantFormContainer.style.display = "none";
  if (plants.length > 0 && plantsDropdownContent.style.display === "block") {
    plantsListUI.style.display = "block";
  } else {
    plantsListUI.style.display = "none"; // Jeśli brak roślin lub dropdown zamknięty
  }
});

// Zamknij dropdown i formularz, jeśli kliknięto poza nimi
window.addEventListener("click", (event) => {
  if (
    !event.target.matches(".dropdown img.undraggable") && // Czy to nie obrazek dropdowna
    !event.target.closest("#plants-dropdown-content") && // Czy to nie wewnątrz dropdowna roślin
    !event.target.closest(".dropdown-left .dropdown-content") // Czy to nie wewnątrz dropdowna Wiki
  ) {
    plantsDropdownContent.style.display = "none";
    plantFormContainer.style.display = "none"; // Ukryj formularz
    if (plants.length > 0) {
      plantsListUI.style.display = "block"; // Przywróć listę, jeśli istnieją rośliny
    }
  }
});

// === Obsługa dodawania roślin z formularza ===
if (addPlantForm) {
  addPlantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("plant-name").value;
    const species = document.getElementById("plant-species").value;
    const description = document.getElementById("plant-description").value;
    const wikipediaUrl =
      document.getElementById("plant-wikipedia-url")?.value || "";
    const coverImageSrc =
      document.getElementById("plant-cover-image")?.value ||
      "src/default_plant.webp";

    try {
      const response = await fetch("/api/AddPlant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          species,
          description,
          wikipediaUrl,
          coverImageSrc,
        }),
      });

      const result = await response.text();
      console.log(result);
      alert(result);

      addPlantForm.reset(); // Wyczyść formularz
      plantFormContainer.style.display = "none"; // Ukryj formularz po dodaniu
      await fetchPlants(); // Odśwież listę roślin i wyświetl nowo dodaną
      plantsDropdownContent.style.display = "none"; // Zamknij dropdown
    } catch (error) {
      console.error("Error adding plant:", error);
      alert("Failed to add plant.");
    }
  });
}

// === Obsługa kliknięcia "+ Add New Plant" ===
addPlantLink.addEventListener("click", (e) => {
  e.preventDefault();
  // Przełącz widoczność formularza
  plantFormContainer.style.display =
    plantFormContainer.style.display === "none" ? "block" : "none";
  // Ukryj listę roślin, gdy formularz jest otwarty
  if (plantFormContainer.style.display === "block") {
    plantsListUI.style.display = "none";
  } else {
    // Jeśli zamykamy formularz, przywróć widoczność listy, jeśli są rośliny
    if (plants.length > 0) {
      plantsListUI.style.display = "block";
    } else {
      plantsListUI.style.display = "none"; // Jeśli brak roślin, nie pokazuj pustej listy
    }
  }
});

// === Inicjalizacja Aplikacji ===
document.addEventListener("DOMContentLoaded", async () => {
  // Obsługa logowania
  loginGithubBtn.addEventListener("click", () => {
    window.location.href = "/.auth/login/github?post_login_redirect_uri=/";
  });

  // Obsługa wylogowania
  logoutBtn.addEventListener("click", () => {
    window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
  });

  updateAuthUI(); // Rozpoczynamy od sprawdzenia autoryzacji
});

// === Dodatkowe zabezpieczenie przed błędami obrazków (opcjonalne) ===
plantCoverImage.onerror = function () {
  this.src = "src/default_plant.webp"; // Domyślny obrazek w razie błędu
  plantBlurImage.src = "src/default_plant.webp";
};

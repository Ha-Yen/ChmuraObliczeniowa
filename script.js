const undraggableImages = document.querySelectorAll(".undraggable");
undraggableImages.forEach((img) => {
  img.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });
});

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

// === Nowe elementy UI dla Dropdownu i Formularza ===
const mainDropdownImage = document.querySelector(".dropdown img.undraggable"); // Obrazek, który otwiera dropdown
const plantsDropdownContent = document.getElementById(
  "plants-dropdown-content"
); // Kontener zawartości dropdowna
const addPlantLink = document.getElementById("add-plant-link"); // "Plusik" do dodawania rośliny
const plantFormContainer = document.getElementById("plant-form-container"); // Kontener formularza dodawania
const plantsListUI = document.getElementById("plants-list"); // Lista roślin wyświetlana w dropdownie UI
const addPlantForm = document.getElementById("add-plant-form"); // Sam formularz
const wikipediaLink = document.querySelector(
  ".dropdown-left .dropdown-content a"
); // Wikipedia link

// === Elementy UI dla Logowania ===
const loginGithubBtn = document.getElementById("login-github");
const logoutBtn = document.getElementById("logout");
const userDisplay = document.getElementById("user-display");

let currentDate = new Date();
let plants = []; // Globalna tablica roślin pobrana z API
let currentPlantIndex = 0;
let timerInterval;
let lastWateringDate = null; // Przechowuje datę ostatniego podlewania dla aktualnie wyświetlanej rośliny
let currentUser = null; // Będziemy przechowywać informacje o zalogowanym użytkowniku

// --- UI Update Functions ---
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
  // updateElapsedTime będzie faktycznie aktualizować czas
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

// === Nowe funkcje uwierzytelniania ===
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
    addPlantLink.style.display = "none";
    plantFormContainer.style.display = "none";
    updatePlantDisplay(null); // Resetuj wyświetlanie rośliny
  }
}

// === Funkcje API (zamieniające Local Storage) ===
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
      addPlantLink.style.display = "block";
      plantsListUI.style.display = "none"; // Ukryj ul
      plantFormContainer.style.display = "none";
      currentPlantIndex = 0; // Reset index
      updatePlantDisplay(null); // Wyświetl stan "brak roślin"
    } else {
      addPlantLink.textContent = "+ Add New Plant";
      addPlantLink.style.display = "block";
      plantsListUI.style.display = "block"; // Pokaż ul

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
        });
        plantsListUI.appendChild(li);
      });
      // Ustaw aktualnie wyświetlaną roślinę na podstawie (np. pierwszej lub zapamiętanej)
      // Jeśli currentPlantIndex jest poza zakresem, zresetuj
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
waterButton.addEventListener("click", async () => {
  // Zmieniamy na async
  if (plants.length > 0 && plants[currentPlantIndex]) {
    const plantToUpdate = plants[currentPlantIndex];
    plantToUpdate.lastWateringDate = new Date().toISOString();

    try {
      // WYWOŁANIE API DO AKTUALIZACJI ROŚLINY (JEŚLI BĘDZIESZ MIAŁ TAKĄ FUNKCJĘ)
      // Na razie, ponieważ Azure Table Storage nie ma prostego "update by rowKey" dla wszystkich pól,
      // musielibyśmy napisać funkcję API do tego.
      // Jeśli chcesz to zrobić, musisz dodać nową funkcję API np. "UpdatePlant".
      // Póki co, zmienimy tylko lokalnie, a po odświeżeniu strony wróci do poprzedniego stanu
      // chyba, że faktycznie dodasz funkcję aktualizacji.
      // Dla uproszczenia na razie po prostu odświeżymy wyświetlanie.

      // Tymczasowo, jeśli chcesz, aby to było trwałe, potrzebujesz funkcji API:
      // const response = await fetch('/api/UpdatePlant', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(plantToUpdate)
      // });
      // if (!response.ok) throw new Error('Failed to update plant');

      updatePlantDisplay(plantToUpdate);
    } catch (error) {
      console.error("Error updating plant watering date:", error);
      alert("Failed to update watering date.");
    }
  }
});

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

// === Obsługa Dropdownu głównego ===
mainDropdownImage.addEventListener("click", () => {
  // Przełącz widoczność zawartości dropdowna
  plantsDropdownContent.style.display =
    plantsDropdownContent.style.display === "block" ? "none" : "block";
  // Upewnij się, że formularz jest ukryty po otwarciu/zamknięciu głównego dropdowna
  plantFormContainer.style.display = "none";
});

// Zamknij dropdown, jeśli kliknięto poza nim
window.addEventListener("click", (event) => {
  if (
    !event.target.matches(".dropdown img.undraggable") &&
    !event.target.closest(".dropdown-content")
  ) {
    plantsDropdownContent.style.display = "none";
  }
});

// === Obsługa dodawania roślin z formularza ===
if (addPlantForm) {
  addPlantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("plant-name").value;
    const species = document.getElementById("plant-species").value;
    const description = document.getElementById("plant-description").value;

    // Tutaj dodajemy Wikipedia URL i Cover Image SRC
    // Możesz pozwolić użytkownikowi na wpisanie tego, lub ustawić domyślne.
    // Na potrzeby demo, dodajmy domyślne/puste wartości.
    const wikipediaUrl =
      document.getElementById("plant-wikipedia-url")?.value || ""; // Dodaj to pole do HTML jeśli chcesz by user podawał
    const coverImageSrc =
      document.getElementById("plant-cover-image")?.value ||
      "src/default_plant.webp"; // Dodaj to pole do HTML jeśli chcesz by user podawał

    try {
      const response = await fetch("/api/AddPlant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          species,
          description,
          wikipediaUrl, // Dodaj do wysyłanych danych
          coverImageSrc, // Dodaj do wysyłanych danych
        }),
      });

      const result = await response.text();
      console.log(result);
      alert(result);

      addPlantForm.reset(); // Wyczyść formularz
      plantFormContainer.style.display = "none"; // Ukryj formularz po dodaniu
      await fetchPlants(); // Odśwież listę roślin
      // Zamknij dropdown po dodaniu, jeśli jest otwarty
      plantsDropdownContent.style.display = "none";
    } catch (error) {
      console.error("Error adding plant:", error);
      alert("Failed to add plant.");
    }
  });
}

// === Obsługa kliknięcia "plusika" (linku "Add New Plant") ===
addPlantLink.addEventListener("click", (e) => {
  e.preventDefault();
  // Przełącz widoczność formularza
  plantFormContainer.style.display =
    plantFormContainer.style.display === "none" ? "block" : "none";
  // Ukryj listę roślin, gdy formularz jest otwarty (opcjonalnie)
  if (plantFormContainer.style.display === "block") {
    plantsListUI.style.display = "none";
  } else {
    // Jeśli zamykamy formularz, przywróć widoczność listy, jeśli są rośliny
    if (plants.length > 0) {
      plantsListUI.style.display = "block";
    }
  }
});

// === Inicjalizacja Aplikacji ===
document.addEventListener("DOMContentLoaded", async () => {
  // Usuń wywołania związane z Local Storage
  // plants = getSavedPlants();
  // currentPlantIndex = getSavedCurrentPlantIndex();

  updateAuthUI(); // Rozpoczynamy od sprawdzenia autoryzacji

  // Ponieważ fetchPlants jest wywoływane w updateAuthUI,
  // reszta logiki inicjalizacji roślin zostanie wykonana tam.

  // Event listeners dla kalendarza
  prevMonthButton.addEventListener("click", goToPreviousMonth);
  nextMonthButton.addEventListener("click", goToNextMonth);
});

// === Dodatkowe zabezpieczenie przed błędami obrazków (opcjonalne) ===
plantCoverImage.onerror = function () {
  this.src = "src/default_plant.webp"; // Domyślny obrazek w razie błędu
  plantBlurImage.src = "src/default_plant.webp";
};

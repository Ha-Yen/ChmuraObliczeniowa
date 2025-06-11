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
const plantBlurImage = (document = document.querySelector(
  ".image-container .blur"
));
const previousPlantButton = document.querySelector(
  ".buttons button:nth-child(1)"
);
const nextPlantButton = document.querySelector(".buttons button:nth-child(3)");

// === Elementy UI dla Dropdownu i Formularza Roślin ===
const mainDropdownImage = document.querySelector(".dropdown img.undraggable");
const plantsDropdownContent = document.getElementById(
  "plants-dropdown-content"
);
const addPlantLink = document.getElementById("add-plant-link");
const plantFormContainer = document.getElementById("plant-form-container");
const plantsListUI = document.getElementById("plants-list");
const addPlantForm = document.getElementById("add-plant-form");

// === Elementy UI dla Logowania i Linku Wikipedia ===
const wikipediaLink = document.getElementById("wikipedia-link");
const loginGithubBtn = document.getElementById("login-github");
const logoutBtn = document.getElementById("logout");
const userDisplay = document.getElementById("user-display");

// NOWE SELEKTORY DLA ZMIANY DATY PODLEWANIA
const wateringDateInput = document.getElementById("watering-date-input");
const saveWateringDateBtn = document.getElementById("save-watering-date-btn");

// NOWE SELEKTORY DLA PÓL FORMULARZA DODAWANIA ROŚLIN (aby uniknąć kolizji ID)
const addPlantNameInput = document.getElementById("add-plant-name");
const addPlantSpeciesInput = document.getElementById("add-plant-species");
const addPlantDescriptionInput = document.getElementById(
  "add-plant-description"
);
const addPlantWikipediaUrlInput = document.getElementById(
  "add-plant-wikipedia-url"
);
const addPlantCoverImageInput = document.getElementById(
  "add-plant-cover-image"
);

// === Zmienne Stanu Globalnego ===
let currentDate = new Date();
let plants = [];
let currentPlantIndex = 0;
let timerInterval;
let lastWateringDate = null;
let currentUser = null;

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
    plantCoverImage.src = "src/default_plant.webp";
    plantBlurImage.src = "src/default_plant.webp";
    wikipediaLink.href = "#";
    wikipediaLink.target = "_self";
    wateringDateInput.value = ""; // Clear date input
    renderCalendar();
    return;
  }

  plantNameElement.textContent = plant.name;
  plantSpeciesElement.textContent = plant.species;
  plantCoverImage.src = plant.coverImageSrc || "src/default_plant.webp";
  plantBlurImage.src = plant.coverImageSrc || "src/default_plant.webp";
  wikipediaLink.href = plant.wikipediaUrl || "#";
  wikipediaLink.target = plant.wikipediaUrl ? "_blank" : "_self";

  if (plant.lastWateringDate) {
    lastWateringDate = new Date(plant.lastWateringDate);
    // Set date input value to last watered date
    const yyyy = lastWateringDate.getFullYear();
    const mm = String(lastWateringDate.getMonth() + 1).padStart(2, "0"); // Months start at 0!
    const dd = String(lastWateringDate.getDate()).padStart(2, "0");
    wateringDateInput.value = `${yyyy}-${mm}-${dd}`;

    updateLastWateredDisplay();
    updateProgressBar();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateElapsedTime, 1000);
  } else {
    lastWateringDate = null;
    wateringDateInput.value = ""; // Clear date input
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
    mainDropdownImage.style.display = "block"; // Show dropdown icon after login
    await fetchPlants(); // Fetch plants after login
  } else {
    userDisplay.textContent = "Not logged in";
    loginGithubBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    mainDropdownImage.style.display = "none"; // Hide dropdown icon if not logged in
    plantsDropdownContent.style.display = "none"; // Hide dropdown content
    plantsListUI.innerHTML = "<li>Please log in to see your plants.</li>";
    addPlantLink.style.display = "none"; // Hide "+ Add New Plant" link
    plantFormContainer.style.display = "none"; // Hide add form
    updatePlantDisplay(null); // Reset plant display
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
    plants = await response.json(); // Update global 'plants' array

    plantsListUI.innerHTML = ""; // Clear UI list

    if (plants.length === 0) {
      addPlantLink.textContent = "+ Add New Plant";
      addPlantLink.style.display = "block"; // Show add plant link
      plantsListUI.style.display = "none"; // Hide ul (because it's empty)
      plantFormContainer.style.display = "none"; // Ensure form is hidden
      currentPlantIndex = 0; // Reset index
      updatePlantDisplay(null); // Display "no plants" state
    } else {
      addPlantLink.textContent = "+ Add New Plant";
      addPlantLink.style.display = "block"; // Show add plant link
      plantsListUI.style.display = "block"; // Show ul (because there are plants)

      // Sort plants alphabetically by name
      plants.sort((a, b) => a.name.localeCompare(b.name));

      plants.forEach((plant, index) => {
        const li = document.createElement("li");
        li.textContent = plant.name; // Display only plant name

        li.addEventListener("click", () => {
          currentPlantIndex = index; // Update index
          updatePlantDisplay(plants[currentPlantIndex]); // Display clicked plant
          plantsDropdownContent.style.display = "none"; // Close dropdown
          plantFormContainer.style.display = "none"; // Hide form
        });
        plantsListUI.appendChild(li);
      });
      // Set the currently displayed plant based on (e.g., first or remembered)
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

// NEW FUNCTION: Updates the watering date in the database
async function updatePlantWateringDateInDb(plant, newDateISOString) {
  if (!plant || !plant.PartitionKey || !plant.RowKey) {
    console.error(
      "Invalid plant object or missing PartitionKey/RowKey for update."
    );
    alert("Cannot update plant: missing identifier.");
    return;
  }

  try {
    const response = await fetch("/api/UpdatePlant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        PartitionKey: plant.PartitionKey,
        RowKey: plant.RowKey,
        lastWateringDate: newDateISOString,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}. Details: ${errorText}`
      );
    }

    const result = await response.text();
    console.log("Update response:", result);
    alert("Watering date updated successfully!"); // SUCCESS ALERT ADDED HERE

    // After successful database update, update the object locally
    plant.lastWateringDate = newDateISOString;
    updatePlantDisplay(plant); // Refresh UI
    await fetchPlants(); // Refresh the entire list to ensure data consistency
  } catch (error) {
    console.error("Error updating plant watering date:", error);
    alert(`Failed to update watering date: ${error.message}`);
  }
}

// === Event Listeners ===

// Handle "Water" button (sets date to NOW)
waterButton.addEventListener("click", async () => {
  if (plants.length > 0 && plants[currentPlantIndex]) {
    const plantToUpdate = plants[currentPlantIndex];
    const newDate = new Date().toISOString();
    await updatePlantWateringDateInDb(plantToUpdate, newDate);
  }
});

// Handle "Save Date" button (from date input)
saveWateringDateBtn.addEventListener("click", async () => {
  if (plants.length === 0 || !plants[currentPlantIndex]) {
    alert("Please select a plant first.");
    return;
  }

  const newDateValue = wateringDateInput.value; // Format 'YYYY-MM-DD'
  if (!newDateValue) {
    alert("Please select a date.");
    return;
  }

  // Convert 'YYYY-MM-DD' to ISO string (UTC)
  const newDate = new Date(newDateValue);
  // To avoid timezone issues, set time to 00:00 UTC
  // or to 12:00 (noon) to not revert to previous day in some zones.
  newDate.setHours(12, 0, 0, 0); // Set to noon to minimize timezone errors
  const newDateISOString = newDate.toISOString();

  const plantToUpdate = plants[currentPlantIndex];
  await updatePlantWateringDateInDb(plantToUpdate, newDateISOString);
});

// Switch plants
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

// Calendar
prevMonthButton.addEventListener("click", goToPreviousMonth);
nextMonthButton.addEventListener("click", goToNextMonth);

// === Handle main dropdown "My Plants" ===
mainDropdownImage.addEventListener("click", () => {
  plantsDropdownContent.style.display =
    plantsDropdownContent.style.display === "block" ? "none" : "block";

  plantFormContainer.style.display = "none";
  if (plants.length > 0 && plantsDropdownContent.style.display === "block") {
    plantsListUI.style.display = "block";
  } else {
    plantsListUI.style.display = "none";
  }
});

// Close dropdown and form if clicked outside
window.addEventListener("click", (event) => {
  if (
    !event.target.matches(".dropdown img.undraggable") &&
    !event.target.closest("#plants-dropdown-content") &&
    !event.target.closest(".dropdown-left .dropdown-content")
  ) {
    plantsDropdownContent.style.display = "none";
    plantFormContainer.style.display = "none";
    if (plants.length > 0) {
      plantsListUI.style.display = "block";
    }
  }
});

// === Handle adding plants from the form ===
if (addPlantForm) {
  addPlantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    // Use new, unique selectors for form fields
    const name = addPlantNameInput.value;
    const species = addPlantSpeciesInput.value;
    const description = addPlantDescriptionInput.value;
    const wikipediaUrl = addPlantWikipediaUrlInput?.value || "";
    const coverImageSrc =
      addPlantCoverImageInput?.value || "src/default_plant.webp";

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

      addPlantForm.reset();
      plantFormContainer.style.display = "none";
      await fetchPlants();
      plantsDropdownContent.style.display = "none";
    } catch (error) {
      console.error("Error adding plant:", error);
      alert("Failed to add plant.");
    }
  });
}

// === Handle clicking "+ Add New Plant" ===
addPlantLink.addEventListener("click", (e) => {
  e.preventDefault();
  plantFormContainer.style.display =
    plantFormContainer.style.display === "none" ? "block" : "none";
  if (plantFormContainer.style.display === "block") {
    plantsListUI.style.display = "none";
  } else {
    if (plants.length > 0) {
      plantsListUI.style.display = "block";
    } else {
      plantsListUI.style.display = "none";
    }
  }
});

// === Initialize Application ===
document.addEventListener("DOMContentLoaded", async () => {
  loginGithubBtn.addEventListener("click", () => {
    window.location.href = "/.auth/login/github?post_login_redirect_uri=/";
  });

  logoutBtn.addEventListener("click", () => {
    window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
  });

  updateAuthUI();
});

// === Additional image error handling (optional) ===
plantCoverImage.onerror = function () {
  this.src = "src/default_plant.webp";
  plantBlurImage.src = "src/default_plant.webp";
};

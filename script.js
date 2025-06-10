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
const plantListDropdown = document.querySelector(".dropdown .dropdown-content");
const wikipediaLink = document.querySelector(
  ".dropdown-left .dropdown-content a"
); // Select the Wikipedia link

let currentDate = new Date();
let plants = [];
let currentPlantIndex = 0;
let timerInterval;

// --- Local Storage Functions ---
function savePlants() {
  localStorage.setItem("plants", JSON.stringify(plants));
}

function getSavedPlants() {
  const savedPlants = localStorage.getItem("plants");
  return savedPlants
    ? JSON.parse(savedPlants)
    : [
        {
          name: "Marlena",
          species: "Monstera deliciosa",
          lastWateringDate: new Date().toISOString(),
          coverImageSrc: "src/monstera_deliciosa_1.webp",
          wikipediaUrl: "https://en.wikipedia.org/wiki/Monstera_deliciosa", // Add Wikipedia URL
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
}

function saveCurrentPlantIndex() {
  localStorage.setItem("currentPlantIndex", currentPlantIndex);
}

function getSavedCurrentPlantIndex() {
  const savedIndex = localStorage.getItem("currentPlantIndex");
  return savedIndex ? parseInt(savedIndex) : 0;
}

// --- UI Update Functions ---
function updatePlantDisplay(plant) {
  plantNameElement.textContent = plant.name;
  plantSpeciesElement.textContent = plant.species;
  plantCoverImage.src = plant.coverImageSrc;
  plantBlurImage.src = plant.coverImageSrc;
  wikipediaLink.href = plant.wikipediaUrl;
  wikipediaLink.target = "_blank";

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
  if (lastWateringDate) {
    // The actual time elapsed will be updated by the timer
  } else {
    lastWateredTimeText.textContent = "Nigdy";
  }
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
  console.log("Previous month button clicked");
  currentDate.setMonth(currentDate.getMonth() - 1);
  console.log("Current date:", currentDate);
  renderCalendar();
  console.log("Calendar rendered");
}

function goToNextMonth() {
  console.log("Next month button clicked");
  currentDate.setMonth(currentDate.getMonth() + 1);
  console.log("Current date:", currentDate);
  renderCalendar();
  console.log("Calendar rendered");
}

function populatePlantListDropdown() {
  plantListDropdown.innerHTML = "";
  plants.forEach((plant, index) => {
    const plantLink = document.createElement("a");
    plantLink.href = "#";
    plantLink.textContent = plant.name;
    plantLink.addEventListener("click", () => {
      currentPlantIndex = index;
      saveCurrentPlantIndex();
      updatePlantDisplay(plants[currentPlantIndex]);
      const dropdown = document.querySelector(".dropdown");
      dropdown.classList.remove("show");
    });
    plantListDropdown.appendChild(plantLink);
  });
}

// --- Event Listeners ---
waterButton.addEventListener("click", () => {
  if (plants.length > 0 && plants[currentPlantIndex]) {
    plants[currentPlantIndex].lastWateringDate = new Date().toISOString();
    savePlants();
    updatePlantDisplay(plants[currentPlantIndex]);
  }
});

previousPlantButton.addEventListener("click", () => {
  if (plants.length > 0) {
    currentPlantIndex = (currentPlantIndex - 1 + plants.length) % plants.length;
    saveCurrentPlantIndex();
    updatePlantDisplay(plants[currentPlantIndex]);
  }
});

nextPlantButton.addEventListener("click", () => {
  if (plants.length > 0) {
    currentPlantIndex = (currentPlantIndex + 1) % plants.length;
    saveCurrentPlantIndex();
    updatePlantDisplay(plants[currentPlantIndex]);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  plants = getSavedPlants();
  currentPlantIndex = getSavedCurrentPlantIndex();

  populatePlantListDropdown();

  if (plants.length > 0) {
    updatePlantDisplay(plants[currentPlantIndex]);
  } else {
    plantNameElement.textContent = "No Plants";
    plantSpeciesElement.textContent = "Add a plant!";
    lastWateredTimeText.textContent = "N/A";
    progressBarFill.style.width = "0%";
    renderCalendar();
  }
});

prevMonthButton.addEventListener("click", goToPreviousMonth);
nextMonthButton.addEventListener("click", goToNextMonth);

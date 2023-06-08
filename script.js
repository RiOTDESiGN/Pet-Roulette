// Define the API endpoint and your client credentials
const apiUrl = "https://api.petfinder.com/v2/animals?type=dog&limit=1";
const clientId = "0p8duAQLok7mUuRzJ62ACRSGRLauWR75FSJOe7xAczpixI5zTb";
const clientSecret = "711daZoBhFRzq0mlplbHnnRXVNRme5HOI6sncjf8";

// Global variables
let currentPage = 1;
let totalPages = 1;

// Function to retrieve the access token
async function getAccessToken() {
  const tokenUrl = "https://api.petfinder.com/v2/oauth2/token";
  const formData = new URLSearchParams();
  formData.append("grant_type", "client_credentials");
  formData.append("client_id", clientId);
  formData.append("client_secret", clientSecret);

  const response = await fetch(tokenUrl, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  return data.access_token;
}

// Function to fetch data from the API using the access token and page number
async function fetchData(pageNumber) {
  const accessToken = await getAccessToken();

  const headers = {
    Authorization: `Bearer ${accessToken}`
  };

  const apiUrlWithPage = `${apiUrl}&page=${pageNumber}`;

  const response = await fetch(apiUrlWithPage, {
    headers
  });

  const data = await response.json();
  return data;
}

// Function to get the next page of results
async function getNextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    await fetchAnimals();
  }
}

// Function to get the previous page of results
async function getPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    await fetchAnimals();
  }
}

function loadingScreen() {
    const loadingScreenElement = document.getElementById("loading-screen");
    const spinner = document.getElementById("spinner");
    const sourceDiv = document.getElementById("api-results");
    const targetDiv = document.getElementById("loading-screen");
    const sourceDivHeight = sourceDiv.offsetHeight;
    loadingScreenElement.classList.add("loading");
    spinner.classList.add("spinner");
    targetDiv.style.height = `${sourceDivHeight}px`;
    setTimeout(function () {
        loadingScreenElement.classList.remove("loading");
        spinner.classList.remove("spinner");
        targetDiv.style.height = "0px";
    }, 1600);
  }  

function decodeHTMLEntities(text) {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(`<!doctype html><body>${text}`, "text/html").body.textContent;

    if (decodedString === "null") {
        return "No description available at this time."
    }

    return decodedString;
  }

// Function to display the API results in a user-friendly format, filtering results with no images
function displayResults(data) {
  const apiResultsDiv = document.getElementById("api-results");

  while (apiResultsDiv.firstChild) {
    apiResultsDiv.removeChild(apiResultsDiv.firstChild);
  }
  
  data.animals.forEach((animal) => {
    const animalCard = document.createElement("div");
    animalCard.classList.add("animal-card");

    const img = document.createElement("img");
    img.src = animal.photos.length > 0 ? animal.photos[0].medium : "no-image.jpg";
    animalCard.appendChild(img);

    const attributesCard = document.createElement("div");
    attributesCard.classList.add("name");

    if (animal.gender === "Male") {
        animal.gender = "Mr.";
    } else {
        animal.gender = "Miss";
    }

    const type = document.createElement("p");
    type.textContent = animal.gender + " " + animal.name + ", the " + animal.type;
    attributesCard.appendChild(type);

    animalCard.appendChild(attributesCard);

    const descriptionDiv = document.createElement("div");
    descriptionDiv.classList.add("description");

    const description = document.createElement("p");
    description.innerHTML = this.decodeHTMLEntities(animal.description);
    descriptionDiv.appendChild(description);
    animalCard.appendChild(descriptionDiv);

    const attributesList = document.createElement("ul");
    for (const attribute in animal.attributes) {
        if (animal.attributes[attribute]) {
        const listItem = document.createElement("li");
        listItem.textContent = attribute.replace("_", " ");
        attributesList.appendChild(listItem);
        }
    }
    descriptionDiv.appendChild(attributesList);

    const tags = document.createElement("p");
    let tagsString = "";
    animal.tags.forEach((tag) => {
      tagsString += tag + ", ";
    });
    tags.textContent = tagsString.slice(0, -2); // Remove the trailing comma and space
    descriptionDiv.appendChild(tags);

    apiResultsDiv.appendChild(animalCard);
  });

  // Update pagination information
  currentPage = data.pagination.current_page;
  totalPages = data.pagination.total_pages;

  const paginationDiv = document.getElementById("pagination");
  paginationDiv.classList.add("pagination");
  while (paginationDiv.firstChild) {
    paginationDiv.removeChild(paginationDiv.firstChild);
  }

  // Create and append the previous button
  if (data.pagination._links.previous) {
    const previousButton = document.createElement("button");
    previousButton.textContent = "Previous";
    previousButton.addEventListener("click", function() {
      getPreviousPage();
      loadingScreen();
    });
    paginationDiv.appendChild(previousButton);
  }  

  // Create and append the next button
  if (data.pagination._links.next) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.addEventListener("click", function() {
      getNextPage();
      loadingScreen();
    });
    paginationDiv.appendChild(nextButton);
  }  
}

// Function to fetch animals based on the current page
async function fetchAnimals() {
  try {
    const apiData = await fetchData(currentPage);
    displayResults(apiData);
  } catch (error) {
    console.log("Error:", error);
  }
}

// Call fetchAnimals() to initiate the API request and display the initial results
fetchAnimals();
// --- DOM Elements ---
// Getting references to all the necessary HTML elements.
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const recipeResults = document.getElementById('recipeResults');
const popularRecipeResults = document.getElementById('popularRecipeResults');
const message = document.getElementById('message');
const loader = document.getElementById('loader');
const recipeModal = document.getElementById('recipeModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');

// --- API Endpoints ---
// URLs for the TheMealDB API.
const SEARCH_API = 'https://www.themealdb.com/api/json/v1/1/filter.php?i=';
const LOOKUP_API = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

// --- Event Listeners ---

// Listen for DOM content to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', loadPopularRecipes);

// Attaches the searchRecipes function to the search button's click event.
searchBtn.addEventListener('click', searchRecipes);

// Allows users to press the "Enter" key in the search bar to initiate a search.
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchRecipes();
    }
});

// Hides the modal when the close button (×) is clicked.
closeModal.addEventListener('click', () => {
    recipeModal.classList.add('hidden');
});

// Hides the modal if the user clicks on the dark background overlay.
recipeModal.addEventListener('click', (event) => {
    if (event.target === recipeModal) {
        recipeModal.classList.add('hidden');
    }
});


// --- Functions ---

/**
 * Loads a predefined list of popular recipes on page load.
 */
async function loadPopularRecipes() {
    const popularIds = ['52771', '52805', '52806', '52854', '52856']; // Arrabiata, Chicken Biryani, Tandoori Chicken, Pancakes, Apple Pie
    
    // Create placeholder cards for loading state
    popularRecipeResults.innerHTML = popularIds.map(() => `
        <div class="bg-white rounded-lg shadow-md p-4">
            <div class="bg-gray-200 h-40 rounded-md animate-pulse"></div>
            <div class="mt-4 bg-gray-200 h-6 w-3/4 rounded animate-pulse"></div>
        </div>
    `).join('');

    const recipePromises = popularIds.map(id => fetch(`${LOOKUP_API}${id}`).then(res => res.json()));

    try {
        const results = await Promise.all(recipePromises);
        const meals = results.map(result => result.meals[0]);
        displayPopularRecipes(meals);
    } catch (error) {
        console.error('Error loading popular recipes:', error);
        popularRecipeResults.innerHTML = '<p class="text-center text-red-500 col-span-full">Could not load popular recipes.</p>';
    }
}

/**
 * Displays the list of popular recipe cards.
 * @param {Array} meals - An array of meal objects from the API.
 */
function displayPopularRecipes(meals) {
    popularRecipeResults.innerHTML = meals.map(meal => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 cursor-pointer" data-id="${meal.idMeal}">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-48 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x400/e2e8f0/4a5568?text=Image+Not+Found';">
            <div class="p-4">
                <h3 class="font-semibold text-lg text-gray-800">${meal.strMeal}</h3>
            </div>
        </div>
    `).join('');

    // Add a click event listener to each newly created recipe card.
    popularRecipeResults.querySelectorAll('.cursor-pointer').forEach(card => {
        card.addEventListener('click', () => {
            const mealId = card.dataset.id;
            getRecipeDetails(mealId);
        });
    });
}


/**
 * Fetches recipes from the API based on the ingredient in the search input.
 */
async function searchRecipes() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showMessage('Please enter an ingredient.');
        return;
    }

    // Show the loading spinner and clear any previous results or messages.
    loader.classList.remove('hidden');
    recipeResults.innerHTML = '';
    message.classList.add('hidden');
    document.getElementById('popular-recipes').classList.add('hidden'); // Hide popular section

    try {
        // Fetch a list of meals containing the ingredient.
        const response = await fetch(`${SEARCH_API}${searchTerm}`);
        const data = await response.json();

        if (data.meals) {
            displayRecipes(data.meals);
        } else {
            showMessage(`No recipes found for "${searchTerm}". Please try another ingredient.`);
        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
        showMessage('An error occurred. Please try again later.');
    } finally {
        // Hide the loading spinner after the search is complete.
        loader.classList.add('hidden');
    }
}

/**
 * Displays the list of recipe cards on the page.
 * @param {Array} meals - An array of meal objects from the API.
 */
function displayRecipes(meals) {
    recipeResults.innerHTML = meals.map(meal => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 cursor-pointer" data-id="${meal.idMeal}">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-48 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x400/e2e8f0/4a5568?text=Image+Not+Found';">
            <div class="p-4">
                <h3 class="font-semibold text-lg text-gray-800">${meal.strMeal}</h3>
            </div>
        </div>
    `).join('');

    // Add a click event listener to each newly created recipe card.
    recipeResults.querySelectorAll('.cursor-pointer').forEach(card => {
        card.addEventListener('click', () => {
            const mealId = card.dataset.id;
            getRecipeDetails(mealId);
        });
    });
}

/**
 * Fetches the full details of a specific recipe by its ID and displays them in the modal.
 * @param {string} mealId - The unique ID of the meal.
 */
async function getRecipeDetails(mealId) {
    // Show the modal with a loading state while fetching details.
    modalTitle.textContent = 'Loading Recipe...';
    modalContent.innerHTML = '<div class="text-center p-8"><div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>';
    recipeModal.classList.remove('hidden');

    try {
        // Fetch the complete details for the selected meal.
        const response = await fetch(`${LOOKUP_API}${mealId}`);
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
            displayRecipeDetails(data.meals[0]);
        } else {
            throw new Error('Recipe details not found.');
        }
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        modalTitle.textContent = 'Error';
        modalContent.innerHTML = '<p class="text-center text-red-500">Could not load recipe details. Please try again.</p>';
    }
}

/**
 * Renders the detailed recipe information inside the modal.
 * @param {Object} meal - The full meal object with all details.
 */
function displayRecipeDetails(meal) {
    modalTitle.textContent = meal.strMeal;

    // Create a list of ingredients and their measurements.
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        // The API stores ingredients in fields from strIngredient1 to strIngredient20.
        if (meal[`strIngredient${i}`]) {
            ingredients.push(`
                <li class="flex items-center">
                    <span class="font-semibold w-1/2">${meal[`strIngredient${i}`]}</span>
                    <span>${meal[`strMeasure${i}`]}</span>
                </li>
            `);
        } else {
            // Stop looping if there are no more ingredients.
            break;
        }
    }

    // Populate the modal with the recipe's image, details, ingredients, and instructions.
    modalContent.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-64 object-cover rounded-md mb-4" onerror="this.onerror=null;this.src='https://placehold.co/600x400/e2e8f0/4a5568?text=Image+Not+Found';">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Category</h3>
                <p class="text-gray-700">${meal.strCategory}</p>
            </div>
            <div>
                <h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Area</h3>
                <p class="text-gray-700">${meal.strArea}</p>
            </div>
        </div>

        <h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Ingredients</h3>
        <ul class="list-disc list-inside space-y-2 mb-4 pl-4">
            ${ingredients.join('')}
        </ul>

        <h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Instructions</h3>
        <p class="text-gray-700 whitespace-pre-wrap">${meal.strInstructions}</p>

        ${meal.strYoutube ? `
        <div class="mt-6">
            <h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Video Recipe</h3>
            <div class="aspect-w-16 aspect-h-9">
                 <iframe src="https://www.youtube.com/embed/${meal.strYoutube.slice(-11)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        </div>
        ` : ''}
    `;
}

/**
 * Displays a message to the user (e.g., an error or "not found" message).
 * @param {string} text - The message to display.
 */
function showMessage(text) {
    message.textContent = text;
    message.classList.remove('hidden');
    recipeResults.innerHTML = ''; // Clear any existing results
}

// Populate the area and category dropdowns when the page loads
window.addEventListener("DOMContentLoaded", function () {
  // Get the area select element
  const areaSelect = document.getElementById("area-select");
  areaSelect.innerHTML = '<option value="">Select Area</option>';

  // Get the category select element
  const categorySelect = document.getElementById("category-select");
  categorySelect.innerHTML = '<option value="">Select Category</option>';

  // Fetch areas from the API
  fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list")
    .then((response) => response.json())
    .then((data) => {
      if (data.meals) {
        data.meals.forEach((areaObj) => {
          const option = document.createElement("option");
          option.value = areaObj.strArea;
          option.textContent = areaObj.strArea;
          areaSelect.appendChild(option);
        });
      }
    });

  // Fetch categories from the API
  fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
    .then((response) => response.json())
    .then((data) => {
      if (data.meals) {
        data.meals.forEach((catObj) => {
          const option = document.createElement("option");
          option.value = catObj.strCategory;
          option.textContent = catObj.strCategory;
          categorySelect.appendChild(option);
        });
      }
    });
});

// Helper function to fetch and display meals based on area and/or category
async function fetchAndDisplayMeals() {
  const area = document.getElementById("area-select").value;
  const category = document.getElementById("category-select").value;
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = ""; // Clear previous results

  // If neither area nor category is selected, do nothing
  if (!area && !category) return;

  try {
    let url = "";
    // If both area and category are selected, fetch all meals for area, then filter by category
    if (area && category) {
      url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(
        area
      )}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.meals) {
        // Now filter these meals by category by fetching details for each meal
        // (API does not support filtering by both at once)
        const filteredMeals = [];
        for (const meal of data.meals) {
          const detailResponse = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
          );
          const detailData = await detailResponse.json();
          if (
            detailData.meals &&
            detailData.meals[0].strCategory === category
          ) {
            filteredMeals.push(detailData.meals[0]);
          }
        }
        if (filteredMeals.length > 0) {
          filteredMeals.forEach((mealInfo) => {
            // Show each filtered meal
            renderMealCard(mealInfo, resultsDiv);
          });
        } else {
          resultsDiv.textContent = "No meals found for this area and category.";
        }
      } else {
        resultsDiv.textContent = "No meals found for this area.";
      }
    } else if (area) {
      // Only area selected
      url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(
        area
      )}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.meals) {
        data.meals.forEach((meal) => {
          renderMealCard(meal, resultsDiv);
        });
      } else {
        resultsDiv.textContent = "No meals found for this area.";
      }
    } else if (category) {
      // Only category selected
      url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(
        category
      )}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.meals) {
        data.meals.forEach((meal) => {
          renderMealCard(meal, resultsDiv);
        });
      } else {
        resultsDiv.textContent = "No meals found for this category.";
      }
    }
  } catch (error) {
    resultsDiv.textContent = "Error fetching meals.";
  }
}

// Helper function to render a meal card and add click event for details
function renderMealCard(meal, resultsDiv) {
  // Create a div for each meal
  const mealDiv = document.createElement("div");
  mealDiv.className = "meal";

  // Create and add the meal title
  const title = document.createElement("h3");
  title.textContent = meal.strMeal;

  // Create and add the meal image
  const img = document.createElement("img");
  img.src = meal.strMealThumb;
  img.alt = meal.strMeal;

  mealDiv.appendChild(title);
  mealDiv.appendChild(img);

  // Add a click event to fetch and show meal details
  mealDiv.addEventListener("click", async () => {
    try {
      // Always fetch details to get full info (ingredients, instructions, etc.)
      const detailResponse = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
      );
      const detailData = await detailResponse.json();
      if (detailData.meals && detailData.meals[0]) {
        const mealInfo = detailData.meals[0];

        // Build a list of ingredients and measures
        let ingredientsList = "";
        for (let i = 1; i <= 20; i++) {
          const ingredient = mealInfo[`strIngredient${i}`];
          const measure = mealInfo[`strMeasure${i}`];
          if (ingredient && ingredient.trim() !== "") {
            ingredientsList += `<li>${ingredient} - ${measure}</li>`;
          }
        }

        // Render the detailed recipe information to the page
        resultsDiv.innerHTML = `
          <div class="meal-detail">
            <h2>${mealInfo.strMeal}</h2>
            <img src="${mealInfo.strMealThumb}" alt="${mealInfo.strMeal}" style="width:300px; border-radius:8px;">
            <h3>Ingredients:</h3>
            <ul>${ingredientsList}</ul>
            <h3>Instructions:</h3>
            <p>${mealInfo.strInstructions}</p>
            <button id="back-btn">Back to results</button>
          </div>
        `;

        // Add a back button to return to the meal list
        const backBtn = document.getElementById("back-btn");
        backBtn.addEventListener("click", () => {
          fetchAndDisplayMeals();
        });
      } else {
        resultsDiv.textContent = "No details found.";
      }
    } catch (error) {
      resultsDiv.textContent = "Error fetching meal details.";
    }
  });

  resultsDiv.appendChild(mealDiv);
}

// Listen for changes on area and category selects
document.getElementById("area-select").addEventListener("change", fetchAndDisplayMeals);
document.getElementById("category-select").addEventListener("change", fetchAndDisplayMeals);

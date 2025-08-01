let movieData = [];
let filteredMovies = [];

async function fetchMovies() {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxS6G2hpt2Lsl4esplUzyPY3PsduRHoaKzW6vQyaKW0EPkxuaaXevG_SAy3EZtbUkSx/exec?type=movie"
    );
    const data = await response.json();
    movieData = Array.isArray(data) ? data : data.records || [];
    filteredMovies = [...movieData];
    console.log('Fetched movie data:', movieData);
    populateFilters();
    renderMovies(filteredMovies);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('movieResults').style.display = 'block';
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function populateFilters() {
  const genreSet = new Set();
  const yearSet = new Set();
  const directorSet = new Set();
  const ratingSet = new Set();

  movieData.forEach((movie) => {
    if (movie.genre) {
      movie.genre.split(",").forEach((g) => genreSet.add(g.trim()));
    }
    if (movie.year) yearSet.add(movie.year);
    if (movie.director) directorSet.add(movie.director);
    if (movie.rating) ratingSet.add(movie.rating);
  });

  addOptions("#genreFilter", Array.from(genreSet).sort());
  addOptions("#yearFilter", Array.from(yearSet).sort((a, b) => b - a));
  addOptions("#directorFilter", Array.from(directorSet).sort());
  addOptions("#ratingFilter", Array.from(ratingSet).sort((a, b) => b - a));
}

function addOptions(selector, values) {
  const select = document.querySelector(selector);
  if (!select) return;
  // Clear existing options except the first (e.g. "All Genres")
  select.length = 1;

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function filterMovies() {
  const genre = document.querySelector("#genreFilter").value.toLowerCase();
  const director = document.querySelector("#directorFilter").value.toLowerCase();
  const year = document.querySelector("#yearFilter").value;
  const rating = document.querySelector("#ratingFilter").value;
  const search = document.querySelector("#titleSearch").value.toLowerCase();

  filteredMovies = movieData.filter((movie) => {
    const genres = movie.genre ? movie.genre.toLowerCase() : '';

    const genreMatch = !genre || genres.includes(genre);
    const directorMatch = !director || (movie.director && movie.director.toLowerCase().includes(director));
    const yearMatch = !year || movie.year === year;
    const ratingMatch = !rating || movie.rating === rating;
    const searchMatch =
      !search ||
      (movie.title && movie.title.toLowerCase().includes(search)) ||
      (movie.director && movie.director.toLowerCase().includes(search));

    return genreMatch && directorMatch && yearMatch && ratingMatch && searchMatch;
  });

  renderMovies(filteredMovies);
}

function renderMovies(data) {
  const container = document.getElementById("movieResults");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = '<p class="text-white text-center py-8">No movies found.</p>';
    return;
  }

  // Create a grid container for all movies
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  data.forEach(movie => {
    const item = document.createElement("div");
    item.innerHTML = createMovieCard(movie);
    // Append only the inner card element (firstChild)
    grid.appendChild(item.firstElementChild);
  });

  container.appendChild(grid);
}

function getMovieRatingClass(rating) {
  if (rating == 10) return 'border-l-4 border-blue-400 bg-blue-900 text-indigo-100';
  if (rating >= 8) return 'border-l-4 border-green-500 bg-green-900';
  if (rating >= 5) return 'border-l-4 border-yellow-300 bg-yellow-800';
  return 'border-l-4 border-red-600 bg-red-900';
}

function createMovieCard(movie) {
  const ratingValue = Number(movie.rating);
  return `
    <div class="p-4 rounded shadow transition-transform transform hover:scale-[1.02] hover:shadow-lg ${getMovieRatingClass(ratingValue)}">
      <div class="text-center mb-2">
        <div class="text-lg font-bold text-blue-200">
          <a href="${movie.imdb_link || '#'}" target="_blank" class="text-cyan-400 hover:text-cyan-600 hover:underline">
            ${movie.title}
          </a>
        </div>
        <div class="text-base text-blue-300">${movie.director}</div>
      </div>
      <div class="text-center text-slate-300"><strong>Genre:</strong> ${movie.genre || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Year:</strong> ${movie.year || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Rating:</strong> ${movie.rating || 'N/A'}/10</div>
    </div>
  `;
}

function groupBy(arr, key) {
  return arr.reduce((acc, obj) => {
    const group = obj[key] || "Unknown";
    if (!acc[group]) acc[group] = [];
    acc[group].push(obj);
    return acc;
  }, {});
}

document.addEventListener("DOMContentLoaded", fetchMovies);

document.querySelectorAll("#genreFilter, #directorFilter, #yearFilter, #ratingFilter").forEach(el =>
  el.addEventListener("change", filterMovies)
);

document.querySelector("#titleSearch").addEventListener("input", filterMovies);

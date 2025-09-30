let gameData = [];
let filteredGames = [];
const filters = {
  title: '',
  developer: '',
  publisher: '',
  genre: '',
  year: '',
  rating: ''
};

async function fetchGames() {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxS6G2hpt2Lsl4esplUzyPY3PsduRHoaKzW6vQyaKW0EPkxuaaXevG_SAy3EZtbUkSx/exec?type=game"
    );
    const data = await response.json();
    gameData = Array.isArray(data) ? data : data.records || [];
    filteredGames = [...gameData];
    console.log('Fetched game data:', gameData);
    populateFilters();
    renderGames(filteredGames);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    const resultsEl = document.getElementById('gameResults');
    if (resultsEl) resultsEl.style.display = 'block';
  } catch (error) {
    console.error("Error fetching game data:", error);
  }
}

function populateFilters() {
  const genreSet = new Set();
  const yearSet = new Set();
  const developerSet = new Set();
  const publisherSet = new Set();
  const ratingSet = new Set();

  gameData.forEach((game) => {
    if (game.genre) game.genre.split(",").forEach(g => genreSet.add(g.trim()));
    if (game.year) yearSet.add(game.year);
    if (game.developer) developerSet.add(game.developer);
    if (game.publisher) publisherSet.add(game.publisher);
    if (game.rating) ratingSet.add(game.rating);
  });

  addOptions("#genreFilter", Array.from(genreSet).sort());
  addOptions("#yearFilter", Array.from(yearSet).sort((a,b)=>b-a));
  addOptions("#developerFilter", Array.from(developerSet).sort());
  addOptions("#publisherFilter", Array.from(publisherSet).sort());
  addOptions("#ratingFilter", Array.from(ratingSet).sort((a,b)=>b-a));
}

function addOptions(selector, values) {
  const select = document.querySelector(selector);
  if (!select) return;
  select.length = 1; // Keep first option (e.g., "All Genres")
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function applyFilters() {
  filteredGames = gameData.filter(game => {
    const titleMatch = !filters.title || (game.title && game.title.toLowerCase().includes(filters.title.toLowerCase()));
    const developerMatch = !filters.developer || (game.developer && game.developer.toLowerCase().includes(filters.developer.toLowerCase()));
    const genreMatch = !filters.genre || (game.genre && game.genre.toLowerCase().includes(filters.genre.toLowerCase()));
    const publisherMatch = !filters.publisher || (game.publisher && game.publisher.toLowerCase().includes(filters.publisher.toLowerCase()));
    const yearMatch = !filters.year || (game.year && game.year.toString().includes(filters.year));
    const ratingMatch = !filters.rating || (game.rating && game.rating.toString() === filters.rating.toString());

    return titleMatch && developerMatch && genreMatch && publisherMatch && yearMatch && ratingMatch;
  });

  renderGames(filteredGames);
}

function renderGames(data) {
  const container = document.getElementById("gameResults");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = '<p class="text-white text-center py-8">No games found.</p>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  data.forEach(game => {
    const item = document.createElement("div");
    item.innerHTML = createGameCard(game);
    grid.appendChild(item.firstElementChild);
  });

  container.appendChild(grid);
}

function getGameRatingClass(rating) {
  const num = Number(rating);
  if (num === 10) return 'border-l-4 border-blue-400 bg-blue-900 text-indigo-100';
  if (num >= 8) return 'border-l-4 border-green-500 bg-green-900';
  if (num >= 5) return 'border-l-4 border-yellow-300 bg-yellow-800';
  return 'border-l-4 border-red-600 bg-red-900';
}

function createGameCard(game) {
  const ratingValue = Number(game.rating);
  return `
    <div class="p-4 rounded shadow transition-transform transform hover:scale-[1.02] hover:shadow-lg ${getGameRatingClass(ratingValue)}">
      <div class="text-center mb-2">
        <div class="text-lg font-bold text-blue-200">${game.title}</div>
        <div class="text-base text-blue-300">${game.developer}</div>
      </div>
      <div class="text-center text-slate-300"><strong>Genre:</strong> ${game.genre || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Type:</strong> ${game.publisher || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Year:</strong> ${game.year || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Series:</strong> ${game.series || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Rating:</strong> ${game.rating || 'N/A'}</div>
    </div>
  `;
}

// Event listeners
document.addEventListener("DOMContentLoaded", fetchGames);

document.getElementById("titleFilter").addEventListener("input", e => { filters.title = e.target.value; applyFilters(); });
document.getElementById("developerFilter").addEventListener("input", e => { filters.developer = e.target.value; applyFilters(); });
document.getElementById("publisherFilter").addEventListener("change", e => { filters.publisher = e.target.value; applyFilters(); });
document.getElementById("genreFilter").addEventListener("change", e => { filters.genre = e.target.value; applyFilters(); });
document.getElementById("yearFilter").addEventListener("change", e => { filters.year = e.target.value; applyFilters(); });
document.getElementById("ratingFilter").addEventListener("change", e => { filters.rating = e.target.value; applyFilters(); });
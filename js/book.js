let bookData = [];
let filteredBooks = [];
const filters = {
  title: '',
  author: '',
  genre: '',
  type: '',
  year: '',
  rating: ''
};

async function fetchBooks() {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxS6G2hpt2Lsl4esplUzyPY3PsduRHoaKzW6vQyaKW0EPkxuaaXevG_SAy3EZtbUkSx/exec?type=book"
    );
    const data = await response.json();
    bookData = Array.isArray(data) ? data : data.records || [];
    filteredBooks = [...bookData];
    console.log('Fetched book data:', bookData);
    populateFilters();
    renderBooks(filteredBooks);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    const resultsEl = document.getElementById('bookResults');
    if (resultsEl) resultsEl.style.display = 'block';
  } catch (error) {
    console.error("Error fetching book data:", error);
  }
}

function populateFilters() {
  const genreSet = new Set();
  const yearSet = new Set();
  const authorSet = new Set();
  const typeSet = new Set();
  const ratingSet = new Set();

  bookData.forEach((book) => {
    if (book.genre) book.genre.split(",").forEach(g => genreSet.add(g.trim()));
    if (book.year) yearSet.add(book.year);
    if (book.author) authorSet.add(book.author);
    if (book.book_type) typeSet.add(book.book_type);
    if (book.rating) ratingSet.add(book.rating);
  });

  addOptions("#genreFilter", Array.from(genreSet).sort());
  addOptions("#yearFilter", Array.from(yearSet).sort((a,b)=>b-a));
  addOptions("#authorFilter", Array.from(authorSet).sort());
  addOptions("#typeFilter", Array.from(typeSet).sort());
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
  filteredBooks = bookData.filter(book => {
    const titleMatch = !filters.title || (book.title && book.title.toLowerCase().includes(filters.title.toLowerCase()));
    const authorMatch = !filters.author || (book.author && book.author.toLowerCase().includes(filters.author.toLowerCase()));
    const genreMatch = !filters.genre || (book.genre && book.genre.toLowerCase().includes(filters.genre.toLowerCase()));
    const typeMatch = !filters.type || (book.book_type && book.book_type.toLowerCase().includes(filters.type.toLowerCase()));
    const yearMatch = !filters.year || (book.year && book.year.toString().includes(filters.year));
    const ratingMatch = !filters.rating || (book.rating && book.rating.toString() === filters.rating.toString());

    return titleMatch && authorMatch && genreMatch && typeMatch && yearMatch && ratingMatch;
  });

  renderBooks(filteredBooks);
}

function renderBooks(data) {
  const container = document.getElementById("bookResults");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = '<p class="text-white text-center py-8">No books found.</p>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  data.forEach(book => {
    const item = document.createElement("div");
    item.innerHTML = createBookCard(book);
    grid.appendChild(item.firstElementChild);
  });

  container.appendChild(grid);
}

function getBookRatingClass(rating) {
  const num = Number(rating);
  if (num === 10) return 'border-l-4 border-blue-400 bg-blue-900 text-indigo-100';
  if (num >= 8) return 'border-l-4 border-green-500 bg-green-900';
  if (num >= 5) return 'border-l-4 border-yellow-300 bg-yellow-800';
  return 'border-l-4 border-red-600 bg-red-900';
}

function createBookCard(book) {
  const ratingValue = Number(book.rating);
  return `
    <div class="p-4 rounded shadow transition-transform transform hover:scale-[1.02] hover:shadow-lg ${getBookRatingClass(ratingValue)}">
      <div class="text-center mb-2">
        <div class="text-lg font-bold text-blue-200">${book.title}</div>
        <div class="text-base text-blue-300">${book.author}</div>
      </div>
      <div class="text-center text-slate-300"><strong>Genre:</strong> ${book.genre || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Type:</strong> ${book.book_type || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Year:</strong> ${book.year || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Rating:</strong> ${book.rating || 'N/A'}/10</div>
      <div class="text-center text-slate-300"><strong>Series:</strong> ${book.series || 'N/A'}</div>
      <div class="text-center text-slate-300"><strong>Number in Series:</strong> ${book.number || 'N/A'}</div>
    </div>
  `;
}

// Event listeners
document.addEventListener("DOMContentLoaded", fetchBooks);

document.getElementById("titleFilter").addEventListener("input", e => { filters.title = e.target.value; applyFilters(); });
document.getElementById("authorFilter").addEventListener("input", e => { filters.author = e.target.value; applyFilters(); });
document.getElementById("genreFilter").addEventListener("change", e => { filters.genre = e.target.value; applyFilters(); });
document.getElementById("typeFilter").addEventListener("change", e => { filters.type = e.target.value; applyFilters(); });
document.getElementById("yearFilter").addEventListener("change", e => { filters.year = e.target.value; applyFilters(); });
document.getElementById("ratingFilter").addEventListener("change", e => { filters.rating = e.target.value; applyFilters(); });

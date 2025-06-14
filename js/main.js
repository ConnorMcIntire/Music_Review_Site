const reviewsContainer = document.getElementById('reviewsContainer');
const artistFilter = document.getElementById('artistFilter');
const albumFilter = document.getElementById('albumFilter');
const ratingFilter = document.getElementById('ratingFilter');
const songSearch = document.getElementById('songSearch');
const loadingEl = document.getElementById('loading');

let reviews = [];

// Normalize artist name (trim, lowercase)
function normalizeArtist(artist) {
  return artist.trim().toLowerCase();
}

// Parse all artists from artist string (split on commas and feat/ft)
function parseArtists(artistString) {
  if (!artistString) return [];
  // Replace 'feat.' or 'ft.' with comma, lowercase for consistency
  let cleaned = artistString.toLowerCase();
  cleaned = cleaned.replace(/\sfeat\.?\s/g, ',').replace(/\sft\.?\s/g, ',');
  // Split on commas and trim
  const parts = cleaned.split(',').map(a => a.trim()).filter(a => a.length > 0);
  return parts;
}

// Get main artist (first artist before comma or feat)
function getMainArtist(artistString) {
  if (!artistString) return '';
  // Split by 'feat' or ',' and get first
  let mainPart = artistString.toLowerCase().split(/,|\sfeat\.?|\sft\.?/)[0];
  return mainPart.trim();
}

function populateFilters() {
  const allArtists = new Set();
  reviews.forEach(r => {
    const artists = parseArtists(r.artist);
    artists.forEach(a => allArtists.add(a));
  });

  const albums = [...new Set(reviews.map(r => r.album).filter(a => a))];

  const artistOptions = document.getElementById('artistOptions');
  const albumOptions = document.getElementById('albumOptions');

  artistOptions.innerHTML = '';
  albumOptions.innerHTML = '';

  [...allArtists].sort().forEach(artist => {
    const opt = document.createElement('option');
    opt.value = artist;
    artistOptions.appendChild(opt);
  });

  albums.sort().forEach(album => {
    const opt = document.createElement('option');
    opt.value = album;
    albumOptions.appendChild(opt);
  });
}

function getRatingClass(rating) {
  if (rating == 10) return 'rating-cyan';
  if (rating >= 8) return 'rating-green';
  if (rating >= 5) return 'rating-yellow';
  return 'rating-red';
}

function renderListView(filtered) {
  if (filtered.length === 0) {
    reviewsContainer.innerHTML = `<p class="no-results">No reviews match your filters.</p>`;
    return;
  }

  reviewsContainer.innerHTML = filtered.map(r => `
    <div class="review ${getRatingClass(Number(r.rating))}">
      <div class="review-header">
        <div class="song">
          <a href="${r.spotify_link || '#'}" target="_blank" rel="noopener noreferrer">${r.song}</a>
        </div>
        <div class="artist">${r.artist}</div>
      </div>
      <div><strong>Album:</strong> ${r.album || 'N/A'}</div>
      <div><strong>Rating:</strong> ${r.rating}/10</div>
    </div>
  `).join('');
}

function renderGridViewFromData(filteredData) {
  // artistGroups will map normalized artist -> all songs this artist appears on (main or feature)
  const artistGroups = {};
  const artistDisplayNameMap = {}; // normalized artist -> nicely capitalized name

  filteredData.forEach(song => {
    const allArtists = parseArtists(song.artist);
    const mainArtist = normalizeArtist(getMainArtist(song.artist));

    allArtists.forEach(artistNorm => {
      if (!artistGroups[artistNorm]) {
        artistGroups[artistNorm] = new Set();
        artistDisplayNameMap[artistNorm] = artistNorm
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      artistGroups[artistNorm].add(song);
    });
  });

  // Convert Sets to arrays, remove duplicates automatically
  for (const artist in artistGroups) {
    artistGroups[artist] = Array.from(artistGroups[artist]);
  }

  // Sort artists alphabetically by display name
  const sortedArtists = Object.keys(artistGroups).sort((a, b) => {
    return artistDisplayNameMap[a].localeCompare(artistDisplayNameMap[b]);
  });

  if (sortedArtists.length === 0) {
    reviewsContainer.innerHTML = `<p class="no-results">No reviews match your filters.</p>`;
    return;
  }

  reviewsContainer.innerHTML = sortedArtists.map(artistNorm => {
    const songs = artistGroups[artistNorm];

    // Group songs by album for this artist
    const albumsGrouped = songs.reduce((acc, song) => {
      const albumName = song.album || 'Unknown Album';
      if (!acc[albumName]) acc[albumName] = [];
      acc[albumName].push(song);
      return acc;
    }, {});

    const sortedAlbums = Object.keys(albumsGrouped).sort((a, b) => a.localeCompare(b));

    const albumsHTML = sortedAlbums.map(album => `
      <div style="margin: 0.5rem 0;">
        <div style="font-weight: 600; color: #93c5fd;">${album}</div>
        <div style="margin-left: 1rem;">
          ${albumsGrouped[album].map(r => `
            <div style="margin: 0.3rem 0;">
              <a href="${r.spotify_link || '#'}" target="_blank" style="color:#06b6d4">${r.song}</a>
              <span style="color:#cbd5e1"> (${r.rating}/10)</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    return `
      <div class="review" style="cursor: pointer;">
        <div class="review-header">
          <div class="artist">${artistDisplayNameMap[artistNorm]}</div>
        </div>
        <div class="song-list" style="display: none; margin-left: 1rem;">
          ${albumsHTML}
        </div>
      </div>
    `;
  }).join('');

  // Add toggle click functionality
  document.querySelectorAll('.review').forEach(div => {
    div.addEventListener('click', () => {
      const list = div.querySelector('.song-list');
      if (list) {
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
      }
    });
  });
}

function renderReviews() {
  const filtered = reviews.filter(r => {
    const artistsOnSong = parseArtists(r.artist);
    const artistFilterVal = artistFilter.value.trim().toLowerCase();

    const artistMatch = !artistFilterVal || artistsOnSong.some(a => a.includes(artistFilterVal));
    const albumMatch = !albumFilter.value || (r.album && r.album.toLowerCase().includes(albumFilter.value.toLowerCase()));
    const ratingMatch = !ratingFilter.value || r.rating === ratingFilter.value;
    const songMatch = !songSearch.value || r.song.toLowerCase().includes(songSearch.value.toLowerCase());

    return artistMatch && albumMatch && ratingMatch && songMatch;
  });

  if (window.currentView === 'grid') {
    renderGridViewFromData(filtered);
  } else {
    renderListView(filtered);
  }
}

// Fetch data from Google Sheets
async function fetchReviews() {
  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbxS6G2hpt2Lsl4esplUzyPY3PsduRHoaKzW6vQyaKW0EPkxuaaXevG_SAy3EZtbUkSx/exec');
    const data = await res.json();
    reviews = data.reviews || data;
    populateFilters();
    renderReviews();
  } catch (err) {
    reviewsContainer.innerHTML = `<p>Error loading reviews: ${err.message}</p>`;
  } finally {
    loadingEl.style.display = 'none';
    reviewsContainer.style.display = 'flex';
  }
}

artistFilter.addEventListener('input', renderReviews);
albumFilter.addEventListener('input', renderReviews);
ratingFilter.addEventListener('change', renderReviews);
songSearch.addEventListener('input', renderReviews);

window.currentView = 'list';

const toggleBtn = document.getElementById('toggleViewBtn');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    window.currentView = window.currentView === 'list' ? 'grid' : 'list';
    toggleBtn.textContent = window.currentView === 'list' ? 'View Artists' : 'All Songs';
    renderReviews();
  });

  // Set initial label
  toggleBtn.textContent = window.currentView === 'list' ? 'View Artists' : 'All Songs';
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(fetchReviews, 100);
});

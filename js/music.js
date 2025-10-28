window.addEventListener('DOMContentLoaded', () => {
  const reviewsContainer = document.getElementById('reviewsContainer');
  const artistFilter = document.getElementById('artistFilter');
  const albumFilter = document.getElementById('albumFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const songSearch = document.getElementById('songSearch');
  const loadingEl = document.getElementById('loading');
  const resultCount = document.getElementById('resultCount');

  let reviews = [];

  // Helpers
  function normalizeArtist(artist) {
    return artist.trim().toLowerCase();
  }

  function parseArtists(artistString) {
    if (!artistString) return [];
    return artistString
      .toLowerCase()
      .replace(/\sfeat\.?\s/g, ',')
      .replace(/\sft\.?\s/g, ',')
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
  }

  function getMainArtist(artistString) {
    if (!artistString) return '';
    return artistString.toLowerCase().split(/,|\sfeat\.?|\sft\.?/)[0].trim();
  }

  function getRatingStyle(rating) {
  if (rating == 10) return 'border-left:4px solid #60A5FA; background:#1E3A8A; color:#E0E7FF;';
  if (rating == 9) return 'border-left:4px solid #15803D; background:#14532D; color:#D1FAE5;';
  if (rating >=7 && rating <=8) return 'border-left:4px solid #4ADE80; background:#166534; color:#D1FAE5;';
  if (rating >=5 && rating <=6) return 'border-left:4px solid #aea000c7; background:#aea000c7; color:#FEF3C7;';
  if (rating >=3 && rating <=4) return 'border-left:4px solid #F97316; background:#7C2D12; color:#FFEDD5;';
  return 'border-left:4px solid #DC2626; background:#7F1D1D; color:#FEE2E2;';
}


  function renderListView(filtered) {
    if (filtered.length === 0) {
      reviewsContainer.innerHTML = `<p class="text-center text-slate-400 italic py-8">No reviews match your filters.</p>`;
      return;
    }

    reviewsContainer.innerHTML = filtered.map(r => `
      <div class="p-4 rounded shadow transition-transform transform hover:scale-[1.02] hover:shadow-lg" style="${getRatingStyle(Number(r.rating))}">
        <div class="text-center mb-2">
          <div class="text-lg font-bold text-blue-200">
            <a href="${r.spotify_link || '#'}" target="_blank" class="text-cyan-400 hover:text-cyan-600 hover:underline">${r.song}</a>
          </div>
          <div class="text-base text-blue-300">${r.artist}</div>
        </div>
        <div class="text-center text-slate-300"><strong>Album:</strong> ${r.album || 'N/A'}</div>
        <div class="text-center text-slate-300"><strong>Rating:</strong> ${r.rating}/10</div>
      </div>
    `).join('');
  }

  function renderGridViewFromData(filteredData) {
    const artistGroups = {};
    const artistDisplayNameMap = {};

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

    for (const artist in artistGroups) {
      artistGroups[artist] = Array.from(artistGroups[artist]);
    }

    const sortedArtists = Object.keys(artistGroups).sort((a, b) =>
      artistDisplayNameMap[a].localeCompare(artistDisplayNameMap[b])
    );

    if (sortedArtists.length === 0) {
      reviewsContainer.innerHTML = `<p class="text-center text-slate-400 italic py-8">No reviews match your filters.</p>`;
      return;
    }

    reviewsContainer.innerHTML = sortedArtists.map(artistNorm => {
      const songs = artistGroups[artistNorm];

      const albumsGrouped = songs.reduce((acc, song) => {
        const albumName = song.album || 'Unknown Album';
        if (!acc[albumName]) acc[albumName] = [];
        acc[albumName].push(song);
        return acc;
      }, {});

      const sortedAlbums = Object.keys(albumsGrouped).sort();

      const albumsHTML = sortedAlbums.map(album => `
      <div class="my-4 text-center">
        <div class="font-semibold text-blue-300 text-lg mb-1">${album}</div>
        <div class="flex flex-col items-center gap-1">
          ${albumsGrouped[album].map(r => `
            <div>
              <a href="${r.spotify_link || '#'}" target="_blank" class="text-cyan-400 hover:text-cyan-600">${r.song}</a>
              <span class="text-slate-300"> (${r.rating}/10)</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

      return `
      <div class="p-4 rounded shadow cursor-pointer" style="${getRatingStyle(Number(r.rating))}">
        <div class="text-center mb-2 text-lg font-bold text-blue-300">${artistDisplayNameMap[artistNorm]}</div>
        <div class="song-list max-h-0 overflow-hidden transition-all duration-300 ease-in-out">${albumsHTML}</div>
      </div>
    `;
    }).join('');

    // Toggle show/hide
    document.querySelectorAll('.song-list').forEach((list) => {
      const container = list.parentElement;
      container.addEventListener('click', () => {
        if (list.classList.contains('max-h-0')) {
          list.classList.remove('max-h-0');
          list.classList.add('max-h-full');
        } else {
          list.classList.remove('max-h-full');
          list.classList.add('max-h-0');
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
      const ratingMatch = !ratingFilter.value || Number(r.rating) === Number(ratingFilter.value);
      const songMatch = !songSearch.value || r.song.toLowerCase().includes(songSearch.value.toLowerCase());

      return artistMatch && albumMatch && ratingMatch && songMatch;
    });

    // Show result count
    resultCount.textContent = `${filtered.length} song${filtered.length !== 1 ? 's' : ''} found`;

    if (window.currentView === 'grid') {
      renderGridViewFromData(filtered);
    } else {
      renderListView(filtered);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbxS6G2hpt2Lsl4esplUzyPY3PsduRHoaKzW6vQyaKW0EPkxuaaXevG_SAy3EZtbUkSx/exec');
      const data = await res.json();
      reviews = data.reviews || data;

      renderReviews();
    } catch (err) {
      reviewsContainer.innerHTML = `<p class="text-red-400 text-center mt-4">Error loading reviews: ${err.message}</p>`;
    } finally {
      loadingEl.style.display = 'none';
      reviewsContainer.classList.remove('hidden');
    }
  }

  // Event listeners
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

    toggleBtn.textContent = 'View Artists';
  }

  setTimeout(fetchReviews, 100);
});

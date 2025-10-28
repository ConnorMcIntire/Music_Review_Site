window.addEventListener('DOMContentLoaded', () => {
  const reviewsContainer = document.getElementById('reviewsContainer');
  const artistFilter = document.getElementById('artistFilter');
  const albumFilter = document.getElementById('albumFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const songSearch = document.getElementById('songSearch');
  const loadingEl = document.getElementById('loading');
  const resultCount = document.getElementById('resultCount');

  let reviews = [];
  window.currentView = 'list';

  // Helpers
  function normalize(str) {
    return (str == null) ? '' : String(str).trim().toLowerCase();
  }
  
  function parseArtists(artistString) {
    if (!artistString) return [];
    return artistString
      .toLowerCase()
      .replace(/\sfeat\.?\s|\sft\.?\s/g, ',')
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
    if (rating >= 7 && rating <= 8) return 'border-left:4px solid #4ADE80; background:#166534; color:#D1FAE5;';
    if (rating >= 5 && rating <= 6) return 'border-left:4px solid #9e920fff; background:#9e920fff; color:#FEF3C7;';
    if (rating >= 3 && rating <= 4) return 'border-left:4px solid #F97316; background:#7C2D12; color:#FFEDD5;';
    return 'border-left:4px solid #DC2626; background:#7F1D1D; color:#FEE2E2;';
  }

  // Render List View
  function renderListView(filtered) {
    if (!filtered.length) {
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

  // Render Grid View (now: Albums view)
  function renderGridViewFromData(filteredData) {
    try {
      // drop invalid items and remove entries that are singles (so they don't appear as albums)
      filteredData = (filteredData || [])
        .filter(it => it && typeof it === 'object')
        .filter(song => {
          const albumLower = String((song && song.album) || '').trim().toLowerCase();
          return !(albumLower === 'single' || albumLower === 'singles' || /^single\b/.test(albumLower));
        });
 
      const albumsMap = {};

      filteredData.forEach(song => {
        const albumRaw = song && song.album;
        const albumName = (albumRaw == null) ? 'Unknown Album' : String(albumRaw);
        const artistRaw = song && song.artist;
        const mainArtist = getMainArtist(String(artistRaw || '')) || 'Various Artists';
        const albumKey = `${normalize(albumName)}|${normalize(mainArtist)}`;

        if (!albumsMap[albumKey]) {
          const displayArtist = String(mainArtist)
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          albumsMap[albumKey] = {
            displayAlbum: String(albumName),
            displayArtist,
            songs: []
          };
        }
        albumsMap[albumKey].songs.push(song);
      });

      const sortedAlbumKeys = Object.keys(albumsMap).sort((a, b) => {
        const A = String(albumsMap[a].displayAlbum || '').toLowerCase();
        const B = String(albumsMap[b].displayAlbum || '').toLowerCase();
        if (A === B) return String(albumsMap[a].displayArtist || '').localeCompare(String(albumsMap[b].displayArtist || ''));
        return A.localeCompare(B);
      });

      if (!sortedAlbumKeys.length) {
        reviewsContainer.innerHTML = `<p class="text-center text-slate-400 italic py-8">No reviews match your filters.</p>`;
        return;
      }

      reviewsContainer.innerHTML = sortedAlbumKeys.map(key => {
        const group = albumsMap[key];
        const songs = group.songs || [];

        const total = songs.reduce((sum, s) => sum + (Number(s && s.rating) || 0), 0);
        const avg = songs.length ? (total / songs.length) : 0;
        const avgDisplay = Math.round(avg * 10) / 10;

        const songsHTML = songs.map(r => {
          const title = (r && r.song) ? String(r.song) : 'Untitled';
          const rating = (r && (r.rating != null)) ? r.rating : 'N/A';
          const spotify = (r && r.spotify_link) ? r.spotify_link : '#';
          return `
            <div>
              <a href="${spotify}" target="_blank" class="text-cyan-400 hover:text-cyan-600">${title}</a>
              <span class="text-slate-300"> (${rating}/10)</span>
            </div>
          `;
        }).join('');

        return `
          <div class="p-4 rounded shadow cursor-pointer" style="${getRatingStyle(Math.round(avg))}">
            <div class="text-center mb-1">
              <div class="text-lg font-bold text-blue-300">
                ${group.displayAlbum} <span class="text-sm text-slate-300">(${avgDisplay}/10)</span>
              </div>
              <div class="text-sm text-slate-400">${group.displayArtist}</div>
            </div>
            <div class="song-list max-h-0 overflow-hidden transition-all duration-300 ease-in-out flex flex-col items-center gap-2 text-center">
              ${songsHTML}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.song-list').forEach(list => {
        const container = list.parentElement;
        container.addEventListener('click', () => {
          list.classList.toggle('max-h-0');
          list.classList.toggle('max-h-full');
        });
      });
    } catch (err) {
      console.error('renderGridViewFromData failed', err, { filteredData });
      reviewsContainer.innerHTML = `<p class="text-red-400 text-center mt-4">Render error: ${err.message}</p>`;
    }
  }

  // Render Reviews with Filters
  function renderReviews() {
    const artistVal = normalize(artistFilter.value);
    const albumVal = normalize(albumFilter.value);
    const ratingVal = ratingFilter.value;
    const songVal = normalize(songSearch.value);

    const filtered = reviews.filter(r => {
      const artistsOnSong = parseArtists(r.artist);
      const artistMatch = !artistVal || artistsOnSong.some(a => a.includes(artistVal));
      const albumMatch = !albumVal || (r.album && normalize(r.album).includes(albumVal));
      const ratingMatch = !ratingVal || Number(r.rating) === Number(ratingVal);
      const songMatch = !songVal || normalize(r.song).includes(songVal);

      return artistMatch && albumMatch && ratingMatch && songMatch;
    });

    if (window.currentView === 'albums') {
      const albumKeys = new Set((filtered || [])
        .filter(r => {
          const albumLower = String((r && r.album) || '').trim().toLowerCase();
          return !(albumLower === 'single' || albumLower === 'singles' || /^single\b/.test(albumLower));
        })
        .map(r => `${normalize(r && r.album ? r.album : 'Unknown Album')}|${normalize(getMainArtist(r && r.artist ? r.artist : '') || 'Various Artists')}`)
      );
      resultCount.textContent = `${albumKeys.size} album${albumKeys.size !== 1 ? 's' : ''} found`;
    } else {
      resultCount.textContent = `${filtered.length} song${filtered.length !== 1 ? 's' : ''} found`;
    }

    // show albums view when currentView is 'albums'
    if (window.currentView === 'albums') renderGridViewFromData(filtered);
    else renderListView(filtered);
  }

  // Fetch Reviews from Google Script
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

  // Event Listeners
  artistFilter.addEventListener('input', renderReviews);
  albumFilter.addEventListener('input', renderReviews);
  ratingFilter.addEventListener('change', renderReviews);
  songSearch.addEventListener('input', renderReviews);

  const toggleBtn = document.getElementById('toggleViewBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      window.currentView = window.currentView === 'list' ? 'albums' : 'list';
      toggleBtn.textContent = window.currentView === 'list' ? 'View Albums' : 'All Songs';
      renderReviews();
    });
    toggleBtn.textContent = 'View Albums';
  }

  setTimeout(fetchReviews, 100);
});

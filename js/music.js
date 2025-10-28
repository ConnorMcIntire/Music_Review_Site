window.addEventListener('DOMContentLoaded', () => {
  const reviewsContainer = document.getElementById('reviewsContainer');
  const artistFilter = document.getElementById('artistFilter');
  const albumFilter = document.getElementById('albumFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const songSearch = document.getElementById('songSearch');
  const loadingEl = document.getElementById('loading');
  const resultCount = document.getElementById('resultCount');
  const albumSort = document.getElementById('albumSort');
  const songSort = document.getElementById('songSort');
  const songSortLabel = document.getElementById('songSortLabel');
  const albumSortLabel = document.getElementById('albumSortLabel');
  
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
     // copy incoming array and sort according to the songSort control (only affects songs view)
    const sortMode = (songSort && songSort.value) || 'rating-desc';
    const sorted = Array.isArray(filtered) ? filtered.slice() : [];

    if (sortMode === 'rating-desc') {
      sorted.sort((a, b) => (Number(b && b.rating) || 0) - (Number(a && a.rating) || 0) || String(a && a.song || '').localeCompare(String(b && b.song || '')));
    } else if (sortMode === 'rating-asc') {
      sorted.sort((a, b) => (Number(a && a.rating) || 0) - (Number(b && b.rating) || 0) || String(a && a.song || '').localeCompare(String(b && b.song || '')));
    } else if (sortMode === 'title-asc') {
      sorted.sort((a, b) => String(a && a.song || '').localeCompare(String(b && b.song || '')));
    } else if (sortMode === 'title-desc') {
      sorted.sort((a, b) => String(b && b.song || '').localeCompare(String(a && a.song || '')));
    } else if (sortMode === 'artist-asc') {
      sorted.sort((a, b) => (String(getMainArtist(a && a.artist) || '').localeCompare(String(getMainArtist(b && b.artist) || ''))) || String(a && a.song || '').localeCompare(String(b && b.song || '')));
    }

    // now continue with existing rendering logic but use `sorted` instead of `filtered`
    if (!sorted.length) {
      reviewsContainer.innerHTML = `<p class="text-center text-slate-400 italic py-8">No reviews match your filters.</p>`;
      return;
    }

    reviewsContainer.innerHTML = sorted.map(r => `
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
      filteredData = (filteredData || []).filter(it => it && typeof it === 'object');
      const albumsMap = {};
      filteredData.forEach(song => {
        const albumRaw = song && song.album;
        const albumName = (albumRaw == null) ? 'Unknown Album' : String(albumRaw).trim();
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

      // build albums array with computed averages, then sort according to UI
      const albums = Object.keys(albumsMap).map(key => {
        const g = albumsMap[key];
        const songs = g.songs || [];
        const total = songs.reduce((sum, s) => sum + (Number(s && s.rating) || 0), 0);
        const avg = songs.length ? (total / songs.length) : 0;
        return {
          key,
          displayAlbum: String(g.displayAlbum || ''),
          displayArtist: String(g.displayArtist || ''),
          songs,
          avg
        };
      });
      
      const sortMode = (albumSort && albumSort.value) || 'avg-desc';
      if (sortMode === 'avg-desc') albums.sort((a, b) => b.avg - a.avg || a.displayAlbum.localeCompare(b.displayAlbum));
      else if (sortMode === 'avg-asc') albums.sort((a, b) => a.avg - b.avg || a.displayAlbum.localeCompare(b.displayAlbum));
      else if (sortMode === 'album-asc') albums.sort((a, b) => a.displayAlbum.localeCompare(b.displayAlbum));
      else if (sortMode === 'album-desc') albums.sort((a, b) => b.displayAlbum.localeCompare(a.displayAlbum));
      else if (sortMode === 'artist-asc') albums.sort((a, b) => a.displayArtist.localeCompare(b.displayArtist) || a.displayAlbum.localeCompare(b.displayAlbum));
      
      if (!albums.length) {
        reviewsContainer.innerHTML = `<p class="text-center text-slate-400 italic py-8">No reviews match your filters.</p>`;
        return;
      }

      // render from sorted albums array
      reviewsContainer.innerHTML = albums.map(group => {
        const songs = group.songs || [];
        const avgDisplay = Math.round(group.avg * 10) / 10;

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
          <div class="p-4 rounded shadow cursor-pointer" style="${getRatingStyle(Math.round(group.avg))}">
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
  if (songSort) songSort.addEventListener('change', renderReviews);
  if (albumSort) albumSort.addEventListener('change', renderReviews);

  const viewAlbumsBtn = document.getElementById('viewAlbumsBtn');
  const viewSongsBtn = document.getElementById('viewSongsBtn');

  function updateViewButtons() {
    if (viewAlbumsBtn) {
      if (window.currentView === 'albums') {
        viewAlbumsBtn.className = 'px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-shadow hover:shadow-lg';
      } else {
        viewAlbumsBtn.className = 'px-6 py-3 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold transition';
      }
    }
    if (viewSongsBtn) {
      if (window.currentView === 'list') {
        viewSongsBtn.className = 'px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-shadow hover:shadow-lg';
      } else {
        viewSongsBtn.className = 'px-6 py-3 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold transition';
      }
    }

    // show only the relevant sorter for the active view
    if (typeof songSort !== 'undefined' && songSort) {
      if (window.currentView === 'list') songSort.classList.remove('hidden');
      else songSort.classList.add('hidden');
    }
    if (typeof albumSort !== 'undefined' && albumSort) {
      if (window.currentView === 'albums') albumSort.classList.remove('hidden');
      else albumSort.classList.add('hidden');
    }

    // show/hide the visible label text to match the sorter
    if (typeof songSortLabel !== 'undefined' && songSortLabel) {
      if (window.currentView === 'list') songSortLabel.classList.remove('hidden');
      else songSortLabel.classList.add('hidden');
    }
    if (typeof albumSortLabel !== 'undefined' && albumSortLabel) {
      if (window.currentView === 'albums') albumSortLabel.classList.remove('hidden');
      else albumSortLabel.classList.add('hidden');
    }
  }

  if (viewAlbumsBtn) {
    viewAlbumsBtn.addEventListener('click', () => {
      window.currentView = 'albums';
      updateViewButtons();
      try { renderReviews(); } catch (e) { console.error('renderReviews failed:', e); }
    });
  }
  if (viewSongsBtn) {
    viewSongsBtn.addEventListener('click', () => {
      window.currentView = 'list';
      updateViewButtons();
      try { renderReviews(); } catch (e) { console.error('renderReviews failed:', e); }
    });
  }

  // initial button state
  updateViewButtons();

  setTimeout(fetchReviews, 100);
});

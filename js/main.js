const reviewsContainer = document.getElementById('reviewsContainer');
const artistFilter = document.getElementById('artistFilter');
const albumFilter = document.getElementById('albumFilter');
const ratingFilter = document.getElementById('ratingFilter');
const songSearch = document.getElementById('songSearch');
const loadingEl = document.getElementById('loading');

let reviews = [];

function populateFilters() {
  const artists = [...new Set(reviews.map(r => r.artist))];
  const albums = [...new Set(reviews.map(r => r.album))];

  const artistOptions = document.getElementById('artistOptions');
  const albumOptions = document.getElementById('albumOptions');

  artistOptions.innerHTML = '';
  albumOptions.innerHTML = '';

  artists.forEach(artist => {
    const opt = document.createElement('option');
    opt.value = artist;
    artistOptions.appendChild(opt);
  });

  albums.forEach(album => {
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

function renderReviews() {
  const filtered = reviews.filter(r => {
  return (!artistFilter.value || (r.artist && r.artist.toLowerCase().includes(artistFilter.value.toLowerCase()))) &&
         (!albumFilter.value || (r.album && r.album.toLowerCase().includes(albumFilter.value.toLowerCase()))) &&
         (!ratingFilter.value || r.rating === ratingFilter.value) &&
         (!songSearch.value || (r.song && r.song.toLowerCase().includes(songSearch.value.toLowerCase())));
});

  if (filtered.length === 0) {
    reviewsContainer.innerHTML = `<p class="no-results">No reviews match your filters.</p>`;
    return;
  }

  reviewsContainer.innerHTML = filtered.map(r => `
    <div class="review ${getRatingClass(Number(r.rating))}">
      <div class="review-header">
        <div class="song">${r.song}</div>
        <div class="artist">${r.artist}</div>
      </div>
      <div><strong>Album:</strong> ${r.album || 'N/A'}</div>
      <div><strong>Rating:</strong> ${r.rating}/10</div>
    </div>
  `).join('');
}

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

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(fetchReviews, 100);
});

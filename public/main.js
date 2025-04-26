document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('video-grid');

  fetch('/videos')
    .then(res => res.json())
    .then(videos => {
      grid.innerHTML = '';
      videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        const src = `/uploads/${video.filename}`;
        card.innerHTML = `
          <video controls>
            <source src="${src}" type="video/mp4">
          </video>
          <h4>${video.title}</h4>
          <p>${video.description}</p>
        `;
        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Failed to load videos:", err);
    });
});
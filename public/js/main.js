
fetch('/api/videos')
  .then(res => res.json())
  .then(videos => {
    const grid = document.getElementById('video-grid');
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <h3>${video.title}</h3>
        <video controls src="/video?name=${encodeURIComponent(video.filename)}"></video>
        <p>${video.description}</p>
      `;
      grid.appendChild(card);
    });
  });

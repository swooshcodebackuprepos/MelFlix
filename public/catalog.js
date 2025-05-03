document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  const catalogContainer = document.getElementById('catalog-container');

  // Function to hide loading screen
  const hideLoadingScreen = () => {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  };

  // Initialize music
  const backgroundMusic = document.createElement('audio');
  backgroundMusic.id = 'background-music';
  backgroundMusic.src = '/audio/MDS Finally Mels rnwd2(1).mp3';
  backgroundMusic.loop = true;
  backgroundMusic.preload = 'auto';
  backgroundMusic.volume = 0.5;
  backgroundMusic.crossOrigin = 'anonymous';
  backgroundMusic.muted = true;
  document.body.appendChild(backgroundMusic);

  // Add error handling for audio
  backgroundMusic.addEventListener('error', (error) => {
    console.error('Audio error:', error);
    console.error('Error details:', {
      code: error.target.error.code,
      message: error.target.error.message,
      src: backgroundMusic.src
    });
    musicStatus.textContent = 'Music: Error - ' + error.target.error.message;
    musicStatus.style.color = '#ff4444';
  });

  // Add canplay event handler
  backgroundMusic.addEventListener('canplay', () => {
    console.log('Audio can play');
    musicStatus.textContent = 'Music: Ready';
    musicStatus.style.color = '#4CAF50';
  });

  // Add canplaythrough event handler
  backgroundMusic.addEventListener('canplaythrough', () => {
    console.log('Audio can play through');
  });

  // Add loadedmetadata event handler
  backgroundMusic.addEventListener('loadedmetadata', () => {
    musicStatus.textContent = 'Music: Ready';
    musicStatus.style.color = '#4CAF50';
  });

  // Add music status indicator
  const musicStatus = document.createElement('div');
  musicStatus.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    z-index: 1000;
    color: #4CAF50;
  `;
  musicStatus.textContent = 'Music: Loading...';
  document.body.appendChild(musicStatus);

  // Add play button
  const playButton = document.createElement('button');
  playButton.id = 'play-music';
  playButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
    display: block;
  `;
  playButton.textContent = 'Play Music';
  document.body.appendChild(playButton);

  // Add click handler to unmute and play music
  playButton.addEventListener('click', async () => {
    try {
      if (backgroundMusic.muted) {
        backgroundMusic.muted = false;
        await backgroundMusic.play();
        musicStatus.textContent = 'Music: Playing';
        musicStatus.style.color = '#4CAF50';
        playButton.textContent = 'Pause Music';
        playButton.style.background = '#ff4444';
      } else {
        backgroundMusic.pause();
        backgroundMusic.muted = true;
        musicStatus.textContent = 'Music: Paused';
        musicStatus.style.color = '#4CAF50';
        playButton.textContent = 'Play Music';
        playButton.style.background = '#4CAF50';
      }
    } catch (error) {
      console.error('Error controlling audio:', error);
      musicStatus.textContent = 'Music: Error - ' + error.message;
      musicStatus.style.color = '#ff4444';
    }
  });

  // Initialize music
  backgroundMusic.addEventListener('loadedmetadata', () => {
    musicStatus.textContent = 'Music: Ready';
    musicStatus.style.color = '#4CAF50';
    playButton.style.display = 'block';
  });

  // Function to load videos
  const loadVideos = () => {
    fetch('videos.json')
      .then(res => res.json())
      .then(data => {
        data.forEach(category => {
          const row = document.createElement('div');
          row.classList.add('row');

          const rowTitle = document.createElement('div');
          rowTitle.classList.add('row-title');
          rowTitle.textContent = category.category;
          row.appendChild(rowTitle);

          const videoRow = document.createElement('div');
          videoRow.classList.add('row-videos');

          category.videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.classList.add('video-card');

            const videoElement = document.createElement('video');
            videoElement.src = `/videos/${video.filename}`;
            videoElement.controls = true;
            videoElement.preload = 'metadata'; 
            
            // Add error handling for individual videos
            videoElement.addEventListener('error', (event) => {
              console.error(`Error loading video: ${video.filename}`);
              console.error('Error details:', videoElement.error);
              videoElement.style.display = 'none';
              const errorDiv = document.createElement('div');
              errorDiv.textContent = 'Video not found';
              errorDiv.style.color = '#ff4444';
              videoCard.appendChild(errorDiv);
            });
            
            // Add video event listeners
            videoElement.addEventListener('play', () => {
              backgroundMusic.pause();
            });
            
            videoElement.addEventListener('pause', () => {
              backgroundMusic.play();
            });
            
            videoElement.addEventListener('ended', () => {
              backgroundMusic.play();
            });

            videoCard.appendChild(videoElement);
            videoRow.appendChild(videoCard);
          });

          row.appendChild(videoRow);
          catalogContainer.appendChild(row);
        });
        
        // Hide loading screen after content loads
        hideLoadingScreen();
      })
      .catch(err => {
        console.error('Error loading videos:', err);
        
        // Create error message
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          padding: 20px;
          border-radius: 5px;
          color: white;
          text-align: center;
        `;
        errorMessage.textContent = 'Error loading videos. Please try refreshing the page.';
        document.body.appendChild(errorMessage);
        hideLoadingScreen();
      });
  };

  loadVideos();
});

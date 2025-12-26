class MulticolumnVideo {
  constructor() {
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.setupVideoControls()
      );
    } else {
      this.setupVideoControls();
    }
  }

  setupVideoControls() {
    const toggleButtons = document.querySelectorAll(".mul-video-toggle");

    toggleButtons.forEach((button) => {
      const videoWrapper = button.closest(".video-wrapper");
      const video = videoWrapper.querySelector("video");

      if (!video) return;

      const isAutoplay = button.getAttribute("data-playing") === "true";
      this.updateButtonState(button, isAutoplay);

      if (isAutoplay) {
        video.muted = true;
        video.play().catch((err) => {
          console.log("Autoplay prevented:", err);
          this.updateButtonState(button, false);
        });
      }

      button.addEventListener("click", () => {
        this.toggleVideo(video, button);
      });

      video.addEventListener("play", () => {
        this.updateButtonState(button, true);
      });

      video.addEventListener("pause", () => {
        this.updateButtonState(button, false);
      });
    });
  }

  toggleVideo(video, button) {
    if (video.paused) {
      video
        .play()
        .then(() => {
          this.updateButtonState(button, true);
        })
        .catch((err) => {
          console.error("Error playing video:", err);
        });
    } else {
      video.pause();
      this.updateButtonState(button, false);
    }
  }

  updateButtonState(button, isPlaying) {
    button.setAttribute("data-playing", isPlaying);
    button.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");
  }
}

new MulticolumnVideo();

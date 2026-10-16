/* Course player (student/course-player.html): a stand-in for the video. Play and Pause move the bar from where the
   lesson stopped (11:36 of 18:00) to the end in about 25 seconds, so the unlock can be seen without watching 6
   minutes. At the end the next lesson opens: the "Lesson 8" card, the Next lesson button and the curriculum row.
   Nothing is saved anywhere. The page has no seek control, so there is no seeking to limit. With "reduce motion"
   switched on, Play jumps straight to the finished state. */
(function () {
  "use strict";

  var root = document.querySelector("[data-player]");
  if (!root) {
    return;
  }

  var TOTAL = 18 * 60; // 18:00
  var START = 11 * 60 + 36; // 11:36, where the lesson stopped
  var RUN_MS = 25000; // time to play from START to the end
  var RATE = (TOTAL - START) / (RUN_MS / 1000); // seconds of video per real second

  var PLAY_PATH = "M6 4l14 8-14 8z";
  var PAUSE_PATH = "M7 4h3v16H7zM14 4h3v16h-3z";

  var playBtn = root.querySelector("[data-player-play]");
  var playPath = playBtn && playBtn.querySelector("path");
  var fill = root.querySelector("[data-player-progress]");
  var thumb = root.querySelector("[data-player-thumb]");
  var timeEl = root.querySelector("[data-player-time]");
  var hint = root.querySelector("[data-player-hint]");
  var track = fill && fill.parentNode;

  var gate = document.querySelector("[data-player-gate]");
  var gateTitle = document.querySelector("[data-player-gate-title]");
  var gateIcon = document.querySelector("[data-player-gate-icon]");
  var gateBar = document.querySelector("[data-player-gate-bar]");
  var gateLeft = document.querySelector("[data-player-left]");
  var next = document.querySelector("[data-player-next]");
  var nextWhy = document.querySelector("[data-player-why]");
  var unlock = document.querySelector("[data-player-unlock]");
  var status = document.querySelector("[data-player-status]");
  var quiz = document.querySelector("[data-player-quiz]");

  if (!playBtn || !fill || !timeEl) {
    return;
  }

  var pos = START;
  var playing = false;
  var finished = false;
  var frame = 0;
  var last = 0;

  function clock(sec) {
    var s = Math.floor(sec);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function render() {
    var pct = (pos / TOTAL) * 100;
    var shown = Math.floor(pct);
    fill.style.width = pct + "%";
    if (thumb) {
      thumb.style.left = "calc(" + pct + "% - 7px)";
    }
    timeEl.textContent = clock(pos) + " / " + clock(TOTAL);
    if (track) {
      track.setAttribute(
        "aria-label",
        finished
          ? "Played to the end."
          : "Played to " + clock(pos) + " of " + clock(TOTAL) + ". Seeking is limited to the part already watched.",
      );
    }
    if (!finished) {
      if (gateBar) {
        gateBar.style.width = pct + "%";
        if (gateBar.parentNode) {
          gateBar.parentNode.setAttribute("aria-label", shown + "% watched");
        }
      }
      if (gateLeft) {
        gateLeft.textContent = clock(TOTAL - pos) + " left to watch";
      }
      if (status) {
        status.textContent = (playing ? "Playing" : "Paused") + " · " + shown + "% watched";
      }
    }
  }

  function setIcon(isPlaying) {
    if (playPath) {
      playPath.setAttribute("d", isPlaying ? PAUSE_PATH : PLAY_PATH);
    }
    playBtn.setAttribute("aria-label", isPlaying ? "Pause lesson" : finished ? "Replay lesson" : "Play lesson");
  }

  function tick(now) {
    if (!playing) {
      return;
    }
    var dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    pos = Math.min(TOTAL, pos + dt * RATE);
    render();
    if (pos >= TOTAL && !finished) {
      finish();
      return;
    }
    if (pos >= TOTAL) {
      // A replay reached the end again: nothing more to unlock.
      playing = false;
      setIcon(false);
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function play() {
    if (finished && pos >= TOTAL) {
      pos = 0; // replay from the start; the next lesson stays open
    }
    playing = true;
    setIcon(true);
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    cancelAnimationFrame(frame);
    setIcon(false);
    render();
  }

  function finish() {
    playing = false;
    finished = true;
    cancelAnimationFrame(frame);
    pos = TOTAL;
    setIcon(false);
    render();
    if (status) {
      status.textContent = "Watched · 100%";
    }
    if (hint) {
      var lock = hint.querySelector("svg");
      var label = hint.querySelector("[data-player-hint-text]");
      if (lock) {
        lock.remove();
      }
      if (label) {
        label.textContent = "You finished this lesson";
      }
    }
    if (gate) {
      if (gateTitle) {
        gateTitle.textContent = "Lesson 8 is open";
      }
      if (gateBar) {
        gateBar.style.width = "100%";
        if (gateBar.parentNode) {
          gateBar.parentNode.setAttribute("aria-label", "100% watched");
        }
      }
      if (gateLeft) {
        gateLeft.textContent = "You watched this video to the end";
      }
      if (gateIcon) {
        gateIcon.classList.remove("p-tile--muted");
        gateIcon.classList.add("p-tile--green");
        gateIcon.innerHTML =
          '<svg class="p-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
      }
    }
    if (next) {
      next.disabled = false;
      next.removeAttribute("aria-describedby");
      var lockIcon = next.querySelector("svg");
      if (lockIcon) {
        lockIcon.remove();
      }
    }
    if (nextWhy) {
      nextWhy.textContent = "Lesson 8 is open";
    }
    if (quiz) {
      var quizSub = quiz.querySelector("[data-player-quiz-sub]");
      var quizDot = quiz.firstElementChild;
      if (quizSub) {
        quizSub.textContent = "Open now";
      }
      if (quizDot) {
        quizDot.style.background = "var(--warning-soft)";
        quizDot.style.color = "var(--warning)";
      }
    }
    if (unlock) {
      unlock.removeAttribute("aria-disabled");
      unlock.removeAttribute("title");
      var dot = unlock.firstElementChild;
      if (dot) {
        dot.style.background = "var(--cyan-soft)";
        dot.style.color = "var(--cyan-deep)";
        dot.innerHTML =
          '<svg class="eit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">' +
          '<path d="M6 4l14 8-14 8z"></path></svg>';
      }
      var name = unlock.querySelector("[data-player-unlock-name]");
      if (name) {
        name.style.color = "var(--ink)";
        name.style.fontWeight = "600";
      }
      var sub = unlock.querySelector("[data-player-unlock-sub]");
      if (sub && sub.getAttribute("data-open-text")) {
        sub.textContent = sub.getAttribute("data-open-text");
      }
    }
  }

  playBtn.addEventListener("click", function () {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce && !finished) {
      finish();
      return;
    }
    if (playing) {
      pause();
    } else {
      play();
    }
  });

  render();
})();

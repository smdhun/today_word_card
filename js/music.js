/**
 * 인간관계 오른쪽 MUSIC 목록입니다.
 * 곡을 누르면 그 곡만 받고, 끝나면 다음 곡으로 이어집니다.
 */
(function init_music() {
  const MUSIC_FOLDER = "music/";
  const TRACKS = [
    { file: "alexzavesa-dance-playful-night-510786.mp3", title: "Dance Playful Night" },
    { file: "fassounds-escape-your-love-upbeat-fashion-pop-dance-412230.mp3", title: "Escape Your Love" },
    { file: "sigmamusicart-no-copyright-music-537751.mp3", title: "No Copyright Music" },
    { file: "twisterium-beautiful-uplifting-music-618490.mp3", title: "Beautiful Uplifting" },
    { file: "bombinsound-halloween-suspense-horror-halloween-waltz-619348.mp3", title: "Halloween Waltz" },
    { file: "audiocopper-office-628023.mp3", title: "Office" },
    { file: "ikoliks_aj-upbeat-upbeat-music-628248.mp3", title: "Upbeat" },
    { file: "luminewave-infinity-love-629401.mp3", title: "Infinity Love" },
    { file: "viacheslavstarostin-background-music-630835.mp3", title: "Background Music" },
    { file: "miromaxmusic-synthwave-no-copyright-630654.mp3", title: "Synthwave" },
    { file: "fassounds-lofi-polaroids-632981.mp3", title: "Lofi Polaroids" },
    { file: "andriig-romantic-romantics-music-632907.mp3", title: "Romantics" },
    { file: "pink_sound-copper-nights-jazz-background-music-for-video-stories-full-version-633222.mp3", title: "Copper Nights" },
    { file: "miromaxmusic-technology-synthpop-no-copyright-633148.mp3", title: "Technology Synthpop" },
    { file: "zec53-piano-and-strings-ambient-confident-and-light-full-633882.mp3", title: "Piano and Strings" },
  ];

  const audio = new Audio();
  audio.preload = "none";
  let current_index = -1;
  let is_open = false;

  /**
   * id로 요소를 찾고, 없으면 기록만 남깁니다.
   */
  function require_element(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.error("음악 화면 요소를 찾지 못했습니다.", id);
    }
    return element;
  }

  /**
   * 목록 안에 곡 버튼을 만듭니다.
   */
  function build_list(list) {
    TRACKS.forEach(function add_track(track, index) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "music_track";
      button.textContent = track.title;
      button.dataset.track_index = String(index);
      button.addEventListener("click", function on_track_click() {
        play_track(index);
      });
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  /**
   * 재생 중인 곡만 금색으로 표시합니다.
   */
  function mark_playing_track(list, toggle) {
    const is_playing = !audio.paused && !audio.ended;
    list.querySelectorAll(".music_track").forEach(function mark_track(button) {
      const is_current = Number(button.dataset.track_index) === current_index && is_playing;
      button.classList.toggle("is_playing", is_current);
      if (is_current) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
    toggle.classList.toggle("is_playing", is_playing);
  }

  /**
   * 곡을 열지 못했을 때 목록 안에 안내를 남깁니다.
   */
  function show_music_error(message_element) {
    message_element.hidden = false;
    message_element.textContent = "이 곡을 재생하지 못했습니다. 다른 곡을 눌러 주세요.";
  }

  /**
   * 안내를 지웁니다.
   */
  function clear_music_error(message_element) {
    message_element.hidden = true;
    message_element.textContent = "";
  }

  /**
   * 목록을 열거나 닫습니다. 음악을 멈추지는 않습니다.
   */
  function set_panel_open(panel, toggle, next_open) {
    is_open = next_open;
    panel.hidden = !is_open;
    toggle.setAttribute("aria-expanded", is_open ? "true" : "false");
  }

  /**
   * 고른 곡을 재생합니다. 이미 재생 중이면 잠시 멈춥니다.
   */
  function play_track(index) {
    const list = document.getElementById("music_list");
    const toggle = document.getElementById("music_toggle");
    const message_element = document.getElementById("music_message");
    const track = TRACKS[index];
    if (!list || !toggle || !message_element || !track) {
      console.error("고른 곡을 찾지 못했습니다.", index);
      return;
    }

    clear_music_error(message_element);
    const is_same_track = current_index === index;
    if (is_same_track && !audio.paused) {
      audio.pause();
      mark_playing_track(list, toggle);
      return;
    }

    current_index = index;
    const next_src = MUSIC_FOLDER + track.file;
    if (!audio.src.endsWith(track.file)) {
      audio.src = next_src;
    }
    const play_result = audio.play();
    if (play_result && typeof play_result.catch === "function") {
      play_result.catch(function on_play_failed(error) {
        console.error("곡을 재생하지 못했습니다.", error);
        show_music_error(message_element);
        mark_playing_track(list, toggle);
      });
    }
    mark_playing_track(list, toggle);
  }

  /**
   * 버튼과 한 곡 재생기를 연결합니다.
   */
  function start_music() {
    try {
      const toggle = require_element("music_toggle");
      const panel = require_element("music_panel");
      const list = require_element("music_list");
      const message_element = require_element("music_message");
      const music_box = toggle ? toggle.closest(".music_box") : null;
      if (!toggle || !panel || !list || !message_element || !music_box) {
        return;
      }
      if (TRACKS.length === 0) {
        console.error("재생할 곡이 없습니다.");
        show_music_error(message_element);
        return;
      }

      build_list(list);
      toggle.addEventListener("click", function on_toggle_click() {
        set_panel_open(panel, toggle, !is_open);
      });
      document.addEventListener("click", function on_outside_click(event) {
        if (!is_open || music_box.contains(event.target)) {
          return;
        }
        set_panel_open(panel, toggle, false);
      });
      document.addEventListener("keydown", function on_escape(event) {
        if (event.key === "Escape" && is_open) {
          set_panel_open(panel, toggle, false);
        }
      });
      audio.addEventListener("ended", function on_track_ended() {
        const next_index = (current_index + 1) % TRACKS.length;
        play_track(next_index);
      });
      audio.addEventListener("error", function on_audio_error() {
        console.error("곡 파일을 열지 못했습니다.", audio.src);
        show_music_error(message_element);
        mark_playing_track(list, toggle);
      });
      audio.addEventListener("play", function on_play() {
        mark_playing_track(list, toggle);
      });
      audio.addEventListener("pause", function on_pause() {
        mark_playing_track(list, toggle);
      });
    } catch (error) {
      console.error("음악 목록을 열지 못했습니다. 페이지를 새로고침해 주세요.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start_music);
  } else {
    start_music();
  }
})();

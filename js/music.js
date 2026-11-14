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

  const BAR_COUNT = 4;
  const BAR_RANGES = [
    [1, 2],
    [3, 5],
    [6, 11],
    [12, 20],
  ];

  const audio = new Audio();
  audio.preload = "none";
  let current_index = -1;
  let is_open = false;
  let audio_context = null;
  let analyser = null;
  let gain_node = null;
  let frequency_bins = null;
  let meter_frame_id = 0;
  let is_reduced_motion = false;
  let is_muted = false;
  let has_asked_music = false;
  let is_offer_open = false;

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
   * 제목 오른쪽에 둘 막대 4개를 만듭니다.
   */
  function build_meter() {
    const meter = document.createElement("span");
    meter.className = "music_meter";
    meter.setAttribute("aria-hidden", "true");
    for (let bar_index = 0; bar_index < BAR_COUNT; bar_index += 1) {
      const bar = document.createElement("span");
      bar.className = "music_bar";
      meter.appendChild(bar);
    }
    return meter;
  }

  /**
   * 목록 안에 곡 버튼을 만듭니다.
   */
  function build_list(list) {
    TRACKS.forEach(function add_track(track, index) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const title = document.createElement("span");
      button.type = "button";
      button.className = "music_track";
      title.className = "music_title";
      title.textContent = track.title;
      button.dataset.track_index = String(index);
      button.appendChild(title);
      button.appendChild(build_meter());
      button.addEventListener("click", function on_track_click() {
        play_track(index);
      });
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  /**
   * 재생 소리를 읽어 막대 높이에 씁니다. 스피커 경로는 그대로 둡니다.
   */
  function ensure_sound_meter() {
    if (analyser) {
      return true;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.error("이 브라우저에서는 소리 막대를 그릴 수 없습니다.");
      return false;
    }
    try {
      audio_context = new AudioContextClass();
      const source_node = audio_context.createMediaElementSource(audio);
      analyser = audio_context.createAnalyser();
      gain_node = audio_context.createGain();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      gain_node.gain.value = is_muted ? 0 : 1;
      source_node.connect(gain_node);
      gain_node.connect(audio_context.destination);
      source_node.connect(analyser);
      frequency_bins = new Uint8Array(analyser.frequencyBinCount);
      return true;
    } catch (error) {
      console.error("소리 막대를 연결하지 못했습니다. 곡 재생은 계속됩니다.", error);
      analyser = null;
      return false;
    }
  }

  /**
   * 구간 평균으로 막대 하나 높이를 구합니다.
   */
  function average_range(start, end) {
    let sum = 0;
    let count = 0;
    const last = Math.min(end, frequency_bins.length - 1);
    for (let bin_index = start; bin_index <= last; bin_index += 1) {
      sum += frequency_bins[bin_index];
      count += 1;
    }
    if (count === 0) {
      return 0;
    }
    return sum / count;
  }

  /**
   * 구간 안에서 지금 가장 큰 음의 위치를 구합니다.
   */
  function pitch_bin(start, end) {
    let weight = 0;
    let weighted_sum = 0;
    const last = Math.min(end, frequency_bins.length - 1);
    for (let bin_index = start; bin_index <= last; bin_index += 1) {
      const level = frequency_bins[bin_index];
      weight += level;
      weighted_sum += level * bin_index;
    }
    if (weight === 0) {
      return (start + last) / 2;
    }
    return weighted_sum / weight;
  }

  /**
   * 색 값을 0에서 255 사이로 맞춥니다.
   */
  function clamp_channel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  /**
   * 낮은 음은 푸른색, 높은 음은 따뜻한 색으로 조금씩 바꿉니다.
   */
  function color_for_pitch(bin, level) {
    const pitch = Math.max(0, Math.min(1, (bin - 1) / 19));
    const tint = Math.max(0, Math.min(1, pitch + (Math.min(1, level) - 0.5) * 0.1));
    const brightness = 0.78 + Math.min(1, level) * 0.34;
    const red = clamp_channel((54 + (186 - 54) * tint) * brightness);
    const green = clamp_channel((86 + (78 - 86) * tint) * brightness);
    const blue = clamp_channel((168 + (48 - 168) * tint) * brightness);
    return "rgb(" + red + ", " + green + ", " + blue + ")";
  }

  /**
   * 막대 하나에 지금 소리의 높이와 색을 칠합니다.
   */
  function paint_meter(meter) {
    const bars = meter.querySelectorAll(".music_bar");
    bars.forEach(function set_bar(bar, index) {
      const range = BAR_RANGES[index] || BAR_RANGES[0];
      const level = average_range(range[0], range[1]) / 220;
      const height_ratio = Math.max(0.18, Math.min(1, 0.18 + level * 0.82));
      bar.style.transform = "scaleY(" + height_ratio.toFixed(3) + ")";
      bar.style.backgroundColor = color_for_pitch(pitch_bin(range[0], range[1]), level);
    });
  }

  /**
   * 재생 중인 제목과 MUSIC 옆 음량 막대를 함께 갱신합니다.
   */
  function paint_bars() {
    if (!analyser) {
      return;
    }
    analyser.getByteFrequencyData(frequency_bins);
    const meters = document.querySelectorAll(".music_track.is_playing .music_meter, .music_level:not([hidden])");
    meters.forEach(paint_meter);
  }

  /**
   * 소리 분석이 없으면 일정한 위아래 움직임으로 대신합니다.
   */
  function use_css_beat() {
    document.querySelectorAll(".music_meter").forEach(function mark_fallback(meter) {
      meter.classList.add("is_css_beat");
    });
  }

  /**
   * 막대 움직임을 시작합니다.
   */
  function start_meter() {
    if (is_reduced_motion) {
      return;
    }
    const has_meter = ensure_sound_meter();
    if (!has_meter) {
      use_css_beat();
      return;
    }
    if (audio_context && audio_context.state === "suspended") {
      audio_context.resume().catch(function on_resume_failed(error) {
        console.error("소리 막대를 깨우지 못했습니다. 곡 재생은 계속됩니다.", error);
        use_css_beat();
      });
    }
    if (meter_frame_id) {
      return;
    }
    meter_frame_id = window.requestAnimationFrame(function step_meter() {
      paint_bars();
      meter_frame_id = window.requestAnimationFrame(step_meter);
    });
  }

  /**
   * 멈춘 곡의 막대 움직임을 멈춥니다.
   */
  function stop_meter() {
    if (!meter_frame_id) {
      return;
    }
    window.cancelAnimationFrame(meter_frame_id);
    meter_frame_id = 0;
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
    const level = document.getElementById("music_level");
    if (level) {
      level.hidden = !is_playing;
    }
  }

  /**
   * 스피커 출력만 끄거나 다시 켭니다. 곡 재생은 그대로입니다.
   */
  function set_muted(next_muted) {
    is_muted = next_muted;
    audio.muted = is_muted;
    if (gain_node) {
      gain_node.gain.value = is_muted ? 0 : 1;
    }
    const sound_button = document.getElementById("sound_toggle");
    if (!sound_button) {
      console.error("스피커 버튼을 찾지 못했습니다.");
      return;
    }
    sound_button.setAttribute("aria-pressed", is_muted ? "true" : "false");
    sound_button.setAttribute("aria-label", is_muted ? "음소거 해제" : "음소거");
  }

  /**
   * 재생 확인 창을 엽니다.
   */
  function open_music_offer() {
    const offer = document.getElementById("music_offer");
    const yes_button = document.getElementById("music_offer_yes");
    if (!offer || !yes_button) {
      console.error("음악 재생 확인 창을 찾지 못했습니다.");
      return;
    }
    is_offer_open = true;
    offer.hidden = false;
    yes_button.focus();
  }

  /**
   * 재생 확인 창을 닫습니다.
   */
  function close_music_offer() {
    const offer = document.getElementById("music_offer");
    if (!offer) {
      return;
    }
    is_offer_open = false;
    offer.hidden = true;
  }

  /**
   * 이번 실행에서 처음 틀 곡을 목록에서 한 번만 뽑습니다.
   * 그다음 곡은 목록 순서대로 이어집니다.
   */
  function random_startup_track_index() {
    if (TRACKS.length === 0) {
      console.error("처음 재생할 곡이 없습니다.");
      return 0;
    }
    return Math.floor(Math.random() * TRACKS.length);
  }

  /**
   * 확인 창에서 재생을 고르면 이번 실행의 첫 곡을 무작위로 시작합니다.
   */
  function accept_music_offer() {
    close_music_offer();
    if (!audio.paused && !audio.ended) {
      return;
    }
    const start_index = current_index >= 0 ? current_index : random_startup_track_index();
    play_track(start_index);
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

  let locked_scroll_y = 0;

  /**
   * 목록이 열려 있는 동안 뒤 화면을 지금 위치에 붙여 둡니다.
   */
  function lock_background_scroll() {
    try {
      locked_scroll_y = window.scrollY || document.documentElement.scrollTop || 0;
      const bar = document.querySelector(".top_bar");
      const bar_height = bar ? bar.getBoundingClientRect().height : 0;
      const scrollbar_width = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.position = "fixed";
      document.body.style.top = "-" + locked_scroll_y + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.paddingTop = bar_height + "px";
      document.body.style.paddingRight = scrollbar_width > 0 ? scrollbar_width + "px" : "";
      document.documentElement.classList.add("is_music_list_open");
    } catch (error) {
      console.error("뒤 화면을 고정하지 못했습니다. 목록은 그대로 열어둡니다.", error);
    }
  }

  /**
   * 목록을 닫으면 뒤 화면을 다시 스크롤할 수 있게 합니다.
   */
  function unlock_background_scroll() {
    try {
      document.documentElement.classList.remove("is_music_list_open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.paddingTop = "";
      document.body.style.paddingRight = "";
      window.scrollTo(0, locked_scroll_y);
    } catch (error) {
      console.error("뒤 화면 고정을 풀지 못했습니다. 목록을 닫은 뒤 화면을 다시 움직여 보세요.", error);
    }
  }

  /**
   * 목록 위에서 휠을 굴리면 목록만 움직입니다.
   */
  function keep_page_still_while_list_scrolls(panel) {
    window.addEventListener("wheel", function on_list_wheel(event) {
      if (!is_open || !panel.contains(event.target) || !event.cancelable) {
        return;
      }
      event.preventDefault();
      let distance = event.deltaY;
      if (event.deltaMode === 1) {
        distance = event.deltaY * 16;
      } else if (event.deltaMode === 2) {
        distance = event.deltaY * panel.clientHeight;
      }
      panel.scrollTop += distance;
    }, { capture: true, passive: false });
  }

  /**
   * 목록을 열거나 닫습니다. 음악을 멈추지는 않습니다.
   */
  function set_panel_open(panel, toggle, next_open) {
    is_open = next_open;
    panel.hidden = !is_open;
    toggle.setAttribute("aria-expanded", is_open ? "true" : "false");
    if (is_open) {
      lock_background_scroll();
      return;
    }
    unlock_background_scroll();
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
      const sound_button = require_element("sound_toggle");
      const offer = require_element("music_offer");
      const offer_yes = require_element("music_offer_yes");
      const offer_no = require_element("music_offer_no");
      if (!toggle || !panel || !list || !message_element || !music_box) {
        return;
      }
      if (TRACKS.length === 0) {
        console.error("재생할 곡이 없습니다.");
        show_music_error(message_element);
        return;
      }

      build_list(list);
      keep_page_still_while_list_scrolls(panel);
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
        start_meter();
      });
      audio.addEventListener("pause", function on_pause() {
        stop_meter();
        mark_playing_track(list, toggle);
      });
      if (sound_button) {
        sound_button.addEventListener("click", function on_sound_click() {
          set_muted(!is_muted);
        });
      }
      if (offer && offer_yes && offer_no) {
        offer_yes.addEventListener("click", accept_music_offer);
        offer_no.addEventListener("click", close_music_offer);
        offer.addEventListener("click", function on_offer_backdrop(event) {
          if (event.target === offer) {
            close_music_offer();
          }
        });
        document.addEventListener("keydown", function on_offer_escape(event) {
          if (event.key === "Escape" && is_offer_open) {
            close_music_offer();
          }
        });
        document.addEventListener("click", function on_first_button(event) {
          if (has_asked_music || is_offer_open) {
            return;
          }
          const button = event.target.closest("button");
          if (!button || offer.contains(button)) {
            return;
          }
          has_asked_music = true;
          open_music_offer();
        }, true);
      }
      is_reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

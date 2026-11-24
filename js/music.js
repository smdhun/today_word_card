/**
 * 인간관계 오른쪽 MUSIC 목록입니다.
 * 곡을 누르면 그 곡이 바로 나오고, 곡이 끝나면 고른 반복 방식대로 다음 곡을 정합니다.
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
  let is_offer_open = false;
  const PLAY_MODE_ONE = "one";
  const PLAY_MODE_ONCE = "once";
  const PLAY_MODE_SHUFFLE = "shuffle";
  let play_mode = PLAY_MODE_ONCE;
  let once_origin_index = -1;
  let shuffle_deck = [];
  let played_indexes = [];
  // 목록이 열린 채 고른 곡이 화면 밖에 있으면 그 곡을 한가운데로 옮깁니다.
  let should_center_shuffle_track = false;

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
        play_track(index, true);
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
    const meters = document.querySelectorAll(".music_track.is_playing .music_meter, .music_level.is_on");
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
   * MUSIC 옆 막대를 낮은 정지 모습으로 되돌립니다.
   */
  function rest_header_meter() {
    const level = document.getElementById("music_level");
    if (!level) {
      console.error("음량 막대를 찾지 못했습니다.");
      return;
    }
    level.classList.remove("is_css_beat");
    level.querySelectorAll(".music_bar").forEach(function rest_bar(bar) {
      bar.style.transform = "";
      bar.style.backgroundColor = "";
    });
  }

  /**
   * 멈춘 곡의 막대 움직임을 멈추고, MUSIC 옆 막대는 낮은 채로 둡니다.
   */
  function stop_meter() {
    if (meter_frame_id) {
      window.cancelAnimationFrame(meter_frame_id);
      meter_frame_id = 0;
    }
    rest_header_meter();
  }

  /**
   * 초를 남은 시간 00:00으로 바꿉니다.
   */
  function format_remain(total_seconds) {
    const safe_seconds = Number.isFinite(total_seconds) ? Math.max(0, Math.ceil(total_seconds)) : 0;
    const minutes = Math.floor(safe_seconds / 60);
    const seconds = safe_seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  /**
   * 재생 중이면 막대 왼쪽에 남은 시간을 줄여 보여 줍니다.
   */
  function update_remain() {
    const remain = document.getElementById("music_remain");
    if (!remain) {
      console.error("남은 시간 칸을 찾지 못했습니다.");
      return;
    }
    const is_playing = !audio.paused && !audio.ended;
    remain.hidden = false;
    if (!is_playing || !Number.isFinite(audio.duration)) {
      remain.textContent = "00:00";
      return;
    }
    remain.textContent = format_remain(audio.duration - audio.currentTime);
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
      level.hidden = false;
      level.classList.toggle("is_on", is_playing);
      if (!is_playing) {
        rest_header_meter();
      }
    }
    update_remain();
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
  /**
   * 움직임 줄이기를 켠 브라우저인지 확인합니다.
   */
  function prefers_still_motion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (error) {
      console.error("움직임 설정을 확인하지 못했습니다.", error);
      return false;
    }
  }

  // 질문 상자가 올라온 뒤 강아지가 따라오는 간격입니다.
  const OFFER_DOG_DELAY_MS = 450;
  let offer_dog_timer = 0;

  /**
   * 테두리 박스와 문구를 먼저 보여 줍니다.
   */
  function show_offer_card(offer) {
    if (!offer || offer.hidden) {
      return;
    }
    if (!prefers_still_motion()) {
      offer.classList.add("is_card_in");
    }
    const yes_button = document.getElementById("music_offer_yes");
    if (yes_button) {
      yes_button.focus();
    }
  }

  /**
   * 질문 상자 위에 강아지를 보여 줍니다.
   */
  function show_offer_dog(offer) {
    if (!offer || offer.hidden) {
      return;
    }
    offer.classList.add("is_dog_ready");
  }

  /**
   * 질문 상자가 보인 뒤 강아지를 띄웁니다.
   */
  function schedule_offer_dog(offer) {
    window.clearTimeout(offer_dog_timer);
    offer_dog_timer = window.setTimeout(function on_offer_dog() {
      offer_dog_timer = 0;
      show_offer_dog(offer);
    }, OFFER_DOG_DELAY_MS);
  }

  function open_music_offer() {
    const offer = document.getElementById("music_offer");
    const yes_button = document.getElementById("music_offer_yes");
    if (!offer || !yes_button) {
      console.error("음악 재생 확인 창을 찾지 못했습니다.");
      return;
    }
    try {
      is_offer_open = true;
      offer.classList.remove("is_card_in", "is_dog_ready", "is_dog_first");
      offer.hidden = false;
      show_offer_card(offer);
      schedule_offer_dog(offer);
    } catch (error) {
      console.error("음악 재생 확인 창을 열지 못했습니다. 잠시 후 다시 열어 주세요.", error);
      offer.hidden = false;
      show_offer_card(offer);
      schedule_offer_dog(offer);
    }
  }

  /**
   * 재생 확인 창을 닫습니다.
   */
  function close_music_offer() {
    const offer = document.getElementById("music_offer");
    if (!offer) {
      return;
    }
    const was_open = is_offer_open || !offer.hidden;
    is_offer_open = false;
    window.clearTimeout(offer_dog_timer);
    offer_dog_timer = 0;
    offer.classList.remove("is_dog_first", "is_card_in", "is_dog_ready");
    offer.hidden = true;
    if (!was_open) {
      return;
    }
    // 재생과 나중에 모두 선택을 마친 것으로 보고, 캐릭터 변화를 시작하게 알립니다.
    document.dispatchEvent(new CustomEvent("today_word_music_choice"));
  }

  /**
   * 이번 실행에서 처음 틀 곡을 목록에서 한 번만 뽑습니다.
   * 그 곡이 끝나면 그때 선택된 반복 방식을 따릅니다.
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
    play_track(start_index, true);
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
  let is_background_locked = false;
  let ignore_outside_until = 0;
  let scroll_token = 0;
  let scroll_close_timer = 0;
  let panel_motion_end = null;

  /**
   * 목록의 세로 위치는 버튼 바로 아래에 두고, 가로는 화면 한가운데로 맞춥니다.
   */
  function center_music_panel(panel) {
    try {
      const box = panel.closest(".music_box");
      if (!box || panel.hidden) {
        return;
      }
      const view_width = document.documentElement.clientWidth;
      const panel_width = panel.offsetWidth;
      const box_left = box.getBoundingClientRect().left;
      const next_left = (view_width - panel_width) / 2 - box_left;
      panel.style.left = Math.round(next_left) + "px";
    } catch (error) {
      console.error("음악 목록을 화면 가운데로 두지 못했습니다. Music 버튼을 다시 눌러 주세요.", error);
    }
  }

  /**
   * 스케치 사진은 화면을 채우고 스크롤이 없습니다.
   * 본문을 고정했다가 풀면 목록을 닫는 순간에 사진이 번쩍입니다.
   */
  function is_sketch_screen() {
    const root = window.TodayWordCard || {};
    return document.documentElement.dataset.design === (root.DESIGN_SKETCH || "sketch");
  }

  /**
   * 목록이 열려 있는 동안 뒤 화면을 지금 위치에 붙여 둡니다.
   */
  function lock_background_scroll() {
    try {
      document.documentElement.classList.add("is_music_list_open");
      if (is_sketch_screen()) {
        is_background_locked = false;
        return;
      }
      is_background_locked = true;
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
      if (!is_background_locked) {
        return;
      }
      is_background_locked = false;
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
  function keep_page_still_while_list_scrolls(panel, list) {
    window.addEventListener("wheel", function on_list_wheel(event) {
      if (!is_open || !panel.contains(event.target) || !event.cancelable) {
        return;
      }
      event.preventDefault();
      let distance = event.deltaY;
      if (event.deltaMode === 1) {
        distance = event.deltaY * 16;
      } else if (event.deltaMode === 2) {
        distance = event.deltaY * list.clientHeight;
      }
      list.scrollTop += distance;
    }, { capture: true, passive: false });
  }

  /**
   * 재생 중인 곡이 펼친 목록 밖에 있으면 그 곡을 목록 한가운데로 옮깁니다.
   * 이미 보이면 목록은 움직이지 않습니다.
   */
  function reveal_playing_track() {
    try {
      const list = document.getElementById("music_list");
      if (!list) {
        console.error("재생 목록을 찾지 못했습니다.");
        return;
      }
      const playing = list.querySelector(".music_track.is_playing");
      if (!playing) {
        return;
      }
      const item = playing.closest("li") || playing;
      const list_rect = list.getBoundingClientRect();
      const item_rect = item.getBoundingClientRect();
      if (list_rect.height <= 0) {
        return;
      }
      const is_above = item_rect.top < list_rect.top;
      const is_below = item_rect.bottom > list_rect.bottom + 1;
      if (!is_above && !is_below) {
        return;
      }
      const delta = (item_rect.top + item_rect.height / 2) - (list_rect.top + list_rect.height / 2);
      list.scrollTop += delta;
    } catch (error) {
      console.error("재생 중인 곡으로 목록을 맞추지 못했습니다. 목록을 직접 밀어 확인해 주세요.", error);
    }
  }

  /**
   * 곡 제목의 밀기 순서를 섞습니다. 매번 다른 곡이 먼저 움직입니다.
   */
  function assign_title_wave(panel, is_opening) {
    const tracks = panel.querySelectorAll(".music_track");
    const ranks = [];
    for (let index = 0; index < tracks.length; index += 1) {
      ranks.push(index);
    }
    for (let index = ranks.length - 1; index > 0; index -= 1) {
      const swap_index = Math.floor(Math.random() * (index + 1));
      const held = ranks[index];
      ranks[index] = ranks[swap_index];
      ranks[swap_index] = held;
    }
    const step_s = 0.042;
    const base_s = is_opening ? 0.18 : 0;
    let max_delay_s = base_s;
    tracks.forEach(function set_delay(track, index) {
      const delay_s = base_s + ranks[index] * step_s;
      if (delay_s > max_delay_s) {
        max_delay_s = delay_s;
      }
      track.style.setProperty("--music_row_delay", delay_s.toFixed(3) + "s");
    });
    const shell_delay_s = is_opening ? 0 : Math.max(0.16, max_delay_s);
    panel.style.setProperty("--music_shell_delay", shell_delay_s.toFixed(3) + "s");
    return {
      max_delay_s: max_delay_s,
      shell_delay_s: shell_delay_s,
      track_count: tracks.length
    };
  }

  /**
   * 밀기 동작을 다시 시작합니다. 움직임 줄이기면 클래스 없이 토큰만 바꿉니다.
   */
  function begin_panel_motion(panel, is_opening) {
    scroll_token += 1;
    window.clearTimeout(scroll_close_timer);
    if (panel_motion_end) {
      panel.removeEventListener("animationend", panel_motion_end);
      panel_motion_end = null;
    }
    panel.classList.remove("is_opening", "is_closing");
    const still_wave = { max_delay_s: 0, shell_delay_s: 0, track_count: 0 };
    if (prefers_still_motion()) {
      return { token: scroll_token, wave: still_wave };
    }
    const wave = assign_title_wave(panel, is_opening);
    void panel.offsetWidth;
    panel.classList.add(is_opening ? "is_opening" : "is_closing");
    return { token: scroll_token, wave: wave };
  }

  /**
   * 목록을 열거나 닫습니다. 음악을 멈추지는 않습니다.
   * 바탕과 상단 버튼은 위아래로 밀고, 제목은 좌우로 민 뒤에 닫힌 목록을 숨깁니다.
   */
  function set_panel_open(panel, toggle, next_open) {
    try {
      if (next_open === is_open) {
        return;
      }
      if (next_open) {
        panel.hidden = false;
      }
      const motion = begin_panel_motion(panel, next_open);
      const token = motion.token;
      const wave = motion.wave;
      is_open = next_open;
      toggle.setAttribute("aria-expanded", is_open ? "true" : "false");
      if (is_open) {
        lock_background_scroll();
        center_music_panel(panel);
        reveal_playing_track();
        if (prefers_still_motion() || wave.track_count === 0) {
          panel.classList.remove("is_opening");
          return;
        }
        let row_in_left = wave.track_count;
        panel_motion_end = function on_row_in_end(event) {
          if (event.animationName !== "music_row_in") {
            return;
          }
          row_in_left -= 1;
          if (row_in_left > 0) {
            return;
          }
          panel.removeEventListener("animationend", panel_motion_end);
          panel_motion_end = null;
          window.clearTimeout(scroll_close_timer);
          if (token !== scroll_token || !is_open) {
            return;
          }
          panel.classList.remove("is_opening");
        };
        panel.addEventListener("animationend", panel_motion_end);
        scroll_close_timer = window.setTimeout(function on_open_backup() {
          if (panel_motion_end) {
            panel.removeEventListener("animationend", panel_motion_end);
            panel_motion_end = null;
          }
          if (token !== scroll_token || !is_open) {
            return;
          }
          panel.classList.remove("is_opening");
        }, Math.ceil((wave.max_delay_s + 0.5) * 1000));
        return;
      }
      let is_finish_done = false;
      const finish_close = function finish_close() {
        if (is_finish_done || token !== scroll_token || is_open) {
          return;
        }
        is_finish_done = true;
        panel.hidden = true;
        panel.classList.remove("is_opening", "is_closing");
        unlock_background_scroll();
      };
      if (prefers_still_motion()) {
        finish_close();
        return;
      }
      panel_motion_end = function on_shell_up_end(event) {
        if (event.animationName !== "music_shell_up") {
          return;
        }
        panel.removeEventListener("animationend", panel_motion_end);
        panel_motion_end = null;
        finish_close();
      };
      panel.addEventListener("animationend", panel_motion_end);
      scroll_close_timer = window.setTimeout(function on_close_backup() {
        if (panel_motion_end) {
          panel.removeEventListener("animationend", panel_motion_end);
          panel_motion_end = null;
        }
        finish_close();
      }, Math.ceil((wave.shell_delay_s + 0.5) * 1000));
    } catch (error) {
      console.error("음악 목록을 펼치지 못했습니다. Music 버튼을 다시 눌러 주세요.", error);
      panel.hidden = !next_open;
      is_open = next_open;
    }
  }

  /**
   * 선택된 반복 버튼만 눌린 상태로 바꿉니다.
   */
  function update_mode_buttons() {
    document.querySelectorAll(".music_mode").forEach(function mark_mode(button) {
      const is_selected = button.getAttribute("data-play-mode") === play_mode;
      button.setAttribute("aria-pressed", is_selected ? "true" : "false");
    });
  }

  /**
   * 방금 나온 곡을 빼고 남은 곡 순서를 섞습니다.
   */
  function refill_shuffle_deck(exclude_index) {
    const deck = [];
    for (let index = 0; index < TRACKS.length; index += 1) {
      if (index !== exclude_index) {
        deck.push(index);
      }
    }
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swap_index = Math.floor(Math.random() * (index + 1));
      const held = deck[index];
      deck[index] = deck[swap_index];
      deck[swap_index] = held;
    }
    shuffle_deck = deck;
  }

  /**
   * 직접 고른 곡을 이번 반복의 기준으로 삼습니다.
   * 전체 1회는 그 곡이 한 바퀴의 시작이 되고, Random은 그 곡을 남은 순서에서 뺍니다.
   */
  function note_user_choice(index) {
    try {
      if (play_mode === PLAY_MODE_ONCE) {
        once_origin_index = index;
        return;
      }
      if (play_mode !== PLAY_MODE_SHUFFLE) {
        return;
      }
      if (shuffle_deck.length === 0) {
        refill_shuffle_deck(index);
        return;
      }
      shuffle_deck = shuffle_deck.filter(function keep_remaining(item) {
        return item !== index;
      });
    } catch (error) {
      console.error("반복 순서를 맞추지 못했습니다. 고른 곡만 재생합니다.", error);
    }
  }

  /**
   * 반복 방식을 바꿉니다. 지금 곡은 멈추거나 다시 시작하지 않습니다.
   */
  function set_play_mode(next_mode) {
    try {
      const is_known_mode = next_mode === PLAY_MODE_ONE || next_mode === PLAY_MODE_ONCE || next_mode === PLAY_MODE_SHUFFLE;
      if (!is_known_mode) {
        console.error("알 수 없는 반복 방식입니다. 표시를 다시 눌러 주세요.", next_mode);
        return;
      }
      if (next_mode === play_mode) {
        return;
      }
      play_mode = next_mode;
      if (play_mode === PLAY_MODE_ONCE && current_index >= 0) {
        once_origin_index = current_index;
      }
      if (play_mode === PLAY_MODE_SHUFFLE) {
        shuffle_deck = [];
        if (current_index >= 0) {
          refill_shuffle_deck(current_index);
        }
      }
      update_mode_buttons();
    } catch (error) {
      console.error("반복 방식을 바꾸지 못했습니다. 표시를 다시 눌러 주세요.", error);
    }
  }

  /**
   * 곡이 끝난 뒤 다음에 틀 번호를 정합니다. 멈출 때는 -1을 돌려줍니다.
   */
  function next_index_after_end() {
    if (TRACKS.length === 0 || current_index < 0) {
      console.error("끝난 곡의 다음을 정하지 못했습니다.");
      return -1;
    }
    if (play_mode === PLAY_MODE_ONE) {
      return current_index;
    }
    if (play_mode === PLAY_MODE_ONCE) {
      if (once_origin_index < 0) {
        once_origin_index = current_index;
      }
      const next_index = (current_index + 1) % TRACKS.length;
      if (next_index === once_origin_index) {
        return -1;
      }
      return next_index;
    }
    if (play_mode === PLAY_MODE_SHUFFLE) {
      if (shuffle_deck.length === 0) {
        refill_shuffle_deck(current_index);
      }
      if (shuffle_deck.length === 0) {
        return current_index;
      }
      return shuffle_deck.shift();
    }
    console.error("반복 방식을 읽지 못했습니다. 재생을 멈춥니다.", play_mode);
    return -1;
  }

  /**
   * 이전 곡 또는 다음 곡으로 옮깁니다. 한 곡 반복이어도 옆 곡으로 갑니다.
   * direction이 1이면 다음, -1이면 이전입니다.
   */
  function play_nearby_track(direction) {
    try {
      const count = TRACKS.length;
      if (count === 0) {
        console.error("이동할 곡이 없습니다. 목록을 다시 열어 주세요.");
        return;
      }
      const step = direction < 0 ? -1 : 1;
      let index = -1;
      if (current_index < 0) {
        index = step < 0 ? count - 1 : 0;
      } else if (step > 0 && play_mode === PLAY_MODE_SHUFFLE) {
        index = next_index_after_end();
      } else if (step < 0 && play_mode === PLAY_MODE_SHUFFLE && played_indexes.length > 0) {
        index = played_indexes.pop();
      } else {
        index = (current_index + step + count) % count;
      }
      if (index < 0) {
        index = step < 0 ? count - 1 : 0;
      }
      if (step > 0 && current_index >= 0 && current_index !== index) {
        played_indexes.push(current_index);
        if (played_indexes.length > count) {
          played_indexes.shift();
        }
      }
      if (step < 0 && play_mode === PLAY_MODE_SHUFFLE && current_index >= 0 && current_index !== index) {
        shuffle_deck.unshift(current_index);
      }
      if (is_open) {
        should_center_shuffle_track = true;
      }
      if (index === current_index) {
        try {
          audio.currentTime = 0;
        } catch (error) {
          console.error("같은 곡을 처음부터 열지 못했습니다.", error);
        }
        const play_result = audio.play();
        if (play_result && typeof play_result.catch === "function") {
          play_result.catch(function on_replay_failed(error) {
            console.error("곡을 다시 재생하지 못했습니다. 목록에서 곡을 눌러 주세요.", error);
            should_center_shuffle_track = false;
          });
        }
        return;
      }
      note_user_choice(index);
      play_track(index, false);
    } catch (error) {
      console.error("곡을 바꾸지 못했습니다. 목록에서 곡을 다시 눌러 주세요.", error);
      should_center_shuffle_track = false;
    }
  }

  // 곡 전체에서 미리 읽어 두는 높이 칸 수입니다. 화면에는 이보다 성기게 그립니다.
  const WAVE_BUCKETS = 480;
  const WAVE_REST = "#6a6f76";
  const WAVE_PLAYED = "#d6d3cc";
  let wave_peaks = null;
  let wave_file = "";
  let wave_token = 0;
  let wave_frame_id = 0;
  const wave_cache = {};
  let wave_context = null;

  /**
   * 초를 분:초로 바꿉니다.
   */
  function format_clock(total_seconds) {
    const safe_seconds = Number.isFinite(total_seconds) ? Math.max(0, Math.floor(total_seconds)) : 0;
    const minutes = Math.floor(safe_seconds / 60);
    const seconds = safe_seconds % 60;
    return String(minutes) + ":" + String(seconds).padStart(2, "0");
  }

  /**
   * 읽기 화면에 쓸 분과 초입니다.
   */
  function format_spoken_clock(total_seconds) {
    const safe_seconds = Number.isFinite(total_seconds) ? Math.max(0, Math.floor(total_seconds)) : 0;
    return Math.floor(safe_seconds / 60) + "분 " + (safe_seconds % 60) + "초";
  }

  /**
   * 스케치에서 곡이 한 번이라도 시작됐으면 음파 띠를 보여 줍니다.
   */
  function should_show_wave() {
    return is_sketch_screen() && current_index >= 0 && Boolean(audio.src);
  }

  /**
   * 한 칸에서 가장 큰 소리와 그 위아래 방향을 함께 고릅니다.
   */
  function peaks_from_buffer(audio_buffer) {
    const channel = audio_buffer.getChannelData(0);
    const buckets = new Float32Array(WAVE_BUCKETS);
    const step = Math.max(1, Math.floor(channel.length / WAVE_BUCKETS));
    let max_peak = 0;
    for (let bucket_index = 0; bucket_index < WAVE_BUCKETS; bucket_index += 1) {
      const start = bucket_index * step;
      const end = Math.min(channel.length, start + step);
      let peak = 0;
      for (let sample_index = start; sample_index < end; sample_index += 4) {
        const sample = channel[sample_index];
        if (Math.abs(sample) > Math.abs(peak)) {
          peak = sample;
        }
      }
      buckets[bucket_index] = peak;
      if (Math.abs(peak) > max_peak) {
        max_peak = Math.abs(peak);
      }
    }
    if (max_peak > 0) {
      for (let bucket_index = 0; bucket_index < buckets.length; bucket_index += 1) {
        buckets[bucket_index] = buckets[bucket_index] / max_peak;
      }
    }
    stretch_wave_peaks(buckets);
    return buckets;
  }

  /**
   * 비슷한 높이를 벌립니다. 작은 소리는 가운데로, 큰 소리는 끝으로 보냅니다.
   */
  function stretch_wave_peaks(buckets) {
    const magnitudes = [];
    for (let bucket_index = 0; bucket_index < buckets.length; bucket_index += 1) {
      magnitudes.push(Math.abs(buckets[bucket_index]));
    }
    magnitudes.sort(function compare_magnitude(left, right) {
      return left - right;
    });
    const low = magnitudes[Math.floor(magnitudes.length * 0.22)] || 0;
    const high = magnitudes[Math.min(magnitudes.length - 1, Math.floor(magnitudes.length * 0.86))] || 1;
    const span = Math.max(0.04, high - low);
    for (let bucket_index = 0; bucket_index < buckets.length; bucket_index += 1) {
      const sign = buckets[bucket_index] < 0 ? -1 : 1;
      let shaped = (Math.abs(buckets[bucket_index]) - low) / span;
      if (shaped < 0) {
        shaped = 0;
      }
      if (shaped > 1) {
        shaped = 1;
      }
      shaped = Math.pow(shaped, 1.65);
      buckets[bucket_index] = sign * shaped;
    }
  }

  /**
   * 화면 너비에 맞춰 세로 선의 개수를 정합니다. 선이 붙어 면처럼 보이지 않게 간격을 둡니다.
   */
  function wave_column_count(width) {
    return Math.max(48, Math.min(WAVE_BUCKETS, Math.floor(width / 4)));
  }

  /**
   * 구간에서 가장 큰 값만 고르면 높이가 비슷해집니다. 가운데 소리를 그대로 씁니다.
   */
  function column_signed_peak(column_index, column_count) {
    const bucket_index = Math.min(
      wave_peaks.length - 1,
      Math.max(0, Math.round((column_index + 0.5) * wave_peaks.length / column_count) - 1)
    );
    return wave_peaks[bucket_index];
  }

  // 이전 선 두께의 절반입니다. 세로 획 1.35, 이어지는 선 1.7.
  const WAVE_BAR_WIDTH = 0.68;
  const WAVE_LINE_WIDTH = 0.85;

  /**
   * 그릴 점의 목록을 만듭니다. x는 시간, y는 그 순간의 위아래입니다.
   */
  function wave_points(width, height) {
    const mid_y = height / 2;
    const amplitude = height * 0.49;
    if (!wave_peaks || wave_peaks.length < 2) {
      return { points: [], mid_y: mid_y };
    }
    const column_count = wave_column_count(width);
    const points = [];
    for (let column_index = 0; column_index < column_count; column_index += 1) {
      const signed = column_signed_peak(column_index, column_count);
      points.push({
        x: ((column_index + 0.5) / column_count) * width,
        y: mid_y - signed * amplitude,
      });
    }
    return { points: points, mid_y: mid_y };
  }

  /**
   * 아직 재생되지 않은 전체 모양입니다. 세로 높이와 이어지는 선을 함께 둡니다.
   */
  function stroke_wave_shape(context, width, height, color) {
    const wave = wave_points(width, height);
    context.strokeStyle = color;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (wave.points.length < 2) {
      context.lineWidth = WAVE_LINE_WIDTH;
      context.beginPath();
      context.moveTo(0, wave.mid_y);
      context.lineTo(width, wave.mid_y);
      context.stroke();
      return;
    }
    context.lineWidth = WAVE_BAR_WIDTH;
    context.beginPath();
    for (let point_index = 0; point_index < wave.points.length; point_index += 1) {
      const point = wave.points[point_index];
      context.moveTo(point.x, wave.mid_y);
      context.lineTo(point.x, point.y);
    }
    context.stroke();
    context.lineWidth = WAVE_LINE_WIDTH;
    context.beginPath();
    context.moveTo(wave.points[0].x, wave.points[0].y);
    for (let point_index = 1; point_index < wave.points.length; point_index += 1) {
      context.lineTo(wave.points[point_index].x, wave.points[point_index].y);
    }
    context.stroke();
  }

  /**
   * 화면의 y는 아래로 갈수록 커집니다. 값이 줄면 선이 올라가는 구간입니다.
   * 가파를수록 1에 가깝고, 내려가면 -1에 가깝습니다. 완만한 곳은 0입니다.
   */
  function trace_slope_amount(from_point, to_point) {
    const rise = from_point.y - to_point.y;
    const run = Math.max(0.35, to_point.x - from_point.x);
    const amount = (rise / run) / 1.15;
    if (amount > 1) {
      return 1;
    }
    if (amount < -1) {
      return -1;
    }
    return amount;
  }

  /**
   * 끝단에서는 올라가면 눈에 띄게 굵고, 내려가면 눈에 띄게 얇습니다.
   * 끝단이 지나간 뒤에는 이 차이가 원래 굵기로 돌아갑니다.
   */
  function trace_line_width(amount) {
    if (amount >= 0) {
      return WAVE_LINE_WIDTH + amount * 1.45;
    }
    return Math.max(0.28, WAVE_LINE_WIDTH + amount * 0.57);
  }

  /**
   * #d6d3cc 같은 색에서 두 자리씩 밝기 값을 읽습니다. 형식이 다르면 빈 값을 돌려줍니다.
   */
  function hex_channel(color, offset) {
    if (!color || color.charAt(0) !== "#" || color.length < 7) {
      return null;
    }
    const channel = parseInt(color.slice(offset, offset + 2), 16);
    return Number.isFinite(channel) ? channel : null;
  }

  /**
   * 두 밝기 사이를 비율만큼 섞습니다.
   */
  function mix_channel(from_value, to_value, weight) {
    return Math.round(from_value + (to_value - from_value) * weight);
  }

  // 이만큼 내려가면 가장 얇고 어두운 끝에 닿습니다. 그보다 짧은 내리막은 덜 변합니다.
  const WAVE_DROP_FULL_PX = 14;
  // 이만큼 올라가면 선이 밝고 투명한 금색에 닿습니다. 짧은 오르막은 덜 물듭니다.
  const WAVE_RISE_FULL_PX = 6;
  const WAVE_GOLD_RED = 255;
  const WAVE_GOLD_GREEN = 236;
  const WAVE_GOLD_BLUE = 160;
  const WAVE_GOLD_ALPHA = 0.82;

  /**
   * 기울기에 맞는 색입니다.
   * 올라갈수록 흰색에서 밝고 투명한 금색으로 바뀌고, 내려갈수록 어두워집니다.
   */
  function trace_channels(base_color, amount) {
    const red = hex_channel(base_color, 1);
    const green = hex_channel(base_color, 3);
    const blue = hex_channel(base_color, 5);
    if (red === null || green === null || blue === null) {
      return null;
    }
    if (amount >= 0) {
      return {
        red: mix_channel(red, WAVE_GOLD_RED, amount),
        green: mix_channel(green, WAVE_GOLD_GREEN, amount),
        blue: mix_channel(blue, WAVE_GOLD_BLUE, amount),
        alpha: 1 - amount * (1 - WAVE_GOLD_ALPHA),
      };
    }
    const weight = Math.abs(amount) * 0.58;
    return {
      red: mix_channel(red, 118, weight),
      green: mix_channel(green, 114, weight),
      blue: mix_channel(blue, 106, weight),
      alpha: 1,
    };
  }

  /**
   * 한 구간의 굵기와 색입니다. 색을 읽지 못하면 기본 흰색 굵기를 씁니다.
   */
  function trace_style(base_color, amount) {
    const channels = trace_channels(base_color, amount);
    if (!channels) {
      return { line_width: WAVE_LINE_WIDTH, red: 214, green: 211, blue: 204, alpha: 1 };
    }
    return {
      line_width: trace_line_width(amount),
      red: channels.red,
      green: channels.green,
      blue: channels.blue,
      alpha: channels.alpha,
    };
  }

  /**
   * 직전 모습에서 목표 모습으로 비율만큼 옮깁니다.
   */
  function lerp_trace_style(from_style, to_style, weight) {
    return {
      line_width: from_style.line_width + (to_style.line_width - from_style.line_width) * weight,
      red: mix_channel(from_style.red, to_style.red, weight),
      green: mix_channel(from_style.green, to_style.green, weight),
      blue: mix_channel(from_style.blue, to_style.blue, weight),
      alpha: from_style.alpha + (to_style.alpha - from_style.alpha) * weight,
    };
  }

  // 끝단이 지나간 뒤 이 시간 동안은 굵기를 유지하고, 그다음 시간 동안 원래 굵기로 돌아옵니다.
  const WAVE_WIDTH_HOLD_S = 0.7;
  const WAVE_WIDTH_RESTORE_S = 1.8;

  /**
   * 재생 끝단이 지나간 지 오래될수록 굵기를 원래 값으로 되돌립니다. 색은 바꾸지 않습니다.
   */
  function settled_line_width(expressive_width, point_x, age) {
    try {
      if (!age || !(age.duration_s > 0) || !(age.view_width > 0)) {
        return expressive_width;
      }
      const seconds_behind = ((age.tip_x - point_x) / age.view_width) * age.duration_s;
      if (!(seconds_behind > WAVE_WIDTH_HOLD_S)) {
        return expressive_width;
      }
      const restore = Math.min(1, (seconds_behind - WAVE_WIDTH_HOLD_S) / WAVE_WIDTH_RESTORE_S);
      return expressive_width + (WAVE_LINE_WIDTH - expressive_width) * restore;
    } catch (error) {
      console.error("지나간 선의 굵기를 되돌리지 못했습니다. 지금 굵기를 유지합니다.", error);
      return expressive_width;
    }
  }

  /**
   * 정해진 굵기와 색으로 짧은 선을 긋습니다.
   * 투명한 금색은 아래 회색과 섞이면 탁해지므로, 그 자리의 회색을 먼저 지웁니다.
   */
  function stroke_fixed_segment(context, from_point, to_point, style) {
    const alpha = typeof style.alpha === "number" ? style.alpha : 1;
    context.lineWidth = style.line_width;
    if (alpha < 0.98) {
      context.save();
      context.globalCompositeOperation = "destination-out";
      context.strokeStyle = "rgba(0,0,0,1)";
      context.beginPath();
      context.moveTo(from_point.x, from_point.y);
      context.lineTo(to_point.x, to_point.y);
      context.stroke();
      context.restore();
    }
    context.beginPath();
    context.strokeStyle = "rgba(" + style.red + "," + style.green + "," + style.blue + "," + alpha.toFixed(3) + ")";
    context.moveTo(from_point.x, from_point.y);
    context.lineTo(to_point.x, to_point.y);
    context.stroke();
  }

  /**
   * 정해진 색으로 긋고, 굵기는 끝단에서 멀어진 만큼 원래 두께로 되돌립니다.
   */
  function stroke_settled_segment(context, from_point, to_point, style, age) {
    stroke_fixed_segment(context, from_point, to_point, {
      line_width: settled_line_width(style.line_width, from_point.x, age),
      red: style.red,
      green: style.green,
      blue: style.blue,
      alpha: style.alpha,
    });
  }

  /**
   * 오르막은 시작 색에서 출발해, 올라온 만큼 밝고 투명한 금색으로 바뀝니다.
   */
  function stroke_ascending_run(context, points, start_index, end_index, start_style, base_color, age) {
    const y_start = points[start_index].y;
    const total_rise = y_start - points[end_index].y;
    if (!(total_rise > 0)) {
      return start_style;
    }
    const target_amount = Math.min(1, total_rise / WAVE_RISE_FULL_PX);
    const white_style = trace_style(base_color, 0);
    const end_style = trace_style(base_color, target_amount);
    let last_style = start_style;
    for (let point_index = start_index + 1; point_index <= end_index; point_index += 1) {
      const from_point = points[point_index - 1];
      const to_point = points[point_index];
      const steps = 4;
      for (let step_index = 0; step_index < steps; step_index += 1) {
        const from_weight = step_index / steps;
        const to_weight = (step_index + 1) / steps;
        const from_y = from_point.y + (to_point.y - from_point.y) * from_weight;
        const progress = Math.max(0, Math.min(1, (y_start - from_y) / total_rise));
        const width_style = lerp_trace_style(start_style, end_style, progress);
        // 골짜기의 어두운 색에서 바로 금색으로 가면 탁해집니다. 먼저 흰색을 지나 금색이 됩니다.
        const color_style = progress < 0.28
          ? lerp_trace_style(start_style, white_style, progress / 0.28)
          : lerp_trace_style(white_style, end_style, (progress - 0.28) / 0.72);
        last_style = {
          line_width: width_style.line_width,
          red: color_style.red,
          green: color_style.green,
          blue: color_style.blue,
          alpha: color_style.alpha,
        };
        stroke_settled_segment(context, {
          x: from_point.x + (to_point.x - from_point.x) * from_weight,
          y: from_y,
        }, {
          x: from_point.x + (to_point.x - from_point.x) * to_weight,
          y: from_point.y + (to_point.y - from_point.y) * to_weight,
        }, last_style, age);
      }
    }
    return lerp_trace_style(start_style, end_style, 1);
  }

  /**
   * 내리막은 시작점의 굵기와 밝기를 유지한 채, 내려온 만큼 점점 얇고 어두워집니다.
   */
  function stroke_descending_run(context, points, start_index, end_index, start_style, base_color, age) {
    const y_start = points[start_index].y;
    const total_drop = points[end_index].y - y_start;
    if (!(total_drop > 0)) {
      return start_style;
    }
    const target_amount = -Math.min(1, total_drop / WAVE_DROP_FULL_PX);
    const end_style = trace_style(base_color, target_amount);
    let last_style = start_style;
    for (let point_index = start_index + 1; point_index <= end_index; point_index += 1) {
      const from_point = points[point_index - 1];
      const to_point = points[point_index];
      const steps = 4;
      for (let step_index = 0; step_index < steps; step_index += 1) {
        const from_weight = step_index / steps;
        const to_weight = (step_index + 1) / steps;
        const from_y = from_point.y + (to_point.y - from_point.y) * from_weight;
        const progress = Math.max(0, Math.min(1, (from_y - y_start) / total_drop));
        last_style = lerp_trace_style(start_style, end_style, progress);
        stroke_settled_segment(context, {
          x: from_point.x + (to_point.x - from_point.x) * from_weight,
          y: from_y,
        }, {
          x: from_point.x + (to_point.x - from_point.x) * to_weight,
          y: from_point.y + (to_point.y - from_point.y) * to_weight,
        }, last_style, age);
      }
    }
    return lerp_trace_style(start_style, end_style, 1);
  }

  /**
   * 재생된 구간을 따라갈 점만 모읍니다. 마지막 점은 재생 위치에서 자릅니다.
   */
  function played_trace_points(wave, ratio) {
    const exact = ratio * (wave.points.length - 1);
    const last_index = Math.min(wave.points.length - 1, Math.floor(exact));
    const fraction = exact - last_index;
    const points = wave.points.slice(0, last_index + 1);
    if (ratio < 1 && fraction > 0 && last_index < wave.points.length - 1) {
      const current = wave.points[last_index];
      const next = wave.points[last_index + 1];
      points.push({
        x: current.x + (next.x - current.x) * fraction,
        y: current.y + (next.y - current.y) * fraction,
      });
    }
    return points;
  }

  /**
   * 재생된 색은 파형의 능선을 따라 그 지점까지 잇습니다.
   * 올라가는 구간은 직전 색에서 시작해 밝고 투명한 금색으로 바뀝니다.
   * 내려가는 구간은 직전 굵기와 밝기에서 시작해 점점 얇고 어두워집니다.
   * 끝단이 지나간 뒤에는 굵기만 원래 두께로 천천히 돌아옵니다.
   */
  function stroke_wave_trace(context, width, height, color, limit_ratio, duration_s) {
    const ratio = Math.max(0, Math.min(1, limit_ratio));
    if (ratio <= 0) {
      return;
    }
    const wave = wave_points(width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    if (wave.points.length < 2) {
      context.strokeStyle = color;
      context.lineWidth = WAVE_LINE_WIDTH;
      context.beginPath();
      context.moveTo(0, wave.mid_y);
      context.lineTo(width * ratio, wave.mid_y);
      context.stroke();
      return;
    }
    const points = played_trace_points(wave, ratio);
    const age = {
      tip_x: points[points.length - 1].x,
      view_width: width,
      duration_s: duration_s,
    };
    let carry_style = trace_style(color, 0);
    let point_index = 1;
    while (point_index < points.length) {
      const from_point = points[point_index - 1];
      const to_point = points[point_index];
      const is_ascending = from_point.y - to_point.y > 0.4;
      if (is_ascending) {
        const run_start = point_index - 1;
        let run_end = point_index;
        while (run_end + 1 < points.length && points[run_end].y - points[run_end + 1].y > 0.4) {
          run_end += 1;
        }
        carry_style = stroke_ascending_run(context, points, run_start, run_end, carry_style, color, age);
        point_index = run_end + 1;
        continue;
      }
      const is_descending = to_point.y - from_point.y > 0.4;
      if (!is_descending) {
        const style = trace_style(color, 0);
        stroke_settled_segment(context, from_point, to_point, style, age);
        carry_style = style;
        point_index += 1;
        continue;
      }
      const run_start = point_index - 1;
      let run_end = point_index;
      while (run_end + 1 < points.length && points[run_end + 1].y - points[run_end].y > 0.4) {
        run_end += 1;
      }
      carry_style = stroke_descending_run(context, points, run_start, run_end, carry_style, color, age);
      point_index = run_end + 1;
    }
  }

  /**
   * 전체 음파는 회색으로 두고, 재생된 부분은 능선을 흰색으로 따라 긋습니다.
   */
  function draw_wave() {
    const plate = document.getElementById("sketch_wave");
    const canvas = document.getElementById("sketch_wave_canvas");
    const elapsed = document.getElementById("sketch_wave_elapsed");
    const total = document.getElementById("sketch_wave_total");
    if (!plate || !canvas || !elapsed || !total) {
      return;
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 2 || height < 2) {
      return;
    }
    try {
      const pixel_ratio = window.devicePixelRatio || 1;
      const pixel_width = Math.round(width * pixel_ratio);
      const pixel_height = Math.round(height * pixel_ratio);
      if (canvas.width !== pixel_width || canvas.height !== pixel_height) {
        canvas.width = pixel_width;
        canvas.height = pixel_height;
      }
      const context = canvas.getContext("2d");
      if (!context) {
        console.error("음파 화면을 열지 못했습니다.");
        return;
      }
      context.setTransform(pixel_ratio, 0, 0, pixel_ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const duration = audio.duration;
      const has_duration = Number.isFinite(duration) && duration > 0;
      const progress = has_duration ? Math.max(0, Math.min(1, audio.currentTime / duration)) : 0;
      context.save();
      context.shadowColor = "rgba(0, 0, 0, 0.72)";
      context.shadowBlur = 1.2;
      context.shadowOffsetY = 0.6;
      stroke_wave_shape(context, width, height, WAVE_REST);
      context.restore();
      if (progress > 0) {
        stroke_wave_trace(context, width, height, WAVE_PLAYED, progress, has_duration ? duration : 0);
      }
      const elapsed_seconds = has_duration ? audio.currentTime : 0;
      const total_seconds = has_duration ? duration : 0;
      elapsed.textContent = format_clock(elapsed_seconds);
      total.textContent = format_clock(total_seconds);
      plate.setAttribute(
        "aria-label",
        "음악 진행 " + format_spoken_clock(elapsed_seconds) + ", 전체 " + format_spoken_clock(total_seconds)
      );
    } catch (error) {
      console.error("음파 진행을 그리지 못했습니다. 재생은 계속됩니다.", error);
    }
  }

  /**
   * 재생 중일 때만 음파 채우기를 반복합니다.
   */
  function start_wave_loop() {
    if (wave_frame_id) {
      return;
    }
    function tick_wave() {
      draw_wave();
      if (!should_show_wave() || audio.paused || audio.ended) {
        wave_frame_id = 0;
        return;
      }
      wave_frame_id = window.requestAnimationFrame(tick_wave);
    }
    wave_frame_id = window.requestAnimationFrame(tick_wave);
  }

  /**
   * 화면을 떠나거나 멈추면 음파 반복을 끊습니다.
   */
  function stop_wave_loop() {
    if (!wave_frame_id) {
      return;
    }
    window.cancelAnimationFrame(wave_frame_id);
    wave_frame_id = 0;
  }

  /**
   * 스케치가 아니면 음파를 숨기고, 스케치면 지금 위치까지 그립니다.
   */
  function sync_wave() {
    const plate = document.getElementById("sketch_wave");
    if (!plate) {
      return;
    }
    if (!should_show_wave()) {
      plate.hidden = true;
      stop_wave_loop();
      return;
    }
    plate.hidden = false;
    window.requestAnimationFrame(function paint_wave_after_show() {
      if (should_show_wave()) {
        draw_wave();
      }
    });
    if (!audio.paused && !audio.ended) {
      start_wave_loop();
    } else {
      stop_wave_loop();
    }
  }

  /**
   * 곡 파일에서 음 높낮이를 한 번 읽어 둡니다. 재생은 기다리지 않습니다.
   */
  function load_wave(file) {
    if (!file) {
      return;
    }
    wave_file = file;
    if (wave_cache[file]) {
      wave_peaks = wave_cache[file];
      sync_wave();
      return;
    }
    const token = ++wave_token;
    wave_peaks = null;
    sync_wave();
    const context = wave_decode_context();
    if (!context) {
      console.error("이 브라우저에서는 음파를 그릴 수 없습니다. 재생은 계속됩니다.");
      return;
    }
    fetch(MUSIC_FOLDER + file)
      .then(function read_wave_file(response) {
        if (!response.ok) {
          throw new Error("wave file");
        }
        return response.arrayBuffer();
      })
      .then(function decode_wave_file(buffer) {
        return decode_audio_buffer(context, buffer);
      })
      .then(function store_wave(decoded) {
        if (token !== wave_token) {
          return;
        }
        const peaks = peaks_from_buffer(decoded);
        wave_cache[file] = peaks;
        if (wave_file === file) {
          wave_peaks = peaks;
          sync_wave();
        }
      })
      .catch(function on_wave_failed(error) {
        console.error("음파를 그리지 못했습니다. 재생은 계속됩니다.", error);
      });
  }

  /**
   * 음파를 읽을 때 쓰는 소리 해석기입니다. 재생 소리와는 따로 둡니다.
   */
  function wave_decode_context() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    if (!wave_context || wave_context.state === "closed") {
      wave_context = new AudioContextClass();
    }
    return wave_context;
  }

  /**
   * 곡 파일을 파형으로 바꿉니다. 브라우저마다 돌려주는 방식이 다릅니다.
   */
  function decode_audio_buffer(context, buffer) {
    return new Promise(function decode_promise(resolve, reject) {
      try {
        const result = context.decodeAudioData(buffer.slice(0), resolve, reject);
        if (result && typeof result.then === "function") {
          result.then(resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 고른 곡을 재생합니다. 이미 재생 중이면 잠시 멈춥니다.
   * is_user_choice가 참이면 그 곡을 반복 순서의 새 기준으로 기록합니다.
   */
  function play_track(index, is_user_choice) {
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
    if (is_user_choice) {
      should_center_shuffle_track = false;
      note_user_choice(index);
    }
    if (is_same_track && audio.ended) {
      try {
        audio.currentTime = 0;
      } catch (error) {
        console.error("곡을 처음부터 다시 열지 못했습니다.", error);
      }
    }

    current_index = index;
    const next_src = MUSIC_FOLDER + track.file;
    if (!audio.src.endsWith(track.file)) {
      audio.src = next_src;
    }
    load_wave(track.file);
    const play_result = audio.play();
    if (play_result && typeof play_result.catch === "function") {
      play_result.catch(function on_play_failed(error) {
        console.error("곡을 재생하지 못했습니다.", error);
        should_center_shuffle_track = false;
        show_music_error(message_element);
        mark_playing_track(list, toggle);
      });
    }
    mark_playing_track(list, toggle);
  }

  const dog_colors = [
    "images/music_dog.png?v=20261119d",
    "images/music_dog_gray.png?v=20261119d",
  ];
  let dog_color_index = 0;

  /**
   * 고른 번호의 강아지 색을 그림에 올립니다.
   */
  function apply_dog_color(color_index) {
    const figure = document.querySelector(".music_offer_dog_figure");
    if (!figure) {
      console.error("강아지 그림을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
      return;
    }
    dog_color_index = color_index;
    figure.src = dog_colors[dog_color_index];
  }

  /**
   * 처음 시작할 때 개나리색과 밝은 회색 중 하나를 고릅니다.
   */
  function pick_startup_dog() {
    apply_dog_color(Math.floor(Math.random() * dog_colors.length));
  }

  /**
   * 강아지를 누르면 다른 색으로 바꿉니다.
   */
  function toggle_dog_color() {
    apply_dog_color((dog_color_index + 1) % dog_colors.length);
  }

  /**
   * 버튼과 한 곡 재생기를 연결합니다.
   */
  function start_music() {
    try {
      pick_startup_dog();
      const dog_button = document.querySelector(".music_offer_dog");
      if (dog_button) {
        dog_button.addEventListener("click", function on_dog_color() {
          toggle_dog_color();
        });
      } else {
        console.error("강아지 버튼을 찾지 못했습니다. 색을 바꾸려면 페이지를 새로고침해 주세요.");
      }
      const toggle = require_element("music_toggle");
      const panel = require_element("music_panel");
      const list = require_element("music_list");
      const message_element = require_element("music_message");
      const music_box = toggle ? toggle.closest(".music_box") : null;
      const sound_button = require_element("sound_toggle");
      const offer = require_element("music_offer");
      const offer_yes = require_element("music_offer_yes");
      const offer_no = require_element("music_offer_no");
      const offer_close = require_element("music_offer_close");
      if (!toggle || !panel || !list || !message_element || !music_box) {
        return;
      }
      if (TRACKS.length === 0) {
        console.error("재생할 곡이 없습니다.");
        show_music_error(message_element);
        return;
      }

      build_list(list);
      keep_page_still_while_list_scrolls(panel, list);
      panel.querySelectorAll(".music_mode").forEach(function bind_mode(button) {
        button.addEventListener("click", function on_mode_click() {
          set_play_mode(button.getAttribute("data-play-mode"));
        });
      });
      const prev_button = document.getElementById("music_prev");
      const next_button = document.getElementById("music_next");
      if (!prev_button || !next_button) {
        console.error("이전 곡 또는 다음 곡 버튼을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
      } else {
        prev_button.addEventListener("click", function on_prev_click() {
          play_nearby_track(-1);
        });
        next_button.addEventListener("click", function on_next_click() {
          play_nearby_track(1);
        });
      }
      toggle.addEventListener("click", function on_toggle_click() {
        set_panel_open(panel, toggle, !is_open);
      });
      document.addEventListener("click", function on_outside_click(event) {
        if (!is_open || music_box.contains(event.target)) {
          return;
        }
        if (event.target.closest && event.target.closest("#sound_toggle")) {
          return;
        }
        if (Date.now() < ignore_outside_until) {
          return;
        }
        set_panel_open(panel, toggle, false);
      });
      document.addEventListener("today_word_design_change", function on_design_change_close_list() {
        try {
          sync_wave();
          if (!is_open) {
            return;
          }
          set_panel_open(panel, toggle, false);
        } catch (error) {
          console.error("화면을 바꾼 뒤 음악 목록을 접지 못했습니다. Music 버튼을 눌러 주세요.", error);
        }
      });
      document.addEventListener("today_word_open_music_list", function on_toggle_from_swipe() {
        try {
          ignore_outside_until = Date.now() + 700;
          set_panel_open(panel, toggle, !is_open);
        } catch (error) {
          console.error("밀어서 음악 목록을 바꾸지 못했습니다. Music 버튼을 눌러 주세요.", error);
        }
      });
      window.addEventListener("resize", function on_panel_resize() {
        if (is_open) {
          center_music_panel(panel);
        }
      });
      document.addEventListener("keydown", function on_escape(event) {
        if (event.key === "Escape" && is_open) {
          set_panel_open(panel, toggle, false);
        }
      });
      audio.addEventListener("ended", function on_track_ended() {
        try {
          const next_index = next_index_after_end();
          if (next_index < 0) {
            mark_playing_track(list, toggle);
            return;
          }
          if (play_mode === PLAY_MODE_SHUFFLE && is_open) {
            should_center_shuffle_track = true;
          }
          play_track(next_index, false);
        } catch (error) {
          console.error("다음 곡을 정하지 못했습니다. 다른 곡을 눌러 주세요.", error);
          show_music_error(message_element);
          mark_playing_track(list, toggle);
        }
      });
      audio.addEventListener("error", function on_audio_error() {
        console.error("곡 파일을 열지 못했습니다.", audio.src);
        show_music_error(message_element);
        mark_playing_track(list, toggle);
      });
      audio.addEventListener("play", function on_play() {
        mark_playing_track(list, toggle);
        if (should_center_shuffle_track) {
          should_center_shuffle_track = false;
          reveal_playing_track();
        }
        start_meter();
        sync_wave();
      });
      audio.addEventListener("timeupdate", update_remain);
      audio.addEventListener("loadedmetadata", update_remain);
      audio.addEventListener("durationchange", update_remain);
      audio.addEventListener("pause", function on_pause() {
        stop_meter();
        mark_playing_track(list, toggle);
        sync_wave();
      });
      window.addEventListener("resize", function on_wave_resize() {
        if (should_show_wave()) {
          draw_wave();
        }
      });
      if (sound_button) {
        sound_button.addEventListener("click", function on_sound_click() {
          set_muted(!is_muted);
        });
      }
      if (offer && offer_yes && offer_no && offer_close) {
        offer_yes.addEventListener("click", accept_music_offer);
        offer_no.addEventListener("click", close_music_offer);
        offer_close.addEventListener("click", close_music_offer);
        offer.addEventListener("animationend", function on_offer_risen(event) {
          if (event.animationName !== "music_offer_rise") {
            return;
          }
          offer.classList.remove("is_card_in");
        });
        /* 처음 오로라가 열린 뒤에 한 번만 묻습니다. */
        let has_asked_music = false;
        document.addEventListener("today_word_aurora_swipe", function on_aurora_swipe() {
          if (has_asked_music || is_offer_open) {
            return;
          }
          has_asked_music = true;
          open_music_offer();
        });
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

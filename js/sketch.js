/**
 * 스케치 화면에서 원본 사진을 한 장씩 보여 줍니다.
 * 화면을 짧게 터치하면 다음 사진으로 바뀌고, 가로로 밀면 화면 넘기기에 맡깁니다.
 */
(function init_sketch() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  // 폴더에 남아 있는 원본만 순서대로 둡니다. 지워진 번호는 넣지 않습니다.
  const sketch_files = [
    "moonwater/moon_001.jpg",
    "moonwater/moon_014.jpg",
    "moonwater/moon_015.jpg",
    "moonwater/moon_021.jpg",
    "moonwater/moon_028.jpg",
    "moonwater/moon_035.jpg",
    "moonwater/moon_037.jpg",
    "moonwater/moon_051.jpg",
    "moonwater/moon_056.jpg",
    "moonwater/moon_060.jpg",
    "moonwater/moon_061.jpg",
    "moonwater/moon_091.jpg",
    "moonwater/moon_092.jpg",
    "moonwater/moon_095.jpg",
    "moonwater/moon_096.jpg",
    "moonwater/moon_099.jpg",
  ];

  let photo_index = 0;
  let failed_steps = 0;
  let paint_token = 0;
  let shown_src = "";
  let tap_x = 0;
  let tap_y = 0;
  let is_tap_tracking = false;
  let is_pastel_held = false;
  let pastel_token = 0;
  let last_touch_at = 0;
  const PASTEL_FOLDER = "images/sketches/";

  /**
   * 지금 화면이 스케치인지 확인합니다.
   */
  function is_sketch_design() {
    return document.documentElement.dataset.design === root.DESIGN_SKETCH;
  }

  /**
   * 원본 목록에서 지금 차례의 사진 정보를 고릅니다.
   */
  function current_photo() {
    const file_name = sketch_files[photo_index];
    const folder = root.VIGNETTE_FOLDER || "images/vignettes/";
    let caption = "달빛에 비친 물";
    const listed = root.VIGNETTES && root.VIGNETTES.joy;
    if (listed && listed.length) {
      const found = listed.find(function match_file(item) {
        return item.file === file_name;
      });
      if (found && found.caption) {
        caption = found.caption;
      }
    }
    return {
      src: folder + file_name,
      pastel_src: PASTEL_FOLDER + file_name + "?v=20261121e",
      caption: caption,
    };
  }

  /**
   * 움직임 줄이기를 켠 브라우저에서는 파스텔로 넘기지 않습니다.
   */
  function prefers_still_motion() {
    try {
      return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (error) {
      console.error("움직임 설정을 확인하지 못했습니다.", error);
      return false;
    }
  }

  /**
   * 파스텔을 거두고 원본만 남깁니다.
   */
  function stop_pastel_fade() {
    const pastel = document.getElementById("sketch_pastel");
    if (!pastel) {
      return;
    }
    pastel.classList.remove("is_breathing");
  }

  /**
   * 손을 대지 않으면 파스텔로 천천히 갔다가 원본으로 천천히 돌아옵니다.
   */
  function begin_pastel_fade() {
    try {
      const pastel = document.getElementById("sketch_pastel");
      if (!pastel || is_pastel_held || !is_sketch_design() || prefers_still_motion()) {
        return;
      }
      if (!pastel.getAttribute("src") || !pastel.complete || pastel.naturalWidth === 0) {
        return;
      }
      pastel.classList.remove("is_breathing");
      void pastel.offsetWidth;
      pastel.classList.add("is_breathing");
    } catch (error) {
      console.error("파스텔로 바꾸지 못했습니다. 원본 사진을 그대로 보여 줍니다.", error);
    }
  }

  /**
   * 지금 원본과 같은 파스텔을 준비한 뒤, 천천히 겹치기 시작합니다.
   */
  function load_pastel(on_ready) {
    try {
      const pastel = document.getElementById("sketch_pastel");
      if (!pastel || !sketch_files.length) {
        return;
      }
      const request_src = current_photo().pastel_src;
      const token = ++pastel_token;
      pastel.onload = function on_pastel_load() {
        if (token !== pastel_token) {
          return;
        }
        on_ready();
      };
      pastel.onerror = function on_pastel_error() {
        if (token !== pastel_token) {
          return;
        }
        console.error("파스텔 사진을 불러오지 못했습니다. 원본을 그대로 보여 줍니다.", request_src);
      };
      if (pastel.getAttribute("src") === request_src && pastel.complete && pastel.naturalWidth > 0) {
        on_ready();
        return;
      }
      pastel.src = request_src;
    } catch (error) {
      console.error("파스텔 전환을 준비하지 못했습니다. 원본 사진을 그대로 보여 줍니다.", error);
    }
  }

  /**
   * 지금 차례의 원본을 화면에 겁니다.
   * 다음 사진이 다 열리기 전에는 지금 사진을 그대로 두어 빈 화면이 번쩍이지 않습니다.
   */
  function show_current_photo() {
    try {
      const shown = document.getElementById("sketch_image");
      const cover = document.getElementById("sketch_image_next");
      if (!shown || !cover || !sketch_files.length) {
        console.error("스케치 사진을 찾지 못했습니다.");
        return;
      }
      const photo = current_photo();
      const request_src = photo.src;
      const token = ++paint_token;
      shown.alt = "원본 사진, " + photo.caption;
      stop_pastel_fade();
      if (!shown.getAttribute("src")) {
        shown.src = request_src;
        shown_src = request_src;
        load_pastel(begin_pastel_fade);
        return;
      }
      if (shown_src === request_src) {
        load_pastel(begin_pastel_fade);
        return;
      }
      cover.onload = function on_cover_load() {
        if (token !== paint_token) {
          return;
        }
        // 새 사진을 먼저 위에 올린 뒤, 아래 사진을 같은 그림으로 바꿉니다.
        cover.classList.add("is_shown");
        window.requestAnimationFrame(function copy_under_cover() {
          if (token !== paint_token) {
            return;
          }
          shown.src = request_src;
          shown_src = request_src;
          window.requestAnimationFrame(function hide_cover() {
            if (token !== paint_token) {
              return;
            }
            cover.classList.remove("is_shown");
            load_pastel(begin_pastel_fade);
          });
        });
      };
      cover.onerror = function on_cover_error() {
        if (token !== paint_token) {
          return;
        }
        on_photo_error();
      };
      cover.src = request_src;
    } catch (error) {
      console.error("원본 사진을 보여주지 못했습니다. 화면을 다시 터치해 주세요.", error);
    }
  }

  /**
   * 다음 원본 한 장으로 바꿉니다. 마지막 다음이면 첫 장으로 돌아갑니다.
   */
  function show_next_photo() {
    if (!sketch_files.length) {
      return;
    }
    photo_index = (photo_index + 1) % sketch_files.length;
    show_current_photo();
  }

  /**
   * 사진을 읽지 못하면 그 장은 건너뜁니다. 전부 실패하면 더 넘기지 않습니다.
   */
  function on_photo_error() {
    try {
      failed_steps += 1;
      console.error("원본 사진을 불러오지 못했습니다. 페이지를 새로고침해 주세요.", current_photo().src);
      if (failed_steps >= sketch_files.length) {
        return;
      }
      show_next_photo();
    } catch (error) {
      console.error("다음 원본으로 넘어가지 못했습니다.", error);
    }
  }

  /**
   * 사진이 열리면 실패 횟수를 비웁니다.
   */
  function on_photo_load() {
    failed_steps = 0;
  }

  /**
   * 음악 목록이 열려 있으면 사진 넘기기를 하지 않습니다. 목록만 접힙니다.
   */
  function is_music_list_open() {
    return document.documentElement.classList.contains("is_music_list_open");
  }

  /**
   * 손가락이 거의 움직이지 않았으면 다음 사진으로 넘깁니다.
   * 가로로 민 터치는 화면 전환이므로 사진은 그대로 둡니다.
   * 음악 목록이 열린 터치는 파스텔 흐름도 멈추지 않습니다.
   */
  function on_sketch_touch_start(event) {
    try {
      if (!is_sketch_design() || !event.touches || event.touches.length !== 1) {
        is_tap_tracking = false;
        return;
      }
      if (is_music_list_open()) {
        is_tap_tracking = false;
        return;
      }
      if (event.target && event.target.closest && event.target.closest("a, button, input")) {
        is_tap_tracking = false;
        return;
      }
      tap_x = event.touches[0].clientX;
      tap_y = event.touches[0].clientY;
      is_tap_tracking = true;
      is_pastel_held = true;
      stop_pastel_fade();
    } catch (error) {
      is_tap_tracking = false;
      console.error("사진 터치를 시작하지 못했습니다.", error);
    }
  }

  /**
   * 짧게 떼면 다음 원본 한 장을 보여 줍니다.
   */
  function on_sketch_touch_end(event) {
    try {
      if (!is_tap_tracking) {
        return;
      }
      is_tap_tracking = false;
      is_pastel_held = false;
      last_touch_at = Date.now();
      if (!is_sketch_design()) {
        return;
      }
      const touch = event.changedTouches && event.changedTouches[0];
      if (!touch) {
        return;
      }
      const delta_x = touch.clientX - tap_x;
      const delta_y = touch.clientY - tap_y;
      if (Math.abs(delta_x) > 12 || Math.abs(delta_y) > 12) {
        begin_pastel_fade();
        return;
      }
      show_next_photo();
    } catch (error) {
      console.error("다음 원본으로 바꾸지 못했습니다. 사진을 다시 터치해 주세요.", error);
    }
  }

  /**
   * 마우스로 누르면 다음 원본으로 바꿉니다. 터치 직후의 클릭은 한 번만 셉니다.
   */
  function on_sketch_click(event) {
    try {
      if (!is_sketch_design() || is_music_list_open()) {
        return;
      }
      if (Date.now() - last_touch_at < 700) {
        return;
      }
      if (event.target && event.target.closest && event.target.closest("a, button, input")) {
        return;
      }
      show_next_photo();
    } catch (error) {
      console.error("다음 원본으로 바꾸지 못했습니다. 사진을 다시 눌러 주세요.", error);
    }
  }

  /**
   * 스케치 사진과 터치를 연결합니다.
   */
  function bind_sketch() {
    try {
      const stage = document.getElementById("sketch_stage");
      const image = document.getElementById("sketch_image");
      const cover = document.getElementById("sketch_image_next");
      if (!stage || !image || !cover) {
        console.error("스케치 화면을 찾지 못했습니다.");
        return;
      }
      const pastel = document.getElementById("sketch_pastel");
      if (!pastel) {
        console.error("파스텔 사진을 얹을 자리를 찾지 못했습니다.");
        return;
      }
      image.addEventListener("error", on_photo_error);
      image.addEventListener("load", on_photo_load);
      stage.addEventListener("touchstart", on_sketch_touch_start, { passive: true });
      stage.addEventListener("touchend", on_sketch_touch_end);
      stage.addEventListener("touchcancel", function on_sketch_touch_cancel() {
        is_tap_tracking = false;
        is_pastel_held = false;
        begin_pastel_fade();
      });
      stage.addEventListener("click", on_sketch_click);
      const design_watch = new MutationObserver(function on_design_attribute() {
        try {
          if (is_sketch_design()) {
            load_pastel(begin_pastel_fade);
            return;
          }
          is_pastel_held = false;
          stop_pastel_fade();
        } catch (error) {
          console.error("스케치 파스텔 전환을 맞추지 못했습니다.", error);
        }
      });
      design_watch.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-design"],
      });
      show_current_photo();
    } catch (error) {
      console.error("스케치 화면을 준비하지 못했습니다. 페이지를 새로고침해 주세요.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind_sketch);
  } else {
    bind_sketch();
  }
})();

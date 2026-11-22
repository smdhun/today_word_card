/**
 * 타로, 오로라, 스케치, 인간관계 화면을 바꾸고, 고른 화면을 브라우저에 기억합니다.
 * 휴대폰에서는 손가락을 가로로 밀면 오로라, 타로, 스케치 순으로 바뀝니다.
 * 스케치에서 같은 방향(뮤직 버튼 쪽)으로 밀면 노래 목록이 열립니다.
 * 화면이 그려지기 전에 정해야 색이 깜빡이지 않으므로 head에서 불러옵니다.
 */
(function init_design() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 타로, 오로라, 스케치, 인간관계 중 하나인지 확인합니다.
   */
  function is_known_design(design) {
    return (
      design === root.DESIGN_TAROT ||
      design === root.DESIGN_AURORA ||
      design === root.DESIGN_SKETCH ||
      design === root.DESIGN_RELATION
    );
  }

  /**
   * 고른 디자인을 저장합니다. 성공하면 true를 돌려줍니다.
   * 다음 실행의 첫 화면은 이 값과 상관없이 타로입니다.
   */
  function save_design(design) {
    try {
      window.localStorage.setItem(root.DESIGN_STORAGE_KEY, design);
      return true;
    } catch (error) {
      console.error("디자인을 기억해 두지 못했습니다.", error);
      return false;
    }
  }

  /**
   * html 태그에 디자인을 적습니다. 색과 배치는 css가 이 값을 보고 바꿉니다.
   */
  function apply_design(design) {
    try {
      const safe_design = is_known_design(design) ? design : root.DESIGN_DEFAULT;
      document.documentElement.dataset.design = safe_design;
      mark_pressed_button(safe_design);
    } catch (error) {
      console.error("디자인을 적용하지 못했습니다.", error);
    }
  }

  /**
   * 지금 고른 디자인 버튼만 눌린 상태로 표시합니다.
   */
  function mark_pressed_button(design) {
    try {
      document.querySelectorAll("[data-design-button]").forEach(function mark_button(button) {
        const is_pressed = button.dataset.design === design;
        button.setAttribute("aria-pressed", is_pressed ? "true" : "false");
      });
    } catch (error) {
      console.error("디자인 버튼 표시를 바꾸지 못했습니다.", error);
    }
  }

  /**
   * 디자인은 바뀌었지만 기억하지 못했을 때 다음 행동을 알려 줍니다.
   */
  function show_save_notice() {
    try {
      const status_message = document.getElementById("status_message");
      if (status_message && root.MESSAGES) {
        status_message.textContent = root.MESSAGES.design_save_failed;
      }
    } catch (error) {
      console.error("디자인 안내를 보여주지 못했습니다.", error);
    }
  }

  /**
   * 화면 안내를 이미 치운 브라우저인지 확인합니다.
   * 서랍을 읽지 못하면 안내를 다시 보여 줍니다.
   */
  function has_seen_design_hint() {
    try {
      if (!window.localStorage || !root.DESIGN_HINT_KEY) {
        return false;
      }
      return window.localStorage.getItem(root.DESIGN_HINT_KEY) === "seen";
    } catch (error) {
      console.error("화면 안내 기록을 읽지 못했습니다.", error);
      return false;
    }
  }

  /**
   * 화면 안내를 본 것으로 기록합니다. 실패해도 카드 사용은 그대로 둡니다.
   */
  function remember_design_hint() {
    try {
      if (!window.localStorage || !root.DESIGN_HINT_KEY) {
        return false;
      }
      window.localStorage.setItem(root.DESIGN_HINT_KEY, "seen");
      return true;
    } catch (error) {
      console.error("화면 안내를 기억해 두지 못했습니다. 다음 방문 때 안내가 다시 나올 수 있습니다.", error);
      return false;
    }
  }

  /**
   * 화면 안내를 숨기고, 이 브라우저에서는 다시 나오지 않게 기록합니다.
   */
  function hide_design_hint() {
    try {
      const hint = document.getElementById("design_hint");
      if (!hint || hint.hidden) {
        return;
      }
      hint.hidden = true;
      hint.classList.remove("is_showing");
      remember_design_hint();
    } catch (error) {
      console.error("화면 안내를 닫지 못했습니다.", error);
    }
  }

  /**
   * 처음 방문이면 세 버튼 아래 안내를 보여 줍니다.
   */
  function show_design_hint() {
    try {
      const hint = document.getElementById("design_hint");
      if (!hint) {
        console.error("화면 안내 칸을 찾지 못했습니다.");
        return;
      }
      if (has_seen_design_hint()) {
        return;
      }
      hint.hidden = false;
      hint.classList.add("is_showing");
    } catch (error) {
      console.error("화면 안내를 보여주지 못했습니다.", error);
    }
  }

  /**
   * 닫기를 누르면 안내만 치웁니다. 고른 화면은 바꾸지 않습니다.
   */
  function on_close_design_hint(event) {
    try {
      event.preventDefault();
      hide_design_hint();
    } catch (error) {
      console.error("화면 안내를 닫지 못했습니다.", error);
    }
  }

  const SWIPE_MIN_X = 70;
  const SWIPE_MAX_MS = 400;
  const SLIDE_FOLLOW_MAX = 140;
  let swipe_start_x = 0;
  let swipe_start_y = 0;
  let swipe_start_at = 0;
  let is_swipe_tracking = false;
  let is_slide_playing = false;
  let slide_token = 0;
  let slide_preview = null;
  let preview_direction = 0;
  let preview_travel = 0;
  let cached_css_text = "";
  let has_left_opening_tarot = false;

  /**
   * 버튼과 밀기가 같은 길로 화면을 바꿉니다.
   * 이미 그 화면이어도 안내는 치웁니다.
   */
  function commit_design(next_design) {
    try {
      if (!is_known_design(next_design)) {
        console.error("알 수 없는 디자인입니다.", next_design);
        return;
      }
      // 브라우저 화면 전환이 옛 화면을 찍어 새 크기로 늘리지 않게, 바꾸는 순간에 끊습니다.
      document.documentElement.classList.add("is_design_cut");
      apply_design(next_design);
      if (!save_design(next_design)) {
        show_save_notice();
      }
      document.dispatchEvent(new CustomEvent("today_word_design_change"));
      hide_design_hint();
      window.requestAnimationFrame(function end_design_cut() {
        document.documentElement.classList.remove("is_design_cut");
      });
    } catch (error) {
      console.error("디자인을 바꾸지 못했습니다.", error);
    }
  }

  /**
   * 버튼을 누르면 그 디자인으로 바꾸고 선택을 기억합니다.
   */
  function on_pick_design(event) {
    const button = event.currentTarget;
    const next_design = button && button.dataset ? button.dataset.design : "";
    commit_design(next_design);
  }

  /**
   * 카메라나 음악 질문이 열려 있으면 밀기로 화면을 바꾸지 않습니다.
   */
  function is_overlay_open(element_id) {
    const element = document.getElementById(element_id);
    return Boolean(element && !element.hidden);
  }

  /**
   * 버튼, 입력, 음악 목록에서 시작한 터치는 화면 넘기기가 아닙니다.
   */
  function is_swipe_blocked(target) {
    try {
      if (is_overlay_open("camera_sheet") || is_overlay_open("music_offer")) {
        return true;
      }
      if (!target || typeof target.closest !== "function") {
        return false;
      }
      return Boolean(target.closest("button, a, input, textarea, select, label, #music_panel"));
    } catch (error) {
      console.error("밀기 시작 위치를 확인하지 못했습니다.", error);
      return true;
    }
  }

  /**
   * 손가락 방향의 옆 화면입니다. 왼쪽(-1)은 다음, 오른쪽(1)은 이전입니다.
   * 순서는 오로라, 타로, 스케치입니다. 끝에서는 빈 문자열입니다.
   */
  function design_beside(direction) {
    const current_design = document.documentElement.dataset.design;
    if (direction < 0) {
      if (current_design === root.DESIGN_AURORA) {
        return root.DESIGN_TAROT;
      }
      if (current_design === root.DESIGN_TAROT) {
        return root.DESIGN_SKETCH;
      }
      return "";
    }
    if (direction > 0) {
      if (current_design === root.DESIGN_SKETCH) {
        return root.DESIGN_TAROT;
      }
      if (current_design === root.DESIGN_TAROT) {
        return root.DESIGN_AURORA;
      }
    }
    return "";
  }

  /**
   * 스케치에서 뮤직 버튼 쪽으로 미는 손인지 확인합니다.
   * 버튼은 스케치 오른쪽에 있고, 다음 화면으로 가는 손과 같이 왼쪽으로 움직입니다.
   */
  function is_sketch_music_swipe(delta_x) {
    return document.documentElement.dataset.design === root.DESIGN_SKETCH && delta_x < 0;
  }

  /**
   * 손가락이 충분히 움직였을 때만 옆 화면 이름을 돌려줍니다.
   */
  function design_for_swipe(delta_x) {
    if (Math.abs(delta_x) < SWIPE_MIN_X) {
      return "";
    }
    return design_beside(delta_x < 0 ? -1 : 1);
  }

  /**
   * 밀리는 본문입니다. 위쪽 버튼은 제자리에 둡니다.
   */
  function stage_element() {
    return document.querySelector("main.stage");
  }

  /**
   * 움직임 줄이기를 켠 브라우저인지 확인합니다.
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
   * 손가락이 연 자리만큼 화면을 옮깁니다.
   * 넘어갈 수 있으면 손가락과 같게 움직이고, 없으면 조금만 밀립니다.
   */
  function follow_shift(delta_x) {
    const can_leave = Boolean(design_beside(delta_x < 0 ? -1 : 1));
    if (!can_leave) {
      const rubbed = delta_x * 0.16;
      return Math.max(-24, Math.min(24, rubbed));
    }
    const travel = preview_travel || SLIDE_FOLLOW_MAX;
    if (delta_x < 0) {
      return Math.max(delta_x, -travel);
    }
    return Math.min(delta_x, travel);
  }

  /**
   * 본문을 가로로 옮깁니다. is_animated가 참이면 부드럽게 이동합니다.
   */
  function move_stage(shift_x, is_animated) {
    const stage = stage_element();
    if (!stage) {
      return null;
    }
    document.documentElement.classList.add("is_design_sliding");
    stage.classList.toggle("is_design_sliding", Boolean(is_animated));
    stage.style.transform = "translate3d(" + Math.round(shift_x) + "px, 0, 0)";
    return stage;
  }

  /**
   * 밀기 이동을 걷어 내고 본문을 제자리로 되돌립니다.
   */
  function release_stage() {
    const stage = stage_element();
    document.documentElement.classList.remove("is_design_sliding", "is_slide_to_tarot", "is_slide_to_aurora");
    document.documentElement.style.removeProperty("--slide_from");
    remove_preview();
    if (!stage) {
      return;
    }
    stage.classList.remove("is_design_sliding");
    stage.style.transitionDuration = "";
    stage.style.transition = "";
    stage.style.transform = "";
  }

  /**
   * 화면을 바꾸지 않으면 밀었던 두 화면이 제자리로 돌아옵니다.
   */
  function spring_stage_back() {
    const stage = stage_element();
    const token = ++slide_token;
    if (!stage) {
      remove_preview();
      return;
    }
    is_slide_playing = true;
    document.documentElement.classList.add("is_design_sliding");
    stage.classList.add("is_design_sliding");
    if (slide_preview && preview_direction) {
      slide_preview.classList.add("is_design_sliding");
    }
    void stage.offsetWidth;
    stage.style.transform = "translate3d(0, 0, 0)";
    if (slide_preview && preview_direction) {
      slide_preview.style.transform = "translate3d(" + (-preview_direction * preview_travel) + "px, 0, 0)";
    }
    window.setTimeout(function clear_spring() {
      if (token !== slide_token) {
        return;
      }
      is_slide_playing = false;
      release_stage();
    }, 580);
  }

  /**
   * 본문에 걸려 있는 가로 이동 거리를 읽습니다.
   */
  function read_stage_shift(stage) {
    const matched = /translate3d\((-?\d+(?:\.\d+)?)px/.exec(stage.style.transform || "");
    return matched ? Number(matched[1]) : 0;
  }

  /**
   * 옆에 붙여 둔 다음 화면을 치웁니다.
   */
  function remove_preview() {
    if (slide_preview) {
      slide_preview.remove();
      slide_preview = null;
    }
    preview_direction = 0;
    preview_travel = 0;
  }

  /**
   * 같은 주소의 스타일을 한 번만 모아, 옆 화면을 같은 모습으로 그립니다.
   */
  function collect_css_text() {
    if (cached_css_text) {
      return cached_css_text;
    }
    const css_parts = [];
    Array.prototype.forEach.call(document.styleSheets, function copy_sheet(sheet) {
      try {
        Array.prototype.forEach.call(sheet.cssRules, function copy_rule(rule) {
          css_parts.push(rule.cssText);
        });
      } catch (error) {
        /* 다른 주소의 글꼴 파일은 규칙으로 복사되지 않습니다. */
      }
    });
    cached_css_text = css_parts.join("\n");
    return cached_css_text;
  }

  /**
   * 스케치가 도착한 뒤의 사진 칸입니다. 위 버튼을 뺀 화면 전체라, 넘기는 동안 비율이 바뀌지 않습니다.
   */
  function sketch_bleed_rect() {
    try {
      const bar = document.querySelector(".top_bar");
      const bar_bottom = bar ? Math.max(0, Math.round(bar.getBoundingClientRect().bottom)) : 0;
      const width = Math.round(window.innerWidth) || 320;
      const height = Math.max(120, Math.round(window.innerHeight - bar_bottom));
      return { top: bar_bottom, left: 0, width: width, height: height };
    } catch (error) {
      console.error("스케치 화면 크기를 재지 못했습니다.", error);
      return null;
    }
  }

  /**
   * 빈 문서가 하얗게 그려지기 전에 붙인 화면을 숨겼다가, 사진이 최종 크기로 놓이면 보여 줍니다.
   */
  function reveal_ghost_frame(frame, design_name) {
    try {
      const ghost_document = frame.contentDocument;
      const sketch_image = ghost_document && ghost_document.getElementById("sketch_image");
      const show_frame = function show_frame() {
        window.requestAnimationFrame(function paint_frame() {
          if (frame.isConnected) {
            frame.style.visibility = "";
          }
        });
      };
      if (design_name === root.DESIGN_SKETCH && sketch_image && !sketch_image.complete) {
        sketch_image.addEventListener("load", show_frame, { once: true });
        sketch_image.addEventListener("error", show_frame, { once: true });
        return;
      }
      show_frame();
    } catch (error) {
      frame.style.visibility = "";
      console.error("넘기는 화면을 보여주지 못했습니다.", error);
    }
  }

  /**
   * 밀리는 방향의 다음 화면을 바로 옆에 붙여 둡니다.
   */
  function ensure_preview(direction) {
    if (slide_preview || !direction) {
      return;
    }
    const stage = stage_element();
    if (!stage) {
      return;
    }
    const next_design = design_beside(direction);
    if (!next_design) {
      return;
    }
    const from_x = read_stage_shift(stage);
    const rect = stage.getBoundingClientRect();
    const bleed = next_design === root.DESIGN_SKETCH ? sketch_bleed_rect() : null;
    preview_travel = (bleed && bleed.width) || Math.round(rect.width) || 320;
    preview_direction = direction;
    slide_preview = build_slide_ghost(stage, next_design, from_x);
    if (!slide_preview) {
      preview_direction = 0;
      preview_travel = 0;
      return;
    }
    slide_preview.style.transform = "translate3d(" + (from_x - direction * preview_travel) + "px, 0, 0)";
  }

  /**
   * 지금 화면과 옆 화면을 같은 거리로 옮깁니다.
   */
  function place_pair(shift_x, is_animated) {
    const stage = move_stage(shift_x, is_animated);
    if (!slide_preview || !preview_direction) {
      return stage;
    }
    slide_preview.classList.toggle("is_design_sliding", Boolean(is_animated));
    const preview_x = shift_x - preview_direction * preview_travel;
    slide_preview.style.transform = "translate3d(" + Math.round(preview_x) + "px, 0, 0)";
    return stage;
  }

  /**
   * 옆 화면의 빈 바탕색입니다. 사진이 뜨기 전에 다른 화면 색이 비치지 않게 합니다.
   */
  function ghost_background(design_name) {
    if (design_name === root.DESIGN_AURORA) {
      return "#0f131d";
    }
    if (design_name === root.DESIGN_SKETCH) {
      return "#101418";
    }
    return "#16130a";
  }

  /**
   * 고른 디자인의 화면을 다른 문서에 붙여, 옆에서 함께 밀리게 합니다.
   */
  function build_slide_ghost(stage, design_name, from_x) {
    try {
      const is_sketch = design_name === root.DESIGN_SKETCH;
      const rect = is_sketch ? (sketch_bleed_rect() || stage.getBoundingClientRect()) : stage.getBoundingClientRect();
      const frame = document.createElement("iframe");
      const css_parts = [collect_css_text()];
      frame.className = "stage_ghost_frame";
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      frame.style.visibility = "hidden";
      frame.style.top = rect.top + "px";
      frame.style.left = (rect.left - from_x) + "px";
      frame.style.width = rect.width + "px";
      frame.style.height = rect.height + "px";
      frame.style.background = ghost_background(design_name);
      frame.style.transform = "translate3d(" + from_x + "px, 0, 0)";
      document.body.appendChild(frame);
      const font_links = [];
      document.querySelectorAll("link[rel='stylesheet']").forEach(function copy_font(link) {
        if (link.href && link.href.indexOf("fonts.googleapis.com") !== -1) {
          font_links.push("<link rel=\"stylesheet\" href=\"" + link.href + "\">");
        }
      });
      const ghost_document = frame.contentDocument;
      if (!ghost_document) {
        frame.remove();
        return null;
      }
      const sketch_lock = is_sketch
        ? "html,body{height:100%;background:#101418;}" +
          ".stage{height:100%!important;padding:0!important;gap:0!important;}" +
          ".sketch_stage,.sketch_frame{height:100%!important;flex:1 1 auto!important;}" +
          ".sketch_image{transition:none!important;}"
        : "";
      ghost_document.open();
      ghost_document.write(
        "<!DOCTYPE html><html data-design=\"" + design_name + "\"><head>" +
        font_links.join("") +
        "<style>" + css_parts.join("\n") +
        "html,body{margin:0;overflow:hidden;background:" + ghost_background(design_name) + ";}" +
        ".stage{width:100%!important;max-width:none!important;margin:0!important;transform:none!important;}" +
        sketch_lock +
        "</style></head><body>" + stage.outerHTML + "</body></html>"
      );
      ghost_document.close();
      reveal_ghost_frame(frame, design_name);
      return frame;
    } catch (error) {
      console.error("넘기는 화면을 붙이지 못했습니다. 새 화면만 들입니다.", error);
      return null;
    }
  }

  /**
   * 손가락으로 밀어 오로라에 도착했을 때만 음악 질문에 알립니다.
   * 버튼으로 바꾼 경우에는 알리지 않습니다.
   */
  function notify_aurora_swipe(next_design) {
    try {
      if (next_design !== root.DESIGN_AURORA) {
        return;
      }
      document.dispatchEvent(new CustomEvent("today_word_aurora_swipe"));
    } catch (error) {
      console.error("오로라로 넘긴 소식을 전하지 못했습니다.", error);
    }
  }

  /**
   * 옛 화면과 새 화면을 나란히 두고 같은 속도로 밀어서 이어 줍니다.
   */
  function play_joined_slide(next_design, delta_x, duration_scale) {
    const stage = stage_element();
    const token = ++slide_token;
    is_slide_playing = true;
    const join_ms = duration_scale === 2 ? 1200 : 600;
    const from_x = read_stage_shift(stage);
    const direction = delta_x < 0 ? -1 : 1;
    const bleed = next_design === root.DESIGN_SKETCH ? sketch_bleed_rect() : null;
    const width = (bleed && bleed.width) || Math.round(stage.getBoundingClientRect().width) || 320;
    const travel = width + 24;
    const current_design = document.documentElement.dataset.design || "";
    const ghost = build_slide_ghost(stage, current_design, from_x);
    const stage_start = from_x - direction * travel;
    document.documentElement.classList.add("is_design_sliding");
    stage.classList.remove("is_design_sliding");
    stage.style.transform = "translate3d(" + stage_start + "px, 0, 0)";
    commit_design(next_design);
    window.requestAnimationFrame(function start_join() {
      if (token !== slide_token) {
        if (ghost) {
          ghost.remove();
        }
        return;
      }
      if (ghost) {
        ghost.classList.add("is_design_sliding");
        ghost.style.transitionDuration = join_ms + "ms";
        ghost.style.transform = "translate3d(" + (from_x - stage_start) + "px, 0, 0)";
      }
      stage.classList.add("is_design_sliding");
      stage.style.transitionDuration = join_ms + "ms";
      stage.style.transform = "translate3d(0, 0, 0)";
      window.setTimeout(function clear_join() {
        if (token !== slide_token) {
          return;
        }
        if (ghost) {
          ghost.remove();
        }
        is_slide_playing = false;
        release_stage();
        notify_aurora_swipe(next_design);
      }, join_ms + 40);
    });
  }

  /**
   * 손가락을 뗀 자리에서 옆 화면이 가운데로 들어올 때까지 이어 밀립니다.
   */
  function play_design_slide(next_design, delta_x, duration_scale) {
    has_left_opening_tarot = true;
    const stage = stage_element();
    const pace = duration_scale === 2 ? 2 : 1;
    if (!stage || prefers_still_motion()) {
      release_stage();
      commit_design(next_design);
      notify_aurora_swipe(next_design);
      return;
    }
    if (!slide_preview) {
      play_joined_slide(next_design, delta_x, pace);
      return;
    }
    const token = ++slide_token;
    is_slide_playing = true;
    const direction = delta_x < 0 ? -1 : 1;
    const travel = preview_travel || Math.round(stage.getBoundingClientRect().width) || 320;
    const from_x = read_stage_shift(stage);
    const end_shift = direction * travel;
    const distance = Math.abs(end_shift - from_x);
    const duration_ms = Math.max(180, Math.min(540, Math.round(distance / travel * 540))) * pace;
    if (distance < 2) {
      stage.classList.remove("is_design_sliding");
      settle_slide(next_design, token);
      return;
    }
    stage.style.transitionDuration = duration_ms + "ms";
    slide_preview.style.transitionDuration = duration_ms + "ms";
    stage.classList.add("is_design_sliding");
    slide_preview.classList.add("is_design_sliding");
    void stage.offsetWidth;
    stage.style.transform = "translate3d(" + end_shift + "px, 0, 0)";
    slide_preview.style.transform = "translate3d(" + (end_shift - direction * travel) + "px, 0, 0)";
    window.setTimeout(function finish_settle() {
      if (token !== slide_token) {
        return;
      }
      settle_slide(next_design, token);
    }, duration_ms + 40);
  }

  /**
   * 밀기가 끝난 뒤 새 화면을 확정합니다.
   * 스케치는 실제 사진이 같은 크기로 그려진 다음에 옆 화면을 치워, 비율이 달라지거나 빈 화면이 번쩍이지 않습니다.
   */
  function settle_slide(next_design, token) {
    const stage = stage_element();
    if (stage) {
      stage.style.transition = "none";
    }
    if (slide_preview) {
      slide_preview.style.transition = "none";
    }
    commit_design(next_design);
    if (stage) {
      stage.style.transform = "";
    }
    const hold_sketch = next_design === root.DESIGN_SKETCH && slide_preview;
    if (!hold_sketch) {
      is_slide_playing = false;
      release_stage();
      notify_aurora_swipe(next_design);
      return;
    }
    window.requestAnimationFrame(function paint_sketch() {
      window.requestAnimationFrame(function drop_sketch_preview() {
        if (token !== slide_token) {
          return;
        }
        is_slide_playing = false;
        release_stage();
        notify_aurora_swipe(next_design);
      });
    });
  }

  /**
   * 손가락이 닿은 자리를 기억합니다. 손가락이 둘 이상이면 넘기지 않습니다.
   */
  function on_swipe_start(event) {
    try {
      if (is_slide_playing || !event.touches || event.touches.length !== 1) {
        is_swipe_tracking = false;
        return;
      }
      if (is_swipe_blocked(event.target)) {
        is_swipe_tracking = false;
        return;
      }
      const touch = event.touches[0];
      swipe_start_x = touch.clientX;
      swipe_start_y = touch.clientY;
      swipe_start_at = Date.now();
      is_swipe_tracking = true;
      has_left_opening_tarot = true;
      if (document.documentElement.dataset.design === root.DESIGN_TAROT) {
        document.dispatchEvent(new CustomEvent("today_word_pause_tarot_weave"));
      }
    } catch (error) {
      is_swipe_tracking = false;
      console.error("화면 밀기를 시작하지 못했습니다.", error);
    }
  }

  /**
   * 가로로 밀면 본문이 손가락과 같이 움직이고, 밀려 난 자리에 다음 화면이 보입니다.
   * 세로가 더 크면 글을 읽는 스크롤이므로 그대로 둡니다.
   */
  function on_swipe_move(event) {
    try {
      if (!is_swipe_tracking || !event.touches || event.touches.length !== 1) {
        return;
      }
      const touch = event.touches[0];
      const delta_x = touch.clientX - swipe_start_x;
      const delta_y = touch.clientY - swipe_start_y;
      if (Math.abs(delta_x) <= 12 || Math.abs(delta_x) <= Math.abs(delta_y)) {
        return;
      }
      event.preventDefault();
      if (is_sketch_music_swipe(delta_x)) {
        return;
      }
      const direction = delta_x < 0 ? -1 : 1;
      if (design_beside(direction)) {
        ensure_preview(direction);
      }
      place_pair(follow_shift(delta_x), false);
    } catch (error) {
      console.error("화면 밀기를 따라가지 못했습니다.", error);
    }
  }

  /**
   * 손을 뗐을 때, 빠르게 밀었거나 화면을 충분히 밀었으면 옆 화면으로 이어 넘깁니다.
   */
  function on_swipe_end(event) {
    try {
      if (!is_swipe_tracking) {
        return;
      }
      is_swipe_tracking = false;
      const touch = event.changedTouches && event.changedTouches[0];
      if (!touch) {
        spring_stage_back();
        return;
      }
      const delta_x = touch.clientX - swipe_start_x;
      const delta_y = touch.clientY - swipe_start_y;
      const elapsed_ms = Date.now() - swipe_start_at;
      const stage = stage_element();
      const shift_x = stage ? read_stage_shift(stage) : 0;
      const travel = preview_travel || SLIDE_FOLLOW_MAX;
      const is_horizontal = Math.abs(delta_x) > Math.abs(delta_y);
      if (is_horizontal && is_sketch_music_swipe(delta_x) && Math.abs(delta_x) >= SWIPE_MIN_X) {
        release_stage();
        document.dispatchEvent(new CustomEvent("today_word_open_music_list"));
        return;
      }
      const is_flung = elapsed_ms <= SWIPE_MAX_MS && Math.abs(delta_x) >= SWIPE_MIN_X;
      const is_pushed = Math.abs(shift_x) >= Math.max(SWIPE_MIN_X, travel * 0.33);
      const next_design = design_for_swipe(delta_x);
      if (!is_horizontal || !next_design || (!is_flung && !is_pushed)) {
        spring_stage_back();
        return;
      }
      play_design_slide(next_design, delta_x);
    } catch (error) {
      is_swipe_tracking = false;
      is_slide_playing = false;
      release_stage();
      console.error("화면을 밀어서 바꾸지 못했습니다. 위쪽 버튼을 눌러 주세요.", error);
    }
  }

  /**
   * 터치가 끊기면 진행 중인 밀기를 버리고 본문을 되돌립니다.
   */
  function on_swipe_cancel() {
    if (!is_swipe_tracking) {
      return;
    }
    is_swipe_tracking = false;
    spring_stage_back();
  }

  /**
   * 카드 고르기가 시작되면 1초 뒤 자동 넘김은 하지 않습니다.
   */
  document.addEventListener("today_word_hold_opening", function on_hold_opening() {
    has_left_opening_tarot = true;
  });

  /**
   * 처음 타로를 1초 보여 준 뒤, 오른쪽 밀기와 같이 오로라로 넘깁니다.
   */
  function play_opening_slide() {
    try {
      if (has_left_opening_tarot || is_slide_playing) {
        return;
      }
      if (document.documentElement.dataset.design !== root.DESIGN_TAROT) {
        return;
      }
      if (is_overlay_open("music_offer") || is_overlay_open("camera_sheet")) {
        return;
      }
      document.dispatchEvent(new CustomEvent("today_word_pause_tarot_weave"));
      ensure_preview(1);
      play_design_slide(root.DESIGN_AURORA, SWIPE_MIN_X, 2);
    } catch (error) {
      console.error("첫 화면을 오로라로 넘기지 못했습니다. 화면을 오른쪽으로 밀어 주세요.", error);
    }
  }

  /**
   * 휴대폰 터치로 오로라와 타로를 넘깁니다. 마우스는 버튼을 그대로 씁니다.
   */
  function bind_design_swipe() {
    const listen_options = { passive: false };
    document.addEventListener("touchstart", on_swipe_start, listen_options);
    document.addEventListener("touchmove", on_swipe_move, listen_options);
    document.addEventListener("touchend", on_swipe_end);
    document.addEventListener("touchcancel", on_swipe_cancel);
  }

  /**
   * 위쪽 띠의 타로, 오로라 버튼에 클릭 동작을 연결합니다.
   */
  function bind_design_buttons() {
    try {
      const buttons = document.querySelectorAll("[data-design-button]");
      if (!buttons.length) {
        console.error("디자인 버튼을 찾지 못했습니다.");
        return;
      }
      buttons.forEach(function attach(button) {
        button.addEventListener("click", on_pick_design);
      });
      const close_button = document.getElementById("design_hint_close");
      if (!close_button) {
        console.error("화면 안내의 닫기 버튼을 찾지 못했습니다.");
      } else {
        close_button.addEventListener("click", on_close_design_hint);
      }
      const current_design = document.documentElement.dataset.design;
      mark_pressed_button(is_known_design(current_design) ? current_design : root.DESIGN_DEFAULT);
      show_design_hint();
      bind_design_swipe();
      window.setTimeout(play_opening_slide, 1000);
    } catch (error) {
      console.error("디자인 버튼을 연결하지 못했습니다.", error);
    }
  }

  /**
   * 디자인을 먼저 정하고, 버튼은 화면이 준비된 뒤에 연결합니다.
   */
  function start_design() {
    try {
      if (!root.DESIGN_STORAGE_KEY) {
        console.error("디자인 설정값을 불러오지 못했습니다.");
        return;
      }

      // 실행할 때마다 타로로 시작합니다. 링크를 연 사람도 같은 화면을 먼저 봅니다.
      apply_design(root.DESIGN_DEFAULT);

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind_design_buttons);
      } else {
        bind_design_buttons();
      }
    } catch (error) {
      console.error("디자인을 시작하지 못했습니다.", error);
    }
  }

  start_design();
})();

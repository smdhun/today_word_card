/**
 * 입력 화면과 결과 카드를 연결합니다.
 * 버튼을 누르면 검사, 문장 선택, 화면 표시, 저장이 차례로 일어납니다.
 */
(function init_app() {
  const root = window.TodayWordCard || {};

  const els = {};
  let current_card = null;
  let startup_tarot_vignette = null;
  let is_startup_tarot_active = true;
  // 그림을 요청할 때마다 1씩 올립니다. 늦게 도착한 예전 그림을 걸러내는 번호표입니다.
  let vignette_request_no = 0;
  // 아직 화면에 안 걸린 그림 주소입니다. 넘기는 동안 이전 그림에서 다시 세지 않게 합니다.
  let pending_vignette_src = "";
  // 오로라 등장을 다시 누르면 이전 움직임을 멈추는 번호입니다.
  let aurora_motion_no = 0;
  let aurora_hold_timer = 0;
  // 타로 사진이 가득 찬 모습을 0.5초 유지한 뒤 전체를 보여주는 타이머입니다.
  let tarot_reveal_timer = 0;
  // 사진을 빨리 넘기면 이전 확대 계산을 무시하는 번호입니다.
  let tarot_reveal_no = 0;

  /**
   * id로 요소를 찾고, 없으면 기록만 남깁니다.
   */
  function require_element(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.error("화면 요소를 찾지 못했습니다.", id);
    }
    return element;
  }

  /**
   * 필요한 화면 요소를 한 번에 모읍니다.
   */
  function cache_elements() {
    els.form = require_element("fortune_form");
    els.form_message = require_element("form_message");
    els.status_message = require_element("status_message");
    els.draw_button = require_element("draw_button");
    els.result_card = require_element("result_card");
    els.card_empty = require_element("card_empty");
    els.card_head = require_element("card_head");
    els.card_body = require_element("card_body");
    els.card_caption = require_element("card_caption");
    els.card_mood = require_element("card_mood");
    els.card_lead = require_element("card_lead");
    els.card_caution = require_element("card_caution");
    els.wise_quote_first = require_element("wise_quote_first");
    els.wise_category_first = require_element("wise_category_first");
    els.wise_text_first = require_element("wise_text_first");
    els.wise_person_first = require_element("wise_person_first");
    els.wise_quote_second = require_element("wise_quote_second");
    els.wise_category_second = require_element("wise_category_second");
    els.wise_text_second = require_element("wise_text_second");
    els.wise_person_second = require_element("wise_person_second");
    els.card_vignette = require_element("card_vignette");
    els.vignette_image = require_element("vignette_image");
    els.vignette_caption = require_element("vignette_caption");
    els.vignette_prev = require_element("vignette_prev");
    els.vignette_next = require_element("vignette_next");

    return Boolean(
      els.form &&
      els.form_message &&
      els.status_message &&
      els.draw_button &&
      els.result_card &&
      els.card_empty &&
      els.card_head &&
      els.card_body &&
      els.card_caption &&
      els.card_mood &&
      els.card_lead &&
      els.card_caution &&
      els.vignette_prev &&
      els.vignette_next
    );
  }

  /**
   * 오류 문장을 보여주고, 해당 입력으로 커서를 옮깁니다.
   */
  function show_error(message, focus_id) {
    try {
      els.form_message.textContent = message || root.MESSAGES.draw_failed;
      els.status_message.textContent = "";
      if (!focus_id) {
        return;
      }
      const target = document.getElementById(focus_id);
      if (target && typeof target.focus === "function") {
        target.focus();
      }
    } catch (error) {
      console.error("오류 안내를 보여주지 못했습니다.", error);
    }
  }

  /**
   * 복사나 저장처럼 카드 아래에 보여주는 짧은 안내입니다.
   * is_error가 true이면 실패 안내 색으로 보여줍니다.
   */
  function show_status(message, is_error) {
    try {
      els.form_message.textContent = "";
      els.status_message.textContent = message || "";
      els.status_message.classList.toggle("is_error", Boolean(is_error));
    } catch (error) {
      console.error("안내 문장을 보여주지 못했습니다.", error);
    }
  }

  /**
   * 안내 문장을 비웁니다.
   */
  function clear_messages() {
    try {
      els.form_message.textContent = "";
      els.status_message.textContent = "";
    } catch (error) {
      console.error("안내 문장을 지우지 못했습니다.", error);
    }
  }

  /**
   * 폼에서 고른 기분을 읽습니다.
   * 타로는 기분 칸이 없으므로 기본 기분으로 문장을 고릅니다.
   */
  function collect_input() {
    try {
      if (document.documentElement.dataset.design === root.DESIGN_TAROT) {
        return { mood: root.MOOD_DEFAULT || "joy" };
      }
      const mood_input = document.querySelector('input[name="mood"]:checked');
      return { mood: mood_input ? mood_input.value : "" };
    } catch (error) {
      console.error("입력을 읽지 못했습니다. 기쁨으로 다시 뽑아 주세요.", error);
      return { mood: "" };
    }
  }

  /**
   * 라디오 버튼 하나를 선택 상태로 되돌립니다.
   */
  function check_radio(name, value) {
    try {
      const inputs = document.querySelectorAll('input[name="' + name + '"]');
      inputs.forEach(function mark_input(input) {
        input.checked = input.value === value;
      });
    } catch (error) {
      console.error("이전 선택을 되돌리지 못했습니다.", error);
    }
  }

  /**
   * 카드가 떠오르는 움직임을 처음부터 다시 재생합니다.
   * 클래스를 뗐다가 다시 붙여야 같은 움직임이 매번 새로 시작됩니다.
   */
  function play_reveal() {
    try {
      els.result_card.classList.remove("is_revealing");
      void els.result_card.offsetWidth;
      els.result_card.classList.add("is_revealing");
    } catch (error) {
      console.error("카드 움직임을 재생하지 못했습니다.", error);
    }
  }

  /**
   * 격언 칸 하나를 채웁니다. 문장이나 인물이 없으면 칸을 숨깁니다.
   */
  function render_wise_quote(block, category_el, text_el, person_el, quote) {
    try {
      if (!block || !category_el || !text_el || !person_el) {
        return;
      }
      const is_ready = Boolean(quote && quote.category && quote.text && quote.person);
      category_el.textContent = is_ready ? quote.category : "";
      text_el.textContent = is_ready ? quote.text : "";
      person_el.textContent = is_ready ? quote.person : "";
      block.hidden = !is_ready;
    } catch (error) {
      console.error("격언을 보여주지 못했습니다.", error);
      if (block) {
        block.hidden = true;
      }
    }
  }

  /**
   * 격언 두 칸을 채웁니다. 카테고리가 같으면 둘 다 비워 잘못 보여 주지 않습니다.
   */
  function render_wise_quotes(wise_quotes) {
    try {
      const quotes = Array.isArray(wise_quotes) ? wise_quotes : [];
      const first = quotes[0] || null;
      const second = quotes[1] || null;
      const is_same_category = Boolean(first && second && first.category === second.category);
      if (is_same_category) {
        console.error("두 격언의 카테고리가 같아 칸을 비웁니다. 문장을 다시 뽑아 주세요.");
      }
      const visible_first = is_same_category ? null : first;
      const visible_second = is_same_category ? null : second;
      render_wise_quote(
        els.wise_quote_first,
        els.wise_category_first,
        els.wise_text_first,
        els.wise_person_first,
        visible_first
      );
      render_wise_quote(
        els.wise_quote_second,
        els.wise_category_second,
        els.wise_text_second,
        els.wise_person_second,
        visible_second
      );
    } catch (error) {
      console.error("격언 두 칸을 보여주지 못했습니다.", error);
    }
  }

  /**
   * 다 불러온 새 그림과 캡션을 화면에 겁니다.
   * 지금 그림을 바닥에 깔아 두고 새 그림을 그 위에서 서서히 나타나게 해서, 두 그림이 겹쳐 바뀌어 보입니다.
   */
  function show_vignette(vignette) {
    try {
      const is_previous_loaded = els.vignette_image.naturalWidth > 0;
      const is_tarot = document.documentElement.dataset.design === root.DESIGN_TAROT;
      // 타로는 여백에 이전 사진이 비치면 안 되므로, 카드 색만 남깁니다.
      if (!is_tarot && is_previous_loaded && els.vignette_image.currentSrc) {
        els.card_vignette.style.backgroundImage = 'url("' + els.vignette_image.currentSrc + '")';
      } else if (is_tarot) {
        els.card_vignette.style.backgroundImage = "";
      }
      els.vignette_image.src = vignette.src;
      els.vignette_caption.textContent = vignette.caption;
      // 타로는 달빛 설명, 오로라는 캐릭터 표정을 그림 이름으로 둡니다.
      const is_aurora = document.documentElement.dataset.design === root.DESIGN_AURORA;
      els.vignette_image.alt = is_aurora
        ? "오로라 캐릭터, " + vignette.caption
        : vignette.caption;

      // 그림과 그림 이름이 같은 박자로 다시 움직이게 합니다.
      els.card_vignette.classList.remove("is_changing");
      els.card_caption.classList.remove("is_changing");
      void els.card_vignette.offsetWidth;
      els.card_vignette.classList.add("is_changing");
      els.card_caption.classList.add("is_changing");
      start_tarot_reveal();
    } catch (error) {
      console.error("그림을 바꾸지 못했습니다.", error);
    }
  }

  /**
   * 액자를 가득 채우는 확대 배율입니다. 1이면 이미 원본 전체가 들어옵니다.
   * 가로로 넓은 액자면 위아래가 잘리고, 세로로 긴 액자면 좌우가 잘립니다.
   */
  function tarot_cover_scale(frame_width, frame_height) {
    try {
      const natural_width = els.vignette_image.naturalWidth;
      const natural_height = els.vignette_image.naturalHeight;
      if (!natural_width || !natural_height || frame_width <= 0 || frame_height <= 0) {
        return 1;
      }
      const image_ratio = natural_width / natural_height;
      const frame_ratio = frame_width / frame_height;
      const scale = image_ratio > frame_ratio
        ? image_ratio / frame_ratio
        : frame_ratio / image_ratio;
      return Math.max(1, scale);
    } catch (error) {
      console.error("사진 확대 배율을 계산하지 못했습니다. 원본 전체를 보여 줍니다.", error);
      return 1;
    }
  }

  /**
   * 타로 사진을 지금 액자처럼 보여 준 뒤, 0.5초 후에 원본 전체로 줄입니다.
   * 오로라 캐릭터는 이 움직임을 쓰지 않습니다.
   */
  function start_tarot_reveal() {
    try {
      window.clearTimeout(tarot_reveal_timer);
      tarot_reveal_timer = 0;
      tarot_reveal_no += 1;
      const reveal_no = tarot_reveal_no;
      if (!els.card_vignette) {
        return;
      }
      const is_tarot = document.documentElement.dataset.design === root.DESIGN_TAROT;
      if (!is_tarot) {
        els.card_vignette.classList.remove("is_tarot_full", "is_tarot_snap");
        els.card_vignette.style.removeProperty("--tarot_cover_scale");
        return;
      }
      if (prefers_reduced_motion()) {
        els.card_vignette.style.setProperty("--tarot_cover_scale", "1");
        els.card_vignette.classList.add("is_tarot_full");
        return;
      }

      const apply_cover = function apply_cover() {
        if (reveal_no !== tarot_reveal_no || !els.card_vignette) {
          return;
        }
        if (document.documentElement.dataset.design !== root.DESIGN_TAROT) {
          return;
        }
        if (!els.vignette_image.naturalWidth) {
          els.vignette_image.addEventListener("load", apply_cover, { once: true });
          return;
        }
        const scale = tarot_cover_scale(els.card_vignette.clientWidth, els.card_vignette.clientHeight);
        els.card_vignette.classList.add("is_tarot_snap");
        els.card_vignette.classList.remove("is_tarot_full");
        els.card_vignette.style.setProperty("--tarot_cover_scale", String(Math.round(scale * 1000) / 1000));
        void els.card_vignette.offsetWidth;
        els.card_vignette.classList.remove("is_tarot_snap");
        tarot_reveal_timer = window.setTimeout(function show_full_tarot_photo() {
          if (reveal_no !== tarot_reveal_no || !els.card_vignette) {
            return;
          }
          if (document.documentElement.dataset.design !== root.DESIGN_TAROT) {
            return;
          }
          els.card_vignette.classList.add("is_tarot_full");
        }, 500);
      };
      window.requestAnimationFrame(apply_cover);
    } catch (error) {
      console.error("사진 전체 보기를 시작하지 못했습니다. 새로고침 후 다시 뽑아 주세요.", error);
    }
  }

  /**
   * 카드의 그림을 바꿉니다. 그림이 없는 카드이거나 불러오지 못하면 지금 그림을 그대로 둡니다.
   * 새 그림을 먼저 다 받은 뒤에 바꿔 걸어서, 반쯤 그려진 그림이 보이지 않게 합니다.
   */
  function render_vignette(vignette) {
    try {
      if (!vignette || !els.card_vignette || !els.vignette_image || !els.vignette_caption) {
        return;
      }

      vignette_request_no += 1;
      const request_no = vignette_request_no;
      pending_vignette_src = vignette.src;

      if (els.vignette_image.getAttribute("src") === vignette.src) {
        pending_vignette_src = "";
        els.vignette_caption.textContent = vignette.caption;
        const is_aurora_same = document.documentElement.dataset.design === root.DESIGN_AURORA;
        els.vignette_image.alt = is_aurora_same
          ? "오로라 캐릭터, " + vignette.caption
          : vignette.caption;
        return;
      }

      const loader = new Image();
      loader.onload = function on_vignette_loaded() {
        // 기다리는 사이에 버튼을 또 눌렀다면, 이 그림은 이미 지나간 카드의 것이므로 버립니다.
        if (request_no === vignette_request_no) {
          pending_vignette_src = "";
          show_vignette(vignette);
        }
      };
      loader.onerror = function on_vignette_failed() {
        console.error("그림을 불러오지 못했습니다.", vignette.src);
      };
      loader.src = vignette.src;
    } catch (error) {
      console.error("그림을 보여주지 못했습니다.", error);
    }
  }

  /**
   * 주소 끝이 같은 그림인지 확인합니다. 화면에는 전체 주소가 붙을 수 있습니다.
   */
  function is_same_vignette_src(shown, item_src) {
    if (!shown || !item_src) {
      return false;
    }
    return shown === item_src || shown.endsWith("/" + item_src) || shown.endsWith(item_src);
  }

  /**
   * 화살표가 넘길 그림 묶음의 기분입니다.
   * 타로는 기분과 상관없이 같은 달빛 사진이고, 오로라는 고른 기분의 캐릭터입니다.
   */
  function current_browse_mood() {
    try {
      if (document.documentElement.dataset.design === root.DESIGN_TAROT) {
        return root.MOOD_DEFAULT || "joy";
      }
      const checked = document.querySelector('input[name="mood"]:checked');
      if (checked && checked.value) {
        return checked.value;
      }
      if (current_card && current_card.mood && current_card.mood.id) {
        return current_card.mood.id;
      }
      return root.MOOD_DEFAULT || "joy";
    } catch (error) {
      console.error("그림 넘김의 기분을 읽지 못했습니다. 기쁨 그림을 사용합니다.", error);
      return root.MOOD_DEFAULT || "joy";
    }
  }

  /**
   * 왼쪽·오른쪽 화살표로 그림만 바꿉니다. 문장과 순번은 그대로 둡니다.
   * step이 1이면 다음 그림, -1이면 이전 그림입니다. 끝에서는 처음으로 돌아갑니다.
   */
  function on_browse_vignette(step) {
    try {
      if (typeof root.list_vignettes !== "function") {
        show_status("그림 목록을 열지 못했습니다. 페이지를 새로고침한 뒤 다시 눌러 주세요.", true);
        return;
      }

      const list = root.list_vignettes(current_browse_mood());
      if (!list.length) {
        show_status("지금은 넘길 그림이 없습니다. 페이지를 새로고침한 뒤 다시 눌러 주세요.", true);
        return;
      }

      const shown = pending_vignette_src || (els.vignette_image ? els.vignette_image.getAttribute("src") : "");
      const shown_index = list.findIndex(function find_shown(item) {
        return is_same_vignette_src(shown, item.src);
      });
      // 지금 그림이 이 목록에 없으면, 다음을 누르면 첫 장부터, 이전을 누르면 마지막 장부터 봅니다.
      const base_index = shown_index >= 0 ? shown_index : (step > 0 ? -1 : 0);
      const next_index = (base_index + step + list.length) % list.length;
      const next_vignette = list[next_index];

      render_vignette(next_vignette);
      if (current_card) {
        current_card.vignette = next_vignette;
      }

      const ahead = list[(next_index + 1) % list.length];
      const behind = list[(next_index - 1 + list.length) % list.length];
      if (ahead) {
        new Image().src = ahead.src;
      }
      if (behind) {
        new Image().src = behind.src;
      }
    } catch (error) {
      console.error("그림을 넘기지 못했습니다.", error);
      show_status("그림을 넘기지 못했습니다. 잠시 후 다시 눌러 주세요.", true);
    }
  }

  /**
   * 다음 순번의 그림을 미리 받아 둡니다.
   * 덕분에 문장 뽑기를 눌렀을 때 그림이 문장과 거의 동시에 바뀝니다.
   */
  function preload_next_vignette(validated, card) {
    try {
      const next_card = root.pick_today_phrase(validated, card.offset + 1);
      if (next_card && next_card.vignette) {
        new Image().src = next_card.vignette.src;
      }
    } catch (error) {
      console.error("다음 그림을 미리 받지 못했습니다.", error);
    }
  }

  /**
   * 얼굴로 고른 칸을 끄고, 밤의 한 줄과 사색의 결을 다시 보여 줍니다.
   */
  function reset_face_reading() {
    const lead = document.querySelector(".verse_lead");
    const caution = document.querySelector(".verse_caution");
    const face = document.getElementById("face_reading");
    if (lead) {
      lead.hidden = false;
    }
    if (caution) {
      caution.hidden = false;
    }
    if (face) {
      face.hidden = true;
    }
  }

  /**
   * 형태가 고른 두 칸만 남기고 나머지는 숨깁니다.
   */
  function show_face_slots(reading) {
    const lead = document.querySelector(".verse_lead");
    const caution = document.querySelector(".verse_caution");
    const face = document.getElementById("face_reading");
    if (lead) {
      lead.hidden = !reading.is_lead_visible;
    }
    if (caution) {
      caution.hidden = !reading.is_caution_visible;
    }
    if (face) {
      face.hidden = false;
    }
    render_wise_quotes(reading.quotes);
  }

  /**
   * 읽은 기분의 그림과, 형태가 고른 두 칸을 카드에 올립니다.
   */
  function show_face_reading(reading) {
    try {
      const quotes = reading && Array.isArray(reading.quotes) ? reading.quotes : [];
      const has_slot = Boolean(
        reading &&
        (reading.is_lead_visible || reading.is_caution_visible || quotes.length > 0)
      );
      if (!reading || !reading.mood_id || !reading.label || !reading.link_text || !has_slot) {
        console.error("얼굴 추천 글이 비어 있습니다. 다시 찍어 주세요.");
        return false;
      }
      if (reading.is_lead_visible && !reading.lead_text) {
        console.error("밤의 한 줄이 비어 있습니다. 다시 찍어 주세요.");
        return false;
      }
      if (reading.is_caution_visible && !reading.caution_text) {
        console.error("사색의 결이 비어 있습니다. 다시 찍어 주세요.");
        return false;
      }
      check_radio("mood", reading.mood_id);
      const label = document.getElementById("face_reading_label");
      const link = document.getElementById("face_reading_text");
      const face = document.getElementById("face_reading");
      if (!label || !link || !face) {
        console.error("얼굴 추천 글 칸을 찾지 못했습니다.");
        return false;
      }
      label.textContent = reading.label;
      link.textContent = reading.link_text;
      if (els.card_lead) {
        els.card_lead.textContent = reading.lead_text || "";
      }
      if (els.card_caution) {
        els.card_caution.textContent = reading.caution_text || "";
      }
      if (typeof root.list_vignettes === "function") {
        const list = root.list_vignettes(reading.mood_id);
        if (list && list.length > 0) {
          const index = Math.floor(Math.random() * list.length);
          render_vignette(list[index]);
        }
      }
      const mood = root.MOODS.find(function match_mood(item) {
        return item.id === reading.mood_id;
      });
      if (els.card_mood && mood) {
        els.card_mood.textContent = mood.label;
      }
      if (els.result_card) {
        els.result_card.dataset.mood = reading.mood_id;
      }
      els.card_empty.hidden = true;
      els.card_head.hidden = false;
      els.card_body.hidden = false;
      show_face_slots(reading);
      clear_messages();
      play_reveal();
      if (uses_card_arrival()) {
        face.focus({ preventScroll: true });
        play_aurora_arrival();
      }
      return true;
    } catch (error) {
      console.error("얼굴 추천 글을 보여주지 못했습니다. 감정을 직접 고른 뒤 뽑아 주세요.", error);
      show_error(root.MESSAGES.draw_failed);
      return false;
    }
  }

  /**
   * 고른 카드를 화면에 그립니다.
   */
  function render_card(card) {
    try {
      reset_face_reading();
      els.card_mood.textContent = card.mood.label;
      els.card_lead.textContent = card.lead_text;
      els.card_caution.textContent = card.caution_text;
      render_wise_quotes(card.wise_quotes);
      render_vignette(card.vignette);
      els.result_card.dataset.mood = card.mood.id;
      els.card_empty.hidden = true;
      els.card_head.hidden = false;
      els.card_body.hidden = false;
      play_reveal();
    } catch (error) {
      console.error("카드를 그리지 못했습니다.", error);
      show_error(root.MESSAGES.draw_failed);
    }
  }

  /**
   * 고른 기분과 현재 카드의 순번을 브라우저에 저장합니다.
   */
  function persist_card(validated, card) {
    const is_saved = root.save_card_state({
      version: root.STORAGE_VERSION,
      mood: validated.mood,
      offset: card.offset,
      date_key: card.date_key,
    });
    if (!is_saved) {
      show_status(root.MESSAGES.save_failed);
    }
    return is_saved;
  }

  /**
   * 이번 실행에서 타로에 처음 보여줄 달빛 사진 한 장을 뽑습니다.
   * 같은 실행 안에서는 같은 사진을 유지하고, 문장을 뽑으면 그날 순서로 돌아갑니다.
   */
  function random_startup_tarot_vignette() {
    try {
      if (startup_tarot_vignette) {
        return startup_tarot_vignette;
      }
      if (typeof root.list_vignettes !== "function") {
        console.error("타로 첫 그림 목록을 열지 못했습니다. 오늘의 그림을 그대로 둡니다.");
        return null;
      }
      const list = root.list_vignettes(root.MOOD_DEFAULT || "joy");
      if (!list || list.length === 0) {
        console.error("타로 첫 그림이 없습니다. 오늘의 그림을 그대로 둡니다.");
        return null;
      }
      const index = Math.floor(Math.random() * list.length);
      startup_tarot_vignette = list[index];
      return startup_tarot_vignette;
    } catch (error) {
      console.error("타로 첫 그림을 고르지 못했습니다. 오늘의 그림을 그대로 둡니다.", error);
      return null;
    }
  }

  /**
   * 타로를 처음 열었을 때만 그림 칸을 무작위 사진으로 바꿉니다.
   */
  function apply_startup_tarot_image(card) {
    if (!is_startup_tarot_active || !card) {
      return card;
    }
    if (document.documentElement.dataset.design !== root.DESIGN_TAROT) {
      return card;
    }
    const vignette = random_startup_tarot_vignette();
    if (!vignette) {
      return card;
    }
    card.vignette = vignette;
    return card;
  }

  /**
   * 만든 카드를 현재 카드로 삼아 화면에 그리고, 저장하고, 다음 그림을 미리 받아 둡니다.
   */
  function apply_card(validated, card) {
    apply_startup_tarot_image(card);
    current_card = card;
    render_card(card);
    persist_card(validated, card);
    preload_next_vignette(validated, card);
  }

  /**
   * 검사에 통과한 입력으로 카드를 만들고 보여줍니다.
   */
  function draw_card(validated, offset, is_quiet) {
    const card = root.pick_today_phrase(validated, offset);
    if (!card) {
      show_error(root.MESSAGES.draw_failed, "draw_button");
      return null;
    }

    if (!is_quiet) {
      clear_messages();
    }
    apply_card(validated, card);
    return card;
  }

  /**
   * 고른 기분의 다음 문장과 그림을 보여줍니다.
   * 카드가 없으면 이번 실행의 첫 장을, 있으면 섞어 둔 다음 장을 엽니다.
   * 그림 아래의 문장 뽑기 버튼이 이 길을 씁니다.
   */
  function show_next_card(focus_id) {
    clear_messages();
    const validated = root.validate_input(collect_input());
    if (!validated.is_valid) {
      show_error(validated.message, validated.focus_id);
      return null;
    }

    const next_offset = current_card ? current_card.offset + 1 : 0;
    if (document.documentElement.dataset.design === root.DESIGN_TAROT) {
      is_startup_tarot_active = false;
    }
    const card = root.pick_today_phrase(validated, next_offset);
    if (!card) {
      console.error("다음 문장을 고르지 못했습니다.", next_offset);
      show_error(root.MESSAGES.draw_failed, focus_id);
      return null;
    }

    apply_card(validated, card);
    return card;
  }

  /**
   * 문장을 뽑을 때 그림이 가운데 나타났다가 올라가는 화면인지 확인합니다.
   * 오로라와 타로가 같은 움직임입니다. 인간관계는 카드가 없습니다.
   */
  function uses_card_arrival() {
    try {
      const design = document.documentElement.dataset.design;
      return design === root.DESIGN_AURORA || design === root.DESIGN_TAROT;
    } catch (error) {
      console.error("화면 종류를 확인하지 못했습니다. 그림 이동 없이 문장만 바꿉니다.", error);
      return false;
    }
  }

  /**
   * 움직임 줄이기를 켠 브라우저인지 확인합니다.
   */
  function prefers_reduced_motion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (error) {
      console.error("움직임 설정을 확인하지 못했습니다.", error);
      return false;
    }
  }

  /**
   * 날아다니던 그림을 카드 안의 제자리로 되돌립니다.
   */
  function release_flying_image() {
    try {
      const image = els.card_vignette;
      if (!image) {
        return;
      }
      const hold = document.getElementById("card_vignette_hold");
      if (hold && hold.parentNode) {
        hold.parentNode.insertBefore(image, hold.nextSibling);
        hold.remove();
      }
      image.classList.remove("is_aurora_flight");
      image.style.position = "";
      image.style.zIndex = "";
      image.style.margin = "";
      image.style.left = "";
      image.style.top = "";
      image.style.width = "";
      image.style.height = "";
      if (els.result_card) {
        els.result_card.classList.remove("is_aurora_hold", "is_aurora_arriving");
      }
    } catch (error) {
      console.error("그림을 제자리로 되돌리지 못했습니다.", error);
    }
  }

  /**
   * 요소의 한가운데가 화면 한가운데에 오도록 스크롤 위치를 계산합니다.
   */
  function scroll_top_for_center(element) {
    const rect = element.getBoundingClientRect();
    const next_top = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
    return Math.max(0, next_top);
  }

  /**
   * 문장 뽑기 버튼이 내려가도 되는 화면 위쪽 한계입니다.
   * 디자인 버튼 막대는 스크롤해도 위에 붙어 있으므로, 그 막대 아래로 12px을 비웁니다.
   */
  function arrival_top_gap() {
    try {
      const bar = document.querySelector(".top_bar");
      const bar_bottom = bar ? bar.getBoundingClientRect().bottom : 0;
      return Math.max(16, Math.ceil(bar_bottom) + 12);
    } catch (error) {
      console.error("위쪽 막대 높이를 읽지 못했습니다. 버튼은 화면 위 16px에 둡니다.", error);
      return 16;
    }
  }

  /**
   * 문장 뽑기 버튼부터 격언 2까지를 한 묶음으로 보고, 그 한가운데가 화면 한가운데에 오게 합니다.
   * 문장 줄수가 많아 묶음이 길면 버튼을 위쪽 막대 아래에 남기고, 아래 문장만 더 내려갑니다.
   * 격언이 없으면 문장 칸 전체를 기준으로 삼습니다.
   */
  function scroll_top_for_arrival() {
    try {
      const start = els.draw_button;
      const has_second_quote = els.wise_quote_second && !els.wise_quote_second.hidden;
      const end = has_second_quote ? els.wise_quote_second : els.card_body;
      if (!start || !end) {
        return scroll_top_for_center(els.card_body);
      }
      const start_rect = start.getBoundingClientRect();
      const end_rect = end.getBoundingClientRect();
      const top = start_rect.top + window.scrollY;
      const bottom = end_rect.bottom + window.scrollY;
      const centered = top + (bottom - top) / 2 - window.innerHeight / 2;
      const button_limit = Math.max(0, top - arrival_top_gap());
      return Math.max(0, Math.min(centered, button_limit));
    } catch (error) {
      console.error("문장 묶음의 위치를 계산하지 못했습니다. 문장 칸만 가운데로 맞춥니다.", error);
      return scroll_top_for_center(els.card_body);
    }
  }

  /**
   * 문장 묶음이 화면 한가운데까지 내려갈 빈칸을 아래에 더합니다.
   */
  function ensure_scroll_room(scroll_top) {
    const page = document.documentElement;
    page.style.paddingBottom = "0px";
    const max_scroll = page.scrollHeight - window.innerHeight;
    const deficit = scroll_top - max_scroll;
    if (deficit > 1) {
      page.style.paddingBottom = Math.ceil(deficit + 16) + "px";
    } else {
      page.style.paddingBottom = "";
    }
  }

  /**
   * 고정된 그림의 위치와 크기를 한 번에 넣습니다.
   */
  function place_flying_image(rect) {
    const image = els.card_vignette;
    image.style.position = "fixed";
    image.style.zIndex = "20";
    image.style.margin = "0";
    image.style.left = rect.left + "px";
    image.style.top = rect.top + "px";
    image.style.width = rect.width + "px";
    image.style.height = rect.height + "px";
  }

  /**
   * 0에서 1로 갈 때 처음과 끝이 천천히 움직이게 합니다.
   */
  function ease_in_out(progress) {
    if (progress < 0.5) {
      return 2 * progress * progress;
    }
    return 1 - Math.pow(-2 * progress + 2, 2) / 2;
  }

  /**
   * 오로라와 타로에서 문장을 뽑으면 그림이 화면 가운데 나타났다가 위로 올라갑니다.
   * 그림이 움직이는 동안 버튼과 문장은 비워 두고, 그림이 도착한 뒤에 나타납니다.
   * 버튼은 위쪽 디자인 막대를 넘지 않습니다.
   */
  function play_aurora_arrival() {
    try {
      aurora_motion_no += 1;
      const motion_no = aurora_motion_no;
      window.clearTimeout(aurora_hold_timer);
      release_flying_image();

      const image = els.card_vignette;
      const text = els.card_body;
      if (!image || !text || text.hidden) {
        return;
      }

      if (prefers_reduced_motion()) {
        const reduced_scroll = scroll_top_for_arrival();
        ensure_scroll_room(reduced_scroll);
        window.scrollTo(0, reduced_scroll);
        return;
      }

      const rest = image.getBoundingClientRect();
      const hold = document.createElement("div");
      hold.id = "card_vignette_hold";
      hold.className = "card_vignette_hold";
      hold.setAttribute("aria-hidden", "true");
      hold.style.height = rest.height + "px";
      image.parentNode.insertBefore(hold, image);
      // 카드에 backdrop-filter가 있으면 fixed가 화면이 아니라 카드 기준으로 붙습니다.
      document.body.appendChild(image);

      // 가로는 카드 칸에 두고, 세로는 화면 한가운데에 띄웁니다. 그래서 이후 이동은 위로만 갑니다.
      const center_width = Math.min(rest.width, window.innerWidth - 32);
      const center_height = Math.min(window.innerHeight * 0.42, Math.max(rest.height, 220));
      const center_left = Math.max(16, rest.left + (rest.width - center_width) / 2);
      const center_rect = {
        left: center_left,
        top: Math.max(16, (window.innerHeight - center_height) / 2),
        width: center_width,
        height: center_height,
      };
      place_flying_image(center_rect);
      image.classList.add("is_aurora_flight");
      els.result_card.classList.add("is_aurora_hold");

      // 가운데에서 잠깐 보여 준 뒤 위로 올립니다.
      aurora_hold_timer = window.setTimeout(function rise_image() {
        try {
          if (motion_no !== aurora_motion_no) {
            return;
          }
          const text_scroll = scroll_top_for_arrival();
          ensure_scroll_room(text_scroll);
          const target_scroll = scroll_top_for_arrival();
          const place = hold.getBoundingClientRect();
          const place_top = place.top + window.scrollY - target_scroll;
          const end_rect = {
            left: place.left,
            top: place_top,
            width: place.width,
            height: place.height,
          };
          const start_scroll = window.scrollY;
          const start_time = performance.now();
          const fly_ms = 850;

          function step_flight(now) {
            if (motion_no !== aurora_motion_no) {
              return;
            }
            const progress = Math.min(1, (now - start_time) / fly_ms);
            const eased = ease_in_out(progress);
            window.scrollTo(0, start_scroll + (target_scroll - start_scroll) * eased);
            place_flying_image({
              left: center_rect.left + (end_rect.left - center_rect.left) * eased,
              top: center_rect.top + (end_rect.top - center_rect.top) * eased,
              width: center_rect.width + (end_rect.width - center_rect.width) * eased,
              height: center_rect.height + (end_rect.height - center_rect.height) * eased,
            });
            if (progress < 1) {
              window.requestAnimationFrame(step_flight);
              return;
            }
            release_flying_image();
            // 나타나는 움직임은 버튼을 아래로 밀어 위치를 속입니다. 스크롤을 먼저 맞춘 뒤 보여 줍니다.
            const settled_scroll = scroll_top_for_arrival();
            ensure_scroll_room(settled_scroll);
            window.scrollTo(0, settled_scroll);
            if (els.result_card) {
              els.result_card.classList.add("is_aurora_arriving");
            }
          }
          window.requestAnimationFrame(step_flight);
        } catch (error) {
          console.error("그림을 위로 올리지 못했습니다. 문장은 카드에 그대로 있습니다.", error);
          release_flying_image();
        }
      }, 700);
    } catch (error) {
      console.error("그림 등장을 시작하지 못했습니다. 문장을 다시 뽑아 주세요.", error);
      release_flying_image();
    }
  }

  /**
   * 그림 아래의 문장 뽑기. 다음 문장과 다음 그림을 보여줍니다.
   */
  function on_submit(event) {
    try {
      event.preventDefault();
      const card = show_next_card("draw_button");
      if (!card) {
        return;
      }
      // 오로라와 타로는 그림이 가운데 나타났다가 문장 쪽으로 올라갑니다. 포커스가 스크롤을 가로채지 않게 합니다.
      if (uses_card_arrival()) {
        els.card_lead.focus({ preventScroll: true });
        play_aurora_arrival();
        return;
      }
      els.card_lead.focus();
    } catch (error) {
      console.error("문장 뽑기를 끝내지 못했습니다.", error);
      show_error(root.MESSAGES.draw_failed, "draw_button");
    }
  }

  /**
   * 저장된 카드가 없으면 오로라의 기쁨 카드를 첫 화면으로 보여 줍니다.
   */
  function show_default_card() {
    try {
      const mood_id = root.MOOD_DEFAULT || "joy";
      check_radio("mood", mood_id);
      const validated = root.validate_input({ mood: mood_id });
      if (!validated.is_valid) {
        console.error("첫 화면의 기분을 확인하지 못했습니다.", mood_id);
        return;
      }
      draw_card(validated, 0, true);
    } catch (error) {
      console.error("첫 화면 카드를 열지 못했습니다. 기쁨을 고른 뒤 다시 뽑아 주세요.", error);
    }
  }

  /**
   * 프로그램을 열면 항상 오로라의 기쁨 카드를 먼저 보여 줍니다.
   * 예전에 다른 기분이나 다른 화면을 골랐어도, 이번 실행의 첫 그림은 기쁨입니다.
   */
  function restore_saved_card() {
    try {
      show_default_card();
    } catch (error) {
      console.error("첫 화면 카드를 열지 못했습니다. 기쁨을 고른 뒤 다시 뽑아 주세요.", error);
    }
  }

  /**
   * 화면 값과 문장 데이터가 어긋나면 콘솔에만 남깁니다.
   */
  function warn_if_options_mismatch() {
    try {
      document.querySelectorAll('input[name="mood"]').forEach(function check_mood(input) {
        const is_known = root.MOODS.some(function match_mood(mood) {
          return mood.id === input.value;
        });
        if (!is_known) {
          console.error("알 수 없는 기분 값입니다.", input.value);
        }
      });
    } catch (error) {
      console.error("선택 값을 확인하지 못했습니다.", error);
    }
  }

  /**
   * 디자인이 바뀌면 같은 순번의 문장과 그림을 그 모드 덱에서 다시 고릅니다.
   */
  function on_design_change() {
    try {
      aurora_motion_no += 1;
      window.clearTimeout(aurora_hold_timer);
      release_flying_image();
      document.documentElement.style.paddingBottom = "";
      if (!current_card) {
        return;
      }
      const validated = root.validate_input(collect_input());
      if (!validated || !validated.is_valid) {
        return;
      }
      const card = root.pick_today_phrase(validated, current_card.offset);
      if (!card) {
        show_error(root.MESSAGES.draw_failed);
        return;
      }
      apply_card(validated, card);
    } catch (error) {
      console.error("디자인에 맞는 문장을 다시 고르지 못했습니다.", error);
      show_error(root.MESSAGES.draw_failed);
    }
  }

  /**
   * 버튼과 저장 카드를 연결하고 첫 화면을 준비합니다.
   */
  function start_app() {
    try {
      if (!cache_elements()) {
        return;
      }
      if (!root.PHRASES || !root.WISE_QUOTES || !root.validate_input || !root.pick_today_phrase || !root.save_card_state) {
        console.error("필요한 스크립트를 모두 불러오지 못했습니다.");
        show_error(root.MESSAGES ? root.MESSAGES.data_missing : "페이지를 새로고침해 주세요.");
        return;
      }

      warn_if_options_mismatch();
      els.form.addEventListener("submit", on_submit);
      els.vignette_prev.addEventListener("click", function on_prev_vignette() {
        on_browse_vignette(-1);
      });
      els.vignette_next.addEventListener("click", function on_next_vignette() {
        on_browse_vignette(1);
      });
      document.addEventListener("today_word_design_change", on_design_change);
      restore_saved_card();
    } catch (error) {
      console.error("화면을 시작하지 못했습니다.", error);
    }
  }

  root.show_face_reading = show_face_reading;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start_app);
  } else {
    start_app();
  }
})();

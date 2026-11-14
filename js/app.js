/**
 * 입력 화면과 결과 카드를 연결합니다.
 * 버튼을 누르면 검사, 문장 선택, 화면 표시, 저장이 차례로 일어납니다.
 */
(function init_app() {
  const root = window.TodayWordCard || {};

  const els = {};
  let current_card = null;
  // 그림을 요청할 때마다 1씩 올립니다. 늦게 도착한 예전 그림을 걸러내는 번호표입니다.
  let vignette_request_no = 0;

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
      els.card_caution
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
   */
  function collect_input() {
    try {
      const mood_input = document.querySelector('input[name="mood"]:checked');
      return { mood: mood_input ? mood_input.value : "" };
    } catch (error) {
      console.error("입력을 읽지 못했습니다.", error);
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
      if (is_previous_loaded && els.vignette_image.currentSrc) {
        els.card_vignette.style.backgroundImage = 'url("' + els.vignette_image.currentSrc + '")';
      }
      els.vignette_image.src = vignette.src;
      els.vignette_caption.textContent = vignette.caption;

      // 그림과 그림 이름이 같은 박자로 다시 움직이게 합니다.
      els.card_vignette.classList.remove("is_changing");
      els.card_caption.classList.remove("is_changing");
      void els.card_vignette.offsetWidth;
      els.card_vignette.classList.add("is_changing");
      els.card_caption.classList.add("is_changing");
    } catch (error) {
      console.error("그림을 바꾸지 못했습니다.", error);
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

      if (els.vignette_image.getAttribute("src") === vignette.src) {
        els.vignette_caption.textContent = vignette.caption;
        return;
      }

      const loader = new Image();
      loader.onload = function on_vignette_loaded() {
        // 기다리는 사이에 버튼을 또 눌렀다면, 이 그림은 이미 지나간 카드의 것이므로 버립니다.
        if (request_no === vignette_request_no) {
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
   * 고른 카드를 화면에 그립니다.
   */
  function render_card(card) {
    try {
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
   * 만든 카드를 현재 카드로 삼아 화면에 그리고, 저장하고, 다음 그림을 미리 받아 둡니다.
   */
  function apply_card(validated, card) {
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
   * 카드가 없으면 그날의 첫 장을, 있으면 섞어 둔 다음 장을 엽니다.
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
   * 그림 아래의 문장 뽑기. 다음 문장과 다음 그림을 보여줍니다.
   */
  function on_submit(event) {
    try {
      event.preventDefault();
      const card = show_next_card("draw_button");
      if (card) {
        els.card_lead.focus();
      }
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
      document.addEventListener("today_word_design_change", on_design_change);
      restore_saved_card();
    } catch (error) {
      console.error("화면을 시작하지 못했습니다.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start_app);
  } else {
    start_app();
  }
})();

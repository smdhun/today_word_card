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
    els.age_input = require_element("age_input");
    els.form_message = require_element("form_message");
    els.status_message = require_element("status_message");
    els.draw_button = require_element("draw_button");
    els.redraw_button = require_element("redraw_button");
    els.copy_button = require_element("copy_button");
    els.result_card = require_element("result_card");
    els.card_empty = require_element("card_empty");
    els.card_head = require_element("card_head");
    els.card_body = require_element("card_body");
    els.card_date = require_element("card_date");
    els.card_meta = require_element("card_meta");
    els.card_mood = require_element("card_mood");
    els.card_lead = require_element("card_lead");
    els.card_caution = require_element("card_caution");
    els.proverb_block = require_element("proverb_block");
    els.card_proverb = require_element("card_proverb");
    els.card_vignette = require_element("card_vignette");
    els.vignette_image = require_element("vignette_image");
    els.vignette_caption = require_element("vignette_caption");

    return Boolean(
      els.form &&
      els.age_input &&
      els.form_message &&
      els.status_message &&
      els.draw_button &&
      els.redraw_button &&
      els.copy_button &&
      els.result_card &&
      els.card_empty &&
      els.card_head &&
      els.card_body &&
      els.card_date &&
      els.card_meta &&
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
   * 폼에서 나이, 성별, 기분을 읽습니다.
   */
  function collect_input() {
    try {
      const gender_input = document.querySelector('input[name="gender"]:checked');
      const mood_input = document.querySelector('input[name="mood"]:checked');
      return {
        age_text: els.age_input.value,
        gender: gender_input ? gender_input.value : "",
        mood: mood_input ? mood_input.value : "",
      };
    } catch (error) {
      console.error("입력을 읽지 못했습니다.", error);
      return { age_text: "", gender: "", mood: "" };
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
   * 속담 칸을 채웁니다. 속담이 없는 카드라면 칸을 통째로 숨깁니다.
   */
  function render_proverb(proverb_text) {
    try {
      if (!els.proverb_block || !els.card_proverb) {
        return;
      }
      els.card_proverb.textContent = proverb_text || "";
      els.proverb_block.hidden = !proverb_text;
    } catch (error) {
      console.error("속담을 보여주지 못했습니다.", error);
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

      // 클래스를 뗐다가 다시 붙여야 같은 움직임이 매번 새로 시작됩니다.
      els.card_vignette.classList.remove("is_changing");
      void els.card_vignette.offsetWidth;
      els.card_vignette.classList.add("is_changing");
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
   * 덕분에 "다른 문장 보기"를 눌렀을 때 그림이 문장과 거의 동시에 바뀝니다.
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
      els.card_date.textContent = card.date_label;
      els.card_meta.textContent = card.age_band.label;
      els.card_mood.textContent = card.mood.label;
      els.card_lead.textContent = card.lead_text;
      els.card_caution.textContent = card.caution_text;
      render_proverb(card.proverb_text);
      render_vignette(card.vignette);
      els.result_card.dataset.gender = card.gender.id;
      els.result_card.dataset.mood = card.mood.id;
      els.card_empty.hidden = true;
      els.card_head.hidden = false;
      els.card_body.hidden = false;
      els.redraw_button.disabled = false;
      els.copy_button.disabled = false;
      play_reveal();
    } catch (error) {
      console.error("카드를 그리지 못했습니다.", error);
      show_error(root.MESSAGES.draw_failed);
    }
  }

  /**
   * 카드 내용을 복사할 문자열로 만듭니다.
   * 속담이 있는 카드라면 맨 아래에 한 줄을 덧붙입니다.
   */
  function build_copy_text(card) {
    const lines = [
      card.date_label,
      card.age_band.label + " · " + card.mood.label,
      "",
      card.lead_text,
      card.caution_text,
    ];
    if (card.proverb_text) {
      lines.push("", "오늘의 속담: " + card.proverb_text);
    }
    return lines.join("\n");
  }

  /**
   * 보안 정책 때문에 클립보드를 바로 쓰지 못할 때 쓰는 예비 복사입니다.
   */
  function copy_with_textarea(text) {
    try {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "readonly");
      helper.style.position = "fixed";
      helper.style.left = "-9999px";
      document.body.appendChild(helper);
      helper.select();
      const is_copied = document.execCommand("copy");
      document.body.removeChild(helper);
      return is_copied;
    } catch (error) {
      console.error("예비 복사도 실패했습니다.", error);
      return false;
    }
  }

  /**
   * 문장을 클립보드에 넣습니다.
   */
  async function copy_card_text(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return copy_with_textarea(text);
    } catch (error) {
      console.error("문장을 복사하지 못했습니다.", error);
      return copy_with_textarea(text);
    }
  }

  /**
   * 현재 카드와 입력을 브라우저에 저장합니다.
   */
  function persist_card(validated, card) {
    const is_saved = root.save_card_state({
      version: root.STORAGE_VERSION,
      age_text: validated.age_text,
      gender: validated.gender,
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
   * 오늘의 문장 뽑기. 순번을 0으로 되돌려 그 날의 기본 문장을 보여줍니다.
   */
  function on_submit(event) {
    try {
      event.preventDefault();
      clear_messages();
      const validated = root.validate_input(collect_input());
      if (!validated.is_valid) {
        show_error(validated.message, validated.focus_id);
        return;
      }
      const card = draw_card(validated, 0, false);
      if (card) {
        els.card_lead.focus();
      }
    } catch (error) {
      console.error("문장 뽑기를 끝내지 못했습니다.", error);
      show_error(root.MESSAGES.draw_failed, "draw_button");
    }
  }

  /**
   * 같은 입력 안에서 다음 문장과 다음 그림으로 바꿉니다.
   * 섞어 둔 덱의 다음 장을 넘기므로, 덱을 한 바퀴 돌기 전에는 같은 문장도 같은 그림도 나오지 않습니다.
   */
  function on_redraw() {
    try {
      clear_messages();
      const validated = root.validate_input(collect_input());
      if (!validated.is_valid) {
        show_error(validated.message, validated.focus_id);
        return;
      }
      const next_offset = current_card ? current_card.offset + 1 : 1;
      const card = root.pick_today_phrase(validated, next_offset);
      if (!card) {
        show_error(root.MESSAGES.draw_failed, "redraw_button");
        return;
      }
      // 버튼이 카드 안에 있으므로 포커스는 버튼에 그대로 둡니다.
      apply_card(validated, card);
    } catch (error) {
      console.error("다른 문장으로 바꾸지 못했습니다.", error);
      show_error(root.MESSAGES.draw_failed, "redraw_button");
    }
  }

  /**
   * 카드 문장을 복사합니다.
   */
  async function on_copy() {
    try {
      if (!current_card) {
        show_error(root.MESSAGES.draw_failed, "draw_button");
        return;
      }
      const is_copied = await copy_card_text(build_copy_text(current_card));
      if (is_copied) {
        show_status(root.MESSAGES.copy_done);
        return;
      }
      show_status(root.MESSAGES.copy_failed, true);
    } catch (error) {
      console.error("복사 버튼을 처리하지 못했습니다.", error);
      show_status(root.MESSAGES.copy_failed, true);
    }
  }

  /**
   * 같은 날이면 저장해 둔 순번을, 날짜가 바뀌었으면 0을 씁니다.
   */
  function restore_saved_card() {
    try {
      const saved = root.load_card_state();
      if (!saved) {
        return;
      }

      els.age_input.value = saved.age_text;
      check_radio("gender", saved.gender);
      check_radio("mood", saved.mood);

      const validated = root.validate_input({
        age_text: saved.age_text,
        gender: saved.gender,
        mood: saved.mood,
      });
      if (!validated.is_valid) {
        return;
      }

      const is_same_day = saved.date_key === root.get_today_key();
      const offset = is_same_day ? saved.offset : 0;
      draw_card(validated, offset, true);
    } catch (error) {
      console.error("저장된 카드를 되돌리지 못했습니다.", error);
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
   * 버튼과 저장 카드를 연결하고 첫 화면을 준비합니다.
   */
  function start_app() {
    try {
      if (!cache_elements()) {
        return;
      }
      if (!root.PHRASES || !root.validate_input || !root.pick_today_phrase || !root.save_card_state) {
        console.error("필요한 스크립트를 모두 불러오지 못했습니다.");
        show_error(root.MESSAGES ? root.MESSAGES.data_missing : "페이지를 새로고침해 주세요.");
        return;
      }

      els.card_empty.textContent = root.MESSAGES.empty_guide;
      warn_if_options_mismatch();
      els.form.addEventListener("submit", on_submit);
      els.redraw_button.addEventListener("click", on_redraw);
      els.copy_button.addEventListener("click", on_copy);
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

/**
 * 한 문장 모드입니다. 오로라 카드의 네 칸(밤의 한 줄, 사색의 결, 격언 1, 격언 2) 중
 * 한 칸만 무작위로 골라 보여 주고, 그 칸의 종류에 맞는 별빛 연출(js/sparkle_text.js)로 드러냅니다.
 * 칸을 숨기는 일은 CSS(css/single_sentence.css)가 맡고, 이 파일은 어느 칸을 보일지만 정합니다.
 */
(function init_single_sentence() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  // 한 문장 모드를 쓰는 기분입니다. 다른 기분도 바꾸려면 여기에 기분 이름을 더합니다.
  const SINGLE_SENTENCE_MOODS = ["joy"];
  // 칸을 바꿀 때 옛 문장이 사라지는 시간, 새 칸이 들어오는 시간, 인물 이름이 나타나는 시간입니다.
  const SWAP_OUT_MS = 240;
  const SWAP_IN_MS = 220;
  const PERSON_FADE_MS = 360;

  // 네 종류의 칸과, 칸마다 쓰는 별빛 모양입니다.
  const KINDS = [
    { id: "lead", block_selector: ".verse_lead", text_id: "card_lead", person_id: "", style: "burst" },
    { id: "caution", block_selector: ".verse_caution", text_id: "card_caution", person_id: "", style: "sweep" },
    { id: "wise_0", block_selector: "#wise_quote_first", text_id: "wise_text_first", person_id: "wise_person_first", style: "rain" },
    { id: "wise_1", block_selector: "#wise_quote_second", text_id: "wise_text_second", person_id: "wise_person_second", style: "constellation" },
  ];

  // 지금 보이는 칸입니다. 다른 화면에 다녀와도 같은 칸을 다시 보일 수 있게 기억해 둡니다.
  let current_kind = null;
  // 바로 전에 보인 칸의 종류입니다. 같은 종류가 연달아 나오지 않게 합니다.
  let last_kind_id = "";
  // 칸 바꾸기를 누를 때마다 바뀌는 번호입니다. 사라지는 중에 또 누르면 앞의 요청은 버립니다.
  let swap_token = 0;
  let swap_animation = null;

  function card_body() {
    return document.getElementById("card_body");
  }

  /**
   * 칸 하나를 이루는 요소들입니다.
   */
  function parts_of(kind) {
    const block = document.querySelector(kind.block_selector);
    return {
      block: block,
      label: block ? block.querySelector(".verse_label") : null,
      text: document.getElementById(kind.text_id),
      person: kind.person_id ? document.getElementById(kind.person_id) : null,
    };
  }

  /**
   * 보여 줄 수 있는 칸인지 확인합니다. 칸이 숨겨져 있으면(얼굴 찾기가 뺀 칸, 격언이 없는 칸) 고르지 않습니다.
   */
  function is_available(kind) {
    const parts = parts_of(kind);
    return Boolean(parts.block && !parts.block.hidden && parts.text);
  }

  function has_text(kind) {
    const parts = parts_of(kind);
    return is_available(kind) && Boolean((parts.text.textContent || "").trim());
  }

  /**
   * 바로 전과 다른 종류를 무작위로 고릅니다. 고를 칸이 하나뿐이면 그 칸을 씁니다.
   */
  function pick_random(candidates) {
    if (!candidates.length) {
      return null;
    }
    const fresh = candidates.length > 1
      ? candidates.filter(function is_not_last(kind) {
        return kind.id !== last_kind_id;
      })
      : candidates;
    return fresh[Math.floor(Math.random() * fresh.length)];
  }

  /**
   * 고른 칸에만 표시를 붙입니다. 표시가 없는 칸은 CSS가 숨깁니다.
   */
  function mark_kind(kind) {
    KINDS.forEach(function toggle_pick(item) {
      const parts = parts_of(item);
      if (parts.block) {
        parts.block.classList.toggle("is_single_pick", item === kind);
      }
    });
    current_kind = kind;
    last_kind_id = kind ? kind.id : last_kind_id;
  }

  /**
   * 격언의 인물 이름을 문장 다음에 천천히 보여 줍니다.
   */
  function reveal_person(parts) {
    if (!parts.person || !parts.person.classList.contains("is_single_waiting")) {
      return;
    }
    parts.person.classList.remove("is_single_waiting");
    try {
      parts.person.animate([{ opacity: 0 }, { opacity: 1 }], { duration: PERSON_FADE_MS, easing: "ease-out" });
    } catch (error) {
      console.error("인물 이름을 흐리게 보여 주지 못했습니다. 바로 보여 줍니다.", error);
    }
  }

  /**
   * 진행 중인 칸 바꾸기와 별빛 연출을 멈추고, 지금 칸을 완성된 모습으로 둡니다.
   */
  function stop_all() {
    swap_token += 1;
    if (swap_animation) {
      swap_animation.cancel();
      swap_animation = null;
    }
    if (!current_kind) {
      return;
    }
    const parts = parts_of(current_kind);
    if (parts.text && typeof root.stop_sparkle_text === "function") {
      root.stop_sparkle_text(parts.text);
    }
    if (parts.person) {
      parts.person.classList.remove("is_single_waiting");
    }
  }

  /**
   * 이 기분이 한 문장 모드를 쓰는지 확인합니다.
   */
  root.is_single_sentence_mood = function is_single_sentence_mood(mood_id) {
    return SINGLE_SENTENCE_MOODS.indexOf(mood_id) !== -1;
  };

  /**
   * 지금 카드가 한 문장 모드인지 확인합니다.
   */
  root.is_single_sentence_active = function is_single_sentence_active() {
    const body = card_body();
    return Boolean(body && body.classList.contains("is_single_sentence"));
  };

  /**
   * 카드를 한 문장 모드로 바꾸고 보일 칸 하나를 고릅니다. 고를 칸이 없으면 네 칸 모드로 둡니다.
   * options.keep_kind가 참이면 전에 보이던 칸을 그대로 씁니다(다른 화면에 다녀왔을 때).
   */
  root.apply_single_sentence = function apply_single_sentence(options) {
    try {
      const body = card_body();
      if (!body) {
        return false;
      }
      stop_all();
      const candidates = KINDS.filter(has_text);
      const should_keep = Boolean(options && options.keep_kind && current_kind && candidates.indexOf(current_kind) !== -1);
      const kind = should_keep ? current_kind : pick_random(candidates);
      if (!kind) {
        console.error("보여 줄 문장 칸이 없습니다. 네 칸을 그대로 보여 줍니다.");
        root.clear_single_sentence();
        return false;
      }
      body.classList.add("is_single_sentence");
      mark_kind(kind);
      return true;
    } catch (error) {
      console.error("한 문장 화면으로 바꾸지 못했습니다. 네 칸을 그대로 보여 줍니다.", error);
      root.clear_single_sentence();
      return false;
    }
  };

  /**
   * 한 문장 모드를 끄고 원래의 네 칸 화면으로 되돌립니다.
   */
  root.clear_single_sentence = function clear_single_sentence() {
    stop_all();
    const body = card_body();
    if (body) {
      body.classList.remove("is_single_sentence");
    }
    KINDS.forEach(function unmark(kind) {
      const parts = parts_of(kind);
      if (parts.block) {
        parts.block.classList.remove("is_single_pick");
      }
    });
  };

  /**
   * 고른 칸의 문장을 그 종류의 별빛으로 드러냅니다. 격언이면 문장 뒤에 인물 이름이 나타납니다.
   */
  root.play_single_sentence = function play_single_sentence() {
    try {
      if (!root.is_single_sentence_active() || !current_kind || typeof root.play_sparkle_text !== "function") {
        return Promise.resolve();
      }
      const parts = parts_of(current_kind);
      if (!parts.text) {
        return Promise.resolve();
      }
      if (parts.person) {
        parts.person.classList.add("is_single_waiting");
      }
      return root.play_sparkle_text(parts.text, {
        style: current_kind.style,
        canvas_host: parts.block,
        burst_anchor: parts.label,
      }).then(function on_sentence_done() {
        reveal_person(parts);
      });
    } catch (error) {
      console.error("문장 연출을 시작하지 못했습니다. 문장은 그대로 보여 줍니다.", error);
      return Promise.resolve();
    }
  };

  /**
   * 연출 중이면 끝 장면으로 건너뜁니다. 건너뛰었으면 true입니다.
   */
  root.finish_single_sentence = function finish_single_sentence() {
    if (!current_kind || typeof root.finish_sparkle_text !== "function") {
      return false;
    }
    const parts = parts_of(current_kind);
    const is_finished = Boolean(parts.text && root.finish_sparkle_text(parts.text));
    if (is_finished) {
      reveal_person(parts);
    }
    return is_finished;
  };

  /**
   * 새 문장을 넣기 전에 진행 중인 연출을 멈춥니다.
   */
  root.stop_single_sentence = stop_all;

  /**
   * 지금 칸을 흐려 보낸 뒤 다른 종류의 칸을 골라 새 문장을 넣고, 그 칸의 별빛으로 드러냅니다.
   * fill_kind(kind_id)는 그 종류에 새 문장을 넣고 성공하면 true를 돌려줍니다.
   * 결과는 Promise로 돌려줍니다. 바꿨으면 true, 새 문장을 넣지 못했으면 false, 더 새 요청에 밀렸으면 null입니다.
   */
  root.swap_single_sentence = function swap_single_sentence(fill_kind) {
    try {
      if (!root.is_single_sentence_active() || typeof fill_kind !== "function") {
        return Promise.resolve(false);
      }
      stop_all();
      const token = swap_token;
      const next_kind = pick_random(KINDS.filter(is_available));
      if (!next_kind) {
        return Promise.resolve(false);
      }
      const old_parts = current_kind ? parts_of(current_kind) : null;

      /**
       * 새 칸에 문장을 넣고 보이게 한 뒤 별빛 연출을 시작합니다.
       */
      const show_next = function show_next() {
        if (token !== swap_token) {
          return null;
        }
        if (swap_animation) {
          swap_animation.cancel();
          swap_animation = null;
        }
        if (!fill_kind(next_kind.id)) {
          return false;
        }
        mark_kind(next_kind);
        const next_parts = parts_of(next_kind);
        try {
          next_parts.block.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SWAP_IN_MS, easing: "ease-out" });
        } catch (error) {
          console.error("새 칸을 흐리게 보여 주지 못했습니다. 바로 보여 줍니다.", error);
        }
        root.play_single_sentence();
        return true;
      };

      if (!old_parts || !old_parts.block || typeof old_parts.block.animate !== "function") {
        return Promise.resolve(show_next());
      }
      swap_animation = old_parts.block.animate([
        { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
        { opacity: 0, transform: "translateY(-6px)", filter: "blur(3px)" },
      ], { duration: SWAP_OUT_MS, easing: "ease-in", fill: "forwards" });
      // 사라지는 중에 또 누르거나 새 카드가 들어오면 이 요청은 버려집니다(null).
      return swap_animation.finished.then(show_next).catch(function on_cancelled() {
        return null;
      });
    } catch (error) {
      console.error("다른 문장 칸으로 바꾸지 못했습니다. 잠시 후 다시 눌러 주세요.", error);
      return Promise.resolve(false);
    }
  };
})();

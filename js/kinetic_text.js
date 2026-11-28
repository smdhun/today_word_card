/**
 * 문장을 단어 묶음으로 나눠 하나씩 드러내는 키네틱 타이포그래피입니다.
 * - 카메라: 첫 단어에 가깝게 들어가 있다가 문장이 채워질수록 뒤로 빠지며 끝 단어 쪽으로 따라갑니다.
 * - 빛 점(✦): 방금 나온 단어 끝을 따라 흐르며 문장을 "쓰는" 것처럼 보입니다.
 * - 연출이 끝나면 쪼갰던 글을 원래의 한 덩어리 글로 되돌립니다.
 * 움직임 줄이기를 켠 기기에서는 짧게 흐렸다 나타나기만 합니다.
 */
(function init_kinetic_text() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  // 단어 묶음 하나가 자리 잡는 시간과, 묶음 사이 간격의 범위입니다.
  const GROUP_ENTER_MS = 560;
  const GROUP_STAGGER_MAX_MS = 90;
  const GROUP_STAGGER_MIN_MS = 45;
  // 묶음이 많은 언어도 한 문장의 등장 시작이 이 시간 안에 모두 끝납니다.
  const SENTENCE_SPREAD_MS = 900;
  // 첫 단어에 들어가 있는 카메라의 확대 배율입니다. 멀미가 나지 않게 작게 둡니다.
  const CAMERA_ZOOM = 1.22;
  // 칸 하나를 바꿀 때 옛 문장이 흩어지는 시간입니다.
  const GROUP_EXIT_MS = 260;
  const GROUP_EXIT_STAGGER_MS = 22;
  const REDUCED_FADE_MS = 300;
  const EASE_ENTER = "cubic-bezier(0.2, 0.7, 0.2, 1)";
  const EASE_CAMERA = "cubic-bezier(0.33, 0, 0.2, 1)";
  const EASE_EXIT = "cubic-bezier(0.4, 0, 1, 1)";
  // 띄어 쓰는 언어에서 이 길이 이하의 짧은 낱말(a, de, в 등)은 다음 낱말과 한 묶음으로 나옵니다.
  const SHORT_WORD_MAX = 2;
  const SHORT_WORD_LANGUAGES = /^(en|es|pt|fr|de|ru|id|vi)/;
  // 일본어는 히라가나 조각(조사, 어미)을 앞 낱말에 붙이되, 한 묶음이 이 글자 수를 넘지 않게 합니다.
  const JA_GROUP_MAX_CHARS = 9;
  // 중국어에서 앞 낱말에 붙여 함께 내보낼 조사입니다.
  const ZH_PARTICLES = new Set(["的", "了", "吧", "地", "得", "着", "著", "过", "過", "吗", "嗎", "呢", "啊", "们", "們"]);
  // 힌디어에서 한국어 조사처럼 앞 낱말에 붙여 함께 내보낼 후치사입니다.
  const HI_POSTPOSITIONS = new Set(["का", "की", "के", "को", "में", "से", "पर", "ने", "तक", "भी", "ही"]);
  const SPACE_FREE_LANGUAGES = /^(ja|zh)/;

  // 연출 중인 칸과 그 상태입니다. { text, camera, animations, phase, token }
  const plays = new Map();
  let play_token = 0;

  /**
   * 움직임 줄이기를 켠 기기인지 확인합니다.
   */
  function is_reduced_motion() {
    try {
      return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (error) {
      console.error("움직임 설정을 확인하지 못했습니다. 기본 연출을 씁니다.", error);
      return false;
    }
  }

  /**
   * 지금 화면 언어입니다.
   */
  function current_language() {
    if (typeof root.get_language === "function") {
      return root.get_language();
    }
    return document.documentElement.lang || "ko";
  }

  /**
   * 문장부호만 있는 조각인지 확인합니다.
   */
  function is_punctuation(piece) {
    return /^[\p{P}\p{S}\s]+$/u.test(piece);
  }

  /**
   * 띄어쓰기 없는 언어의 조각이 앞 묶음에 붙어야 하는지 확인합니다.
   * 일본어: 히라가나 조각(조사, 어미)과 문장부호. 묶음이 너무 길어지면 새 묶음을 엽니다.
   * 중국어: 조사와 문장부호, 그리고 앞 묶음이 한 글자뿐일 때.
   */
  function should_attach_piece(group, piece, is_japanese) {
    if (is_punctuation(piece)) {
      return true;
    }
    if (is_japanese) {
      return /^[\u3041-\u309F\u30FC]+$/.test(piece) && group.length + piece.length <= JA_GROUP_MAX_CHARS;
    }
    return ZH_PARTICLES.has(piece) || group.length < 2;
  }

  /**
   * 띄어쓰기가 없는 일본어, 중국어를 단어 묶음으로 나눕니다.
   * 브라우저의 낱말 나누기로 자른 뒤, 조사와 문장부호는 앞 낱말에 붙입니다.
   */
  function split_space_free(text, language) {
    if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") {
      // 낱말 나누기가 없는 브라우저는 두 글자씩 묶습니다.
      return Array.from(text.match(/.{1,2}/gsu) || [text]);
    }
    const is_japanese = language.indexOf("ja") === 0;
    const pieces = Array.from(new Intl.Segmenter(language, { granularity: "word" }).segment(text), function take(part) {
      return part.segment;
    });
    const groups = [];
    pieces.forEach(function add_piece(piece) {
      const last = groups.length - 1;
      if (last >= 0 && should_attach_piece(groups[last], piece, is_japanese)) {
        groups[last] += piece;
      } else {
        groups.push(piece);
      }
    });
    return groups;
  }

  /**
   * 띄어 쓰는 언어를 단어 묶음으로 나눕니다. 한국어는 어절이라 조사가 단어에 붙어 함께 나옵니다.
   */
  function split_spaced(text, language) {
    const words = text.split(/\s+/).filter(Boolean);
    if (language.indexOf("hi") === 0) {
      return words.reduce(function attach_postposition(groups, word) {
        const bare = word.replace(/[\p{P}\p{S}]/gu, "");
        if (groups.length && HI_POSTPOSITIONS.has(bare)) {
          groups[groups.length - 1] += " " + word;
        } else {
          groups.push(word);
        }
        return groups;
      }, []);
    }
    if (!SHORT_WORD_LANGUAGES.test(language)) {
      return words;
    }
    const groups = [];
    let carry = "";
    words.forEach(function add_word(word, index) {
      const letters = word.replace(/[\p{P}\p{S}]/gu, "");
      const is_short = letters.length > 0 && letters.length <= SHORT_WORD_MAX && index < words.length - 1;
      if (is_short) {
        carry = carry ? carry + " " + word : word;
        return;
      }
      groups.push(carry ? carry + " " + word : word);
      carry = "";
    });
    if (carry) {
      groups.push(carry);
    }
    return groups;
  }

  /**
   * 문장을 언어에 맞는 단어 묶음 목록으로 나눕니다.
   */
  function split_groups(text, language) {
    const groups = SPACE_FREE_LANGUAGES.test(language) ? split_space_free(text, language) : split_spaced(text, language);
    return groups.length ? groups : [text];
  }

  /**
   * ::before, ::after에 넣어 둔 따옴표 글자를 읽습니다. 연출 중에는 첫 묶음과 끝 묶음에 붙여 함께 움직입니다.
   */
  function read_quote(element, pseudo) {
    try {
      const content = window.getComputedStyle(element, pseudo).getPropertyValue("content");
      if (!content || content === "none" || content === "normal") {
        return "";
      }
      return content.replace(/^["']|["']$/g, "");
    } catch (error) {
      console.error("문장 따옴표를 읽지 못했습니다. 따옴표 없이 보여 줍니다.", error);
      return "";
    }
  }

  /**
   * 칸 안의 글을 연출용 조각으로 바꿉니다.
   * 화면 읽기 프로그램은 쪼갠 조각 대신 숨겨 둔 문장 전체를 읽습니다.
   */
  function build_stage(element, text, language) {
    const open_quote = read_quote(element, "::before");
    const close_quote = read_quote(element, "::after");
    const words = split_groups(text, language);
    const joiner = SPACE_FREE_LANGUAGES.test(language) ? "" : " ";

    const reader_text = document.createElement("span");
    reader_text.className = "kinetic_reader";
    reader_text.textContent = text;

    const camera = document.createElement("span");
    camera.className = "kinetic_camera";
    camera.setAttribute("aria-hidden", "true");

    const groups = words.map(function make_group(word, index) {
      const group = document.createElement("span");
      group.className = "kinetic_group";
      const head = index === 0 ? open_quote : "";
      const tail = index === words.length - 1 ? close_quote : "";
      group.textContent = head + word + tail;
      if (index > 0 && joiner) {
        camera.appendChild(document.createTextNode(joiner));
      }
      camera.appendChild(group);
      return group;
    });

    const spark = document.createElement("span");
    spark.className = "kinetic_spark";
    spark.textContent = "\u2726";
    camera.appendChild(spark);

    element.classList.add("has_kinetic_stage");
    element.replaceChildren(reader_text, camera);
    return { camera: camera, groups: groups, spark: spark };
  }

  /**
   * 연출이 끝난 칸을 원래의 한 덩어리 글로 되돌립니다.
   * 그 사이 다른 글(언어 변경 등)이 들어왔다면 그 글을 그대로 둡니다.
   */
  function restore_plain(element, state) {
    element.classList.remove("has_kinetic_stage", "is_kinetic_playing");
    if (state && state.camera && state.camera.isConnected && element.contains(state.camera)) {
      element.textContent = state.text;
    }
  }

  /**
   * 칸에서 진행 중인 연출을 멈춥니다. 쪼갰던 글은 원래 글로 되돌립니다.
   * should_apply가 참이면, 흩어지던 옛 문장 대신 넣기로 한 새 문장을 바로 넣습니다.
   */
  function cancel_play(element, should_apply) {
    const state = plays.get(element);
    if (!state) {
      return;
    }
    plays.delete(element);
    state.animations.forEach(function stop(animation) {
      try {
        animation.cancel();
      } catch (error) {
        console.error("문장 연출을 멈추지 못했습니다.", error);
      }
    });
    restore_plain(element, state);
    if (should_apply === true && state.phase === "exit" && typeof state.apply_text === "function") {
      state.apply_text();
    }
  }

  /**
   * 단어 묶음 한가운데의 위치입니다. 카메라 안쪽 기준입니다.
   */
  function group_center(group) {
    return {
      x: group.offsetLeft + group.offsetWidth / 2,
      y: group.offsetTop + group.offsetHeight / 2,
    };
  }

  /**
   * 빛 점이 지나갈 길입니다. 각 묶음이 나타나는 순간, 그 묶음의 글 끝(아랍어는 왼쪽 끝) 아래에 섭니다.
   */
  function spark_keyframes(groups, stagger_ms, total_ms, is_rtl) {
    const frames = [];
    const place = function place(group, offset, opacity) {
      const x = is_rtl ? group.offsetLeft : group.offsetLeft + group.offsetWidth;
      const y = group.offsetTop + group.offsetHeight * 0.82;
      frames.push({
        offset: Math.min(1, Math.max(0, offset)),
        opacity: opacity,
        transform: "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px) translate(-50%, -50%)",
      });
    };
    const first = groups[0];
    const start_x = is_rtl ? first.offsetLeft + first.offsetWidth : first.offsetLeft;
    frames.push({
      offset: 0,
      opacity: 0,
      transform: "translate(" + start_x.toFixed(1) + "px, " + (first.offsetTop + first.offsetHeight * 0.82).toFixed(1) + "px) translate(-50%, -50%)",
    });
    let last_offset = 0;
    groups.forEach(function add_stop(group, index) {
      const offset = Math.max(last_offset + 0.001, (index * stagger_ms + GROUP_ENTER_MS * 0.35) / total_ms);
      place(group, offset, 1);
      last_offset = offset;
    });
    const end = frames[frames.length - 1];
    frames.push({ offset: 1, opacity: 0, transform: end.transform });
    return frames;
  }

  /**
   * 움직임 줄이기를 켠 기기의 짧은 등장입니다.
   */
  function play_reduced(element) {
    try {
      const animation = element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_FADE_MS, easing: "ease-out" });
      return animation.finished.catch(function ignore_cancel() {
        return null;
      });
    } catch (error) {
      console.error("문장을 흐리게 보여 주지 못했습니다. 바로 보여 줍니다.", error);
      return Promise.resolve();
    }
  }

  /**
   * 칸의 문장을 단어 묶음으로 하나씩 드러냅니다. 끝나면 Promise가 풀립니다.
   */
  root.play_kinetic_text = function play_kinetic_text(element) {
    try {
      if (!element || typeof element.animate !== "function") {
        return Promise.resolve();
      }
      cancel_play(element);
      const text = (element.textContent || "").trim();
      if (!text) {
        return Promise.resolve();
      }
      if (is_reduced_motion()) {
        return play_reduced(element);
      }

      const language = current_language();
      const stage = build_stage(element, text, language);
      element.classList.add("is_kinetic_playing");
      play_token += 1;
      const state = { text: text, camera: stage.camera, animations: [], phase: "enter", token: play_token };
      plays.set(element, state);

      const groups = stage.groups;
      const count = groups.length;
      const stagger_ms = Math.min(GROUP_STAGGER_MAX_MS, Math.max(GROUP_STAGGER_MIN_MS, SENTENCE_SPREAD_MS / Math.max(1, count - 1)));
      const total_ms = (count - 1) * stagger_ms + GROUP_ENTER_MS;
      const glow = "0 0 14px color-mix(in srgb, var(--primary) 70%, transparent)";

      // 단어 묶음: 흐림 → 선명, 아래 → 제자리. 자리 잡는 순간 기분 색으로 잠깐 빛납니다.
      groups.forEach(function enter_group(group, index) {
        state.animations.push(group.animate([
          { opacity: 0, transform: "translateY(0.5em) scale(0.96)", filter: "blur(6px)", textShadow: "0 0 0 transparent" },
          { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)", textShadow: glow, offset: 0.55 },
          { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)", textShadow: "0 0 0 transparent" },
        ], { duration: GROUP_ENTER_MS, delay: index * stagger_ms, easing: EASE_ENTER, fill: "both" }));
      });

      // 카메라: 첫 단어에 들어가 있다가, 끝 단어 쪽으로 따라가며 원래 크기로 빠집니다.
      const first = group_center(groups[0]);
      const last = group_center(groups[count - 1]);
      state.animations.push(stage.camera.animate([
        { transform: "scale(" + CAMERA_ZOOM + ")", transformOrigin: first.x.toFixed(1) + "px " + first.y.toFixed(1) + "px" },
        { transform: "scale(1)", transformOrigin: last.x.toFixed(1) + "px " + last.y.toFixed(1) + "px" },
      ], { duration: total_ms, easing: EASE_CAMERA, fill: "both" }));

      // 빛 점: 방금 나온 단어 끝을 따라 흐릅니다.
      const is_rtl = window.getComputedStyle(element).direction === "rtl";
      state.animations.push(stage.spark.animate(spark_keyframes(groups, stagger_ms, total_ms, is_rtl), {
        duration: total_ms + 240,
        easing: "linear",
        fill: "both",
      }));

      const token = state.token;
      return Promise.all(state.animations.map(function wait(animation) {
        return animation.finished;
      })).then(function on_done() {
        if (plays.get(element) && plays.get(element).token === token) {
          plays.delete(element);
          restore_plain(element, state);
        }
      }).catch(function on_cancelled() {
        return null;
      });
    } catch (error) {
      console.error("문장 연출을 시작하지 못했습니다. 문장은 그대로 보여 줍니다.", error);
      cancel_play(element);
      return Promise.resolve();
    }
  };

  /**
   * 칸의 옛 문장을 흩어 보낸 뒤 apply_text()로 새 문장을 넣고, 새 문장을 연출로 드러냅니다.
   * 흩어지는 동안 또 누르면 앞의 요청은 버리고 마지막 요청만 씁니다.
   */
  root.swap_kinetic_text = function swap_kinetic_text(element, apply_text) {
    try {
      if (!element || typeof apply_text !== "function") {
        return Promise.resolve();
      }
      if (is_reduced_motion() || typeof element.animate !== "function") {
        apply_text();
        return root.play_kinetic_text(element);
      }
      const current = plays.get(element);
      const old_text = current ? current.text : (element.textContent || "").trim();
      cancel_play(element);
      if (!old_text) {
        apply_text();
        return root.play_kinetic_text(element);
      }

      const stage = build_stage(element, old_text, current_language());
      element.classList.add("is_kinetic_playing");
      play_token += 1;
      const state = { text: old_text, camera: stage.camera, animations: [], phase: "exit", token: play_token, apply_text: apply_text };
      plays.set(element, state);

      // 뒤 단어부터 흐려지며 위로 흩어집니다. 카메라는 살짝 다가갑니다.
      const count = stage.groups.length;
      stage.groups.forEach(function exit_group(group, index) {
        state.animations.push(group.animate([
          { opacity: 1, transform: "translateY(0)", filter: "blur(0px)" },
          { opacity: 0, transform: "translateY(-0.4em)", filter: "blur(5px)" },
        ], { duration: GROUP_EXIT_MS, delay: (count - 1 - index) * GROUP_EXIT_STAGGER_MS, easing: EASE_EXIT, fill: "both" }));
      });
      const exit_ms = GROUP_EXIT_MS + (count - 1) * GROUP_EXIT_STAGGER_MS;
      state.animations.push(stage.camera.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.04)" },
      ], { duration: exit_ms, easing: EASE_EXIT, fill: "both" }));

      const token = state.token;
      return Promise.all(state.animations.map(function wait(animation) {
        return animation.finished;
      })).then(function on_exit_done() {
        if (!plays.get(element) || plays.get(element).token !== token) {
          return null;
        }
        plays.delete(element);
        element.classList.remove("has_kinetic_stage", "is_kinetic_playing");
        apply_text();
        return root.play_kinetic_text(element);
      }).catch(function on_cancelled() {
        return null;
      });
    } catch (error) {
      console.error("문장을 바꾸는 연출을 하지 못했습니다. 새 문장을 바로 보여 줍니다.", error);
      cancel_play(element);
      apply_text();
      return Promise.resolve();
    }
  };

  /**
   * 등장 중인 연출을 끝 장면으로 건너뜁니다. 건너뛰었으면 true입니다.
   * 옛 문장이 흩어지는 중에는 건너뛰지 않고 그대로 진행합니다.
   */
  root.finish_kinetic_text = function finish_kinetic_text(element) {
    const state = plays.get(element);
    if (!state || state.phase !== "enter") {
      return false;
    }
    state.animations.forEach(function finish(animation) {
      try {
        animation.finish();
      } catch (error) {
        console.error("문장 연출을 건너뛰지 못했습니다.", error);
      }
    });
    return true;
  };

  /**
   * 다른 연출에서도 같은 규칙으로 단어 묶음을 나눌 수 있게 내보냅니다.
   */
  root.split_kinetic_groups = function split_kinetic_groups(text, language) {
    return split_groups(text, language || current_language());
  };

  /**
   * 문장 칸의 ::before, ::after 따옴표를 읽어 돌려줍니다. { open, close }
   */
  root.read_sentence_quotes = function read_sentence_quotes(element) {
    return { open: read_quote(element, "::before"), close: read_quote(element, "::after") };
  };

  /**
   * 새 문장을 넣기 전에 그 칸의 연출을 멈춥니다.
   */
  root.stop_kinetic_text = function stop_kinetic_text(element) {
    cancel_play(element);
  };

  /**
   * 언어를 바꾸면 새 언어 글이 바로 보이도록 진행 중인 연출을 모두 멈춥니다.
   */
  document.addEventListener("today_word_language_change", function on_language_change() {
    Array.from(plays.keys()).forEach(function cancel_for_language(element) {
      cancel_play(element, true);
    });
  });
})();

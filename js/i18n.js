/**
 * 화면 글자를 고른 언어로 바꿉니다.
 * 한국어는 이 파일 안에 있고, 다른 언어는 처음 고를 때 js/i18n/ 폴더에서 한 번만 받아 옵니다.
 * HTML의 data-i18n은 보이는 글자를, data-i18n-aria는 화면 읽기용 설명을 바꿉니다.
 * Aurora, Tarot, Sketch, Music 버튼은 번역하지 않습니다.
 * 카드 문장 번역(js/i18n/content/)도 언어를 고를 때 함께 받고, 쓰는 일은 js/content_i18n.js가 합니다.
 */
(function init_i18n() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  const LANGUAGE_STORAGE_KEY = "today_word_card_language";
  // 페이지 HTML과 번역의 기준이 되는 언어입니다. 받아 올 파일이 없습니다.
  const LANGUAGE_SOURCE = "ko";
  // 처음 방문해서 고른 언어가 없을 때 보여 줄 언어입니다.
  const LANGUAGE_FIRST_VISIT = "en";
  const LANGUAGE_FOLDER = "js/i18n/";
  const LANGUAGE_FILE_VERSION = "20261126b";
  // 오로라 문장, 격언, 타로 글의 번역입니다. 화면 글자보다 커서 따로 받습니다.
  const CONTENT_FOLDER = "js/i18n/content/";
  const CONTENT_FILE_VERSION = "20261127c";
  // 저장된 언어를 받는 동안 한국어가 잠깐 보이지 않게 가려 두는 최대 시간입니다.
  const LANGUAGE_HIDE_MAX_MS = 2500;
  // 기분 이름이 칸보다 길 때 이 크기까지만 글자를 줄입니다. 그보다 작으면 읽기 어렵습니다.
  const MOOD_NAME_MIN_PX = 11;
  const MOOD_NAME_STEP_PX = 0.5;

  // 목록에는 그 나라 글자로 적습니다. file은 js/i18n/ 안의 파일 이름입니다.
  // 순서는 언어의 영어 이름 abc순입니다. 새 언어를 넣을 때도 오른쪽 주석의 영어 이름 순서에 맞춥니다.
  root.LANGUAGES = [
    { code: "ar", name: "العربية", file: "ar" }, // Arabic
    { code: "zh-Hans", name: "简体中文", file: "zh_hans" }, // Chinese (Simplified)
    { code: "zh-Hant", name: "繁體中文", file: "zh_hant" }, // Chinese (Traditional)
    { code: "en", name: "English", file: "en" }, // English
    { code: "fr", name: "Français", file: "fr" }, // French
    { code: "de", name: "Deutsch", file: "de" }, // German
    { code: "hi", name: "हिन्दी", file: "hi" }, // Hindi
    { code: "id", name: "Indonesia", file: "id" }, // Indonesian
    { code: "ja", name: "日本語", file: "ja" }, // Japanese
    { code: "ko", name: "한국어", file: "" }, // Korean
    { code: "pt", name: "Português", file: "pt" }, // Portuguese
    { code: "ru", name: "Русский", file: "ru" }, // Russian
    { code: "es", name: "Español", file: "es" }, // Spanish
    { code: "vi", name: "Tiếng Việt", file: "vi" }, // Vietnamese
  ];

  // 기준이 되는 한국어 글자입니다. 다른 언어 파일도 같은 키를 씁니다.
  const KO_TEXT = {
    app_title: "오늘의 한마디",
    lang_choose: "언어 선택",
    lang_list: "언어 목록",
    lang_load_failed: "이 언어를 불러오지 못했습니다. 잠시 후 다시 골라 주세요.",
    sound_mute: "음소거",
    sound_unmute: "음소거 해제",
    design_group: "화면 디자인",
    music_mode_group: "반복 방식",
    music_mode_one: "한 곡 반복",
    music_mode_once: "전체 한 번",
    music_mode_shuffle: "무작위 반복",
    music_prev: "이전 곡",
    music_next: "다음 곡",
    music_list: "재생 목록",
    music_play_failed: "이 곡을 재생하지 못했습니다. 다른 곡을 눌러 주세요.",
    hint_title: "화면을 고를 수 있어요",
    hint_text: "Aurora는 밤의 문장, Tarot는 오늘의 카드입니다.",
    close: "닫기",
    title_tarot: "나를 위한 질문을 찾아볼까요",
    title_aurora: "마음에 드는 문장을 찾아볼까요",
    vignette_prev: "이전 그림",
    vignette_next: "다음 그림",
    camera_open: "나의 얼굴에서 찾아보기",
    mood_panel: "오늘의 기분 선택",
    legend_tarot: "오늘의 기분",
    legend_aurora: "지금 나의 기분은 어떤가요?",
    mood_joy: "기쁨",
    mood_calm: "평온",
    mood_excited: "설렘",
    mood_anxious: "불안",
    mood_tired: "피곤",
    mood_sad: "우울",
    draw_tarot: "오늘의 카드 고르기",
    draw_tarot_again: "카드 다시 고르기",
    draw_aurora: "새로운 문장 보기",
    tarot_insight_label: "오늘의 한 줄",
    tarot_question_label: "오늘의 질문",
    empty_tarot: "오늘의 문장을 뽑으면 짧은 문장이 여기에 나타납니다.",
    empty_aurora: "오늘 밤의 감정을 고르면, 그 결에 맞는 문장이 여기에 머뭅니다.",
    lead_tarot: "하루를 보내는 태도",
    lead_aurora: "밤의 한 줄",
    caution_tarot: "마음에 둘 주의점",
    caution_aurora: "사색의 결",
    slot_lead: "밤의 한 줄을 다른 문장으로 바꿉니다",
    slot_caution: "사색의 결을 다른 문장으로 바꿉니다",
    slot_wise_first: "첫 격언을 다른 문장으로 바꿉니다",
    slot_wise_second: "둘째 격언을 다른 문장으로 바꿉니다",
    sketch_stage: "원본 사진",
    epilogue_tarot: "밤하늘의 별처럼 삶의 길을 밝히는 한 줄의 성찰",
    epilogue_aurora: "화면을 닫기 전, 깊은 숨을 들이쉬고 내쉬어보세요.",
    photo_credit: "달빛 사진:",
    camera_privacy: "안심하세요! 카메라로 촬영한 얼굴은 이 기기 안에서만 사용되고, 저장하거나 다른 곳으로 전송되지 않습니다.",
    camera_hint: "얼굴을 이 프레임 안에 맞춰 주세요.",
    trace_show: "판독보기",
    trace_hide: "판독 안보기",
    camera_shutter: "촬영",
    offer_dog: "강아지 색 바꾸기",
    offer_title: "음악을 재생할까요?",
    offer_text: "배경 음악을 틀 수 있습니다. 원하지 않으면 나중에 Music에서 고를 수 있습니다.",
    offer_yes: "재생",
    offer_no: "나중에",
    msg_mood_required: "오늘 기분을 선택한 뒤 다시 뽑아 주세요.",
    msg_draw_failed: "문장을 만들지 못했습니다. 기분을 다시 고른 뒤 뽑아 주세요.",
    msg_copy_done: "문장을 복사했습니다. 원하는 곳에 붙여 넣으면 됩니다.",
    msg_copy_failed: "복사에 실패했습니다. 문장을 드래그해서 직접 복사해 주세요.",
    msg_save_failed: "이 브라우저에는 카드를 기억해 두지 못했습니다. 새로고침 후에는 다시 뽑아 주세요.",
    msg_empty_guide: "오늘의 기분을 고르면 오늘을 위한 짧은 문장이 여기에 나타납니다.",
    msg_data_missing: "문장 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.",
    msg_design_save_failed: "이 브라우저에는 고른 디자인을 기억해 두지 못했습니다. 다음에 열 때 다시 골라 주세요.",
    status_draw_first: "먼저 새로운 문장 보기를 누른 뒤 칸을 눌러 주세요.",
    status_slot_failed: "이 칸의 문장을 바꾸지 못했습니다. 잠시 후 다시 눌러 주세요.",
    status_mood_unknown: "감정을 확인하지 못했습니다. 다시 골라 주세요.",
    status_mood_image_missing: "이 감정의 그림을 열지 못했습니다. 페이지를 새로고침한 뒤 다시 골라 주세요.",
    status_image_change_failed: "그림을 바꾸지 못했습니다. 감정을 다시 골라 주세요.",
    status_image_list_failed: "그림 목록을 열지 못했습니다. 페이지를 새로고침한 뒤 다시 눌러 주세요.",
    status_no_images: "지금은 넘길 그림이 없습니다. 페이지를 새로고침한 뒤 다시 눌러 주세요.",
    status_image_flip_failed: "그림을 넘기지 못했습니다. 잠시 후 다시 눌러 주세요.",
    card_open_failed_reload: "카드를 열지 못했습니다. 페이지를 새로고침한 뒤 다시 뒤집어 주세요.",
    card_open_failed_retry: "카드를 열지 못했습니다. 잠시 후 다시 눌러 주세요.",
    card_text_failed: "이 카드의 글을 열지 못했습니다. 다시 뒤집어 주세요.",
    card_image_failed: "카드 그림을 불러오지 못했습니다. 다시 뒤집어 주세요.",
    card_change_failed: "카드를 바꾸지 못했습니다. 잠시 후 다시 눌러 주세요.",
    card_flip_failed: "카드를 뒤집지 못했습니다. 잠시 후 다시 눌러 주세요.",
    face_reframe: "얼굴을 정면으로, 프레임 안에 두고 다시 찍어 주세요.",
    face_prepare_failed: "얼굴 읽기를 준비하지 못했습니다. 감정을 직접 고른 뒤 뽑아 주세요.",
    face_camera_permission: "카메라 권한을 허용한 뒤 다시 눌러 주세요.",
    face_pick_failed: "추천 글을 고르지 못했습니다. 다시 찍어 주세요.",
    face_preparing: "얼굴을 읽을 준비를 하고 있습니다.",
  };

  const dictionaries = { ko: KO_TEXT };
  const contents = {};
  const pending_loads = {};
  const pending_content_loads = {};
  let current_language = LANGUAGE_SOURCE;
  let is_panel_open = false;
  let hide_timer = 0;

  /**
   * 코드에 맞는 언어 정보를 찾습니다. 없으면 null입니다.
   */
  function find_language(code) {
    return root.LANGUAGES.find(function match_language(language) {
      return language.code === code;
    }) || null;
  }

  /**
   * 언어 파일이 자기 글자 묶음을 등록할 때 부릅니다.
   */
  root.add_language = function add_language(code, dictionary) {
    if (!find_language(code) || !dictionary || typeof dictionary !== "object") {
      console.error("알 수 없는 언어의 글자 묶음입니다.", code);
      return;
    }
    dictionaries[code] = dictionary;
  };

  /**
   * 문장 번역 파일이 자기 묶음을 등록할 때 부릅니다. 내용은 js/content_i18n.js가 씁니다.
   */
  root.add_content = function add_content(code, content) {
    if (!find_language(code) || !content || typeof content !== "object") {
      console.error("알 수 없는 언어의 문장 묶음입니다.", code);
      return;
    }
    contents[code] = content;
  };

  /**
   * 지금 언어 코드입니다. 예: "ko", "en".
   */
  root.get_language = function get_language() {
    return current_language;
  };

  /**
   * 지금 언어의 문장 번역 묶음입니다. 한국어이거나 받지 못했으면 null입니다.
   */
  root.get_content = function get_content() {
    return contents[current_language] || null;
  };

  /**
   * 키에 맞는 지금 언어의 글자입니다. 그 언어에 없는 키는 한국어로 보여 줍니다.
   */
  root.t = function translate(key) {
    const dictionary = dictionaries[current_language] || KO_TEXT;
    if (typeof dictionary[key] === "string") {
      return dictionary[key];
    }
    if (typeof KO_TEXT[key] === "string") {
      return KO_TEXT[key];
    }
    console.error("화면 글자 키가 없습니다.", key);
    return "";
  };

  /**
   * 요소에 키를 남기고 글자를 넣습니다. 나중에 언어를 바꾸면 이 글자도 함께 바뀝니다.
   */
  root.set_i18n_text = function set_i18n_text(element, key) {
    if (!element) {
      return;
    }
    element.dataset.i18n = key;
    element.textContent = root.t(key);
  };

  /**
   * 화면 읽기용 설명도 같은 방식으로 키를 남기고 바꿉니다.
   */
  root.set_i18n_aria = function set_i18n_aria(element, key) {
    if (!element) {
      return;
    }
    element.dataset.i18nAria = key;
    element.setAttribute("aria-label", root.t(key));
  };

  /**
   * 이 브라우저에 기억해 둔 언어입니다. 처음 방문이면 영어입니다.
   */
  function read_saved_language() {
    try {
      const saved = window.localStorage ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
      return saved && find_language(saved) ? saved : LANGUAGE_FIRST_VISIT;
    } catch (error) {
      console.error("기억해 둔 언어를 읽지 못했습니다. 영어로 보여 줍니다.", error);
      return LANGUAGE_FIRST_VISIT;
    }
  }

  /**
   * 고른 언어를 기억합니다. 다음에 열어도 같은 언어로 시작합니다.
   */
  function save_language(code) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      }
    } catch (error) {
      console.error("고른 언어를 기억하지 못했습니다. 다음에 열 때 다시 골라 주세요.", error);
    }
  }

  /**
   * 스크립트 파일 하나를 받아 실행합니다. 받은 뒤 is_registered()가 참이어야 성공입니다.
   */
  function load_script(src, is_registered) {
    return new Promise(function wait_script(resolve, reject) {
      const script = document.createElement("script");
      script.src = src;
      script.onload = function on_script_loaded() {
        if (is_registered()) {
          resolve();
          return;
        }
        reject(new Error("파일에 묶음이 없습니다: " + src));
      };
      script.onerror = function on_script_failed() {
        reject(new Error("파일을 받지 못했습니다: " + src));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * 화면 글자 파일을 한 번만 받아 옵니다. 이미 받은 언어는 바로 끝납니다.
   */
  function load_dictionary(code, language) {
    if (dictionaries[code]) {
      return Promise.resolve();
    }
    if (!pending_loads[code]) {
      const src = LANGUAGE_FOLDER + language.file + ".js?v=" + LANGUAGE_FILE_VERSION;
      pending_loads[code] = load_script(src, function has_dictionary() {
        return Boolean(dictionaries[code]);
      }).catch(function forget_failed_load(error) {
        delete pending_loads[code];
        throw error;
      });
    }
    return pending_loads[code];
  }

  /**
   * 문장 번역 파일을 한 번만 받아 옵니다.
   * 받지 못해도 화면 글자는 바꿀 수 있도록, 실패는 기록만 하고 문장은 한국어로 둡니다.
   */
  function load_content(code, language) {
    if (contents[code]) {
      return Promise.resolve();
    }
    if (!pending_content_loads[code]) {
      const src = CONTENT_FOLDER + language.file + ".js?v=" + CONTENT_FILE_VERSION;
      pending_content_loads[code] = load_script(src, function has_content() {
        return Boolean(contents[code]);
      }).catch(function keep_korean_content(error) {
        delete pending_content_loads[code];
        console.error("문장 번역을 받지 못했습니다. 문장은 한국어로 보여 줍니다.", error);
      });
    }
    return pending_content_loads[code];
  }

  /**
   * 고른 언어의 화면 글자와 문장 번역을 함께 받아 옵니다.
   */
  function load_language(code) {
    if (code === LANGUAGE_SOURCE) {
      return Promise.resolve();
    }
    const language = find_language(code);
    if (!language || !language.file) {
      return Promise.reject(new Error("알 수 없는 언어입니다: " + code));
    }
    return Promise.all([load_dictionary(code, language), load_content(code, language)]);
  }

  /**
   * 가려 둔 화면을 다시 보여 줍니다.
   */
  function reveal_page() {
    window.clearTimeout(hide_timer);
    document.documentElement.classList.remove("is_language_loading");
  }

  /**
   * 키가 붙은 모든 글자와 설명, 탭 제목을 지금 언어로 바꿉니다.
   */
  function translate_page() {
    document.querySelectorAll("[data-i18n]").forEach(function translate_text(element) {
      element.textContent = root.t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function translate_aria(element) {
      element.setAttribute("aria-label", root.t(element.dataset.i18nAria));
    });
    document.title = root.t("app_title");
  }

  /**
   * 목록에서 지금 언어에만 체크 표시를 둡니다.
   */
  function mark_current_option() {
    document.querySelectorAll(".lang_option").forEach(function mark_option(option) {
      const is_current = option.dataset.language === current_language;
      option.setAttribute("aria-pressed", is_current ? "true" : "false");
    });
  }

  /**
   * 언어를 정하고 html의 lang과 탭 제목을 바꿉니다. 글꼴과 아랍어 방향은 이 lang을 보고 CSS가 맞춥니다.
   * PC의 바깥 액자 창은 화면 준비 단계를 건너뛰므로, 탭 제목은 여기서 바로 바꿉니다.
   */
  function use_language(code) {
    current_language = code;
    document.documentElement.lang = code;
    document.title = root.t("app_title");
    try {
      if (window.name === "today_phone_frame" && window.parent !== window) {
        window.parent.document.title = document.title;
      }
    } catch (error) {
      console.error("바깥 창의 탭 제목을 바꾸지 못했습니다.", error);
    }
  }

  /**
   * 칸보다 긴 기분 이름만 글자를 조금씩 줄여 한 줄에 맞춥니다.
   * 보이지 않는 이름(다른 화면)은 재지 않고, 매번 원래 크기에서 다시 잽니다.
   */
  function fit_mood_names() {
    try {
      document.querySelectorAll(".choice_name").forEach(function fit_name(name) {
        name.style.fontSize = "";
        if (!name.offsetParent) {
          return;
        }
        let font_px = parseFloat(window.getComputedStyle(name).fontSize);
        while (name.scrollWidth > name.clientWidth + 0.5 && font_px > MOOD_NAME_MIN_PX) {
          font_px -= MOOD_NAME_STEP_PX;
          name.style.fontSize = font_px + "px";
        }
      });
    } catch (error) {
      console.error("기분 이름 크기를 맞추지 못했습니다.", error);
    }
  }

  /**
   * 정한 언어를 화면 전체에 칠합니다.
   * 카드 문장과 타로 그림은 신호를 받은 쪽(js/content_i18n.js, js/tarot.js)이 다시 그립니다.
   */
  function paint_language() {
    try {
      translate_page();
      mark_current_option();
      fit_mood_names();
      document.dispatchEvent(new CustomEvent("today_word_language_change", { detail: { language: current_language } }));
    } catch (error) {
      console.error("화면 글자를 바꾸지 못했습니다. 페이지를 새로고침해 주세요.", error);
    } finally {
      reveal_page();
    }
  }

  /**
   * 언어 목록 아래에 안내를 적거나 지웁니다.
   */
  function show_language_message(message) {
    const message_element = document.getElementById("lang_message");
    if (!message_element) {
      return;
    }
    message_element.hidden = !message;
    message_element.textContent = message || "";
  }

  /**
   * 언어 목록을 열거나 닫습니다. 열 때는 지금 언어가 목록 안에 보이게 맞춥니다.
   */
  function set_panel_open(next_open) {
    const toggle = document.getElementById("lang_toggle");
    const panel = document.getElementById("lang_panel");
    const list = document.getElementById("lang_list");
    if (!toggle || !panel || !list) {
      return;
    }
    is_panel_open = next_open;
    toggle.setAttribute("aria-expanded", next_open ? "true" : "false");
    panel.hidden = !next_open;
    if (!next_open) {
      show_language_message("");
      return;
    }
    const current = list.querySelector('.lang_option[aria-pressed="true"]');
    if (current) {
      list.scrollTop = Math.max(0, current.offsetTop - (list.clientHeight - current.offsetHeight) / 2);
    }
  }

  /**
   * 목록에서 고른 언어로 바꿉니다. 파일을 받지 못하면 지금 언어를 그대로 두고 안내합니다.
   */
  function choose_language(code) {
    show_language_message("");
    if (code === current_language) {
      set_panel_open(false);
      return;
    }
    load_language(code)
      .then(function apply_chosen_language() {
        save_language(code);
        use_language(code);
        paint_language();
        set_panel_open(false);
      })
      .catch(function on_choose_failed(error) {
        console.error("고른 언어를 불러오지 못했습니다.", code, error);
        show_language_message(root.t("lang_load_failed"));
      });
  }

  /**
   * 언어 목록의 버튼을 만듭니다. 각 버튼은 자기 언어의 글꼴로 그리고, 줄은 모두 왼쪽에 맞춥니다.
   */
  function build_language_list(list) {
    root.LANGUAGES.forEach(function add_option(language) {
      const item = document.createElement("li");
      const option = document.createElement("button");
      option.type = "button";
      option.className = "lang_option";
      option.lang = language.code;
      option.dataset.language = language.code;
      option.textContent = language.name;
      option.setAttribute("aria-pressed", "false");
      option.addEventListener("click", function on_option_click() {
        choose_language(language.code);
      });
      item.appendChild(option);
      list.appendChild(item);
    });
  }

  /**
   * 지구본 버튼과 목록을 연결합니다.
   * 바깥을 누르거나 Esc를 누르거나 화면을 바꾸면 닫힙니다. 음악 목록이 열리면 이 목록은 닫힙니다.
   */
  function bind_language_menu() {
    try {
      const box = document.getElementById("lang_box");
      const toggle = document.getElementById("lang_toggle");
      const list = document.getElementById("lang_list");
      if (!box || !toggle || !list) {
        console.error("언어 선택 버튼을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
        return;
      }
      build_language_list(list);
      mark_current_option();
      toggle.addEventListener("click", function on_toggle_click() {
        set_panel_open(!is_panel_open);
      });
      document.addEventListener("click", function on_outside_click(event) {
        if (is_panel_open && !box.contains(event.target)) {
          set_panel_open(false);
        }
      });
      document.addEventListener("keydown", function on_escape(event) {
        if (event.key === "Escape" && is_panel_open) {
          set_panel_open(false);
          toggle.focus();
        }
      });
      document.addEventListener("today_word_design_change", function on_design_change() {
        set_panel_open(false);
        window.requestAnimationFrame(fit_mood_names);
      });
      window.addEventListener("resize", function on_resize_fit() {
        window.requestAnimationFrame(fit_mood_names);
      });
      // 글꼴 파일이 늦게 도착하면 글자 폭이 바뀌므로 한 번 더 맞춥니다.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(fit_mood_names);
      }
      document.addEventListener("today_word_open_music_list", function on_music_list() {
        set_panel_open(false);
      });
    } catch (error) {
      console.error("언어 선택을 준비하지 못했습니다. 페이지를 새로고침해 주세요.", error);
    }
  }

  /**
   * 기억해 둔 언어를 먼저 받아 두고, 화면이 준비되면 그 언어로 칠합니다.
   * 한국어가 아니면 받는 동안 화면을 잠시 가립니다.
   */
  function start_i18n() {
    const saved_language = read_saved_language();
    let language_ready = Promise.resolve();
    if (saved_language !== LANGUAGE_SOURCE) {
      document.documentElement.classList.add("is_language_loading");
      hide_timer = window.setTimeout(reveal_page, LANGUAGE_HIDE_MAX_MS);
      language_ready = load_language(saved_language)
        .then(function use_saved_language() {
          use_language(saved_language);
        })
        .catch(function on_saved_failed(error) {
          console.error("기억해 둔 언어를 불러오지 못했습니다. 한국어로 보여 줍니다.", error);
        });
    }
    const on_ready = function on_page_ready() {
      bind_language_menu();
      language_ready.then(paint_language);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", on_ready);
    } else {
      on_ready();
    }
  }

  start_i18n();
})();

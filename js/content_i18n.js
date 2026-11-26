/**
 * 오로라 문장, 격언, 타로 글을 고른 언어로 보여 줍니다.
 * 문장을 고르는 일(picker.js, face_read.js)은 한국어 원문 그대로 하고,
 * 화면에 글자를 넣는 순간에만 같은 순서의 번역문으로 바꿉니다.
 * 번역 파일(js/i18n/content/*.js)은 한국어 데이터와 순서가 같은 목록입니다.
 *
 * 타로 카드 이름은 그림 속 글자라서, 이름을 지운 그림(images/tarot/clean/) 위에
 * 번역 이름을 캔버스로 그려 새 그림을 만듭니다. 한국어는 원래 그림을 그대로 씁니다.
 */
(function init_content_i18n() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  const TAROT_FACE_VERSION = "20261115q";
  const TAROT_CLEAN_FOLDER = "images/tarot/clean/";
  const TAROT_CLEAN_VERSION = "20261127a";
  // 그림 원본 크기(864×1152) 기준의 이름 글자 범위입니다.
  const TAROT_NAME_MAX_WIDTH = 640;
  const TAROT_NAME_MAX_PX = 80;
  const TAROT_NAME_MIN_PX = 36;
  // 로마자처럼 위아래가 낮은 글자는 한글 이름과 같은 높이로 보이도록 조금 크게 그립니다.
  const TAROT_NAME_LATIN_SCALE = 1.15;
  // 아랍 글자는 같은 크기에서도 가늘고 작아 보여서 더 크고 굵게 그립니다.
  const TAROT_NAME_ARABIC_SCALE = 1.35;
  const TAROT_NAME_WEIGHT = "500";
  const TAROT_NAME_ARABIC_WEIGHT = "700";
  const TAROT_NAME_COLOR_TOP = "#f6d9a4";
  const TAROT_NAME_COLOR_BOTTOM = "#d8a660";
  const TAROT_FACE_QUALITY = 0.9;

  // 언어마다 한 번 만든 "한국어 원문 → 번역문" 사전입니다.
  const text_maps = {};
  // 언어마다 만든 타로 그림 주소입니다. { en: { 0: "blob:..." } }
  const tarot_faces = {};
  const pending_faces = {};

  /**
   * 한국어 목록과 번역 목록을 같은 순서로 짝지어 사전에 넣습니다.
   * 번역이 빈칸이면 넣지 않아, 그 문장은 한국어로 보입니다.
   */
  function pair_into(map, korean_list, translated_list) {
    if (!Array.isArray(korean_list) || !Array.isArray(translated_list)) {
      return;
    }
    korean_list.forEach(function add_pair(korean, index) {
      const translated = translated_list[index];
      if (typeof korean === "string" && korean && typeof translated === "string" && translated) {
        map.set(korean, translated);
      }
    });
  }

  /**
   * 오로라 문장(밤의 한 줄, 사색의 결)을 사전에 넣습니다.
   */
  function add_phrases(map, phrases) {
    const korean_phrases = root.PHRASES || {};
    Object.keys(korean_phrases).forEach(function add_mood(mood_id) {
      const korean_list = korean_phrases[mood_id];
      const translated_list = phrases && Array.isArray(phrases[mood_id]) ? phrases[mood_id] : [];
      korean_list.forEach(function add_phrase(phrase, index) {
        const pair = translated_list[index] || [];
        pair_into(map, [phrase.lead, phrase.caution], pair);
      });
    });
  }

  /**
   * 격언 분류 이름, 격언, 인물 이름을 사전에 넣습니다.
   */
  function add_wise_quotes(map, categories, quotes) {
    const korean_quotes = root.WISE_QUOTES || {};
    const korean_categories = Object.keys(korean_quotes);
    pair_into(map, korean_categories, categories);
    korean_categories.forEach(function add_category(category, category_index) {
      const translated_list = Array.isArray(quotes) && Array.isArray(quotes[category_index]) ? quotes[category_index] : [];
      korean_quotes[category].forEach(function add_quote(quote, index) {
        const pair = translated_list[index] || [];
        pair_into(map, [quote.text, quote.person], pair);
      });
    });
  }

  /**
   * 타로 카드의 이름, 한 줄, 질문을 사전에 넣습니다.
   */
  function add_tarot(map, tarot) {
    const korean_cards = Array.isArray(root.TAROT_CARDS) ? root.TAROT_CARDS : [];
    korean_cards.forEach(function add_card(card, index) {
      const row = Array.isArray(tarot) ? tarot[index] || [] : [];
      pair_into(map, [card.name, card.insight, card.question], row);
    });
  }

  /**
   * 지금 언어의 사전을 꺼냅니다. 처음 부를 때 한 번만 만듭니다.
   */
  function get_text_map() {
    const language = typeof root.get_language === "function" ? root.get_language() : "ko";
    const content = typeof root.get_content === "function" ? root.get_content() : null;
    if (language === "ko" || !content) {
      return null;
    }
    // 한국어 데이터가 아직 없으면 빈 사전이 굳지 않도록 만들지 않습니다.
    if (!root.PHRASES || !root.WISE_QUOTES || !root.TAROT_CARDS) {
      return null;
    }
    if (!text_maps[language]) {
      try {
        const map = new Map();
        add_phrases(map, content.phrases);
        add_wise_quotes(map, content.wise_categories, content.wise_quotes);
        add_tarot(map, content.tarot);
        text_maps[language] = map;
      } catch (error) {
        console.error("문장 번역 사전을 만들지 못했습니다. 문장은 한국어로 보여 줍니다.", error);
        return null;
      }
    }
    return text_maps[language];
  }

  /**
   * 한국어 원문에 맞는 지금 언어의 문장입니다. 번역이 없으면 원문을 돌려줍니다.
   */
  root.tc = function translate_content(korean_text) {
    if (typeof korean_text !== "string" || !korean_text) {
      return "";
    }
    const map = get_text_map();
    return (map && map.get(korean_text)) || korean_text;
  };

  /**
   * 요소에 한국어 원문을 남기고, 지금 언어의 문장을 넣습니다.
   * 원문이 남아 있어서 나중에 언어를 바꾸면 이 칸도 함께 바뀝니다.
   */
  root.set_content_text = function set_content_text(element, korean_text) {
    if (!element) {
      return;
    }
    if (typeof korean_text !== "string" || !korean_text) {
      delete element.dataset.contentKo;
      element.textContent = "";
      return;
    }
    element.dataset.contentKo = korean_text;
    element.textContent = root.tc(korean_text);
  };

  /**
   * 원문이 남아 있는 모든 칸을 지금 언어로 다시 씁니다.
   */
  function retranslate_page() {
    try {
      document.querySelectorAll("[data-content-ko]").forEach(function retranslate(element) {
        element.textContent = root.tc(element.dataset.contentKo);
      });
    } catch (error) {
      console.error("카드 문장을 새 언어로 바꾸지 못했습니다. 문장을 다시 뽑아 주세요.", error);
    }
  }

  /**
   * 한국어 타로 그림 주소입니다. 이름이 그림에 그려져 있습니다.
   */
  function korean_face_src(card) {
    return (root.TAROT_FOLDER || "images/tarot/") + card.file + "?v=" + TAROT_FACE_VERSION;
  }

  /**
   * 그림 한 장을 받아 둡니다.
   */
  function load_image(src) {
    return new Promise(function wait_image(resolve, reject) {
      const image = new Image();
      image.onload = function on_image_loaded() {
        resolve(image);
      };
      image.onerror = function on_image_failed() {
        reject(new Error("그림을 받지 못했습니다: " + src));
      };
      image.src = src;
    });
  }

  /**
   * 지금 언어의 제목 글꼴입니다. 일본어, 중국어는 language.css가 바꿔 둔 값을 씁니다.
   */
  function name_font_family() {
    const family = window.getComputedStyle(document.documentElement).getPropertyValue("--font_serif");
    return family && family.trim() ? family.trim() : "serif";
  }

  /**
   * 이름이 한 줄에 들어가도록 글자 크기를 정합니다. 원래 한국어 이름 높이를 기준으로 삼습니다.
   */
  function fit_name_size(view, name, family, start_px, weight) {
    let font_px = Math.min(TAROT_NAME_MAX_PX, Math.max(TAROT_NAME_MIN_PX, start_px));
    view.font = weight + " " + font_px + "px " + family;
    while (view.measureText(name).width > TAROT_NAME_MAX_WIDTH && font_px > TAROT_NAME_MIN_PX) {
      font_px -= 2;
      view.font = weight + " " + font_px + "px " + family;
    }
    return font_px;
  }

  /**
   * 글자 모양에 따라 이름을 얼마나 크게, 얼마나 굵게 그릴지 정합니다.
   * 일본어, 중국어는 한글처럼 네모난 글자라 원래 높이 그대로 씁니다.
   */
  function name_style(language) {
    if (/^(ja|zh)/.test(language)) {
      return { scale: 1, weight: TAROT_NAME_WEIGHT };
    }
    if (language === "ar") {
      return { scale: TAROT_NAME_ARABIC_SCALE, weight: TAROT_NAME_ARABIC_WEIGHT };
    }
    return { scale: TAROT_NAME_LATIN_SCALE, weight: TAROT_NAME_WEIGHT };
  }

  /**
   * 이름을 지운 그림 위에 번역 이름을 금색으로 그립니다.
   * 원래 그림의 글자처럼 아래로 갈수록 짙어지는 금색에, 살짝 번지는 빛을 더합니다.
   */
  function draw_tarot_name(view, card, name, language) {
    const layout = card.name_layout || { x: 432, y: 210, height: 72 };
    const family = name_font_family();
    const style = name_style(language);
    const font_px = fit_name_size(view, name, family, layout.height * style.scale, style.weight);
    const gradient = view.createLinearGradient(0, layout.y - font_px / 2, 0, layout.y + font_px / 2);
    gradient.addColorStop(0, TAROT_NAME_COLOR_TOP);
    gradient.addColorStop(1, TAROT_NAME_COLOR_BOTTOM);
    view.textAlign = "center";
    view.textBaseline = "middle";
    view.direction = language === "ar" ? "rtl" : "ltr";
    view.save();
    view.shadowColor = "rgba(255, 196, 110, 0.45)";
    view.shadowBlur = 18;
    view.fillStyle = gradient;
    view.fillText(name, layout.x, layout.y);
    view.restore();
    view.save();
    view.shadowColor = "rgba(0, 0, 0, 0.5)";
    view.shadowBlur = 6;
    view.shadowOffsetY = 2;
    view.fillStyle = gradient;
    view.fillText(name, layout.x, layout.y);
    view.restore();
  }

  /**
   * 캔버스를 jpg 주소로 바꿉니다.
   */
  function canvas_to_url(canvas) {
    return new Promise(function wait_blob(resolve, reject) {
      canvas.toBlob(function on_blob(blob) {
        if (!blob) {
          reject(new Error("타로 그림을 만들지 못했습니다."));
          return;
        }
        resolve(URL.createObjectURL(blob));
      }, "image/jpeg", TAROT_FACE_QUALITY);
    });
  }

  /**
   * 번역 이름이 들어간 타로 그림을 만들어 둡니다. 이미 만든 카드는 바로 돌려줍니다.
   * 한국어이거나 번역 이름이 없으면 원래 그림 주소를 돌려줍니다.
   */
  root.prepare_tarot_face = function prepare_tarot_face(card) {
    if (!card || !card.file) {
      return Promise.reject(new Error("타로 카드가 비어 있습니다."));
    }
    const language = typeof root.get_language === "function" ? root.get_language() : "ko";
    const name = root.tc(card.name);
    if (language === "ko" || !name || name === card.name) {
      return Promise.resolve(korean_face_src(card));
    }
    const faces = tarot_faces[language] || (tarot_faces[language] = {});
    if (faces[card.id]) {
      return Promise.resolve(faces[card.id]);
    }
    const pending_key = language + "|" + card.id;
    if (pending_faces[pending_key]) {
      return pending_faces[pending_key];
    }
    const family = name_font_family();
    const font_ready = document.fonts && document.fonts.load
      ? document.fonts.load(name_style(language).weight + " 72px " + family, name).catch(function ignore_font_error() {
        return null;
      })
      : Promise.resolve();
    pending_faces[pending_key] = Promise.all([
      load_image(TAROT_CLEAN_FOLDER + card.file + "?v=" + TAROT_CLEAN_VERSION),
      font_ready,
    ]).then(function compose_face(results) {
      const image = results[0];
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const view = canvas.getContext("2d");
      if (!view) {
        throw new Error("타로 그림을 그릴 캔버스를 열지 못했습니다.");
      }
      view.drawImage(image, 0, 0);
      draw_tarot_name(view, card, name, language);
      return canvas_to_url(canvas);
    }).then(function remember_face(url) {
      faces[card.id] = url;
      return url;
    }).catch(function use_korean_face(error) {
      console.error("번역 이름이 들어간 타로 그림을 만들지 못했습니다. 한국어 그림을 보여 줍니다.", error);
      return korean_face_src(card);
    }).finally(function forget_pending() {
      delete pending_faces[pending_key];
    });
    return pending_faces[pending_key];
  };

  /**
   * 지금 바로 쓸 수 있는 타로 그림 주소입니다.
   * 번역 그림을 아직 만들지 못했으면 null을 돌려주니, prepare_tarot_face로 기다려야 합니다.
   */
  root.ready_tarot_face = function ready_tarot_face(card) {
    if (!card || !card.file) {
      return null;
    }
    const language = typeof root.get_language === "function" ? root.get_language() : "ko";
    const name = root.tc(card.name);
    if (language === "ko" || !name || name === card.name) {
      return korean_face_src(card);
    }
    const faces = tarot_faces[language];
    return faces && faces[card.id] ? faces[card.id] : null;
  };

  document.addEventListener("today_word_language_change", retranslate_page);
})();

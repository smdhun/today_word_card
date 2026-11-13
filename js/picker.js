/**
 * 오늘 날짜와 고른 기분으로 문장 덱에서 카드 한 장을 고릅니다.
 * 같은 날, 같은 기분, 같은 순번이면 항상 같은 문장이 나옵니다.
 * 덱은 하루에 한 번 섞어 두고 차례로 넘기므로, 한 바퀴를 도는 동안은 문장이 겹치지 않습니다.
 * 그림은 기분마다 15장이라, 15번까지는 겹치지 않고 그다음부터 다시 돌아옵니다.
 */
(function init_picker() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 문자열을 항상 같은 숫자로 바꿉니다.
   * 날짜와 기분을 주사위 눈금처럼 고정하는 역할입니다.
   */
  function hash_string(value) {
    try {
      const text = String(value);
      let hash = 2166136261;
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    } catch (error) {
      console.error("문장 번호를 계산하지 못했습니다.", error);
      return 0;
    }
  }

  /**
   * 씨앗 숫자 하나로 0 이상 1 미만의 수를 차례로 만들어 주는 주사위입니다.
   * 씨앗이 같으면 나오는 수의 순서도 항상 같습니다.
   */
  function create_seeded_random(seed) {
    let state = seed >>> 0;
    return function next_random() {
      state = (state + 0x6d2b79f5) >>> 0;
      let mixed = state;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * 덱을 섞은 순서표를 만듭니다. [3, 0, 2, 1]처럼 문장 번호가 한 번씩만 들어 있습니다.
   * 맨 뒤 카드부터 한 장씩, 앞쪽의 아무 카드와 자리를 바꾸는 방식입니다.
   */
  function build_deck_order(seed_key, deck_size) {
    try {
      const order = [];
      for (let index = 0; index < deck_size; index += 1) {
        order.push(index);
      }

      const next_random = create_seeded_random(hash_string(seed_key));
      for (let last_index = deck_size - 1; last_index > 0; last_index -= 1) {
        const swap_index = Math.floor(next_random() * (last_index + 1));
        const kept_value = order[last_index];
        order[last_index] = order[swap_index];
        order[swap_index] = kept_value;
      }
      return order;
    } catch (error) {
      console.error("덱의 순서를 정하지 못했습니다.", error);
      return [];
    }
  }

  /**
   * 섞어 둔 덱에서 순번에 해당하는 한 장을 꺼냅니다.
   * 순번이 덱 크기를 넘으면 첫 장으로 돌아갑니다.
   */
  function pick_from_deck(deck, seed_key, offset) {
    try {
      if (!Array.isArray(deck) || deck.length === 0) {
        return null;
      }
      const order = build_deck_order(seed_key, deck.length);
      if (order.length !== deck.length) {
        return null;
      }
      return deck[order[offset % deck.length]];
    } catch (error) {
      console.error("덱에서 한 장을 꺼내지 못했습니다.", error);
      return null;
    }
  }

  /**
   * 한국 시간 기준의 오늘 날짜를 2026-11-13 모양으로 만듭니다.
   */
  root.get_today_key = function get_today_key() {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch (error) {
      console.error("오늘 날짜를 만들지 못했습니다.", error);
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return now.getFullYear() + "-" + month + "-" + day;
    }
  };

  /**
   * 카드에 보여줄 한국어 날짜를 만듭니다.
   */
  root.get_today_label = function get_today_label() {
    try {
      return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(new Date());
    } catch (error) {
      console.error("날짜 표시를 만들지 못했습니다.", error);
      return root.get_today_key();
    }
  };

  /**
   * id가 같은 항목을 목록에서 찾습니다.
   */
  function find_by_id(list, id) {
    try {
      if (!Array.isArray(list)) {
        return null;
      }
      return list.find(function match_id(item) {
        return item && item.id === id;
      }) || null;
    } catch (error) {
      console.error("목록에서 항목을 찾지 못했습니다.", error);
      return null;
    }
  }

  /**
   * 기분에 맞는 문장 목록을 꺼냅니다. 없으면 빈 목록을 돌려줍니다.
   */
  function get_phrase_list(mood) {
    try {
      const phrase_list = root.PHRASES ? root.PHRASES[mood] : null;
      return Array.isArray(phrase_list) ? phrase_list : [];
    } catch (error) {
      console.error("문장 목록을 꺼내지 못했습니다.", error);
      return [];
    }
  }

  /**
   * 기분에 맞는 속담 목록을 꺼냅니다. 없으면 빈 목록을 돌려줍니다.
   */
  function get_proverb_list(mood) {
    try {
      const proverb_list = root.PROVERBS ? root.PROVERBS[mood] : null;
      return Array.isArray(proverb_list) ? proverb_list : [];
    } catch (error) {
      console.error("속담 목록을 꺼내지 못했습니다.", error);
      return [];
    }
  }

  /**
   * 영화 문장 목록을 꺼냅니다. 없으면 빈 목록을 돌려줍니다.
   */
  function get_movie_quote_list() {
    try {
      return Array.isArray(root.MOVIE_QUOTES) ? root.MOVIE_QUOTES : [];
    } catch (error) {
      console.error("영화 문장 목록을 꺼내지 못했습니다.", error);
      return [];
    }
  }

  /**
   * 기분에 맞는 그림 목록을 꺼냅니다. 없으면 빈 목록을 돌려줍니다.
   */
  function get_vignette_list(mood) {
    try {
      const vignette_list = root.VIGNETTES ? root.VIGNETTES[mood] : null;
      return Array.isArray(vignette_list) ? vignette_list : [];
    } catch (error) {
      console.error("그림 목록을 꺼내지 못했습니다.", error);
      return [];
    }
  }

  /**
   * 기분에 맞는 그림 한 장을 고릅니다.
   * 그림은 덤이라서, 고르지 못하면 null을 돌려주고 카드는 그대로 만듭니다.
   */
  function pick_vignette(mood, seed_key, offset) {
    try {
      const vignette = pick_from_deck(get_vignette_list(mood), seed_key, offset);
      if (!vignette || !vignette.file || !vignette.caption) {
        return null;
      }
      return {
        src: (root.VIGNETTE_FOLDER || "") + vignette.file,
        caption: vignette.caption,
      };
    } catch (error) {
      console.error("그림을 고르지 못했습니다.", error);
      return null;
    }
  }

  /**
   * 문장 두 칸이 비어 있지 않은지 확인합니다.
   */
  function is_phrase_ready(phrase) {
    return Boolean(phrase && phrase.lead && phrase.caution);
  }

  /**
   * 고른 기분과 순번으로 카드 한 장을 만듭니다.
   * offset이 0이면 그 날의 첫 장이고, 1씩 늘리면 섞어 둔 덱의 다음 장이 나옵니다.
   */
  root.pick_today_phrase = function pick_today_phrase(input, offset) {
    try {
      const safe_input = input || {};
      const mood = find_by_id(root.MOODS, safe_input.mood);
      const phrase_list = get_phrase_list(safe_input.mood);

      if (!mood || phrase_list.length === 0) {
        console.error("카드를 만들 재료가 부족합니다.");
        return null;
      }

      const safe_offset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
      const date_key = root.get_today_key();

      // 덱을 섞는 기준은 날짜와 기분입니다. 같은 날 같은 기분이면 누구에게나 같은 순서로 나옵니다.
      const phrase_seed_key = [date_key, mood.id, "phrase"].join("|");
      const phrase = pick_from_deck(phrase_list, phrase_seed_key, safe_offset);

      if (!is_phrase_ready(phrase)) {
        console.error("고른 문장의 모양이 올바르지 않습니다.", safe_offset);
        return null;
      }

      // 속담은 덤이므로, 고르지 못해도 카드는 그대로 만듭니다.
      const proverb_seed_key = [date_key, mood.id, "proverb"].join("|");
      const proverb = pick_from_deck(get_proverb_list(mood.id), proverb_seed_key, safe_offset);

      // 그림은 문장과 같은 순번으로 넘깁니다. 15장까지는 겹치지 않습니다.
      const vignette_seed_key = [date_key, mood.id, "vignette"].join("|");
      const vignette = pick_vignette(mood.id, vignette_seed_key, safe_offset);

      // 영화 문장도 같은 순번으로 넘깁니다. 299장이라 한참 동안 같은 문장이 나오지 않습니다.
      const movie_seed_key = [date_key, mood.id, "movie"].join("|");
      const movie_quote = pick_from_deck(get_movie_quote_list(), movie_seed_key, safe_offset);
      const is_movie_quote_ready = Boolean(
        movie_quote && movie_quote.text && movie_quote.movie && Number.isInteger(movie_quote.year)
      );

      return {
        date_key: date_key,
        date_label: root.get_today_label(),
        mood: mood,
        lead_text: phrase.lead,
        caution_text: phrase.caution,
        proverb_text: typeof proverb === "string" ? proverb : "",
        movie_quote: is_movie_quote_ready ? movie_quote : null,
        vignette: vignette,
        offset: safe_offset,
      };
    } catch (error) {
      console.error("오늘의 문장을 고르지 못했습니다.", error);
      return null;
    }
  };
})();

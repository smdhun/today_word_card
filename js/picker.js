/**
 * 오늘 날짜와 입력으로 문장 덱에서 카드 한 장을 고릅니다.
 * 같은 날, 같은 입력, 같은 순번이면 항상 같은 문장이 나옵니다.
 */
(function init_picker() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 문자열을 항상 같은 숫자로 바꿉니다.
   * 날짜와 입력을 주사위 눈금처럼 고정하는 역할입니다.
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
   * 나이 숫자로 말투 구간을 찾습니다.
   */
  root.get_age_band = function get_age_band(age) {
    try {
      if (!Array.isArray(root.AGE_BANDS)) {
        return null;
      }
      const age_band = root.AGE_BANDS.find(function find_band(band) {
        return age >= band.min_age && age <= band.max_age;
      });
      return age_band || null;
    } catch (error) {
      console.error("나이 구간을 정하지 못했습니다.", error);
      return null;
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
   * 기분과 나이에 맞는 문장 목록을 꺼냅니다.
   * 어린이 문장이 없으면 일반 문장으로 대신합니다.
   */
  function get_phrase_list(mood, age_band_id) {
    try {
      const mood_group = root.PHRASES ? root.PHRASES[mood] : null;
      if (!mood_group) {
        return [];
      }

      const deck_name = age_band_id === "child" ? "child" : "general";
      const phrase_list = mood_group[deck_name];
      if (Array.isArray(phrase_list) && phrase_list.length > 0) {
        return phrase_list;
      }

      return Array.isArray(mood_group.general) ? mood_group.general : [];
    } catch (error) {
      console.error("문장 목록을 꺼내지 못했습니다.", error);
      return [];
    }
  }

  /**
   * 문장 두 칸이 비어 있지 않은지 확인합니다.
   */
  function is_phrase_ready(phrase) {
    return Boolean(phrase && phrase.lead && phrase.caution);
  }

  /**
   * 입력과 순번으로 카드 한 장을 만듭니다.
   * offset이 0이면 그 날의 기본 문장입니다.
   */
  root.pick_today_phrase = function pick_today_phrase(input, offset) {
    try {
      const safe_input = input || {};
      const age_band = root.get_age_band(safe_input.age);
      const mood = find_by_id(root.MOODS, safe_input.mood);
      const gender = find_by_id(root.GENDERS, safe_input.gender);
      const phrase_list = get_phrase_list(safe_input.mood, age_band ? age_band.id : "");

      if (!age_band || !mood || !gender || phrase_list.length === 0) {
        console.error("카드를 만들 재료가 부족합니다.");
        return null;
      }

      const safe_offset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
      const date_key = root.get_today_key();
      // 성별은 카드 색만 바꾸므로 문장 번호에는 넣지 않습니다.
      const seed_key = [
        date_key,
        age_band.id,
        mood.id,
        String(safe_offset),
      ].join("|");
      const phrase_index = hash_string(seed_key) % phrase_list.length;
      const phrase = phrase_list[phrase_index];

      if (!is_phrase_ready(phrase)) {
        console.error("고른 문장의 모양이 올바르지 않습니다.", phrase_index);
        return null;
      }

      const age_voice = root.AGE_VOICES[age_band.id] || "오늘";
      const lead_text = age_voice + ", " + phrase.lead;

      return {
        date_key: date_key,
        date_label: root.get_today_label(),
        age_band: age_band,
        mood: mood,
        gender: gender,
        lead_text: lead_text,
        caution_text: phrase.caution,
        full_text: lead_text + " " + phrase.caution,
        offset: safe_offset,
      };
    } catch (error) {
      console.error("오늘의 문장을 고르지 못했습니다.", error);
      return null;
    }
  };

  /**
   * 직전 문장과 겹치지 않는 다음 카드를 찾습니다.
   * 다른 문장 보기를 눌러도 같은 글이 반복되지 않게 합니다.
   */
  root.pick_another_phrase = function pick_another_phrase(input, offset, previous_text) {
    try {
      const age_band = root.get_age_band(input ? input.age : null);
      const phrase_list = get_phrase_list(
        input ? input.mood : "",
        age_band ? age_band.id : ""
      );
      const total = phrase_list.length || 1;
      let next_offset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

      for (let try_count = 0; try_count < total; try_count += 1) {
        const card = root.pick_today_phrase(input, next_offset);
        if (!card) {
          return null;
        }
        if (!previous_text || card.full_text !== previous_text) {
          return card;
        }
        next_offset += 1;
      }

      return root.pick_today_phrase(input, next_offset);
    } catch (error) {
      console.error("다른 문장을 고르지 못했습니다.", error);
      return null;
    }
  };
})();

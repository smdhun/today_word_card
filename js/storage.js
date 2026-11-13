/**
 * 오늘 입력과 카드 순번을 브라우저에 기억합니다.
 * 같은 날 다시 열면 같은 카드가 보이도록 하기 위한 서랍입니다.
 */
(function init_storage() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 저장할 값이 기대한 모양인지 확인합니다.
   */
  function is_state_ready(state) {
    if (!state || typeof state !== "object") {
      return false;
    }
    return (
      state.version === root.STORAGE_VERSION &&
      typeof state.age_text === "string" &&
      typeof state.gender === "string" &&
      typeof state.mood === "string" &&
      Number.isInteger(state.offset) &&
      typeof state.date_key === "string"
    );
  }

  /**
   * 기억해 둔 입력을 꺼냅니다. 없거나 깨져 있으면 null을 돌려줍니다.
   */
  root.load_card_state = function load_card_state() {
    try {
      if (!window.localStorage) {
        return null;
      }
      const raw_text = window.localStorage.getItem(root.STORAGE_KEY);
      if (!raw_text) {
        return null;
      }
      const parsed = JSON.parse(raw_text);
      if (!is_state_ready(parsed)) {
        console.error("저장된 카드의 모양이 달라 사용하지 않습니다.");
        return null;
      }
      return parsed;
    } catch (error) {
      console.error("저장된 카드를 읽지 못했습니다.", error);
      return null;
    }
  };

  /**
   * 입력과 순번을 저장합니다. 성공하면 true를 돌려줍니다.
   */
  root.save_card_state = function save_card_state(state) {
    try {
      if (!window.localStorage || !is_state_ready(state)) {
        return false;
      }
      window.localStorage.setItem(root.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("카드를 기억해 두지 못했습니다.", error);
      return false;
    }
  };
})();

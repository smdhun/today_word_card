/**
 * 사용자가 고른 값이 카드를 만들어도 되는 모양인지 확인합니다.
 * 통과하면 기분 id를 돌려줍니다.
 */
(function init_validate() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 목록 안에 같은 id가 있는지 확인합니다.
   */
  function is_known_id(list, id) {
    try {
      if (!Array.isArray(list)) {
        return false;
      }
      return list.some((item) => item && item.id === id);
    } catch (error) {
      console.error("입력 값이 목록에 있는지 확인하지 못했습니다.", error);
      return false;
    }
  }

  /**
   * 기분을 골랐는지 검사합니다.
   * 실패하면 사용자에게 보여줄 문장과 다시 손댈 입력칸 id를 함께 돌려줍니다.
   */
  root.validate_input = function validate_input(input) {
    try {
      const source = input || {};
      const mood = String(source.mood || "");

      if (!is_known_id(root.MOODS, mood)) {
        return {
          is_valid: false,
          message: root.MESSAGES.mood_required,
          focus_id: "mood_joy",
        };
      }

      return {
        is_valid: true,
        mood: mood,
      };
    } catch (error) {
      console.error("입력을 검사하지 못했습니다.", error);
      return {
        is_valid: false,
        message: root.MESSAGES.draw_failed,
        focus_id: "mood_joy",
      };
    }
  };
})();

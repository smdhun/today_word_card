/**
 * 사용자가 고른 값이 카드를 만들어도 되는 모양인지 확인합니다.
 * 통과하면 나이 숫자와 성별, 기분 id를 돌려줍니다.
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
   * 나이, 성별, 기분을 검사합니다.
   * 실패하면 사용자에게 보여줄 문장과 다시 손댈 입력칸 id를 함께 돌려줍니다.
   */
  root.validate_input = function validate_input(input) {
    try {
      const source = input || {};
      const age_text = String(source.age_text || "").trim();
      const gender = String(source.gender || "");
      const mood = String(source.mood || "");

      if (!age_text) {
        return {
          is_valid: false,
          message: root.MESSAGES.age_required,
          focus_id: "age_input",
        };
      }

      // 1e2 같은 숫자 표기나 소수점은 나이로 받지 않습니다.
      if (!/^\d{1,3}$/.test(age_text)) {
        return {
          is_valid: false,
          message: root.MESSAGES.age_range,
          focus_id: "age_input",
        };
      }

      const age = Number(age_text);
      if (!Number.isInteger(age) || age < root.AGE_MIN || age > root.AGE_MAX) {
        return {
          is_valid: false,
          message: root.MESSAGES.age_range,
          focus_id: "age_input",
        };
      }

      if (!is_known_id(root.GENDERS, gender)) {
        return {
          is_valid: false,
          message: root.MESSAGES.gender_required,
          focus_id: "gender_female",
        };
      }

      if (!is_known_id(root.MOODS, mood)) {
        return {
          is_valid: false,
          message: root.MESSAGES.mood_required,
          focus_id: "mood_joy",
        };
      }

      return {
        is_valid: true,
        age: age,
        age_text: age_text,
        gender: gender,
        mood: mood,
      };
    } catch (error) {
      console.error("입력을 검사하지 못했습니다.", error);
      return {
        is_valid: false,
        message: root.MESSAGES.draw_failed,
        focus_id: "age_input",
      };
    }
  };
})();

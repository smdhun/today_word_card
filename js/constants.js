/**
 * 화면과 문장 선택이 함께 쓰는 고정 값입니다.
 * 기분 버튼의 value는 MOODS 목록의 id와 같아야 합니다.
 */
(function init_constants() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  // 고를 수 있는 기분. 문장 덱과 속담 덱도 이 id로 나뉘어 있습니다.
  // label은 읽을 때마다 지금 언어의 이름을 js/i18n.js에서 가져옵니다.
  root.MOODS = ["joy", "calm", "excited", "anxious", "tired", "sad"].map(function make_mood(id) {
    return {
      id: id,
      get label() {
        return root.t("mood_" + id);
      },
    };
  });

  // 고른 기분이 없으면 기쁨으로 첫 카드를 엽니다.
  root.MOOD_DEFAULT = "joy";

  root.STORAGE_KEY = "today_word_card_v1";
  root.STORAGE_VERSION = 1;

  // 화면 디자인. html의 data-design 값과 같아야 합니다.
  root.DESIGN_TAROT = "tarot";
  root.DESIGN_AURORA = "aurora";
  root.DESIGN_SKETCH = "sketch";
  root.DESIGN_RELATION = "relation";
  // 이름을 모를 때 쓰는 화면입니다. 처음 실행은 오로라로 엽니다.
  root.DESIGN_DEFAULT = root.DESIGN_TAROT;
  root.DESIGN_STORAGE_KEY = "today_word_card_design";
  // 위쪽 버튼 안내를 이미 본 브라우저인지 기억하는 서랍 이름입니다.
  root.DESIGN_HINT_KEY = "today_word_card_design_hint";

  // 사용자에게 보여줄 안내. 원인 내부 정보는 넣지 않습니다.
  // 글자는 js/i18n.js의 msg_ 키에 있고, 읽을 때마다 지금 언어로 가져옵니다.
  root.MESSAGES = {};
  [
    "mood_required",
    "draw_failed",
    "copy_done",
    "copy_failed",
    "save_failed",
    "empty_guide",
    "data_missing",
    "design_save_failed",
  ].forEach(function add_message(name) {
    Object.defineProperty(root.MESSAGES, name, {
      enumerable: true,
      get: function read_message() {
        return root.t("msg_" + name);
      },
    });
  });
})();

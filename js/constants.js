/**
 * 화면과 문장 선택이 함께 쓰는 고정 값입니다.
 * 기분 버튼의 value는 MOODS 목록의 id와 같아야 합니다.
 */
(function init_constants() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  // 고를 수 있는 기분. 문장 덱과 속담 덱도 이 id로 나뉘어 있습니다.
  root.MOODS = [
    { id: "joy", label: "기쁨" },
    { id: "calm", label: "평온" },
    { id: "excited", label: "설렘" },
    { id: "anxious", label: "불안" },
    { id: "tired", label: "피곤" },
    { id: "sad", label: "우울" },
  ];

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
  root.MESSAGES = {
    mood_required: "오늘 기분을 선택한 뒤 다시 뽑아 주세요.",
    draw_failed: "문장을 만들지 못했습니다. 기분을 다시 고른 뒤 뽑아 주세요.",
    copy_done: "문장을 복사했습니다. 원하는 곳에 붙여 넣으면 됩니다.",
    copy_failed: "복사에 실패했습니다. 문장을 드래그해서 직접 복사해 주세요.",
    save_failed: "이 브라우저에는 카드를 기억해 두지 못했습니다. 새로고침 후에는 다시 뽑아 주세요.",
    empty_guide: "오늘의 기분을 고르면 오늘을 위한 짧은 문장이 여기에 나타납니다.",
    data_missing: "문장 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.",
    design_save_failed: "이 브라우저에는 고른 디자인을 기억해 두지 못했습니다. 다음에 열 때 다시 골라 주세요.",
  };
})();

/**
 * 화면과 문장 선택이 함께 쓰는 고정 값입니다.
 * 기분 버튼의 value, 성별 버튼의 value는 이 목록의 id와 같아야 합니다.
 */
(function init_constants() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  // 입력 가능한 나이. 이 범위를 벗어나면 카드를 만들지 않습니다.
  root.AGE_MIN = 1;
  root.AGE_MAX = 120;

  // 나이를 말투 구간으로 나눕니다. 조언의 내용을 제한하는 기준이 아닙니다.
  root.AGE_BANDS = [
    { id: "child", label: "어린이", min_age: 1, max_age: 12 },
    { id: "teen", label: "10대", min_age: 13, max_age: 19 },
    { id: "twenties", label: "20대", min_age: 20, max_age: 29 },
    { id: "thirties", label: "30대", min_age: 30, max_age: 39 },
    { id: "forties", label: "40대", min_age: 40, max_age: 49 },
    { id: "fifties", label: "50대", min_age: 50, max_age: 59 },
    { id: "senior", label: "60대 이상", min_age: 60, max_age: 120 },
  ];

  // 문장 앞에 붙는 나이 말투. 성별은 여기 들어가지 않습니다.
  root.AGE_VOICES = {
    child: "호기심이 길을 만드는 오늘",
    teen: "경험이 재산이 되는 오늘",
    twenties: "선택이 많은 오늘",
    thirties: "책임과 바람이 함께 있는 오늘",
    forties: "중심을 잡기 좋은 오늘",
    fifties: "속도를 스스로 고를 수 있는 오늘",
    senior: "익숙함 속에서 새 기쁨을 찾기 좋은 오늘",
  };

  root.GENDERS = [
    { id: "female", label: "여성" },
    { id: "male", label: "남성" },
    { id: "none", label: "선택 안 함" },
  ];

  root.MOODS = [
    { id: "joy", label: "기쁨" },
    { id: "calm", label: "평온" },
    { id: "excited", label: "설렘" },
    { id: "anxious", label: "불안" },
    { id: "tired", label: "피곤" },
    { id: "sad", label: "우울" },
  ];

  root.STORAGE_KEY = "today_word_card_v1";
  root.STORAGE_VERSION = 1;

  // 화면 모드. css/style.css의 data-theme 값과 같아야 합니다.
  root.THEME_LIGHT = "light";
  root.THEME_DARK = "dark";
  root.THEME_STORAGE_KEY = "today_word_card_theme";

  // 사용자에게 보여줄 안내. 원인 내부 정보는 넣지 않습니다.
  root.MESSAGES = {
    age_required: "나이를 입력한 뒤 다시 뽑아 주세요.",
    age_range: "나이는 1부터 120 사이의 숫자로 입력해 주세요.",
    gender_required: "성별을 선택한 뒤 다시 뽑아 주세요.",
    mood_required: "오늘 기분을 선택한 뒤 다시 뽑아 주세요.",
    draw_failed: "문장을 만들지 못했습니다. 입력을 확인한 뒤 다시 뽑아 주세요.",
    copy_done: "문장을 복사했습니다. 원하는 곳에 붙여 넣으면 됩니다.",
    copy_failed: "복사에 실패했습니다. 문장을 드래그해서 직접 복사해 주세요.",
    save_failed: "이 브라우저에는 카드를 기억해 두지 못했습니다. 새로고침 후에는 다시 뽑아 주세요.",
    empty_guide: "나이, 성별, 오늘의 기분을 고르면 오늘을 위한 짧은 문장이 여기에 나타납니다.",
    data_missing: "문장 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.",
    theme_save_failed: "이 브라우저에는 화면 모드를 기억해 두지 못했습니다. 다음에 열 때 다시 골라 주세요.",
  };
})();

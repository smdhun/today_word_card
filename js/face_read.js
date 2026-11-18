/**
 * 오로라에서 앞 카메라로 표정과 윤곽을 읽습니다.
 * 사진은 판독이 끝나는 즉시 버리고, 형태가 칸을 고르면 기운과 방향과 속도가 문장 쌍을 고릅니다.
 */
(function init_face_read() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});
  const VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/vision_bundle.mjs";
  const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
  const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  const REFRAME_MESSAGE = "얼굴을 정면으로, 프레임 안에 두고 다시 찍어 주세요.";
  const PREPARE_MESSAGE = "얼굴 읽기를 준비하지 못했습니다. 감정을 직접 고른 뒤 뽑아 주세요.";
  const CAMERA_MESSAGE = "카메라 권한을 허용한 뒤 다시 눌러 주세요.";
  const PICK_MESSAGE = "추천 글을 고르지 못했습니다. 다시 찍어 주세요.";
  // 기분은 격언 분류를 정합니다. 온도는 그 기분의 말, 반대편은 균형 형에서만 옆에 둡니다.
  const FACE_QUOTE_CATEGORIES = {
    joy: { tone: "행복과 긍정, 희망", counter: "겸손과 인간관계, 진정성" },
    calm: { tone: "삶의 태도와 철학적 통찰", counter: "노력, 습관, 꾸준함" },
    excited: { tone: "놀라움과 호기심, 창의성", counter: "평온과 휴식, 마음의 여유" },
    anxious: { tone: "지혜와 성찰", counter: "자존감과 자기 믿음" },
    tired: { tone: "평온과 휴식, 마음의 여유", counter: "위로와 사랑, 따뜻함" },
    sad: { tone: "슬픔의 치유와 회복탄력성", counter: "사랑, 우정, 따뜻한 연대" },
  };
  // 판독 결과의 표정과 얼굴형입니다. 시적인 만남 표현 대신 읽힌 사실을 말합니다.
  const MOOD_FACTS = {
    joy: "기쁜",
    calm: "평온한",
    excited: "설레는",
    anxious: "불안한",
    tired: "피곤한",
    sad: "우울한",
  };
  const SHAPE_FACTS = {
    long: "긴 형",
    round: "둥근 형",
    angular: "각진 형",
    balanced: "균형 잡힌 형",
  };
  // 촬영 얼굴과 문장 쌍이 같이 쓰는 분류입니다. 문장 파일의 값과 같아야 합니다.
  const FACE_ENERGIES = ["낮음", "보통", "높음"];
  const FACE_DIRECTIONS = ["나", "곁"];
  const FACE_PACES = ["늦추기", "한 걸음"];
  // 형태는 거리가 다른 두 칸만 고릅니다. 같은 역할의 글을 두 개 두지 않습니다.
  const FACE_SHAPE_PARTS = {
    long: { is_lead_visible: true, is_caution_visible: false, quote_keys: ["tone"] },
    round: { is_lead_visible: true, is_caution_visible: true, quote_keys: [] },
    angular: { is_lead_visible: false, is_caution_visible: true, quote_keys: ["tone"] },
    balanced: { is_lead_visible: false, is_caution_visible: false, quote_keys: ["tone", "counter"] },
  };

  let landmarker = null;
  let camera_stream = null;
  let is_sheet_open = false;
  let watch_timer = 0;
  let is_watching = false;
  let frame_turn = 0;
  let has_frame_turn = false;
  let is_waiting_music = false;
  let is_reading = false;
  let is_trace_visible = false;
  let face_connectors = [];
  const pair_offsets = {};
  // 라이브러리 연결선이 없으면 쓰는 눈, 코, 입, 윤곽입니다.
  const TRACE_LOOPS = [
    [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
    [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
    [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
    [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
    [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
    [168, 6, 197, 195, 5, 4, 1],
  ];

  /**
   * id로 요소를 찾고, 없으면 기록만 남깁니다.
   */
  function require_element(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.error("얼굴 촬영 요소를 찾지 못했습니다.", id);
    }
    return element;
  }

  /**
   * 촬영 창 안의 안내를 바꿉니다.
   */
  function show_camera_message(message_element, message) {
    if (!message_element) {
      return;
    }
    message_element.hidden = !message;
    message_element.textContent = message || "";
  }

  /**
   * 카드 상태 칸에 준비 실패를 남깁니다.
   */
  function show_prepare_error() {
    const status = document.getElementById("status_message");
    if (!status) {
      console.error(PREPARE_MESSAGE);
      return;
    }
    status.textContent = PREPARE_MESSAGE;
  }

  /**
   * 카메라 불빛을 끄고 영상 연결을 끊습니다.
   */
  function stop_camera() {
    try {
      if (camera_stream) {
        camera_stream.getTracks().forEach(function stop_track(track) {
          track.stop();
        });
      }
      camera_stream = null;
      const video = document.getElementById("camera_video");
      if (video) {
        video.srcObject = null;
      }
    } catch (error) {
      console.error("카메라를 끄지 못했습니다. 브라우저의 카메라 표시를 확인해 주세요.", error);
    }
  }

  /**
   * 촬영 창을 닫고 사진 프레임을 비웁니다.
   */
  function close_sheet() {
    const sheet = document.getElementById("camera_sheet");
    is_sheet_open = false;
    is_waiting_music = false;
    is_reading = false;
    stop_watch();
    stop_camera();
    if (sheet) {
      sheet.hidden = true;
    }
    set_trace_ready(false);
  }

  /**
   * 카메라가 켜진 뒤에만 판독보기를 누를 수 있게 합니다.
   */
  function set_trace_ready(is_ready) {
    const button = document.getElementById("camera_trace_toggle");
    if (!button) {
      console.error("판독보기 버튼을 찾지 못했습니다.");
      return;
    }
    button.disabled = !is_ready;
  }

  /**
   * 얼굴 점을 화면 픽셀 좌표로 바꿉니다. 가로와 세로 단위를 맞춰야 형태가 왜곡되지 않습니다.
   */
  function landmark_point(landmarks, index, width, height) {
    const point = landmarks[index];
    if (!point) {
      return null;
    }
    return {
      x: point.x * width,
      y: point.y * height,
    };
  }

  /**
   * 두 점 사이 거리를 구합니다.
   */
  function point_distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  /**
   * 턱 끝에서 양쪽 턱으로 벌어진 각도를 구합니다. 각이 작을수록 각진 턱입니다.
   */
  function jaw_angle(left, chin, right) {
    const left_x = left.x - chin.x;
    const left_y = left.y - chin.y;
    const right_x = right.x - chin.x;
    const right_y = right.y - chin.y;
    const dot = left_x * right_x + left_y * right_y;
    const size = Math.hypot(left_x, left_y) * Math.hypot(right_x, right_y);
    if (!size) {
      return Math.PI;
    }
    const cosine = Math.min(1, Math.max(-1, dot / size));
    return Math.acos(cosine);
  }

  /**
   * 화면에 실제로 보이는 영상 조각입니다. 가로로 넓은 카메라는 좌우가 잘립니다.
   */
  function cover_rect(source_width, source_height, view_width, view_height) {
    if (!source_width || !source_height || !view_width || !view_height) {
      return null;
    }
    const source_ratio = source_width / source_height;
    const view_ratio = view_width / view_height;
    let x = 0;
    let y = 0;
    let width = source_width;
    let height = source_height;
    if (source_ratio > view_ratio) {
      width = source_height * view_ratio;
      x = (source_width - width) / 2;
    } else if (source_ratio < view_ratio) {
      height = source_width / view_ratio;
      y = (source_height - height) / 2;
    }
    const left = Math.max(0, Math.min(source_width - 1, Math.floor(x)));
    const top = Math.max(0, Math.min(source_height - 1, Math.floor(y)));
    return {
      x: left,
      y: top,
      width: Math.max(1, Math.min(source_width - left, Math.round(width))),
      height: Math.max(1, Math.min(source_height - top, Math.round(height))),
    };
  }

  /**
   * 이마와 턱, 양쪽 볼이 화면의 타원 안에 있는지 봅니다.
   * 얼굴 바깥으로 삐져나온 점 하나 때문에 거절하지 않습니다.
   */
  function is_face_in_frame(landmarks, is_quiet) {
    const forehead = landmarks[10];
    const chin = landmarks[152];
    const left_cheek = landmarks[234];
    const right_cheek = landmarks[454];
    if (!forehead || !chin || !left_cheek || !right_cheek) {
      if (!is_quiet) {
        console.error("얼굴의 기준점을 찾지 못했습니다.");
      }
      return false;
    }
    const face_width = Math.abs(right_cheek.x - left_cheek.x);
    const face_height = Math.abs(chin.y - forehead.y);
    const center_x = (left_cheek.x + right_cheek.x) / 2;
    const center_y = (forehead.y + chin.y) / 2;
    const is_large_enough = face_width >= 0.08 && face_height >= 0.1;
    const is_centered = center_x >= 0.06 && center_x <= 0.94 && center_y >= 0.04 && center_y <= 0.96;
    if (!is_quiet && (!is_large_enough || !is_centered)) {
      console.error("얼굴이 프레임 기준에 맞지 않습니다.", {
        face_width: face_width,
        face_height: face_height,
        center_x: center_x,
        center_y: center_y,
      });
    }
    return is_large_enough && is_centered;
  }

  /**
   * 길이, 폭, 턱 각도로 네 형태 중 하나를 고릅니다.
   */
  function read_shape(landmarks, width, height) {
    const forehead = landmark_point(landmarks, 10, width, height);
    const chin = landmark_point(landmarks, 152, width, height);
    const left_cheek = landmark_point(landmarks, 234, width, height);
    const right_cheek = landmark_point(landmarks, 454, width, height);
    const left_jaw = landmark_point(landmarks, 172, width, height);
    const right_jaw = landmark_point(landmarks, 397, width, height);
    if (!forehead || !chin || !left_cheek || !right_cheek || !left_jaw || !right_jaw) {
      return "";
    }
    const face_height = point_distance(forehead, chin);
    const face_width = point_distance(left_cheek, right_cheek);
    if (!face_width) {
      return "";
    }
    const ratio = face_height / face_width;
    const angle = jaw_angle(left_jaw, chin, right_jaw);
    if (ratio >= 1.45) {
      return "long";
    }
    if (ratio <= 1.28) {
      return "round";
    }
    if (angle < 1.95) {
      return "angular";
    }
    return "balanced";
  }

  /**
   * 표정 이름을 점수로 바꿉니다. 없는 항목은 0입니다.
   */
  function read_scores(categories) {
    const scores = {};
    (categories || []).forEach(function keep_score(item) {
      if (item && item.categoryName) {
        scores[item.categoryName] = item.score || 0;
      }
    });
    return scores;
  }

  /**
   * 왼쪽과 오른쪽 표정 점수의 평균입니다.
   */
  function average_score(scores, left_name, right_name) {
    return ((scores[left_name] || 0) + (scores[right_name] || 0)) / 2;
  }

  /**
   * 입술이 동그랗게 모인 모양인지 봅니다. 설렘의 오 모양 입입니다.
   */
  function is_round_open_mouth(scores) {
    const funnel = scores.mouthFunnel || 0;
    const jaw_open = scores.jawOpen || 0;
    return funnel >= 0.3 || (funnel >= 0.18 && jaw_open >= 0.2);
  }

  /**
   * 표정 점수를 기분 하나로 바꿉니다. 신호가 약하면 평온입니다.
   */
  function read_mood(categories) {
    const scores = read_scores(categories);
    const smile = average_score(scores, "mouthSmileLeft", "mouthSmileRight");
    const frown = average_score(scores, "mouthFrownLeft", "mouthFrownRight");
    const brow_up = scores.browInnerUp || 0;
    const brow_down = average_score(scores, "browDownLeft", "browDownRight");
    const eye_wide = average_score(scores, "eyeWideLeft", "eyeWideRight");
    const blink = average_score(scores, "eyeBlinkLeft", "eyeBlinkRight");
    const squint = average_score(scores, "eyeSquintLeft", "eyeSquintRight");
    const is_awake = blink < 0.45 && squint < 0.4;

    if (smile >= 0.35 && smile >= frown) {
      return "joy";
    }
    if (is_awake && frown < 0.28 && is_round_open_mouth(scores)) {
      return "excited";
    }
    if (eye_wide >= 0.3 && brow_up >= 0.25 && smile < 0.35) {
      return "excited";
    }
    if (brow_down >= 0.3 && frown >= 0.15) {
      return "anxious";
    }
    if (frown >= 0.28) {
      return "sad";
    }
    if ((blink >= 0.45 || squint >= 0.4) && smile < 0.2) {
      return "tired";
    }
    return "calm";
  }

  /**
   * 읽힌 표정과 얼굴형을 사실대로 한 줄로 만듭니다.
   */
  function reading_label(mood_id, shape_id) {
    const mood_fact = MOOD_FACTS[mood_id] || "";
    const shape_fact = SHAPE_FACTS[shape_id] || "";
    if (!mood_fact || !shape_fact) {
      return "";
    }
    return mood_fact + " 표정이고, 얼굴은 " + shape_fact + "입니다.";
  }

  /**
   * 눈, 입, 미간과 세기, 방향, 속도를 부드러운 문장으로 말합니다.
   */
  function reading_facts(categories, face_axes) {
    try {
      const scores = read_scores(categories);
      const smile = average_score(scores, "mouthSmileLeft", "mouthSmileRight");
      const frown = average_score(scores, "mouthFrownLeft", "mouthFrownRight");
      const brow_up = scores.browInnerUp || 0;
      const brow_down = average_score(scores, "browDownLeft", "browDownRight");
      const eye_wide = average_score(scores, "eyeWideLeft", "eyeWideRight");
      const blink = average_score(scores, "eyeBlinkLeft", "eyeBlinkRight");
      const squint = average_score(scores, "eyeSquintLeft", "eyeSquintRight");
      const lines = [];
      if (blink >= 0.45 || squint >= 0.4) {
        lines.push("눈이 편안하게 감겨 있습니다.");
      } else if (eye_wide >= 0.3) {
        lines.push("눈이 시원스럽게 크게 떠 있습니다.");
      } else {
        lines.push("눈은 크게 떠 있거나 감기지 않고 자연스럽습니다.");
      }
      if (smile >= 0.35 && smile >= frown) {
        lines.push("입꼬리가 기분 좋게 올라가 있습니다.");
      } else if (frown >= 0.28) {
        lines.push("입꼬리가 살짝 내려가 있습니다.");
      } else if (is_round_open_mouth(scores)) {
        lines.push("입이 둥글게 열려 있습니다.");
      } else {
        lines.push("입꼬리는 크게 움직이지 않고 차분합니다.");
      }
      if (brow_down >= 0.3) {
        lines.push("미간이 살짝 모여 있습니다.");
      } else if (brow_up >= 0.25) {
        lines.push("눈썹 사이가 부드럽게 올라가 있습니다.");
      }
      if (face_axes.direction === "곁") {
        lines.push("표정이 바깥을 향해 환하게 열려 있습니다.");
      } else {
        lines.push("표정의 시선이 조용히 자신에게 머물러 있습니다.");
      }
      if (face_axes.energy === "높음") {
        lines.push("표정의 감정이 뚜렷하게 느껴집니다.");
      } else if (face_axes.energy === "낮음") {
        lines.push("표정의 감정이 은은하고 부드럽게 드러납니다.");
      } else {
        lines.push("표정의 감정이 과하지도 모자라지도 않게 담겨 있습니다.");
      }
      if (face_axes.pace === "늦추기") {
        lines.push("급하게 서두르는 느낌 없이 차분합니다.");
      } else {
        lines.push("차분하게 변화를 줄 준비가 가볍게 엿보입니다.");
      }
      return lines.join(" ");
    } catch (error) {
      console.error("판독 결과를 문장으로 만들지 못했습니다.", error);
      return "";
    }
  }

  /**
   * 같은 표정에서 문장을 고를 세 분류를 읽습니다.
   * 기운은 표정이 센지, 방향은 밖으로 열렸는지, 속도는 늦출 얼굴인지입니다.
   */
  function read_face_axes(categories) {
    try {
      const scores = read_scores(categories);
      const smile = average_score(scores, "mouthSmileLeft", "mouthSmileRight");
      const frown = average_score(scores, "mouthFrownLeft", "mouthFrownRight");
      const brow_up = scores.browInnerUp || 0;
      const brow_down = average_score(scores, "browDownLeft", "browDownRight");
      const eye_wide = average_score(scores, "eyeWideLeft", "eyeWideRight");
      const blink = average_score(scores, "eyeBlinkLeft", "eyeBlinkRight");
      const squint = average_score(scores, "eyeSquintLeft", "eyeSquintRight");
      const funnel = scores.mouthFunnel || 0;
      const is_round_mouth = is_round_open_mouth(scores);
      const activation = Math.max(smile, frown, brow_up, brow_down, eye_wide, blink, squint, funnel);
      let energy = "보통";
      if (smile >= 0.55 || eye_wide >= 0.45 || funnel >= 0.45) {
        energy = "높음";
      } else if (activation < 0.22 || ((blink >= 0.4 || squint >= 0.35) && smile < 0.25 && !is_round_mouth)) {
        energy = "낮음";
      }
      let direction = "나";
      const is_open_smile = smile >= 0.3 && blink < 0.4 && squint < 0.35;
      const is_wide_look = eye_wide >= 0.3 && frown < 0.25;
      if (is_open_smile || is_wide_look || (is_round_mouth && blink < 0.45)) {
        direction = "곁";
      }
      let pace = "한 걸음";
      const is_slow_face = energy === "낮음" || brow_down >= 0.3 || frown >= 0.28;
      const is_overflow = smile >= 0.72 || eye_wide >= 0.6;
      if (is_slow_face || is_overflow) {
        pace = "늦추기";
      }
      return {
        energy: energy,
        direction: direction,
        pace: pace,
      };
    } catch (error) {
      console.error("얼굴의 기운과 방향, 속도를 읽지 못했습니다.", error);
      return null;
    }
  }

  /**
   * 분류 안에서 순번에 해당하는 격언 하나를 꺼냅니다.
   */
  function quote_at(category, offset) {
    const grouped = root.WISE_QUOTES || {};
    const list = grouped[category];
    if (!Array.isArray(list) || list.length === 0) {
      console.error("얼굴 추천에 쓸 격언 분류가 없습니다.", category);
      return null;
    }
    const quote = list[offset % list.length];
    if (!quote || !quote.text || !quote.person) {
      console.error("격언의 모양이 올바르지 않습니다.", category);
      return null;
    }
    return {
      category: category,
      text: quote.text,
      person: quote.person,
    };
  }

  /**
   * 문장 쌍에 세 분류가 모두 있는지 확인합니다.
   */
  function is_tagged_phrase(phrase) {
    return Boolean(
      phrase
      && phrase.lead
      && phrase.caution
      && FACE_ENERGIES.indexOf(phrase.energy) >= 0
      && FACE_DIRECTIONS.indexOf(phrase.direction) >= 0
      && FACE_PACES.indexOf(phrase.pace) >= 0
    );
  }

  /**
   * 얼굴 분류와 문장 분류가 얼마나 같은지 셉니다. 기운은 한 칸 옆이면 절반입니다.
   */
  function phrase_match_score(face_axes, phrase) {
    let score = 0;
    if (phrase.energy === face_axes.energy) {
      score += 2;
    } else if (phrase.energy === "보통" || face_axes.energy === "보통") {
      score += 1;
    }
    if (phrase.direction === face_axes.direction) {
      score += 2;
    }
    if (phrase.pace === face_axes.pace) {
      score += 2;
    }
    return score;
  }

  /**
   * 가장 높은 점수의 문장들만 남깁니다. 다시 찍으면 그 안에서 다음 문장으로 넘어갑니다.
   */
  function best_phrase_matches(phrases, face_axes) {
    const ranked = [];
    phrases.forEach(function score_phrase(phrase, index) {
      if (!is_tagged_phrase(phrase)) {
        return;
      }
      ranked.push({
        phrase: phrase,
        index: index,
        score: phrase_match_score(face_axes, phrase),
      });
    });
    ranked.sort(function by_score(left, right) {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    });
    if (ranked.length === 0) {
      return [];
    }
    const top_score = ranked[0].score;
    return ranked.filter(function keep_top(item) {
      return item.score === top_score;
    });
  }

  /**
   * 형태가 두 칸을 고르고, 얼굴의 세 분류가 그 기분의 문장 쌍을 고릅니다.
   * 같은 얼굴로 다시 찍으면 같은 점수의 다음 쌍으로 넘어갑니다.
   */
  function pick_face_card(mood_id, shape_id, face_axes) {
    try {
      const parts = FACE_SHAPE_PARTS[shape_id];
      const categories = FACE_QUOTE_CATEGORIES[mood_id];
      const phrases = root.PHRASES && root.PHRASES[mood_id];
      const has_axes = face_axes
        && FACE_ENERGIES.indexOf(face_axes.energy) >= 0
        && FACE_DIRECTIONS.indexOf(face_axes.direction) >= 0
        && FACE_PACES.indexOf(face_axes.pace) >= 0;
      if (!parts || !categories || !Array.isArray(phrases) || phrases.length === 0 || !has_axes) {
        console.error("얼굴 추천에 쓸 기분이나 형태, 분류가 없습니다.", mood_id, shape_id);
        return null;
      }
      const matches = best_phrase_matches(phrases, face_axes);
      if (matches.length === 0) {
        console.error("얼굴과 맞출 문장 분류가 없습니다.", mood_id);
        return null;
      }
      const key = [mood_id, face_axes.energy, face_axes.direction, face_axes.pace].join("|");
      const offset = pair_offsets[key] || 0;
      const chosen = matches[offset % matches.length];
      const phrase = chosen.phrase;
      const quotes = [];
      for (let index = 0; index < parts.quote_keys.length; index += 1) {
        const quote = quote_at(categories[parts.quote_keys[index]], chosen.index);
        if (!quote) {
          return null;
        }
        quotes.push(quote);
      }
      if (quotes.length === 2 && quotes[0].category === quotes[1].category) {
        console.error("두 격언의 분류가 같습니다.", mood_id);
        return null;
      }
      pair_offsets[key] = offset + 1;
      return {
        is_lead_visible: parts.is_lead_visible,
        is_caution_visible: parts.is_caution_visible,
        lead_text: phrase.lead,
        caution_text: phrase.caution,
        quotes: quotes,
      };
    } catch (error) {
      console.error("얼굴 추천 글을 고르지 못했습니다.", error);
      return null;
    }
  }

  root.pick_face_card = pick_face_card;

  /**
   * 기분 이름을 찾습니다.
   */
  function mood_label(mood_id) {
    const moods = root.MOODS || [];
    const mood = moods.find(function match_mood(item) {
      return item.id === mood_id;
    });
    return mood ? mood.label : "";
  }

  /**
   * 휴대폰은 그래픽 가속이 얼굴을 비우는 경우가 있어 기본 방식으로 읽습니다.
   */
  function is_phone() {
    const agent = navigator.userAgent || "";
    if (/iPhone|iPad|iPod|Android/i.test(agent)) {
      return true;
    }
    return navigator.maxTouchPoints > 1 && Math.min(window.innerWidth, window.innerHeight) < 820;
  }

  /**
   * 얼굴 읽기 모델을 한 번만 받습니다. 그래픽 가속이 안 되면 기본 방식으로 다시 엽니다.
   */
  async function ensure_landmarker() {
    if (landmarker) {
      return landmarker;
    }
    const vision = await import(VISION_URL);
    keep_connectors(vision);
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    const base_options = {
      modelAssetPath: MODEL_URL,
      delegate: is_phone() ? "CPU" : "GPU",
    };
    const options = {
      runningMode: "IMAGE",
      numFaces: 1,
      outputFaceBlendshapes: true,
      minFaceDetectionConfidence: 0.2,
      minFacePresenceConfidence: 0.2,
      minTrackingConfidence: 0.2,
    };
    try {
      landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: base_options,
        ...options,
      });
    } catch (error) {
      console.error("그래픽 가속으로 얼굴을 읽지 못했습니다. 기본 방식으로 다시 준비합니다.", error);
      base_options.delegate = "CPU";
      landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: base_options,
        ...options,
      });
    }
    return landmarker;
  }

  /**
   * 앞 카메라를 켭니다.
   */
  async function start_camera(video) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("이 브라우저에서는 카메라를 열 수 없습니다.");
      return false;
    }
    camera_stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 720 },
        height: { ideal: 960 },
      },
      audio: false,
    });
    video.playsInline = true;
    video.muted = true;
    video.srcObject = camera_stream;
    await video.play();
    if (!video.videoWidth) {
      await new Promise(function wait_size(resolve) {
        const timer = window.setTimeout(resolve, 1500);
        video.addEventListener("loadedmetadata", function on_meta() {
          window.clearTimeout(timer);
          resolve();
        }, { once: true });
      });
    }
    return true;
  }

  /**
   * 촬영 창을 열고 모델과 카메라를 준비합니다.
   */
  async function open_sheet() {
    if (document.documentElement.dataset.design !== "aurora") {
      return;
    }
    const sheet = require_element("camera_sheet");
    const video = require_element("camera_video");
    const message_element = require_element("camera_message");
    const shutter = require_element("camera_shutter");
    if (!sheet || !video || !message_element || !shutter) {
      return;
    }
    is_sheet_open = true;
    sheet.hidden = false;
    shutter.disabled = true;
    set_trace_ready(false);
    show_camera_message(message_element, "얼굴을 읽을 준비를 하고 있습니다.");
    try {
      await ensure_landmarker();
      if (!is_sheet_open) {
        return;
      }
      await start_camera(video);
      if (!is_sheet_open) {
        stop_camera();
        return;
      }
      show_camera_message(message_element, "");
      shutter.disabled = false;
      set_trace_ready(true);
      shutter.focus();
      start_watch(video);
    } catch (error) {
      console.error("카메라 촬영을 열지 못했습니다.", error);
      const is_camera_denied = error && (error.name === "NotAllowedError" || error.name === "NotFoundError");
      close_sheet();
      if (is_camera_denied) {
        const status = document.getElementById("status_message");
        if (status) {
          status.textContent = CAMERA_MESSAGE;
        }
        return;
      }
      show_prepare_error();
    }
  }

  /**
   * 다음 카메라 화면을 잠시 기다립니다. 휴대폰은 신호가 안 올 수 있어 시간을 넘기면 진행합니다.
   */
  function wait_frame(video) {
    return new Promise(function settle(resolve) {
      let is_done = false;
      function finish() {
        if (is_done) {
          return;
        }
        is_done = true;
        resolve();
      }
      window.setTimeout(finish, 240);
      if (video && typeof video.requestVideoFrameCallback === "function") {
        try {
          video.requestVideoFrameCallback(function on_frame() {
            finish();
          });
        } catch (error) {
          console.error("다음 화면 신호를 받지 못했습니다.", error);
          finish();
        }
      }
    });
  }

  /**
   * 보이는 영역만 캔버스에 그립니다.
   */
  function paint_crop(source, crop) {
    const longest = Math.max(crop.width, crop.height);
    const scale = Math.min(1, 960 / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(crop.width * scale));
    canvas.height = Math.max(1, Math.round(crop.height * scale));
    const context = canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");
    if (!context) {
      console.error("촬영 화면을 만들지 못했습니다.");
      return null;
    }
    context.drawImage(
      source,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return { canvas: canvas, context: context };
  }

  /**
   * 얼굴 그림이 남지 않도록 캔버스를 지웁니다.
   */
  function wipe_canvas(painted) {
    if (!painted || !painted.canvas) {
      return;
    }
    if (painted.context) {
      painted.context.clearRect(0, 0, painted.canvas.width, painted.canvas.height);
    }
    painted.canvas.width = 0;
    painted.canvas.height = 0;
  }

  /**
   * 인식 결과에서 얼굴 점과 표정을 꺼냅니다.
   */
  function read_detection(source) {
    try {
      const result = landmarker.detect(source);
      const landmarks = result && result.faceLandmarks ? result.faceLandmarks[0] : null;
      if (!landmarks || landmarks.length < 468) {
        return null;
      }
      return {
        landmarks: landmarks,
        blendshapes: result.faceBlendshapes ? result.faceBlendshapes[0] : null,
      };
    } catch (error) {
      console.error("얼굴 인식이 실패했습니다. 다른 방식으로 다시 봅니다.", error);
      return null;
    }
  }

  /**
   * 얼굴이 화면을 가득 채워 한 번에 안 잡히면, 여백을 두고 한 번 더 봅니다.
   */
  function detect_padded(painted) {
    const view_width = painted.canvas.width;
    const view_height = painted.canvas.height;
    const pad_width = Math.max(view_width + 2, Math.round(view_width / 0.55));
    const pad_height = Math.max(view_height + 2, Math.round(view_height / 0.55));
    const canvas = document.createElement("canvas");
    canvas.width = pad_width;
    canvas.height = pad_height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return null;
    }
    const offset_x = Math.round((pad_width - view_width) / 2);
    const offset_y = Math.round((pad_height - view_height) / 2);
    context.fillStyle = "#767676";
    context.fillRect(0, 0, pad_width, pad_height);
    context.drawImage(painted.canvas, offset_x, offset_y);
    const found = read_detection(canvas);
    context.clearRect(0, 0, pad_width, pad_height);
    canvas.width = 0;
    canvas.height = 0;
    if (!found) {
      return null;
    }
    return {
      landmarks: found.landmarks.map(function to_view(point) {
        return {
          x: (point.x * pad_width - offset_x) / view_width,
          y: (point.y * pad_height - offset_y) / view_height,
          z: point.z,
        };
      }),
      blendshapes: found.blendshapes,
      width: view_width,
      height: view_height,
    };
  }

  /**
   * 그림이 거의 검으면 카메라 프레임이 아직 안 들어온 것입니다.
   */
  function is_blank(painted) {
    if (!painted || !painted.context || !painted.canvas.width) {
      return true;
    }
    try {
      const sample_width = Math.min(12, painted.canvas.width);
      const sample_height = Math.min(12, painted.canvas.height);
      const sample = painted.context.getImageData(
        Math.floor((painted.canvas.width - sample_width) / 2),
        Math.floor((painted.canvas.height - sample_height) / 2),
        sample_width,
        sample_height
      );
      let sum = 0;
      for (let index = 0; index < sample.data.length; index += 4) {
        sum += sample.data[index] + sample.data[index + 1] + sample.data[index + 2];
      }
      return sum / (sample.data.length / 4) < 12;
    } catch (error) {
      console.error("촬영 화면의 밝기를 확인하지 못했습니다.", error);
      return false;
    }
  }

  /**
   * 얼굴 점을 화면에 보이는 조각 기준으로 옮깁니다.
   */
  function map_into_crop(found, source_width, source_height, crop) {
    return {
      landmarks: found.landmarks.map(function map_point(point) {
        return {
          x: (point.x * source_width - crop.x) / crop.width,
          y: (point.y * source_height - crop.y) / crop.height,
          z: point.z,
        };
      }),
      blendshapes: found.blendshapes,
      width: Math.max(1, Math.round(crop.width)),
      height: Math.max(1, Math.round(crop.height)),
    };
  }

  /**
   * 화면에 올릴 그림만 만듭니다. 점은 이 그림 기준으로 읽습니다.
   * 영상 태그에서 바로 읽으면 휴대폰에서 점이 왼쪽 아래로 밀립니다.
   */
  function open_painted(video, turn) {
    if (turn === 0) {
      const view_width = video.clientWidth || video.videoWidth;
      const view_height = video.clientHeight || video.videoHeight;
      const crop = cover_rect(video.videoWidth, video.videoHeight, view_width, view_height);
      return crop ? paint_crop(video, crop) : null;
    }
    return paint_visible(video, turn);
  }

  /**
   * 휴대폰은 화면과 원본 방향이 다를 수 있어 맞는 각도를 찾을 때까지 여러 방향을 봅니다.
   */
  function turns_for() {
    if (!is_phone()) {
      return [0];
    }
    if (has_frame_turn) {
      return [frame_turn];
    }
    return [0, -90, 90, 180];
  }

  /**
   * 긴 변을 줄인 뒤 필요하면 돌려서, 화면에 보이는 조각만 남깁니다.
   */
  function paint_visible(video, turn) {
    const max_edge = 720;
    const scale = Math.min(1, max_edge / Math.max(video.videoWidth, video.videoHeight));
    const drawn_width = Math.max(1, Math.round(video.videoWidth * scale));
    const drawn_height = Math.max(1, Math.round(video.videoHeight * scale));
    const is_quarter = turn === 90 || turn === -90;
    const canvas_width = is_quarter ? drawn_height : drawn_width;
    const canvas_height = is_quarter ? drawn_width : drawn_height;
    const canvas = document.createElement("canvas");
    canvas.width = canvas_width;
    canvas.height = canvas_height;
    const context = canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");
    if (!context) {
      console.error("휴대폰 화면을 돌리지 못했습니다.");
      return null;
    }
    context.save();
    if (turn === 90) {
      context.translate(canvas_width, 0);
      context.rotate(Math.PI / 2);
    } else if (turn === -90) {
      context.translate(0, canvas_height);
      context.rotate(-Math.PI / 2);
    } else if (turn === 180) {
      context.translate(canvas_width, canvas_height);
      context.rotate(Math.PI);
    }
    context.drawImage(video, 0, 0, drawn_width, drawn_height);
    context.restore();
    const view_width = video.clientWidth || canvas_width;
    const view_height = video.clientHeight || canvas_height;
    const crop = cover_rect(canvas_width, canvas_height, view_width, view_height);
    const painted = crop ? paint_crop(canvas, crop) : null;
    context.clearRect(0, 0, canvas_width, canvas_height);
    canvas.width = 0;
    canvas.height = 0;
    return painted;
  }

  /**
   * 잘라 둔 그림에서 얼굴을 읽습니다. 그림은 호출하는 쪽이 지웁니다.
   */
  function inspect_painted(painted, is_quiet) {
    if (!painted || is_blank(painted)) {
      return null;
    }
    let found = read_detection(painted.canvas);
    if (found) {
      found = {
        landmarks: found.landmarks,
        blendshapes: found.blendshapes,
        width: painted.canvas.width,
        height: painted.canvas.height,
      };
    } else {
      found = detect_padded(painted);
    }
    if (!found) {
      return null;
    }
    found.is_in_frame = is_face_in_frame(found.landmarks, is_quiet);
    return found;
  }

  /**
   * 지금 화면에 분석 가능한 얼굴이 있는지 봅니다.
   * 미리보기는 얼굴을 읽은 바로 그 그림입니다.
   */
  function look_at_video(video, is_quiet) {
    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }
    const turns = turns_for();
    for (let index = 0; index < turns.length; index += 1) {
      const turn = turns[index];
      const painted = open_painted(video, turn);
      const found = inspect_painted(painted, is_quiet);
      if (found && painted) {
        frame_turn = turn;
        has_frame_turn = true;
        present_view(painted.canvas, is_trace_visible ? found.landmarks : null);
        wipe_canvas(painted);
        return found;
      }
      if (turn === 0 && has_frame_turn && frame_turn === 0 && painted) {
        present_view(painted.canvas, null);
        wipe_canvas(painted);
        return null;
      }
      wipe_canvas(painted);
    }
    const fallback = open_painted(video, has_frame_turn ? frame_turn : 0);
    if (fallback) {
      present_view(fallback.canvas, null);
      wipe_canvas(fallback);
    }
    return null;
  }

  /**
   * 점 번호를 이어 선 목록으로 만듭니다.
   */
  function loop_links(indices, is_closed) {
    const links = [];
    const last_index = is_closed ? indices.length : indices.length - 1;
    for (let index = 0; index < last_index; index += 1) {
      links.push({
        start: indices[index],
        end: indices[(index + 1) % indices.length],
      });
    }
    return links;
  }

  /**
   * 눈, 코, 입, 얼굴 윤곽을 이을 선을 준비합니다.
   */
  function keep_connectors(vision) {
    try {
      const marker = vision && vision.FaceLandmarker;
      const names = [
        "FACE_LANDMARKS_FACE_OVAL",
        "FACE_LANDMARKS_LEFT_EYE",
        "FACE_LANDMARKS_RIGHT_EYE",
        "FACE_LANDMARKS_LEFT_EYEBROW",
        "FACE_LANDMARKS_RIGHT_EYEBROW",
        "FACE_LANDMARKS_LEFT_IRIS",
        "FACE_LANDMARKS_RIGHT_IRIS",
        "FACE_LANDMARKS_LIPS",
      ];
      const groups = [];
      names.forEach(function take_group(name) {
        const group = marker && marker[name];
        if (Array.isArray(group) && group.length > 0) {
          groups.push(group);
        }
      });
      if (groups.length === 0) {
        TRACE_LOOPS.forEach(function add_loop(indices, index) {
          const is_closed = index === 0 || index === 1 || index === 2 || index === 5;
          groups.push(loop_links(indices, is_closed));
        });
      } else {
        groups.push(loop_links(TRACE_LOOPS[6], false));
      }
      face_connectors = groups;
    } catch (error) {
      console.error("판독 선을 준비하지 못했습니다.", error);
      face_connectors = [];
    }
  }

  /**
   * 셀카처럼 좌우를 뒤집어 그립니다. 미리보기와 점이 같은 방향을 씁니다.
   */
  function draw_mirrored(context, width, draw) {
    context.save();
    context.translate(width, 0);
    context.scale(-1, 1);
    try {
      draw();
    } finally {
      context.restore();
    }
  }

  /**
   * 점이 기준으로 삼은 그림을 미리보기에 올립니다.
   * 영상 태그 위에 겹쳐 그리면 휴대폰에서 점이 왼쪽 아래로 밀립니다.
   */
  function present_view(source, landmarks) {
    const preview = document.getElementById("camera_preview");
    if (!preview || !source || !source.width || !source.height) {
      return;
    }
    const width = preview.clientWidth;
    const height = preview.clientHeight;
    if (!width || !height) {
      return;
    }
    if (preview.width !== width || preview.height !== height) {
      preview.width = width;
      preview.height = height;
    }
    const context = preview.getContext("2d");
    if (!context) {
      console.error("촬영 미리보기를 그리지 못했습니다.");
      return;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    draw_mirrored(context, width, function paint_preview() {
      context.drawImage(source, 0, 0, width, height);
      if (landmarks && landmarks.length) {
        paint_trace_lines(context, landmarks, width, height);
      }
    });
    clear_trace();
  }

  /**
   * 미리보기 그림을 지웁니다.
   */
  function clear_preview() {
    const preview = document.getElementById("camera_preview");
    if (!preview) {
      return;
    }
    const context = preview.getContext("2d");
    if (!context) {
      console.error("촬영 미리보기를 지우지 못했습니다.");
      return;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, preview.width, preview.height);
    preview.width = 0;
    preview.height = 0;
  }

  /**
   * 미리보기 위의 점과 선을 지웁니다.
   */
  function clear_trace() {
    const canvas = document.getElementById("camera_trace");
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      console.error("판독 선을 지우지 못했습니다.");
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * 지금 그림 위에 윤곽과 눈, 코, 입의 점과 선을 그립니다.
   * 따로 있는 캔버스에 그리면 휴대폰에서 얼굴과 점이 어긋납니다.
   */
  function paint_trace_lines(context, landmarks, width, height) {
    context.lineWidth = 1.5;
    context.lineJoin = "round";
    context.strokeStyle = "rgba(247, 241, 230, 0.95)";
    context.fillStyle = "#3dff6a";
    const dots = {};
    face_connectors.forEach(function draw_group(group) {
      context.beginPath();
      group.forEach(function draw_link(link) {
        const start = landmarks[link.start];
        const end = landmarks[link.end];
        if (!start || !end) {
          return;
        }
        context.moveTo(start.x * width, start.y * height);
        context.lineTo(end.x * width, end.y * height);
        dots[link.start] = start;
        dots[link.end] = end;
      });
      context.stroke();
    });
    Object.keys(dots).forEach(function draw_dot(key) {
      const point = dots[key];
      context.beginPath();
      context.arc(point.x * width, point.y * height, 1.7, 0, Math.PI * 2);
      context.fill();
    });
  }

  /**
   * 판독보기 버튼 글자를 현재 상태에 맞춥니다.
   */
  function sync_trace_button() {
    const button = document.getElementById("camera_trace_toggle");
    if (!button) {
      console.error("판독보기 버튼을 찾지 못했습니다.");
      return;
    }
    button.textContent = is_trace_visible ? "판독 안보기" : "판독보기";
    button.setAttribute("aria-pressed", is_trace_visible ? "true" : "false");
    if (!is_trace_visible) {
      clear_trace();
    }
  }

  /**
   * 타원 테두리를 분석 가능 여부에 맞춰 바꿉니다.
   */
  function set_frame_ready(is_ready) {
    const frame = document.querySelector(".camera_guide_frame");
    if (!frame) {
      return;
    }
    frame.classList.toggle("is_face_ready", Boolean(is_ready));
  }

  /**
   * 미리보기 확인을 멈춥니다.
   */
  function stop_watch() {
    is_watching = false;
    has_frame_turn = false;
    frame_turn = 0;
    window.clearTimeout(watch_timer);
    watch_timer = 0;
    set_frame_ready(false);
    clear_trace();
    clear_preview();
  }

  /**
   * 타원 안에 얼굴이 들어오면 테두리를 녹색으로 바꿉니다.
   */
  function start_watch(video) {
    stop_watch();
    const tick = async function tick() {
      if (!is_sheet_open) {
        return;
      }
      if (!is_reading && !is_watching && video.videoWidth) {
        is_watching = true;
        try {
          await wait_frame(video);
          if (is_sheet_open && !is_reading) {
            const found = look_at_video(video, true);
            if (is_sheet_open && !is_reading) {
              set_frame_ready(Boolean(found && found.is_in_frame));
            }
          }
        } catch (error) {
          console.error("얼굴 위치를 확인하지 못했습니다.", error);
          set_frame_ready(false);
        } finally {
          is_watching = false;
        }
      }
      if (is_sheet_open) {
        watch_timer = window.setTimeout(tick, 500);
      }
    };
    watch_timer = window.setTimeout(tick, 300);
  }

  /**
   * 보이는 얼굴만 최대 두 번 읽습니다. 사진은 함수 안에서 지웁니다.
   */
  async function find_face(video) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await wait_frame(video);
      const found = look_at_video(video, false);
      if (found && found.is_in_frame) {
        return found;
      }
      console.error("영상에서 얼굴을 찾지 못했습니다.");
    }
    return null;
  }

  /**
   * 지금 프레임에서 기분과 형태를 읽고 추천 글을 카드에 올립니다.
   */
  async function capture_face() {
    if (is_reading || !landmarker) {
      return;
    }
    const video = require_element("camera_video");
    const message_element = require_element("camera_message");
    const shutter = require_element("camera_shutter");
    if (!video || !message_element || !shutter || !video.videoWidth) {
      show_camera_message(message_element, REFRAME_MESSAGE);
      return;
    }
    is_reading = true;
    shutter.disabled = true;
    try {
      const wait_started = Date.now();
      while (is_watching && Date.now() - wait_started < 2000) {
        await new Promise(function wait_watch(resolve) {
          window.setTimeout(resolve, 40);
        });
      }
      const found = await find_face(video);
      if (!found) {
        show_camera_message(message_element, REFRAME_MESSAGE);
        return;
      }
      const shape_id = read_shape(found.landmarks, found.width, found.height);
      const blend_categories = found.blendshapes ? found.blendshapes.categories : [];
      const mood_id = read_mood(blend_categories);
      const face_axes = read_face_axes(blend_categories);
      const card = pick_face_card(mood_id, shape_id, face_axes);
      const label = reading_label(mood_id, shape_id);
      const link_text = reading_facts(blend_categories, face_axes);
      const mood_name = mood_label(mood_id);
      if (!card || !label || !link_text || !mood_name || typeof root.show_face_reading !== "function") {
        console.error("얼굴 추천 글을 고르지 못했습니다. 다시 찍어 주세요.");
        show_camera_message(message_element, PICK_MESSAGE);
        return;
      }
      close_sheet();
      root.show_face_reading({
        mood_id: mood_id,
        label: label,
        link_text: link_text,
        is_lead_visible: card.is_lead_visible,
        is_caution_visible: card.is_caution_visible,
        lead_text: card.lead_text,
        caution_text: card.caution_text,
        quotes: card.quotes,
      });
    } catch (error) {
      console.error("얼굴을 읽지 못했습니다. 다시 찍어 주세요.", error);
      show_camera_message(message_element, REFRAME_MESSAGE);
    } finally {
      is_reading = false;
      if (is_sheet_open) {
        shutter.disabled = false;
      }
    }
  }

  /**
   * 버튼, 음악 질문, 화면 전환과 촬영 창을 연결합니다.
   */
  function start_face_read() {
    try {
      const open_button = require_element("camera_open");
      const trace_button = require_element("camera_trace_toggle");
      const sheet = require_element("camera_sheet");
      const shutter = require_element("camera_shutter");
      const close_button = require_element("camera_close");
      const offer = document.getElementById("music_offer");
      if (!open_button || !trace_button || !sheet || !shutter || !close_button) {
        return;
      }
      sync_trace_button();
      trace_button.addEventListener("click", function on_trace_toggle() {
        is_trace_visible = !is_trace_visible;
        sync_trace_button();
      });
      open_button.addEventListener("click", function on_camera_open() {
        if (offer && !offer.hidden) {
          is_waiting_music = true;
          return;
        }
        open_sheet();
      });
      if (offer) {
        const observer = new MutationObserver(function on_offer_change() {
          if (!is_waiting_music || !offer.hidden) {
            return;
          }
          is_waiting_music = false;
          if (document.documentElement.dataset.design === "aurora") {
            open_sheet();
          }
        });
        observer.observe(offer, { attributes: true, attributeFilter: ["hidden"] });
      }
      shutter.addEventListener("click", function on_shutter() {
        capture_face();
      });
      close_button.addEventListener("click", close_sheet);
      sheet.addEventListener("click", function on_backdrop(event) {
        if (event.target === sheet) {
          close_sheet();
        }
      });
      document.addEventListener("keydown", function on_escape(event) {
        if (event.key === "Escape" && is_sheet_open) {
          close_sheet();
        }
      });
      document.addEventListener("today_word_design_change", close_sheet);
    } catch (error) {
      console.error("얼굴 촬영을 준비하지 못했습니다. 감정을 직접 고른 뒤 뽑아 주세요.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start_face_read);
  } else {
    start_face_read();
  }
})();

/**
 * 오로라에서 앞 카메라로 표정과 윤곽을 읽습니다.
 * 사진은 판독이 끝나는 즉시 버리고, 형태가 고른 두 칸에 그 기분의 문장을 올립니다.
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
  // 방금 본 얼굴을 향해 하는 말입니다. 고른 칸을 설명하지 않습니다.
  const FACE_LINKS = {
    "joy|long": "웃음이 멀리 보는 얼굴에 걸려 있습니다. 오늘은 그 기쁨으로 멀리 있는 일 하나만 손안에 두어도 좋습니다.",
    "joy|round": "웃음이 부드러운 얼굴에 고여 있습니다. 오늘은 그 온기를 곁의 한 사람에게 먼저 건네 보세요.",
    "joy|angular": "웃음이 단정한 얼굴 위에 있습니다. 기쁜 날에도 지킬 선 하나만 친절하게 말해도 충분합니다.",
    "joy|balanced": "웃음이 고른 얼굴 한가운데 있습니다. 오늘은 그 기쁨으로 여러 일 중 하나만 골라도 됩니다.",
    "calm|long": "힘주지 않은 얼굴이 길게 이어집니다. 서두르지 말고, 시선이 머무는 한 곳만 오늘의 자리로 두세요.",
    "calm|round": "잔잔한 표정이 부드러운 얼굴에 있습니다. 오늘은 가까운 온기를 바꾸려 애쓰지 않아도 됩니다.",
    "calm|angular": "잔잔한 표정이 단정한 얼굴과 있습니다. 목소리를 높이지 않아도, 지킬 선은 짧게 말할 수 있습니다.",
    "calm|balanced": "잔잔한 표정이 고른 얼굴과 있습니다. 오늘은 여러 일 가운데 하나만 남겨도 충분합니다.",
    "excited|long": "눈이 열린 얼굴이 멀리까지 이어집니다. 설렘은 크게 두되, 오늘의 첫 걸음은 작게 두세요.",
    "excited|round": "눈이 열린 얼굴이 부드럽게 둥글어 있습니다. 그 설렘을 곁의 한 사람과 작은 약속으로 나눠도 좋습니다.",
    "excited|angular": "눈이 열린 얼굴이 단정하게 있습니다. 기대가 커도, 넘지 않을 선 하나만 먼저 말해 두세요.",
    "excited|balanced": "눈이 열린 얼굴이 고르게 앉아 있습니다. 설렘 가운데 오늘 만질 수 있는 하나만 고르세요.",
    "anxious|long": "모인 미간이 긴 얼굴과 있습니다. 멀리 있는 걱정은 오늘 적을 수 있는 한 줄로 줄여도 됩니다.",
    "anxious|round": "모인 미간이 부드러운 얼굴에 있습니다. 사람을 의심하기보다, 확인할 말 한 줄만 고르세요.",
    "anxious|angular": "모인 미간이 단정한 얼굴과 있습니다. 불안할수록 지킬 선은 감정 대신 사실로만 그으세요.",
    "anxious|balanced": "모인 미간이 고른 얼굴과 있습니다. 여러 갈래의 걱정 대신, 오늘 확인할 하나만 두세요.",
    "tired|long": "힘이 빠진 눈이 긴 얼굴과 있습니다. 멀리 있는 일은 오늘 내려놓아도 괜찮은 신호입니다.",
    "tired|round": "힘이 빠진 눈이 부드러운 얼굴에 있습니다. 오늘은 남을 더 챙기기보다, 나의 쉼을 먼저 두세요.",
    "tired|angular": "힘이 빠진 눈이 단정한 얼굴과 있습니다. 선은 짧게 지키되, 속도는 낮춰도 됩니다.",
    "tired|balanced": "힘이 빠진 눈이 고른 얼굴과 있습니다. 오늘의 목록을 하나로 줄여도 충분합니다.",
    "sad|long": "내려앉은 입꼬리가 긴 얼굴과 있습니다. 먼 앞날을 오늘 판단하지 않아도 됩니다.",
    "sad|round": "내려앉은 입꼬리가 부드러운 얼굴에 있습니다. 곁의 온기를 밀어내지 않아도, 슬픔은 머물 수 있습니다.",
    "sad|angular": "내려앉은 입꼬리가 단정한 얼굴과 있습니다. 단호함은 남을 향하지 말고, 나를 지키는 말에 쓰세요.",
    "sad|balanced": "내려앉은 입꼬리가 고른 얼굴과 있습니다. 슬픔이 하루 전체를 덮지 않게, 한 칸만 내어 주세요.",
  };
  const SHAPE_MEETINGS = {
    long: "긴 결을 만났습니다",
    round: "둥근 결을 만났습니다",
    angular: "단정한 결을 만났습니다",
    balanced: "고른 결을 만났습니다",
  };
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
  const pair_offsets = {};

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
   * 표정 점수를 기분 하나로 바꿉니다. 신호가 약하면 평온입니다.
   */
  function read_mood(categories) {
    const scores = {};
    (categories || []).forEach(function keep_score(item) {
      if (item && item.categoryName) {
        scores[item.categoryName] = item.score || 0;
      }
    });
    const smile = ((scores.mouthSmileLeft || 0) + (scores.mouthSmileRight || 0)) / 2;
    const frown = ((scores.mouthFrownLeft || 0) + (scores.mouthFrownRight || 0)) / 2;
    const brow_up = scores.browInnerUp || 0;
    const brow_down = ((scores.browDownLeft || 0) + (scores.browDownRight || 0)) / 2;
    const eye_wide = ((scores.eyeWideLeft || 0) + (scores.eyeWideRight || 0)) / 2;
    const blink = ((scores.eyeBlinkLeft || 0) + (scores.eyeBlinkRight || 0)) / 2;
    const squint = ((scores.eyeSquintLeft || 0) + (scores.eyeSquintRight || 0)) / 2;

    if (smile >= 0.35 && smile >= frown) {
      return "joy";
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
   * 형태가 두 칸을 고르고, 기분이 그 칸의 문장과 격언을 고릅니다.
   * 같은 짝을 다시 찍으면 문장과 격언이 함께 다음 번호로 넘어갑니다.
   */
  function pick_face_card(mood_id, shape_id) {
    try {
      const parts = FACE_SHAPE_PARTS[shape_id];
      const categories = FACE_QUOTE_CATEGORIES[mood_id];
      const phrases = root.PHRASES && root.PHRASES[mood_id];
      if (!parts || !categories || !Array.isArray(phrases) || phrases.length === 0) {
        console.error("얼굴 추천에 쓸 기분이나 형태가 없습니다.", mood_id, shape_id);
        return null;
      }
      const key = mood_id + "|" + shape_id;
      const offset = pair_offsets[key] || 0;
      const phrase = phrases[offset % phrases.length];
      if (!phrase || !phrase.lead || !phrase.caution) {
        console.error("기분 문장의 모양이 올바르지 않습니다.", mood_id);
        return null;
      }
      const quotes = [];
      for (let index = 0; index < parts.quote_keys.length; index += 1) {
        const quote = quote_at(categories[parts.quote_keys[index]], offset);
        if (!quote) {
          return null;
        }
        quotes.push(quote);
      }
      if (quotes.length === 2 && quotes[0].category === quotes[1].category) {
        console.error("두 격언의 분류가 같습니다.", mood_id);
        return null;
      }
      const link_text = FACE_LINKS[key] || "";
      if (!link_text) {
        console.error("이 얼굴과 문장을 잇는 글이 없습니다.", mood_id, shape_id);
        return null;
      }
      pair_offsets[key] = offset + 1;
      return {
        is_lead_visible: parts.is_lead_visible,
        is_caution_visible: parts.is_caution_visible,
        lead_text: phrase.lead,
        caution_text: phrase.caution,
        quotes: quotes,
        link_text: link_text,
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
   * 얼굴 읽기 모델을 한 번만 받습니다. 그래픽 가속이 안 되면 기본 방식으로 다시 엽니다.
   */
  async function ensure_landmarker() {
    if (landmarker) {
      return landmarker;
    }
    const vision = await import(VISION_URL);
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    const base_options = {
      modelAssetPath: MODEL_URL,
      delegate: "GPU",
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
   * 다음 카메라 화면이 그려질 때까지 기다립니다.
   */
  function wait_frame(video) {
    return new Promise(function settle(resolve) {
      if (video && typeof video.requestVideoFrameCallback === "function") {
        video.requestVideoFrameCallback(function on_frame() {
          resolve();
        });
        return;
      }
      window.setTimeout(resolve, 80);
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
    const context = canvas.getContext("2d", { alpha: false });
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
   * 휴대폰을 세우면 카메라 원본만 가로인 경우가 있습니다. 그때 돌릴 각도를 고릅니다.
   */
  function turns_for(video) {
    const is_portrait_screen = window.innerHeight > window.innerWidth + 40;
    const is_landscape_buffer = video.videoWidth > video.videoHeight;
    if (!is_portrait_screen || !is_landscape_buffer) {
      return [0];
    }
    if (has_frame_turn) {
      return [frame_turn];
    }
    return [0, -90, 90];
  }

  /**
   * 화면에 보이는 방향과 같게 자릅니다. 사진은 호출한 쪽에서 지웁니다.
   */
  function paint_visible(video, turn) {
    const view_width = video.clientWidth || video.videoWidth;
    const view_height = video.clientHeight || video.videoHeight;
    if (!turn) {
      const crop = cover_rect(video.videoWidth, video.videoHeight, view_width, view_height);
      return crop ? paint_crop(video, crop) : null;
    }
    const upright_width = video.videoHeight;
    const upright_height = video.videoWidth;
    const upright = document.createElement("canvas");
    upright.width = upright_width;
    upright.height = upright_height;
    const context = upright.getContext("2d", { alpha: false });
    if (!context) {
      console.error("휴대폰 화면을 돌리지 못했습니다.");
      return null;
    }
    if (turn === 90) {
      context.translate(upright_width, 0);
      context.rotate(Math.PI / 2);
    } else {
      context.translate(0, upright_height);
      context.rotate(-Math.PI / 2);
    }
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const crop = cover_rect(upright_width, upright_height, view_width, view_height);
    const painted = crop ? paint_crop(upright, crop) : null;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, upright_width, upright_height);
    upright.width = 0;
    upright.height = 0;
    return painted;
  }

  /**
   * 지금 화면에 분석 가능한 얼굴이 있는지 봅니다.
   */
  function look_at_video(video, is_quiet) {
    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }
    const turns = turns_for(video);
    for (let index = 0; index < turns.length; index += 1) {
      const turn = turns[index];
      const painted = paint_visible(video, turn);
      if (!painted) {
        continue;
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
      wipe_canvas(painted);
      if (found && is_face_in_frame(found.landmarks, is_quiet)) {
        frame_turn = turn;
        has_frame_turn = true;
        return found;
      }
    }
    return null;
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
              set_frame_ready(Boolean(found));
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
      if (found) {
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
      const mood_id = read_mood(found.blendshapes ? found.blendshapes.categories : []);
      const card = pick_face_card(mood_id, shape_id);
      const shape_meeting = SHAPE_MEETINGS[shape_id] || "";
      const mood_name = mood_label(mood_id);
      if (!card || !shape_meeting || !mood_name || typeof root.show_face_reading !== "function") {
        console.error("얼굴 추천 글을 고르지 못했습니다. 다시 찍어 주세요.");
        show_camera_message(message_element, PICK_MESSAGE);
        return;
      }
      close_sheet();
      root.show_face_reading({
        mood_id: mood_id,
        label: mood_name + "이 " + shape_meeting,
        link_text: card.link_text,
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
      const sheet = require_element("camera_sheet");
      const shutter = require_element("camera_shutter");
      const close_button = require_element("camera_close");
      const offer = document.getElementById("music_offer");
      if (!open_button || !sheet || !shutter || !close_button) {
        return;
      }
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

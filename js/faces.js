/**
 * 오로라 모드에서만 쓰는 캐릭터 그림입니다. 타로의 풍경 사진과는 다른 덱입니다.
 * 사람 얼굴 대신, 기분마다 표정이 다른 밤 캐릭터를 네 장씩 두었습니다.
 * 이 그림은 이 화면을 위해 만든 것이라 사진 출처를 붙이지 않습니다.
 */
(function init_faces() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  root.FACE_FOLDER = "images/faces/";

  root.FACE_VIGNETTES = {
    joy: [
      { file: "joy/open_laugh.jpg", caption: "환한 웃음" },
      { file: "joy/soft_smile.jpg", caption: "따뜻한 미소" },
      { file: "joy/wink.jpg", caption: "살며시 웃음" },
      { file: "joy/closed_smile.jpg", caption: "눈웃음" },
    ],
    calm: [
      { file: "calm/moon_sit.jpg", caption: "고요한 숨" },
      { file: "calm/still_stand.jpg", caption: "잠잠한 밤" },
      { file: "calm/folded_hands.jpg", caption: "모은 손" },
      { file: "calm/float.jpg", caption: "떠 있는 평온" },
    ],
    excited: [
      { file: "excited/blush_heart.jpg", caption: "두근거림" },
      { file: "excited/shy_hands.jpg", caption: "가린 설렘" },
      { file: "excited/spark_eyes.jpg", caption: "반짝이는 눈" },
      { file: "excited/cheek.jpg", caption: "볼이 붉은 밤" },
    ],
    anxious: [
      { file: "anxious/hunched.jpg", caption: "움츠린 마음" },
      { file: "anxious/wide_eyes.jpg", caption: "커진 눈" },
      { file: "anxious/glance.jpg", caption: "곁눈질" },
      { file: "anxious/knees.jpg", caption: "끌어안은 걱정" },
    ],
    tired: [
      { file: "tired/yawn.jpg", caption: "하품" },
      { file: "tired/droop.jpg", caption: "감기는 눈" },
      { file: "tired/slump.jpg", caption: "주저앉은 피곤" },
      { file: "tired/rub_eye.jpg", caption: "비빈 눈" },
    ],
    sad: [
      { file: "sad/teary.jpg", caption: "글썽인 눈" },
      { file: "sad/downcast.jpg", caption: "가라앉은 마음" },
      { file: "sad/held.jpg", caption: "안은 슬픔" },
      { file: "sad/bow.jpg", caption: "고개 숙인 밤" },
    ],
  };
})();

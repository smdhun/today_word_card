/**
 * 타로에서 뒤집는 카드 22장입니다. 0번 바보부터 21번 세계까지입니다.
 * name은 그림 설명에만 쓰고, 카드 아래에는 보이지 않습니다.
 * insight는 오늘 붙들 한 줄이고, question은 스스로에게 던지는 질문입니다.
 * 운세나 앞으로 일어날 일은 적지 않습니다.
 */
(function init_tarot_cards() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  root.TAROT_FOLDER = "images/tarot/";
  root.TAROT_BACK = "back.jpg";

  root.TAROT_CARDS = [
    {
      id: 0,
      name: "바보",
      file: "tarot-00-fool.jpg",
      insight: "익숙한 길을 한 걸음만 벗어나도, 오늘은 새 출발이 됩니다.",
      question: "오늘 시작을 망설이는 일 가운데, 완벽하지 않아도 열어 볼 것은 무엇인가.",
    },
    {
      id: 1,
      name: "마법사",
      file: "tarot-01-magician.jpg",
      insight: "이미 손에 있는 것부터 쓰면, 오늘은 충분해집니다.",
      question: "오늘 더 가지려 하기 전에, 이미 내 손에 있는 것은 무엇인가.",
    },
    {
      id: 2,
      name: "여사제",
      file: "tarot-02-priestess.jpg",
      insight: "바로 답하지 않아도, 오늘은 듣는 쪽이 더 또렷합니다.",
      question: "오늘 서둘러 정한 일 가운데, 하루만 더 들어 보면 달라질 것은 무엇인가.",
    },
    {
      id: 3,
      name: "여황제",
      file: "tarot-03-empress.jpg",
      insight: "키우는 마음은 거창한 결심보다, 오늘의 작은 돌봄에서 자랍니다.",
      question: "오늘 내가 돌볼 수 있는 것 가운데, 가장 가까운 것은 무엇인가.",
    },
    {
      id: 4,
      name: "황제",
      file: "tarot-04-emperor.jpg",
      insight: "오늘의 자리는 굳센 고집이 아니라, 지킬 선을 분명히 할 때 편안해집니다.",
      question: "오늘 양보하지 않아도 되는 선은 어디인가.",
    },
    {
      id: 5,
      name: "교황",
      file: "tarot-05-hierophant.jpg",
      insight: "새 방법만 찾을 필요는 없습니다. 이미 배운 좋은 길을 오늘 한 번 더 쓰면 됩니다.",
      question: "오늘 다시 써먹을 수 있는, 예전에 배운 좋은 방법은 무엇인가.",
    },
    {
      id: 6,
      name: "연인",
      file: "tarot-06-lovers.jpg",
      insight: "오늘의 선택은 누구를 이길지가 아니라, 무엇을 가까이 둘지의 문제입니다.",
      question: "오늘 둘 중 하나를 고른다면, 내 하루에 더 따뜻한 것은 어느 쪽인가.",
    },
    {
      id: 7,
      name: "전차",
      file: "tarot-07-chariot.jpg",
      insight: "속도보다 방향입니다. 오늘은 가고 있는 곳만 확인해도 충분합니다.",
      question: "오늘 바쁘게 움직이는 일 가운데, 정말 그쪽으로 가고 싶은 것은 무엇인가.",
    },
    {
      id: 8,
      name: "힘",
      file: "tarot-08-strength.jpg",
      insight: "오늘은 세게 밀어붙이는 힘보다, 부드럽게 자리를 지키는 힘이 필요합니다.",
      question: "오늘 힘주어 누르기보다, 가만히 곁에 둬도 되는 것은 무엇인가.",
    },
    {
      id: 9,
      name: "은둔자",
      file: "tarot-09-hermit.jpg",
      insight: "잠시 혼자 있는 시간은 도망이 아니라, 오늘을 다시 보는 등불이 됩니다.",
      question: "오늘 누구에게도 보여 주지 않고, 나만 알고 싶은 마음은 무엇인가.",
    },
    {
      id: 10,
      name: "수레바퀴",
      file: "tarot-10-wheel.jpg",
      insight: "돌아가는 것 가운데 오늘은 붙잡을 것과 놓아도 되는 것이 갈립니다.",
      question: "오늘 애써 멈추려 하지 않아도, 스스로 지나가게 둘 일은 무엇인가.",
    },
    {
      id: 11,
      name: "정의",
      file: "tarot-11-justice.jpg",
      insight: "오늘은 이기는 판단보다, 양쪽을 같은 거리로 보는 판단이 필요합니다.",
      question: "오늘 내가 한쪽으로만 기울여 본 일은 무엇인가.",
    },
    {
      id: 12,
      name: "매달린 사람",
      file: "tarot-12-hanged.jpg",
      insight: "오늘은 더 달리지 않고 멈추는 쪽이, 다음 걸음을 분명하게 만듭니다.",
      question: "오늘 바로 결론내지 않고, 잠시 뒤집어 보면 달라질 일은 무엇인가.",
    },
    {
      id: 13,
      name: "죽음",
      file: "tarot-13-death.jpg",
      insight: "끝나는 것을 인정하면, 오늘은 그 자리에 다른 것이 앉을 수 있습니다.",
      question: "오늘 이미 끝난 것을 아직 붙들고 있는 일은 무엇인가.",
    },
    {
      id: 14,
      name: "절제",
      file: "tarot-14-temperance.jpg",
      insight: "오늘은 한쪽만 따르기보다, 두 마음을 조금씩 섞어 가도 됩니다.",
      question: "오늘 전부 하거나 전부 그만두기 사이에, 조금만 해도 되는 것은 무엇인가.",
    },
    {
      id: 15,
      name: "악마",
      file: "tarot-15-devil.jpg",
      insight: "오늘 나를 잡는 것은 거창한 적이 아니라, 익숙해서 못 놓는 습관일 수 있습니다.",
      question: "오늘 하기 싫으면서도 반복하는 것은 무엇인가.",
    },
    {
      id: 16,
      name: "탑",
      file: "tarot-16-tower.jpg",
      insight: "예상이 어긋난 자리는, 오늘은 탓할 곳보다 다시 쌓을 자리가 됩니다.",
      question: "오늘 무너진 예상 가운데, 사실 처음부터 약했던 것은 무엇인가.",
    },
    {
      id: 17,
      name: "별",
      file: "tarot-17-star.jpg",
      insight: "지금은 또렷하지 않아도, 발을 디딜 자리는 있습니다.",
      question: "오늘 확신이 없어 멈춘 일 가운데, 정보만 더 있으면 되는 것은 무엇인가.",
    },
    {
      id: 18,
      name: "달",
      file: "tarot-18-moon.jpg",
      insight: "오늘은 모든 것을 밝히려 하지 않아도, 한 발만 디딜 수 있습니다.",
      question: "오늘 흐릿해서 미룬 일 가운데, 일단 이름만 붙여도 되는 것은 무엇인가.",
    },
    {
      id: 19,
      name: "태양",
      file: "tarot-19-sun.jpg",
      insight: "오늘은 숨긴 좋은 것을 한 군데만 밝혀도, 하루가 따뜻해집니다.",
      question: "오늘 혼자만 알고 있기보다, 가까이 있는 사람에게 보여 줄 것은 무엇인가.",
    },
    {
      id: 20,
      name: "심판",
      file: "tarot-20-judgement.jpg",
      insight: "지난 일을 재판하는 날이 아닙니다. 오늘은 그 일에서 가져올 한 가지만 고르면 됩니다.",
      question: "오늘 과거를 다시 꺼낸다면, 탓 대신 건져 올 것은 무엇인가.",
    },
    {
      id: 21,
      name: "세계",
      file: "tarot-21-world.jpg",
      insight: "오늘은 새 시작보다, 이미 온 길을 한 바퀴 둘러보는 날이 될 수 있습니다.",
      question: "오늘 끝맺으면 마음이 놓일 일은 무엇인가.",
    },
  ];
})();

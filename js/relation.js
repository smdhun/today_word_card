/**
 * 인간관계 화면의 장 이동과 상황별 문장을 바꿉니다.
 * 글 내용은 화면 HTML에 있고, 이 파일은 고르는 동작만 맡습니다.
 */
(function init_relation() {
  const root = window.TodayWordCard || {};

  const scenarios = [
    {
      title: "비꼬거나 빈정거릴 때의 대처",
      quote: "그런 식의 표현은 다소 불편하게 들립니다. 업무와 직접 관련된 내용으로 이어서 이야기해 주시면 감사하겠습니다.",
      advice: "비꼼에 감정으로 맞서면 말려듭니다. 감정 표현을 객관화하고 대화의 축을 다시 업무로 돌려세우는 것이 가장 확실한 차단막입니다.",
    },
    {
      title: "은근슬쩍 업무를 떠넘길 때",
      quote: "현재 제가 전담 중인 마감 업무가 있어 추가 투입은 어렵습니다. 우선순위 조율을 위해 먼저 협의해 주시겠어요?",
      advice: "감정적 거절 대신, 지금 맡은 일과 우선순위를 방패로 삼으세요.",
    },
    {
      title: "의도적으로 감정적 언쟁을 유도할 때",
      quote: "지금은 서로 감정이 격해 해결책을 찾기 어렵습니다. 차분히 정돈된 뒤 다시 논의하시죠.",
      advice: "상대가 던진 감정의 미끼를 물지 마세요. 대화를 잠시 미루는 것이 통제권을 쥐는 길입니다.",
    },
    {
      title: "불필요하게 사적인 영역을 파고들 때",
      quote: "저는 직장에서는 공적인 일에 집중할 때 마음이 편안합니다. 개인적인 부분은 양해해 주시면 감사하겠습니다.",
      advice: "사적 영역을 내어줄수록 가십과 무례의 표적이 되기 쉽습니다. 선을 분명히 그으세요.",
    },
  ];

  /**
   * 안내 한 줄을 보여 줍니다. 실패해도 화면이 멈추지 않게 합니다.
   */
  function show_status(message) {
    try {
      const status = document.getElementById("relation_status");
      if (!status) {
        return;
      }
      status.textContent = message;
    } catch (error) {
      console.error("인간관계 안내를 보여주지 못했습니다.", error);
    }
  }

  /**
   * 고른 상황의 할 말과 설명을 바꿉니다.
   */
  function show_scenario(index) {
    try {
      const scenario = scenarios[index];
      const title = document.getElementById("relation_speech_title");
      const quote = document.getElementById("relation_speech_quote");
      const advice = document.getElementById("relation_speech_advice");
      if (!scenario || !title || !quote || !advice) {
        console.error("상황 문장을 찾지 못했습니다.", index);
        show_status("문장을 바꾸지 못했습니다. 상황을 다시 눌러 주세요.");
        return;
      }
      title.textContent = scenario.title;
      quote.textContent = scenario.quote;
      advice.textContent = scenario.advice;
      document.querySelectorAll("[data-scenario]").forEach(function mark_scenario(button) {
        button.setAttribute("aria-pressed", button.dataset.scenario === String(index) ? "true" : "false");
      });
    } catch (error) {
      console.error("상황 문장을 바꾸지 못했습니다.", error);
      show_status("문장을 바꾸지 못했습니다. 상황을 다시 눌러 주세요.");
    }
  }

  /**
   * 고른 장으로 화면을 옮깁니다. 전체 보기는 글의 맨 위로 갑니다.
   */
  function show_chapter(tab) {
    try {
      const target_id = tab.dataset.relationTab;
      document.querySelectorAll("[data-relation-tab]").forEach(function mark_tab(button) {
        button.setAttribute("aria-pressed", button === tab ? "true" : "false");
      });
      const target = target_id === "all" ? document.getElementById("relation_guide") : document.getElementById(target_id);
      if (!target) {
        console.error("이동할 장을 찾지 못했습니다.", target_id);
        return;
      }
      const is_reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "start", behavior: is_reduced ? "auto" : "smooth" });
    } catch (error) {
      console.error("장으로 이동하지 못했습니다.", error);
      show_status("장을 열지 못했습니다. 다시 눌러 주세요.");
    }
  }

  /**
   * 지금 보이는 할 말을 복사합니다.
   */
  async function copy_quote() {
    try {
      const quote = document.getElementById("relation_speech_quote");
      if (!quote || !navigator.clipboard) {
        show_status("복사에 실패했습니다. 문장을 드래그해서 직접 복사해 주세요.");
        return;
      }
      await navigator.clipboard.writeText(quote.textContent);
      show_status(root.MESSAGES && root.MESSAGES.copy_done ? root.MESSAGES.copy_done : "문장을 복사했습니다.");
    } catch (error) {
      console.error("상황 문장을 복사하지 못했습니다.", error);
      show_status("복사에 실패했습니다. 문장을 드래그해서 직접 복사해 주세요.");
    }
  }

  /**
   * 장 버튼, 상황 버튼, 복사 버튼을 연결합니다.
   */
  function start_relation() {
    try {
      const guide = document.getElementById("relation_guide");
      if (!guide) {
        console.error("인간관계 글을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
        return;
      }
      guide.querySelectorAll("[data-relation-tab]").forEach(function attach_tab(button) {
        button.addEventListener("click", function on_tab() {
          show_chapter(button);
        });
      });
      guide.querySelectorAll("[data-scenario]").forEach(function attach_scenario(button) {
        button.addEventListener("click", function on_scenario() {
          show_scenario(Number(button.dataset.scenario));
        });
      });
      const copy_button = document.getElementById("relation_copy");
      if (copy_button) {
        copy_button.addEventListener("click", copy_quote);
      }
    } catch (error) {
      console.error("인간관계 화면을 시작하지 못했습니다.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start_relation);
  } else {
    start_relation();
  }
})();

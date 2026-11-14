/**
 * 타로, 오로라, 인간관계 화면을 바꾸고, 고른 화면을 브라우저에 기억합니다.
 * 화면이 그려지기 전에 정해야 색이 깜빡이지 않으므로 head에서 불러옵니다.
 */
(function init_design() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 타로, 오로라, 인간관계 중 하나인지 확인합니다.
   */
  function is_known_design(design) {
    return (
      design === root.DESIGN_TAROT ||
      design === root.DESIGN_AURORA ||
      design === root.DESIGN_RELATION
    );
  }

  /**
   * 고른 디자인을 저장합니다. 성공하면 true를 돌려줍니다.
   * 다음 실행의 첫 화면은 이 값과 상관없이 오로라입니다.
   */
  function save_design(design) {
    try {
      window.localStorage.setItem(root.DESIGN_STORAGE_KEY, design);
      return true;
    } catch (error) {
      console.error("디자인을 기억해 두지 못했습니다.", error);
      return false;
    }
  }

  /**
   * html 태그에 디자인을 적습니다. 색과 배치는 css가 이 값을 보고 바꿉니다.
   */
  function apply_design(design) {
    try {
      const safe_design = is_known_design(design) ? design : root.DESIGN_DEFAULT;
      document.documentElement.dataset.design = safe_design;
      mark_pressed_button(safe_design);
    } catch (error) {
      console.error("디자인을 적용하지 못했습니다.", error);
    }
  }

  /**
   * 지금 고른 디자인 버튼만 눌린 상태로 표시합니다.
   */
  function mark_pressed_button(design) {
    try {
      document.querySelectorAll("[data-design-button]").forEach(function mark_button(button) {
        const is_pressed = button.dataset.design === design;
        button.setAttribute("aria-pressed", is_pressed ? "true" : "false");
      });
    } catch (error) {
      console.error("디자인 버튼 표시를 바꾸지 못했습니다.", error);
    }
  }

  /**
   * 디자인은 바뀌었지만 기억하지 못했을 때 다음 행동을 알려 줍니다.
   */
  function show_save_notice() {
    try {
      const status_message = document.getElementById("status_message");
      if (status_message && root.MESSAGES) {
        status_message.textContent = root.MESSAGES.design_save_failed;
      }
    } catch (error) {
      console.error("디자인 안내를 보여주지 못했습니다.", error);
    }
  }

  /**
   * 화면 안내를 이미 치운 브라우저인지 확인합니다.
   * 서랍을 읽지 못하면 안내를 다시 보여 줍니다.
   */
  function has_seen_design_hint() {
    try {
      if (!window.localStorage || !root.DESIGN_HINT_KEY) {
        return false;
      }
      return window.localStorage.getItem(root.DESIGN_HINT_KEY) === "seen";
    } catch (error) {
      console.error("화면 안내 기록을 읽지 못했습니다.", error);
      return false;
    }
  }

  /**
   * 화면 안내를 본 것으로 기록합니다. 실패해도 카드 사용은 그대로 둡니다.
   */
  function remember_design_hint() {
    try {
      if (!window.localStorage || !root.DESIGN_HINT_KEY) {
        return false;
      }
      window.localStorage.setItem(root.DESIGN_HINT_KEY, "seen");
      return true;
    } catch (error) {
      console.error("화면 안내를 기억해 두지 못했습니다. 다음 방문 때 안내가 다시 나올 수 있습니다.", error);
      return false;
    }
  }

  /**
   * 화면 안내를 숨기고, 이 브라우저에서는 다시 나오지 않게 기록합니다.
   */
  function hide_design_hint() {
    try {
      const hint = document.getElementById("design_hint");
      if (!hint || hint.hidden) {
        return;
      }
      hint.hidden = true;
      hint.classList.remove("is_showing");
      remember_design_hint();
    } catch (error) {
      console.error("화면 안내를 닫지 못했습니다.", error);
    }
  }

  /**
   * 처음 방문이면 세 버튼 아래 안내를 보여 줍니다.
   */
  function show_design_hint() {
    try {
      const hint = document.getElementById("design_hint");
      if (!hint) {
        console.error("화면 안내 칸을 찾지 못했습니다.");
        return;
      }
      if (has_seen_design_hint()) {
        return;
      }
      hint.hidden = false;
      hint.classList.add("is_showing");
    } catch (error) {
      console.error("화면 안내를 보여주지 못했습니다.", error);
    }
  }

  /**
   * 닫기를 누르면 안내만 치웁니다. 고른 화면은 바꾸지 않습니다.
   */
  function on_close_design_hint(event) {
    try {
      event.preventDefault();
      hide_design_hint();
    } catch (error) {
      console.error("화면 안내를 닫지 못했습니다.", error);
    }
  }

  /**
   * 버튼을 누르면 그 디자인으로 바꾸고 선택을 기억합니다.
   * 이미 선택된 버튼을 다시 눌러도 안내는 치웁니다.
   */
  function on_pick_design(event) {
    try {
      const button = event.currentTarget;
      const next_design = button && button.dataset ? button.dataset.design : "";
      if (!is_known_design(next_design)) {
        console.error("알 수 없는 디자인입니다.", next_design);
        return;
      }
      apply_design(next_design);
      if (!save_design(next_design)) {
        show_save_notice();
      }
      document.dispatchEvent(new CustomEvent("today_word_design_change"));
      hide_design_hint();
    } catch (error) {
      console.error("디자인을 바꾸지 못했습니다.", error);
    }
  }

  /**
   * 위쪽 띠의 타로, 오로라 버튼에 클릭 동작을 연결합니다.
   */
  function bind_design_buttons() {
    try {
      const buttons = document.querySelectorAll("[data-design-button]");
      if (!buttons.length) {
        console.error("디자인 버튼을 찾지 못했습니다.");
        return;
      }
      buttons.forEach(function attach(button) {
        button.addEventListener("click", on_pick_design);
      });
      const close_button = document.getElementById("design_hint_close");
      if (!close_button) {
        console.error("화면 안내의 닫기 버튼을 찾지 못했습니다.");
      } else {
        close_button.addEventListener("click", on_close_design_hint);
      }
      const current_design = document.documentElement.dataset.design;
      mark_pressed_button(is_known_design(current_design) ? current_design : root.DESIGN_DEFAULT);
      show_design_hint();
    } catch (error) {
      console.error("디자인 버튼을 연결하지 못했습니다.", error);
    }
  }

  /**
   * 디자인을 먼저 정하고, 버튼은 화면이 준비된 뒤에 연결합니다.
   */
  function start_design() {
    try {
      if (!root.DESIGN_STORAGE_KEY) {
        console.error("디자인 설정값을 불러오지 못했습니다.");
        return;
      }

      // 실행할 때마다 오로라로 시작합니다. 링크를 연 사람도 같은 화면을 먼저 봅니다.
      apply_design(root.DESIGN_DEFAULT);

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind_design_buttons);
      } else {
        bind_design_buttons();
      }
    } catch (error) {
      console.error("디자인을 시작하지 못했습니다.", error);
    }
  }

  start_design();
})();

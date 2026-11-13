/**
 * 타로와 오로라 디자인을 바꾸고, 고른 디자인을 브라우저에 기억합니다.
 * 화면이 그려지기 전에 정해야 색이 깜빡이지 않으므로 head에서 불러옵니다.
 */
(function init_design() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 타로 또는 오로라 중 하나인지 확인합니다.
   */
  function is_known_design(design) {
    return design === root.DESIGN_TAROT || design === root.DESIGN_AURORA;
  }

  /**
   * 사용자가 전에 고른 디자인을 꺼냅니다. 고른 적이 없으면 null입니다.
   */
  function load_saved_design() {
    try {
      const saved_design = window.localStorage.getItem(root.DESIGN_STORAGE_KEY);
      return is_known_design(saved_design) ? saved_design : null;
    } catch (error) {
      console.error("저장된 디자인을 읽지 못했습니다.", error);
      return null;
    }
  }

  /**
   * 고른 디자인을 저장합니다. 성공하면 true를 돌려줍니다.
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
      const tarot_button = document.getElementById("design_tarot");
      const aurora_button = document.getElementById("design_aurora");
      if (tarot_button) {
        tarot_button.setAttribute("aria-pressed", design === root.DESIGN_TAROT ? "true" : "false");
      }
      if (aurora_button) {
        aurora_button.setAttribute("aria-pressed", design === root.DESIGN_AURORA ? "true" : "false");
      }
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
   * 버튼을 누르면 그 디자인으로 바꾸고 선택을 기억합니다.
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
      const current_design = document.documentElement.dataset.design;
      mark_pressed_button(is_known_design(current_design) ? current_design : root.DESIGN_DEFAULT);
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

      apply_design(load_saved_design() || root.DESIGN_DEFAULT);

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

/**
 * 화이트 모드와 다크 모드를 바꾸고, 고른 모드를 브라우저에 기억합니다.
 * 화면이 그려지기 전에 색을 정해야 깜빡이지 않으므로 head에서 불러옵니다.
 */
(function init_theme() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  /**
   * 화이트 또는 다크 중 하나인지 확인합니다.
   */
  function is_known_theme(theme) {
    return theme === root.THEME_LIGHT || theme === root.THEME_DARK;
  }

  /**
   * 사용자가 전에 고른 모드를 꺼냅니다. 고른 적이 없으면 null입니다.
   */
  function load_saved_theme() {
    try {
      const saved_theme = window.localStorage.getItem(root.THEME_STORAGE_KEY);
      return is_known_theme(saved_theme) ? saved_theme : null;
    } catch (error) {
      console.error("저장된 화면 모드를 읽지 못했습니다.", error);
      return null;
    }
  }

  /**
   * 고른 모드를 저장합니다. 성공하면 true를 돌려줍니다.
   */
  function save_theme(theme) {
    try {
      window.localStorage.setItem(root.THEME_STORAGE_KEY, theme);
      return true;
    } catch (error) {
      console.error("화면 모드를 기억해 두지 못했습니다.", error);
      return false;
    }
  }

  /**
   * html 태그에 모드를 적습니다. 색은 css/style.css가 이 값을 보고 바꿉니다.
   */
  function apply_theme(theme) {
    try {
      const safe_theme = is_known_theme(theme) ? theme : root.THEME_DEFAULT;
      document.documentElement.dataset.theme = safe_theme;
    } catch (error) {
      console.error("화면 모드를 적용하지 못했습니다.", error);
    }
  }

  /**
   * 지금 화면에 적용된 모드를 읽습니다.
   */
  function get_current_theme() {
    const current_theme = document.documentElement.dataset.theme;
    return is_known_theme(current_theme) ? current_theme : root.THEME_DEFAULT;
  }

  /**
   * 모드는 바뀌었지만 기억하지 못했을 때 다음 행동을 알려 줍니다.
   */
  function show_save_notice() {
    try {
      const status_message = document.getElementById("status_message");
      if (status_message && root.MESSAGES) {
        status_message.textContent = root.MESSAGES.theme_save_failed;
      }
    } catch (error) {
      console.error("화면 모드 안내를 보여주지 못했습니다.", error);
    }
  }

  /**
   * 버튼을 누르면 반대 모드로 바꾸고 그 선택을 기억합니다.
   */
  function on_toggle() {
    try {
      const is_dark = get_current_theme() === root.THEME_DARK;
      const next_theme = is_dark ? root.THEME_LIGHT : root.THEME_DARK;
      apply_theme(next_theme);
      if (!save_theme(next_theme)) {
        show_save_notice();
      }
    } catch (error) {
      console.error("화면 모드를 바꾸지 못했습니다.", error);
    }
  }

  /**
   * 위쪽 띠의 모드 전환 버튼에 클릭 동작을 연결합니다.
   */
  function bind_toggle_button() {
    try {
      const toggle_button = document.getElementById("theme_toggle");
      if (!toggle_button) {
        console.error("화면 모드 버튼을 찾지 못했습니다.");
        return;
      }
      toggle_button.addEventListener("click", on_toggle);
    } catch (error) {
      console.error("화면 모드 버튼을 연결하지 못했습니다.", error);
    }
  }

  /**
   * 색을 먼저 정하고, 버튼은 화면이 준비된 뒤에 연결합니다.
   */
  function start_theme() {
    try {
      if (!root.THEME_STORAGE_KEY) {
        console.error("화면 모드 설정값을 불러오지 못했습니다.");
        return;
      }

      apply_theme(load_saved_theme() || root.THEME_DEFAULT);

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind_toggle_button);
      } else {
        bind_toggle_button();
      }
    } catch (error) {
      console.error("화면 모드를 시작하지 못했습니다.", error);
    }
  }

  start_theme();
})();

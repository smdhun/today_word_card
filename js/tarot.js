/**
 * 타로 카드를 이번 방문에서 한 번 섞고, 뒤집기마다 다음 장을 보여 줍니다.
 * 22장이 끝나면 다시 섞습니다. 서버에는 보내지 않고, 브라우저에도 저장하지 않습니다.
 */
(function init_tarot() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  let deck = [];
  let deck_index = 0;

  /**
   * 카드가 이름, 그림, 한 줄, 질문을 모두 가졌는지 확인합니다.
   */
  function is_card_ready(card) {
    return Boolean(card && card.name && card.file && card.insight && card.question);
  }

  /**
   * 0 이상 1 미만의 수를 만듭니다. 암호 난수를 먼저 쓰고, 없으면 일반 난수를 씁니다.
   */
  function random_unit() {
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        const values = new Uint32Array(1);
        window.crypto.getRandomValues(values);
        return values[0] / 4294967296;
      }
    } catch (error) {
      console.error("카드 순서를 위한 난수를 만들지 못했습니다. 일반 난수로 섞습니다.", error);
    }
    return Math.random();
  }

  /**
   * 22장을 이번 방문의 순서로 섞습니다. 같은 카드가 바로 다시 나오지 않게 한 바퀴를 채웁니다.
   */
  function shuffle_deck() {
    const source = Array.isArray(root.TAROT_CARDS) ? root.TAROT_CARDS.slice() : [];
    const ready = source.filter(is_card_ready);
    for (let index = ready.length - 1; index > 0; index -= 1) {
      const swap_index = Math.floor(random_unit() * (index + 1));
      const held = ready[index];
      ready[index] = ready[swap_index];
      ready[swap_index] = held;
    }
    deck = ready;
    deck_index = 0;
  }

  /**
   * 안내 문장을 카드 아래에 적습니다. 비우면 안내가 사라집니다.
   */
  function show_tarot_status(message) {
    const status = document.getElementById("status_message");
    if (!status) {
      return;
    }
    status.textContent = message || "";
  }

  /**
   * 이미지 아래 버튼 문구를 바꿉니다. 뒷면과 앞면의 말이 다릅니다.
   */
  function set_draw_label(label_text) {
    const button = document.getElementById("draw_button");
    const label = button ? button.querySelector(".label_tarot") : null;
    if (!label) {
      console.error("카드 고르기 문구를 찾지 못했습니다. 페이지를 새로고침해 주세요.");
      return;
    }
    label.textContent = label_text;
  }

  /**
   * 덮인 뒷면을 보여 줍니다. 순서는 바꾸지 않습니다.
   */
  function show_tarot_back() {
    try {
      const image = document.getElementById("tarot_image");
      const reading = document.getElementById("tarot_reading");
      if (!image || !reading || !root.TAROT_FOLDER || !root.TAROT_BACK) {
        console.error("타로 카드 칸을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
        return;
      }
      image.alt = "덮인 타로 카드";
      image.src = root.TAROT_FOLDER + root.TAROT_BACK + "?v=20261116m";
      reading.hidden = true;
      set_draw_label("오늘의 카드 고르기");
      show_tarot_status("");
    } catch (error) {
      console.error("카드 뒷면을 보여 주지 못했습니다. 페이지를 새로고침해 주세요.", error);
      show_tarot_status("카드를 열지 못했습니다. 페이지를 새로고침한 뒤 다시 뒤집어 주세요.");
    }
  }

  /**
   * 다음 카드의 앞면과 한 줄, 질문을 보여 줍니다.
   */
  function flip_tarot_card() {
    try {
      if (!deck.length) {
        shuffle_deck();
      }
      if (!deck.length) {
        console.error("뒤집을 타로 카드가 없습니다.");
        show_tarot_status("카드를 열지 못했습니다. 페이지를 새로고침한 뒤 다시 뒤집어 주세요.");
        return;
      }
      if (deck_index >= deck.length) {
        shuffle_deck();
      }
      const card = deck[deck_index];
      deck_index += 1;
      if (!is_card_ready(card)) {
        console.error("타로 카드의 내용이 비어 있습니다.", card);
        show_tarot_status("이 카드의 글을 열지 못했습니다. 다시 뒤집어 주세요.");
        return;
      }

      const image = document.getElementById("tarot_image");
      const name = document.getElementById("tarot_name");
      const insight = document.getElementById("tarot_insight");
      const question = document.getElementById("tarot_question");
      const reading = document.getElementById("tarot_reading");
      if (!image || !name || !insight || !question || !reading) {
        console.error("타로 카드 칸을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
        show_tarot_status("카드를 열지 못했습니다. 페이지를 새로고침한 뒤 다시 뒤집어 주세요.");
        return;
      }

      image.onload = function on_tarot_loaded() {
        image.onload = null;
      };
      image.onerror = function on_tarot_failed() {
        console.error("타로 카드 그림을 불러오지 못했습니다.", card.file);
        show_tarot_status("카드 그림을 불러오지 못했습니다. 다시 뒤집어 주세요.");
      };
      image.alt = card.name + " 카드";
      image.src = root.TAROT_FOLDER + card.file + "?v=20261115q";
      name.textContent = card.name;
      insight.textContent = card.insight;
      question.textContent = card.question;
      reading.hidden = false;
      set_draw_label("카드 다시 고르기");
      show_tarot_status("");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("타로 카드를 뒤집지 못했습니다. 다시 눌러 주세요.", error);
      show_tarot_status("카드를 뒤집지 못했습니다. 잠시 후 다시 눌러 주세요.");
    }
  }

  root.show_tarot_back = show_tarot_back;
  root.flip_tarot_card = flip_tarot_card;
})();

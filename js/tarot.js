/**
 * 타로 카드를 이번 방문에서 한 번 섞고, 뒤집기마다 다음 장을 보여 줍니다.
 * 22장이 끝나면 다시 섞습니다. 서버에는 보내지 않고, 브라우저에도 저장하지 않습니다.
 */
(function init_tarot() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  let deck = [];
  let deck_index = 0;
  let weave_token = 0;
  // 처음 타로 화면은 두 원 사이를 채우지 않습니다. 화면을 넘긴 뒤에 다시 오면 그립니다.
  let is_opening_plain = true;
  let weave_ready = null;
  let weave_image = null;

  /**
   * 움직임을 줄인 화면이면 그리지 않고 완성된 뒷면을 씁니다.
   */
  function prefers_still_motion() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /**
   * 원 사이 문양 그림을 한 번만 불러 옵니다.
   */
  function load_weave_images() {
    if (weave_ready) {
      return weave_ready;
    }
    weave_ready = new Promise(function (resolve, reject) {
      const filigree = new Image();
      filigree.onload = function () {
        weave_image = filigree;
        resolve(filigree);
      };
      filigree.onerror = function () {
        reject(new Error("weave image"));
      };
      filigree.src = root.TAROT_FOLDER + "filigree.png?v=20261117k";
    });
    return weave_ready;
  }

  /**
   * 얽힌 선을 짧은 조각으로 나눕니다. 조각은 여기저기서 이어집니다.
   */
  function build_line_pieces(source_canvas) {
    const width = source_canvas.width;
    const height = source_canvas.height;
    const cell = 7;
    const cols = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const sample = source_canvas.getContext("2d").getImageData(0, 0, width, height).data;
    const alive = new Uint8Array(cols * rows);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (sample[((y * width + x) * 4) + 3] > 24) {
          alive[(Math.floor(y / cell) * cols) + Math.floor(x / cell)] = 1;
        }
      }
    }

    const remaining = [];
    for (let index = 0; index < alive.length; index += 1) {
      if (alive[index]) {
        remaining.push(index);
      }
    }
    for (let index = remaining.length - 1; index > 0; index -= 1) {
      const swap_index = Math.floor(random_unit() * (index + 1));
      const held = remaining[index];
      remaining[index] = remaining[swap_index];
      remaining[swap_index] = held;
    }

    const open = new Set(remaining);
    const pieces = [];
    const directions = [-1, 1, -cols, cols];

    while (open.size && remaining.length) {
      const start = remaining.pop();
      if (!open.has(start)) {
        continue;
      }
      open.delete(start);
      const piece = [start];
      let current = start;
      let direction = directions[Math.floor(random_unit() * directions.length)];
      const length = 8 + Math.floor(random_unit() * 18);
      for (let step = 0; step < length; step += 1) {
        const next_list = [];
        directions.forEach(function (offset) {
          const next = current + offset;
          if (!open.has(next)) {
            return;
          }
          const same_row = offset === -1 || offset === 1;
          if (same_row && Math.floor(next / cols) !== Math.floor(current / cols)) {
            return;
          }
          next_list.push(offset);
        });
        if (!next_list.length) {
          break;
        }
        const preferred = next_list.indexOf(direction) >= 0 && random_unit() < 0.72
          ? direction
          : next_list[Math.floor(random_unit() * next_list.length)];
        current += preferred;
        direction = preferred;
        open.delete(current);
        piece.push(current);
      }
      pieces.push(piece);
    }

    const order = [];
    pieces.forEach(function (piece) {
      piece.forEach(function (index) {
        order.push(index);
      });
    });
    return { order: order, cell: cell, cols: cols };
  }

  /**
   * 그리기를 멈춥니다. 앞면으로 바꿀 때 호출합니다.
   */
  function clear_canvas(canvas_id) {
    const canvas = document.getElementById(canvas_id);
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * 지금 카드의 바탕 덮개입니다. 날아가는 복제 카드는 건드리지 않습니다.
   */
  function find_back_wash() {
    const frame = document.querySelector(".tarot_frame");
    const wash = frame ? frame.querySelector(".tarot_back_wash") : null;
    if (!wash) {
      console.error("카드 바탕 덮개를 찾지 못했습니다. 페이지를 새로고침해 주세요.");
    }
    return wash;
  }

  /**
   * 카드 뒷면은 남색으로 고정합니다. 검정 덮개는 올리지 않습니다.
   */
  function paint_back_wash() {
    const wash = find_back_wash();
    if (!wash) {
      return;
    }
    try {
      wash.style.opacity = "0";
    } catch (error) {
      console.error("카드 바탕색을 바꾸지 못했습니다. 페이지를 새로고침해 주세요.", error);
      wash.style.opacity = "0";
    }
  }

  let border_dim_ready_src = "";

  /**
   * 바깥 테두리의 금색 픽셀인지 확인합니다. 달과 안쪽 원은 빼 둡니다.
   */
  function is_outer_border_gold(x, y, width, height, red, green, blue) {
    const is_gold = red > 70 && red > blue + 18 && green + 15 > blue;
    if (!is_gold) {
      return false;
    }
    const edge = Math.min(x, y, width - 1 - x, height - 1 - y);
    const in_corner = (x < 180 || x > width - 180) && (y < 220 || y > height - 220);
    return edge <= 68 || (in_corner && edge <= 155);
  }

  /**
   * 바깥 금색 테두리만, 지금 밝기의 절반보다 조금 밝은 색으로 한 장 만들어 둡니다.
   */
  function ensure_border_dim() {
    const image = document.getElementById("tarot_image");
    const dim = document.getElementById("tarot_border_dim");
    if (!image || !dim || !image.naturalWidth || !image.complete) {
      return;
    }
    if (border_dim_ready_src === image.currentSrc && dim.width === image.naturalWidth) {
      return;
    }
    const view = dim.getContext("2d", { willReadFrequently: true });
    if (!view) {
      return;
    }
    dim.width = image.naturalWidth;
    dim.height = image.naturalHeight;
    view.drawImage(image, 0, 0, dim.width, dim.height);
    const frame = view.getImageData(0, 0, dim.width, dim.height);
    const data = frame.data;
    const darken = 0.55;
    for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
      const x = pixel % dim.width;
      const y = Math.floor(pixel / dim.width);
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      if (!is_outer_border_gold(x, y, dim.width, dim.height, red, green, blue)) {
        data[index + 3] = 0;
        continue;
      }
      data[index] = Math.round(red * darken);
      data[index + 1] = Math.round(green * darken);
      data[index + 2] = Math.round(blue * darken);
      data[index + 3] = 255;
    }
    view.putImageData(frame, 0, 0);
    border_dim_ready_src = image.currentSrc;
  }

  /**
   * 문양 진행에 맞춰 테두리와 그림자를 어두운색에서 지금 밝기까지 올립니다.
   * 0이면 가장 어둡고, 1이면 지금 밝기입니다. 카드 칸에 두면 테두리도 같이 받습니다.
   */
  function paint_border_rise(progress) {
    try {
      const stage = document.getElementById("tarot_stage");
      const dim = document.getElementById("tarot_border_dim");
      const amount = Math.max(0, Math.min(1, progress));
      if (stage) {
        stage.style.setProperty("--back_rise", String(amount));
      }
      if (!dim) {
        return;
      }
      ensure_border_dim();
      dim.style.opacity = String(1 - amount);
    } catch (error) {
      console.error("카드 테두리와 그림자 밝기를 바꾸지 못했습니다. 페이지를 새로고침해 주세요.", error);
    }
  }

  /**
   * 그리기를 멈춥니다. 앞면으로 바꿀 때 호출합니다.
   */
  function stop_back_weave() {
    weave_token += 1;
    clear_canvas("tarot_weave");
    clear_canvas("tarot_glint");
    const frame = document.querySelector(".tarot_frame");
    const wash = frame ? frame.querySelector(".tarot_back_wash") : null;
    if (wash) {
      wash.style.opacity = "0";
    }
    paint_border_rise(1);
  }

  /**
   * 두 원 사이의 문양을 흩어서 그리고, 그려지는 자리에 약한 빛을 남깁니다.
   */
  function start_back_weave() {
    const token = weave_token + 1;
    weave_token = token;
    const canvas = document.getElementById("tarot_weave");
    const glint = document.getElementById("tarot_glint");
    if (!canvas || !glint) {
      return;
    }
    paint_back_wash();
    paint_border_rise(0);
    load_weave_images().then(function (filigree) {
      if (token !== weave_token) {
        return;
      }
      const width = filigree.naturalWidth;
      const height = filigree.naturalHeight;
      if (!width || !height) {
        throw new Error("empty weave");
      }
      const source = document.createElement("canvas");
      source.width = width;
      source.height = height;
      source.getContext("2d").drawImage(filigree, 0, 0);
      const lines = build_line_pieces(source);
      canvas.width = width;
      canvas.height = height;
      glint.width = width;
      glint.height = height;
      const view = canvas.getContext("2d");
      const glint_view = glint.getContext("2d");
      view.clearRect(0, 0, width, height);
      glint_view.clearRect(0, 0, width, height);

      const started = performance.now();
      const line_ms = 4600;
      let drawn = 0;
      const glints = [];

      function paint_cell(index, now) {
        const x = (index % lines.cols) * lines.cell;
        const y = Math.floor(index / lines.cols) * lines.cell;
        view.drawImage(source, x, y, lines.cell, lines.cell, x, y, lines.cell, lines.cell);
        if (random_unit() < 0.018) {
          glints.push({
            x: x + lines.cell / 2,
            y: y + lines.cell / 2,
            born: now,
            life: 560
          });
        }
      }

      function paint_glints(now) {
        glint_view.clearRect(0, 0, width, height);
        const alive = [];
        glints.forEach(function (glint_dot) {
          const age = (now - glint_dot.born) / glint_dot.life;
          if (age >= 1) {
            return;
          }
          alive.push(glint_dot);
          const alpha = Math.sin(Math.PI * age);
          glint_view.fillStyle = "#f4e6c2";
          glint_view.globalAlpha = alpha * 0.22;
          glint_view.beginPath();
          glint_view.arc(glint_dot.x, glint_dot.y, 18, 0, Math.PI * 2);
          glint_view.fill();
          glint_view.globalAlpha = alpha * 0.55;
          glint_view.beginPath();
          glint_view.arc(glint_dot.x, glint_dot.y, 4, 0, Math.PI * 2);
          glint_view.fill();
        });
        glints.length = 0;
        alive.forEach(function (glint_dot) {
          glints.push(glint_dot);
        });
        glint_view.globalAlpha = 1;
      }

      function draw_lines(now) {
        if (token !== weave_token) {
          return;
        }
        const progress = Math.min(1, (now - started) / line_ms);
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const target = Math.floor(eased * lines.order.length);
        while (drawn < target) {
          paint_cell(lines.order[drawn], now);
          drawn += 1;
        }
        paint_glints(now);
        paint_border_rise(progress);
        if (progress < 1 || glints.length) {
          window.requestAnimationFrame(draw_lines);
        }
      }

      window.requestAnimationFrame(draw_lines);
    }).catch(function (error) {
      console.error("카드 무늬를 그리지 못했습니다. 완성된 뒷면을 보여 줍니다.", error);
      paint_back_wash();
      paint_border_rise(1);
      const image = document.getElementById("tarot_image");
      if (image && root.TAROT_FOLDER && root.TAROT_BACK) {
        image.src = root.TAROT_FOLDER + root.TAROT_BACK + "?v=20261116m";
      }
    });
  }

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
   * 채우기가 끝난 문양을 날아가는 카드에 올립니다.
   * 캔버스 그림은 복제되지 않아, 그대로 두면 문양 없는 처음 뒷면이 이동합니다.
   */
  function mount_finished_weave(motion_copy) {
    const weave = document.createElement("canvas");
    weave.className = "tarot_weave";
    weave.setAttribute("aria-hidden", "true");
    const moon_cover = motion_copy.querySelector(".tarot_moon_cover");
    if (moon_cover) {
      motion_copy.insertBefore(weave, moon_cover);
    } else {
      motion_copy.appendChild(weave);
    }

    function paint_finished_weave() {
      if (!weave_image || !weave_image.naturalWidth) {
        return;
      }
      try {
        weave.width = weave_image.naturalWidth;
        weave.height = weave_image.naturalHeight;
        const view = weave.getContext("2d");
        if (!view) {
          console.error("완성된 카드 문양을 그리지 못했습니다. 문양 없는 뒷면으로 이동합니다.");
          return;
        }
        view.drawImage(weave_image, 0, 0);
      } catch (error) {
        console.error("완성된 카드 문양을 그리지 못했습니다. 문양 없는 뒷면으로 이동합니다.", error);
      }
    }

    if (weave_image) {
      paint_finished_weave();
      return;
    }
    load_weave_images().then(paint_finished_weave).catch(function (error) {
      console.error("완성된 카드 문양을 불러오지 못했습니다. 문양 없는 뒷면으로 이동합니다.", error);
    });
  }

  let slide_weave_wait = 0;

  /**
   * 밀어서 들어오는 동안에는 문양을 그리지 않고, 화면이 완전히 멈춘 뒤에 시작합니다.
   */
  function arm_weave_after_slide() {
    const wait_id = ++slide_weave_wait;
    let has_started = false;
    let backup_timer = 0;
    function start_when_settled() {
      if (has_started || wait_id !== slide_weave_wait) {
        document.removeEventListener("today_word_slide_settled", start_when_settled);
        window.clearTimeout(backup_timer);
        return;
      }
      if (document.documentElement.classList.contains("is_design_sliding")) {
        return;
      }
      has_started = true;
      document.removeEventListener("today_word_slide_settled", start_when_settled);
      window.clearTimeout(backup_timer);
      if (document.documentElement.dataset.design !== root.DESIGN_TAROT || prefers_still_motion() || is_opening_plain) {
        return;
      }
      start_back_weave();
    }
    document.addEventListener("today_word_slide_settled", start_when_settled);
    backup_timer = window.setTimeout(start_when_settled, 1700);
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
      image.alt = "덮인 Tarot 카드";
      load_weave_images().catch(function (error) {
        console.error("카드 문양을 미리 불러오지 못했습니다. 페이지를 새로고침해 주세요.", error);
      });
      if (prefers_still_motion()) {
        stop_back_weave();
        image.src = root.TAROT_FOLDER + root.TAROT_BACK + "?v=20261116m";
      } else if (is_opening_plain) {
        // 첫 화면에서 화면을 넘길 때는 문양이 없는 뒷면만 보여 줍니다.
        stop_back_weave();
        image.src = root.TAROT_FOLDER + "back_plain.jpg?v=20261123az";
      } else if (document.documentElement.classList.contains("is_design_sliding")) {
        // 화면이 아직 밀리는 중이면 가만히 둔 뒷면만 보여 주고, 도착한 뒤에 문양을 그립니다.
        stop_back_weave();
        image.src = root.TAROT_FOLDER + "back_plain.jpg?v=20261123az";
        arm_weave_after_slide();
      } else {
        image.src = root.TAROT_FOLDER + "back_plain.jpg?v=20261123az";
        start_back_weave();
      }
      reading.hidden = true;
      set_draw_label("오늘의 카드 고르기");
      show_tarot_status("");
    } catch (error) {
      console.error("카드 뒷면을 보여 주지 못했습니다. 페이지를 새로고침해 주세요.", error);
      show_tarot_status("카드를 열지 못했습니다. 페이지를 새로고침한 뒤 다시 뒤집어 주세요.");
    }
  }

  let is_card_flying = false;

  /**
   * 섞어 둔 다음 타로 카드 한 장을 꺼냅니다.
   */
  function take_next_tarot_card() {
    try {
      if (!deck.length) {
        shuffle_deck();
      }
      if (!deck.length) {
        console.error("뒤집을 타로 카드가 없습니다.");
        show_tarot_status("카드를 열지 못했습니다. 페이지를 새로고침한 뒤 다시 뒤집어 주세요.");
        return null;
      }
      if (deck_index >= deck.length) {
        shuffle_deck();
      }
      const card = deck[deck_index];
      deck_index += 1;
      if (!is_card_ready(card)) {
        console.error("타로 카드의 내용이 비어 있습니다.", card);
        show_tarot_status("이 카드의 글을 열지 못했습니다. 다시 뒤집어 주세요.");
        return null;
      }
      return card;
    } catch (error) {
      console.error("다음 타로 카드를 꺼내지 못했습니다. 다시 눌러 주세요.", error);
      show_tarot_status("카드를 열지 못했습니다. 잠시 후 다시 눌러 주세요.");
      return null;
    }
  }

  /**
   * 고른 타로 카드의 앞면과 한 줄, 질문을 제자리에 올립니다.
   */
  function show_tarot_front(card) {
    const image = document.getElementById("tarot_image");
    const name = document.getElementById("tarot_name");
    const insight = document.getElementById("tarot_insight");
    const question = document.getElementById("tarot_question");
    const reading = document.getElementById("tarot_reading");
    if (!image || !name || !insight || !question || !reading || !card) {
      console.error("타로 카드 칸을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
      show_tarot_status("카드를 열지 못했습니다. 페이지를 새로고침한 뒤 다시 뒤집어 주세요.");
      return false;
    }
    stop_back_weave();
    image.onerror = function on_tarot_failed() {
      console.error("타로 카드 그림을 불러오지 못했습니다.", card.file);
      show_tarot_status("카드 그림을 불러오지 못했습니다. 다시 뒤집어 주세요.");
    };
    image.alt = card.name + " 카드";
    image.src = root.TAROT_FOLDER + card.file + "?v=20261115q";
    name.textContent = card.name;
    insight.textContent = card.insight;
    question.textContent = card.question;
    reading.classList.remove("is_tarot_hold");
    reading.hidden = false;
    set_draw_label("카드 다시 고르기");
    show_tarot_status("");
    return true;
  }

  /**
   * 이미 열린 카드를 옆면까지 돌리고, 그 자리에서 다음 카드로 바꿉니다.
   */
  function turn_tarot_to_next(card) {
    const frame = document.querySelector(".tarot_frame");
    const next_src = root.TAROT_FOLDER + card.file + "?v=20261115q";
    const loader = new Image();
    loader.src = next_src;
    if (!frame || prefers_still_motion()) {
      show_tarot_front(card);
      window.scrollTo(0, 0);
      return;
    }
    is_card_flying = true;
    frame.style.transition = "transform 350ms ease-in";
    frame.style.transform = "rotateY(90deg)";
    window.setTimeout(function show_next_tarot_face() {
      try {
        show_tarot_front(card);
        frame.style.transition = "none";
        frame.style.transform = "rotateY(-90deg)";
        window.requestAnimationFrame(function open_next_tarot_face() {
          frame.style.transition = "transform 350ms ease-out";
          frame.style.transform = "rotateY(0deg)";
          window.setTimeout(function finish_tarot_turn() {
            frame.style.transition = "";
            frame.style.transform = "";
            is_card_flying = false;
          }, 380);
        });
      } catch (error) {
        console.error("다음 타로 카드를 보여주지 못했습니다. 다시 눌러 주세요.", error);
        frame.style.transition = "";
        frame.style.transform = "";
        is_card_flying = false;
        show_tarot_status("카드를 바꾸지 못했습니다. 잠시 후 다시 눌러 주세요.");
      }
    }, 350);
    window.scrollTo(0, 0);
  }

  /**
   * 다음 카드의 앞면과 한 줄, 질문을 보여 줍니다.
   * 앞면이 이미 있으면 옆면으로 돌린 뒤 바꿉니다.
   */
  function flip_tarot_card() {
    try {
      if (is_card_flying) {
        return;
      }
      const card = take_next_tarot_card();
      if (!card) {
        return;
      }
      turn_tarot_to_next(card);
    } catch (error) {
      console.error("타로 카드를 뒤집지 못했습니다. 다시 눌러 주세요.", error);
      show_tarot_status("카드를 뒤집지 못했습니다. 잠시 후 다시 눌러 주세요.");
    }
  }

  /**
   * 카드 뒷면을 타로 캐릭터 칸까지 옮겨 작아지게 한 뒤, 그 자리에서 뒤집습니다.
   * 이미 앞면이 열려 있으면 false를 돌려 바로 다음 카드를 엽니다.
   */
  function fly_tarot_to_character() {
    try {
      if (is_card_flying) {
        return true;
      }
      const reading = document.getElementById("tarot_reading");
      const frame = document.querySelector(".tarot_frame");
      const image = document.getElementById("tarot_image");
      if (!reading || !frame || !image) {
        console.error("타로 카드 칸을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
        return false;
      }
      if (!reading.hidden) {
        return false;
      }
      const card = take_next_tarot_card();
      if (!card) {
        return true;
      }
      document.dispatchEvent(new CustomEvent("today_word_hold_opening"));
      if (prefers_still_motion()) {
        show_tarot_front(card);
        return true;
      }

      const start = frame.getBoundingClientRect();
      if (start.width < 2 || start.height < 2) {
        show_tarot_front(card);
        return true;
      }
      const front_src = root.TAROT_FOLDER + card.file + "?v=20261115q";
      const fly = document.createElement("div");
      const spin = document.createElement("div");
      const back = document.createElement("div");
      const back_image = document.createElement("img");
      const front = document.createElement("img");
      const motion = frame.querySelector(".tarot_back_motion");
      fly.className = "tarot_to_face";
      spin.className = "tarot_to_face_spin";
      back.className = "tarot_to_face_back";
      front.className = "tarot_to_face_front";
      front.alt = card.name + " 카드";
      back_image.alt = "";
      back_image.src = image.currentSrc || image.src;
      front.src = front_src;
      back.appendChild(back_image);
      if (motion) {
        const motion_copy = motion.cloneNode(true);
        motion_copy.querySelectorAll("canvas").forEach(function drop_canvas(canvas) {
          canvas.remove();
        });
        mount_finished_weave(motion_copy);
        back.appendChild(motion_copy);
      }
      spin.appendChild(back);
      spin.appendChild(front);
      fly.appendChild(spin);
      fly.style.left = start.left + "px";
      fly.style.top = start.top + "px";
      fly.style.width = start.width + "px";
      fly.style.height = start.height + "px";
      fly.style.borderRadius = "22px";
      document.body.appendChild(fly);
      is_card_flying = true;
      frame.style.visibility = "hidden";
      document.documentElement.classList.add("is_tarot_opening");
      show_tarot_front(card);
      reading.classList.add("is_tarot_hold");

      const move_ms = 1000;
      const flip_ms = 700;
      const button_ms = 700;
      const text_ms = 800;
      const flip_done_ms = 40 + move_ms + 40 + flip_ms + 40;
      window.setTimeout(function move_card_to_slot() {
        const target = frame.getBoundingClientRect();
        if (target.width < 2 || target.height < 2) {
          console.error("타로 카드 칸 위치를 재지 못했습니다. 카드를 바로 엽니다.");
          finish_tarot_opening(fly, frame, reading);
          return;
        }
        fly.style.transition = "left " + move_ms + "ms ease, top " + move_ms + "ms ease, width " + move_ms + "ms ease, height " + move_ms + "ms ease";
        window.requestAnimationFrame(function start_move() {
          fly.style.left = target.left + "px";
          fly.style.top = target.top + "px";
          fly.style.width = target.width + "px";
          fly.style.height = target.height + "px";
        });
      }, 40);
      window.setTimeout(function turn_card_over() {
        const landed = frame.getBoundingClientRect();
        if (landed.width > 2) {
          fly.style.transition = "none";
          fly.style.left = landed.left + "px";
          fly.style.top = landed.top + "px";
          fly.style.width = landed.width + "px";
          fly.style.height = landed.height + "px";
        }
        window.requestAnimationFrame(function start_turn() {
          fly.classList.add("is_turn");
        });
      }, 40 + move_ms + 40);
      window.setTimeout(function show_draw_button() {
        fly.remove();
        frame.style.visibility = "";
        document.documentElement.classList.add("is_tarot_button");
      }, flip_done_ms);
      window.setTimeout(function show_tarot_lines() {
        reading.classList.remove("is_tarot_hold");
        document.documentElement.classList.add("is_tarot_text");
      }, flip_done_ms + button_ms);
      window.setTimeout(function finish_tarot_lines() {
        finish_tarot_opening(null, frame, reading);
      }, flip_done_ms + button_ms + text_ms);
      return true;
    } catch (error) {
      console.error("카드를 타로 칸으로 옮기지 못했습니다. 다시 눌러 주세요.", error);
      finish_tarot_opening(document.querySelector(".tarot_to_face"), document.querySelector(".tarot_frame"), document.getElementById("tarot_reading"));
      show_tarot_status("카드를 열지 못했습니다. 잠시 후 다시 눌러 주세요.");
      return true;
    }
  }

  /**
   * 카드 연출이 끝나면 버튼과 글을 제자리 상태로 되돌립니다.
   */
  function finish_tarot_opening(fly, frame, reading) {
    if (fly && fly.parentNode) {
      fly.remove();
    }
    if (frame) {
      frame.style.visibility = "";
    }
    if (reading) {
      reading.classList.remove("is_tarot_hold");
    }
    document.documentElement.classList.remove("is_tarot_opening", "is_tarot_button", "is_tarot_text");
    is_card_flying = false;
  }

  root.show_tarot_back = show_tarot_back;
  root.flip_tarot_card = flip_tarot_card;
  root.fly_tarot_to_character = fly_tarot_to_character;

  /**
   * 덮인 뒷면을 터치하면 두 원 사이 문양을 그립니다.
   */
  function play_back_on_touch() {
    if (is_card_flying || document.documentElement.dataset.design !== root.DESIGN_TAROT) {
      return;
    }
    const reading = document.getElementById("tarot_reading");
    const image = document.getElementById("tarot_image");
    if (!reading || !reading.hidden || !image) {
      return;
    }
    document.dispatchEvent(new CustomEvent("today_word_hold_opening"));
    slide_weave_wait += 1;
    if (prefers_still_motion()) {
      stop_back_weave();
      image.src = root.TAROT_FOLDER + root.TAROT_BACK + "?v=20261116m";
      return;
    }
    is_opening_plain = false;
    start_back_weave();
  }

  /**
   * 처음 화면을 넘기는 동안에는 두 원 사이 문양을 그리지 않습니다.
   */
  document.addEventListener("today_word_pause_tarot_weave", function on_pause_weave() {
    if (!is_opening_plain) {
      return;
    }
    stop_back_weave();
  });

  /**
   * 타로를 한 번 떠나면, 다음에 돌아올 때부터 문양을 채웁니다.
   */
  document.addEventListener("today_word_design_change", function on_leave_opening_tarot() {
    if (document.documentElement.dataset.design !== root.DESIGN_TAROT) {
      is_opening_plain = false;
    }
  });

  const tarot_stage = document.getElementById("tarot_stage");
  if (tarot_stage) {
    tarot_stage.addEventListener("click", function on_back_touch() {
      try {
        play_back_on_touch();
      } catch (error) {
        console.error("카드 뒷면 움직임을 시작하지 못했습니다. 다시 터치해 주세요.", error);
      }
    });
  } else {
    console.error("타로 카드 칸을 찾지 못했습니다. 페이지를 새로고침해 주세요.");
  }

  if (document.documentElement.dataset.design === root.DESIGN_TAROT) {
    show_tarot_back();
  }
})();

/**
 * 별빛 문장 연출입니다. 문장을 단어 묶음으로 나눈 뒤, 별빛을 받은 단어부터 차례로 드러냅니다.
 * 네 가지 모양이 있고, 모두 같은 별빛 색과 반짝이 모양을 씁니다.
 * - burst(별 터짐): 별 하나가 떠올라 터지고, 별가루가 단어마다 내려앉습니다.
 * - sweep(빛줄기): 빛줄기가 글줄을 쓸고 지나가며 글자를 드러냅니다.
 * - rain(별비): 작은 별이 위에서 비처럼 내려와 단어가 됩니다.
 * - constellation(별자리): 단어마다 별이 켜지고 선으로 이어진 뒤 글자가 됩니다.
 * 별빛은 문장 위에 겹친 캔버스에 그리고, 글자는 실제 글(span)이라 화면 읽기와 복사가 그대로 됩니다.
 */
(function init_sparkle_text() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  const STYLE_BURST = "burst";
  const STYLE_SWEEP = "sweep";
  const STYLE_RAIN = "rain";
  const STYLE_CONSTELLATION = "constellation";
  root.SPARKLE_STYLES = {
    BURST: STYLE_BURST,
    SWEEP: STYLE_SWEEP,
    RAIN: STYLE_RAIN,
    CONSTELLATION: STYLE_CONSTELLATION,
  };

  // 공통: 단어가 자리 잡는 시간, 다 나온 뒤 반짝이는 시간, 단어 사이 간격의 범위입니다.
  const WORD_ENTER_MS = 640;
  const GLINT_MS = 1200;
  const GROUP_STAGGER_MAX_MS = 120;
  const GROUP_STAGGER_MIN_MS = 70;
  // 단어 묶음이 많아도 모든 단어의 등장 시작이 이 시간 안에 끝납니다.
  const SENTENCE_SPREAD_MS = 900;
  // 첫 단어에 가깝게 들어가 있다가 원래 크기로 빠지는 카메라 배율입니다.
  const CAMERA_ZOOM = 1.14;
  const REDUCED_FADE_MS = 300;
  // 불꽃이 매 화면 느려지는 비율과 한 화면의 길이(초)입니다.
  const SPARK_FRICTION = 0.94;
  const FRAME_SECONDS = 1 / 60;
  const EASE_WORD = "cubic-bezier(0.2, 0.7, 0.2, 1)";
  const EASE_CAMERA = "cubic-bezier(0.33, 0, 0.2, 1)";

  // 별 터짐: 떠오르는 시간, 별가루가 단어까지 가는 시간, 그 길의 어디서 단어가 나타날지(0~1)입니다.
  const RISE_MS = 650;
  const FLIGHT_MS = 720;
  const REVEAL_AT = 0.8;
  const FLASH_MS = 420;
  const FLASH_RADIUS = 70;
  const BURST_DUST_PER_GROUP = 14;
  const BURST_SPARKS = 26;
  // 별이 터지는 곳과 그 아래 글(이름표나 문장) 사이의 간격, 별이 출발하는 깊이입니다.
  const BURST_GAP = 22;
  const LAUNCH_DROP = 200;

  // 빛줄기: 한 문장을 쓸고 지나가는 시간의 범위와, 빛줄기의 너비입니다.
  const SWEEP_LEAD_MS = 120;
  const SWEEP_MIN_MS = 900;
  const SWEEP_MAX_MS = 1500;
  const SWEEP_PER_GROUP_MS = 90;
  const SWEEP_BAND_WIDTH = 34;
  const SWEEP_WIPE_MS = 420;
  const WIPE_CLIP_MARGIN = 40;

  // 별비: 별이 떨어지기 시작하는 높이, 떨어지는 시간, 단어마다 떨어질 별의 수입니다.
  const RAIN_LEAD_MS = 80;
  const RAIN_FALL_MS = 640;
  const RAIN_HEIGHT = 96;
  const RAIN_DROPS_PER_GROUP = 6;

  // 별자리: 별 사이 간격의 범위, 선이 다음 별까지 가는 데 쓰는 비율, 선이 남아 있다 사라지는 시간입니다.
  const STAR_LEAD_MS = 120;
  const STAR_STEP_MIN_MS = 130;
  const STAR_STEP_MAX_MS = 220;
  const STAR_SPREAD_MS = 1300;
  const LINK_SHARE = 0.75;
  const LINE_HOLD_MS = 260;
  const LINE_FADE_MS = 600;
  // 별은 단어 아랫선보다 이만큼 아래에 켜집니다. 위쪽은 문장 칸 제목과 겹치기 때문입니다.
  const STAR_DROP = 2;

  // 별빛 색입니다. "R, G, B" 형태로 두고 투명도만 바꿔 씁니다.
  const COLOR_CORE = "255, 250, 232";
  const COLOR_WARM = "255, 222, 164";
  const COLOR_GOLD = "232, 193, 118";

  // 연출 중인 칸과 그 상태입니다.
  const plays = new Map();

  /**
   * 움직임 줄이기를 켠 기기인지 확인합니다.
   */
  function is_reduced_motion() {
    try {
      return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (error) {
      console.error("움직임 설정을 확인하지 못했습니다. 기본 연출을 씁니다.", error);
      return false;
    }
  }

  function rgba(color, alpha) {
    return "rgba(" + color + ", " + Math.max(0, Math.min(1, alpha)).toFixed(3) + ")";
  }

  function random_between(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function ease_out_cubic(progress) {
    return 1 - Math.pow(1 - progress, 3);
  }

  function ease_in_out(progress) {
    return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  }

  /**
   * 2차 베지어 곡선 위의 점입니다. 별가루가 휘어 날아가는 길입니다.
   */
  function bezier_point(start, control, end, progress) {
    const rest = 1 - progress;
    return {
      x: rest * rest * start.x + 2 * rest * progress * control.x + progress * progress * end.x,
      y: rest * rest * start.y + 2 * rest * progress * control.y + progress * progress * end.y,
    };
  }

  /**
   * 은은한 빛 번짐이 있는 둥근 별가루 한 알을 그립니다.
   */
  function draw_dot(ctx, x, y, radius, alpha) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
    glow.addColorStop(0, rgba(COLOR_CORE, alpha));
    glow.addColorStop(0.35, rgba(COLOR_WARM, alpha * 0.6));
    glow.addColorStop(1, rgba(COLOR_GOLD, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 네 갈래로 뾰족한 반짝이 별을 그립니다.
   */
  function draw_sparkle(ctx, x, y, radius, alpha) {
    draw_dot(ctx, x, y, radius * 0.7, alpha * 0.8);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = rgba(COLOR_CORE, alpha);
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.quadraticCurveTo(0, 0, 0, radius);
    ctx.quadraticCurveTo(0, 0, -radius, 0);
    ctx.quadraticCurveTo(0, 0, 0, -radius);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 별과 별을 잇는 가는 빛 선을 그립니다. progress(0~1)만큼만 그어집니다.
   */
  function draw_link(ctx, from, to, progress, alpha) {
    const end = { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
    ctx.strokeStyle = rgba(COLOR_WARM, alpha * 0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    return end;
  }

  /**
   * 단어 사이 간격입니다. 묶음이 많을수록 촘촘해지되, 범위를 넘지 않습니다.
   */
  function stagger_for(count, spread_ms, min_ms, max_ms) {
    return clamp(spread_ms / Math.max(1, count - 1), min_ms, max_ms);
  }

  /**
   * 문장 칸을 연출용 조각으로 바꿉니다. 화면 읽기 프로그램은 숨겨 둔 문장 전체를 읽습니다.
   */
  function build_stage(element, text, settings) {
    const language = settings.language
      || (typeof root.get_language === "function" ? root.get_language() : "")
      || document.documentElement.lang
      || "ko";
    const quotes = typeof root.read_sentence_quotes === "function" && settings.open_quote === undefined
      ? root.read_sentence_quotes(element)
      : { open: settings.open_quote || "", close: settings.close_quote || "" };
    const words = typeof root.split_kinetic_groups === "function"
      ? root.split_kinetic_groups(text, language)
      : text.split(/\s+/).filter(Boolean);
    const joiner = /^(ja|zh)/.test(language) ? "" : " ";

    const reader_text = document.createElement("span");
    reader_text.className = "kinetic_reader";
    reader_text.textContent = text;

    const camera = document.createElement("span");
    camera.className = "sparkle_camera";
    camera.setAttribute("aria-hidden", "true");

    const groups = words.map(function make_group(word, index) {
      const group = document.createElement("span");
      group.className = "sparkle_group";
      const head = index === 0 ? quotes.open : "";
      const tail = index === words.length - 1 ? quotes.close : "";
      group.textContent = head + word + tail;
      if (index > 0 && joiner) {
        camera.appendChild(document.createTextNode(joiner));
      }
      camera.appendChild(group);
      return group;
    });

    element.classList.add("is_sparkle_playing");
    element.replaceChildren(reader_text, camera);
    return { camera: camera, groups: groups };
  }

  /**
   * 별빛을 그릴 캔버스를 준비합니다. 받은 캔버스가 없으면 host 안에 새로 만들어 붙입니다.
   */
  function take_canvas(settings) {
    if (settings.canvas) {
      return { canvas: settings.canvas, is_owned: false };
    }
    const host = settings.canvas_host;
    if (!host) {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.className = "sparkle_canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    return { canvas: canvas, is_owned: true };
  }

  /**
   * 캔버스를 화면 크기와 기기 화소 밀도에 맞춥니다.
   */
  function fit_canvas(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx: ctx, width: width, height: height };
  }

  /**
   * 요소의 지금 위치를 캔버스 기준 좌표로 구합니다. 카메라나 카드가 움직이는 중에도 정확하게 따라갑니다.
   */
  function rect_in_canvas(element, canvas) {
    const box = element.getBoundingClientRect();
    const base = canvas.getBoundingClientRect();
    return { x: box.left - base.left, y: box.top - base.top, width: box.width, height: box.height };
  }

  /**
   * 연출을 멈추고 칸을 원래의 한 덩어리 글로 되돌립니다.
   * 그 사이 언어 변경 등으로 다른 글이 들어왔다면 그 글을 그대로 둡니다.
   */
  function stop_play(element) {
    const state = plays.get(element);
    if (!state) {
      return null;
    }
    plays.delete(element);
    window.cancelAnimationFrame(state.frame_id);
    state.animations.forEach(function cancel(animation) {
      try {
        animation.cancel();
      } catch (error) {
        console.error("문장 연출을 멈추지 못했습니다.", error);
      }
    });
    state.ctx.clearRect(0, 0, state.width, state.height);
    if (state.is_canvas_owned && state.canvas.parentNode) {
      state.canvas.remove();
    }
    element.classList.remove("is_sparkle_playing");
    if (state.camera.isConnected && element.contains(state.camera)) {
      element.textContent = state.text;
    }
    return state;
  }

  /**
   * 단어 하나가 별빛을 받아 빛나며 나타납니다.
   * glow: 흐림에서 또렷해지며 잠깐 빛납니다. wipe: 빛줄기를 따라 한쪽부터 드러납니다.
   */
  function reveal_group(group, base_shadow, mode, is_rtl) {
    const shine = "0 0 16px " + rgba(COLOR_WARM, 0.95) + ", 0 0 34px " + rgba(COLOR_GOLD, 0.6);
    if (mode === "wipe") {
      // 글자 그림자가 잘린 네모로 보이지 않게, 드러난 쪽은 그림자 번짐보다 넉넉히 열어 둡니다.
      const margin = WIPE_CLIP_MARGIN + "px";
      const hidden_clip = is_rtl
        ? "inset(-" + margin + " -" + margin + " -" + margin + " 100%)"
        : "inset(-" + margin + " 100% -" + margin + " -" + margin + ")";
      const open_clip = "inset(-" + margin + ")";
      return group.animate([
        { opacity: 1, clipPath: hidden_clip, filter: "brightness(1.8)", textShadow: shine },
        { opacity: 1, clipPath: open_clip, filter: "brightness(1.4)", textShadow: shine, offset: 0.6 },
        { opacity: 1, clipPath: open_clip, filter: "brightness(1)", textShadow: base_shadow },
      ], { duration: SWEEP_WIPE_MS + 260, easing: "ease-out", fill: "forwards" });
    }
    return group.animate([
      { opacity: 0, transform: "translateY(0.35em) scale(0.9)", filter: "blur(8px) brightness(2)", textShadow: "0 0 0 transparent" },
      { opacity: 1, transform: "translateY(0) scale(1.06)", filter: "blur(0px) brightness(1.6)", textShadow: shine, offset: 0.4 },
      { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px) brightness(1)", textShadow: base_shadow },
    ], { duration: WORD_ENTER_MS, easing: EASE_WORD, fill: "forwards" });
  }

  /**
   * 별 터짐: 별 하나가 떠올라 문장 위에서 터지고, 별가루가 단어마다 내려앉습니다.
   */
  function plan_burst(stage) {
    const count = stage.groups.length;
    const stagger = stagger_for(count, SENTENCE_SPREAD_MS, GROUP_STAGGER_MIN_MS, GROUP_STAGGER_MAX_MS);
    const reveal_times = stage.groups.map(function reveal_time(group, index) {
      return RISE_MS + index * stagger + FLIGHT_MS * REVEAL_AT;
    });
    let burst_point = null;

    // 터지는 곳은 이름표(없으면 문장) 바로 위, 문장 가운데입니다. 카드가 움직여도 따라갑니다.
    const aim = function aim() {
      const text_box = stage.box(stage.camera);
      const top_box = stage.anchor ? stage.box(stage.anchor) : text_box;
      return { x: text_box.x + text_box.width / 2, y: top_box.y - BURST_GAP };
    };
    const launch = (function launch_point() {
      const text_box = stage.box(stage.camera);
      return { x: text_box.x + text_box.width / 2, y: Math.min(stage.height - 8, text_box.y + text_box.height + LAUNCH_DROP) };
    })();

    const spawn_burst = function spawn_burst(point) {
      for (let index = 0; index < BURST_SPARKS; index += 1) {
        const angle = (Math.PI * 2 * index) / BURST_SPARKS + random_between(-0.15, 0.15);
        const speed = random_between(170, 330);
        stage.particles.push({
          kind: "spark", x: point.x, y: point.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          born: RISE_MS, life: random_between(380, 620), size: random_between(1, 2),
        });
      }
      stage.groups.forEach(function spawn_dust(group, group_index) {
        for (let index = 0; index < BURST_DUST_PER_GROUP; index += 1) {
          const angle = random_between(0, Math.PI * 2);
          const reach = random_between(40, 110);
          stage.particles.push({
            kind: "seeker", group: group,
            start: { x: point.x, y: point.y },
            control: { x: point.x + Math.cos(angle) * reach, y: point.y + Math.sin(angle) * reach - 30 },
            target_u: random_between(0.05, 0.95), target_v: random_between(0.2, 0.85),
            born: RISE_MS + group_index * stagger + random_between(0, 90),
            life: FLIGHT_MS * random_between(0.85, 1.1), size: random_between(1.1, 2.2), glint_chance: 0.35,
          });
        }
      });
    };

    return {
      reveal_times: reveal_times,
      reveal_mode: "glow",
      camera_delay: RISE_MS,
      draw: function draw_burst(ctx, elapsed) {
        if (elapsed < RISE_MS) {
          const target = aim();
          const progress = ease_out_cubic(elapsed / RISE_MS);
          const x = launch.x + (target.x - launch.x) * progress;
          const y = launch.y + (target.y - launch.y) * progress;
          stage.particles.push({
            kind: "spark", x: x + random_between(-2, 2), y: y + random_between(0, 4),
            vx: random_between(-12, 12), vy: random_between(10, 40),
            born: elapsed, life: random_between(260, 420), size: random_between(0.8, 1.6),
          });
          draw_sparkle(ctx, x, y, 7 + progress * 5, 0.95);
          return;
        }
        if (!burst_point) {
          burst_point = aim();
          spawn_burst(burst_point);
        }
        const flash_age = elapsed - RISE_MS;
        if (flash_age < FLASH_MS) {
          const progress = flash_age / FLASH_MS;
          const radius = Math.max(1, FLASH_RADIUS * ease_out_cubic(progress));
          const glow = ctx.createRadialGradient(burst_point.x, burst_point.y, 0, burst_point.x, burst_point.y, radius);
          glow.addColorStop(0, rgba(COLOR_CORE, 0.9 * (1 - progress)));
          glow.addColorStop(0.4, rgba(COLOR_WARM, 0.45 * (1 - progress)));
          glow.addColorStop(1, rgba(COLOR_GOLD, 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(burst_point.x, burst_point.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    };
  }

  /**
   * 빛줄기: 글줄마다 빛줄기가 읽는 방향으로 쓸고 지나가며 글자를 드러냅니다.
   */
  function plan_sweep(stage) {
    // 같은 줄에 놓인 단어 묶음끼리 모읍니다. 줄은 카메라 안쪽 위치(offsetTop)로 가립니다.
    const lines = [];
    stage.groups.forEach(function add_to_line(group, index) {
      const top = Math.round(group.offsetTop);
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - top) < 4) {
        last.indexes.push(index);
      } else {
        lines.push({ top: top, indexes: [index] });
      }
    });
    const total_ms = clamp(SWEEP_PER_GROUP_MS * stage.groups.length, SWEEP_MIN_MS, SWEEP_MAX_MS);
    // 줄의 왼쪽 끝과 오른쪽 끝입니다. 아랍어처럼 오른쪽부터 쓰는 줄도 같은 방법으로 잽니다.
    lines.forEach(function measure_line(line) {
      line.left = Math.min.apply(null, line.indexes.map(function left_of(index) {
        return stage.groups[index].offsetLeft;
      }));
      line.right = Math.max.apply(null, line.indexes.map(function right_of(index) {
        return stage.groups[index].offsetLeft + stage.groups[index].offsetWidth;
      }));
    });
    const widths = lines.map(function line_width(line) {
      return Math.max(1, line.right - line.left);
    });
    const width_sum = widths.reduce(function sum(total, width) {
      return total + width;
    }, 0) || 1;

    // 줄마다 빛줄기가 지나가는 시각, 그리고 단어마다 빛줄기가 닿는 시각입니다.
    let cursor = SWEEP_LEAD_MS;
    const reveal_times = new Array(stage.groups.length).fill(SWEEP_LEAD_MS);
    lines.forEach(function time_line(line, line_index) {
      line.start = cursor;
      line.duration = total_ms * (widths[line_index] / width_sum);
      line.indexes.forEach(function time_group(index) {
        const group = stage.groups[index];
        const from_left = group.offsetLeft - line.left;
        const along = stage.is_rtl
          ? (widths[line_index] - (from_left + group.offsetWidth)) / widths[line_index]
          : from_left / widths[line_index];
        reveal_times[index] = line.start + line.duration * clamp(along, 0, 1);
      });
      cursor += line.duration;
    });

    return {
      reveal_times: reveal_times,
      reveal_mode: "wipe",
      camera_delay: SWEEP_LEAD_MS,
      draw: function draw_sweep(ctx, elapsed) {
        lines.forEach(function draw_band(line) {
          const age = elapsed - line.start;
          if (age < 0 || age > line.duration + 120) {
            return;
          }
          const boxes = line.indexes.map(function live_box(index) {
            return stage.box(stage.groups[index]);
          });
          const first_box = boxes[0];
          const left = Math.min.apply(null, boxes.map(function left_of(box) {
            return box.x;
          }));
          const right = Math.max.apply(null, boxes.map(function right_of(box) {
            return box.x + box.width;
          }));
          const progress = clamp(age / line.duration, 0, 1);
          const x = stage.is_rtl ? right - (right - left) * progress : left + (right - left) * progress;
          const top = first_box.y - 6;
          const height = first_box.height + 12;
          const fade = age > line.duration ? 1 - (age - line.duration) / 120 : 1;
          const band = ctx.createLinearGradient(x - SWEEP_BAND_WIDTH / 2, 0, x + SWEEP_BAND_WIDTH / 2, 0);
          band.addColorStop(0, rgba(COLOR_GOLD, 0));
          band.addColorStop(0.5, rgba(COLOR_WARM, 0.5 * fade));
          band.addColorStop(1, rgba(COLOR_GOLD, 0));
          ctx.fillStyle = band;
          ctx.fillRect(x - SWEEP_BAND_WIDTH / 2, top, SWEEP_BAND_WIDTH, height);
          ctx.fillStyle = rgba(COLOR_CORE, 0.85 * fade);
          ctx.fillRect(x - 0.75, top + 2, 1.5, height - 4);
          draw_sparkle(ctx, x, top, 4.5, fade);
          if (Math.random() < 0.6) {
            stage.particles.push({
              kind: "spark", x: x, y: top + Math.random() * height,
              vx: (stage.is_rtl ? 1 : -1) * random_between(10, 40), vy: random_between(-30, -8),
              born: elapsed, life: random_between(320, 520), size: random_between(0.7, 1.4),
            });
          }
        });
      },
    };
  }

  /**
   * 별비: 작은 별이 위에서 비처럼 내려와 단어에 닿고, 닿은 단어가 나타납니다.
   */
  function plan_rain(stage) {
    const count = stage.groups.length;
    const stagger = stagger_for(count, SENTENCE_SPREAD_MS, GROUP_STAGGER_MIN_MS, GROUP_STAGGER_MAX_MS);
    const reveal_times = stage.groups.map(function reveal_time(group, index) {
      return RAIN_LEAD_MS + index * stagger + RAIN_FALL_MS * REVEAL_AT;
    });
    stage.groups.forEach(function spawn_drops(group, group_index) {
      const box = stage.box(group);
      for (let index = 0; index < RAIN_DROPS_PER_GROUP; index += 1) {
        const target_u = random_between(0.08, 0.92);
        const start_x = box.x + box.width * target_u + random_between(-14, 14);
        const start_y = box.y - RAIN_HEIGHT - random_between(0, 40);
        stage.particles.push({
          kind: "seeker", group: group,
          start: { x: start_x, y: start_y },
          control: { x: start_x + random_between(-18, 18), y: start_y + RAIN_HEIGHT * 0.5 },
          target_u: target_u, target_v: random_between(0.25, 0.75),
          born: RAIN_LEAD_MS + group_index * stagger + random_between(0, 110),
          life: RAIN_FALL_MS * random_between(0.85, 1.1), size: random_between(1.2, 2.2),
          is_star: index === 0, glint_chance: 0.45,
        });
      }
    });
    return {
      reveal_times: reveal_times,
      reveal_mode: "glow",
      camera_delay: RAIN_LEAD_MS + RAIN_FALL_MS * 0.5,
      draw: function draw_rain() {},
    };
  }

  /**
   * 별자리: 단어마다 별이 켜지고, 앞 별에서 빛 선이 이어져 온 뒤 단어가 나타납니다.
   */
  function plan_constellation(stage) {
    const count = stage.groups.length;
    const step = stagger_for(count, STAR_SPREAD_MS, STAR_STEP_MIN_MS, STAR_STEP_MAX_MS);
    const link_ms = step * LINK_SHARE;
    // 별 i가 켜지는 시각입니다. 첫 별은 바로 켜지고, 다음 별은 선이 닿는 순간 켜집니다.
    const star_times = stage.groups.map(function star_time(group, index) {
      return STAR_LEAD_MS + index * step;
    });
    const reveal_times = star_times.map(function reveal_time(time) {
      return time + 60;
    });
    const last_star = star_times[star_times.length - 1];
    const fade_start = last_star + WORD_ENTER_MS * 0.5 + LINE_HOLD_MS;

    const star_point = function star_point(index) {
      const box = stage.box(stage.groups[index]);
      return { x: box.x + box.width / 2, y: box.y + box.height + STAR_DROP };
    };

    return {
      reveal_times: reveal_times,
      reveal_mode: "glow",
      camera_delay: STAR_LEAD_MS,
      extra_ms: LINE_HOLD_MS + LINE_FADE_MS,
      draw: function draw_constellation(ctx, elapsed) {
        const fade = elapsed < fade_start ? 1 : 1 - (elapsed - fade_start) / LINE_FADE_MS;
        if (fade <= 0) {
          return;
        }
        for (let index = 0; index < count; index += 1) {
          const lit_at = star_times[index];
          // 앞 별에서 이 별까지 선이 그어지는 중입니다.
          if (index > 0 && elapsed >= lit_at - link_ms) {
            const progress = clamp((elapsed - (lit_at - link_ms)) / link_ms, 0, 1);
            const tip = draw_link(ctx, star_point(index - 1), star_point(index), ease_out_cubic(progress), fade);
            if (progress < 1) {
              draw_dot(ctx, tip.x, tip.y, 1.4, fade);
            }
          }
          if (elapsed < lit_at) {
            continue;
          }
          const age = elapsed - lit_at;
          const pop = age < 220 ? 1 + 0.8 * Math.sin((age / 220) * Math.PI) : 1;
          const twinkle = 0.75 + 0.25 * Math.sin(elapsed / 160 + index);
          const point = star_point(index);
          draw_sparkle(ctx, point.x, point.y, 4 * pop, fade * twinkle);
        }
      },
    };
  }

  const PLANS = {};
  PLANS[STYLE_BURST] = plan_burst;
  PLANS[STYLE_SWEEP] = plan_sweep;
  PLANS[STYLE_RAIN] = plan_rain;
  PLANS[STYLE_CONSTELLATION] = plan_constellation;

  /**
   * 모든 모양이 함께 쓰는 별가루를 움직이고 그립니다.
   * spark: 천천히 느려지며 흐려지는 불꽃. glint: 제자리에서 반짝이는 별. seeker: 단어를 향해 날아가는 별가루.
   */
  function update_particles(stage, ctx, elapsed) {
    const particles = stage.particles;
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      const age = elapsed - particle.born;
      if (age < 0) {
        continue;
      }
      const progress = age / particle.life;
      if (particle.kind === "seeker") {
        const box = stage.box(particle.group);
        const target = { x: box.x + box.width * particle.target_u, y: box.y + box.height * particle.target_v };
        if (progress >= 1) {
          particles.splice(index, 1);
          if (Math.random() < particle.glint_chance) {
            stage.spawn_glint(target.x, target.y, elapsed, random_between(2.5, 4.5));
          }
          continue;
        }
        const point = bezier_point(particle.start, particle.control, target, ease_in_out(progress));
        const alpha = 0.55 + 0.45 * Math.sin(progress * Math.PI);
        if (particle.is_star) {
          draw_sparkle(ctx, point.x, point.y, 3.5, alpha);
        } else {
          draw_dot(ctx, point.x, point.y, particle.size, alpha);
        }
        continue;
      }
      if (progress >= 1) {
        particles.splice(index, 1);
        continue;
      }
      if (particle.kind === "glint") {
        const twinkle = Math.sin(progress * Math.PI);
        draw_sparkle(ctx, particle.x, particle.y, particle.size * (0.4 + twinkle), twinkle);
        continue;
      }
      particle.vx *= SPARK_FRICTION;
      particle.vy *= SPARK_FRICTION;
      particle.x += particle.vx * FRAME_SECONDS;
      particle.y += particle.vy * FRAME_SECONDS;
      draw_dot(ctx, particle.x, particle.y, particle.size, 1 - progress);
    }
  }

  /**
   * 움직임 줄이기를 켠 기기의 짧은 등장입니다.
   */
  function play_reduced(element) {
    try {
      return element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_FADE_MS, easing: "ease-out" })
        .finished.catch(function ignore_cancel() {
          return null;
        });
    } catch (error) {
      console.error("문장을 흐리게 보여 주지 못했습니다. 바로 보여 줍니다.", error);
      return Promise.resolve();
    }
  }

  /**
   * 문장을 별빛 연출로 드러냅니다. 끝나거나 멈추면 Promise가 풀립니다.
   * settings: {
   *   style: "burst" | "sweep" | "rain" | "constellation" (기본 burst),
   *   canvas: 그릴 캔버스 (없으면 canvas_host 안에 새로 만듭니다),
   *   canvas_host: 캔버스를 붙일 요소,
   *   burst_anchor: 별 터짐에서 그 위에서 터질 요소(이름표 등),
   *   language, open_quote, close_quote: 없으면 지금 언어와 칸의 따옴표를 씁니다.
   * }
   */
  root.play_sparkle_text = function play_sparkle_text(element, settings) {
    return new Promise(function run(resolve) {
      try {
        root.stop_sparkle_text(element);
        const options = settings || {};
        const text = element ? (element.textContent || "").trim() : "";
        if (!text || typeof element.animate !== "function") {
          resolve();
          return;
        }
        if (is_reduced_motion()) {
          play_reduced(element).then(resolve);
          return;
        }
        const taken = take_canvas(options);
        if (!taken) {
          console.error("별빛을 그릴 자리를 찾지 못했습니다. 문장은 그대로 보여 줍니다.");
          resolve();
          return;
        }

        const base_shadow = window.getComputedStyle(element).textShadow || "none";
        const is_rtl = window.getComputedStyle(element).direction === "rtl";
        const built = build_stage(element, text, options);
        const view = fit_canvas(taken.canvas);
        const ctx = view.ctx;
        const state = {
          text: text,
          canvas: taken.canvas,
          is_canvas_owned: taken.is_owned,
          camera: built.camera,
          ctx: ctx,
          width: view.width,
          height: view.height,
          animations: [],
          frame_id: 0,
          resolve: resolve,
        };
        plays.set(element, state);

        const stage = {
          camera: built.camera,
          groups: built.groups,
          anchor: options.burst_anchor || null,
          is_rtl: is_rtl,
          height: view.height,
          particles: [],
          box: function box(target) {
            return rect_in_canvas(target, taken.canvas);
          },
          spawn_glint: function spawn_glint(x, y, elapsed, size) {
            stage.particles.push({ kind: "glint", x: x, y: y, born: elapsed, life: random_between(420, 820), size: size });
          },
        };
        const plan_maker = PLANS[options.style] || PLANS[STYLE_BURST];
        const plan = plan_maker(stage);
        const groups = built.groups;
        const reveal_times = plan.reveal_times;
        const last_reveal = Math.max.apply(null, reveal_times);
        const glint_end = last_reveal + WORD_ENTER_MS + Math.max(GLINT_MS, plan.extra_ms || 0);
        const is_revealed = groups.map(function not_yet() {
          return false;
        });

        // 카메라: 첫 단어 쪽으로 들어가 있다가, 문장이 채워질수록 끝 단어 쪽으로 따라가며 빠집니다.
        const first = groups[0];
        const last = groups[groups.length - 1];
        state.animations.push(built.camera.animate([
          { transform: "scale(" + CAMERA_ZOOM + ")", transformOrigin: (first.offsetLeft + first.offsetWidth / 2) + "px " + (first.offsetTop + first.offsetHeight / 2) + "px" },
          { transform: "scale(1)", transformOrigin: (last.offsetLeft + last.offsetWidth / 2) + "px " + (last.offsetTop + last.offsetHeight / 2) + "px" },
        ], {
          duration: Math.max(300, last_reveal + WORD_ENTER_MS - plan.camera_delay),
          delay: plan.camera_delay,
          easing: EASE_CAMERA,
          fill: "both",
        }));

        const start_time = performance.now();

        /**
         * 매 화면마다 별빛을 움직이고 그린 뒤, 때가 된 단어를 드러냅니다.
         */
        const draw_frame = function draw_frame(now) {
          if (plays.get(element) !== state) {
            return;
          }
          const elapsed = now - start_time;
          ctx.clearRect(0, 0, view.width, view.height);
          ctx.globalCompositeOperation = "lighter";
          plan.draw(ctx, elapsed);
          update_particles(stage, ctx, elapsed);

          reveal_times.forEach(function check_reveal(time, group_index) {
            if (!is_revealed[group_index] && elapsed >= time) {
              is_revealed[group_index] = true;
              state.animations.push(reveal_group(groups[group_index], base_shadow, plan.reveal_mode, is_rtl));
            }
          });

          // 다 나온 단어 위의 잔잔한 반짝임입니다.
          if (elapsed > last_reveal + WORD_ENTER_MS * 0.5 && elapsed < glint_end - 500 && Math.random() < 0.2) {
            const group = groups[Math.floor(Math.random() * groups.length)];
            const box = stage.box(group);
            stage.spawn_glint(box.x + box.width * Math.random(), box.y + box.height * random_between(0.15, 0.85), elapsed, random_between(2, 3.6));
          }

          ctx.globalCompositeOperation = "source-over";
          if (elapsed >= glint_end && stage.particles.length === 0) {
            stop_play(element);
            resolve();
            return;
          }
          state.frame_id = window.requestAnimationFrame(draw_frame);
        };
        state.frame_id = window.requestAnimationFrame(draw_frame);
      } catch (error) {
        console.error("별빛 문장 연출을 하지 못했습니다. 문장은 그대로 보여 줍니다.", error);
        stop_play(element);
        resolve();
      }
    });
  };

  /**
   * 진행 중인 별빛 연출을 멈추고 문장을 그대로 보여 줍니다.
   */
  root.stop_sparkle_text = function stop_sparkle_text(element) {
    const state = stop_play(element);
    if (state && typeof state.resolve === "function") {
      state.resolve();
    }
  };

  /**
   * 연출 중이면 바로 끝 장면(완성된 문장)으로 건너뜁니다. 건너뛰었으면 true입니다.
   */
  root.finish_sparkle_text = function finish_sparkle_text(element) {
    if (!plays.has(element)) {
      return false;
    }
    root.stop_sparkle_text(element);
    return true;
  };

  /**
   * 언어를 바꾸면 새 언어 글이 바로 보이도록 진행 중인 연출을 모두 멈춥니다.
   */
  document.addEventListener("today_word_language_change", function on_language_change() {
    Array.from(plays.keys()).forEach(function stop_for_language(element) {
      root.stop_sparkle_text(element);
    });
  });
})();

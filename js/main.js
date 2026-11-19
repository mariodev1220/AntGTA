(() => {
  const CFG = window.CONFIG || {};
  const SCENES = ["cover", "dossier", "sheet", "bag", "locker", "wire"];
  const LABELS = {
    cover: "COVER",
    dossier: "DOSSIER",
    sheet: "RAP SHEET",
    bag: "GET BAG",
    locker: "LOCKER",
    wire: "WIRE",
  };
  const WANTED = [
    "Quiet afternoon",
    "Disturbing the peace",
    "Word is out",
    "All eyes",
    "Maximum wanted",
  ];
  const BOOT_LINES = [
    "> OPEN CHANNEL MDT-09",
    "> ALIGNING MODEL WEIGHTS…",
    "> LOADING COVER ASSET",
    "> VERIFYING STREET CRED",
    "> $GTA FEED ONLINE",
  ];

  const reduce =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let scene = "cover";
  let tourTimer = null;
  let eggs = new Set(
    JSON.parse(localStorage.getItem("gta:eggs") || "[]")
  );
  let streak = 0;
  let best = Number(localStorage.getItem("gta:catchBest") || 0);

  function hasCA() {
    const ca = (CFG.ca || "").trim();
    return ca && ca.toLowerCase() !== "tba" && !ca.includes("{{");
  }

  function buyURL() {
    if (!hasCA()) return "";
    return CFG.buyBase + CFG.ca.trim();
  }

  function chartURL() {
    if (!hasCA()) return "";
    return CFG.chartBase + CFG.ca.trim();
  }

  function shortCA() {
    if (!hasCA()) return "TBA";
    const c = CFG.ca.trim();
    return c.length > 12 ? `${c.slice(0, 4)}…${c.slice(-4)}` : c;
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-on"), 2200);
  }

  function applyLinks() {
    $$("[data-ca]").forEach((n) => {
      n.textContent = hasCA() ? CFG.ca.trim() : "TBA";
      n.title = hasCA() ? CFG.ca.trim() : "Contract TBA";
    });

    $$("[data-buy]").forEach((btn) => {
      btn.onclick = () => {
        const url = buyURL();
        if (!url) return toast("CA TBA — buy link drops at launch");
        window.open(url, "_blank", "noopener,noreferrer");
      };
    });

    $$("[data-chart]").forEach((btn) => {
      btn.onclick = () => {
        const url = chartURL();
        if (!url) return toast("Chart TBA — CA not set");
        window.open(url, "_blank", "noopener,noreferrer");
      };
    });

    $$("[data-x]").forEach((btn) => {
      btn.onclick = () => {
        if (!CFG.x) return toast("X link coming soon");
        window.open(CFG.x, "_blank", "noopener,noreferrer");
      };
    });

    $$("[data-tg]").forEach((btn) => {
      btn.onclick = () => {
        if (!CFG.telegram) return toast("Telegram coming soon");
        window.open(CFG.telegram, "_blank", "noopener,noreferrer");
      };
    });

    $$("[data-copy]").forEach((btn) => {
      btn.onclick = async () => {
        if (!hasCA()) return toast("CA TBA");
        try {
          await navigator.clipboard.writeText(CFG.ca.trim());
          toast("Contract copied");
          btn.textContent = "COPIED";
          setTimeout(() => {
            btn.textContent = btn.classList.contains("ca-plate__copy")
              ? "COPY"
              : "CA";
          }, 1600);
        } catch {
          toast("Select the address manually");
        }
      };
    });

    const frame = $("#chartFrame");
    const wrap = $("#wireFrame");
    if (hasCA()) {
      frame.src = `https://dexscreener.com/solana/${CFG.ca.trim()}?embed=1&theme=dark&trades=0&info=0`;
      wrap.classList.add("is-live");
      $("#wireCopy").textContent =
        "Live DexScreener wire for $GTA. Verify the mint before you ape.";
    }
  }

  function go(name, { fromTour = false } = {}) {
    if (!SCENES.includes(name)) return;
    scene = name;
    $$(".scene").forEach((sec) => {
      const on = sec.dataset.scene === name;
      sec.hidden = !on;
      sec.classList.toggle("is-active", on);
    });
    $$(".hud__link").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.go === name);
    });
    $("#radioLabel").textContent = LABELS[name] || name.toUpperCase();
    $("#menu").hidden = true;
    if (!fromTour && tourTimer) stopTour();
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function nextScene() {
    const i = SCENES.indexOf(scene);
    go(SCENES[(i + 1) % SCENES.length], { fromTour: !!tourTimer });
  }

  function startTour() {
    if (tourTimer) return stopTour();
    toast("Auto tour on");
    $("#btnTour").textContent = "STOP";
    tourTimer = setInterval(nextScene, reduce ? 2200 : 3800);
  }

  function stopTour() {
    clearInterval(tourTimer);
    tourTimer = null;
    $("#btnTour").textContent = "AUTO";
  }

  /* BOOT */
  function runBoot() {
    const boot = $("#boot");
    const bar = $(".boot__bar");
    const pct = $("#bootPct");
    const log = $("#bootLog");
    const enter = $("#bootEnter");
    const circumference = 2 * Math.PI * 52;
    bar.style.strokeDasharray = String(circumference);

    if (reduce || sessionStorage.getItem("gta:boot") === "1") {
      finishBoot(true);
      return;
    }

    document.body.classList.add("is-booting");
    let p = 0;
    let line = 0;
    const tick = () => {
      p = Math.min(100, p + (reduce ? 100 : 2 + Math.random() * 4));
      const offset = circumference - (p / 100) * circumference;
      bar.style.strokeDashoffset = String(offset);
      pct.textContent = String(Math.floor(p)).padStart(2, "0");
      if (line < BOOT_LINES.length && p > line * 18) {
        log.textContent += (log.textContent ? "\n" : "") + BOOT_LINES[line++];
      }
      if (p >= 100) {
        enter.disabled = false;
        enter.focus();
        return;
      }
      requestAnimationFrame(() => setTimeout(tick, 40));
    };
    tick();

    const done = () => finishBoot(false);
    enter.addEventListener("click", done);
    $("#bootSkip").addEventListener("click", done);
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === "Escape") done();
      },
      { once: true }
    );
  }

  function finishBoot(instant) {
    sessionStorage.setItem("gta:boot", "1");
    document.body.classList.remove("is-booting");
    const boot = $("#boot");
    if (instant) {
      boot.classList.add("is-done");
      boot.hidden = true;
    } else {
      boot.classList.add("is-done");
      setTimeout(() => {
        boot.hidden = true;
      }, 600);
    }
    scramble($("[data-scramble]"));
  }

  function scramble(el) {
    if (!el || reduce) return;
    const final = el.dataset.scramble || el.textContent;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ$#*";
    let frame = 0;
    const total = 18;
    const id = setInterval(() => {
      el.textContent = final
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < (frame / total) * final.length) return final[i];
          return chars[(Math.random() * chars.length) | 0];
        })
        .join("");
      frame++;
      if (frame > total) {
        clearInterval(id);
        el.textContent = final;
      }
    }, 28);
  }

  /* CLOCK */
  function tickClock() {
    const d = new Date();
    $("#hudClock").textContent = d.toLocaleTimeString("en-GB", {
      hour12: false,
    });
  }

  /* PARALLAX */
  function bindParallax() {
    if (reduce) return;
    const plate = $("#plate");
    const panel = () => $(".scene.is-active .panel");
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        plate.style.setProperty("--px", `${x * -12}px`);
        plate.style.setProperty("--py", `${y * -8}px`);
        const p = panel();
        if (p) {
          p.style.setProperty("--rx", `${(-y * 3).toFixed(2)}deg`);
          p.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
        }
      },
      { passive: true }
    );
  }

  /* WANTED */
  function setWanted(level) {
    document.body.dataset.wanted = String(level);
    $$(".stars button").forEach((b) => {
      b.classList.toggle("is-on", Number(b.dataset.star) <= level);
    });
    $("#wantedStatus").textContent = WANTED[level - 1] || WANTED[0];
    localStorage.setItem("gta:wanted", String(level));
  }

  /* MISSION + STAMP */
  function bindMission() {
    $$("[data-step]").forEach((row) => {
      const btn = $(".mission__check", row);
      btn.addEventListener("click", () => {
        const on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        row.classList.toggle("is-done", on);
        const all = $$("[data-step]").every(
          (r) => $(".mission__check", r).getAttribute("aria-pressed") === "true"
        );
        if (all) showStamp();
      });
    });
  }

  function showStamp() {
    const el = $("#missionStamp");
    el.hidden = false;
    clearTimeout(showStamp._t);
    showStamp._t = setTimeout(() => {
      el.hidden = true;
    }, 1400);
  }

  /* CATCH GAME */
  function bindCatch() {
    $("#catchBest").textContent = String(best);
    const game = $("#catchGame .catch");
    const needle = $("#catchNeedle");
    $("#catchBtn").addEventListener("click", () => {
      game.classList.add("is-paused");
      const track = $(".catch__track");
      const zone = $(".catch__zone");
      const nRect = needle.getBoundingClientRect();
      const tRect = track.getBoundingClientRect();
      const zRect = zone.getBoundingClientRect();
      const nx = nRect.left + nRect.width / 2;
      const hit = nx >= zRect.left && nx <= zRect.right;
      if (hit) {
        streak++;
        if (streak > best) {
          best = streak;
          localStorage.setItem("gta:catchBest", String(best));
          $("#catchBest").textContent = String(best);
        }
        toast(`Caught · streak ${streak}`);
        if (streak >= 3) showStamp();
      } else {
        streak = 0;
        toast("Missed the bag");
      }
      $("#catchStreak").textContent = String(streak);
      setTimeout(() => game.classList.remove("is-paused"), 450);
    });

    $("#catchShare").addEventListener("click", () => {
      const text = `I caught a $${CFG.ticker || "GTA"} streak of ${best} on the Grand Titty Anthropic MDT.`;
      const url = CFG.x
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
        : "";
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else {
        navigator.clipboard?.writeText(text);
        toast("Streak copied — X link TBA");
      }
    });
  }

  /* EGGS */
  function refreshEggs() {
    $$("[data-egg]").forEach((b) => {
      const id = b.dataset.egg;
      b.classList.toggle("is-found", eggs.has(id));
      b.onclick = () => {
        eggs.add(id);
        localStorage.setItem("gta:eggs", JSON.stringify([...eggs]));
        b.classList.add("is-found");
        $("#eggStatus").textContent = `${eggs.size} / 3 recovered`;
        if (eggs.size >= 3) {
          toast("All tags recovered");
          showStamp();
        } else toast(`Tag secured · ${id}`);
      };
    });
    $("#eggStatus").textContent = `${eggs.size} / 3 recovered`;
  }

  /* LIGHTBOX */
  function bindLightbox() {
    const dlg = $("#lightbox");
    const img = $("#lbImg");
    $$("[data-lightbox]").forEach((btn) => {
      btn.addEventListener("click", () => {
        img.src = btn.dataset.lightbox;
        img.alt = $("img", btn)?.alt || "";
        dlg.showModal();
      });
    });
  }

  /* NAV */
  function bindNav() {
    $$("[data-go]").forEach((b) =>
      b.addEventListener("click", () => go(b.dataset.go))
    );
    $("#menuBtn").addEventListener("click", () => {
      $("#menu").hidden = !$("#menu").hidden;
    });
    $("#menuClose").addEventListener("click", () => {
      $("#menu").hidden = true;
    });
    $("#btnTour").addEventListener("click", startTour);
    $("#radioDial").addEventListener("click", nextScene);

    window.addEventListener("keydown", (e) => {
      if (e.target.matches("input,textarea")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextScene();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        const i = SCENES.indexOf(scene);
        go(SCENES[(i - 1 + SCENES.length) % SCENES.length]);
      }
    });

    let touchX = 0;
    window.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    window.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) < 60) return;
        if (dx < 0) nextScene();
        else {
          const i = SCENES.indexOf(scene);
          go(SCENES[(i - 1 + SCENES.length) % SCENES.length]);
        }
      },
      { passive: true }
    );
  }

  /* INIT */
  document.title = `${CFG.name || "Grand Titty Anthropic"} · $${CFG.ticker || "GTA"}`;
  applyLinks();
  bindNav();
  bindParallax();
  bindMission();
  bindCatch();
  refreshEggs();
  bindLightbox();
  setWanted(Number(localStorage.getItem("gta:wanted") || 3));
  $$(".stars button").forEach((b) =>
    b.addEventListener("click", () => setWanted(Number(b.dataset.star)))
  );
  tickClock();
  setInterval(tickClock, 1000);
  runBoot();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTour();
  });
})();

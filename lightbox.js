// Runs in the page's own JS world (see manifest "world": "MAIN") because the
// Fancybox API is only reachable from there, not from an isolated content script.
(() => {
  const PANEL_CLASS = "fuo-jump";
  const FLAGS_KEY = "fuo-question-flags";

  // Flags are stored per thread as a list of 0-based slide indexes.
  const threadKey = () => (location.pathname.match(/\.(\d+)\/?/) || [])[1] || location.pathname;

  const loadFlags = () => {
    try {
      const all = JSON.parse(localStorage.getItem(FLAGS_KEY)) || {};
      return new Set(all[threadKey()] || []);
    } catch {
      return new Set();
    }
  };

  const saveFlags = (flags) => {
    try {
      const all = JSON.parse(localStorage.getItem(FLAGS_KEY)) || {};
      if (flags.size) all[threadKey()] = [...flags].sort((a, b) => a - b);
      else delete all[threadKey()];
      localStorage.setItem(FLAGS_KEY, JSON.stringify(all));
    } catch {
      /* storage unavailable: flags just won't persist */
    }
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const build = (container, fancybox) => {
    const total = fancybox.carousel.slides.length;
    if (total < 2) return;

    const flags = loadFlags();
    let current = fancybox.getSlide()?.index ?? 0;

    const wrap = el("div", PANEL_CLASS);

    const bar = el("div", "fuo-jump__bar");
    const toggle = el("button", "fuo-jump__toggle");
    toggle.type = "button";
    const label = el("span", "fuo-jump__label");
    const caret = el("span", "fuo-jump__caret", "▾");
    toggle.append(label, caret);

    const flagBtn = el("button", "fuo-jump__flag");
    flagBtn.type = "button";
    flagBtn.title = "Đánh dấu câu chưa chắc";
    bar.append(toggle, flagBtn);

    const body = el("div", "fuo-jump__body");
    body.hidden = true;

    const summary = el("div", "fuo-jump__summary");
    const nextFlag = el("button", "fuo-jump__next", "Câu cờ tiếp theo →");
    nextFlag.type = "button";
    const top = el("div", "fuo-jump__top");
    top.append(summary, nextFlag);

    const grid = el("div", "fuo-jump__grid");
    const buttons = [];
    for (let i = 0; i < total; i++) {
      const b = el("button", "", String(i + 1));
      b.type = "button";
      b.addEventListener("click", () => {
        fancybox.jumpTo(i);
        body.hidden = true;
        toggle.classList.remove("is-open");
      });
      buttons.push(b);
      grid.append(b);
    }

    const legend = el("div", "fuo-jump__legend");
    legend.innerHTML =
      '<span><i class="is-current"></i>Đang xem</span><span><i class="is-flagged"></i>Chưa chắc</span>';

    body.append(top, grid, legend);
    wrap.append(bar, body);

    // The sidebar body is re-rendered on every slide change, so mount on the
    // sidebar shell itself (above the poster info) when it exists.
    (container.querySelector(".fancybox-sidebar") || container).prepend(wrap);

    const renderFlags = () => {
      buttons.forEach((b, i) => b.classList.toggle("is-flagged", flags.has(i)));
      summary.textContent = flags.size ? `⚑ ${flags.size} câu chưa chắc` : "Chưa gắn cờ câu nào";
      nextFlag.disabled = flags.size === 0;
      const on = flags.has(current);
      flagBtn.classList.toggle("is-on", on);
      flagBtn.textContent = on ? "⚑ Bỏ cờ" : "⚐ Gắn cờ";
    };

    toggle.addEventListener("click", () => {
      body.hidden = !body.hidden;
      toggle.classList.toggle("is-open", !body.hidden);
    });

    flagBtn.addEventListener("click", () => {
      if (flags.has(current)) flags.delete(current);
      else flags.add(current);
      saveFlags(flags);
      renderFlags();
    });

    nextFlag.addEventListener("click", () => {
      const ordered = [...flags].sort((a, b) => a - b);
      const target = ordered.find((i) => i > current) ?? ordered[0];
      if (target !== undefined) fancybox.jumpTo(target);
    });

    // Keep the highlighted number in sync with the slide being shown.
    let last = -1;
    const sync = () => {
      if (!container.isConnected) return clearInterval(timer);
      current = fancybox.getSlide()?.index ?? 0;
      if (current === last) return;
      if (last >= 0) buttons[last].classList.remove("is-current");
      buttons[current]?.classList.add("is-current");
      last = current;
      label.textContent = `Câu ${current + 1}/${total}`;
      renderFlags();
    };
    const timer = setInterval(sync, 250);
    sync();
  };

  const tryAttach = () => {
    const container = document.querySelector(".fancybox__container");
    if (!container || container.querySelector(`.${PANEL_CLASS}`)) return;
    // Fancybox adds the container first and finishes setting up the carousel and
    // sidebar afterwards, so bail out until they exist; a later mutation retries.
    if (container.classList.contains("fancybox-has-sidebar") && !container.querySelector(".fancybox-sidebar")) return;
    const fancybox = window.Fancybox?.getInstance?.();
    if (fancybox?.carousel?.slides) build(container, fancybox);
  };

  // subtree: the container itself is populated after it lands in <body>.
  new MutationObserver(tryAttach).observe(document.body, { childList: true, subtree: true });
  tryAttach();
})();

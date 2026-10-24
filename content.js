(() => {
  const STORAGE_KEY = "fuo-test-checklist";
  const PROGRESS_KEY = "fuo-study-progress";

  const loadChecklist = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const saveChecklist = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore storage errors */
    }
  };

  const loadProgress = () => {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch {
      return {};
    }
  };

  const saveProgress = (data) => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch {
      /* ignore storage errors */
    }
  };

  const extractThreadId = (url) => {
    if (!url) return null;
    const match = url.match(/\/threads\/(?:[^\/]*?\.)?(\d+)/) || url.match(/\.(\d+)\/?/);
    return match ? match[1] : null;
  };

  const threadId = (item) => {
    const link =
      item.querySelector('.structItem-title a[href*="/threads/"]:not(.labelLink)') ||
      item.querySelector('.structItem-title a[href*="/threads/"]');
    return link ? extractThreadId(link.getAttribute("href") || "") : null;
  };

  const markStudying = (id, current = null, total = null) => {
    if (!id) return;
    const progress = loadProgress();
    const existing = progress[id] || {};
    progress[id] = {
      ...existing,
      current: current !== null ? current : (existing.current ?? null),
      total: total !== null ? total : (existing.total ?? null),
      updatedAt: Date.now()
    };
    saveProgress(progress);
  };

  const removeStudying = (id) => {
    if (!id) return;
    const progress = loadProgress();
    delete progress[id];
    saveProgress(progress);
  };

  const renderItemStatus = (item, id) => {
    const checklist = loadChecklist();
    const progress = loadProgress();
    const isDone = !!checklist[id];
    const itemProgress = progress[id];

    item.classList.toggle("fuo-done", isDone);
    item.classList.toggle("fuo-learning", !isDone && !!itemProgress);

    const box = item.querySelector(".fuo-check");
    if (box && box.checked !== isDone) {
      box.checked = isDone;
    }

    const title = item.querySelector(".structItem-title");
    if (!title) return;

    let badge = title.querySelector(".fuo-badge");

    if (isDone) {
      const labelText = "✓ Đã ôn xong";
      if (badge && badge.dataset.fuoText === labelText && badge.dataset.fuoDone === "true") {
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        title.appendChild(badge);
      }
      badge.className = "fuo-badge fuo-badge--done";
      badge.dataset.fuoText = labelText;
      badge.dataset.fuoDone = "true";
      badge.title = "Đã ôn xong đề này";
      badge.innerHTML = `<span class="fuo-badge__text">${labelText}</span>`;
      badge.onclick = (e) => {
        if (e.target.closest(".fuo-badge__remove")) return;
        const link =
          title.querySelector('a[href*="/threads/"]:not(.labelLink)') ||
          title.querySelector('a[href*="/threads/"]');
        if (link) link.click();
      };
    } else if (itemProgress) {
      let labelText = "Đang học";
      if (itemProgress.current && itemProgress.total) {
        labelText = `Đang học tới câu ${itemProgress.current}/${itemProgress.total}`;
      } else if (itemProgress.current) {
        labelText = `Đang học tới câu ${itemProgress.current}`;
      }

      if (badge && badge.dataset.fuoText === labelText && badge.dataset.fuoDone === "false") {
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        title.appendChild(badge);
      }
      badge.className = "fuo-badge fuo-badge--learning";
      badge.dataset.fuoText = labelText;
      badge.dataset.fuoDone = "false";
      badge.title = `${labelText} (Bấm × để xoá trạng thái)`;
      badge.innerHTML = `
        <span class="fuo-badge__dot"></span>
        <span class="fuo-badge__text">${labelText}</span>
        <button type="button" class="fuo-badge__remove" title="Xoá trạng thái đang học">×</button>
      `;

      badge.onclick = (e) => {
        if (e.target.closest(".fuo-badge__remove")) return;
        const link =
          title.querySelector('a[href*="/threads/"]:not(.labelLink)') ||
          title.querySelector('a[href*="/threads/"]');
        if (link) link.click();
      };

      const removeBtn = badge.querySelector(".fuo-badge__remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          removeStudying(id);
          renderItemStatus(item, id);
          updateProgress();
        });
      }
    } else if (badge) {
      badge.remove();
    }
  };

  const updateProgress = () => {
    const items = document.querySelectorAll(".structItem--thread[data-fuo-id]");
    let bar = document.querySelector(".fuo-progress");
    if (!items.length) return bar && bar.remove();

    if (!bar) {
      bar = document.createElement("div");
      bar.className = "fuo-progress";
      items[0].parentElement.parentElement.insertBefore(bar, items[0].parentElement);
    }
    const checklist = loadChecklist();
    const progress = loadProgress();

    const doneOnPage = document.querySelectorAll(".structItem--thread.fuo-done").length;
    const totalDone = Object.keys(checklist).length;

    const learningOnPage = document.querySelectorAll(".structItem--thread.fuo-learning:not(.fuo-done)").length;
    const totalLearning = Object.keys(progress).filter((k) => !checklist[k]).length;

    let text = "";
    if (totalLearning > 0 || learningOnPage > 0) {
      text = `Đã ôn: ${totalDone} đề · Đang học: ${totalLearning} đề (trang này: ${doneOnPage} đã ôn, ${learningOnPage} đang học / ${items.length} đề)`;
    } else {
      text = `Đã ôn: ${totalDone} đề tổng cộng (trang này: ${doneOnPage}/${items.length})`;
    }

    // Skip no-op writes, otherwise the MutationObserver would loop forever.
    if (bar.textContent !== text) bar.textContent = text;
  };

  const decorateThreadList = () => {
    const checklist = loadChecklist();

    document.querySelectorAll(".structItem--thread:not([data-fuo-id])").forEach((item) => {
      const id = threadId(item);
      const title = item.querySelector(".structItem-title");
      if (!id || !title) return;

      item.dataset.fuoId = id;

      const box = document.createElement("input");
      box.type = "checkbox";
      box.className = "fuo-check";
      box.title = "Đã ôn xong đề này";
      box.checked = !!checklist[id];

      box.addEventListener("click", (e) => e.stopPropagation());
      box.addEventListener("change", () => {
        const current = loadChecklist();
        if (box.checked) current[id] = Date.now();
        else delete current[id];
        saveChecklist(current);
        renderItemStatus(item, id);
        updateProgress();
      });

      title.prepend(box);

      // Track clicks on any thread links to automatically mark as studying
      const links = item.querySelectorAll('a[href*="/threads/"]');
      links.forEach((a) => {
        const trackClick = () => {
          markStudying(id);
          renderItemStatus(item, id);
          updateProgress();
        };
        a.addEventListener("click", trackClick);
        a.addEventListener("auxclick", trackClick);
      });
    });

    document.querySelectorAll(".structItem--thread[data-fuo-id]").forEach((item) => {
      renderItemStatus(item, item.dataset.fuoId);
    });

    updateProgress();
  };

  const renderThreadTitleStatus = (titleEl, id) => {
    const checklist = loadChecklist();
    const progress = loadProgress();
    const isDone = !!checklist[id];
    const itemProgress = progress[id];

    let badge = titleEl.querySelector(".fuo-badge");

    if (isDone) {
      const labelText = "✓ Đã ôn xong";
      if (badge && badge.dataset.fuoText === labelText && badge.dataset.fuoDone === "true") {
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        titleEl.appendChild(badge);
      }
      badge.className = "fuo-badge fuo-badge--done";
      badge.dataset.fuoText = labelText;
      badge.dataset.fuoDone = "true";
      badge.title = "Đã ôn xong đề này";
      badge.innerHTML = `<span class="fuo-badge__text">${labelText}</span>`;
    } else if (itemProgress) {
      let labelText = "Đang học";
      if (itemProgress.current && itemProgress.total) {
        labelText = `Đang học tới câu ${itemProgress.current}/${itemProgress.total}`;
      } else if (itemProgress.current) {
        labelText = `Đang học tới câu ${itemProgress.current}`;
      }

      if (badge && badge.dataset.fuoText === labelText && badge.dataset.fuoDone === "false") {
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        titleEl.appendChild(badge);
      }
      badge.className = "fuo-badge fuo-badge--learning";
      badge.dataset.fuoText = labelText;
      badge.dataset.fuoDone = "false";
      badge.title = `${labelText} (Bấm × để xoá trạng thái)`;
      badge.innerHTML = `
        <span class="fuo-badge__dot"></span>
        <span class="fuo-badge__text">${labelText}</span>
        <button type="button" class="fuo-badge__remove" title="Xoá trạng thái đang học">×</button>
      `;

      const removeBtn = badge.querySelector(".fuo-badge__remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          removeStudying(id);
          renderThreadTitleStatus(titleEl, id);
        });
      }
    } else if (badge) {
      badge.remove();
    }
  };

  const decorateThreadPage = () => {
    if (!location.pathname.includes("/threads/")) return;
    const id = extractThreadId(location.pathname);
    if (!id) return;

    // Automatically mark as studying when visiting the thread page
    markStudying(id);

    const titleEl = document.querySelector(".p-title-value");
    if (!titleEl) return;

    let box = titleEl.querySelector(".fuo-check");
    if (!box) {
      box = document.createElement("input");
      box.type = "checkbox";
      box.className = "fuo-check";
      box.title = "Đã ôn xong đề này";
      box.addEventListener("change", () => {
        const checklist = loadChecklist();
        if (box.checked) checklist[id] = Date.now();
        else delete checklist[id];
        saveChecklist(checklist);
        renderThreadTitleStatus(titleEl, id);
      });
      titleEl.prepend(box);
    }

    const checklist = loadChecklist();
    box.checked = !!checklist[id];
    renderThreadTitleStatus(titleEl, id);
  };

  const decorate = () => {
    decorateThreadList();
    decorateThreadPage();
  };

  decorate();

  // XenForo loads filters/pagination via AJAX, so re-run when the list changes.
  new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });

  // Sync when lightbox updates progress in real time
  window.addEventListener("fuo:progress-updated", (e) => {
    const { id } = e.detail || {};
    if (id) {
      const item = document.querySelector(`.structItem--thread[data-fuo-id="${id}"]`);
      if (item) renderItemStatus(item, id);
      const titleEl = document.querySelector(".p-title-value");
      if (titleEl && extractThreadId(location.pathname) === String(id)) {
        renderThreadTitleStatus(titleEl, id);
      }
      updateProgress();
    } else {
      decorate();
    }
  });

  // Sync across tabs, tab switches, and back-forward navigation
  window.addEventListener("storage", (e) => {
    if (!e.key || e.key === STORAGE_KEY || e.key === PROGRESS_KEY) {
      decorate();
    }
  });

  window.addEventListener("focus", decorate);
  window.addEventListener("pageshow", decorate);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) decorate();
  });

  // Bridge between lightbox (MAIN world) and extension background (service worker)
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "fuo-main") return;

    if (event.data.action === "captureTab") {
      const requestId = event.data.requestId;
      try {
        if (typeof chrome === "undefined" || !chrome.runtime?.id) {
          throw new Error("Extension context invalidated.");
        }
        chrome.runtime.sendMessage({ action: "captureTab" }, (response) => {
          const err = chrome.runtime.lastError;
          window.postMessage(
            {
              source: "fuo-isolated",
              action: "captureTabResponse",
              requestId,
              response: err ? { success: false, error: err.message } : response
            },
            "*"
          );
        });
      } catch (err) {
        window.postMessage(
          {
            source: "fuo-isolated",
            action: "captureTabResponse",
            requestId,
            response: { success: false, error: err?.message || String(err) }
          },
          "*"
        );
      }
    }
  });
})();

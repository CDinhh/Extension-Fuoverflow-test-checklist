(() => {
  const STORAGE_KEY = "fuo-test-checklist";

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  const threadId = (item) => {
    const link = item.querySelector('.structItem-title a[href*="/threads/"]');
    const match = link && link.getAttribute("href").match(/\.(\d+)\/?/);
    return match ? match[1] : null;
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
    const done = document.querySelectorAll(".structItem--thread.fuo-done").length;
    const total = Object.keys(load()).length;
    const text = `Đã ôn: ${total} đề tổng cộng (trang này: ${done}/${items.length})`;
    // Skip no-op writes, otherwise the MutationObserver would loop forever.
    if (bar.textContent !== text) bar.textContent = text;
  };

  const decorate = () => {
    const data = load();

    document.querySelectorAll(".structItem--thread:not([data-fuo-id])").forEach((item) => {
      const id = threadId(item);
      const title = item.querySelector(".structItem-title");
      if (!id || !title) return;

      item.dataset.fuoId = id;

      const box = document.createElement("input");
      box.type = "checkbox";
      box.className = "fuo-check";
      box.title = "Đã ôn xong đề này";
      box.checked = !!data[id];
      item.classList.toggle("fuo-done", box.checked);

      box.addEventListener("click", (e) => e.stopPropagation());
      box.addEventListener("change", () => {
        const current = load();
        if (box.checked) current[id] = Date.now();
        else delete current[id];
        save(current);
        item.classList.toggle("fuo-done", box.checked);
        updateProgress();
      });

      title.prepend(box);
    });

    updateProgress();
  };

  decorate();

  // XenForo loads filters/pagination via AJAX, so re-run when the list changes.
  new MutationObserver(decorate).observe(document.body, { childList: true, subtree: true });
})();

      /* ===== v5 ===== */
      function arm(b, ok) {
        if (b.classList.contains("arm")) {
          clearTimeout(b._t);
          ok();
          return;
        }
        b.dataset.t = b.textContent;
        b.textContent = "Точно удалить?";
        b.classList.add("arm");
        b._t = setTimeout(() => {
          b.classList.remove("arm");
          b.textContent = b.dataset.t;
        }, 3000);
      }
      function delNode(id) {
        S.links = S.links.filter((l) => l.a !== id && l.b !== id);
        S.nodes = S.nodes.filter((n) => n.id !== id);
        (S.events || []).forEach(
          (e) => (e.refs = e.refs.filter((r) => r !== id)),
        );
        S.nodes.forEach((n) =>
          (n.members || []).forEach((m) => {
            if (m.nid === id) m.nid = "";
          }),
        );
        if (openId === id) openId = null;
        if (F.rel === id) F.rel = "";
        save();
        render();
      }
      const DB = (id) =>
        `<button class="dng" data-delnode="${id}">Удалить</button>`;
      function fitItems() {
        document.querySelectorAll("#list .item").forEach((it) => {
          let w = 0;
          if (it.classList.contains("open"))
            it.querySelectorAll(".st[data-w]").forEach((x) => {
              w = Math.max(w, +x.dataset.w);
            });
          it.style.maxWidth = w
            ? Math.min(innerWidth - 28, Math.max(980, w + 64)) + "px"
            : "";
        });
      }
      const _rl5 = renderList;
      renderList = function () {
        _rl5();
        document.querySelectorAll("#list .item").forEach((it) => {
          const a = it.querySelector(".act");
          if (a) a.insertAdjacentHTML("beforeend", DB(it.dataset.id));
        });
        fitItems();
      };
      $("#list").addEventListener("click", (e) => {
        const b = e.target.closest("[data-delnode]");
        if (b) {
          arm(b, () => {
            b.closest(".item").classList.add("gone");
            setTimeout(() => delNode(b.dataset.delnode), 380);
          });
          return;
        }
        fitItems();
      });
      addEventListener("resize", fitItems);
      const _show2 = show;
      show = function (id, el) {
        _show2(id, el);
        const a = $("#panel .act");
        if (a && byId(id)) a.insertAdjacentHTML("beforeend", DB(id));
      };
      $("#panel").addEventListener(
        "click",
        (e) => {
          const b = e.target.closest("[data-delnode],[data-del]");
          if (!b) return;
          e.stopPropagation();
          const id = b.dataset.delnode || cur;
          arm(b, () => {
            delNode(id);
            closePanel();
          });
        },
        true,
      );
      const _rt = renderTL;
      renderTL = function () {
        _rt();
        document.querySelectorAll("#tltrack .ev").forEach((ev) => {
          const m = ev.querySelector(".more2");
          if (m)
            m.insertAdjacentHTML(
              "beforeend",
              `<button class="chip dng" data-evdel="${ev.dataset.id}">Удалить</button>`,
            );
        });
      };
      $("#tl").addEventListener("click", (e) => {
        const b = e.target.closest("[data-evdel]");
        if (b)
          arm(b, () => {
            S.events = S.events.filter((x) => x.id !== b.dataset.evdel);
            save();
            renderTL();
          });
      });

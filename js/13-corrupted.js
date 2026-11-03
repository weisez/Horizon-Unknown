      /* ===== v7: corrupted content ===== */
      const GLC = "▒▓█░▌▐╳▚▞#%&?/\\",
        CXO = new WeakMap(),
        CXN = new Set(),
        CXI = (n) => {
          n = byId(n);
          return !!(n && n.corrupt);
        };
      const GLF = [
        "[ДАННЫЕ УТЕРЯНЫ]",
        "ERR_0x" + "7F3A",
        "—",
        "[СТЁРТО]",
        "▓▓ NO SIGNAL ▓▓",
      ];
      function gl(t) {
        const ws = t.trim().split(/\s+/),
          strict = ws.length <= 2 || t.length < 24;
        return t.replace(/\S+/g, (w) => {
          const r = Math.random(),
            L = w.length,
            g = (n) =>
              Array.from(
                { length: n },
                () => GLC[Math.floor(Math.random() * GLC.length)],
              ).join("");
          if (L < 2) return g(1);
          if (!strict && r < 0.12) return w;
          if (!strict && r < 0.16)
            return GLF[Math.floor(Math.random() * GLF.length)];
          const k = 1 + Math.floor(Math.random() * Math.min(3, L - 1));
          if (r < 0.42) return w.slice(0, k) + g(L - k);
          if (r < 0.6) return g(L - k) + w.slice(L - k);
          return g(L);
        });
      }
      function cxText(root) {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
          a = [];
        while (w.nextNode()) a.push(w.currentNode);
        a.forEach((t) => {
          const p = t.parentElement;
          if (
            !t.nodeValue.trim() ||
            !p ||
            p.closest("input,select,textarea,.cx-b,.act,button:not([data-go])")
          )
            return;
          if (!CXO.has(t)) CXO.set(t, t.nodeValue);
          CXN.add(t);
          t.nodeValue = gl(CXO.get(t));
        });
      }
      function cxMark(el, id) {
        if (!CXI(id)) return;
        el.classList.add("corrupt");
        if (!el.querySelector(":scope>.cx-b"))
          el.insertAdjacentHTML(
            "beforeend",
            `<i class="cx-sc"></i><span class="cx-b">DATA CORRUPTED</span>`,
          );
        cxText(el);
      }
      setInterval(() => {
        if (document.hidden) return;
        CXN.forEach((t) => {
          if (!t.isConnected) CXN.delete(t);
          else t.nodeValue = gl(CXO.get(t));
        });
      }, 1500);
      const _rl7 = renderList;
      renderList = function () {
        _rl7();
        document.querySelectorAll("#list .item").forEach((it) => {
          if (!CXI(it.dataset.id)) return;
          cxMark(it, it.dataset.id);
          if (VIEW) it.querySelectorAll(".act").forEach((a) => a.remove());
        });
      };
      const _r7 = render;
      render = function () {
        _r7();
        document
          .querySelectorAll("#nodes .node")
          .forEach((el) => cxMark(el, el.dataset.id));
      };
      const _rtl7 = renderTL;
      renderTL = function () {
        _rtl7();
        document.querySelectorAll("#tltrack [data-go]").forEach((e) => {
          if (CXI(e.dataset.go)) cxText(e);
        });
      };
      const _show4 = show;
      show = function (id, el) {
        _show4(id, el);
        const p = $("#panel");
        if (!p) return;
        p.querySelectorAll("[data-go]").forEach((e) => {
          if (CXI(e.dataset.go)) cxText(e);
        });
        if (CXI(id)) {
          const b = p.querySelector(".body");
          if (b) {
            b.classList.add("corrupt");
            if (!b.querySelector(":scope>.cx-b"))
              b.insertAdjacentHTML(
                "afterbegin",
                `<span class="cx-b" style="top:0;right:0">DATA CORRUPTED</span>`,
              );
            cxText(b);
            if (VIEW)
              b.querySelectorAll(".act button").forEach((x) => {
                if (!("close" in x.dataset)) x.remove();
              });
          }
        }
      };
      const _os = openStory;
      openStory = function (id, ed) {
        _os(id, ed);
        const R = $("#rd"),
          c = CXI(id) && !(ed && !VIEW);
        R.classList.toggle("corrupt", c);
        if (c) {
          cxText($(".rd-hero"));
          cxText(RB);
        }
      };
      const _edit3 = edit;
      edit = function (id) {
        _edit3(id);
        const n = byId(id),
          a = $("#panel .ed .act");
        if (!n || !a || $("#panel .cx-tg")) return;
        a.insertAdjacentHTML(
          "beforebegin",
          `<label class="cx-tg"><input type="checkbox" data-cx ${n.corrupt ? "checked" : ""}><span><b>Повреждено (corrupted)</b><small>Карточка глючит, виден лишь мусор и обрывки фраз. Подходит для того, что ещё только планируется.</small></span></label>`,
        );
      };
      $("#panel").addEventListener("change", (e) => {
        if (e.target.dataset && "cx" in e.target.dataset) {
          const n = byId(cur);
          if (n) {
            n.corrupt = e.target.checked ? 1 : 0;
            if (!n.corrupt) delete n.corrupt;
            save();
            render();
            renderList();
          }
        }
      });

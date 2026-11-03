      /* ===== v9: card order & dividers ===== */
      const FOLD = new Set();
      function ordFull(t) {
        S.ord = S.ord || {};
        S.divs = S.divs || {};
        const ids = S.nodes.filter((n) => n.type === t).map((n) => n.id),
          dv = Object.keys(S.divs).filter((k) => S.divs[k].type === t),
          set = new Set([...ids, ...dv]),
          r = (S.ord[t] || []).filter((x) => set.has(x)),
          have = new Set(r);
        set.forEach((x) => {
          if (!have.has(x)) r.push(x);
        });
        return r;
      }
      function lstDecorate() {
        if (!TT[tab]) return;
        const L = $("#list"),
          full = ordFull(tab),
          dv = S.divs,
          ed = !VIEW,
          items = new Map();
        L.querySelectorAll(":scope>.item").forEach((e) =>
          items.set(e.dataset.id, e),
        );
        const rows = [];
        let g = null;
        full.forEach((id) => {
          if (dv[id]) {
            g = { id, vis: 0, tot: 0 };
            rows.push({ d: g });
          } else {
            const n = byId(id);
            if (n && n.type === tab && g) g.tot++;
            if (items.has(id)) {
              if (g) g.vis++;
              rows.push({ el: items.get(id), g });
            }
          }
        });
        items.forEach((e) => e.remove());
        const F = document.createDocumentFragment();
        let foldOn = false,
          first = true;
        const zone = (b, fold) => {
          if (!ed) return;
          const z = document.createElement("button");
          z.className = "dv-add" + (fold ? " fh" : "");
          z.dataset.dvadd = b;
          z.innerHTML = "<span>+ разделитель</span>";
          F.appendChild(z);
        };
        rows.forEach((r) => {
          if (r.d) {
            const g = r.d;
            if (!(g.vis > 0 || (ed && g.tot === 0))) return;
            zone(g.id, foldOn);
            foldOn = FOLD.has(g.id);
            const d = dv[g.id],
              e = document.createElement("div");
            e.className = "dv" + (foldOn ? " fold" : "");
            e.dataset.id = g.id;
            e.style.setProperty("--ac", "var(--c-" + tab + ")");
            e.innerHTML =
              (ed
                ? `<button class="dh" data-dh title="Перетащить">⋮⋮</button>`
                : "") +
              `<i class="dv-l"></i><div class="dv-c"><div class="dv-r"><i class="dv-o">✦</i>${ed ? `<input class="dv-t" value="${esc(d.label)}" placeholder="Название раздела">` : `<span class="dv-t">${esc(d.label)}</span>`}<i class="dv-o">✦</i></div>${ed ? `<input class="dv-s" value="${esc(d.sub || "")}" placeholder="Подзаголовок (необязательно)">` : d.sub ? `<span class="dv-s">${esc(d.sub)}</span>` : ""}<span class="dv-n">${g.vis}</span></div><i class="dv-l b"></i><button class="dv-f" data-dvf title="Свернуть/развернуть раздел">⌄</button>${ed ? `<button class="dv-x" data-dvx title="Удалить разделитель">×</button>` : ""}`;
            F.appendChild(e);
            first = false;
          } else {
            zone(r.el.dataset.id, foldOn);
            if (foldOn) r.el.classList.add("fh");
            if (ed)
              r.el.insertAdjacentHTML(
                "afterbegin",
                `<button class="dh" data-dh title="Перетащить, чтобы изменить порядок">⋮⋮</button>`,
              );
            F.appendChild(r.el);
          }
        });
        zone("end", foldOn);
        L.appendChild(F);
        const lh = L.querySelector(".lh");
        if (lh && ed)
          lh.insertAdjacentHTML(
            "beforeend",
            `<button class="dv-new" data-dvadd="end">+ Разделитель</button>`,
          );
      }
      const _rl9 = renderList;
      renderList = function () {
        _rl9();
        lstDecorate();
      };
      $("#list").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if (d.dvadd !== undefined) {
          const f = ordFull(tab),
            id = "d_" + uid(),
            i = d.dvadd === "end" ? f.length : f.indexOf(d.dvadd);
          S.divs[id] = { type: tab, label: "Новый раздел", sub: "" };
          f.splice(i < 0 ? f.length : i, 0, id);
          S.ord[tab] = f;
          save();
          renderList();
          const inp = $(`.dv[data-id="${id}"] .dv-t`);
          if (inp) {
            inp.focus();
            inp.select();
            inp.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        } else if (d.dvf !== undefined) {
          const dv = b.closest(".dv"),
            id = dv.dataset.id,
            on = !FOLD.has(id);
          on ? FOLD.add(id) : FOLD.delete(id);
          dv.classList.toggle("fold", on);
          let n = dv.nextElementSibling;
          while (n && !n.classList.contains("dv")) {
            if (n.matches(".item,.dv-add")) n.classList.toggle("fh", on);
            n = n.nextElementSibling;
          }
        } else if (d.dvx !== undefined) {
          const id = b.closest(".dv").dataset.id;
          arm(b, () => {
            delete S.divs[id];
            S.ord[tab] = ordFull(tab);
            save();
            renderList();
          });
        }
      });
      $("#list").addEventListener("input", (e) => {
        const t = e.target,
          dv = t.closest && t.closest(".dv");
        if (!dv || !S.divs[dv.dataset.id]) return;
        if (t.classList.contains("dv-t")) S.divs[dv.dataset.id].label = t.value;
        else if (t.classList.contains("dv-s"))
          S.divs[dv.dataset.id].sub = t.value;
        save();
      });
      /* drag to reorder */
      let ld = null;
      $("#list").addEventListener("pointerdown", (e) => {
        const h = e.target.closest(".dh");
        if (!h || VIEW || (e.pointerType === "mouse" && e.button !== 0)) return;
        e.preventDefault();
        ld = {
          el: h.parentElement,
          sy: e.clientY,
          sx: e.clientX,
          pid: e.pointerId,
          on: 0,
        };
        addEventListener("pointermove", ldMove);
        addEventListener("pointerup", ldEnd);
        addEventListener("pointercancel", ldCancel);
      });
      function ldScroller(L) {
        let p = L;
        while (p && p !== document.body && p !== document.documentElement) {
          if (
            /(auto|scroll)/.test(getComputedStyle(p).overflowY) &&
            p.scrollHeight > p.clientHeight
          )
            return p;
          p = p.parentElement;
        }
        return window;
      }
      function ldBegin() {
        const L = $("#list"),
          el = ld.el,
          els = [...L.children].filter(
            (c) => c.matches(".item,.dv") && !c.classList.contains("fh"),
          ),
          lr = L.getBoundingClientRect(),
          r0 = el.getBoundingClientRect();
        ld.els = els;
        ld.i0 = els.indexOf(el);
        ld.j = ld.i0;
        ld.pos = els.map((c) => {
          const r = c.getBoundingClientRect();
          return { top: r.top - lr.top + L.scrollTop, h: r.height };
        });
        ld.H =
          ld.i0 < els.length - 1
            ? ld.pos[ld.i0 + 1].top - ld.pos[ld.i0].top
            : ld.pos[ld.i0].h + 16;
        ld.gy = Math.min(ld.sy - r0.top, 34);
        ld.sc = ldScroller(L);
        const g = document.createElement("div");
        g.className = "lst-ghost";
        g.style.width = Math.min(r0.width, 520) + "px";
        g.style.left = r0.left + "px";
        g.style.setProperty("border-left-color", "var(--c-" + tab + ")");
        const isD = el.classList.contains("dv");
        g.innerHTML = isD
          ? `<small>Разделитель</small><b>${esc((S.divs[el.dataset.id] || {}).label || "")}</b>`
          : `<small>${esc((el.querySelector(".kind") || {}).textContent || "")}</small><b>${esc((el.querySelector("h3") || {}).textContent || "")}</b>`;
        document.body.appendChild(g);
        ld.g = g;
        el.classList.add("lst-slot");
        document.body.classList.add("lst-drag");
        ld.on = 1;
        const loop = () => {
          if (!ld) return;
          const y = ld.ey,
            vh = innerHeight;
          let dy = 0;
          if (y < 80) dy = -Math.ceil((80 - y) / 6);
          else if (y > vh - 80) dy = Math.ceil((y - (vh - 80)) / 6);
          if (dy) {
            ld.sc === window ? scrollBy(0, dy) : (ld.sc.scrollTop += dy);
          }
          ldFrame();
          ld.raf = requestAnimationFrame(loop);
        };
        ld.raf = requestAnimationFrame(loop);
      }
      function ldFrame() {
        const L = $("#list"),
          lr = L.getBoundingClientRect(),
          py = ld.ey - lr.top + L.scrollTop;
        ld.g.style.top = ld.ey - ld.gy + "px";
        let j = 0;
        ld.els.forEach((c, k) => {
          if (k !== ld.i0 && ld.pos[k].top + ld.pos[k].h / 2 < py) j++;
        });
        ld.j = j;
        ld.els.forEach((c, k) => {
          if (k === ld.i0) {
            c.style.transform = "";
            return;
          }
          const m = k - (k > ld.i0 ? 1 : 0),
            sh = k > ld.i0 && m < j ? -ld.H : k < ld.i0 && m >= j ? ld.H : 0;
          c.style.transform = sh ? `translateY(${sh}px)` : "";
        });
      }
      function ldMove(e) {
        if (!ld || e.pointerId !== ld.pid) return;
        ld.ey = e.clientY;
        if (!ld.on) {
          if (
            Math.abs(e.clientY - ld.sy) < 4 &&
            Math.abs(e.clientX - ld.sx) < 4
          )
            return;
          ldBegin();
        }
      }
      function ldClean() {
        removeEventListener("pointermove", ldMove);
        removeEventListener("pointerup", ldEnd);
        removeEventListener("pointercancel", ldCancel);
        if (!ld || !ld.on) return;
        cancelAnimationFrame(ld.raf);
        ld.g.remove();
        document.body.classList.add("lst-nt");
        ld.els.forEach((c) => (c.style.transform = ""));
        ld.el.classList.remove("lst-slot");
        document.body.classList.remove("lst-drag");
        setTimeout(() => document.body.classList.remove("lst-nt"), 60);
      }
      function ldEnd(e) {
        if (!ld || e.pointerId !== ld.pid) return;
        const d = ld;
        ldClean();
        ld = null;
        if (!d.on) return;
        if (d.j !== d.i0) {
          const ids = d.els.map((c) => c.dataset.id),
            mv = ids.splice(d.i0, 1)[0];
          ids.splice(d.j, 0, mv);
          const full = ordFull(tab),
            vis = new Set(ids),
            slots = [];
          full.forEach((x, i) => {
            if (vis.has(x)) slots.push(i);
          });
          slots.forEach((idx, n) => (full[idx] = ids[n]));
          S.ord[tab] = full;
          save();
        }
        renderList();
      }
      function ldCancel() {
        const d = ld;
        ldClean();
        ld = null;
        if (d && d.on) renderList();
      }
      addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape" && ld && ld.on) {
            e.stopPropagation();
            ldCancel();
          }
        },
        true,
      );

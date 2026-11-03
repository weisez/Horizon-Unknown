      /* ===== v4: relations window + drag helpers ===== */
      const SEEN = new Set(),
        KO = Object.keys(LK);
      const _r5 = render;
      render = function () {
        _r5();
        S.nodes.forEach((n) => SEEN.add(n.id));
      };
      $("#nodes").addEventListener("animationend", (e) => {
        if (e.animationName === "pop") e.target.dataset.new = "0";
      });
      function relUI(id) {
        const n = byId(id),
          rel = S.links
            .filter((l) => l.a === id || l.b === id)
            .map((l) => ({
              l,
              o: byId(l.a === id ? l.b : l.a),
              out: l.a === id,
            }))
            .filter((r) => r.o)
            .sort(
              (x, y) =>
                KO.indexOf(x.l.kind || "none") - KO.indexOf(y.l.kind || "none"),
            );
        if (!rel.length)
          return `<div class="rels"><h4>Связи</h4><div class="rl-empty">Пока ни с кем не связан<button data-edit="${id}">+ Добавить связь</button></div></div>`;
        const W = 360,
          H = 250,
          cx = W / 2,
          cy = H / 2,
          rx = 128,
          ry = 78,
          m = rel.length;
        let lines = "",
          nodes = "";
        rel.forEach((r, i) => {
          const a = -Math.PI / 2 + (i / m) * Math.PI * 2,
            x = cx + Math.cos(a) * rx,
            y = cy + Math.sin(a) * ry,
            k = r.l.kind || "none",
            K = LK[k] || LK.none,
            dx = x - cx,
            dy = y - cy,
            qx = (cx + x) / 2 - dy * 0.14,
            qy = (cy + y) / 2 + dx * 0.14,
            tx = 0.25 * cx + 0.5 * qx + 0.25 * x,
            ty = 0.25 * cy + 0.5 * qy + 0.25 * y,
            nm = r.o.name;
          lines += `<g class="rm-l" data-i="${i}" data-k="${k}" style="--kc:${K.c};--kd:${K.d};animation-delay:${i * 60}ms"><path d="M${cx} ${cy}Q${qx} ${qy} ${x} ${y}"/>${r.l.label && m < 9 ? `<text class="rm-t" x="${tx}" y="${ty}">${esc(r.l.label)}</text>` : ""}</g>`;
          nodes += `<g class="rm-n ${r.o.type}" data-i="${i}" data-k="${k}" data-go="${r.o.id}" style="--dx:${cx - x}px;--dy:${cy - y}px;animation-delay:${i * 60 + 120}ms"><circle cx="${x}" cy="${y}" r="20"/><text x="${x}" y="${y}">${esc(ini(nm))}</text><text class="nm" x="${x}" y="${y + 34}">${esc(nm.length > 16 ? nm.slice(0, 15) + "…" : nm)}</text></g>`;
        });
        const c = `<g class="rm-n rm-c ${n.type}"><circle class="rm-p" cx="${cx}" cy="${cy}" r="26"/><circle cx="${cx}" cy="${cy}" r="26"/><text x="${cx}" y="${cy}">${esc(ini(n.name))}</text></g>`;
        const ks = [...new Set(rel.map((r) => r.l.kind || "none"))];
        const chips =
          ks.length > 1
            ? `<div class="rk">${ks.map((k) => `<button data-rk="${k}" style="--kc:${LK[k].c}">${LK[k].n}<b>${rel.filter((r) => (r.l.kind || "none") === k).length}</b></button>`).join("")}</div>`
            : "";
        const rows = rel
          .map((r, i) => {
            const o = r.o,
              k = r.l.kind || "none",
              K = LK[k];
            return `<button class="rl-row ${o.type}" data-go="${o.id}" data-i="${i}" data-k="${k}" title="${K.n}" style="--kc:${K.c};animation-delay:${i * 45 + 100}ms"><span class="rl-av">${o.img ? `<img src="${o.img}" alt="">` : esc(ini(o.name))}</span><span class="rl-tx"><b>${esc(o.name)}</b><i>${T[o.type]}${o.sub ? " · " + esc(o.sub) : ""}</i></span><span class="rl-tag"><s></s>${r.l.label ? esc(r.l.label) : K.n}<u>${r.out ? "→" : "←"}</u></span></button>`;
          })
          .join("");
        return `<div class="rels"><h4>Связи <span class="cnt">${m}</span></h4><svg class="rm" viewBox="0 0 ${W} ${H}">${lines}${nodes}${c}</svg>${chips}<div class="rl">${rows}</div></div>`;
      }
      const _show = show;
      show = function (id, el) {
        _show(id, el);
        const b = $("#panel .body");
        if (!b || !byId(id)) return;
        const h = [...b.children].find(
          (x) => x.tagName === "H4" && x.textContent === "Связи",
        );
        if (h) {
          if (h.nextElementSibling) h.nextElementSibling.remove();
          h.remove();
        }
        b.querySelector(".act").insertAdjacentHTML("beforebegin", relUI(id));
      };
      function hlRel(i) {
        const p = $("#panel"),
          m = p.querySelector(".rm");
        if (!m) return;
        m.classList.toggle("hl", i != null);
        p.querySelectorAll(".rels [data-i]").forEach((x) =>
          x.classList.toggle("on", x.dataset.i === i),
        );
      }
      $("#panel").addEventListener("mouseover", (e) => {
        const t = e.target.closest(".rels [data-i]");
        hlRel(t ? t.dataset.i : null);
      });
      $("#panel").addEventListener("mouseout", (e) => {
        const r = e.relatedTarget;
        if (!r || !r.closest || !r.closest(".rels [data-i]")) hlRel(null);
      });
      $("#panel").addEventListener("click", (e) => {
        const g = e.target.closest(".rm-n[data-go]");
        if (g) {
          show(g.dataset.go);
          return;
        }
        const b = e.target.closest("[data-rk]");
        if (b) {
          b.classList.toggle("off");
          const P = $("#panel"),
            off = new Set(
              [...P.querySelectorAll(".rk .off")].map((x) => x.dataset.rk),
            );
          P.querySelectorAll(".rels [data-k]").forEach((x) =>
            x.classList.toggle("hide", off.has(x.dataset.k)),
          );
        }
      });
      /* edit: links manager */
      function lmHTML(id) {
        const rel = S.links.filter((l) => l.a === id || l.b === id);
        return (
          `<div class="lm"><h4>Связи <span class="cnt">${rel.length}</span></h4>` +
          rel
            .map((l, i) => {
              const o = byId(l.a === id ? l.b : l.a),
                K = LK[l.kind] || LK.none;
              return `<div class="lm-row ${o ? o.type : ""}" style="--kc:${K.c};animation-delay:${i * 40}ms"><span class="lm-av">${o && o.img ? `<img src="${o.img}" alt="">` : esc(ini(o ? o.name : "?"))}</span><div class="lm-m"><b>${esc(o ? o.name : "?")} <small>${l.a === id ? "→" : "←"}</small></b><input data-ll="${l.id}" value="${esc(l.label)}" placeholder="подпись связи"></div><select class="lm-k" data-lk="${l.id}">${kindOpts(l.kind)}</select><button class="lm-x" data-dl="${l.id}" title="Удалить связь">×</button></div>`;
            })
            .join("") +
          `<div class="lm-new"><div class="lm-t">Новая связь</div><input id="ln-q" placeholder="Найти карточку…" autocomplete="off"><div class="lm-res" id="ln-res"></div><input type="hidden" id="ln-to"><input id="ln-lb" placeholder="Подпись (например: «служит»)"><input type="hidden" id="ln-kd" value="none"><div class="lm-kinds">${KO.map((k) => `<button data-kind="${k}" class="${k === "none" ? "on" : ""}" style="--kc:${LK[k].c}">${LK[k].n}</button>`).join("")}</div><button class="pri" data-addl>Связать</button></div></div>`
        );
      }
      const _edit = edit;
      edit = function (id) {
        _edit(id);
        const ed = $("#panel .ed");
        if (!ed) return;
        const h = [...ed.querySelectorAll("h4")].find(
            (x) => x.textContent === "Связи",
          ),
          act = ed.querySelector(".act");
        if (!h || !act) return;
        while (h.nextElementSibling && h.nextElementSibling !== act)
          h.nextElementSibling.remove();
        h.remove();
        act.insertAdjacentHTML("beforebegin", lmHTML(id));
      };
      function lmRes() {
        const id = cur,
          q = ($("#ln-q").value || "").trim().toLowerCase(),
          ln = new Set(
            S.links
              .filter((l) => l.a === id || l.b === id)
              .map((l) => (l.a === id ? l.b : l.a)),
          );
        $("#ln-res").innerHTML = S.nodes
          .filter(
            (o) =>
              o.id !== id &&
              (!q || (o.name + " " + o.sub).toLowerCase().includes(q)),
          )
          .slice(0, 8)
          .map(
            (o) =>
              `<button class="lm-opt ${o.type}" data-pick="${o.id}"><span class="lm-av">${o.img ? `<img src="${o.img}" alt="">` : esc(ini(o.name))}</span><span><b>${esc(o.name)}</b><i>${T[o.type]}${ln.has(o.id) ? " · уже связаны" : ""}</i></span></button>`,
          )
          .join("");
      }
      $("#panel").addEventListener("focusin", (e) => {
        if (e.target.id === "ln-q") lmRes();
      });
      $("#panel").addEventListener("focusout", (e) => {
        if (e.target.id === "ln-q") {
          const r = $("#ln-res");
          if (r) r.innerHTML = "";
        }
      });
      $("#panel").addEventListener("mousedown", (e) => {
        if (e.target.closest(".lm-res")) e.preventDefault();
      });
      $("#panel").addEventListener("input", (e) => {
        if (e.target.id === "ln-q") {
          $("#ln-to").value = "";
          lmRes();
        } else if (e.target.dataset.ll) {
          const l = S.links.find((x) => x.id === e.target.dataset.ll);
          if (l) {
            l.label = e.target.value;
            save();
            drawLinks();
          }
        }
      });
      $("#panel").addEventListener("change", (e) => {
        if (e.target.classList.contains("lm-k"))
          e.target
            .closest(".lm-row")
            .style.setProperty("--kc", (LK[e.target.value] || LK.none).c);
      });
      $("#panel").addEventListener(
        "click",
        (e) => {
          if (e.target.closest("[data-addl]") && !$("#ln-to").value) {
            e.stopPropagation();
            const q = $("#ln-q");
            q.classList.remove("shake");
            void q.offsetWidth;
            q.classList.add("shake");
            q.focus();
          }
        },
        true,
      );
      $("#panel").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if (d.pick) {
          const o = byId(d.pick);
          $("#ln-to").value = o.id;
          $("#ln-q").value = o.name;
          $("#ln-res").innerHTML = "";
          $("#ln-lb").focus();
        } else if (d.kind) {
          $("#ln-kd").value = d.kind;
          b.parentElement
            .querySelectorAll("button")
            .forEach((x) => x.classList.toggle("on", x === b));
        }
      });

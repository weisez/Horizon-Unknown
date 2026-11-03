      /* graph panel: dock, legend, minimap */
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="gdock"><div class="zp" id="zp">100%</div></div><div id="mm"><svg viewBox="0 0 190 124"></svg></div>`,
      );
      const dk = $("#gdock"),
        ic = (p) => `<svg viewBox="0 0 24 24"><path d="${p}"/></svg>`;
      [
        ["b-zi", "Приблизить", "M12 5v14M5 12h14"],
        ["b-zo", "Отдалить", "M5 12h14"],
        ["b-fit", "Вместить всё", "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"],
        [
          "b-lay",
          "Разложить автоматически",
          "M12 3v4M12 17v4M3 12h4M17 12h4M10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
        ],
      ].forEach(([id, t, p]) => {
        const b = $("#" + id);
        b.innerHTML = ic(p);
        b.dataset.tip = t;
        b.title = t;
        dk.appendChild(b);
      });
      dk.insertAdjacentHTML(
        "beforeend",
        `<button id="b-lbl" class="on" data-tip="Подписи связей" title="Подписи связей">${ic("M4 7h16M4 12h10M4 17h13")}</button>`,
      );
      $("#b-lbl").onclick = (e) => {
        const o = document.body.classList.toggle("nolbl");
        e.currentTarget.classList.toggle("on", !o);
      };
      let MM = null;
      function mm() {
        if (tab !== "graph") return;
        const sv = $("#mm svg"),
          N = S.nodes;
        if (!N.length) {
          sv.innerHTML = "";
          return;
        }
        const W = 190,
          H = 124,
          xs = N.map((n) => n.x),
          ys = N.map((n) => n.y),
          x0 = Math.min(...xs) - 140,
          x1 = Math.max(...xs) + 140,
          y0 = Math.min(...ys) - 180,
          y1 = Math.max(...ys) + 180,
          k = Math.min(W / (x1 - x0), H / (y1 - y0)),
          ox = (W - (x1 - x0) * k) / 2,
          oy = (H - (y1 - y0) * k) / 2;
        MM = { x0, y0, k, ox, oy };
        const X = (v) => (ox + (v - x0) * k).toFixed(1),
          Y = (v) => (oy + (v - y0) * k).toFixed(1),
          m = new Map(N.map((n) => [n.id, n])),
          vx = -view.x / view.k,
          vy = -view.y / view.k;
        sv.innerHTML =
          S.links
            .map((l) => {
              const a = m.get(l.a),
                b = m.get(l.b);
              return a && b
                ? `<line x1="${X(a.x)}" y1="${Y(a.y)}" x2="${X(b.x)}" y2="${Y(b.y)}"/>`
                : "";
            })
            .join("") +
          N.map(
            (n) =>
              `<circle class="${n.type}" cx="${X(n.x)}" cy="${Y(n.y)}" r="3.2"/>`,
          ).join("") +
          `<rect class="vp" x="${X(vx)}" y="${Y(vy)}" width="${((innerWidth / view.k) * k).toFixed(1)}" height="${((innerHeight / view.k) * k).toFixed(1)}"/>`;
      }
      const mmEl = $("#mm");
      let mmd = false;
      const mmGo = (e) => {
        if (!MM) return;
        const r = mmEl.getBoundingClientRect(),
          wx = (((e.clientX - r.left) * 190) / r.width - MM.ox) / MM.k + MM.x0,
          wy = (((e.clientY - r.top) * 124) / r.height - MM.oy) / MM.k + MM.y0;
        view.x = innerWidth / 2 - wx * view.k;
        view.y = innerHeight / 2 - wy * view.k;
        applyView();
      };
      mmEl.addEventListener("pointerdown", (e) => {
        mmd = true;
        mmEl.setPointerCapture(e.pointerId);
        mmGo(e);
      });
      mmEl.addEventListener("pointermove", (e) => {
        if (mmd) mmGo(e);
      });
      mmEl.addEventListener("pointerup", () => (mmd = false));
      mmEl.addEventListener("pointercancel", () => (mmd = false));
      const _av = applyView;
      applyView = function () {
        _av();
        $("#zp").textContent = Math.round(view.k * 100) + "%";
        mm();
      };
      const _dl = drawLinks;
      drawLinks = function () {
        _dl();
        mm();
      };
      function renderLegend() {
        const L = $("#legend"),
          cnt = { char: 0, org: 0, story: 0 },
          kc = {};
        S.nodes.forEach((n) => cnt[n.type]++);
        S.links.forEach((l) => {
          const k = l.kind || "none";
          kc[k] = (kc[k] || 0) + 1;
        });
        L.innerHTML =
          `<div class="lg-h"><strong>Легенда</strong><em>${S.nodes.length} · ${S.links.length}</em><i></i></div><div class="lg-b"><div class="lg-s">Карточки</div>` +
          ["char", "org", "story"]
            .map(
              (t) =>
                `<button data-lt="${t}" class="${F.t[t] === 0 ? "off" : ""}" style="--c:var(--c-${t})"><s></s>${TT[t]}<b>${cnt[t]}</b></button>`,
            )
            .join("") +
          `<div class="lg-s">Связи</div>` +
          (KO.filter((k) => kc[k])
            .map(
              (k) =>
                `<button data-lkd="${k}" class="${F.k[k] === 0 ? "off" : ""}" style="--c:${LK[k].c};--kd:${LK[k].d}"><svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4"/></svg>${LK[k].n}<b>${kc[k]}</b></button>`,
            )
            .join("") ||
            `<div class="lg-s" style="margin-top:0">пока нет</div>`) +
          `</div>`;
      }
      $("#legend").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) {
          const d = b.dataset;
          if (d.lt) F.t[d.lt] = F.t[d.lt] === 0 ? 1 : 0;
          else if (d.lkd) F.k[d.lkd] = F.k[d.lkd] === 0 ? 1 : 0;
          applyF();
          return;
        }
        if (e.target.closest(".lg-h")) $("#legend").classList.toggle("min");
      });
      if (innerWidth < 700) $("#legend").classList.add("min");
      const _af = applyF;
      applyF = function () {
        _af();
        renderLegend();
      };
      const _r6 = render;
      render = function () {
        _r6();
        renderLegend();
        mm();
      };
      const _st6 = setTab;
      setTab = function (t) {
        _st6(t);
        if (t === "graph") {
          renderLegend();
          mm();
        }
      };

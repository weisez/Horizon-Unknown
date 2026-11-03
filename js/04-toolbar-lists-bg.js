      /* toolbar */
      document.querySelectorAll("[data-add]").forEach(
        (b) =>
          (b.onclick = () => {
            const n = {
              id: uid(),
              type: b.dataset.add,
              name: "Новая карточка",
              sub: "",
              short: "",
              long: "",
              quote: "",
              img: "",
              x:
                (innerWidth / 2 - view.x) / view.k +
                (Math.random() - 0.5) * 120,
              y:
                (innerHeight / 2 - view.y) / view.k +
                (Math.random() - 0.5) * 120,
            };
            S.nodes.push(n);
            if (tab !== "graph") setTab(n.type);
            save();
            render();
            openPanel("", n.type);
            edit(n.id);
          }),
      );
      addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if ($("#ov").classList.contains("open")) closePanel();
        }
      });
      $("#b-theme").onclick = () => {
        const r = document.documentElement,
          c =
            r.dataset.theme ||
            (matchMedia("(prefers-color-scheme:dark)").matches
              ? "dark"
              : "light"),
          n = c === "dark" ? "light" : "dark";
        r.dataset.theme = n;
        try {
          localStorage.setItem(KEY + "-t", n);
        } catch (e) {}
      };
      $("#b-data").onclick = () => {
        openPanel(
          `<div class="ed"><h4 style="margin:0">Резервная копия</h4><div style="color:var(--mute)">Данные хранятся в этом браузере. Скопируйте JSON, чтобы сохранить копию или перенести на другое устройство; вставьте JSON и нажмите «Загрузить», чтобы восстановить.</div><textarea id="json" style="min-height:200px;font:12px monospace">${esc(JSON.stringify(S))}</textarea><div class="act"><button data-copy>Копировать</button><button class="pri" data-apply>Загрузить из поля</button><button data-reset>Сбросить к примеру</button><button data-close>Закрыть</button></div></div>`,
          "char",
        );
      };
      addEventListener("resize", () => {});

      /* tabs + list view */
      let tab = "graph",
        openId = null;
      const TT = { char: "Персонажи", org: "Организации", story: "Истории" };
      const _r = render;
      render = function () {
        _r();
        renderList();
      };
      function padList() {
        $("#list").style.paddingTop =
          `calc(env(safe-area-inset-top,0px) + ${$("#bar").offsetHeight + 30}px)`;
      }
      function setTab(t) {
        tab = t;
        document.body.dataset.tab = t;
        document
          .querySelectorAll("#tabs button")
          .forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
        placeInd();
        $("#list").style.display = TT[t] ? "block" : "none";
        if (t === "graph") focusNode(null);
        padList();
        renderList();
        $("#list").scrollTop = 0;
      }
      function renderList() {
        const L = $("#list");
        if (!TT[tab]) {
          L.innerHTML = "";
          return;
        }
        const ns = S.nodes.filter((n) => n.type === tab && fm(n));
        L.innerHTML =
          `<div class="lh"><h1>${TT[tab]}</h1><span>${ns.length}</span></div>` +
          (ns
            .map((n, i) => {
              const rel = S.links
                .filter((l) => l.a === n.id || l.b === n.id)
                .map((l) => ({ l, o: byId(l.a === n.id ? l.b : l.a) }))
                .filter((r) => r.o);
              return `<div class="item ${n.type}${n.id === openId ? " open" : ""}" data-id="${n.id}" style="animation-delay:${i * 50}ms"><div class="hd"><div class="bn"><span>${esc(ini(n.name))}</span>${n.banner || n.img ? `<img src="${n.banner || n.img}" alt="">` : ""}</div><div class="shade"></div><div class="mid"><div class="kind">${esc(n.sub) || T[n.type]}</div><h3>${esc(n.name)}</h3><p>${esc(n.short)}</p></div><i class="chev"></i>${stp(n)}</div><div class="more"><div><div class="mi">${n.quote ? `<blockquote>“${esc(n.quote)}”</blockquote>` : ""}<div>${esc(n.long || n.short).replace(/\n/g, "<br>")}</div>${rel.length ? `<h4>Связи</h4><div>${rel.map((r) => `<button class="chip" data-go="${r.o.id}">${esc(r.o.name)}${r.l.label ? `<em>${esc(r.l.label)}</em>` : ""}</button>`).join("")}</div>` : ""}${n.type === "org" ? structBlock(n) : ""}<div class="act"><button data-ed="${n.id}">Редактировать</button><button data-on-graph="${n.id}">Показать на графе</button></div></div></div></div></div>`;
            })
            .join("") ||
            `<p class="empty">Здесь пока пусто — добавьте карточку кнопкой «+» вверху.</p>`);
      }
      function go(id) {
        const n = byId(id);
        if (!n) return;
        openId = id;
        setTab(n.type);
        setTimeout(() => {
          const el = $(`.item[data-id="${id}"]`);
          el && el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
      $("#tabs").onclick = (e) => {
        const b = e.target.closest("button");
        if (b) setTab(b.dataset.tab);
      };
      $("#list").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) {
          const d = b.dataset;
          if (d.go) go(d.go);
          else if (d.ed) {
            const n = byId(d.ed);
            openPanel("", n.type);
            edit(n.id);
          } else if (d.onGraph) {
            const n = byId(d.onGraph);
            setTab("graph");
            view.k = Math.max(view.k, 0.9);
            view.x = innerWidth / 2 - n.x * view.k;
            view.y = innerHeight / 2 - n.y * view.k;
            const w = $("#world");
            w.style.transition = "transform .7s cubic-bezier(.3,.8,.3,1)";
            applyView();
            setTimeout(() => (w.style.transition = ""), 750);
            focusNode(n.id);
          }
          return;
        }
        const it = e.target.closest(".item");
        if (it && e.target.closest(".hd")) {
          const o = !it.classList.contains("open");
          document
            .querySelectorAll(".item.open")
            .forEach((x) => x.classList.remove("open"));
          it.classList.toggle("open", o);
          openId = o ? it.dataset.id : null;
          if (o)
            setTimeout(
              () => it.scrollIntoView({ behavior: "smooth", block: "nearest" }),
              460,
            );
        }
      });
      addEventListener("resize", () => {
        if (tab !== "graph") padList();
      });
      $("#panel").addEventListener("change", (e) => {
        if (e.target.id !== "file2" || !e.target.files[0]) return;
        const rd = new FileReader();
        rd.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 1200 / im.width),
              c = document.createElement("canvas");
            c.width = im.width * k;
            c.height = im.height * k;
            c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
            byId(cur).banner = c.toDataURL("image/jpeg", 0.74);
            save();
            edit(cur);
          };
          im.src = rd.result;
        };
        rd.readAsDataURL(e.target.files[0]);
      });
      $("#panel").addEventListener("click", (e) => {
        if (e.target.closest("[data-nobn]")) {
          byId(cur).banner = "";
          save();
          edit(cur);
        }
      });
      function placeInd() {
        const b = document.querySelector("#tabs button.on"),
          i = $("#tabind");
        if (b && i) {
          i.style.left = b.offsetLeft + "px";
          i.style.width = b.offsetWidth + "px";
        }
      }
      addEventListener("resize", placeInd);
      if (document.fonts) document.fonts.ready.then(placeInd);
      setTimeout(placeInd, 50);
      $("#b-new").onclick = () => $("#newwrap").classList.toggle("open");
      $("#newmenu").addEventListener("click", () =>
        $("#newwrap").classList.remove("open"),
      );
      addEventListener("pointerdown", (e) => {
        if (!e.target.closest("#newwrap"))
          $("#newwrap").classList.remove("open");
      });
      /* background */
      (function () {
        let s = "",
          sd = 7;
        const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        [
          [0.22, 0.3, 9],
          [0.78, 0.72, 11],
          [0.55, 0.1, 6],
        ].forEach(([cx, cy, n]) => {
          const ph = [R() * 6, R() * 6, R() * 6];
          for (let i = 1; i <= n; i++) {
            let d = "";
            for (let a = 0; a <= 90; a++) {
              const t = (a / 90) * Math.PI * 2,
                r =
                  i *
                  58 *
                  (1 +
                    0.18 * Math.sin(t * 2 + ph[0] + i * 0.15) +
                    0.1 * Math.sin(t * 3 + ph[1]) +
                    0.06 * Math.sin(t * 5 + ph[2]));
              d +=
                (a ? "L" : "M") +
                (cx * 1600 + Math.cos(t) * r * 1.3).toFixed(0) +
                " " +
                (cy * 1000 + Math.sin(t) * r).toFixed(0);
            }
            s += `<path d="${d}Z"${i % 4 === 0 ? ' class="m"' : ""}/>`;
          }
        });
        $("#bg").insertAdjacentHTML(
          "beforeend",
          `<svg class="topo" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">${s}</svg><div class="radar"></div><div class="hud" style="left:7%;top:12%">EYES ONLY // HU-S1\nGRID 47Q 3318 5502\n██████ ████</div><div class="hud" style="right:8%;top:12%;text-align:right">KONTROL / FSK / OFFICE\nSTATUS: UNKNOWN</div>`,
        );
      })();

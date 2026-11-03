      /* ===== v3: kinds, filters, timeline, structures, redaction, stamps ===== */
      const LK = {
        none: { n: "Нейтральная", c: "var(--line)", d: "none" },
        ally: { n: "Союзник", c: "#3fae6a", d: "none" },
        enemy: { n: "Враг", c: "#d6453a", d: "none" },
        family: { n: "Семья", c: "#d9a520", d: "2 5" },
        employer: { n: "Наниматель", c: "#4a8fd4", d: "10 4" },
        secret: { n: "Тайная связь", c: "#9b6bd6", d: "3 6" },
        unverified: { n: "Непроверено", c: "#8d8982", d: "5 5" },
      };
      const kindOpts = (k) =>
        Object.entries(LK)
          .map(
            ([v, o]) =>
              `<option value='${v}'${v === (k || "none") ? " selected" : ""}>${o.n}</option>`,
          )
          .join("");
      const F = { q: "", t: { char: 1, org: 1, story: 1 }, rel: "", k: {} };
      function fm(n) {
        if (!F.t[n.type]) return false;
        if (
          F.q &&
          !(n.name + " " + n.sub + " " + n.short + " " + n.long + " " + n.quote)
            .toLowerCase()
            .includes(F.q)
        )
          return false;
        if (
          F.rel &&
          n.id !== F.rel &&
          !S.links.some(
            (l) =>
              (l.a === F.rel && l.b === n.id) ||
              (l.b === F.rel && l.a === n.id),
          )
        )
          return false;
        return true;
      }
      const isF = () =>
        !!(
          F.q ||
          F.rel ||
          Object.values(F.t).includes(0) ||
          Object.values(F.k).includes(0)
        );
      const lf = (l, a, b) =>
        F.k[l.kind || "none"] === 0 || !fm(a) || !fm(b) ? " fl" : "";
      const lk = (l) => {
        const K = LK[l.kind] || LK.none;
        return `--kc:${K.c};--kd:${K.d}`;
      };
      function nodeF() {
        document.querySelectorAll(".node").forEach((e) => {
          const n = byId(e.dataset.id);
          if (n) e.classList.toggle("fl", !fm(n));
        });
        $("#b-flt").classList.toggle("act", isF());
      }
      function applyF() {
        nodeF();
        drawLinks();
        renderList();
        renderTL();
      }
      const _r3 = render;
      render = function () {
        _r3();
        nodeF();
        renderTL();
      };
      function fillF() {
        $("#f-rel").innerHTML =
          `<option value=''>— все —</option>` +
          S.nodes
            .map(
              (n) =>
                `<option value='${n.id}'${n.id === F.rel ? " selected" : ""}>${esc(n.name)}</option>`,
            )
            .join("");
        $("#f-k").innerHTML = Object.entries(LK)
          .map(
            ([k, o]) =>
              `<button data-fk='${k}' class='${F.k[k] === 0 ? "" : "on"}' style='border-left:4px solid ${o.c}'>${o.n}</button>`,
          )
          .join("");
        document
          .querySelectorAll("#f-t [data-ft]")
          .forEach((b) => b.classList.toggle("on", F.t[b.dataset.ft] !== 0));
      }
      $("#b-flt").onclick = () => {
        fillF();
        const p = $("#fpop");
        p.style.top = `calc(env(safe-area-inset-top,0px) + ${$("#bar").offsetHeight + 22}px)`;
        p.classList.toggle("open");
      };
      addEventListener("pointerdown", (e) => {
        if (!e.target.closest("#fpop,#b-flt"))
          $("#fpop").classList.remove("open");
      });
      $("#f-q").oninput = (e) => {
        F.q = e.target.value.trim().toLowerCase();
        applyF();
      };
      $("#f-rel").onchange = (e) => {
        F.rel = e.target.value;
        applyF();
      };
      $("#fpop").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if (d.ft) F.t[d.ft] = F.t[d.ft] === 0 ? 1 : 0;
        else if (d.fk) F.k[d.fk] = F.k[d.fk] === 0 ? 1 : 0;
        else if (b.id === "f-reset") {
          F.q = "";
          F.rel = "";
          F.t = { char: 1, org: 1, story: 1 };
          F.k = {};
          $("#f-q").value = "";
        } else return;
        fillF();
        applyF();
      });
      const _pl2 = padList;
      padList = function () {
        _pl2();
        $("#tl").style.top =
          `calc(env(safe-area-inset-top,0px) + ${$("#bar").offsetHeight + 20}px)`;
      };
      const _st2 = setTab;
      setTab = function (t) {
        _st2(t);
        if (t === "time") {
          renderTL();
          $("#tl").scrollLeft = 0;
        }
      };
      /* redaction */
      function redact(root) {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (t) =>
              /\[\[.+?\]\]/.test(t.data) &&
              !t.parentElement.closest("textarea,input,script,style,.rd")
                ? 1
                : 3,
          }),
          L = [];
        while (w.nextNode()) L.push(w.currentNode);
        L.forEach((t) => {
          const f = document.createDocumentFragment();
          t.data.split(/(\[\[.+?\]\])/).forEach((p) => {
            const m = /^\[\[(.+?)\]\]$/.exec(p);
            if (m) {
              const s = document.createElement("span");
              s.className = "rd";
              s.textContent = m[1];
              f.appendChild(s);
            } else if (p) f.appendChild(document.createTextNode(p));
          });
          t.replaceWith(f);
        });
      }
      const mo = new MutationObserver((ms) =>
        ms.forEach((m) =>
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) redact(n);
          }),
        ),
      );
      ["#nodes", "#list", "#panel", "#hcanvas", "#tltrack"].forEach((s) =>
        mo.observe($(s), { childList: true, subtree: true }),
      );
      document.addEventListener("click", (e) => {
        const r = e.target.closest(".rd");
        if (r) r.classList.toggle("show");
      });
      let lastTA = null;
      $("#panel").addEventListener("focusin", (e) => {
        if (e.target.tagName === "TEXTAREA") lastTA = e.target;
      });
      /* stamps */
      const STP = [
          "CONFIDENTIAL",
          "TOP SECRET",
          "DE-CLASSIFIED",
          "REDACTED",
          "CLASSIFIED",
          "KIA",
          "MIA",
          "WANTED",
          "ELIMINATED",
          "UNVERIFIED",
        ],
        SC = {
          Красный: "#c0392b",
          Янтарный: "#e8921a",
          Чёрный: "#111111",
          Белый: "#f2efe9",
          Синий: "#3a6ea5",
        };
      const stp = (n) =>
        (n.stamps || [])
          .map(
            (s) =>
              `<b class='stp' data-sid='${s.id}' style='left:${s.x}%;top:${s.y}%;color:${s.c};border-color:${s.c};font-size:${s.s}px;transform:translate(-50%,-50%) rotate(${s.r}deg)'>${esc(s.t)}</b>`,
          )
          .join("");
      let curSt = null,
        sd = null;
      function stpEdit(id) {
        const n = byId(id);
        curSt = id;
        n.stamps = n.stamps || [];
        $("#panel").className = "panel " + n.type;
        $("#panel").innerHTML =
          `<div class='ed'><h4 style='margin:0'>Штампы: ${esc(n.name)}</h4><div style='color:var(--mute)'>Перетащите штамп прямо на карточке. Надпись можно выбрать из списка или написать свою.</div><datalist id='stl'>${STP.map((s) => `<option value='${s}'>`).join("")}</datalist>
 <div class='plc'><div class='node ${n.type}' style='position:relative;left:auto;top:auto;transform:none;animation:none;pointer-events:none'><div class='ph'>${n.img ? `<img src='${n.img}' alt=''>` : `<span>${esc(ini(n.name))}</span>`}</div><div class='tx'><b>${esc(n.name)}</b><i>${esc(n.sub)}</i><p>${esc(n.short)}</p></div></div><div class='plcs'>${stp(n)}</div></div>
 ${n.stamps
   .map(
     (s) =>
       `<div class='mrow s'><input data-st='t' data-i='${s.id}' list='stl' value="${esc(s.t)}"><select data-st='c' data-i='${s.id}'>${Object.entries(
         SC,
       )
         .map(
           ([k, v]) =>
             `<option value='${v}'${v === s.c ? " selected" : ""}>${k}</option>`,
         )
         .join(
           "",
         )}</select><input type='range' data-st='r' data-i='${s.id}' min='-45' max='45' value='${s.r}'><input type='range' data-st='s' data-i='${s.id}' min='11' max='38' value='${s.s}'><button data-sdel='${s.id}'>×</button></div>`,
   )
   .join("")}
 <div class='act'><button data-sadd>+ Штамп</button><button class='pri' data-sback>Назад</button></div></div>`;
      }
      $("#panel").addEventListener("pointerdown", (e) => {
        const s = e.target.closest(".plc .stp");
        if (!s) return;
        e.preventDefault();
        sd = {
          s,
          n: byId(curSt),
          r: s.closest(".plc").getBoundingClientRect(),
        };
        s.setPointerCapture(e.pointerId);
      });
      $("#panel").addEventListener("pointermove", (e) => {
        if (!sd) return;
        const st = sd.n.stamps.find((x) => x.id === sd.s.dataset.sid),
          c = (v, a, b) =>
            Math.round(Math.max(0, Math.min(100, ((v - a) / b) * 100)));
        st.x = c(e.clientX, sd.r.left, sd.r.width);
        st.y = c(e.clientY, sd.r.top, sd.r.height);
        sd.s.style.left = st.x + "%";
        sd.s.style.top = st.y + "%";
      });
      $("#panel").addEventListener("pointerup", () => {
        if (sd) {
          save();
          sd = null;
        }
      });
      /* org structures */
      const PRE = {
        crime: {
          n: "Крайм-структура",
          r: [
            "Босс",
            "Заместитель",
            "Консильери",
            "Капо",
            "Солдат",
            "Ассоциат",
          ],
        },
        pmc: {
          n: "ЧВК / частная структура",
          r: [
            "Директор",
            "Операционный директор",
            "Руководитель отдела",
            "Командир группы",
            "Оператор",
            "Аналитик",
            "Логист",
          ],
        },
        state: {
          n: "Государственная структура",
          r: [
            "Директор",
            "Заместитель директора",
            "Начальник отдела",
            "Старший агент",
            "Агент",
          ],
        },
        cells: { n: "Сеть ячеек", r: ["Куратор", "Лидер ячейки", "Участник"] },
      };
      function structHTML(n) {
        const M = n.members || [],
          P = n.preset || "state",
          ids = new Set(M.map((m) => m.id)),
          kids = (p) =>
            M.filter(
              (m) =>
                (ids.has(m.parent) && m.parent !== m.id ? m.parent : "") === p,
            );
        if (!M.length)
          return `<p style='color:var(--mute)'>Состав пока не задан.</p>`;
        const card = (m, st) =>
          `<div class='sm' ${m.nid && byId(m.nid) ? `data-nid='${m.nid}'` : ""} style='${st || ""}'><b>${esc(m.name)}</b><i>${esc(m.role)}</i></div>`;
        if (P === "cells")
          return (
            `<div class='cells'>` +
            kids("")
              .map((r) => {
                const all = [],
                  w = (x) =>
                    kids(x.id).forEach((c) => {
                      all.push(c);
                      w(c);
                    });
                w(r);
                return `<div class='cell'>${card(r)}<div style='display:grid;gap:6px'>${all.map((c) => card(c)).join("")}</div></div>`;
              })
              .join("") +
            `</div>`
          );
        const W = 170,
          H = 60,
          GX = 20,
          GY = P === "pmc" ? 60 : 50,
          hor = P === "pmc",
          pos = {};
        let leaf = 0,
          dm = 0;
        const walk = (m, d) => {
          dm = Math.max(dm, d);
          const k = kids(m.id);
          if (!k.length) {
            pos[m.id] = { d, s: leaf++ };
            return;
          }
          k.forEach((c) => walk(c, d + 1));
          pos[m.id] = {
            d,
            s: (pos[k[0].id].s + pos[k[k.length - 1].id].s) / 2,
          };
        };
        kids("").forEach((r) => walk(r, 0));
        const ms = M.filter((m) => pos[m.id]);
        const X = (m) =>
            hor ? pos[m.id].d * (W + GY + 30) : pos[m.id].s * (W + GX),
          Y = (m) => (hor ? pos[m.id].s * (H + GX) : pos[m.id].d * (H + GY)),
          tw = hor ? (dm + 1) * (W + GY + 30) : leaf * (W + GX),
          th = hor ? leaf * (H + GX) : (dm + 1) * (H + GY);
        const L = ms
          .filter((m) => pos[m.parent])
          .map((m) => {
            const p = M.find((x) => x.id === m.parent),
              a = hor ? [X(p) + W, Y(p) + H / 2] : [X(p) + W / 2, Y(p) + H],
              b = hor ? [X(m), Y(m) + H / 2] : [X(m) + W / 2, Y(m)],
              mx = (a[0] + b[0]) / 2,
              my = (a[1] + b[1]) / 2;
            return `<path d='${P === "crime" ? `M${a} C${a[0]} ${my} ${b[0]} ${my} ${b}` : hor ? `M${a}H${mx}V${b[1]}H${b[0]}` : `M${a}V${my}H${b[0]}V${b[1]}`}'/>`;
          })
          .join("");
        return `<div class='st st-${P}' style='width:${tw}px;height:${th}px'><svg width='${tw}' height='${th}'>${L}</svg>${ms.map((m) => card(m, `left:${X(m)}px;top:${Y(m)}px`)).join("")}</div>`;
      }
      const structBlock = (n) =>
        `<h4>Структура</h4><div class='row' style='margin-bottom:10px'><select data-spreset='${n.id}' style='width:auto'>${Object.entries(
          PRE,
        )
          .map(
            ([k, v]) =>
              `<option value='${k}'${k === (n.preset || "state") ? " selected" : ""}>${v.n}</option>`,
          )
          .join(
            "",
          )}</select><button data-stedit='${n.id}'>Редактировать состав</button></div><div class='stwrap'>${structHTML(n)}</div>`;
      let curS = null;
      function stEdit(id) {
        const n = byId(id);
        curS = id;
        const ms = (n.members = n.members || []),
          ch = S.nodes.filter((x) => x.type === "char");
        $("#panel").className = "panel org";
        $("#panel").innerHTML =
          `<div class='ed'><h4 style='margin:0'>Структура: ${esc(n.name)}</h4><div style='color:var(--mute)'>Укажите, кому подчиняется каждый участник. «Корень» — вершина. Можно привязать к карточке персонажа.</div><datalist id='rk'>${PRE[n.preset || "state"].r.map((r) => `<option value='${r}'>`).join("")}</datalist>` +
          ms
            .map(
              (m) =>
                `<div class='mrow'><input data-m='name' data-i='${m.id}' value="${esc(m.name)}" placeholder='Имя'><input data-m='role' data-i='${m.id}' list='rk' value="${esc(m.role)}" placeholder='Звание'><select data-m='parent' data-i='${m.id}'><option value=''>— корень —</option>${ms
                  .filter((x) => x.id !== m.id)
                  .map(
                    (x) =>
                      `<option value='${x.id}'${x.id === m.parent ? " selected" : ""}>${esc(x.name)}</option>`,
                  )
                  .join(
                    "",
                  )}</select><select data-m='nid' data-i='${m.id}'><option value=''>— без карточки —</option>${ch.map((x) => `<option value='${x.id}'${x.id === m.nid ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select><button data-mdel='${m.id}'>×</button></div>`,
            )
            .join("") +
          `<div class='act'><button data-madd>+ Участник</button><button class='pri' data-mdone>Готово</button></div></div>`;
      }
      $("#list").addEventListener("change", (e) => {
        const p = e.target.dataset.spreset;
        if (p) {
          byId(p).preset = e.target.value;
          save();
          renderList();
        }
      });
      $("#list").addEventListener("click", (e) => {
        const b = e.target.closest("[data-stedit]");
        if (b) {
          openPanel("", "org");
          stEdit(b.dataset.stedit);
          return;
        }
        const s = e.target.closest(".sm[data-nid]");
        if (s) go(s.dataset.nid);
      });
      /* timeline */
      const seedEv = () => [
        {
          id: uid(),
          date: "2017.26.07",
          title: "Операция, после которой Ezikiel остаётся с виной",
          text: "Прошлая операция оставила молодую женщину мёртвой. Пример: нажмите ✎, чтобы изменить.",
          accent: "char",
          refs: ["ezik", "office"],
        },
        {
          id: uid(),
          date: "2019.00.00",
          title: "Пример события",
          text: "Часть текста можно [[скрыть двойными скобками]].",
          accent: "org",
          refs: ["fsk"],
        },
        {
          id: uid(),
          date: "2021.00.00",
          title: "Ещё одно событие",
          text: "Добавляйте свои кнопкой «+ Событие».",
          accent: "story",
          refs: [],
        },
      ];
      const evm = (e) =>
        (!F.q ||
          (e.date + " " + e.title + " " + e.text)
            .toLowerCase()
            .includes(F.q)) &&
        (!F.rel || e.refs.includes(F.rel));
      function renderTL() {
        if (tab !== "time") return;
        const E = (S.events || (S.events = seedEv()))
          .filter(evm)
          .sort((a, b) =>
            a.date.localeCompare(b.date, undefined, { numeric: true }),
          );
        $("#tltrack").style.width =
          Math.max(innerWidth, E.length * 250 + 340) + "px";
        $("#tltrack").innerHTML =
          `<div class='axis'></div>` +
          (E.map(
            (e, i) =>
              `<div class='ev ${i % 2 ? "dn" : "up"} a-${e.accent}' data-id='${e.id}' style='left:${170 + i * 250}px;animation-delay:${i * 60}ms'><i class='dot'></i><span class='dt'>${esc(e.date)}</span><div class='card'><b>${esc(e.title)}</b><div class='more2'><p style='margin:0 0 8px'>${esc(e.text).replace(/\n/g, "<br>")}</p>${e.refs
                .map((r) => byId(r))
                .filter(Boolean)
                .map(
                  (n) =>
                    `<button class='chip' data-go='${n.id}'>${esc(n.name)}</button>`,
                )
                .join(
                  "",
                )}<button class='chip' data-evedit='${e.id}'>✎</button></div></div></div>`,
          ).join("") ||
            `<p style='position:absolute;left:30px;top:50%;color:var(--mute)'>Событий нет. Добавьте первое кнопкой «+ Событие».</p>`);
      }
      const tl = $("#tl");
      let td = null,
        curE = null;
      tl.addEventListener(
        "wheel",
        (e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            tl.scrollLeft += e.deltaY;
            e.preventDefault();
          }
        },
        { passive: false },
      );
      tl.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".card,button")) return;
        td = { x: e.clientX, s: tl.scrollLeft };
        tl.setPointerCapture(e.pointerId);
      });
      tl.addEventListener("pointermove", (e) => {
        if (td) tl.scrollLeft = td.s - (e.clientX - td.x);
      });
      tl.addEventListener("pointerup", () => (td = null));
      tl.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) {
          if (b.dataset.go) go(b.dataset.go);
          else if (b.dataset.evedit) evEdit(b.dataset.evedit);
          return;
        }
        const c = e.target.closest(".ev .card");
        if (c) c.parentElement.classList.toggle("open");
      });
      $("#tbar").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.tls)
          tl.scrollBy({
            left: +b.dataset.tls * innerWidth * 0.7,
            behavior: "smooth",
          });
        else if (b.id === "t-add") {
          const ev = {
            id: uid(),
            date: "",
            title: "Новое событие",
            text: "",
            accent: "char",
            refs: [],
          };
          (S.events || (S.events = seedEv())).push(ev);
          save();
          evEdit(ev.id);
        }
      });
      function evEdit(id) {
        const e = S.events.find((x) => x.id === id);
        if (!e) return;
        curE = id;
        const ac = [
          ["char", "Красный"],
          ["org", "Синий"],
          ["story", "Янтарный"],
          ["ink", "Нейтральный"],
        ];
        openPanel(
          `<div class='ed'><h4 style='margin:0'>Событие</h4><label>Дата (ГГГГ.ММ.ДД — по ней сортировка)<input data-e='date' value="${esc(e.date)}"></label><label>Название<input data-e='title' value="${esc(e.title)}"></label><label>Что произошло<textarea data-e='text'>${esc(e.text)}</textarea></label><div class='row'><button data-redact>▮ Скрыть выделенное</button><button data-unredact>Снять скрытие</button></div><label>Акцент<select data-e='accent'>${ac.map(([v, t]) => `<option value='${v}'${v === e.accent ? " selected" : ""}>${t}</option>`).join("")}</select></label><h4>Участники и места</h4><div class='chk'>${S.nodes.map((n) => `<label><input type='checkbox' data-eref='${n.id}'${e.refs.includes(n.id) ? " checked" : ""}> ${esc(n.name)}</label>`).join("")}</div><div class='act'><button class='pri' data-done>Готово</button><button data-edel>Удалить</button></div></div>`,
          "char",
        );
      }
      /* panel handlers */
      const gE = () => S.events.find((x) => x.id === curE);
      $("#panel").addEventListener("input", (e) => {
        const d = e.target.dataset;
        if (d.e && curE) {
          gE()[d.e] = e.target.value;
          save();
        } else if (d.m && curS) {
          const m = byId(curS).members.find((x) => x.id === d.i);
          if (m) {
            m[d.m] = e.target.value;
            save();
          }
        } else if (d.st && curSt) {
          const n = byId(curSt),
            s = n.stamps.find((x) => x.id === d.i);
          if (s) {
            s[d.st] = ["r", "s"].includes(d.st)
              ? +e.target.value
              : e.target.value;
            save();
            $(".plcs").innerHTML = stp(n);
          }
        }
      });
      $("#panel").addEventListener("change", (e) => {
        const d = e.target.dataset;
        if (d.eref && curE) {
          const a = gE().refs,
            i = a.indexOf(d.eref);
          if (e.target.checked) {
            if (i < 0) a.push(d.eref);
          } else if (i >= 0) a.splice(i, 1);
          save();
        } else if (d.lk) {
          S.links.find((l) => l.id === d.lk).kind = e.target.value;
          save();
          drawLinks();
        }
      });
      $("#panel").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if ("stamps" in d) stpEdit(cur);
        else if ("sback" in d) {
          const i = curSt;
          curSt = null;
          edit(i);
        } else if ("sadd" in d) {
          byId(curSt).stamps.push({
            id: uid(),
            t: "CONFIDENTIAL",
            x: 50,
            y: 40,
            r: -12,
            s: 18,
            c: "#c0392b",
          });
          save();
          stpEdit(curSt);
        } else if (d.sdel) {
          const n = byId(curSt);
          n.stamps = n.stamps.filter((s) => s.id !== d.sdel);
          save();
          stpEdit(curSt);
        } else if ("madd" in d) {
          byId(curS).members.push({
            id: uid(),
            name: "Новый участник",
            role: "",
            parent: "",
            nid: "",
          });
          save();
          stEdit(curS);
        } else if (d.mdel) {
          const n = byId(curS);
          n.members = n.members.filter((m) => m.id !== d.mdel);
          n.members.forEach((m) => {
            if (m.parent === d.mdel) m.parent = "";
          });
          save();
          stEdit(curS);
        } else if ("mdone" in d) {
          curS = null;
          closePanel();
        } else if ("edel" in d) {
          S.events = S.events.filter((x) => x.id !== curE);
          curE = null;
          save();
          closePanel();
        } else if ("redact" in d) {
          const t = lastTA;
          if (!t || t.selectionStart === t.selectionEnd) return;
          const a = t.selectionStart,
            z = t.selectionEnd;
          t.value =
            t.value.slice(0, a) +
            "[[" +
            t.value.slice(a, z) +
            "]]" +
            t.value.slice(z);
          t.dispatchEvent(new Event("input", { bubbles: true }));
        } else if ("unredact" in d) {
          const t = lastTA;
          if (!t) return;
          t.value = t.value.replace(/\[\[|\]\]/g, "");
          t.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

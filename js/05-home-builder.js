      /* home builder */
      const HB = {
        title: "Заголовок",
        text: "Текст",
        image: "Картинка",
        quote: "Цитата",
        stat: "Цифра",
        button: "Кнопка",
      };
      let curB = null,
        hdrag = null,
        homeDone = false;
      const mkB = (type, x, y, w, h, o = {}) => ({
        id: uid(),
        type,
        x,
        y,
        w,
        h,
        style: "plain",
        accent: "char",
        a: "",
        b: "",
        c: "",
        img: "",
        tab: "graph",
        ...o,
      });
      function seedHome() {
        return {
          blocks: [
            mkB("title", 60, 70, 820, 200, {
              a: "HORIZON UNKNOWN",
              b: "neither here nor there",
              c: "Canon hub",
            }),
            mkB("quote", 60, 300, 520, 150, {
              style: "card",
              accent: "story",
              a: "Everyone has a past. Some are worth killing for.",
              b: "Horizon Unknown",
            }),
            mkB("text", 620, 300, 520, 200, {
              style: "card",
              accent: "org",
              c: "О каноне",
              a: "Добро пожаловать",
              b: "Здесь будет общая информация: сеттинг, правила, хронология. Нажмите «Конструктор» внизу, чтобы изменить блоки, двигать их и добавлять свои.",
            }),
            mkB("button", 60, 540, 255, 70, {
              style: "glass",
              a: "Граф связей",
              tab: "graph",
            }),
            mkB("button", 335, 540, 255, 70, {
              style: "glass",
              accent: "char",
              a: "Персонажи",
              tab: "char",
            }),
            mkB("button", 610, 540, 255, 70, {
              style: "glass",
              accent: "org",
              a: "Организации",
              tab: "org",
            }),
            mkB("button", 885, 540, 255, 70, {
              style: "glass",
              accent: "story",
              a: "Истории",
              tab: "story",
            }),
          ],
        };
      }
      const hs = () =>
          Math.min(1, (($("#home").clientWidth || innerWidth) - 28) / 1200),
        sn = (v) => Math.round(v / 10) * 10;
      function blkIn(b) {
        const E = esc;
        if (b.type === "title")
          return `<small>${E(b.c)}</small><h1>${E(b.a)}</h1><p>${E(b.b)}</p>`;
        if (b.type === "text")
          return `<small>${E(b.c)}</small><h3>${E(b.a)}</h3><div>${E(b.b).replace(/\n/g, "<br>")}</div>`;
        if (b.type === "image")
          return `${b.img ? `<img src="${b.img}" alt="">` : "<em>Картинка</em>"}${b.a ? `<figcaption>${E(b.a)}</figcaption>` : ""}`;
        if (b.type === "quote")
          return `<blockquote>“${E(b.a)}”</blockquote><p>${E(b.b)}</p>`;
        if (b.type === "stat")
          return `<strong>${E(b.a)}</strong><p>${E(b.b)}</p>`;
        return `<span>${E(b.a)}</span><i></i>`;
      }
      function renderHome() {
        const H = S.home || (S.home = seedHome()),
          mobile =
            innerWidth <= 1024 && !document.body.classList.contains("build"),
          k = hs(),
          hh = Math.max(...H.blocks.map((b) => b.y + b.h), 400) + 120;
        document.body.classList.toggle("mobile-home", mobile);
        $("#hwrap").style.cssText = mobile
          ? "width:100%;height:auto"
          : `width:${1200 * k}px;height:${hh * k}px`;
        const c = $("#hcanvas");
        c.style.cssText = mobile
          ? "width:100%;height:auto;transform:none"
          : `width:1200px;height:${hh}px;transform:scale(${k})`;
        const blocks = mobile
          ? [...H.blocks].sort((a, b) => a.y - b.y || a.x - b.x)
          : H.blocks;
        c.innerHTML = blocks
          .map(
            (b, i) =>
              `<div class="blk ${b.type} s-${b.style} a-${b.accent}${homeDone ? "" : " in"}" data-id="${b.id}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;z-index:${i};animation-delay:${i * 80}ms">${blkIn(b)}<u class="rz"></u></div>`,
          )
          .join("");
        homeDone = true;
      }
      const _r2 = render;
      render = function () {
        _r2();
        renderHome();
      };
      const _pl = padList;
      padList = function () {
        _pl();
        $("#home").style.paddingTop = $("#list").style.paddingTop;
      };
      const _st = setTab;
      setTab = function (t) {
        if (t !== "home") {
          document.body.classList.remove("build");
          $("#h-build").textContent = "Конструктор";
        }
        _st(t);
        if (t === "home") renderHome();
      };
      addEventListener("resize", () => {
        if (tab === "home") renderHome();
      });
      $("#h-build").onclick = () => {
        const on = document.body.classList.toggle("build");
        $("#h-build").textContent = on ? "Готово" : "Конструктор";
        renderHome();
      };
      const hc = $("#hcanvas"),
        gb = (id) => S.home.blocks.find((x) => x.id === id);
      hc.addEventListener("pointerdown", (e) => {
        if (!document.body.classList.contains("build")) return;
        const el = e.target.closest(".blk");
        if (!el) return;
        const b = gb(el.dataset.id);
        e.preventDefault();
        hdrag = {
          b,
          el,
          rz: !!e.target.closest(".rz"),
          sx: e.clientX,
          sy: e.clientY,
          x: b.x,
          y: b.y,
          w: b.w,
          h: b.h,
          m: 0,
        };
        el.setPointerCapture(e.pointerId);
      });
      hc.addEventListener("pointermove", (e) => {
        if (!hdrag) return;
        const d = hdrag,
          k = hs(),
          dx = (e.clientX - d.sx) / k,
          dy = (e.clientY - d.sy) / k;
        d.m = Math.max(d.m, Math.hypot(dx, dy));
        if (d.rz) {
          d.b.w = Math.max(120, sn(d.w + dx));
          d.b.h = Math.max(50, sn(d.h + dy));
        } else {
          d.b.x = Math.max(0, Math.min(1200 - d.b.w, sn(d.x + dx)));
          d.b.y = Math.max(0, sn(d.y + dy));
        }
        Object.assign(d.el.style, {
          left: d.b.x + "px",
          top: d.b.y + "px",
          width: d.b.w + "px",
          height: d.b.h + "px",
        });
      });
      hc.addEventListener("pointerup", () => {
        if (!hdrag) return;
        const d = hdrag;
        hdrag = null;
        save();
        if (d.m < 4 && !d.rz) editBlock(d.b.id);
        else renderHome();
      });
      hc.addEventListener("click", (e) => {
        if (document.body.classList.contains("build")) return;
        const el = e.target.closest(".blk.button");
        if (el) setTab(gb(el.dataset.id).tab);
      });
      document.querySelectorAll("[data-hadd]").forEach(
        (btn) =>
          (btn.onclick = () => {
            const t = btn.dataset.hadd,
              D = {
                title: [600, 180, { a: "Заголовок", b: "Подзаголовок" }],
                text: [
                  440,
                  200,
                  { style: "card", a: "Заголовок", b: "Текст..." },
                ],
                image: [480, 300, { style: "card" }],
                quote: [480, 140, { style: "card", a: "Цитата", b: "Автор" }],
                stat: [240, 150, { style: "card", a: "42", b: "подпись" }],
                button: [255, 70, { style: "glass", a: "Кнопка" }],
              }[t];
            const b = mkB(
              t,
              60,
              sn($("#home").scrollTop / hs() + 90),
              D[0],
              D[1],
              D[2],
            );
            S.home.blocks.push(b);
            save();
            renderHome();
            editBlock(b.id);
          }),
      );
      function editBlock(id) {
        const b = gb(id);
        if (!b) return;
        curB = id;
        const F = {
          title: [
            ["c", "Надпись сверху"],
            ["a", "Заголовок"],
            ["b", "Подзаголовок"],
          ],
          text: [
            ["c", "Надпись сверху"],
            ["a", "Заголовок"],
            ["b", "Текст", 1],
          ],
          image: [["a", "Подпись"]],
          quote: [
            ["a", "Цитата", 1],
            ["b", "Автор"],
          ],
          stat: [
            ["a", "Число или слово"],
            ["b", "Подпись"],
          ],
          button: [["a", "Текст кнопки"]],
        }[b.type];
        const sel = (k, l, o) =>
          `<label style="flex:1">${l}<select data-h="${k}">${o.map(([v, t]) => `<option value="${v}"${b[k] === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>`;
        openPanel(
          `<div class="ed"><h4 style="margin:0">${HB[b.type]}</h4>` +
            F.map(
              ([k, l, t]) =>
                `<label>${l}${t ? `<textarea data-h="${k}">${esc(b[k])}</textarea>` : `<input data-h="${k}" value="${esc(b[k])}">`}</label>`,
            ).join("") +
            (b.type === "image"
              ? `<label>Картинка<input type="file" accept="image/*" id="hfile"></label>`
              : "") +
            (b.type === "button"
              ? sel("tab", "Куда ведёт", [
                  ["home", "Главная"],
                  ["graph", "Граф"],
                  ["char", "Персонажи"],
                  ["org", "Организации"],
                  ["story", "Истории"],
                ])
              : "") +
            `<div class="row">${sel("style", "Стиль", [
              ["plain", "Без фона"],
              ["card", "Карточка"],
              ["glass", "Стекло"],
            ])}${sel("accent", "Акцент", [
              ["char", "Красный"],
              ["org", "Синий"],
              ["story", "Янтарный"],
              ["ink", "Нейтральный"],
            ])}</div><div class="act"><button class="pri" data-done>Готово</button><button data-bdup>Копия</button><button data-bfront>Наверх</button><button data-bdel>Удалить</button></div></div>`,
          "char",
        );
      }
      $("#panel").addEventListener("input", (e) => {
        const k = e.target.dataset.h;
        if (k && curB) {
          gb(curB)[k] = e.target.value;
          save();
        }
      });
      $("#panel").addEventListener("change", (e) => {
        if (e.target.id !== "hfile" || !e.target.files[0]) return;
        const lb = e.target.previousSibling,
          rd = new FileReader();
        rd.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 1200 / im.width),
              c = document.createElement("canvas");
            c.width = im.width * k;
            c.height = im.height * k;
            c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
            gb(curB).img = c.toDataURL("image/jpeg", 0.78);
            save();
            lb.textContent = "Картинка ✓";
          };
          im.src = rd.result;
        };
        rd.readAsDataURL(e.target.files[0]);
      });
      $("#panel").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b || !curB) return;
        const d = b.dataset,
          A = S.home.blocks,
          i = A.findIndex((x) => x.id === curB);
        if ("bdup" in d) {
          A.push({ ...A[i], id: uid(), x: A[i].x + 20, y: A[i].y + 20 });
        } else if ("bfront" in d) {
          A.push(A.splice(i, 1)[0]);
        } else if ("bdel" in d) {
          A.splice(i, 1);
        } else return;
        curB = null;
        save();
        closePanel();
      });
      setTimeout(() => {
        padList();
        placeInd();
      }, 80);
      if (document.fonts) document.fonts.ready.then(padList);

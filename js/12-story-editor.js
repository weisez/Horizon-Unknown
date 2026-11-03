      /* ===== v6: story editor ===== */
      function toast(t) {
        const x = $("#toast");
        x.textContent = t;
        x.classList.add("on");
        clearTimeout(x._t);
        x._t = setTimeout(() => x.classList.remove("on"), 5500);
      }
      save = function () {
        if (VIEW) return;
        clearTimeout(saveT);
        saveT = setTimeout(() => {
          try {
            localStorage.setItem(KEY, JSON.stringify(S));
          } catch (e) {
            toast(
              "Не удалось сохранить: хранилище браузера переполнено. Скопируйте данные через «Данные» и вынесите картинки в папку img/.",
            );
          }
        }, 250);
      };
      const OKT = new Set(
        "P,BR,H1,H2,H3,H4,STRONG,B,EM,I,U,S,STRIKE,DEL,SPAN,A,UL,OL,LI,BLOCKQUOTE,HR,FIGURE,FIGCAPTION,IMG,ASIDE,TABLE,THEAD,TBODY,TR,TD,TH,DIV,SUB,SUP,MARK,CODE".split(
          ",",
        ),
      );
      function clean(html) {
        const d = new DOMParser().parseFromString(
          "<body>" + html,
          "text/html",
        ).body;
        (function w(n) {
          [...n.children].forEach((c) => {
            const t = c.tagName;
            if (!OKT.has(t)) {
              if (
                /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|FORM|INPUT|BUTTON|TEXTAREA|SELECT|SVG|MATH|NOSCRIPT|TEMPLATE)$/.test(
                  t,
                )
              ) {
                c.remove();
                return;
              }
              w(c);
              c.replaceWith(...c.childNodes);
              return;
            }
            [...c.attributes].forEach((a) => {
              if (
                !/^(class|style|data-size|data-al|data-t|data-nid|alt|href|src|title|colspan|rowspan)$/.test(
                  a.name,
                )
              )
                c.removeAttribute(a.name);
            });
            const cl = (c.getAttribute("class") || "")
              .split(/\s+/)
              .filter((x) => /^(co|sp|mn)$/.test(x))
              .join(" ");
            cl ? c.setAttribute("class", cl) : c.removeAttribute("class");
            const st = c.getAttribute("style");
            if (st) {
              const o = [];
              st.split(";").forEach((p) => {
                const [m, ...r] = p.split(":"),
                  k = (m || "").trim().toLowerCase(),
                  v = r.join(":").trim();
                if (
                  /^(color|background-color|text-align)$/.test(k) &&
                  /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|[a-z]+)$/i.test(v)
                )
                  o.push(k + ":" + v);
              });
              o.length
                ? c.setAttribute("style", o.join(";"))
                : c.removeAttribute("style");
            }
            if (c.hasAttribute("href")) {
              const v = c.getAttribute("href").trim();
              if (!/^(https?:\/\/\S+|mailto:\S+|#|[\w.\/%-]+)$/i.test(v))
                c.removeAttribute("href");
              else if (/^https?:/i.test(v)) {
                c.setAttribute("target", "_blank");
                c.setAttribute("rel", "noopener noreferrer");
              }
            }
            if (t === "IMG") {
              const v = (c.getAttribute("src") || "").trim();
              if (
                !/^(data:image\/(png|jpe?g|gif|webp);base64,[\w+\/=]+|https?:\/\/\S+|[\w.\/%-]+)$/i.test(
                  v,
                )
              ) {
                c.remove();
                return;
              }
            }
            if (
              c.hasAttribute("data-nid") &&
              !/^[\w-]+$/.test(c.getAttribute("data-nid"))
            )
              c.removeAttribute("data-nid");
            w(c);
          });
        })(d);
        return d.innerHTML;
      }
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="rd"><div class="rd-top"><button data-rd="x" title="Закрыть (Esc)">← Назад</button><strong class="rd-t"></strong><span class="rd-sp"></span><button data-rd="fs-" title="Меньше текст">A−</button><button data-rd="fs+" title="Больше текст">A+</button><button data-rd="ff" title="Шрифт: с засечками / без">Aa</button><button class="pri rd-ed" data-rd="mode"></button><i class="rd-pg"></i></div><div class="rd-tb" id="rdtb"></div><div class="rd-sc" id="rdsc"><header class="rd-hero"></header><div class="rd-bw"><div class="rd-body" id="rdb" spellcheck="true" data-ph="Начните писать историю… Заголовки, картинки, выноски и таблицы — на панели сверху."></div></div></div><div class="rd-st" id="rdst"></div></div><div id="rdpop"></div><div id="figtb"></div><div id="toast"></div>`,
      );
      const TB = [
        ["undo", "↶", "Отменить (Ctrl+Z)"],
        ["redo", "↷", "Повторить (Ctrl+Y)"],
        0,
        "BLK",
        0,
        ["bold", "<b>B</b>", "Жирный (Ctrl+B)"],
        ["italic", "<i>I</i>", "Курсив (Ctrl+I)"],
        ["underline", "<u>U</u>", "Подчёркнутый (Ctrl+U)"],
        ["strikeThrough", "<s>S</s>", "Зачёркнутый"],
        "CLR",
        0,
        [
          "justifyLeft",
          ic("M4 6h16M4 10h10M4 14h16M4 18h10"),
          "По левому краю",
        ],
        ["justifyCenter", ic("M4 6h16M7 10h10M4 14h16M7 18h10"), "По центру"],
        [
          "justifyRight",
          ic("M4 6h16M10 10h10M4 14h16M10 18h10"),
          "По правому краю",
        ],
        0,
        ["insertUnorderedList", "• ≡", "Маркированный список"],
        ["insertOrderedList", "1. ≡", "Нумерованный список"],
        0,
        ["link", "🔗", "Ссылка (Ctrl+K)"],
        ["img", "🖼", "Картинка"],
        ["mn", "@", "Ссылка на карточку"],
        0,
        ["co", "❗", "Выноска"],
        ["tbl", "▦", "Таблица"],
        ["hr", "✦", "Разделитель"],
        ["sp", "▮", "Скрыть текст (спойлер)"],
        ["removeFormat", "⌫", "Убрать форматирование"],
      ];
      $("#rdtb").innerHTML = TB.map((x) =>
        x === 0
          ? '<i class="sep"></i>'
          : x === "BLK"
            ? `<select id="rdblk" title="Стиль абзаца"><option value="p">Абзац</option><option value="h1">Заголовок 1</option><option value="h2">Заголовок 2</option><option value="h3">Заголовок 3</option><option value="blockquote">Цитата</option></select>`
            : x === "CLR"
              ? `<label class="clr" title="Цвет текста"><b style="border-bottom:3px solid #c23a2e">A</b><input type="color" id="rdfc" value="#c23a2e"></label><label class="clr" title="Выделение цветом"><b style="background:#f5d76e;color:#111;padding:0 4px">ab</b><input type="color" id="rdhc" value="#f5d76e"></label>`
              : `<button data-c="${x[0]}" title="${x[2]}">${x[1]}</button>`,
      ).join("");
      let rdId = null,
        lr = null,
        svT,
        savedAt = "";
      const RB = $("#rdb"),
        isEd = () => $("#rd").classList.contains("edit");
      document.addEventListener("selectionchange", () => {
        const s = getSelection();
        if (s.rangeCount && RB.contains(s.anchorNode)) {
          lr = s.getRangeAt(0).cloneRange();
          syncTb();
        }
      });
      const restore = () => {
        if (lr) {
          const s = getSelection();
          s.removeAllRanges();
          s.addRange(lr);
        }
      };
      function ex(c, v = null) {
        if (document.activeElement !== RB) {
          RB.focus({ preventScroll: true });
          restore();
        }
        document.execCommand(c, false, v);
      }
      function syncTb() {
        if (!isEd()) return;
        [
          "bold",
          "italic",
          "underline",
          "strikeThrough",
          "insertUnorderedList",
          "insertOrderedList",
          "justifyLeft",
          "justifyCenter",
          "justifyRight",
        ].forEach((c) => {
          const b = $(`#rdtb [data-c="${c}"]`);
          if (b) b.classList.toggle("on", document.queryCommandState(c));
        });
        const v = (document.queryCommandValue("formatBlock") || "p")
            .toLowerCase()
            .replace("heading ", "h"),
          sl = $("#rdblk");
        sl.value = [...sl.options].some((o) => o.value === v) ? v : "p";
      }
      const wc = () => (RB.innerText.trim().match(/\S+/g) || []).length;
      function stats(kb) {
        const w = wc(),
          m = $(".rd-meta");
        if (m)
          m.textContent =
            w + " слов · ≈" + Math.max(1, Math.ceil(w / 180)) + " мин чтения";
        if (isEd()) {
          let t = w + " слов" + (savedAt ? " · сохранено " + savedAt : "");
          if (kb) {
            const k = Math.round(JSON.stringify(S).length / 1024);
            t +=
              " · данные " +
              (k > 1024 ? (k / 1024).toFixed(1) + " МБ" : k + " КБ") +
              " из ≈5 МБ";
          }
          $("#rdst").textContent = t;
        }
      }
      const toggleEmpty = () =>
        RB.classList.toggle(
          "empty",
          !RB.textContent.trim() && !RB.querySelector("img,hr,table,aside,li"),
        );
      function commit() {
        const n = byId(rdId);
        if (!n || !isEd()) return;
        const c = RB.cloneNode(true);
        let h = clean(c.innerHTML);
        if (!h.replace(/<[^>]*>|&nbsp;|\s/g, "") && !/<(img|hr|table)/i.test(h))
          h = "";
        n.doc = h;
        const d = new Date();
        savedAt =
          pad2(d.getHours()) +
          ":" +
          pad2(d.getMinutes()) +
          ":" +
          pad2(d.getSeconds());
        save();
        stats(1);
      }
      const pad2 = (v) => String(v).padStart(2, "0");
      RB.addEventListener("input", () => {
        clearTimeout(svT);
        svT = setTimeout(commit, 500);
        toggleEmpty();
        stats();
      });
      const prep = () =>
        RB.querySelectorAll("figure").forEach((f) => {
          f.contentEditable = "false";
          const c = f.querySelector("figcaption");
          if (c) c.contentEditable = "true";
        });
      function openStory(id, ed) {
        const n = byId(id);
        if (!n) return;
        rdId = id;
        ed = !!ed && !VIEW;
        lr = null;
        savedAt = "";
        const R = $("#rd");
        R.classList.toggle("edit", ed);
        showTb(null);
        $(".rd-t").textContent = n.name;
        $(".rd-hero").innerHTML =
          `${n.banner || n.img ? `<img src="${n.banner || n.img}" alt="">` : ""}<div class="rd-hs"></div><div class="rd-hi"><small>${esc(n.sub || "История")}</small><h1>${esc(n.name)}</h1><p class="rd-meta"></p>${n.short ? `<em>${esc(n.short)}</em>` : ""}</div>`;
        RB.innerHTML = n.doc
          ? clean(n.doc)
          : ed
            ? "<p><br></p>"
            : `<p class="rd-none">История пока не написана.</p>`;
        RB.contentEditable = ed ? "true" : "false";
        if (ed) {
          prep();
          document.execCommand("defaultParagraphSeparator", false, "p");
          document.execCommand("styleWithCSS", false, true);
        }
        $('[data-rd="mode"]').textContent = ed ? "Читать" : "Редактировать";
        toggleEmpty();
        stats(1);
        R.classList.add("open");
        $("#rdsc").scrollTop = 0;
        $(".rd-pg").style.width = "0";
      }
      function closeStory() {
        clearTimeout(svT);
        commit();
        $("#rd").classList.remove("open");
        $("#rdpop").classList.remove("open");
        showTb(null);
        rdId = null;
        renderList();
      }
      /* reader prefs */
      let RP = { fs: 1, sans: 0 };
      try {
        RP = Object.assign(
          RP,
          JSON.parse(localStorage.getItem("hu-rd") || "{}"),
        );
      } catch (e) {}
      const rpApply = () => {
        $("#rd").style.setProperty("--rfs", RP.fs);
        $("#rd").classList.toggle("sans", !!RP.sans);
        try {
          localStorage.setItem("hu-rd", JSON.stringify(RP));
        } catch (e) {}
      };
      rpApply();
      $(".rd-top").addEventListener("click", (e) => {
        const b = e.target.closest("[data-rd]");
        if (!b) return;
        const k = b.dataset.rd;
        if (k === "x") closeStory();
        else if (k === "fs+") {
          RP.fs = Math.min(1.5, +(RP.fs + 0.1).toFixed(2));
          rpApply();
        } else if (k === "fs-") {
          RP.fs = Math.max(0.8, +(RP.fs - 0.1).toFixed(2));
          rpApply();
        } else if (k === "ff") {
          RP.sans = RP.sans ? 0 : 1;
          rpApply();
        } else if (k === "mode") {
          const e2 = isEd(),
            id = rdId;
          if (e2) {
            clearTimeout(svT);
            commit();
          }
          openStory(id, !e2);
        }
      });
      $("#rdsc").addEventListener("scroll", (e) => {
        const s = e.target;
        $(".rd-pg").style.width =
          (s.scrollTop / Math.max(1, s.scrollHeight - s.clientHeight)) * 100 +
          "%";
        showTb(null);
      });
      /* toolbar */
      $("#rdtb").addEventListener("mousedown", (e) => {
        if (e.target.closest("button")) e.preventDefault();
      });
      const STD =
        "undo,redo,bold,italic,underline,strikeThrough,justifyLeft,justifyCenter,justifyRight,insertUnorderedList,insertOrderedList,removeFormat".split(
          ",",
        );
      const selTxt = () => {
        restore();
        return getSelection().toString();
      };
      $("#rdtb").addEventListener("click", (e) => {
        const b = e.target.closest("button[data-c]");
        if (!b) return;
        const c = b.dataset.c;
        if (STD.includes(c)) ex(c);
        else if (c === "hr") ex("insertHorizontalRule");
        else if (c === "link" || c === "img" || c === "mn") pop(b, c);
        else if (c === "co") {
          const t = selTxt() || "Важная заметка";
          ex(
            "insertHTML",
            `<aside class="co" data-t="i"><p>${esc(t)}</p></aside><p><br></p>`,
          );
        } else if (c === "tbl")
          ex(
            "insertHTML",
            `<table><tbody><tr><th>Колонка</th><th>Колонка</th><th>Колонка</th></tr>${"<tr><td><br></td><td><br></td><td><br></td></tr>".repeat(2)}</tbody></table><p><br></p>`,
          );
        else if (c === "sp") {
          restore();
          const a = getSelection().anchorNode,
            el = a && (a.nodeType === 1 ? a : a.parentElement).closest(".sp");
          if (el) {
            el.replaceWith(...el.childNodes);
            RB.dispatchEvent(new Event("input"));
          } else {
            const t = getSelection().toString();
            if (t) ex("insertHTML", `<span class="sp">${esc(t)}</span>&#8203;`);
          }
        }
        syncTb();
      });
      $("#rdblk").onchange = (e) =>
        ex("formatBlock", "<" + e.target.value + ">");
      $("#rdfc").oninput = (e) => ex("foreColor", e.target.value);
      $("#rdhc").oninput = (e) => ex("hiliteColor", e.target.value);
      /* popovers */
      function pop(a, k) {
        restore();
        const P = $("#rdpop"),
          r = a.getBoundingClientRect();
        let h = "";
        if (k === "link") {
          const an = getSelection().anchorNode,
            cur =
              an && (an.nodeType === 1 ? an : an.parentElement).closest("a");
          h = `<input id="pl" placeholder="https://…" value="${esc(cur ? cur.getAttribute("href") : "")}"><div class="act" style="margin:0"><button class="pri" data-pk="link">Применить</button><button data-pk="unlink">Убрать</button></div>`;
        } else if (k === "img")
          h = `<label class="pf">Загрузить файл<input type="file" id="pf" accept="image/*" multiple></label><button data-pk="lib">📁 Из библиотеки</button><div class="rd-or">или вставьте ссылку на картинку</div><input id="pu" placeholder="https://… или img/photo.jpg"><div class="act" style="margin:0"><button class="pri" data-pk="imgurl">Вставить</button></div><small>Загруженные файлы сжимаются и хранятся внутри данных (лимит браузера ≈5 МБ). Для больших историй кладите картинки в папку img/ репозитория и вставляйте по ссылке.</small>`;
        else
          h = `<input id="pm" placeholder="Найти карточку…" autocomplete="off"><div id="pml"></div>`;
        P.innerHTML = h;
        P.style.left = Math.max(8, Math.min(r.left, innerWidth - 300)) + "px";
        P.style.top = r.bottom + 6 + "px";
        P.classList.add("open");
        if (k === "mn") mnList();
        const i = P.querySelector("input:not([type=file])");
        i && i.focus();
      }
      function mnList() {
        const q = ($("#pm").value || "").toLowerCase();
        $("#pml").innerHTML =
          S.nodes
            .filter((n) => n.id !== rdId && n.name.toLowerCase().includes(q))
            .slice(0, 30)
            .map(
              (n) =>
                `<button data-pm="${n.id}">${esc(n.name)} <em style="color:var(--mute)">${T[n.type]}</em></button>`,
            )
            .join("") || `<small>Ничего не найдено</small>`;
      }
      function readImg(f, cb) {
        const rd = new FileReader();
        rd.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 1400 / im.width),
              c = document.createElement("canvas");
            c.width = im.width * k;
            c.height = im.height * k;
            c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
            let u = c.toDataURL("image/webp", 0.85);
            if (!u.startsWith("data:image/webp"))
              u = c.toDataURL("image/jpeg", 0.82);
            cb(u);
          };
          im.src = rd.result;
        };
        rd.readAsDataURL(f);
      }
      function insFig(src) {
        ex(
          "insertHTML",
          `<figure data-size="l"><img src="${esc(src)}" alt=""><figcaption>Подпись</figcaption></figure><p><br></p>`,
        );
        prep();
      }
      $("#rdpop").addEventListener("input", (e) => {
        if (e.target.id === "pm") mnList();
      });
      $("#rdpop").addEventListener("change", (e) => {
        if (e.target.id === "pf") {
          [...e.target.files].forEach((f) => imgIn(f, 1600, insFig, 0.85));
          $("#rdpop").classList.remove("open");
        }
      });
      $("#rdpop").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if (d.pk === "link") {
          const v = $("#pl").value.trim();
          restore();
          if (v) {
            if (getSelection().isCollapsed)
              ex("insertHTML", `<a href="${esc(v)}">${esc(v)}</a>`);
            else ex("createLink", v);
          }
        } else if (d.pk === "unlink") {
          restore();
          ex("unlink");
        } else if (d.pk === "imgurl") {
          const v = $("#pu").value.trim();
          if (v) insFig(v);
        } else if (d.pk === "lib") {
          $("#rdpop").classList.remove("open");
          mlOpen((p) => insFig(p));
          return;
        } else if (d.pm) {
          const n = byId(d.pm);
          restore();
          ex(
            "insertHTML",
            `<a class="mn" data-nid="${n.id}" href="#">${esc(n.name)}</a>&nbsp;`,
          );
        } else return;
        $("#rdpop").classList.remove("open");
      });
      addEventListener("pointerdown", (e) => {
        if (!e.target.closest("#rdpop,#rdtb"))
          $("#rdpop").classList.remove("open");
      });
      /* floating block toolbar (image / callout / table) */
      let tbEl = null;
      function showTb(el) {
        const T = $("#figtb");
        document
          .querySelectorAll("#rdb .sel")
          .forEach((x) => x.classList.remove("sel"));
        tbEl = el;
        if (!el) {
          T.classList.remove("open");
          return;
        }
        const k =
          el.tagName === "FIGURE" ? "f" : el.tagName === "TABLE" ? "t" : "c";
        T.innerHTML =
          k === "f"
            ? `<button data-ts="s">S</button><button data-ts="m">M</button><button data-ts="l">L</button><button data-ts="f">Вся ширина</button><button data-ta="l">⇤</button><button data-ta="c">↔</button><button data-ta="r">⇥</button><button data-tx>✕</button>`
            : k === "t"
              ? `<button data-tr>+ строка</button><button data-tc>+ колонка</button><button data-tx>Удалить</button>`
              : `<button data-tt="i">Инфо</button><button data-tt="w">Важно</button><button data-tt="d">Опасно</button><button data-tx>✕</button>`;
        const r = el.getBoundingClientRect();
        T.style.left = Math.max(8, Math.min(r.left, innerWidth - 340)) + "px";
        T.style.top = Math.max(110, r.top - 40) + "px";
        T.classList.add("open");
        el.classList.add("sel");
      }
      $("#figtb").addEventListener("mousedown", (e) => e.preventDefault());
      $("#figtb").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b || !tbEl) return;
        const d = b.dataset,
          el = tbEl;
        if (d.ts) el.dataset.size = d.ts;
        else if (d.ta) {
          d.ta === "c" ? el.removeAttribute("data-al") : (el.dataset.al = d.ta);
        } else if (d.tt) el.dataset.t = d.tt;
        else if ("tr" in d) {
          const r = el.querySelector("tr:last-child").cloneNode(true);
          r.querySelectorAll("td,th").forEach((x) => (x.innerHTML = "<br>"));
          el.querySelector("tbody").appendChild(r);
        } else if ("tc" in d)
          el.querySelectorAll("tr").forEach((r) => {
            const l = r.lastElementChild,
              c = document.createElement(l.tagName);
            c.innerHTML = l.tagName === "TH" ? "Колонка" : "<br>";
            r.appendChild(c);
          });
        else if ("tx" in d) {
          el.remove();
          showTb(null);
        }
        if (rdId) RB.dispatchEvent(new Event("input"));
        if (tbEl && document.body.contains(tbEl)) showTb(tbEl);
      });
      RB.addEventListener("click", (e) => {
        if (isEd()) {
          const el = e.target.closest("figure,aside.co,table");
          showTb(el && RB.contains(el) ? el : null);
          return;
        }
        const sp = e.target.closest(".sp");
        if (sp) {
          sp.classList.toggle("show");
          return;
        }
        const a = e.target.closest("a.mn");
        if (a) {
          e.preventDefault();
          const id = a.dataset.nid;
          closeStory();
          if (byId(id)) go(id);
        }
      });
      RB.addEventListener("paste", (e) => {
        if (!isEd()) return;
        e.preventDefault();
        const f = [...e.clipboardData.files].find((x) =>
          /^image\//.test(x.type),
        );
        if (f) {
          imgIn(f, 1600, insFig, 0.85);
          return;
        }
        const h = e.clipboardData.getData("text/html");
        if (h) ex("insertHTML", clean(h));
        else ex("insertText", e.clipboardData.getData("text/plain"));
      });
      RB.addEventListener("dragover", (e) => {
        if (isEd()) e.preventDefault();
      });
      RB.addEventListener("drop", (e) => {
        if (!isEd()) return;
        const fs = [...e.dataTransfer.files].filter((f) =>
          /^image\//.test(f.type),
        );
        if (fs.length) {
          e.preventDefault();
          fs.forEach((f) => imgIn(f, 1600, insFig, 0.85));
        }
      });
      addEventListener("keydown", (e) => {
        if (!$("#rd").classList.contains("open")) return;
        if (e.key === "Escape") {
          if ($("#rdpop").classList.contains("open"))
            $("#rdpop").classList.remove("open");
          else closeStory();
        } else if (
          isEd() &&
          (e.ctrlKey || e.metaKey) &&
          e.key.toLowerCase() === "k"
        ) {
          e.preventDefault();
          pop($('#rdtb [data-c="link"]'), "link");
        }
      });
      /* entry points */
      const SB = (n) =>
        `${n.doc ? `<button class="pri" data-read="${n.id}">Читать</button>` : ""}<button data-write="${n.id}">${n.doc ? "Редактировать текст" : "Писать историю"}</button>`;
      const _rl6 = renderList;
      renderList = function () {
        _rl6();
        document.querySelectorAll("#list .item.story").forEach((it) => {
          const n = byId(it.dataset.id),
            a = it.querySelector(".act");
          if (n && a) a.insertAdjacentHTML("afterbegin", SB(n));
        });
      };
      const _show3 = show;
      show = function (id, el) {
        _show3(id, el);
        const n = byId(id),
          a = $("#panel .act");
        if (n && n.type === "story" && a)
          a.insertAdjacentHTML("afterbegin", SB(n));
      };
      document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-read],[data-write]");
        if (!b) return;
        const id = b.dataset.read || b.dataset.write;
        if ($("#ov").classList.contains("open")) closePanel();
        openStory(id, !!b.dataset.write);
      });

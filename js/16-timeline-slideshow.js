      /* timeline: live accent / title preview */
      $("#panel").addEventListener("input", (e) => {
        const d = e.target.dataset;
        if (!d.e || !curE) return;
        const el = document.querySelector(`.ev[data-id='${curE}']`);
        if (!el) return;
        if (d.e === "accent")
          el.className =
            el.className.replace(/\ba-\w+/g, "").trim() +
            " a-" +
            e.target.value;
        else if (d.e === "title") {
          const b = el.querySelector(".card b");
          if (b) b.textContent = e.target.value;
        } else if (d.e === "date") {
          const t = el.querySelector(".dt");
          if (t) t.textContent = e.target.value;
        }
      });
      /* ===== v10: timeline slideshow ===== */
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="ss"><div class="ss-in"><div class="ss-bar"><i></i></div><div class="ss-top"><span class="ss-d"></span><span class="ss-n"></span></div><h3 class="ss-t"></h3><div class="ss-x"></div><div class="ss-ch"></div><div class="ss-ctl"><button data-ss="prev" title="Назад (←)">◀</button><button data-ss="play" class="pri" title="Пауза / продолжить (Пробел)">❚❚</button><button data-ss="next" title="Дальше (→)">▶</button><button data-ss="sp" title="Скорость">1×</button><button data-ss="fs" title="Во весь экран (F)">⛶</button><span class="sp"></span><button data-ss="x" title="Выйти (Esc)">Выйти</button></div></div></div>`,
      );
      $("#t-add").insertAdjacentHTML(
        "beforebegin",
        `<button class="pri" id="t-show" title="Автоматически показать события по порядку">▶ Рассказать</button>`,
      );
      const SS = {
          on: 0,
          i: 0,
          play: 0,
          sp: 1,
          evs: [],
          tm: 0,
          t0: 0,
          rem: 0,
          dur: 0,
          end: 0,
          fs: 0,
        },
        SPD = [1, 1.5, 2, 0.75];
      const ssBar = () => $("#ss .ss-bar i"),
        ssBtn = () => {
          $('[data-ss="play"]').textContent = SS.play
            ? "❚❚"
            : SS.end
              ? "↻"
              : "▶";
        };
      const ssDur = (e) =>
        Math.min(13000, 3200 + (e.text || "").length * 55) / SS.sp;
      function ssRun() {
        const b = ssBar();
        clearTimeout(SS.tm);
        b.style.transition = "none";
        b.style.width = 100 * (1 - SS.rem / SS.dur) + "%";
        void b.offsetWidth;
        b.style.transition = `width ${SS.rem}ms linear`;
        b.style.width = "100%";
        SS.t0 = performance.now();
        SS.tm = setTimeout(() => {
          SS.i < SS.evs.length - 1 ? ssGo(SS.i + 1) : ssEnd();
        }, SS.rem);
      }
      function ssPause() {
        clearTimeout(SS.tm);
        SS.rem = Math.max(0, SS.rem - (performance.now() - SS.t0));
        const b = ssBar(),
          w = getComputedStyle(b).width;
        b.style.transition = "none";
        b.style.width = w;
      }
      function ssGo(i) {
        clearTimeout(SS.tm);
        SS.end = 0;
        SS.i = Math.max(0, Math.min(SS.evs.length - 1, i));
        const el = SS.evs[SS.i],
          e = (S.events || []).find((x) => x.id === el.dataset.id);
        if (!e) return;
        SS.evs.forEach((x) => x.classList.remove("cur"));
        el.classList.add("cur");
        const lr = tl.getBoundingClientRect(),
          er = el.getBoundingClientRect();
        tl.scrollTo({
          left: tl.scrollLeft + er.left - lr.left - tl.clientWidth / 2,
          behavior: "smooth",
        });
        const c = $("#ss");
        c.className = (el.className.match(/\ba-\w+/) || [""])[0];
        $(".ss-d", c) || 0;
        c.querySelector(".ss-d").textContent = e.date || "—";
        c.querySelector(".ss-n").textContent = SS.i + 1 + " / " + SS.evs.length;
        c.querySelector(".ss-t").textContent = e.title || "";
        const x = c.querySelector(".ss-x");
        x.innerHTML = esc(e.text || "").replace(/\n/g, "<br>");
        redact(x);
        const ch = c.querySelector(".ss-ch");
        ch.innerHTML = (e.refs || [])
          .map((r) => byId(r))
          .filter(Boolean)
          .map(
            (n) =>
              `<button class="chip" data-go="${n.id}">${esc(n.name)}</button>`,
          )
          .join("");
        ch.querySelectorAll("[data-go]").forEach((b) => {
          if (CXI(b.dataset.go)) cxText(b);
        });
        c.classList.remove("ss-sw");
        void c.offsetWidth;
        c.classList.add("ss-sw");
        SS.dur = ssDur(e);
        SS.rem = SS.dur;
        ssBtn();
        if (SS.play) ssRun();
        else {
          const b = ssBar();
          b.style.transition = "none";
          b.style.width = "0";
        }
      }
      function ssEnd() {
        clearTimeout(SS.tm);
        SS.play = 0;
        SS.end = 1;
        const b = ssBar();
        b.style.transition = "none";
        b.style.width = "100%";
        ssBtn();
        toast("Конец хронологии");
      }
      function ssToggle() {
        if (SS.play) {
          ssPause();
          SS.play = 0;
        } else if (SS.end) {
          SS.play = 1;
          ssGo(0);
          return;
        } else {
          SS.play = 1;
          ssRun();
        }
        ssBtn();
      }
      function ssStop() {
        if (!SS.on) return;
        clearTimeout(SS.tm);
        SS.on = 0;
        SS.play = 0;
        document.body.classList.remove("ss-on");
        $("#tl").classList.remove("show");
        SS.evs.forEach((x) => x.classList.remove("cur"));
        if (document.fullscreenElement)
          document.exitFullscreen().catch(() => {});
      }
      function ssStart() {
        if (tab !== "time") return;
        const evs = [...document.querySelectorAll("#tltrack .ev")];
        if (!evs.length) {
          toast("Нет событий для показа");
          return;
        }
        Object.assign(SS, { evs, on: 1, sp: 1, play: 1, end: 0 });
        $('[data-ss="sp"]').textContent = "1×";
        document.body.classList.add("ss-on");
        $("#tl").classList.add("show");
        ssGo(0);
      }
      const ssFs = () => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else
          document.documentElement.requestFullscreen &&
            document.documentElement.requestFullscreen().catch(() => {});
      };
      $("#t-show").onclick = ssStart;
      $("#ss").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if (d.go) {
          ssStop();
          go(d.go);
          return;
        }
        if (d.ss === "x") ssStop();
        else if (d.ss === "play") ssToggle();
        else if (d.ss === "next")
          SS.i < SS.evs.length - 1 ? ssGo(SS.i + 1) : ssEnd();
        else if (d.ss === "prev") ssGo(SS.i - 1);
        else if (d.ss === "fs") ssFs();
        else if (d.ss === "sp") {
          SS.sp = SPD[(SPD.indexOf(SS.sp) + 1) % SPD.length];
          b.textContent = SS.sp + "×";
          if (SS.play) {
            const el = SS.evs[SS.i],
              e2 = (S.events || []).find((x) => x.id === el.dataset.id);
            SS.dur = ssDur(e2);
            SS.rem = SS.dur;
            ssRun();
          }
        }
      });
      addEventListener(
        "keydown",
        (e) => {
          if (!SS.on || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
          const k = e.key;
          if (k === "Escape") {
            e.stopPropagation();
            ssStop();
          } else if (k === " ") {
            e.preventDefault();
            ssToggle();
          } else if (k === "ArrowRight") {
            e.preventDefault();
            SS.i < SS.evs.length - 1 ? ssGo(SS.i + 1) : ssEnd();
          } else if (k === "ArrowLeft") {
            e.preventDefault();
            ssGo(SS.i - 1);
          } else if (k === "f" || k === "F") ssFs();
        },
        true,
      );
      const _st9 = setTab;
      setTab = function (t) {
        if (SS.on && t !== "time") ssStop();
        _st9(t);
      };
      const _rt9 = renderTL;
      renderTL = function () {
        if (SS.on) ssStop();
        _rt9();
      };

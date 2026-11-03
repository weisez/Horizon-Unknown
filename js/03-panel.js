      /* panel */
      function openPanel(html, type, origin) {
        const ov = $("#ov"),
          p = $("#panel");
        p.className = "panel " + type;
        p.innerHTML = html;
        ov.style.display = "flex";
        const r = p.getBoundingClientRect(),
          o = origin || { x: innerWidth / 2, y: innerHeight / 2 };
        p.style.transformOrigin = `${o.x - r.left}px ${o.y - r.top}px`;
        void p.offsetWidth;
        ov.classList.add("open");
      }
      function closePanel() {
        const ov = $("#ov");
        ov.classList.remove("open");
        setTimeout(() => {
          if (!ov.classList.contains("open")) ov.style.display = "none";
        }, 320);
        cur = null;
        render();
      }
      function show(id, el) {
        const n = byId(id);
        if (!n) return;
        cur = id;
        const rel = S.links
          .filter((l) => l.a === id || l.b === id)
          .map((l) => ({ l, o: byId(l.a === id ? l.b : l.a) }))
          .filter((r) => r.o);
        let o;
        if (el) {
          const b = el.getBoundingClientRect();
          o = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        }
        openPanel(
          `<div class="pv"><div class="big">${n.img ? `<img src="${n.img}" alt="">` : esc(ini(n.name))}${stp(n)}</div><div class="body"><div class="kind">${T[n.type]}</div><h2>${esc(n.name)}</h2><div class="sub">${esc(n.sub)}</div>
  ${n.quote ? `<blockquote>“${esc(n.quote)}”</blockquote>` : ""}<div>${esc(n.long || n.short).replace(/\n/g, "<br>")}</div>
  ${rel.length ? `<h4>Связи</h4><div>${rel.map((r) => `<button class="chip" data-go="${r.o.id}">${esc(r.o.name)}${r.l.label ? `<em>${esc(r.l.label)}</em>` : ""}</button>`).join("")}</div>` : ""}
  <div class="act"><button data-edit="${id}">Редактировать</button><button data-close>Закрыть</button></div></div></div>`,
          n.type,
          o,
        );
      }
      function edit(id) {
        const n = byId(id);
        cur = id;
        const rel = S.links.filter((l) => l.a === id || l.b === id);
        const opts = S.nodes
          .filter((o) => o.id !== id)
          .map((o) => `<option value="${o.id}">${esc(o.name)}</option>`)
          .join("");
        $("#panel").className = "panel " + n.type;
        $("#panel").innerHTML = `<div class="ed">
  <div class="row"><label style="flex:1">Тип<select data-f="type">${Object.keys(
    T,
  )
    .map(
      (k) =>
        `<option value="${k}"${k === n.type ? " selected" : ""}>${T[k]}</option>`,
    )
    .join("")}</select></label>
  <label style="flex:2">Название / имя<input data-f="name" value="${esc(n.name)}"></label></div>
  <label>Подпись (роль, статус, том)<input data-f="sub" value="${esc(n.sub)}"></label>
  <label>Цитата<input data-f="quote" value="${esc(n.quote)}"></label>
  <label>Краткое описание (на карточке)<textarea data-f="short" style="min-height:60px">${esc(n.short)}</textarea></label>
  <label>Полное описание (при открытии)<textarea data-f="long">${esc(n.long)}</textarea></label><div class="row"><button data-redact>▮ Скрыть выделенное</button><button data-unredact>Снять скрытие</button><span style="color:var(--mute);font-size:12px">работает в любом поле: [[текст]]</span></div>
  <div class="row">${n.img ? `<img class="thumb" src="${n.img}" alt="">` : ""}<label style="flex:1">Картинка карточки (граф и раскрытие)<input type="file" accept="image/*" id="file"></label>${n.img ? `<button data-noimg>Убрать</button>` : ""}</div>
  <div class="row">${n.banner ? `<img class="thumb" style="width:128px;height:44px" src="${n.banner}" alt="">` : ""}<label style="flex:1">Баннер для списка (широкая картинка, ~1600×400)<input type="file" accept="image/*" id="file2"></label>${n.banner ? `<button data-nobn>Убрать</button>` : ""}</div>
  <h4>Связи</h4>${rel
    .map((l) => {
      const o = byId(l.a === id ? l.b : l.a);
      return `<div class="lrow"><span>${esc(o ? o.name : "?")} <em style="color:var(--mute)">${esc(l.label)}</em></span><select data-lk="${l.id}" style="width:auto">${kindOpts(l.kind)}</select><button data-dl="${l.id}">×</button></div>`;
    })
    .join("")}
  <div class="row"><select id="ln-to">${opts}</select><input id="ln-lb" placeholder="подпись связи"><select id="ln-kd">${kindOpts()}</select><button data-addl>Связать</button></div>
  <div class="act"><button class="pri" data-done>Готово</button><button data-stamps>Штампы</button><button data-del>Удалить</button></div></div>`;
      }
      $("#panel").addEventListener("input", (e) => {
        const f = e.target.dataset.f;
        if (f && cur) {
          byId(cur)[f] = e.target.value;
          if (f === "type") $("#panel").className = "panel " + e.target.value;
          save();
        }
      });
      $("#panel").addEventListener("change", (e) => {
        if (e.target.id !== "file" || !e.target.files[0]) return;
        const rd = new FileReader();
        rd.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 520 / Math.max(im.width, im.height)),
              c = document.createElement("canvas");
            c.width = im.width * k;
            c.height = im.height * k;
            c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
            byId(cur).img = c.toDataURL("image/jpeg", 0.82);
            save();
            edit(cur);
          };
          im.src = rd.result;
        };
        rd.readAsDataURL(e.target.files[0]);
      });
      $("#panel").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if ("close" in d || "done" in d) closePanel();
        else if (d.go) show(d.go);
        else if (d.edit) edit(d.edit);
        else if ("noimg" in d) {
          byId(cur).img = "";
          save();
          edit(cur);
        } else if (d.dl) {
          S.links = S.links.filter((l) => l.id !== d.dl);
          save();
          edit(cur);
          drawLinks();
        } else if ("addl" in d) {
          const to = $("#ln-to").value;
          if (to) {
            S.links.push({
              id: uid(),
              a: cur,
              b: to,
              label: $("#ln-lb").value,
              kind: $("#ln-kd").value,
            });
            save();
            edit(cur);
            drawLinks();
          }
        } else if ("del" in d) {
          S.links = S.links.filter((l) => l.a !== cur && l.b !== cur);
          S.nodes = S.nodes.filter((n) => n.id !== cur);
          save();
          closePanel();
        } else if ("apply" in d) {
          try {
            const j = JSON.parse($("#json").value);
            if (!j.nodes || !j.links) throw 0;
            S = j;
            save();
            closePanel();
            layoutFit();
          } catch (x) {
            $("#json").style.borderColor = "var(--c-char)";
          }
        } else if ("copy" in d) {
          $("#json").select();
          try {
            navigator.clipboard.writeText($("#json").value);
          } catch (x) {
            document.execCommand("copy");
          }
          b.textContent = "Скопировано";
        } else if ("reset" in d) {
          S = seed();
          layout(false);
          save();
          closePanel();
          fit();
        }
      });
      $("#ov").addEventListener("pointerdown", (e) => {
        if (e.target.id === "ov") closePanel();
      });
      function layoutFit() {
        render();
        fit();
      }

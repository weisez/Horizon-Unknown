      let OWN = false;
      try {
        OWN = localStorage.getItem("hu-owner") === "1";
      } catch (e) {}
      if (
        !OWN &&
        location.hash.startsWith("#edit=") &&
        window.crypto &&
        crypto.subtle
      ) {
        crypto.subtle
          .digest(
            "SHA-256",
            new TextEncoder().encode(
              decodeURIComponent(location.hash.slice(6)),
            ),
          )
          .then((b) => {
            const x = [...new Uint8Array(b)]
              .map((v) => v.toString(16).padStart(2, "0"))
              .join("");
            if (
              x ===
              "b717c2c85e674314fdc4a1ee9e5ec1d63dbb3a457d00487c873db291462ed24b"
            ) {
              try {
                localStorage.setItem("hu-owner", "1");
              } catch (e) {}
            }
            location.replace(location.pathname + location.search);
          });
      }
      const VIEW =
        location.search.includes("view") ||
        (/\.github\.io$/.test(location.hostname) && !OWN);
      if (VIEW) document.documentElement.classList.add("view");
      const KEY = "hu-hub-v1",
        $ = (s) => document.querySelector(s),
        T = { char: "Персонаж", org: "Организация", story: "История" };
      const uid = () => Math.random().toString(36).slice(2, 9);
      const esc = (s) =>
        String(s == null ? "" : s).replace(
          /[&<>"]/g,
          (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
        );
      const ini = (s) =>
        (s || "?")
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase();
      let S,
        cur = null,
        view = { x: 0, y: 0, k: 1 },
        saveT;
      const byId = (id) => S.nodes.find((n) => n.id === id);

      function seed() {
        const N = (id, type, name, sub, short, long = "", quote = "") => ({
          id,
          type,
          name,
          sub,
          short,
          long,
          quote,
          img: "",
          x: Math.cos(id.length * 7 + name.length) * 300 + Math.random() * 200,
          y: Math.sin(name.length * 3) * 300 + Math.random() * 200,
        });
        const nodes = [
          N(
            "niko",
            "char",
            "Niko Weisez",
            "Vol. 1",
            "Бывший хирург-травматолог, ставший спецоператором. Хранит карты close to chest.",
            "Former trauma surgeon, turned special operator, haunted by a ghost he once saved. Hunted by the shadows of San Fierro.",
            "neither here nor there",
          ),
          N(
            "ezik",
            "char",
            "Ezikiel Yang Stewart",
            "Vol. 2",
            "Федеральный оперативник со спокойствием, которое не доходит до рук.",
            "Joined the Office because the benefits were good — but stayed because he discovered he was good at the work.",
            "I wasn’t sent to help. I was sent to clean up.",
          ),
          N(
            "lis",
            "char",
            "Елисей Антропов",
            "Лис · Грех · Фокс",
            "Статус неизвестен. Есть непроверенная информация.",
            "",
            "В России говорят, что вор должен сидеть в тюрьме. В Америке — что вор должен платить. Я и там, и там не вписался.",
          ),
          N(
            "nath",
            "char",
            "Nathaniel Johannsson",
            "FSK Jaegers",
            "Последний из троих на обложке Vol. 5.",
            "",
            "",
          ),
          N(
            "gold",
            "char",
            "Agent Gold",
            "Kontrol Group PMC",
            "Улыбается так, будто всё уже решено.",
            "",
            "",
          ),
          N(
            "escal",
            "char",
            "Escal Delacroix",
            "The Art of Lie",
            "Герой Vol. 6.",
            "",
            "Some lies save lives. Others end them.",
          ),
          N(
            "sey",
            "char",
            "Seymour Abernathy",
            "The Art of Lie",
            "Герой Vol. 6, постарше и пострашнее.",
            "",
            "",
          ),
          N(
            "fsk",
            "org",
            "FSK Jaegers",
            "Спецподразделение",
            "Разведывательно-диверсионная группа. Hazlim Nazari и Dar Koval вычеркнуты.",
            "",
            "",
          ),
          N(
            "kg",
            "org",
            "Kontrol Group",
            "PMC",
            "Частная военная компания.",
            "",
            "",
          ),
          N(
            "office",
            "org",
            "The Office",
            "Федеральная служба",
            "Организация, куда пришёл Ezikiel.",
            "",
            "",
          ),
          N(
            "v1",
            "story",
            "Vol. 1 · Horizon",
            "Season 1",
            "История Niko Weisez.",
            "",
            "",
          ),
          N(
            "v2",
            "story",
            "Vol. 2 · Horizon",
            "Season 1",
            "История Ezikiel Yang Stewart.",
            "",
            "",
          ),
          N(
            "v3",
            "story",
            "Vol. 3 · Неверный",
            "Season 1",
            "История Елисея Антропова.",
            "",
            "",
          ),
          N(
            "v5",
            "story",
            "Vol. 5 · Neither Here Nor There",
            "Season 1",
            "FSK Jaegers.",
            "",
            "",
          ),
          N(
            "v6",
            "story",
            "Vol. 6 · The Art of Lie",
            "Season 1",
            "Escal Delacroix и Seymour Abernathy.",
            "",
            "",
          ),
          N(
            "v7",
            "story",
            "Vol. 7 · De-classified",
            "Season 1",
            "Agent Gold, Kontrol Group PMC.",
            "",
            "",
          ),
        ];
        const L = (a, b, label) => ({ id: uid(), a, b, label });
        return {
          nodes,
          links: [
            L("niko", "v1", "главный герой"),
            L("ezik", "v2", "главный герой"),
            L("lis", "v3", "главный герой"),
            L("nath", "v5", "главный герой"),
            L("fsk", "v5", "отряд"),
            L("nath", "fsk", "служит"),
            L("escal", "v6", "герой"),
            L("sey", "v6", "герой"),
            L("escal", "sey", "противостояние"),
            L("gold", "v7", "герой"),
            L("gold", "kg", "работает на"),
            L("kg", "v7", "тема"),
            L("ezik", "office", "агент"),
            L("office", "v2", "тема"),
          ],
        };
      }
      function load() {
        if (VIEW) {
          S = { nodes: [], links: [], home: { blocks: [] }, events: [] };
          return false;
        }
        try {
          const r = localStorage.getItem(KEY);
          if (r) {
            S = JSON.parse(r);
            return false;
          }
        } catch (e) {}
        S = seed();
        return true;
      }
      function save() {
        if (VIEW) return;
        clearTimeout(saveT);
        saveT = setTimeout(() => {
          try {
            localStorage.setItem(KEY, JSON.stringify(S));
          } catch (e) {}
        }, 250);
      }

      function render() {
        $("#nodes").innerHTML = S.nodes
          .map(
            (n, i) =>
              `<div class="node ${n.type}" data-id="${n.id}" style="animation-delay:${i * 45}ms" data-new="${SEEN.has(n.id) ? 0 : 1}"><div class="ph">${n.img ? `<img src="${n.img}" alt="">` : `<span>${esc(ini(n.name))}</span>`}</div><div class="tx"><b>${esc(n.name)}</b><i>${esc(n.sub)}</i><p>${esc(n.short)}</p></div>${stp(n)}</div>`,
          )
          .join("");
        pos();
      }
      function pos() {
        document.querySelectorAll(".node").forEach((e) => {
          const n = byId(e.dataset.id);
          if (n) {
            e.style.left = n.x + "px";
            e.style.top = n.y + "px";
          }
        });
        drawLinks();
      }
      function drawLinks() {
        const m = new Map(S.nodes.map((n) => [n.id, n]));
        let h = "";
        S.links.forEach((l) => {
          const a = m.get(l.a),
            b = m.get(l.b);
          if (!a || !b) return;
          const dx = b.x - a.x,
            dy = b.y - a.y,
            cx = (a.x + b.x) / 2 - dy * 0.12,
            cy = (a.y + b.y) / 2 + dx * 0.12,
            mx = (a.x + b.x) / 4 + cx / 2,
            my = (a.y + b.y) / 4 + cy / 2;
          h += `<g class="lnk${lf(l, a, b)}" style="${lk(l)}" data-a="${l.a}" data-b="${l.b}"><path d="M${a.x} ${a.y}Q${cx} ${cy} ${b.x} ${b.y}"/>${l.label ? `<text x="${mx}" y="${my}">${esc(l.label)}</text>` : ""}</g>`;
        });
        $("#lk").innerHTML = h;
      }
      function focusNode(id) {
        const w = $("#world");
        w.classList.toggle("focus", !!id);
        const rel = new Set([id]);
        S.links.forEach((l) => {
          if (l.a === id) rel.add(l.b);
          if (l.b === id) rel.add(l.a);
        });
        document
          .querySelectorAll(".node")
          .forEach((e) =>
            e.classList.toggle("on", !!id && rel.has(e.dataset.id)),
          );
        document
          .querySelectorAll(".lnk")
          .forEach((e) =>
            e.classList.toggle(
              "on",
              !!id && (e.dataset.a === id || e.dataset.b === id),
            ),
          );
      }
      $("#nodes").addEventListener("pointerover", (e) => {
        const n = e.target.closest(".node");
        if (n && !drag) focusNode(n.dataset.id);
      });
      $("#nodes").addEventListener("pointerout", (e) => {
        if (!drag && e.target.closest(".node")) focusNode(null);
      });

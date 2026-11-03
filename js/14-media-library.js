      /* ===== v8: media library (GitHub img/ folder) ===== */
      const TRm = {
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ё: "e",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "h",
        ц: "c",
        ч: "ch",
        ш: "sh",
        щ: "sch",
        ы: "y",
        э: "e",
        ю: "yu",
        я: "ya",
      };
      const slug = (t) =>
        String(t || "")
          .toLowerCase()
          .replace(/[а-яё]/g, (c) => TRm[c] || "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40) || "img";
      const GH = Object.assign(
        {
          repo: (() => {
            const m = location.hostname.match(/^([^.]+)\.github\.io$/),
              p = location.pathname.split("/")[1];
            return m && p ? m[1] + "/" + p : "weisez/Horizon-Unknown";
          })(),
          branch: "main",
          dir: "img",
          token: "",
        },
        (() => {
          try {
            return JSON.parse(localStorage.getItem("hu-gh") || "{}");
          } catch (e) {
            return {};
          }
        })(),
      );
      const ghSave = () => {
        try {
          localStorage.setItem(
            "hu-gh",
            JSON.stringify({
              repo: GH.repo,
              branch: GH.branch,
              token: GH.token,
            }),
          );
        } catch (e) {}
      };
      const ghH = () => ({
        Accept: "application/vnd.github+json",
        ...(GH.token ? { Authorization: "Bearer " + GH.token } : {}),
      });
      document.addEventListener(
        "error",
        (e) => {
          const i = e.target;
          if (i && i.tagName === "IMG") {
            const u = i.getAttribute("src") || "";
            if (/^img\//.test(u) && !i.dataset.rf) {
              i.dataset.rf = 1;
              i.src = `https://raw.githubusercontent.com/${GH.repo}/${GH.branch}/${u}`;
            }
          }
        },
        true,
      );
      const b64Of = (b) =>
        new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result.split(",")[1]);
          r.onerror = rej;
          r.readAsDataURL(b);
        });
      const dataOf = (b) =>
        new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(b);
        });
      async function imgPrep(f, max, q) {
        const base = slug(f.name.replace(/\.[^.]+$/, "")),
          id = Math.random().toString(36).slice(2, 6);
        if (/gif|svg/.test(f.type))
          return {
            blob: f,
            name: `${base}-${id}.${f.type.includes("gif") ? "gif" : "svg"}`,
          };
        const u = URL.createObjectURL(f),
          im = await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = () => rej(new Error("не удалось прочитать картинку"));
            i.src = u;
          });
        const k = Math.min(1, max / Math.max(im.width, im.height)),
          c = document.createElement("canvas");
        c.width = Math.round(im.width * k);
        c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        let b = await new Promise((r) => c.toBlob(r, "image/webp", q)),
          ext = "webp";
        if (!b || b.type !== "image/webp") {
          b = await new Promise((r) => c.toBlob(r, "image/jpeg", q));
          ext = "jpg";
        }
        return { blob: b, name: `${base}-${id}.${ext}` };
      }
      const ML = { items: [], fresh: [], pick: null };
      async function ghUpload(o) {
        const path = GH.dir + "/" + o.name,
          r = await fetch(
            `https://api.github.com/repos/${GH.repo}/contents/${path}`,
            {
              method: "PUT",
              headers: ghH(),
              body: JSON.stringify({
                message: "Add " + path,
                content: await b64Of(o.blob),
                branch: GH.branch,
              }),
            },
          );
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(
            r.status === 401
              ? "токен недействителен"
              : r.status === 404
                ? "репозиторий или ветка не найдены, либо у токена нет прав на запись"
                : j.message || r.status,
          );
        }
        const j = await r.json();
        ML.fresh.unshift({ name: o.name, url: j.content.download_url });
        return path;
      }
      let embedWarned = 0;
      async function imgIn(f, max, cb, q) {
        try {
          const o = await imgPrep(f, max, q || 0.85);
          if (GH.token) {
            toast("Загружаю " + o.name + "…");
            const p = await ghUpload(o);
            cb(p);
            toast(
              "Готово: " + p + " · на сайте появится примерно через минуту",
            );
          } else {
            cb(await dataOf(o.blob));
            if (!embedWarned) {
              embedWarned = 1;
              toast(
                "Картинка встроена в данные. Чтобы хранить файлы в репозитории, подключите медиатеку: Медиа → ⚙",
              );
            }
          }
        } catch (e) {
          toast("Не удалось загрузить: " + e.message);
        }
      }
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="ml"><div class="ml-box"><div class="ml-h"><strong>Медиатека</strong><small id="ml-sub"></small><span class="sp"></span><label class="ml-up">+ Загрузить<input type="file" id="ml-f" accept="image/*" multiple></label><button data-ml="cfg" title="Подключение к GitHub">⚙</button><button data-ml="x" title="Закрыть (Esc)">✕</button></div><div class="ml-b" id="mlb"></div><div class="ml-f" id="mlf"></div></div></div>`,
      );
      $("#b-theme").insertAdjacentHTML(
        "beforebegin",
        '<button id="b-media">Медиа</button>',
      );
      const MB = $("#mlb");
      function mlOpen(pick) {
        ML.pick = pick || null;
        $("#ml").classList.add("open");
        $("#ml-sub").textContent = pick
          ? "выберите картинку"
          : GH.repo + "/" + GH.dir;
        mlLoad();
      }
      const mlClose = () => {
        $("#ml").classList.remove("open");
        ML.pick = null;
      };
      async function mlLoad() {
        MB.innerHTML = '<p class="ml-m">Загружаю список…</p>';
        mlFoot();
        try {
          const r = await fetch(
            `https://api.github.com/repos/${GH.repo}/contents/${GH.dir}?ref=${GH.branch}`,
            { headers: ghH() },
          );
          if (r.status === 404) ML.items = [];
          else if (!r.ok)
            throw new Error(
              r.status === 403
                ? "лимит запросов GitHub — подождите несколько минут или добавьте токен (⚙)"
                : "ошибка " + r.status,
            );
          else
            ML.items = (await r.json())
              .filter(
                (x) =>
                  x.type === "file" &&
                  /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(x.name),
              )
              .map((x) => ({ name: x.name, url: x.download_url }));
          mlGrid();
        } catch (e) {
          MB.innerHTML = `<p class="ml-m">Не удалось получить список: ${esc(e.message)}</p>`;
        }
      }
      function mlGrid() {
        const seen = new Set(),
          L = [...ML.fresh, ...ML.items].filter(
            (x) => !seen.has(x.name) && seen.add(x.name),
          );
        MB.innerHTML = L.length
          ? `<div class="ml-g">${L.map((x, i) => `<button class="ml-i" data-mp="${GH.dir}/${esc(x.name)}" title="${esc(x.name)}" style="animation-delay:${Math.min(i, 20) * 25}ms"><img loading="lazy" src="${esc(x.url)}" alt=""><span>${esc(x.name)}</span></button>`).join("")}</div>`
          : `<p class="ml-m"><b>В папке ${GH.dir}/ пока пусто.</b><br>Перетащите сюда файлы или нажмите «+ Загрузить».${GH.token ? "" : "<br>Для загрузки нужен токен GitHub (⚙). Либо закиньте файлы в папку <b>img/</b> на github.com вручную."}</p>`;
        mlFoot(L.length);
      }
      function mlFoot(n) {
        const u = embedMap().size;
        $("#mlf").innerHTML =
          `<span>${n == null ? "" : n + " файлов · "}${GH.token ? "токен подключён" : "токен не задан"}</span><span class="sp"></span>${u ? `<button data-ml="mig" ${GH.token ? "" : "disabled"} title="${GH.token ? "" : "Нужен токен"}">Вынести встроенные картинки (${u})</button>` : "<span>Встроенных картинок нет ✓</span>"}`;
      }
      function mlCfg() {
        MB.innerHTML = `<div class="ml-cfg"><h4>Подключение к GitHub</h4><label>Репозиторий<input id="mc-r" value="${esc(GH.repo)}"></label><label>Ветка<input id="mc-b" value="${esc(GH.branch)}"></label><label>Токен (Contents: Read and write)<input id="mc-t" type="password" placeholder="github_pat_…" value="${esc(GH.token)}"></label><div class="act"><button class="pri" data-mcfg>Сохранить</button><button data-mcfg="clear">Забыть токен</button><button data-ml="back">Назад</button></div><ol><li>Откройте github.com → Settings → Developer settings → Fine-grained tokens → Generate new token.</li><li>Repository access: Only select repositories → Horizon-Unknown.</li><li>Permissions → Repository permissions → <b>Contents: Read and write</b>.</li><li>Скопируйте токен и вставьте выше. Он хранится только в этом браузере.</li></ol></div>`;
      }
      const URI_RE =
        /data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+/g;
      function embedWalk(o, fn, ctx) {
        if (Array.isArray(o)) {
          o.forEach((x, i) => {
            if (typeof x === "string") {
              if (x.includes("data:image/")) o[i] = fn(x, ctx);
            } else embedWalk(x, fn, ctx);
          });
          return;
        }
        if (o && typeof o === "object") {
          const c = typeof o.name === "string" ? o.name : ctx;
          for (const k in o) {
            const v = o[k];
            if (typeof v === "string") {
              if (v.includes("data:image/")) o[k] = fn(v, c);
            } else embedWalk(v, fn, c);
          }
        }
      }
      function embedMap() {
        const u = new Map();
        embedWalk(
          S,
          (v, c) =>
            v.replace(URI_RE, (m) => {
              if (!u.has(m)) u.set(m, c);
              return m;
            }),
          "",
        );
        return u;
      }
      async function mlMigrate() {
        const u = embedMap();
        if (!u.size || !GH.token) return;
        if (
          !confirm(
            "Загрузить " +
              u.size +
              " картинок в репозиторий и заменить ими встроенные в данные?\nНа всякий случай сначала сохраните копию через «Данные».\nСайт покажет файлы примерно через минуту после загрузки.",
          )
        )
          return;
        const dict = new Map();
        let i = 0;
        try {
          for (const [uri, ctx] of u) {
            i++;
            $("#mlf").innerHTML = `<span>Загружаю ${i} из ${u.size}…</span>`;
            const blob = await (await fetch(uri)).blob(),
              ext =
                {
                  "image/jpeg": "jpg",
                  "image/png": "png",
                  "image/webp": "webp",
                  "image/gif": "gif",
                }[blob.type] || "jpg";
            dict.set(
              uri,
              await ghUpload({
                blob,
                name: `${slug(ctx)}-${Math.random().toString(36).slice(2, 6)}.${ext}`,
              }),
            );
          }
          embedWalk(S, (v) => v.replace(URI_RE, (m) => dict.get(m) || m), "");
          save();
          render();
          renderList();
          toast(
            "Готово: вынесено картинок — " +
              dict.size +
              ". Не забудьте обновить data.json на GitHub.",
          );
        } catch (e) {
          embedWalk(S, (v) => v.replace(URI_RE, (m) => dict.get(m) || m), "");
          save();
          toast(
            "Остановилось на ошибке: " +
              e.message +
              ". Уже загруженные заменены, остальные остались встроенными.",
          );
        }
        mlLoad();
      }
      $("#ml").addEventListener("click", (e) => {
        if (e.target.id === "ml") {
          mlClose();
          return;
        }
        const b = e.target.closest("button");
        if (!b) return;
        const d = b.dataset;
        if (d.ml === "x") mlClose();
        else if (d.ml === "cfg") mlCfg();
        else if (d.ml === "back") mlLoad();
        else if (d.ml === "mig") mlMigrate();
        else if (d.mp) {
          if (ML.pick) {
            const f = ML.pick;
            mlClose();
            f(d.mp);
          } else {
            try {
              navigator.clipboard.writeText(d.mp);
            } catch (x) {}
            toast("Путь скопирован: " + d.mp);
          }
        } else if ("mcfg" in d) {
          if (d.mcfg === "clear") GH.token = "";
          else {
            GH.repo = $("#mc-r").value.trim() || GH.repo;
            GH.branch = $("#mc-b").value.trim() || "main";
            GH.token = $("#mc-t").value.trim();
          }
          ghSave();
          toast(GH.token ? "Сохранено" : "Токен удалён");
          mlLoad();
        }
      });
      async function mlFiles(fs) {
        if (!GH.token) {
          toast("Для загрузки нужен токен GitHub — откройте ⚙");
          mlCfg();
          return;
        }
        for (const f of fs) {
          if (!/^image\//.test(f.type)) continue;
          try {
            const o = await imgPrep(f, 1600, 0.85);
            toast("Загружаю " + o.name + "…");
            await ghUpload(o);
            mlGrid();
          } catch (e) {
            toast("Не удалось загрузить: " + e.message);
            break;
          }
        }
        toast("Загрузка завершена");
      }
      $("#ml-f").addEventListener("change", (e) => {
        mlFiles([...e.target.files]);
        e.target.value = "";
      });
      MB.addEventListener("dragover", (e) => {
        e.preventDefault();
        MB.classList.add("drag");
      });
      MB.addEventListener("dragleave", () => MB.classList.remove("drag"));
      MB.addEventListener("drop", (e) => {
        e.preventDefault();
        MB.classList.remove("drag");
        mlFiles([...e.dataTransfer.files]);
      });
      $("#b-media").onclick = () => mlOpen(null);
      addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape" && $("#ml").classList.contains("open")) {
            e.stopPropagation();
            mlClose();
          }
        },
        true,
      );
      /* card / home-block image fields */
      $("#panel").addEventListener(
        "change",
        (e) => {
          const t = e.target,
            f = t.files && t.files[0];
          if (!f) return;
          const id = cur,
            bb = curB;
          if (t.id === "file") {
            e.stopPropagation();
            imgIn(
              f,
              520,
              (p) => {
                byId(id).img = p;
                save();
                edit(id);
              },
              0.82,
            );
          } else if (t.id === "file2") {
            e.stopPropagation();
            imgIn(
              f,
              1200,
              (p) => {
                byId(id).banner = p;
                save();
                edit(id);
              },
              0.78,
            );
          } else if (t.id === "hfile") {
            e.stopPropagation();
            const lb = t.previousSibling;
            imgIn(
              f,
              1200,
              (p) => {
                gb(bb).img = p;
                save();
                if (
                  (lb && lb.nodeType === 3) ||
                  (lb && lb.textContent !== undefined)
                )
                  lb.textContent = "Картинка ✓";
              },
              0.8,
            );
          }
        },
        true,
      );
      const STX = (v) =>
        !v
          ? "нет"
          : v.startsWith("data:")
            ? "встроена в код · ≈" + Math.round(v.length / 1365) + " КБ"
            : "файл " + v;
      function mlInject() {
        const P = $("#panel");
        [
          ["file", "img", "Портрет"],
          ["file2", "banner", "Баннер"],
          ["hfile", "hb", ""],
        ].forEach(([id, k, l]) => {
          const i = P.querySelector("#" + id);
          if (!i || P.querySelector(`[data-mlp="${k}"]`)) return;
          const a = i.closest("label") || i,
            n = byId(cur);
          a.insertAdjacentHTML(
            "afterend",
            `<button type="button" class="ml-pick" data-mlp="${k}">📁 Из библиотеки</button>${k !== "hb" ? `<small class="ml-st">${l}: ${STX(n && n[k])}</small>` : ""}`,
          );
        });
      }
      new MutationObserver(mlInject).observe($("#panel"), {
        childList: true,
        subtree: true,
      });
      document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-mlp]");
        if (!b) return;
        const k = b.dataset.mlp,
          id = cur,
          bb = curB;
        mlOpen((p) => {
          if (k === "hb") {
            gb(bb).img = p;
            save();
            toast("Картинка выбрана");
          } else {
            byId(id)[k] = p;
            save();
            edit(id);
          }
        });
      });

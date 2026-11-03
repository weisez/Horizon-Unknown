/* ===== publish: commit data.json to GitHub straight from the editor ===== */
const PUB = { sha: "", hash: "", remote: null, txt: "", busy: 0, t: 0 };
const pbH = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + "." + s.length;
};
const pbNorm = (o) => JSON.stringify(o);
function pbErr(r, j) {
  return new Error(
    r.status === 401 ? "токен недействителен или истёк"
    : r.status === 403 ? "нет прав у токена или лимит запросов GitHub"
    : r.status === 404 ? "data.json или репозиторий не найдены (проверьте ветку и права токена)"
    : r.status === 409 || r.status === 422 ? "данные на GitHub изменились — откройте окно публикации заново"
    : (j && j.message) || "ошибка " + r.status,
  );
}
const pbUrl = (ref) => `https://api.github.com/repos/${GH.repo}/contents/data.json?ref=${ref || GH.branch}`;
async function pbMeta(ref) {
  const r = await fetch(pbUrl(ref), { headers: ghH() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw pbErr(r, j);
  return j;
}
async function pbRaw(ref) {
  const r = await fetch(pbUrl(ref), { headers: { ...ghH(), Accept: "application/vnd.github.raw+json" } });
  if (!r.ok) throw pbErr(r);
  return r.text();
}
async function pbSync() {
  const m = await pbMeta(), t = await pbRaw();
  PUB.sha = m.sha; PUB.txt = t; PUB.remote = JSON.parse(t); PUB.hash = pbH(pbNorm(PUB.remote));
  pbInd();
}
const pbDirty = () => !!PUB.hash && pbH(pbNorm(S)) !== PUB.hash;
function pbInd() {
  const b = $("#b-pub");
  if (b) b.classList.toggle("dirty", pbDirty());
}
const _sv10 = save;
save = function () {
  _sv10();
  clearTimeout(PUB.t);
  PUB.t = setTimeout(pbInd, 600);
};
/* what would change */
function pbDiff(a, b) {
  const rows = [];
  let lost = 0;
  const kinds = [
    ["nodes", "Карточки", (x) => x.name],
    ["links", "Связи", (x) => (byId(x.a) || {}).name + " → " + (byId(x.b) || {}).name],
    ["events", "События", (x) => x.title],
  ];
  kinds.forEach(([k, label, nm]) => {
    const A = new Map((a[k] || []).map((x) => [x.id, x])), B = new Map((b[k] || []).map((x) => [x.id, x]));
    const add = [], del = [], chg = [];
    B.forEach((v, id) => { if (!A.has(id)) add.push(v); else if (pbNorm(A.get(id)) !== pbNorm(v)) chg.push(v); });
    A.forEach((v, id) => { if (!B.has(id)) del.push(v); });
    const names = (l) => l.slice(0, 5).map((x) => esc(nm(x) || "—")).join(", ") + (l.length > 5 ? " …" : "");
    if (add.length) rows.push({ c: "var(--c-org)", t: label + ": добавлено " + add.length, s: names(add) });
    if (chg.length) rows.push({ c: "var(--c-story)", t: label + ": изменено " + chg.length, s: names(chg) });
    if (del.length) { lost += del.length; rows.push({ c: "var(--c-char)", t: label + ": удалено " + del.length, s: names(del) }); }
  });
  const LBL = { home: "Главная страница", ord: "Порядок карточек", divs: "Разделители" };
  Object.keys({ ...a, ...b })
    .filter((k) => !["nodes", "links", "events"].includes(k) && pbNorm(a[k]) !== pbNorm(b[k]))
    .forEach((k) => rows.push({ c: "var(--c-story)", t: (LBL[k] || "Поле «" + k + "»") + ": изменено", s: "" }));
  return { rows, lost };
}
/* modal */
document.body.insertAdjacentHTML("beforeend",
  `<div id="pb"><div class="ml-box"><div class="ml-h"><strong>Публикация</strong><small id="pb-sub"></small><span class="sp"></span><button data-pb="hist" title="Предыдущие версии data.json">История</button><button data-pb="x" title="Закрыть (Esc)">✕</button></div><div class="ml-b" id="pbb"></div><div class="ml-f" id="pbf"></div></div></div>`);
$("#b-media").insertAdjacentHTML("beforebegin", `<button id="b-pub" class="pri" title="Отправить изменения на GitHub">Опубликовать</button>`);
const pbClose = () => $("#pb").classList.remove("open");
async function pbOpen() {
  $("#pb").classList.add("open");
  const B = $("#pbb");
  $("#pb-sub").textContent = GH.repo + " · " + GH.branch;
  $("#pbf").innerHTML = "";
  if (!GH.token) {
    B.innerHTML = `<p class="ml-m"><b>Нужен токен GitHub.</b><br>Тот же, что для медиатеки (право <b>Contents: Read and write</b>).<br><br><button class="pri" data-pb="cfg">Подключить</button></p>`;
    return;
  }
  B.innerHTML = '<p class="ml-m">Сравниваю с GitHub…</p>';
  try { await pbSync(); } catch (e) { B.innerHTML = `<p class="ml-m">Не удалось связаться с GitHub: ${esc(e.message)}</p>`; return; }
  const d = pbDiff(PUB.remote, S);
  if (!d.rows.length) { B.innerHTML = `<p class="ml-m"><b>Изменений нет</b> — сайт актуален ✓</p>`; return; }
  B.innerHTML = `<div class="pb-sum">${d.lost ? `<div class="pb-warn">⚠ На GitHub есть то, чего нет у вас (${d.lost}). Если вы редактировали с другого устройства, при публикации это пропадёт. Откройте «История», если нужно сверить.</div>` : ""}${d.rows.map((r) => `<div class="pb-r" style="--c:${r.c}"><b>${r.t}</b>${r.s ? `<small>${r.s}</small>` : ""}</div>`).join("")}<label>Описание изменений<input id="pb-m" value="Update data.json"></label><div class="act" style="margin:0"><button class="pri" data-pb="go">Опубликовать</button></div></div>`;
}
async function pbGo() {
  if (PUB.busy) return;
  PUB.busy = 1;
  const btn = $('[data-pb="go"]');
  btn.disabled = true; btn.textContent = "Публикую…";
  try {
    const m = /^\{\r?\n(\t| +)"/.exec(PUB.txt), ind = m ? m[1] : undefined;
    const text = JSON.stringify(S, null, ind) + (/\n$/.test(PUB.txt) ? "\n" : "");
    const r = await fetch(`https://api.github.com/repos/${GH.repo}/contents/data.json`, {
      method: "PUT", headers: ghH(),
      body: JSON.stringify({ message: ($("#pb-m").value || "").trim() || "Update data.json", content: await b64Of(new Blob([text], { type: "application/json" })), sha: PUB.sha, branch: GH.branch }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw pbErr(r, j);
    PUB.sha = j.content.sha; PUB.txt = text; PUB.remote = JSON.parse(text); PUB.hash = pbH(pbNorm(PUB.remote)); pbInd();
    const url = j.commit && j.commit.html_url;
    $("#pbb").innerHTML = `<p class="ml-m"><b>Опубликовано ✓</b><br>GitHub Pages обновит сайт примерно через минуту.${url ? `<br><a href="${esc(url)}" target="_blank" rel="noopener">Посмотреть коммит</a>` : ""}</p>`;
  } catch (e) {
    toast("Не удалось опубликовать: " + e.message);
    btn.disabled = false; btn.textContent = "Опубликовать";
  } finally { PUB.busy = 0; }
}
async function pbHist() {
  const B = $("#pbb");
  B.innerHTML = '<p class="ml-m">Загружаю историю…</p>';
  try {
    const r = await fetch(`https://api.github.com/repos/${GH.repo}/commits?path=data.json&sha=${GH.branch}&per_page=10`, { headers: ghH() });
    if (!r.ok) throw pbErr(r);
    const L = await r.json();
    B.innerHTML = `<div class="pb-sum"><small style="color:var(--mute)">Версию можно загрузить в редактор. На сайте она появится, только если вы потом нажмёте «Опубликовать».</small>${L.map((c) => `<div class="pb-r" style="--c:var(--c-org)"><b>${esc(new Date(c.commit.author.date).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }))}</b><small>${esc((c.commit.message || "").split("\n")[0])}</small><button data-pb="rev" data-sha="${c.sha}" style="margin-left:auto">Загрузить</button></div>`).join("")}<button data-pb="back">← Назад</button></div>`;
  } catch (e) { B.innerHTML = `<p class="ml-m">Не удалось получить историю: ${esc(e.message)}</p>`; }
}
async function pbRev(sha) {
  if (!confirm("Заменить ваши текущие данные в редакторе этой версией?\nСайт не изменится, пока вы не нажмёте «Опубликовать».\nСохраните копию через «Данные», если сомневаетесь.")) return;
  try {
    const obj = JSON.parse(await pbRaw(sha));
    localStorage.setItem(KEY, JSON.stringify(obj));
    location.reload();
  } catch (e) { toast("Не удалось загрузить версию: " + e.message); }
}
$("#b-pub").onclick = pbOpen;
$("#pb").addEventListener("click", (e) => {
  if (e.target.id === "pb") { pbClose(); return; }
  const b = e.target.closest("[data-pb]");
  if (!b) return;
  const a = b.dataset.pb;
  if (a === "x") pbClose();
  else if (a === "go") pbGo();
  else if (a === "hist") pbHist();
  else if (a === "back") pbOpen();
  else if (a === "rev") pbRev(b.dataset.sha);
  else if (a === "cfg") { pbClose(); mlOpen(null); mlCfg(); }
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#pb").classList.contains("open")) { e.stopPropagation(); pbClose(); }
}, true);
if (!VIEW && GH.token) pbSync().catch(() => {});

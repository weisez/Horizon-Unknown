      /* org structure: sizes follow text */
      function msz(M) {
        const q = document.createElement("div");
        q.style.cssText =
          "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none";
        const h = (w) =>
          M.map(
            (m) =>
              `<div class="sm" style="position:relative;${w}"><b>${esc(m.name)}</b><i>${esc(m.role)}</i></div>`,
          ).join("");
        q.innerHTML = h("width:max-content;max-width:300px;height:auto");
        document.body.appendChild(q);
        let W = 170,
          H = 60;
        q.childNodes.forEach((c) => {
          W = Math.max(W, Math.ceil(c.offsetWidth));
        });
        W = Math.min(W, 300);
        q.innerHTML = h(`width:${W}px;height:auto`);
        q.childNodes.forEach((c) => {
          H = Math.max(H, Math.ceil(c.offsetHeight) + 4);
        });
        q.remove();
        return [W, H];
      }
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
        const [W, H] = msz(M);
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
        const GX = 20,
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
        return `<div class='st st-${P}' data-w='${tw}' style='width:${tw}px;height:${th}px'><svg width='${tw}' height='${th}'>${L}</svg>${ms.map((m) => card(m, `left:${X(m)}px;top:${Y(m)}px;width:${W}px;height:${H}px`)).join("")}</div>`;
      }

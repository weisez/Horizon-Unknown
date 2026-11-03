      /* view */
      function applyView() {
        $("#world").style.transform =
          `translate(${view.x}px,${view.y}px) scale(${view.k})`;
        const st = $("#stage").style;
        st.backgroundPosition = `${view.x}px ${view.y}px`;
        st.backgroundSize = `${32 * view.k}px ${32 * view.k}px`;
        $("#bg").style.transform =
          `translate(${view.x * 0.02}px,${view.y * 0.02}px)`;
      }
      function fit() {
        if (!S.nodes.length) return;
        const xs = S.nodes.map((n) => n.x),
          ys = S.nodes.map((n) => n.y),
          W = innerWidth,
          H = innerHeight;
        const x0 = Math.min(...xs) - 150,
          x1 = Math.max(...xs) + 150,
          y0 = Math.min(...ys) - 200,
          y1 = Math.max(...ys) + 200;
        view.k = Math.min(W / (x1 - x0), H / (y1 - y0), 1.1);
        view.x = W / 2 - ((x0 + x1) / 2) * view.k;
        view.y = H / 2 - ((y0 + y1) / 2) * view.k;
        const w = $("#world");
        w.style.transition = "transform .6s cubic-bezier(.3,.8,.3,1)";
        applyView();
        setTimeout(() => (w.style.transition = ""), 650);
      }
      function zoomAt(f, cx, cy) {
        const k = Math.max(0.2, Math.min(2.5, view.k * f)),
          r = k / view.k;
        view.x = cx - (cx - view.x) * r;
        view.y = cy - (cy - view.y) * r;
        view.k = k;
        applyView();
      }
      $("#stage").addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          zoomAt(e.deltaY < 0 ? 1.1 : 0.91, e.clientX, e.clientY);
        },
        { passive: false },
      );
      $("#b-zi").onclick = () => zoomAt(1.25, innerWidth / 2, innerHeight / 2);
      $("#b-zo").onclick = () => zoomAt(0.8, innerWidth / 2, innerHeight / 2);
      $("#b-fit").onclick = fit;

      /* drag + click */
      let drag = null;
      const stage = $("#stage");
      function endDrag(commit) {
        if (!drag) return;
        const d = drag;
        drag = null;
        try {
          stage.releasePointerCapture(d.pid);
        } catch (x) {}
        document.body.classList.remove("dragging-node");
        if (d.el) d.el.classList.remove("dragging");
        if (d.n) {
          if (d.moved >= d.th) save();
          else if (commit) show(d.n.id, d.el);
        }
        if (!(d.el && d.el.matches(":hover"))) focusNode(null);
      }
      stage.addEventListener("dragstart", (e) => e.preventDefault());
      stage.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (drag) endDrag(false);
        const el = e.target.closest(".node"),
          n = el && byId(el.dataset.id);
        drag = {
          n,
          el,
          pid: e.pointerId,
          th: e.pointerType === "touch" ? 9 : 5,
          sx: e.clientX,
          sy: e.clientY,
          vx: view.x,
          vy: view.y,
          ox: n && n.x,
          oy: n && n.y,
          moved: 0,
          on: 0,
        };
        if (n) e.preventDefault();
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.pid) return;
        if (e.pointerType === "mouse" && e.buttons === 0) {
          endDrag(false);
          return;
        }
        const d = drag,
          dx = e.clientX - d.sx,
          dy = e.clientY - d.sy;
        d.moved = Math.max(d.moved, Math.hypot(dx, dy));
        if (d.n) {
          if (d.moved < d.th) return;
          if (!d.on) {
            d.on = 1;
            d.el.classList.add("dragging");
            document.body.classList.add("dragging-node");
          }
          d.n.x = d.ox + dx / view.k;
          d.n.y = d.oy + dy / view.k;
          d.el.style.left = d.n.x + "px";
          d.el.style.top = d.n.y + "px";
          drawLinks();
          focusNode(d.n.id);
        } else {
          view.x = d.vx + dx;
          view.y = d.vy + dy;
          applyView();
        }
      });
      stage.addEventListener("pointerup", (e) => {
        if (drag && e.pointerId === drag.pid) endDrag(true);
      });
      stage.addEventListener("pointercancel", () => endDrag(false));
      stage.addEventListener("lostpointercapture", () => endDrag(false));
      addEventListener("blur", () => endDrag(false));

      /* layout */
      function layout(anim) {
        const N = S.nodes,
          P = N.map((n) => ({ x: n.x, y: n.y })),
          idx = new Map(N.map((n, i) => [n.id, i]));
        for (let it = 0; it < 400; it++) {
          const F = N.map(() => [0, 0]);
          for (let i = 0; i < N.length; i++)
            for (let j = i + 1; j < N.length; j++) {
              let dx = P[i].x - P[j].x,
                dy = P[i].y - P[j].y,
                d2 = dx * dx + dy * dy + 0.01,
                d = Math.sqrt(d2),
                f = 140000 / d2;
              F[i][0] += (dx / d) * f;
              F[i][1] += (dy / d) * f;
              F[j][0] -= (dx / d) * f;
              F[j][1] -= (dy / d) * f;
            }
          S.links.forEach((l) => {
            const i = idx.get(l.a),
              j = idx.get(l.b);
            if (i == null || j == null) return;
            const dx = P[j].x - P[i].x,
              dy = P[j].y - P[i].y,
              d = Math.hypot(dx, dy) || 1,
              f = (d - 270) * 0.02;
            F[i][0] += (dx / d) * f;
            F[i][1] += (dy / d) * f;
            F[j][0] -= (dx / d) * f;
            F[j][1] -= (dy / d) * f;
          });
          N.forEach((n, i) => {
            P[i].x += (F[i][0] - P[i].x * 0.01) * 0.6;
            P[i].y += (F[i][1] - P[i].y * 0.01) * 0.6;
          });
        }
        if (!anim) {
          N.forEach((n, i) => {
            n.x = P[i].x;
            n.y = P[i].y;
          });
          return;
        }
        const from = N.map((n) => ({ x: n.x, y: n.y })),
          t0 = performance.now();
        (function step(t) {
          const p = Math.min(1, (t - t0) / 800),
            e = 1 - Math.pow(1 - p, 3);
          N.forEach((n, i) => {
            n.x = from[i].x + (P[i].x - from[i].x) * e;
            n.y = from[i].y + (P[i].y - from[i].y) * e;
          });
          pos();
          if (p < 1) requestAnimationFrame(step);
          else {
            save();
            fit();
          }
        })(t0);
      }
      $("#b-lay").onclick = () => layout(true);

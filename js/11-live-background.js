      /* living background */
      (function () {
        const H = document.querySelectorAll("#bg .hud");
        if (H.length < 2) return;
        const [L, R] = H,
          rnd = (n) => Math.floor(Math.random() * n),
          pick = (a) => a[rnd(a.length)],
          RM = matchMedia("(prefers-reduced-motion:reduce)").matches,
          pad = (v, n = 2) => String(v).padStart(n, "0");
        const mk = (el, n) => {
          el.innerHTML = Array.from({ length: n }, () => "<span></span>").join(
            "\n",
          );
          return [...el.children];
        };
        const l = mk(L, 4),
          r = mk(R, 4);
        const put = (el, t) => {
            el.textContent = t;
          },
          set = (el, t) => {
            if (el.textContent === t) return;
            if (RM) {
              put(el, t);
              return;
            }
            el.style.opacity = 0;
            setTimeout(() => {
              put(el, t);
              el.style.opacity = 1;
            }, 800);
          };
        const SN = () => (S && S.nodes ? S.nodes : []),
          SL = () => (S && S.links ? S.links : []),
          U = (x) =>
            String(x || "")
              .toUpperCase()
              .slice(0, 28);
        const anyN = () => {
          const a = SN();
          return a.length ? pick(a) : null;
        };
        const CTX = {
          char: [
            (n) => "TARGET: " + U(n.name),
            (n) =>
              "SUBJECT: " +
              U(n.name) +
              " // " +
              pick(["ACTIVE", "MIA", "UNVERIFIED", "UNDER WATCH"]),
            (n) =>
              "ALIAS CHECK: " +
              U(n.name) +
              " // " +
              pick(["MATCH", "NO MATCH", "PARTIAL"]),
            (n) =>
              "LAST SEEN: " +
              U(n.name) +
              " // " +
              pick(["UNKNOWN", "REDACTED", "NO DATA"]),
            (n) => "PERSONNEL FILE: " + U(n.name),
            (n) =>
              n.sub
                ? "ROLE: " + U(n.sub) + " // " + U(n.name)
                : "OPERATIVE: " + U(n.name),
            (n) =>
              "BIOMETRICS: " +
              U(n.name) +
              " // " +
              pick(["CAPTURED", "PENDING", "CORRUPTED"]),
            (n) =>
              "THREAT LEVEL: " +
              pick(["LOW", "MODERATE", "HIGH", "UNKNOWN"]) +
              " // " +
              U(n.name),
            (n) =>
              "COMMS INTERCEPT: " +
              U(n.name) +
              " // " +
              pick(["ENCRYPTED", "PARTIAL", "NONE"]),
            (n) =>
              "PAST OPS: " +
              U(n.name) +
              " // " +
              pick(["REDACTED", "3 OPEN", "SEALED"]),
            (n) =>
              "DEBRIEF: " +
              U(n.name) +
              " // " +
              pick(["OVERDUE", "PENDING", "FILED"]),
          ],
          org: [
            (n) => "AFFILIATION: " + U(n.name),
            (n) =>
              "ORG: " +
              U(n.name) +
              " // " +
              ((n.members || []).length
                ? n.members.length + " KNOWN MEMBERS"
                : "ROSTER UNKNOWN"),
            (n) =>
              "FUNDING: " +
              U(n.name) +
              " // " +
              pick(["TRACED", "UNKNOWN", "OFFSHORE"]),
            (n) =>
              "SURVEILLANCE: " +
              U(n.name) +
              " // " +
              pick(["ACTIVE", "PAUSED", "COMPROMISED"]),
            (n) => "CHAIN OF COMMAND: " + U(n.name),
            (n) =>
              "ASSETS: " +
              U(n.name) +
              " // " +
              pick(["FROZEN", "TRACKED", "UNKNOWN"]),
            (n) =>
              "HQ: " +
              U(n.name) +
              " // " +
              pick(["LOCATION UNKNOWN", "UNDER OBSERVATION", "RELOCATED"]),
            (n) =>
              "CONTACTS: " +
              U(n.name) +
              " // " +
              pick(["COMPROMISED", "VERIFIED", "STALE"]),
            (n) =>
              "RECRUITMENT: " +
              U(n.name) +
              " // " +
              pick(["ACTIVE", "SUSPENDED", "UNKNOWN"]),
          ],
          story: [
            (n) => "FILE: " + U(n.name),
            (n) =>
              "DOSSIER: " +
              U(n.name) +
              " // " +
              pick(["CLASSIFIED", "DE-CLASSIFIED", "PARTIAL"]),
            (n) =>
              "ARCHIVE: " +
              U(n.name) +
              " // " +
              pick(["INDEXED", "SEALED", "RESTORED"]),
            (n) =>
              "TRANSCRIPT: " +
              U(n.name) +
              " // " +
              pick(["PARTIAL", "ENCRYPTED", "INTACT"]),
            (n) => "VOLUME: " + U(n.name),
            (n) =>
              "CHAPTERS: " +
              U(n.name) +
              " // " +
              pick(["RECOVERED", "MISSING", "REDACTED"]),
            (n) =>
              "EVIDENCE: " +
              U(n.name) +
              " // " +
              pick(["LOGGED", "SEALED", "LOST"]),
            (n) =>
              "TIMELINE: " +
              U(n.name) +
              " // " +
              pick(["CONSISTENT", "CONFLICTING", "INCOMPLETE"]),
            (n) =>
              "WITNESSES: " +
              U(n.name) +
              " // " +
              pick(["0 FOUND", "2 FOUND", "UNRELIABLE"]),
          ],
        };
        const ST = {
          char: ["SUBJECT", "ACTIVE|MIA|KIA?|UNVERIFIED|UNKNOWN"],
          org: ["ORG", "MONITORED|INFILTRATED|DORMANT|UNKNOWN"],
          story: ["FILE", "ARCHIVED|CLASSIFIED|DE-CLASSIFIED|UNDER REVIEW"],
        };
        const ctx = (t) => {
          const a = SN().filter((n) => !t || n.type === t);
          if (!a.length)
            return pick(["NO RECORDS", "AWAITING DATA", "ARCHIVE EMPTY"]);
          const n = pick(a);
          return pick(CTX[n.type] || CTX.char)(n);
        };
        const status = () => {
          const n = anyN();
          if (!n) return "STATUS: UNKNOWN";
          const [k, v] = ST[n.type] || ST.char;
          return k + " STATUS: " + pick(v.split("|"));
        };
        const link = () => {
          const m = new Map(SN().map((n) => [n.id, n])),
            a = SL().filter((x) => m.get(x.a) && m.get(x.b));
          if (!a.length) return ctx();
          const x = pick(a),
            K = (typeof LK !== "undefined" && LK[x.kind]) || { n: "link" };
          return (
            "LINK: " +
            U(m.get(x.a).name) +
            " ⇄ " +
            U(m.get(x.b).name) +
            " // " +
            U(K.n)
          );
        };
        const top = () =>
          pick([
            "EYES ONLY // HU-S1",
            "CLEARANCE LV " + (1 + rnd(5)),
            "CANON HUB // " + SN().length + " FILES",
            "LINKS INDEXED: " + SL().length,
            "NEITHER HERE NOR THERE",
            "ACCESS LOG // " + pad(rnd(99)) + " ENTRIES",
            "SIGNAL RELAY // " + pick(["STABLE", "DEGRADED", "RECONNECTING"]),
            "SESSION " + pad(rnd(99)) + "-" + pad(rnd(99)),
            "NODES ONLINE: " + SN().length,
            "DECRYPTING… " + rnd(100) + "%",
            "ARCHIVE SYNC // OK",
            "WELCOME BACK, OPERATOR",
          ]);
        const orgs = () => {
          const o = SN()
            .filter((n) => n.type === "org")
            .map((x) => U(x.name));
          if (o.length < 2) return "KONTROL / FSK / OFFICE";
          const i = rnd(o.length);
          return o[i] + " / " + o[(i + 1) % o.length];
        };
        let g = [3318, 5502],
          sig = 3,
          t = 0;
        put(l[0], "EYES ONLY // HU-S1");
        put(l[1], "GRID 47Q " + g[0] + " " + g[1]);
        put(l[3], "██████ ████");
        put(r[0], "KONTROL / FSK / OFFICE");
        put(r[1], "STATUS: UNKNOWN");
        put(r[2], "AWAITING DATA");
        put(r[3], "SIG ▮▮▮▯▯▯");
        setInterval(() => {
          if (document.hidden) return;
          t++;
          if (t % 3 === 0) {
            g[0] += rnd(5) - 2;
            g[1] += rnd(5) - 2;
            put(l[1], `GRID 47Q ${g[0]} ${g[1]}`);
          }
          const d = new Date();
          put(
            l[2],
            `UTC ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
          );
          if (t % 9 === 4) set(l[0], top());
          if (t % 7 === 3)
            set(
              l[3],
              pick([
                () => "█".repeat(3 + rnd(7)) + " " + "█".repeat(2 + rnd(5)),
                link,
                () => "> " + ctx(),
              ])(),
            );
          if (t % 11 === 5) set(r[0], orgs());
          if (t % 8 === 6) set(r[1], status());
          if (t % 6 === 2) set(r[2], ctx());
          if (t % 3 === 0) {
            sig = Math.max(0, Math.min(6, sig + rnd(3) - 1));
            put(
              r[3],
              "SIG " +
                "▮".repeat(sig) +
                "▯".repeat(6 - sig) +
                " " +
                SN().length +
                "/" +
                SL().length,
            );
          }
        }, 1000);
        const rd = document.querySelector("#bg .radar");
        if (rd && !RM)
          for (let i = 0; i < 4; i++) {
            const b = document.createElement("i");
            b.className = "blip";
            $("#bg").appendChild(b);
            const mv = () => {
              const br = $("#bg").getBoundingClientRect(),
                rr = rd.getBoundingClientRect(),
                R0 = Math.min(innerWidth, innerHeight) * 0.28,
                a = Math.random() * 6.283,
                q = Math.sqrt(Math.random()) * R0;
              b.style.left =
                rr.left + rr.width / 2 - br.left + Math.cos(a) * q + "px";
              b.style.top =
                rr.top + rr.height / 2 - br.top + Math.sin(a) * q + "px";
            };
            b.style.animationDelay = i * 0.85 + "s";
            mv();
            b.addEventListener("animationiteration", mv);
          }
      })();

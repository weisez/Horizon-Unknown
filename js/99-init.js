      const HAD = (() => {
        try {
          return !!localStorage.getItem(KEY);
        } catch (e) {
          return false;
        }
      })();
      const pull = (fb) =>
        fetch("data.json", { cache: "no-cache" })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((j) => {
            if (!j.nodes) throw 0;
            S = j;
            S.links = S.links || [];
            S.home = S.home || seedHome();
            save();
            render();
            fit();
          })
          .catch(() => {
            if (fb) {
              S = seed();
              S.home = seedHome();
              layout(false);
              render();
              fit();
            }
          });
      if (VIEW) pull(true);
      else if (!HAD) pull(false);
      tab = "home";
      document.body.dataset.tab = "home";
      try {
        const t = localStorage.getItem(KEY + "-t");
        if (t) document.documentElement.dataset.theme = t;
      } catch (e) {}
      if (load()) layout(false);
      if (!S.home) S.home = seedHome();
      render();
      fit();
    

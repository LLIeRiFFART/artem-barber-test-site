/* ============================================================
   VANTA Barber Studio — main.js
   ------------------------------------------------------------
   Modules:
   01. Helpers
   02. Preloader
   03. Custom cursor
   04. Header / mobile nav
   05. Scroll reveal, counters, parallax
   06. Tilt & magnetic
   07. Hero mouse parallax
   08. Service hover preview
   09. Before / After compare
   10. Team tilt
   11. Price calculator
   12. Booking calendar
   13. Reviews slider
   14. FAQ accordion
   15. Modal (callback request)
   16. Misc (toast, to-top, blog filters, year)
   ============================================================ */

(function () {
  "use strict";

  // Motion-enhanced styles only activate after this file has parsed successfully.
  document.documentElement.classList.add("js-ready");

  /* ---------- 01. Helpers ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  function showToast(text) {
    let toast = $(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  /* ---------- 02. Preloader ---------- */
  function initPreloader() {
    const pre = $(".preloader");
    if (!pre) return;
    const letters = $$(".preloader__logo span", pre);
    letters.forEach((l, i) => (l.style.animationDelay = i * 0.06 + "s"));
    const done = () => {
      pre.classList.add("is-done");
      document.body.classList.add("is-loaded");
    };
    let visited = false;
    try {
      visited = sessionStorage.getItem("vanta-loaded") === "1";
      sessionStorage.setItem("vanta-loaded", "1");
    } catch (error) {
      // Privacy modes may block storage; the site must still initialise.
      visited = false;
    }
    if (visited) setTimeout(done, 300);
    else {
      window.addEventListener("load", () => setTimeout(done, 1200));
      setTimeout(done, 3200); // safety
    }
  }

  /* ---------- 03. Custom cursor ---------- */
  function initCursor() {
    if (isTouch) return;
    const dot = $(".cursor");
    const ring = $(".cursor-ring");
    if (!dot || !ring) return;
    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2,
      rx = mx,
      ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    (function loop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    const hoverSel = "a, button, label, .chip, .slot, .cal__day, input, select, textarea";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest("[data-cursor='view']")) {
        document.body.classList.add("cursor-view");
      } else if (e.target.closest(hoverSel)) {
        document.body.classList.add("cursor-hover");
      }
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-cursor='view']")) document.body.classList.remove("cursor-view");
      if (e.target.closest(hoverSel)) document.body.classList.remove("cursor-hover");
    });
  }

  /* ---------- 04. Header / mobile nav ---------- */
  function initHeader() {
    const header = $(".header");
    if (!header) return;

    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.remove("is-hidden");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const burger = $(".burger");
    const mobile = $(".mobile-nav");
    if (burger && mobile) {
      const toggle = (force) => {
        const open = typeof force === "boolean" ? force : !mobile.classList.contains("is-open");
        mobile.classList.toggle("is-open", open);
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("is-locked", open);
        $$(".mobile-nav__link", mobile).forEach((l, i) => (l.style.transitionDelay = open ? 0.25 + i * 0.06 + "s" : "0s"));
      };
      burger.addEventListener("click", () => toggle());
      $$("a", mobile).forEach((a) => a.addEventListener("click", () => toggle(false)));
    }

    // Active nav link by section (home page)
    const sections = $$("section[id]");
    const links = $$(".nav__link[href^='#']");
    if (sections.length && links.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
            }
          });
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      sections.forEach((s) => io.observe(s));
    }
  }

  /* ---------- 05. Scroll reveal, counters, parallax ---------- */
  function initReveal() {
    const items = $$(".reveal, .reveal-stagger, .split-lines");
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-inview");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* Timeline: red line grows with scroll and switches the dots on */
  function initTimeline() {
    const tl = document.querySelector(".timeline");
    if (!tl) return;
    const items = $$(".tl-item", tl);
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = tl.getBoundingClientRect();
      const trigger = window.innerHeight * 0.6;
      const h = clamp(trigger - rect.top, 0, rect.height);
      tl.style.setProperty("--tl-progress", h + "px");
      items.forEach((it) => {
        const dotY = it.offsetTop + 22;
        it.classList.toggle("is-inview", h >= dotY);
      });
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function initCounters() {
    const nums = $$("[data-count]");
    if (!nums.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          const target = parseFloat(el.dataset.count);
          const decimals = parseInt(el.dataset.decimals || "0", 10);
          const dur = 1800;
          const start = performance.now();
          const step = (now) => {
            const p = clamp((now - start) / dur, 0, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            const value = target * eased;
            el.textContent = decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("en-US");
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach((n) => io.observe(n));
  }

  function initParallax() {
    const els = $$("[data-parallax]");
    if (!els.length || prefersReduced) return;
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const speed = parseFloat(el.dataset.parallax) || 0.2;
        const center = rect.top + rect.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0) scale(${el.dataset.parallaxScale || 1.15})`;
      });
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- 06. Tilt & magnetic ---------- */
  function initTilt() {
    if (isTouch) return;
    $$("[data-tilt]").forEach((card) => {
      const strength = parseFloat(card.dataset.tilt) || 8;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg) translateZ(0)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 0.8s cubic-bezier(0.22,1,0.36,1)";
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
        setTimeout(() => (card.style.transition = ""), 800);
      });
    });
  }

  function initMagnetic() {
    if (isTouch) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------- 07. Hero mouse parallax ---------- */
  function initHero() {
    const hero = $(".hero");
    if (!hero) return;
    const card = $(".hero__card", hero);
    const img = card && $("img", card);
    const glow = $(".hero__glow", hero);
    const badges = $$(".hero__badge", hero);

    // split words of title for stagger animation
    const title = $(".hero__title", hero);
    if (title && !title.dataset.split) {
      const accentFrom = Number.isFinite(parseInt(title.dataset.accentFrom, 10)) ? parseInt(title.dataset.accentFrom, 10) : Infinity;
      title.dataset.split = "1";
      const breakAfter = parseInt(title.dataset.breakAfter, 10);
      const html = title.textContent.trim().split(/\s+/).map((w, i) => {
        const word = `<span class="word${i >= accentFrom ? " accent" : ""}"><span style="animation-delay:${0.3 + i * 0.07}s">${w}</span></span>`;
        return i + 1 === breakAfter ? word + "<br>" : word;
      });
      title.innerHTML = html.join(" ");
    }

    if (isTouch || prefersReduced) return;

    let tx = 0, ty = 0, cx = 0, cy = 0;
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    });
    (function loop() {
      cx = lerp(cx, tx, 0.06);
      cy = lerp(cy, ty, 0.06);
      if (card) card.style.transform = `rotateY(${cx * 10}deg) rotateX(${-cy * 10}deg)`;
      if (img) img.style.transform = `scale(1.12) translate(${-cx * 24}px, ${-cy * 24}px)`;
      if (glow) glow.style.transform = `translate(${cx * 120}px, ${cy * 120}px)`;
      badges.forEach((b, i) => {
        const k = i === 0 ? 30 : -22;
        b.style.marginLeft = cx * k + "px";
        b.style.marginTop = cy * k + "px";
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 08. Service hover preview ---------- */
  function initServicePreview() {
    const list = $(".service-list");
    const preview = $(".service__preview");
    if (!list || !preview || isTouch) return;
    const imgs = $$("img", preview);
    let px = 0, py = 0, cx = 0, cy = 0, active = false;

    list.addEventListener("mousemove", (e) => {
      px = e.clientX;
      py = e.clientY;
    });
    $$(".service", list).forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const key = row.dataset.img;
        imgs.forEach((im) => im.classList.toggle("is-active", im.dataset.key === key));
        preview.classList.add("is-visible");
        active = true;
      });
      row.addEventListener("mouseleave", () => {
        preview.classList.remove("is-visible");
        active = false;
      });
    });
    window.addEventListener("scroll", () => {
      preview.classList.remove("is-visible");
      active = false;
    }, { passive: true });
    (function loop() {
      cx = lerp(cx, px, active ? 0.1 : 0.3);
      cy = lerp(cy, py, active ? 0.1 : 0.3);
      preview.style.left = cx + "px";
      preview.style.top = cy + "px";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 09. Before / After compare ---------- */
  function initCompare() {
    $$(".compare").forEach((box) => {
      let dragging = false;
      const set = (clientX) => {
        const r = box.getBoundingClientRect();
        const p = clamp(((clientX - r.left) / r.width) * 100, 2, 98);
        box.style.setProperty("--pos", p + "%");
      };
      const start = (e) => {
        dragging = true;
        set(e.touches ? e.touches[0].clientX : e.clientX);
      };
      const move = (e) => {
        if (!dragging && !e.touches) {
          if (!isTouch) set(e.clientX); // hover follows cursor on desktop
          return;
        }
        if (!dragging) return;
        set(e.touches ? e.touches[0].clientX : e.clientX);
      };
      const end = () => (dragging = false);
      box.addEventListener("mousedown", start);
      box.addEventListener("touchstart", start, { passive: true });
      box.addEventListener("mousemove", move);
      box.addEventListener("touchmove", move, { passive: true });
      window.addEventListener("mouseup", end);
      window.addEventListener("touchend", end);
      // idle animation until first interaction
      let t = 0, idle = true;
      box.addEventListener("mouseenter", () => (idle = false));
      box.addEventListener("touchstart", () => (idle = false), { passive: true });
      (function loop() {
        if (idle && !prefersReduced) {
          t += 0.012;
          box.style.setProperty("--pos", 50 + Math.sin(t) * 14 + "%");
          requestAnimationFrame(loop);
        }
      })();
    });
  }

  /* ---------- 10. Video on view ---------- */
  function initVideos() {
    const vids = $$("video[data-autoplay]");
    if (!vids.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const v = en.target;
          if (en.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.3 }
    );
    vids.forEach((v) => io.observe(v));
  }

  /* ---------- 11. Price calculator ---------- */
  const SERVICES = {
    haircut: { name: "Signature Haircut", price: 55, time: 45 },
    fade: { name: "Skin Fade", price: 65, time: 60 },
    scissors: { name: "Scissor Cut", price: 60, time: 50 },
    beard: { name: "Beard Sculpting", price: 35, time: 30 },
    shave: { name: "Hot Towel Shave", price: 50, time: 45 },
    kids: { name: "Kids Cut (under 12)", price: 35, time: 30 },
    head: { name: "Head Shave", price: 45, time: 35 },
    gray: { name: "Gray Blending", price: 40, time: 30 },
    wax: { name: "Nose / Ear Wax", price: 15, time: 10 },
    facial: { name: "Express Facial", price: 40, time: 25 }
  };

  const LEVELS = {
    barber: { name: "Barber", mult: 1, label: "" },
    senior: { name: "Senior Barber", mult: 1.25, label: "+25%" },
    master: { name: "Master Barber", mult: 1.6, label: "+60%" }
  };

  let calcState = { services: [], level: "barber", total: 0, time: 0 };

  function initCalculator() {
    const root = $("#calculator");
    if (!root) return;
    const totalEl = $("[data-calc-total]", root);
    const timeEl = $("[data-calc-time]", root);
    const countEl = $("[data-calc-count]", root);
    const linesEl = $("[data-calc-lines]", root);
    const inputs = $$("input[name='service']", root);
    const levels = $$("input[name='level']", root);
    const chipPrices = $$(".chip__price[data-base]", root);
    let shown = 0;

    const animateTotal = (to) => {
      const from = shown;
      const start = performance.now();
      const dur = 600;
      const step = (now) => {
        const p = clamp((now - start) / dur, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        const v = Math.round(lerp(from, to, e));
        totalEl.innerHTML = `<sup>$</sup>${v}`;
        if (p < 1) requestAnimationFrame(step);
        else shown = to;
      };
      requestAnimationFrame(step);
    };

    const update = () => {
      const level = (levels.find((l) => l.checked) || {}).value || "barber";
      const mult = LEVELS[level].mult;
      const selected = inputs.filter((i) => i.checked).map((i) => i.value);
      let total = 0, time = 0;
      linesEl.innerHTML = "";

      chipPrices.forEach((cp) => (cp.textContent = money(parseFloat(cp.dataset.base) * mult)));

      selected.forEach((key, idx) => {
        const s = SERVICES[key];
        const price = Math.round(s.price * mult);
        total += price;
        time += s.time;
        const li = document.createElement("li");
        li.style.animationDelay = idx * 0.05 + "s";
        li.innerHTML = `<span>${s.name}</span><b>${money(price)}</b>`;
        linesEl.appendChild(li);
      });

      // Combo discount: haircut/fade + beard = -10%
      const hasCut = selected.includes("haircut") || selected.includes("fade") || selected.includes("scissors");
      if (hasCut && selected.includes("beard")) {
        const d = Math.round(total * 0.1);
        total -= d;
        const li = document.createElement("li");
        li.className = "is-discount";
        li.innerHTML = `<span>Cut + Beard combo −10%</span><b>−${money(d)}</b>`;
        linesEl.appendChild(li);
      }
      if (!selected.length) {
        linesEl.innerHTML = `<li class="is-empty"><span>Pick at least one service to see the estimate</span></li>`;
      }

      total = Math.round(total);
      calcState = { services: selected, level, total, time };
      animateTotal(total);
      timeEl.textContent = time ? (time >= 60 ? Math.floor(time / 60) + "h " + (time % 60 ? (time % 60) + "m" : "") : time + " min") : "—";
      countEl.textContent = selected.length;
    };

    inputs.forEach((i) => i.addEventListener("change", update));
    levels.forEach((l) => l.addEventListener("change", update));
    update();

    const toBooking = $("[data-calc-book]", root);
    if (toBooking) {
      toBooking.addEventListener("click", () => {
        const bookingSel = $("#booking-service");
        if (!calcState.services.length) return showToast("Choose at least one service first");
        if (bookingSel) {
          const value = calcState.services.join("+");
          let option = $(`option[value='${value}']`, bookingSel);
          if (!option) {
            option = document.createElement("option");
            option.value = value;
            option.textContent = calcState.services.map((key) => SERVICES[key].name).join(" + ") + " — " + money(calcState.total);
            bookingSel.appendChild(option);
          }
          bookingSel.value = value;
          bookingSel.dispatchEvent(new Event("change"));
        }
        // sync barber level in booking
        const pick = $$(".barber-pick").find((b) => b.dataset.level === calcState.level);
        if (pick) pick.click();
        $("#booking") && $("#booking").scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  /* ---------- 12. Booking calendar ---------- */
  const BARBERS = [
    { id: "marcus", name: "Marcus Hale", level: "master", off: [0] },
    { id: "leo", name: "Leo Ferrante", level: "senior", off: [0, 1] },
    { id: "dante", name: "Dante Cole", level: "senior", off: [0] },
    { id: "ivan", name: "Ivan Petrov", level: "barber", off: [0, 3] }
  ];
  const HOURS = {
    0: null,
    1: [10 * 60, 20 * 60],
    2: [10 * 60, 20 * 60],
    3: [10 * 60, 20 * 60],
    4: [10 * 60, 21 * 60],
    5: [10 * 60, 21 * 60],
    6: [9 * 60, 20 * 60]
  };
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function serviceKeys(value) {
    return String(value || "haircut").split("+").filter((key) => SERVICES[key]);
  }

  function serviceDetails(value, level) {
    const keys = serviceKeys(value);
    const mult = LEVELS[level].mult;
    let price = keys.reduce((sum, key) => sum + Math.round(SERVICES[key].price * mult), 0);
    const time = keys.reduce((sum, key) => sum + SERVICES[key].time, 0);
    const hasCut = keys.some((key) => ["haircut", "fade", "scissors"].includes(key));
    if (hasCut && keys.includes("beard")) price -= Math.round(price * 0.1);
    return { keys, price, time, name: keys.map((key) => SERVICES[key].name).join(" + ") };
  }

  function slotsForDate(date, duration) {
    const hours = HOURS[date.getDay()];
    if (!hours) return [];
    const slots = [];
    for (let minute = hours[0]; minute + duration <= hours[1]; minute += 30) {
      slots.push(String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0"));
    }
    return slots;
  }

  // deterministic pseudo-random so the schedule is stable between reloads
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 1000) / 1000;
  }

  function bookedSlots(barberId, date, slots) {
    const key = barberId + date.toDateString();
    const dow = date.getDay();
    const base = dow === 5 || dow === 6 ? 0.65 : 0.4; // weekends busier
    return slots.filter((s, i) => seeded(key + s + i) < base);
  }

  function dayStatus(barber, date, today, duration) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < today) return "past";
    if (barber.off.includes(d.getDay())) return "closed";
    const slots = slotsForDate(d, duration);
    const booked = bookedSlots(barber.id, d, slots).length;
    // slots in the past for today
    let available = slots.length - booked;
    if (d.getTime() === today.getTime()) {
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      available -= slots.filter((s) => {
        const [h, m] = s.split(":").map(Number);
        return h * 60 + m <= nowMin + 30;
      }).filter((s) => !bookedSlots(barber.id, d, slots).includes(s)).length;
    }
    if (available <= 0) return "full";
    if (available <= 4) return "limited";
    return "free";
  }

  function initBooking() {
    const root = $("#booking");
    if (!root) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let state = { barber: BARBERS[0], date: null, time: null, service: "haircut" };

    const picker = $(".barber-picker", root);
    const monthLabel = $("[data-cal-month]", root);
    const daysEl = $(".cal__days", root);
    const slotsEl = $(".slots", root);
    const slotsDate = $("[data-slots-date]", root);
    const sumBarber = $("[data-sum-barber]", root);
    const sumDate = $("[data-sum-date]", root);
    const sumTime = $("[data-sum-time]", root);
    const sumService = $("[data-sum-service]", root);
    const sumPrice = $("[data-sum-price]", root);
    const serviceSel = $("#booking-service");
    const confirmBtn = $("[data-book-confirm]", root);

    const fmtDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    const renderSummary = () => {
      sumBarber.textContent = state.barber.name + " · " + LEVELS[state.barber.level].name;
      sumBarber.classList.remove("is-empty");
      sumDate.textContent = state.date ? fmtDate(state.date) : "Choose a date";
      sumDate.classList.toggle("is-empty", !state.date);
      sumTime.textContent = state.time || "Choose a time";
      sumTime.classList.toggle("is-empty", !state.time);
      const details = serviceDetails(state.service, state.barber.level);
      sumService.textContent = details.name;
      sumPrice.textContent = money(details.price) + " · " + details.time + " min";
      confirmBtn.disabled = !(state.date && state.time);
      confirmBtn.style.opacity = confirmBtn.disabled ? 0.5 : 1;
    };

    const renderSlots = () => {
      slotsEl.innerHTML = "";
      if (!state.date) {
        slotsEl.innerHTML = `<div class="slots__empty">Select a day on the calendar to see available times.</div>`;
        slotsDate.textContent = "";
        return;
      }
      slotsDate.textContent = fmtDate(state.date);
      const details = serviceDetails(state.service, state.barber.level);
      const slots = slotsForDate(state.date, details.time);
      const booked = bookedSlots(state.barber.id, state.date, slots);
      const isToday = state.date.getTime() === today.getTime();
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      let anyFree = false;
      slots.forEach((s, i) => {
        const [h, m] = s.split(":").map(Number);
        const past = isToday && h * 60 + m <= nowMin + 30;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "slot";
        b.textContent = s;
        b.style.animationDelay = i * 0.03 + "s";
        if (booked.includes(s) || past) {
          b.disabled = true;
          b.title = past ? "Too late for today" : "Already booked";
        } else {
          anyFree = true;
          b.addEventListener("click", () => {
            $$(".slot", slotsEl).forEach((x) => x.classList.remove("is-selected"));
            b.classList.add("is-selected");
            state.time = s;
            renderSummary();
          });
        }
        if (state.time === s) b.classList.add("is-selected");
        slotsEl.appendChild(b);
      });
      if (!anyFree) {
        const d = document.createElement("div");
        d.className = "slots__empty";
        d.textContent = "Fully booked — try another day or barber.";
        slotsEl.appendChild(d);
      }
    };

    const renderCalendar = () => {
      monthLabel.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
      daysEl.innerHTML = "";
      const first = new Date(view);
      let offset = (first.getDay() + 6) % 7; // Monday first
      for (let i = 0; i < offset; i++) {
        const e = document.createElement("div");
        e.className = "cal__day cal__day--empty";
        daysEl.appendChild(e);
      }
      const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(view.getFullYear(), view.getMonth(), d);
        const details = serviceDetails(state.service, state.barber.level);
        const status = dayStatus(state.barber, date, today, details.time);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cal__day";
        b.style.animationDelay = d * 0.015 + "s";
        b.innerHTML = `<span>${d}</span>`;
        if (date.getTime() === today.getTime()) b.classList.add("is-today");
        if (status === "past" || status === "closed") {
          b.disabled = true;
          b.title = status === "closed" ? "Day off" : "";
        } else {
          b.innerHTML += "<i></i>";
          if (status === "full") {
            b.classList.add("cal__day--full");
            b.disabled = true;
            b.title = "Fully booked";
          } else if (status === "limited") b.classList.add("cal__day--limited");
          b.addEventListener("click", () => {
            $$(".cal__day", daysEl).forEach((x) => x.classList.remove("is-selected"));
            b.classList.add("is-selected");
            state.date = date;
            state.time = null;
            renderSlots();
            renderSummary();
          });
        }
        if (state.date && state.date.getTime() === date.getTime()) b.classList.add("is-selected");
        daysEl.appendChild(b);
      }
    };

    // barber picker
    BARBERS.forEach((b, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "barber-pick" + (i === 0 ? " is-active" : "");
      btn.dataset.id = b.id;
      btn.dataset.level = b.level;
      btn.innerHTML = `<img src="${picker.dataset["img" + (i + 1)]}" alt="${b.name}"><span>${b.name}<br><small style="color:inherit;opacity:.65;font-weight:500">${LEVELS[b.level].name}</small></span>`;
      btn.addEventListener("click", () => {
        $$(".barber-pick", picker).forEach((x) => x.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.barber = b;
        state.date = null;
        state.time = null;
        renderCalendar();
        renderSlots();
        renderSummary();
      });
      picker.appendChild(btn);
    });

    $("[data-cal-prev]", root).addEventListener("click", () => {
      const prev = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      if (prev < new Date(today.getFullYear(), today.getMonth(), 1)) return showToast("Past months are not available");
      view = prev;
      renderCalendar();
    });
    $("[data-cal-next]", root).addEventListener("click", () => {
      const max = new Date(today.getFullYear(), today.getMonth() + 3, 1);
      const next = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      if (next > max) return showToast("Bookings open 3 months ahead");
      view = next;
      renderCalendar();
    });

    if (serviceSel) {
      Object.keys(SERVICES).forEach((k) => {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = SERVICES[k].name + " — from " + money(SERVICES[k].price);
        serviceSel.appendChild(o);
      });
      serviceSel.addEventListener("change", () => {
        state.service = serviceSel.value;
        state.date = null;
        state.time = null;
        renderCalendar();
        renderSlots();
        renderSummary();
      });
    }

    confirmBtn.addEventListener("click", () => {
      if (confirmBtn.disabled) return;
      const details = serviceDetails(state.service, state.barber.level);
      openModal({
        title: "Request this appointment",
        sub: "Leave your phone number and we will confirm the requested appointment during studio hours.",
        context: `${details.name} · ${state.barber.name} · ${fmtDate(state.date)} at ${state.time} · ${money(details.price)}`
      });
    });

    renderCalendar();
    renderSlots();
    renderSummary();
  }

  /* ---------- 13. Reviews slider ---------- */
  function initReviews() {
    const wrap = $(".reviews");
    if (!wrap) return;
    const track = $(".reviews__track", wrap);
    const cards = $$(".review", track);
    const dotsEl = $(".reviews__dots", wrap);
    const prev = $("[data-rev-prev]", wrap);
    const next = $("[data-rev-next]", wrap);
    let index = 0, perView = 3, timer;

    const getPerView = () => (window.innerWidth <= 640 ? 1 : window.innerWidth <= 1200 ? 2 : 3);
    const maxIndex = () => Math.max(0, cards.length - perView);

    const renderDots = () => {
      dotsEl.innerHTML = "";
      for (let i = 0; i <= maxIndex(); i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Go to review " + (i + 1));
        if (i === index) b.classList.add("is-active");
        b.addEventListener("click", () => go(i));
        dotsEl.appendChild(b);
      }
    };

    const go = (i) => {
      index = clamp(i, 0, maxIndex());
      const gap = parseFloat(getComputedStyle(track).gap) || 20;
      const w = cards[0].getBoundingClientRect().width + gap;
      track.style.transform = `translate3d(${-index * w}px,0,0)`;
      $$("button", dotsEl).forEach((d, k) => d.classList.toggle("is-active", k === index));
      restart();
    };

    const restart = () => {
      clearInterval(timer);
      timer = setInterval(() => go(index >= maxIndex() ? 0 : index + 1), 5000);
    };

    prev.addEventListener("click", () => go(index - 1));
    next.addEventListener("click", () => go(index + 1));

    // drag
    let startX = 0, dragging = false, startTx = 0;
    const getTx = () => {
      const m = track.style.transform.match(/-?[\d.]+/);
      return m ? parseFloat(m[0]) : 0;
    };
    const down = (e) => {
      dragging = true;
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      startTx = getTx();
      track.classList.add("is-dragging");
    };
    const move = (e) => {
      if (!dragging) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      track.style.transform = `translate3d(${startTx + (x - startX)}px,0,0)`;
    };
    const up = (e) => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const dx = x - startX;
      if (Math.abs(dx) > 60) go(dx < 0 ? index + 1 : index - 1);
      else go(index);
    };
    track.addEventListener("mousedown", down);
    track.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    track.addEventListener("dragstart", (e) => e.preventDefault());

    window.addEventListener("resize", () => {
      perView = getPerView();
      renderDots();
      go(index);
    });
    perView = getPerView();
    renderDots();
    go(0);
  }

  /* ---------- 14. Gallery lightbox ---------- */
  function initGallery() {
    const items = $$(".gallery__item");
    if (!items.length) return;

    const gallery = items.map((item) => {
      const img = $("img", item);
      const cap = $(".gallery__cap", item);
      const small = cap && $("small", cap);
      return {
        src: img.src,
        alt: img.alt || "VANTA gallery image",
        title: cap ? Array.from(cap.childNodes).filter((node) => node.nodeType === 3).map((node) => node.textContent).join(" ").trim() : "VANTA Studio",
        meta: small ? small.textContent.trim() : ""
      };
    });

    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "VANTA image gallery");
    lightbox.innerHTML = `
      <div class="lightbox__backdrop" data-lightbox-close></div>
      <div class="lightbox__shell">
        <div class="lightbox__top">
          <span class="lightbox__counter"></span>
          <button class="lightbox__close" type="button" data-lightbox-close aria-label="Close gallery">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <button class="lightbox__arrow lightbox__arrow--prev" type="button" aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 5l-7 7 7 7"/></svg></button>
        <figure class="lightbox__figure">
          <img class="lightbox__image" alt="">
          <figcaption><b class="lightbox__title"></b><span class="lightbox__meta"></span></figcaption>
        </figure>
        <button class="lightbox__arrow lightbox__arrow--next" type="button" aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 5l7 7-7 7"/></svg></button>
        <div class="lightbox__thumbs"></div>
      </div>`;
    document.body.appendChild(lightbox);

    const image = $(".lightbox__image", lightbox);
    const title = $(".lightbox__title", lightbox);
    const meta = $(".lightbox__meta", lightbox);
    const counter = $(".lightbox__counter", lightbox);
    const thumbs = $(".lightbox__thumbs", lightbox);
    let current = 0;
    let returnFocus = null;

    gallery.forEach((entry, i) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "lightbox__thumb";
      thumb.setAttribute("aria-label", `Open image ${i + 1}`);
      thumb.innerHTML = `<img src="${entry.src}" alt="">`;
      thumb.addEventListener("click", () => show(i));
      thumbs.appendChild(thumb);
    });

    const show = (index) => {
      current = (index + gallery.length) % gallery.length;
      const entry = gallery[current];
      image.classList.remove("is-ready");
      image.src = entry.src;
      image.alt = entry.alt;
      title.textContent = entry.title;
      meta.textContent = entry.meta;
      counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(gallery.length).padStart(2, "0")}`;
      $$(".lightbox__thumb", thumbs).forEach((thumb, i) => thumb.classList.toggle("is-active", i === current));
      setTimeout(() => image.classList.add("is-ready"), 30);
    };

    const open = (index, trigger) => {
      returnFocus = trigger;
      show(index);
      lightbox.classList.add("is-open");
      document.body.classList.add("is-locked");
      $(".lightbox__close", lightbox).focus();
    };

    const close = () => {
      if (!lightbox.classList.contains("is-open")) return;
      lightbox.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      if (returnFocus) returnFocus.focus();
    };

    items.forEach((item, i) => item.addEventListener("click", (event) => {
      event.preventDefault();
      open(i, item);
    }));
    $$("[data-lightbox-close]", lightbox).forEach((button) => button.addEventListener("click", close));
    $(".lightbox__arrow--prev", lightbox).addEventListener("click", () => show(current - 1));
    $(".lightbox__arrow--next", lightbox).addEventListener("click", () => show(current + 1));
    document.addEventListener("keydown", (event) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") show(current - 1);
      if (event.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- 15. FAQ accordion ---------- */
  function initFaq() {
    $$(".faq__item").forEach((item) => {
      const q = $(".faq__q", item);
      const a = $(".faq__a", item);
      q.addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        $$(".faq__item.is-open").forEach((o) => {
          o.classList.remove("is-open");
          $(".faq__q", o).setAttribute("aria-expanded", "false");
          $(".faq__a", o).style.maxHeight = null;
        });
        if (!open) {
          item.classList.add("is-open");
          q.setAttribute("aria-expanded", "true");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
      q.setAttribute("aria-expanded", "false");
    });
  }

  /* ---------- 16. Modal ---------- */
  function openModal(opts) {
    const modal = $("#modal");
    if (!modal) return;
    opts = opts || {};
    modal.classList.remove("is-sent");
    $(".modal__success", modal).classList.remove("is-visible");
    $(".modal__title", modal).textContent = opts.title || "Request a call back";
    $(".modal__sub", modal).textContent = opts.sub || "Leave your number and we will call you back during studio hours.";
    const ctx = $(".modal__context", modal);
    ctx.textContent = opts.context || "";
    ctx.classList.toggle("is-visible", !!opts.context);
    modal.classList.add("is-open");
    document.body.classList.add("is-locked");
    modal._returnFocus = document.activeElement;
    setTimeout(() => $("input[name='phone']", modal).focus(), 500);
  }

  function closeModal() {
    const modal = $("#modal");
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (modal._returnFocus && typeof modal._returnFocus.focus === "function") modal._returnFocus.focus();
  }

  function formatPhone(input) {
    input.addEventListener("input", () => {
      const caret = input.selectionStart || input.value.length;
      const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, "").length;
      let v = input.value.replace(/[^\d+]/g, "");
      if (v.startsWith("+")) v = "+" + v.slice(1).replace(/\+/g, "");
      const digits = v.replace(/\D/g, "");
      let out = v.startsWith("+") ? "+" : "";
      if (digits.length <= 3) out += digits;
      else if (digits.length <= 6) out += digits.slice(0, 3) + " " + digits.slice(3);
      else if (digits.length <= 10) out += digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6);
      else out += digits.slice(0, digits.length - 10) + " " + digits.slice(-10, -7) + " " + digits.slice(-7, -4) + " " + digits.slice(-4);
      input.value = out.trim();
      let nextCaret = digitsBeforeCaret === 0 ? (input.value.startsWith("+") ? 1 : 0) : input.value.length;
      if (digitsBeforeCaret > 0 && digitsBeforeCaret < digits.length) {
        let seen = 0;
        for (let i = 0; i < input.value.length; i++) {
          if (/\d/.test(input.value[i])) seen++;
          if (seen === digitsBeforeCaret) { nextCaret = i + 1; break; }
        }
      }
      input.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function initModal() {
    const modal = $("#modal");
    if (!modal) return;
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-open-modal]");
      if (trigger) {
        e.preventDefault();
        openModal({
          title: trigger.dataset.modalTitle,
          sub: trigger.dataset.modalSub,
          context: trigger.dataset.modalContext
        });
      }
      if (e.target.closest("[data-close-modal]")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key !== "Tab" || !modal.classList.contains("is-open")) return;
      const focusable = $$("button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])", modal).filter((el) => !el.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // all forms with .js-lead-form behave the same (modal + contact page)
    $$(".js-lead-form").forEach((form) => {
      const phone = $("input[name='phone']", form);
      if (phone) formatPhone(phone);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const field = phone.closest(".field");
        const digits = phone.value.replace(/\D/g, "");
        if (digits.length < 10) {
          field.classList.add("field--error");
          setTimeout(() => field.classList.remove("field--error"), 600);
          phone.focus();
          return;
        }
        const btn = $("button[type='submit']", form);
        const original = btn.innerHTML;
        btn.innerHTML = "Sending…";
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = original;
          btn.disabled = false;
          form.reset();
          if (form.closest("#modal")) {
            modal.classList.add("is-sent");
            $(".modal__success", modal).classList.add("is-visible");
          } else {
            showToast("Demo request completed. No data was sent.");
          }
        }, 900);
      });
    });
  }

  /* ---------- 17. Misc ---------- */
  function initMisc() {
    // back to top
    const top = $(".to-top");
    if (top) {
      window.addEventListener("scroll", () => top.classList.toggle("is-visible", window.scrollY > 800), { passive: true });
      top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
    // year
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    const todayHours = HOURS[new Date().getDay()];
    $$("[data-open-today]").forEach((el) => {
      el.textContent = todayHours ? `Open today ${String(todayHours[0] / 60).padStart(2, "0")}:00–${String(todayHours[1] / 60).padStart(2, "0")}:00` : "Closed today · opens Monday 10:00";
    });

    // today in opening hours
    const dow = new Date().getDay();
    $$(".hours li[data-day]").forEach((li) => li.classList.toggle("is-today", parseInt(li.dataset.day, 10) === dow));

    // blog filters
    const filters = $$(".filter-btn");
    if (filters.length) {
      filters.forEach((f) =>
        f.addEventListener("click", () => {
          filters.forEach((x) => x.classList.remove("is-active"));
          f.classList.add("is-active");
          const cat = f.dataset.filter;
          $$(".post[data-cat]").forEach((p, i) => {
            const show = cat === "all" || p.dataset.cat === cat;
            p.classList.toggle("is-hidden", !show);
            if (show) {
              p.style.animation = "none";
              void p.offsetWidth;
              p.style.animation = `fadeUp .6s ${i * 0.05}s cubic-bezier(.22,1,.36,1) both`;
            }
          });
        })
      );
    }

    // smooth anchors with header offset
    $$("a[href^='#']").forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
    });

    // CTA band bg follows cursor
    $$(".cta-band").forEach((band) => {
      const img = $(".cta-band__bg img", band);
      if (!img || isTouch) return;
      band.addEventListener("mousemove", (e) => {
        const r = band.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = `scale(1.1) translate(${-x * 20}px, ${-y * 20}px)`;
      });
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initCursor();
    initHeader();
    initReveal();
    initCounters();
    initTimeline();
    initParallax();
    initTilt();
    initMagnetic();
    initHero();
    initServicePreview();
    initCompare();
    initVideos();
    initCalculator();
    initBooking();
    initReviews();
    initGallery();
    initFaq();
    initModal();
    initMisc();
  });

  window.VANTA = { openModal, closeModal, showToast };
})();

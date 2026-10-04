/* Hasenix portfolio: progressive enhancement only; the page works without JS. */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Reveal on scroll (staggered within each parent) ----
  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // ---- Rotating hero word ----
  const word = document.querySelector(".rot-word");
  const words = ["convert.", "load fast.", "rank.", "feel premium."];
  if (word && !reduceMotion) {
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      word.classList.add("out");
      setTimeout(() => {
        word.textContent = words[i];
        word.classList.replace("out", "in");
        requestAnimationFrame(() => requestAnimationFrame(() => word.classList.remove("in")));
      }, 420);
    }, 2600);
  }

  // ---- Count-up stats ----
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } }), { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else counters.forEach(runCounter);

  // ---- Nav: mobile toggle, hide on scroll down, active section ----
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("open", open);
  });
  links?.addEventListener("click", (e) => {
    if (e.target.closest("a")) { toggle?.setAttribute("aria-expanded", "false"); links.classList.remove("open"); }
  });
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("hide", y > lastY && y > 400 && !links.classList.contains("open"));
    lastY = y;
  }, { passive: true });

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => so.observe(s));
  }

  // ---- Card tilt ----
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    // ---- Cursor glow ----
    const glow = document.querySelector(".cursor-glow");
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => glow.classList.remove("on"));
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("pointerenter", () => glow.classList.add("big"));
      el.addEventListener("pointerleave", () => glow.classList.remove("big"));
    });
    const loop = () => {
      gx += (tx - gx) * 0.2; gy += (ty - gy) * 0.2;
      glow.style.left = `${gx}px`; glow.style.top = `${gy}px`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ---- Contact form → mailto (no backend needed on GitHub Pages) ----
  const CONTACT_EMAIL = "hasaantayyb1@gmail.com";
  const form = document.getElementById("contact-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = form.querySelector(".form-note");
    let ok = true;
    form.querySelectorAll("[required]").forEach((f) => {
      const valid = f.value.trim() && (f.type !== "email" || /^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) { note.textContent = "Please fill in all fields with a valid email."; return; }
    const data = new FormData(form);
    const subject = encodeURIComponent(`New project enquiry from ${data.get("name")}`);
    const body = encodeURIComponent(`${data.get("message")}\n\n${data.get("name")} · ${data.get("email")}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    note.textContent = "Opening your email app…";
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

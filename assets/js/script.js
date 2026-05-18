const splash = document.getElementById("splash");
if (splash) {
  if (document.documentElement.classList.contains("splash-skipped")) {
    document.body.classList.remove("splash-on");
    splash.classList.add("is-hidden");
  } else {
    requestAnimationFrame(() => {
      splash.classList.add("is-logo-in");
    });
    setTimeout(() => {
      splash.classList.add("is-out");
      document.body.classList.remove("splash-on");
      splash.addEventListener("transitionend", (event) => {
        if (event.propertyName === "opacity") {
          splash.classList.add("is-hidden");
        }
      }, { once: true });
    }, 1500);
  }
}

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".global-nav");

menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", isOpen);
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    menuButton.setAttribute("aria-expanded", "false");
  }
});

const cursorDot = document.querySelector("#cur");
const cursorRing = document.querySelector("#cur-ring");

if (cursorDot && cursorRing) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let ringRafId = null;

  const ringEase = 0.05;

  function tickRing() {
    ringX += (targetX - ringX) * ringEase;
    ringY += (targetY - ringY) * ringEase;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;

    if (Math.abs(targetX - ringX) < 0.1 && Math.abs(targetY - ringY) < 0.1) {
      ringX = targetX;
      ringY = targetY;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      ringRafId = null;
      return;
    }
    ringRafId = requestAnimationFrame(tickRing);
  }

  window.addEventListener("pointermove", (event) => {
    document.body.classList.add("has-cursor");
    cursorDot.style.left = `${event.clientX}px`;
    cursorDot.style.top = `${event.clientY}px`;

    targetX = event.clientX;
    targetY = event.clientY;
    if (ringRafId === null) {
      ringRafId = requestAnimationFrame(tickRing);
    }

    const target = event.target;
    const isHoverTarget = target.closest?.("a, button, summary, .tile, .plan-card, .rental-actions a, .contact-cards a");
    document.body.classList.toggle("cursor-hover", Boolean(isHoverTarget));
  });

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("has-cursor", "cursor-hover");
  });
}

const heroSection = document.querySelector(".hero");
const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));

if (heroSection && heroSlides.length > 1) {
  const revealSlides = heroSlides.slice(1);

  function updateHero() {
    const rect = heroSection.getBoundingClientRect();
    const scrollable = heroSection.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      revealSlides.forEach((slide) => { slide.style.transform = "translateY(0)"; });
      return;
    }
    const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
    const progress = scrolled / scrollable;
    const segments = revealSlides.length;

    revealSlides.forEach((slide, index) => {
      const start = index / segments;
      const end = (index + 1) / segments;
      const local = Math.min(Math.max((progress - start) / (end - start), 0), 1);
      slide.style.transform = `translateY(${(1 - local) * 100}%)`;
    });
  }

  updateHero();
  window.addEventListener("scroll", updateHero, { passive: true });
  window.addEventListener("resize", updateHero);
}

const ringTexts = Array.from(document.querySelectorAll("#cur-ring text[data-section]"));
const trackedSections = ringTexts
  .map((text) => document.getElementById(text.dataset.section))
  .filter(Boolean);

function updateRingActiveSection() {
  const bandTop = window.innerHeight * 0.35;
  const bandBottom = window.innerHeight * 0.65;
  const bandCenter = (bandTop + bandBottom) / 2;
  let activeId = "";
  let closestDistance = Infinity;

  for (const section of trackedSections) {
    const rect = section.getBoundingClientRect();
    const overlapsBand = rect.top <= bandBottom && rect.bottom >= bandTop;
    if (!overlapsBand) continue;

    const sectionPoint = Math.min(Math.max(bandCenter, rect.top), rect.bottom);
    const distance = Math.abs(sectionPoint - bandCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      activeId = section.id;
    }
  }

  ringTexts.forEach((text) => {
    text.classList.toggle("is-active", text.dataset.section === activeId);
  });
}

if (ringTexts.length) {
  updateRingActiveSection();
  window.addEventListener("scroll", updateRingActiveSection, { passive: true });
  window.addEventListener("resize", updateRingActiveSection);
}

const fadeElements = document.querySelectorAll(".fade-up");
if (fadeElements.length && "IntersectionObserver" in window) {
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  fadeElements.forEach((el) => fadeObserver.observe(el));
} else {
  fadeElements.forEach((el) => el.classList.add("is-visible"));
}

const faqDetails = document.querySelectorAll(".faq-section details");

faqDetails.forEach((details) => {
  const summary = details.querySelector("summary");
  if (!summary) return;

  summary.addEventListener("click", (event) => {
    event.preventDefault();
    if (details.dataset.animating === "1") return;
    details.dataset.animating = "1";

    const startHeight = details.offsetHeight;
    let endHeight;

    if (details.open) {
      endHeight = summary.offsetHeight;
    } else {
      details.open = true;
      endHeight = details.offsetHeight;
    }

    const animation = details.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 280, easing: "ease" }
    );

    animation.onfinish = () => {
      if (startHeight > endHeight) {
        details.open = false;
      }
      details.style.height = "";
      delete details.dataset.animating;
    };
  });
});

const galleryTiles = Array.from(document.querySelectorAll("#gallery .tile"));
const galleryImages = galleryTiles
  .map((tile) => tile.querySelector("img"))
  .filter(Boolean);
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-frame img");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
let lightboxIndex = 0;

function showLightboxImage(index) {
  lightboxIndex = (index + galleryImages.length) % galleryImages.length;
  const image = galleryImages[lightboxIndex];
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || "ギャラリー画像";
}

function openLightbox(index) {
  showLightboxImage(index);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

if (galleryImages.length && lightbox && lightboxImage) {
  galleryTiles.forEach((tile, index) => {
    tile.addEventListener("click", () => openLightbox(index));
    tile.setAttribute("tabindex", "0");
    tile.setAttribute("role", "button");
    tile.setAttribute("aria-label", "ギャラリー画像を拡大表示");
    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(index);
      }
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => showLightboxImage(lightboxIndex - 1));
  lightboxNext.addEventListener("click", () => showLightboxImage(lightboxIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target.closest(".lightbox-close, .lightbox-nav, .lightbox-frame img")) return;
    closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showLightboxImage(lightboxIndex - 1);
    if (event.key === "ArrowRight") showLightboxImage(lightboxIndex + 1);
  });
}

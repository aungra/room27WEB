const splash = document.getElementById("splash");
function revealCursor() {
  document.body.classList.add("cursor-ready");
}

if (splash) {
  if (document.documentElement.classList.contains("splash-skipped")) {
    document.body.classList.remove("splash-on");
    splash.classList.add("is-hidden");
    revealCursor();
  } else {
    requestAnimationFrame(() => {
      splash.classList.add("is-logo-in");
    });
    setTimeout(() => {
      const finishSplash = (event) => {
        if (event && event.propertyName !== "opacity") return;
        splash.classList.add("is-hidden");
        revealCursor();
      };
      splash.addEventListener("transitionend", finishSplash, { once: true });
      setTimeout(finishSplash, 900);
      splash.classList.add("is-out");
      document.body.classList.remove("splash-on");
    }, 1500);
  }
} else {
  revealCursor();
}

function wrapLatinText(root = document.body) {
  if (!root || root.dataset.latinWrapped === "1") return;

  const latinRunPattern = /([A-Za-z0-9][A-Za-z0-9.,&+()/:'"!?-]*(?:\s+[+&]?\s*[A-Za-z0-9][A-Za-z0-9.,&+()/:'"!?-]*)*)/g;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest("script, style, noscript, svg, summary, .faq-answer, .latin")) {
        return NodeFilter.FILTER_REJECT;
      }
      return /[A-Za-z0-9]/.test(node.nodeValue)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach((node) => {
    const text = node.nodeValue;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    text.replace(latinRunPattern, (match, _run, offset) => {
      if (offset > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
      }
      const span = document.createElement("span");
      span.className = "latin";
      span.textContent = match;
      fragment.appendChild(span);
      lastIndex = offset + match.length;
      return match;
    });

    if (lastIndex === 0) return;
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    node.parentNode.replaceChild(fragment, node);
  });

  root.dataset.latinWrapped = "1";
}

wrapLatinText();

const rentalPanel = document.querySelector(".rental-panel");
const rentalVideo = document.querySelector(".rental-bg-video");

if (rentalPanel && rentalVideo) {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const playRentalVideo = () => {
    if (reducedMotionQuery.matches) return;
    if (rentalVideo.readyState === 0) rentalVideo.load();
    const playPromise = rentalVideo.play();
    if (playPromise) playPromise.catch(() => {});
  };

  const pauseRentalVideo = () => {
    rentalVideo.pause();
  };

  if ("IntersectionObserver" in window) {
    const rentalVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playRentalVideo();
        } else {
          pauseRentalVideo();
        }
      });
    }, {
      rootMargin: "120px 0px",
      threshold: 0.25
    });

    rentalVideoObserver.observe(rentalPanel);
  } else {
    playRentalVideo();
  }

  reducedMotionQuery.addEventListener("change", () => {
    if (reducedMotionQuery.matches) {
      pauseRentalVideo();
    }
  });
}

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".global-nav");

function updateHeaderState() {
  document.body.classList.toggle("is-scrolled", window.scrollY > 12);
  const footer = document.querySelector(".site-footer");
  if (!footer) return;

  const footerTop = footer.getBoundingClientRect().top;
  document.body.classList.toggle("footer-in-view", footerTop <= window.innerHeight);
}

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

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
const desktopCursorQuery = window.matchMedia("(max-width: 0px)");
const mapBox = document.querySelector(".map-box");
const mapFrame = document.querySelector(".map-box iframe");

if (cursorDot && cursorRing && desktopCursorQuery.matches) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let ringRafId = null;

  const ringEase = 0.05;

  function moveCursorElement(element, x, y) {
    element.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
  }

  function updateMapCursorState(x, y) {
    if (!mapBox || !desktopCursorQuery.matches) {
      document.body.classList.remove("cursor-map");
      return;
    }

    const mapRect = mapBox.getBoundingClientRect();
    const isOverMap = x >= mapRect.left &&
      x <= mapRect.right &&
      y >= mapRect.top &&
      y <= mapRect.bottom;
    document.body.classList.toggle("cursor-map", isOverMap);
  }

  function clearDesktopCursorState() {
    document.body.classList.remove("has-cursor", "cursor-hover", "cursor-map");
    cursorDot.style.transform = "";
    cursorRing.style.transform = "";
    if (ringRafId !== null) {
      cancelAnimationFrame(ringRafId);
      ringRafId = null;
    }
  }

  function tickRing() {
    if (!desktopCursorQuery.matches) {
      clearDesktopCursorState();
      return;
    }

    ringX += (targetX - ringX) * ringEase;
    ringY += (targetY - ringY) * ringEase;
    moveCursorElement(cursorRing, ringX, ringY);
    updateMapCursorState(targetX, targetY);

    if (Math.abs(targetX - ringX) < 0.1 && Math.abs(targetY - ringY) < 0.1) {
      ringX = targetX;
      ringY = targetY;
      moveCursorElement(cursorRing, ringX, ringY);
      updateMapCursorState(targetX, targetY);
      ringRafId = null;
      return;
    }
    ringRafId = requestAnimationFrame(tickRing);
  }

  window.addEventListener("pointermove", (event) => {
    if (!desktopCursorQuery.matches) {
      clearDesktopCursorState();
      return;
    }

    document.body.classList.add("has-cursor");
    moveCursorElement(cursorDot, event.clientX, event.clientY);

    targetX = event.clientX;
    targetY = event.clientY;
    if (ringRafId === null) {
      ringRafId = requestAnimationFrame(tickRing);
    }

    const target = event.target;
    const isHoverTarget = target.closest?.("a, button, summary, .tile, .plan-card, .rental-actions a, .contact-cards a");
    document.body.classList.toggle("cursor-hover", Boolean(isHoverTarget));

    updateMapCursorState(event.clientX, event.clientY);
  });

  if (mapBox) {
    mapBox.addEventListener("pointerenter", () => {
      if (desktopCursorQuery.matches) {
        document.body.classList.add("cursor-map");
      }
    });

    mapBox.addEventListener("pointerleave", () => {
      document.body.classList.remove("cursor-map");
    });
  }

  if (mapFrame) {
    mapFrame.addEventListener("mouseenter", () => {
      if (desktopCursorQuery.matches) {
        document.body.classList.add("cursor-map");
      }
    });

    mapFrame.addEventListener("mouseleave", () => {
      document.body.classList.remove("cursor-map");
    });
  }

  window.addEventListener("pointerleave", clearDesktopCursorState);
  desktopCursorQuery.addEventListener("change", clearDesktopCursorState);
}

const heroSection = document.querySelector(".hero");
const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
const siteFooter = document.querySelector(".site-footer");
const heroMobileQuery = window.matchMedia("(max-width: 767px)");
let lastHeroViewportWidth = window.innerWidth;

function setHeroViewportHeight(force = false) {
  if (heroMobileQuery.matches && !force && window.innerWidth === lastHeroViewportWidth) {
    return;
  }

  lastHeroViewportWidth = window.innerWidth;
  const viewportHeight = heroMobileQuery.matches
    ? Math.max(document.documentElement.clientHeight, window.innerHeight)
    : window.innerHeight;
  document.documentElement.style.setProperty("--hero-vh", `${viewportHeight}px`);
}

setHeroViewportHeight(true);

if (heroSection && heroSlides.length > 1) {
  const revealSlides = heroSlides.slice(1);
  let heroRafId = null;

  function updateHero() {
    heroRafId = null;
    const rect = heroSection.getBoundingClientRect();
    const viewportHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hero-vh")) || window.innerHeight;
    const scrollable = heroSection.offsetHeight - viewportHeight;
    if (scrollable <= 0) {
      revealSlides.forEach((slide) => { slide.style.transform = "translate3d(0, 0, 0)"; });
      return;
    }
    const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
    const progress = scrolled / scrollable;
    const segments = revealSlides.length;

    revealSlides.forEach((slide, index) => {
      const start = index / segments;
      const end = (index + 1) / segments;
      const local = Math.min(Math.max((progress - start) / (end - start), 0), 1);
      slide.style.transform = `translate3d(0, ${(1 - local) * 100}%, 0)`;
    });
  }

  function requestHeroUpdate() {
    if (heroRafId === null) {
      heroRafId = requestAnimationFrame(updateHero);
    }
  }

  updateHero();
  window.addEventListener("scroll", requestHeroUpdate, { passive: true });
  window.addEventListener("resize", () => {
    setHeroViewportHeight();
    requestHeroUpdate();
  });
  heroMobileQuery.addEventListener("change", () => {
    setHeroViewportHeight(true);
    requestHeroUpdate();
  });
}

function updateMobileCursorVisibility() {
  if (!mobileRingQuery.matches || !heroSection || !siteFooter) {
    document.body.classList.remove("mobile-cursor-visible");
    return;
  }

  const heroComplete = heroSection.getBoundingClientRect().bottom <= window.innerHeight;
  const footerReached = siteFooter.getBoundingClientRect().top <= window.innerHeight * 0.92;
  document.body.classList.toggle("mobile-cursor-visible", heroComplete && !footerReached);
}

const ringTexts = Array.from(document.querySelectorAll("#cur-ring text[data-section]"));
const ringTextGroup = document.querySelector("#cur-ring .ring-text");
const trackedSectionIds = Array.from(new Set(ringTexts.map((text) => text.dataset.section)));
const trackedSections = trackedSectionIds
  .map((sectionId) => document.getElementById(sectionId))
  .filter(Boolean);
const mobileRingQuery = window.matchMedia("(min-width: 0px)");
updateMobileCursorVisibility();
window.addEventListener("scroll", updateMobileCursorVisibility, { passive: true });
window.addEventListener("resize", updateMobileCursorVisibility);
mobileRingQuery.addEventListener("change", updateMobileCursorVisibility);
const ringSectionAngles = {
  plan: -25,
  gallery: 32,
  rental: 96,
  access: 157,
  faq: -148,
  contact: -87,
};
const ringSectionOrder = ["plan", "gallery", "rental", "access", "faq", "contact"];
const mobileRingTargetAngle = -55;
const ringDragDistanceThreshold = 12;
const ringDragAngleThreshold = 8;
const ringEdgeResistance = 0.25;
const ringEdgeOvershoot = 32;
const ringScrollUnlockDelay = 180;
const ringSectionRotations = ringSectionOrder.reduce((rotations, sectionId, index) => {
  let sectionRotation = mobileRingTargetAngle - ringSectionAngles[sectionId];
  if (index > 0) {
    const previousRotation = rotations[ringSectionOrder[index - 1]];
    while (sectionRotation > previousRotation) {
      sectionRotation -= 360;
    }
  }
  rotations[sectionId] = sectionRotation;
  return rotations;
}, {});
const minRingRotation = ringSectionRotations[ringSectionOrder[ringSectionOrder.length - 1]];
const maxRingRotation = ringSectionRotations[ringSectionOrder[0]];
let activeRingSectionId = "";
let mobileRingRotation = 0;
let mobileRingRafId = null;
let isMobileRingDragging = false;
let dragStartAngle = 0;
let dragStartRotation = 0;
let dragStartX = 0;
let dragStartY = 0;
let hasRingDragMoved = false;
let selectedRingSectionId = "";
let isRingScrollLocked = false;
let ringScrollLockTimer = null;

function normalizeForwardDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function normalizeSignedDegrees(value) {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

function clampRingRotation(rotation) {
  return Math.min(Math.max(rotation, minRingRotation), maxRingRotation);
}

function applyRingEdgeResistance(rotation) {
  if (rotation > maxRingRotation) {
    return Math.min(maxRingRotation + (rotation - maxRingRotation) * ringEdgeResistance, maxRingRotation + ringEdgeOvershoot);
  }
  if (rotation < minRingRotation) {
    return Math.max(minRingRotation + (rotation - minRingRotation) * ringEdgeResistance, minRingRotation - ringEdgeOvershoot);
  }
  return rotation;
}

function setRingActiveText(activeId) {
  ringTexts.forEach((text) => {
    text.classList.toggle("is-active", text.dataset.section === activeId);
  });
}

function getMobileRingTargetRotation() {
  const targetRotation = ringSectionRotations[activeRingSectionId];
  return typeof targetRotation === "number" ? targetRotation : mobileRingRotation;
}

function stopMobileRingAnimation() {
  if (mobileRingRafId !== null) {
    cancelAnimationFrame(mobileRingRafId);
    mobileRingRafId = null;
  }
}

function clearMobileRingTransform() {
  stopMobileRingAnimation();
  if (ringTextGroup) {
    ringTextGroup.style.transform = "";
  }
}

function tickMobileRing() {
  if (!mobileRingQuery.matches || !ringTextGroup) {
    clearMobileRingTransform();
    return;
  }

  const targetRotation = getMobileRingTargetRotation();
  const targetDelta = targetRotation - mobileRingRotation;
  mobileRingRotation += targetDelta * 0.18;
  ringTextGroup.style.transform = `rotate(${mobileRingRotation}deg)`;

  if (Math.abs(targetDelta) < 0.5) {
    mobileRingRotation = targetRotation;
    ringTextGroup.style.transform = `rotate(${mobileRingRotation}deg)`;
    mobileRingRafId = null;
    return;
  }

  mobileRingRafId = requestAnimationFrame(tickMobileRing);
}

function requestMobileRingAnimation() {
  if (!mobileRingQuery.matches || !ringTextGroup) {
    clearMobileRingTransform();
    return;
  }
  if (isMobileRingDragging) return;
  if (mobileRingRafId === null) {
    mobileRingRafId = requestAnimationFrame(tickMobileRing);
  }
}

function getRingPointerAngle(event) {
  if (!cursorRing) return 0;
  const rect = cursorRing.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
}

function getNearestRingSectionId(rotation) {
  let nearestId = activeRingSectionId;
  let nearestDistance = Infinity;
  const clampedRotation = clampRingRotation(rotation);

  for (const [sectionId, sectionRotation] of Object.entries(ringSectionRotations)) {
    const distance = Math.abs(clampedRotation - sectionRotation);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = sectionId;
    }
  }

  return nearestId;
}

function getRingSectionIdFromPointer(event) {
  const pointerAngle = getRingPointerAngle(event);
  let nearestId = activeRingSectionId;
  let nearestDistance = Infinity;

  for (const [sectionId, baseAngle] of Object.entries(ringSectionAngles)) {
    const visibleAngle = baseAngle + mobileRingRotation;
    const distance = Math.abs(normalizeSignedDegrees(visibleAngle - pointerAngle));
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestId = sectionId;
    }
  }

  return nearestId;
}

function updateDraggedRingSelection() {
  selectedRingSectionId = getNearestRingSectionId(mobileRingRotation);
  setRingActiveText(selectedRingSectionId);
}

function unlockRingScroll() {
  isRingScrollLocked = false;
  ringScrollLockTimer = null;
  updateRingActiveSection();
}

function scheduleRingScrollUnlock() {
  clearTimeout(ringScrollLockTimer);
  ringScrollLockTimer = setTimeout(unlockRingScroll, ringScrollUnlockDelay);
}

function lockRingScroll() {
  isRingScrollLocked = true;
  scheduleRingScrollUnlock();
}

function navigateToRingSection(sectionId) {
  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return;

  selectedRingSectionId = sectionId;
  activeRingSectionId = sectionId;
  setRingActiveText(sectionId);
  lockRingScroll();
  targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
  requestMobileRingAnimation();
}

function updateRingActiveSection() {
  if (isMobileRingDragging) {
    return selectedRingSectionId;
  }
  if (isRingScrollLocked) {
    return activeRingSectionId;
  }

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

  setRingActiveText(activeId);

  if (activeRingSectionId !== activeId) {
    activeRingSectionId = activeId;
    requestMobileRingAnimation();
  }

  return activeId;
}

function startMobileRingDrag(event) {
  if (!mobileRingQuery.matches || !ringTextGroup) return;
  if (isRingScrollLocked) return;
  if (!document.body.classList.contains("mobile-cursor-visible")) return;
  if (document.body.classList.contains("nav-open") ||
    document.body.classList.contains("splash-on") ||
    document.body.classList.contains("lightbox-open")) return;

  event.preventDefault();
  isMobileRingDragging = true;
  dragStartAngle = getRingPointerAngle(event);
  dragStartRotation = mobileRingRotation;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  hasRingDragMoved = false;
  selectedRingSectionId = activeRingSectionId || getNearestRingSectionId(mobileRingRotation);
  stopMobileRingAnimation();
  document.body.classList.add("mobile-ring-dragging");
  cursorRing.setPointerCapture?.(event.pointerId);
  updateDraggedRingSelection();
}

function moveMobileRingDrag(event) {
  if (!isMobileRingDragging || !ringTextGroup) return;

  event.preventDefault();
  const moveDistance = Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY);
  const angleDelta = normalizeSignedDegrees(getRingPointerAngle(event) - dragStartAngle);
  if (moveDistance >= ringDragDistanceThreshold || Math.abs(angleDelta) >= ringDragAngleThreshold) {
    hasRingDragMoved = true;
  }
  mobileRingRotation = applyRingEdgeResistance(dragStartRotation + angleDelta);
  ringTextGroup.style.transform = `rotate(${mobileRingRotation}deg)`;
  updateDraggedRingSelection();
}

function finishMobileRingDrag(event) {
  if (!isMobileRingDragging) return;

  event.preventDefault();
  isMobileRingDragging = false;
  document.body.classList.remove("mobile-ring-dragging");
  cursorRing?.releasePointerCapture?.(event.pointerId);

  if (!hasRingDragMoved) {
    selectedRingSectionId = event.target?.closest?.("[data-section]")?.dataset.section ||
      getRingSectionIdFromPointer(event);
  } else {
    selectedRingSectionId = getNearestRingSectionId(mobileRingRotation);
  }
  navigateToRingSection(selectedRingSectionId);
}

if (ringTexts.length) {
  updateRingActiveSection();
  window.addEventListener("scroll", () => {
    if (isRingScrollLocked) {
      scheduleRingScrollUnlock();
      return;
    }
    updateRingActiveSection();
  }, { passive: true });
  window.addEventListener("resize", () => {
    if (mobileRingQuery.matches) {
      updateRingActiveSection();
      requestMobileRingAnimation();
    } else {
      clearMobileRingTransform();
    }
  });
  mobileRingQuery.addEventListener("change", (event) => {
    if (event.matches) {
      updateRingActiveSection();
      requestMobileRingAnimation();
    } else {
      clearMobileRingTransform();
    }
  });
  requestMobileRingAnimation();
}

if (cursorRing && ringTextGroup) {
  cursorRing.addEventListener("pointerdown", startMobileRingDrag);
  cursorRing.addEventListener("pointermove", moveMobileRingDrag);
  cursorRing.addEventListener("pointerup", finishMobileRingDrag);
  cursorRing.addEventListener("pointercancel", finishMobileRingDrag);
  cursorRing.addEventListener("lostpointercapture", finishMobileRingDrag);
  window.addEventListener("pointerup", finishMobileRingDrag);
  window.addEventListener("pointercancel", finishMobileRingDrag);
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
    if (event.target.closest(".lightbox-close, .lightbox-nav")) {
      return;
    }
    closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showLightboxImage(lightboxIndex - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showLightboxImage(lightboxIndex + 1);
    }
  });
}

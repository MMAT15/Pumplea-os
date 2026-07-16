const EVENT_DATE = new Date("2026-07-26T00:00:00-03:00");
const STORAGE_KEY = "candela-20-rsvp-responses";
const HOST_WHATSAPP_NUMBER = "5491159584851";
const COLORS = ["#ff4f8d", "#28d8ff", "#77f7a4", "#ffd84f", "#7f55ff", "#ff8a4c"];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const body = document.body;
const canvas = $("#partyCanvas");
const ctx = canvas.getContext("2d");
const rainLayer = $("#rainLayer");
const inviteShell = $("#inviteShell");
const musicToggle = $("#musicToggle");
const confirmBtn = $("#confirmBtn");
const ageNumber = $("#ageNumber");
const whatsAppShare = $("#whatsAppShare");
const calendarLink = $("#calendarLink");
const form = $("#rsvpForm");
const formError = $("#formError");
const guestName = $("#guestName");
const attendanceNo = $("#attendanceNo");
const attendanceNoLabel = $("#attendanceNoLabel");
const sadPanel = $("#sadPanel");
const giftPolice = $("#giftPolice");
const giftHero = $("#giftHero");
const drinkHint = $("#drinkHint");
const crewHint = $("#crewHint");
const guestCrew = $("#guestCrew");
const dontTouch = $("#dontTouch");
const memeLayer = $("#memeLayer");
const successCelebration = $("#successCelebration");
const closeSuccess = $("#closeSuccess");
const easterToast = $("#easterToast");

let audioContext;
let musicTimer;
let musicIndex = 0;
let soundEnabled = false;
let userMuted = false;
let ageClicks = 0;
let lastPointer;
let movementScore = 0;
let particles = [];

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function tone(frequency, duration = 0.12, type = "sine", volume = 0.06, delay = 0) {
  if (!soundEnabled) return;
  ensureAudio();

  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function popSound() {
  tone(620, 0.09, "triangle", 0.07);
  tone(920, 0.1, "triangle", 0.05, 0.06);
}

function sadSound() {
  tone(260, 0.18, "sine", 0.05);
  tone(196, 0.22, "sine", 0.04, 0.17);
}

function alarmSound() {
  for (let index = 0; index < 8; index += 1) {
    tone(index % 2 ? 760 : 430, 0.11, "square", 0.045, index * 0.11);
  }
}

function celebrationSound() {
  [523, 659, 784, 1046, 784, 988].forEach((note, index) => {
    tone(note, 0.12, "triangle", 0.065, index * 0.08);
  });
}

function startMusic() {
  ensureAudio();
  soundEnabled = true;
  clearInterval(musicTimer);

  const melody = [392, 494, 523, 659, 523, 494, 440, 587];
  musicTimer = setInterval(() => {
    const note = melody[musicIndex % melody.length];
    tone(note, 0.13, "triangle", 0.035);
    if (musicIndex % 4 === 0) tone(98, 0.09, "square", 0.03);
    musicIndex += 1;
  }, 330);

  musicToggle.setAttribute("aria-pressed", "true");
  musicToggle.innerHTML = '<i class="fa-solid fa-volume-high" aria-hidden="true"></i><span>Música</span>';
}

function stopMusic() {
  clearInterval(musicTimer);
  soundEnabled = false;
  musicToggle.setAttribute("aria-pressed", "false");
  musicToggle.innerHTML = '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i><span>Música</span>';
}

function maybeStartMusic() {
  if (!soundEnabled && !userMuted) {
    startMusic();
  }
}

function burstConfetti(options = {}) {
  if (window.confetti) {
    window.confetti({
      particleCount: options.count || 110,
      spread: options.spread || 72,
      origin: options.origin || { y: 0.62 },
      colors: COLORS,
    });
  }
}

function setupShareLinks() {
  const invitationText =
    "¡Estás invitado al cumple número 20 de Candela Frías! Domingo 26 de julio de 2026 en Calle 10 4630, Piso 8. Confirmá asistencia acá: ";
  whatsAppShare.href = `https://wa.me/?text=${encodeURIComponent(invitationText + window.location.href)}`;

  const details = encodeURIComponent(
    "Comida, música, risas y probablemente malas decisiones. Desde las 15:00 hasta que no te dé más el cuerpo."
  );
  const location = encodeURIComponent("Calle 10 4630 - Piso 8");
  calendarLink.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    "Cumple 20 de Candela Frías"
  )}&dates=20260726T180000Z/20260727T030000Z&details=${details}&location=${location}`;
}

function updateCountdown() {
  const diff = EVENT_DATE.getTime() - Date.now();

  if (diff <= 0) {
    $("#countdown").innerHTML = '<div class="party-now"><strong>HOY</strong><span>es el día</span></div>';
    return;
  }

  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  const days = Math.floor(diff / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.floor((diff % hour) / minute);
  const seconds = Math.floor((diff % minute) / 1000);

  $("#days").textContent = String(days).padStart(2, "0");
  $("#hours").textContent = String(hours).padStart(2, "0");
  $("#minutes").textContent = String(minutes).padStart(2, "0");
  $("#seconds").textContent = String(seconds).padStart(2, "0");
}

function revealOnScroll() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    $$(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  $$(".reveal").forEach((element) => observer.observe(element));
}

function makeButtonRunaway(button, duration = 3600) {
  button.classList.add("runaway");
  const start = Date.now();
  const timer = setInterval(() => {
    const elapsed = Date.now() - start;
    const x = Math.round((Math.random() - 0.5) * 120);
    const y = Math.round((Math.random() - 0.5) * 80);
    const rotation = Math.round((Math.random() - 0.5) * 20);
    button.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;

    if (elapsed > duration) {
      clearInterval(timer);
      button.style.transform = "";
      button.classList.remove("runaway");
    }
  }, 260);
}

function triggerNoAttendance() {
  maybeStartMusic();
  sadPanel.hidden = false;
  sadPanel.classList.add("animate__animated", "animate__fadeIn");
  rainLayer.classList.add("active");
  makeButtonRunaway(attendanceNoLabel);
  sadSound();

  setTimeout(() => {
    rainLayer.classList.remove("active");
  }, 4200);
}

function triggerGiftNo() {
  maybeStartMusic();
  giftHero.hidden = true;
  giftPolice.hidden = false;
  giftPolice.classList.add("animate__animated", "animate__tada");
  body.classList.add("alarm-mode", "shake-mode");
  alarmSound();

  setTimeout(() => body.classList.remove("shake-mode"), 1700);
  setTimeout(() => body.classList.remove("alarm-mode"), 2600);
}

function triggerGiftYes() {
  maybeStartMusic();
  giftPolice.hidden = true;
  giftHero.hidden = false;
  giftHero.classList.add("animate__animated", "animate__heartBeat");
  popSound();
  burstConfetti({ count: 150, spread: 94 });
}

function handleDrinkChange(event) {
  if (event.target.value === "Agua") {
    drinkHint.textContent = "¿Seguro? Bueno, alguien tiene que acordarse de todo mañana.";
    drinkHint.classList.add("animate__animated", "animate__headShake");
    setTimeout(() => drinkHint.classList.remove("animate__animated", "animate__headShake"), 900);
  } else {
    drinkHint.textContent = "Excelente. Hidratación emocional confirmada.";
  }
}

function handleCrewInput() {
  const value = guestCrew.value.trim().toLowerCase();

  if (!value) {
    crewHint.textContent = "";
    return;
  }

  if (/\bsolo\b|\bsola\b/.test(value)) {
    crewHint.textContent = "Perfecto, así hacés nuevos amigos.";
    return;
  }

  if (/[,;+&]|\by\b|\bcon\b|\bbanda\b|\bamigos\b|\bamigas\b/.test(value)) {
    crewHint.textContent = "¡Traé a la banda!";
    return;
  }

  crewHint.textContent = "Anotado. Candela ya está calculando sillas con fe.";
}

function readFormValue(name) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function saveResponse(payload) {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  current.push(payload);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

function buildHostWhatsAppUrl(payload) {
  const message = [
    "🎉 Confirmación cumple 20 de Candela",
    "",
    `Nombre: ${payload.name}`,
    `¿Viene?: ${payload.attendance}`,
    `¿Trae regalo?: ${payload.gift}`,
    `Toma: ${payload.drink}`,
    `Viene con: ${payload.crew || "No especificó"}`,
    `Canción: ${payload.song || "No especificó"}`,
  ].join("\n");

  return `https://wa.me/${HOST_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function sendResponseToHost(payload) {
  const whatsappUrl = buildHostWhatsAppUrl(payload);
  const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

  if (!opened) {
    window.location.href = whatsappUrl;
  }
}

function submitRsvp(event) {
  event.preventDefault();
  formError.textContent = "";
  maybeStartMusic();

  const name = guestName.value.trim();
  const attendance = readFormValue("attendance");
  const gift = readFormValue("gift");
  const drink = readFormValue("drink");

  if (!name) {
    formError.textContent = "El nombre es obligatorio. Candela no acepta invitados misteriosos.";
    guestName.focus();
    tone(160, 0.16, "sawtooth", 0.05);
    return;
  }

  if (!attendance || !gift || !drink) {
    formError.textContent = "Faltan respuestas clave. El comité de fiesta necesita datos.";
    tone(180, 0.16, "sawtooth", 0.05);
    return;
  }

  const payload = {
    name,
    attendance,
    gift,
    drink,
    crew: $("#guestCrew").value.trim(),
    song: $("#songRequest").value.trim(),
    savedAt: new Date().toISOString(),
  };

  saveResponse(payload);
  sendResponseToHost(payload);
  celebrationSound();
  burstConfetti({ count: 220, spread: 108 });
  successCelebration.hidden = false;
}

function triggerAgeEgg() {
  maybeStartMusic();
  ageClicks += 1;
  ageNumber.style.transform = `rotate(${Math.random() * 10 - 5}deg) scale(${1 + ageClicks * 0.018})`;

  if (ageClicks >= 7) {
    ageClicks = 0;
    easterToast.hidden = false;
    easterToast.classList.add("animate__animated", "animate__bounceInUp");
    body.classList.add("boliche-mode");
    burstConfetti({ count: 200, spread: 120 });
    popSound();

    setTimeout(() => {
      easterToast.hidden = true;
      easterToast.classList.remove("animate__animated", "animate__bounceInUp");
    }, 3600);
  }
}

function toggleBolicheMode() {
  body.classList.toggle("boliche-mode");
  if (body.classList.contains("boliche-mode")) {
    maybeStartMusic();
    burstConfetti({ count: 90, spread: 80 });
    popSound();
  }
}

function createMouseBalloon(x, y) {
  const balloon = document.createElement("span");
  balloon.className = "mouse-balloon";
  balloon.style.left = `${x - 17}px`;
  balloon.style.top = `${y - 44}px`;
  balloon.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
  document.body.appendChild(balloon);
  setTimeout(() => balloon.remove(), 3200);
}

function trackMouseParty(event) {
  if (!lastPointer) {
    lastPointer = { x: event.clientX, y: event.clientY };
    return;
  }

  const dx = event.clientX - lastPointer.x;
  const dy = event.clientY - lastPointer.y;
  movementScore += Math.hypot(dx, dy);
  lastPointer = { x: event.clientX, y: event.clientY };

  if (movementScore > 1600) {
    movementScore = 0;
    createMouseBalloon(event.clientX, event.clientY);
  }
}

function unleashMemes() {
  const memes = [
    "La tía: ¿y el novio?",
    "Ese fernet no se prepara solo.",
    "Yo después de decir: una canción más.",
    "La mesa dulce me está mirando.",
    "Plan tranqui, dijeron."
  ];

  inviteShell.classList.add("chaos-spin");
  maybeStartMusic();
  popSound();
  burstConfetti({ count: 130, spread: 100 });

  memes.forEach((text, index) => {
    const card = document.createElement("div");
    card.className = "meme-card";
    card.textContent = text;
    card.style.left = `${8 + Math.random() * 72}%`;
    card.style.top = `${12 + Math.random() * 68}%`;
    card.style.transform = `rotate(${Math.random() * 24 - 12}deg)`;
    card.style.animationDelay = `${index * 90}ms`;
    memeLayer.appendChild(card);
  });

  setTimeout(() => {
    inviteShell.classList.remove("chaos-spin");
    memeLayer.innerHTML = "";
  }, 3100);
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resetParticle(particle, initial = false) {
  particle.kind = Math.random() > 0.82 ? "balloon" : Math.random() > 0.62 ? "sparkle" : "confetti";
  particle.x = Math.random() * window.innerWidth;
  particle.y = initial ? Math.random() * window.innerHeight : -30 - Math.random() * 120;
  particle.size = particle.kind === "balloon" ? 16 + Math.random() * 18 : 4 + Math.random() * 8;
  particle.speed = particle.kind === "balloon" ? 0.18 + Math.random() * 0.35 : 0.45 + Math.random() * 1.1;
  particle.swing = Math.random() * Math.PI * 2;
  particle.spin = Math.random() * Math.PI * 2;
  particle.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  particle.alpha = particle.kind === "balloon" ? 0.11 + Math.random() * 0.17 : 0.12 + Math.random() * 0.18;
}

function setupParticles() {
  particles = Array.from({ length: 72 }, () => {
    const particle = {};
    resetParticle(particle, true);
    return particle;
  });
}

function drawBalloon(particle) {
  ctx.save();
  ctx.globalAlpha = particle.alpha;
  ctx.translate(particle.x, particle.y);
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, particle.size * 0.72, particle.size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.moveTo(0, particle.size);
  ctx.quadraticCurveTo(6, particle.size + 16, -3, particle.size + 34);
  ctx.stroke();
  ctx.restore();
}

function drawSparkle(particle) {
  ctx.save();
  ctx.globalAlpha = particle.alpha;
  ctx.strokeStyle = particle.color;
  ctx.lineWidth = 2;
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.spin);
  ctx.beginPath();
  ctx.moveTo(-particle.size, 0);
  ctx.lineTo(particle.size, 0);
  ctx.moveTo(0, -particle.size);
  ctx.lineTo(0, particle.size);
  ctx.stroke();
  ctx.restore();
}

function drawConfetti(particle) {
  ctx.save();
  ctx.globalAlpha = particle.alpha;
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.spin);
  ctx.fillStyle = particle.color;
  ctx.fillRect(-particle.size, -particle.size / 2, particle.size * 1.8, particle.size);
  ctx.restore();
}

function animateParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles.forEach((particle) => {
    particle.y += particle.speed;
    particle.x += Math.sin(particle.swing) * 0.32;
    particle.swing += 0.018;
    particle.spin += 0.016;

    if (particle.kind === "balloon") drawBalloon(particle);
    if (particle.kind === "sparkle") drawSparkle(particle);
    if (particle.kind === "confetti") drawConfetti(particle);

    if (particle.y > window.innerHeight + 80) resetParticle(particle);
  });

  requestAnimationFrame(animateParticles);
}

function bindEvents() {
  musicToggle.addEventListener("click", () => {
    if (soundEnabled) {
      userMuted = true;
      stopMusic();
    } else {
      userMuted = false;
      startMusic();
    }
  });

  confirmBtn.addEventListener("click", () => {
    maybeStartMusic();
    popSound();
    $("#confirmacion").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  [whatsAppShare, calendarLink].forEach((link) => {
    link.addEventListener("click", popSound);
  });

  ageNumber.addEventListener("click", triggerAgeEgg);
  ageNumber.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") triggerAgeEgg();
  });

  attendanceNo.addEventListener("change", triggerNoAttendance);

  $$('input[name="gift"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.value === "No") triggerGiftNo();
      if (input.value === "Sí") triggerGiftYes();
    });
  });

  $$('input[name="drink"]').forEach((input) => {
    input.addEventListener("change", handleDrinkChange);
  });

  guestCrew.addEventListener("input", handleCrewInput);
  form.addEventListener("submit", submitRsvp);
  closeSuccess.addEventListener("click", () => {
    successCelebration.hidden = true;
  });

  dontTouch.addEventListener("click", unleashMemes);
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "b" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      toggleBolicheMode();
    }
  });

  window.addEventListener("pointermove", trackMouseParty, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    setupParticles();
  });
}

function init() {
  setupShareLinks();
  updateCountdown();
  setInterval(updateCountdown, 1000);
  revealOnScroll();
  resizeCanvas();
  setupParticles();
  animateParticles();
  bindEvents();
}

init();

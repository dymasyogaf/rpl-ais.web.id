// Navbar + menu logic
let navbar = null;
let mobileMenu = null;
let mobileMenuToggle = null;
let isNavbarScrollBound = false;

function syncNavElements() {
  navbar = document.getElementById("navbar");
  mobileMenu = document.getElementById("mobile-menu");
  mobileMenuToggle = document.getElementById("mobile-menu-toggle");
}

function handleNavbarScroll() {
  if (!navbar) return;
  if (window.scrollY > 50) {
    navbar.classList.add("bg-dark/80", "border-white/10", "shadow-lg");
    navbar.classList.remove("border-transparent");
  } else {
    navbar.classList.remove("bg-dark/80", "border-white/10", "shadow-lg");
    navbar.classList.add("border-transparent");
  }
}

function setMobileMenuExpanded(isExpanded) {
  syncNavElements();
  if (!mobileMenuToggle) return;
  mobileMenuToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
}

function toggleMobileMenu() {
  syncNavElements();
  if (!mobileMenu) return;
  const isNowHidden = mobileMenu.classList.toggle("hidden");
  setMobileMenuExpanded(!isNowHidden);
}

function initNavigation() {
  syncNavElements();

  if (navbar && !isNavbarScrollBound) {
    window.addEventListener("scroll", handleNavbarScroll);
    isNavbarScrollBound = true;
  }
  handleNavbarScroll();

  if (mobileMenuToggle && mobileMenuToggle.dataset.menuBound !== "true") {
    mobileMenuToggle.addEventListener("click", toggleMobileMenu);
    mobileMenuToggle.dataset.menuBound = "true";
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    if (anchor.dataset.scrollBound === "true") return;

    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (!targetId) return;
      if (targetId === "#") {
        e.preventDefault();
        return;
      }

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
        if (mobileMenu) mobileMenu.classList.add("hidden");
        setMobileMenuExpanded(false);
      }
    });

    anchor.dataset.scrollBound = "true";
  });
}

// Carousel logic
let carouselBound = false;
let slider = null;
let isDown = false;
let startX;
let scrollLeft;
const autoScrollSpeed = 0.5;
let isPaused = false;

function initStudentCarousel() {
  if (carouselBound) return;

  slider = document.getElementById("student-carousel");
  if (!slider) return;

  if (slider.dataset.loopReady !== "true") {
    const originalCards = Array.from(slider.children);
    originalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button, input, select, textarea").forEach((focusable) => {
        focusable.setAttribute("tabindex", "-1");
      });
      slider.appendChild(clone);
    });
    slider.dataset.loopReady = "true";
  }

  slider.addEventListener("mouseleave", () => {
    isDown = false;
    slider.classList.remove("active");
  });

  slider.addEventListener("mousedown", (e) => {
    isDown = true;
    slider.classList.add("active");
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });

  slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.classList.remove("active");
  });

  slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
  });

  slider.addEventListener("touchstart", () => {
    isPaused = true;
  });

  slider.addEventListener("touchend", () => {
    isPaused = false;
  });

  const autoScroll = () => {
    if (!isDown && !isPaused && slider) {
      slider.scrollLeft += autoScrollSpeed;
      const maxScroll = slider.scrollWidth / 2;
      if (maxScroll > 0 && slider.scrollLeft >= maxScroll) {
        slider.scrollLeft = 0;
      }
    }
    requestAnimationFrame(autoScroll);
  };

  carouselBound = true;
  autoScroll();
}

function handleSpotlight(e) {
  const card = e.currentTarget;
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  card.style.setProperty("--mouse-x", `${x}px`);
  card.style.setProperty("--mouse-y", `${y}px`);
}

function registerSpotlightCards(root = document) {
  const cards = root.querySelectorAll(".js-spotlight");
  cards.forEach((card) => {
    if (card.dataset.spotlightBound === "true") return;
    card.addEventListener("mousemove", handleSpotlight);
    card.dataset.spotlightBound = "true";
  });
}

/* GEMINI AI LOGIC */
let chatWindow = null;
let chatMessages = null;
let chatInput = null;
let chatForm = null;
const apiKey = ""; // Add your Gemini API key here

function syncChatElements() {
  chatWindow = document.getElementById("ai-chat-window");
  chatMessages = document.getElementById("chat-messages");
  chatInput = document.getElementById("chat-input");
  chatForm = document.getElementById("chat-form");
}

function initChatWidget() {
  syncChatElements();

  document.querySelectorAll(".js-toggle-chat").forEach((button) => {
    if (button.dataset.chatToggleBound === "true") return;
    button.addEventListener("click", toggleChat);
    button.dataset.chatToggleBound = "true";
  });

  if (chatForm && chatForm.dataset.chatSubmitBound !== "true") {
    chatForm.addEventListener("submit", handleChatSubmit);
    chatForm.dataset.chatSubmitBound = "true";
  }
}

function toggleChat() {
  syncChatElements();
  if (!chatWindow) return;
  chatWindow.classList.toggle("hidden");
  if (!chatWindow.classList.contains("hidden") && chatInput) chatInput.focus();
}

function appendMessage(text, sender) {
  syncChatElements();
  if (!chatMessages) return;
  const isUser = sender === "user";
  const div = document.createElement("div");
  div.className = `chat-row ${isUser ? "chat-row-user" : "chat-row-bot"}`;
  const avatar = isUser
    ? `<div class="chat-avatar chat-avatar-user"><i class="fa-solid fa-user"></i></div>`
    : `<div class="chat-avatar chat-avatar-bot">AI</div>`;
  const bubble = `<div class="chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-bot"}">${text}</div>`;
  div.innerHTML = isUser ? bubble + avatar : avatar + bubble;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  syncChatElements();
  if (!chatMessages) return;
  const div = document.createElement("div");
  div.id = "typing-indicator";
  div.className = "chat-row chat-row-bot";
  div.innerHTML = `<div class="chat-avatar chat-avatar-bot">AI</div><div class="chat-bubble chat-bubble-bot chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) indicator.remove();
}

async function handleChatSubmit(e) {
  e.preventDefault();
  syncChatElements();
  if (!chatInput) return;
  const message = chatInput.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  chatInput.value = "";
  showTyping();

  try {
    // Check if API key is configured
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const responseText = await fetchGeminiWithRetry(message);
    removeTyping();
    appendMessage(responseText, "bot");
  } catch (error) {
    removeTyping();
    appendMessage("Maaf, AI sedang sibuk. Coba lagi nanti ya! 🙏", "bot");
    console.error("Gemini Error:", error);
  }
}

async function fetchGeminiWithRetry(userQuery, retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const systemPrompt =
    "Kamu adalah asisten AI ramah untuk Jurusan RPL SMK IT Alhidayah. Jawab pertanyaan dengan santai, gaul, dan memotivasi.";
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if response has the expected structure
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        return data.candidates[0].content.parts[0].text;
      } else {
        return "Maaf, saya tidak mengerti pertanyaan Anda.";
      }
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err);
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, i)));
    }
  }
}

const SKILLS_DATA = [
  {
    name: "HTML5",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  },
  {
    name: "CSS3",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  },
  {
    name: "JavaScript",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  },
  {
    name: "TypeScript",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  },
  {
    name: "React",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  },
  {
    name: "Node.js",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  },
  {
    name: "Laravel",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg",
  },
  { name: "PHP", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" },
  {
    name: "Python",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  },
  {
    name: "MySQL",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  },
  {
    name: "Docker",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
  },
  { name: "Git", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
  {
    name: "WordPress",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg",
  },
  {
    name: "Vue.js",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
  },
  {
    name: "Next.js",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  },
  {
    name: "Tailwind CSS",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
  },
  {
    name: "Flutter",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
  },
  {
    name: "Firebase",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
  },
  {
    name: "Figma",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
  },
  {
    name: "Linux",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  },
];

let isThreeLoaded = false;
let threeLoadPromise = null;

function loadThreeJS() {
  if (isThreeLoaded) return Promise.resolve();
  if (threeLoadPromise) return threeLoadPromise;

  threeLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      isThreeLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Three.js"));
    document.head.appendChild(script);
  });

  return threeLoadPromise;
}

function checkWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function distributeOnSphere(count, radius) {
  if (count <= 0 || radius <= 0) return [];

  const positions = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angleIncrement = Math.PI * 2 * goldenRatio;

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1 || 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = angleIncrement * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    positions.push({ x: x * radius, y: y * radius, z: z * radius });
  }

  return positions;
}

function calculateResponsiveRadius(
  viewportWidth,
  desktopRadius = 280,
  mobileRadius = 210,
  breakpoint = 768,
) {
  return viewportWidth < breakpoint ? mobileRadius : desktopRadius;
}

class SkillsSphere {
  constructor(container, skills) {
    this.container = container;
    this.skills = skills;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphereGroup = null;
    this.nodes = [];
    this.raycaster = null;
    this.mouse = { x: 0, y: 0 };
    this.animationFrameId = null;
    this.intersectionObserver = null;
    this.isDragging = false;
    this.lastPosition = { x: 0, y: 0 };
    this.momentum = { x: 0, y: 0 };
    this.dragSensitivity = 0.005;
    this.momentumDecay = 0.95;
    this.autoRotateSpeed = 0.002;
    this.lastInteractionTime = 0;
    this.currentRadius = 280;
    this.isVisible = true;
    this.boundResize = () => this.handleResize();
  }

  async init() {
    if (!this.container) return;
    if (!checkWebGLSupport()) {
      this.showFallback();
      return;
    }

    try {
      await loadThreeJS();
      await this.initThree();
    } catch {
      this.showFallback();
    }
  }

  getResponsiveRadius() {
    return calculateResponsiveRadius(window.innerWidth, 280, 210, 768);
  }

  async initThree() {
    const THREE = window.THREE;
    if (!THREE) return;

    const canvas = this.container.querySelector("#skills-sphere-canvas");
    if (!canvas) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.currentRadius = this.getResponsiveRadius();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = this.currentRadius * 2.5;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.sphereGroup = new THREE.Group();
    this.scene.add(this.sphereGroup);
    this.raycaster = new THREE.Raycaster();

    const textureMap = await this.preloadTextures();
    this.createNodes(textureMap);

    this.container.classList.remove("loading");
    this.setupEventListeners();
    this.setupVisibilityObserver();
    this.animate();
  }

  preloadTextures() {
    const THREE = window.THREE;
    if (!THREE) return Promise.resolve(new Map());

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const textureMap = new Map();

    const loaders = this.skills.map(
      (skill) =>
        new Promise((resolve) => {
          textureLoader.load(
            skill.icon,
            (texture) => {
              if ("colorSpace" in texture && THREE.SRGBColorSpace) {
                texture.colorSpace = THREE.SRGBColorSpace;
              } else if (THREE.sRGBEncoding) {
                texture.encoding = THREE.sRGBEncoding;
              }
              textureMap.set(skill.icon, texture);
              resolve();
            },
            undefined,
            () => {
              textureMap.set(skill.icon, null);
              resolve();
            },
          );
        }),
    );

    return Promise.all(loaders).then(() => textureMap);
  }

  createCircleTexture() {
    const THREE = window.THREE;
    if (!THREE) return null;

    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createNodes(textureMap) {
    const THREE = window.THREE;
    if (!THREE || !this.sphereGroup) return;

    const radius = this.getResponsiveRadius();
    const positions = distributeOnSphere(this.skills.length, radius);
    const nodeSize = radius * 0.25;
    const circleTexture = this.createCircleTexture();
    const backplateMaterial = new THREE.SpriteMaterial({
      map: circleTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      depthTest: false,
    });

    this.skills.forEach((skill, index) => {
      const position = positions[index];
      if (!position) return;
      const texture = textureMap.get(skill.icon);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture || null,
        color: texture ? 0xffffff : 0x9ca3af,
        transparent: true,
        opacity: 1,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(position.x, position.y, position.z);
      sprite.scale.set(nodeSize, nodeSize, 1);
      sprite.userData = { baseScale: nodeSize };

      // Backplate membuat ikon gelap tetap terlihat di background gelap.
      const backplate = new THREE.Sprite(backplateMaterial);
      backplate.scale.set(1.4, 1.4, 1);
      backplate.position.set(0, 0, -0.01);
      sprite.add(backplate);

      this.sphereGroup.add(sprite);
      this.nodes.push(sprite);
    });
  }

  setupEventListeners() {
    const canvas = this.container.querySelector("#skills-sphere-canvas");
    if (!canvas) return;

    canvas.addEventListener("mousedown", (event) => this.handleMouseDown(event));
    canvas.addEventListener("mousemove", (event) => this.handleMouseMove(event));
    window.addEventListener("mouseup", () => this.handleMouseUp());
    canvas.addEventListener("touchstart", (event) => this.handleTouchStart(event), {
      passive: false,
    });
    canvas.addEventListener("touchmove", (event) => this.handleTouchMove(event), {
      passive: false,
    });
    window.addEventListener("touchend", () => this.handleTouchEnd());
    window.addEventListener("resize", this.boundResize);
  }

  setupVisibilityObserver() {
    if (typeof IntersectionObserver === "undefined") return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { root: null, rootMargin: "50px", threshold: 0.1 },
    );

    this.intersectionObserver.observe(this.container);
  }

  handleMouseDown(event) {
    event.preventDefault();
    this.isDragging = true;
    this.lastPosition = { x: event.clientX, y: event.clientY };
    this.momentum = { x: 0, y: 0 };
    this.lastInteractionTime = Date.now();
  }

  handleMouseMove(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.isDragging || !this.sphereGroup) return;

    const deltaX = event.clientX - this.lastPosition.x;
    const deltaY = event.clientY - this.lastPosition.y;
    this.sphereGroup.rotation.y += deltaX * this.dragSensitivity;
    this.sphereGroup.rotation.x += deltaY * this.dragSensitivity;
    this.momentum.x = deltaY * this.dragSensitivity;
    this.momentum.y = deltaX * this.dragSensitivity;
    this.lastPosition = { x: event.clientX, y: event.clientY };
    this.lastInteractionTime = Date.now();
  }

  handleMouseUp() {
    this.isDragging = false;
    this.lastInteractionTime = Date.now();
  }

  handleTouchStart(event) {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.isDragging = true;
    this.lastPosition = { x: touch.clientX, y: touch.clientY };
    this.momentum = { x: 0, y: 0 };
    this.lastInteractionTime = Date.now();
  }

  handleTouchMove(event) {
    if (event.touches.length !== 1 || !this.sphereGroup) return;
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.isDragging) return;
    const deltaX = touch.clientX - this.lastPosition.x;
    const deltaY = touch.clientY - this.lastPosition.y;
    this.sphereGroup.rotation.y += deltaX * this.dragSensitivity;
    this.sphereGroup.rotation.x += deltaY * this.dragSensitivity;
    this.momentum.x = deltaY * this.dragSensitivity;
    this.momentum.y = deltaX * this.dragSensitivity;
    this.lastPosition = { x: touch.clientX, y: touch.clientY };
    this.lastInteractionTime = Date.now();
  }

  handleTouchEnd() {
    this.isDragging = false;
    this.lastInteractionTime = Date.now();
  }

  handleResize() {
    if (!this.renderer || !this.camera || !this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    const newRadius = this.getResponsiveRadius();
    const oldRadius = this.currentRadius || 280;
    if (Math.abs(newRadius - oldRadius) > 1) {
      this.currentRadius = newRadius;
      this.repositionNodes(newRadius);
      this.camera.position.z = newRadius * 2.5;
    }
  }

  repositionNodes(newRadius) {
    if (!this.nodes.length) return;
    const positions = distributeOnSphere(this.nodes.length, newRadius);
    const nodeSize = newRadius * 0.25;

    this.nodes.forEach((node, index) => {
      const pos = positions[index];
      if (!node || !pos) return;
      node.position.set(pos.x, pos.y, pos.z);
      node.userData.baseScale = nodeSize;
      node.scale.set(nodeSize, nodeSize, 1);
    });
  }

  updateMomentum() {
    if (this.isDragging || !this.sphereGroup) return;

    const hasMomentum = Math.abs(this.momentum.x) > 0.0001 || Math.abs(this.momentum.y) > 0.0001;
    if (hasMomentum) {
      this.sphereGroup.rotation.x += this.momentum.x;
      this.sphereGroup.rotation.y += this.momentum.y;
      this.momentum.x *= this.momentumDecay;
      this.momentum.y *= this.momentumDecay;
      if (Math.abs(this.momentum.x) < 0.0001) this.momentum.x = 0;
      if (Math.abs(this.momentum.y) < 0.0001) this.momentum.y = 0;
      return;
    }

    const idleTime = Date.now() - this.lastInteractionTime;
    if (idleTime > 3000) {
      this.sphereGroup.rotation.y += this.autoRotateSpeed;
    }
  }

  updateBillboards() {
    if (!this.camera) return;
    this.nodes.forEach((node) => {
      node.quaternion.copy(this.camera.quaternion);
    });
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (!this.isVisible) return;
    this.updateMomentum();
    this.updateBillboards();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  showFallback() {
    const fallbackGrid = this.container.querySelector("[data-skills-fallback]");
    const canvas = this.container.querySelector("#skills-sphere-canvas");
    if (fallbackGrid) fallbackGrid.style.display = "grid";
    if (canvas) canvas.style.display = "none";
    this.container.classList.remove("loading");
  }
}

function initSkillsGlobe() {
  const container = document.getElementById("skills-globe");
  if (!container) return;
  if (container.dataset.skillsGlobeInitialized === "true") return;
  container.dataset.skillsGlobeInitialized = "true";

  const sphere = new SkillsSphere(container, SKILLS_DATA);
  sphere.init();
}

function initializeUI() {
  initNavigation();
  initStudentCarousel();
  initChatWidget();
  registerSpotlightCards();
  initSkillsGlobe();
}

// Initialize on first load and after dynamic sections are injected.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUI);
} else {
  initializeUI();
}

document.addEventListener("components:loaded", initializeUI);

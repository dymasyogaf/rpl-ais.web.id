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
    name: "HTML & CSS",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
    category: "programming",
    level: "Dasar",
    description: "Fondasi utama untuk membangun struktur dan tampilan website modern.",
  },
  {
    name: "JavaScript",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
    category: "programming",
    level: "Menengah",
    description: "Standar interaktivitas web untuk membuat antarmuka terasa hidup.",
  },
  {
    name: "TypeScript",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    category: "programming",
    level: "Menengah",
    description: "Versi JavaScript dengan type system yang lebih aman untuk project besar.",
  },
  {
    name: "Python",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
    category: "programming",
    level: "Dasar",
    description: "Populer untuk data science, AI, automasi, dan backend sederhana.",
  },
  {
    name: "PHP",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
    category: "programming",
    level: "Dasar",
    description: "Bahasa web klasik yang tetap kuat, terutama dalam ekosistem Laravel.",
  },
  {
    name: "Go",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg",
    category: "programming",
    level: "Menengah",
    description: "Bahasa buatan Google yang cepat dan efisien untuk backend skala besar.",
  },
  {
    name: "Java",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
    category: "programming",
    level: "Dasar",
    description: "Salah satu standar utama untuk pengembangan aplikasi Android.",
  },
  {
    name: "Kotlin",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg",
    category: "programming",
    level: "Menengah",
    description: "Bahasa modern untuk Android yang ringkas dan aman.",
  },
  {
    name: "Swift",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg",
    category: "programming",
    level: "Menengah",
    description: "Bahasa utama untuk pengembangan aplikasi iOS dan macOS.",
  },
  {
    name: "React",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    category: "frameworks",
    level: "Menengah",
    description: "Library frontend populer untuk membangun UI berbasis komponen.",
  },
  {
    name: "Vue",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
    category: "frameworks",
    level: "Menengah",
    description: "Framework frontend yang ringan dan mudah dipelajari untuk UI modern.",
  },
  {
    name: "Angular",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg",
    category: "frameworks",
    level: "Menengah",
    description: "Framework frontend lengkap untuk aplikasi web yang kompleks.",
  },
  {
    name: "Laravel",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg",
    category: "frameworks",
    level: "Menengah",
    description: "Framework PHP populer dengan struktur rapi dan fitur lengkap.",
  },
  {
    name: "Express.js",
    icon: "https://cdn.simpleicons.org/express/FFFFFF",
    category: "frameworks",
    level: "Dasar",
    description: "Framework backend minimalis untuk Node.js dan pembuatan API.",
  },
  {
    name: "Django",
    icon: "https://cdn.simpleicons.org/django/44B78B",
    category: "frameworks",
    level: "Menengah",
    description: "Framework Python yang fokus pada keamanan dan kecepatan development.",
  },
  {
    name: "Flutter",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
    category: "frameworks",
    level: "Menengah",
    description: "Framework lintas platform dari Google untuk Android dan iOS.",
  },
  {
    name: "MySQL",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
    category: "database",
    level: "Dasar",
    description: "Database SQL relasional yang stabil dan umum digunakan.",
  },
  {
    name: "PostgreSQL",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
    category: "database",
    level: "Menengah",
    description: "Database relasional kuat untuk kebutuhan data yang kompleks.",
  },
  {
    name: "MongoDB",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
    category: "database",
    level: "Menengah",
    description: "Database NoSQL dengan format dokumen mirip JSON yang fleksibel.",
  },
  {
    name: "Redis",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
    category: "database",
    level: "Menengah",
    description: "In-memory database untuk caching agar aplikasi lebih cepat.",
  },
  {
    name: "VS Code",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg",
    category: "tools",
    level: "Dasar",
    description: "Code editor utama dengan ekosistem extension yang sangat lengkap.",
  },
  {
    name: "Git",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
    category: "tools",
    level: "Dasar",
    description: "Version control untuk melacak perubahan kode secara terstruktur.",
  },
  {
    name: "GitHub",
    icon: "https://cdn.simpleicons.org/github/FFFFFF",
    category: "tools",
    level: "Dasar",
    description: "Platform kolaborasi repository untuk tim pengembang.",
  },
  {
    name: "GitLab",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg",
    category: "tools",
    level: "Dasar",
    description: "Alternatif platform kolaborasi DevOps dan manajemen codebase.",
  },
  {
    name: "Postman",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg",
    category: "tools",
    level: "Dasar",
    description: "Tool populer untuk mencoba, menguji, dan mendokumentasikan API.",
  },
  {
    name: "Docker",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
    category: "tools",
    level: "Menengah",
    description: "Container platform agar aplikasi konsisten di berbagai environment.",
  },
  {
    name: "Cloudflare",
    icon: "https://cdn.simpleicons.org/cloudflare/F38020",
    category: "cloud",
    level: "Menengah",
    description: "Layanan keamanan, CDN, SSL, dan manajemen domain untuk website.",
  },
  {
    name: "Vercel",
    icon: "https://cdn.simpleicons.org/vercel/FFFFFF",
    category: "cloud",
    level: "Dasar",
    description: "Platform deployment praktis untuk aplikasi frontend modern.",
  },
  {
    name: "Netlify",
    icon: "https://cdn.simpleicons.org/netlify/00C7B7",
    category: "cloud",
    level: "Dasar",
    description: "Alternatif deployment frontend dengan workflow yang simpel.",
  },
  {
    name: "AWS",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/960px-Amazon_Web_Services_Logo.svg.png",
    category: "cloud",
    level: "Lanjutan",
    description: "Penyedia infrastruktur cloud skala enterprise dengan layanan lengkap.",
  },
  {
    name: "Google Cloud",
    icon: "https://cdn.simpleicons.org/googlecloud/4285F4",
    category: "cloud",
    level: "Lanjutan",
    description: "Platform cloud Google untuk compute, storage, database, dan AI.",
  },
  {
    name: "Azure",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
    category: "cloud",
    level: "Lanjutan",
    description: "Platform cloud Microsoft untuk integrasi aplikasi dan enterprise system.",
  },
  {
    name: "DigitalOcean",
    icon: "https://cdn.simpleicons.org/digitalocean/0080FF",
    category: "cloud",
    level: "Dasar",
    description: "Penyedia VPS yang ramah pemula dengan biaya lebih terjangkau.",
  },
];

const SKILL_TRACK_LABELS = {
  all: "Semua Kategori",
  programming: "Bahasa Pemrograman & Markup",
  frameworks: "Frameworks & Libraries",
  database: "Database Management",
  tools: "Development Tools",
  cloud: "Deployment & Cloud",
};

function filterSkillsByCategory(skills, category) {
  if (category === "all") return skills;
  return skills.filter((skill) => skill.category === category);
}

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
  constructor(container, skills, options = {}) {
    this.container = container;
    this.allSkills = Array.isArray(skills) ? [...skills] : [];
    this.skills = Array.isArray(skills) ? [...skills] : [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphereGroup = null;
    this.nodes = [];
    this.raycaster = null;
    this.mouse = { x: 2, y: 2 };
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
    this.textureMap = new Map();
    this.canvas = null;
    this.backplateMaterial = null;
    this.haloTexture = null;
    this.ringTexture = null;
    this.hoveredNode = null;
    this.selectedSkill = this.skills[0] || null;
    this.lastEmittedSkillName = "";
    this.pressEffect = { skillName: "", startedAt: 0, duration: 320 };
    this.touchMoved = false;
    this.hasWebGL = false;
    this.onSkillFocus = typeof options.onSkillFocus === "function" ? options.onSkillFocus : () => {};
    this.boundResize = () => this.handleResize();
  }

  async init() {
    if (!this.container) return;
    if (!checkWebGLSupport()) {
      this.hasWebGL = false;
      this.showFallback();
      this.emitSkillFocus(this.selectedSkill);
      return;
    }

    try {
      await loadThreeJS();
      await this.initThree();
      this.hasWebGL = true;
    } catch {
      this.hasWebGL = false;
      this.showFallback();
    }
    this.emitSkillFocus(this.selectedSkill);
  }

  getResponsiveRadius() {
    return calculateResponsiveRadius(window.innerWidth, 280, 210, 768);
  }

  async initThree() {
    const THREE = window.THREE;
    if (!THREE) return;

    const canvas = this.container.querySelector("#skills-sphere-canvas");
    if (!canvas) return;
    this.canvas = canvas;

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

    this.textureMap = await this.preloadTextures();
    this.createNodes(this.textureMap);

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

    const loaders = this.allSkills.map(
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

  createRingTexture() {
    const THREE = window.THREE;
    if (!THREE) return null;

    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const center = size / 2;
    const radius = size * 0.44;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createNodes(textureMap) {
    const THREE = window.THREE;
    if (!THREE || !this.sphereGroup || !this.skills.length) return;

    const radius = this.getResponsiveRadius();
    const positions = distributeOnSphere(this.skills.length, radius);
    const nodeSize = radius * 0.25;
    const INVERT_ON_LIGHT_BADGE_SKILLS = new Set(["Express.js", "GitHub", "Vercel"]);
    const LAYER_ORDER = {
      shadow: 5,
      backplate: 10,
      ring: 15,
      halo: 20,
      icon: 30,
    };

    if (!this.haloTexture) {
      const circleTexture = this.createCircleTexture();
      this.haloTexture = circleTexture;
    }
    if (!this.ringTexture) {
      this.ringTexture = this.createRingTexture();
    }

    this.skills.forEach((skill, index) => {
      const position = positions[index];
      if (!position) return;
      const texture = textureMap.get(skill.icon);
      const iconColor = INVERT_ON_LIGHT_BADGE_SKILLS.has(skill.name) ? 0x0f172a : 0xffffff;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture || null,
        color: texture ? iconColor : 0x9ca3af,
        transparent: true,
        opacity: 0.98,
        alphaTest: 0.03,
        depthWrite: false,
        depthTest: false,
      });

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(position.x, position.y, position.z);
      sprite.scale.set(nodeSize, nodeSize, 1);
      sprite.renderOrder = LAYER_ORDER.icon;
      sprite.userData = {
        baseScale: nodeSize,
        skill,
        haloMaterial: null,
        backplateMaterial: null,
        ringMaterial: null,
        shadowMaterial: null,
      };

      const haloMaterial = new THREE.SpriteMaterial({
        map: this.haloTexture,
        color: 0x22d3ee,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      });
      const halo = new THREE.Sprite(haloMaterial);
      halo.scale.set(1.85, 1.85, 1);
      halo.position.set(0, 0, -0.02);
      halo.renderOrder = LAYER_ORDER.halo;
      sprite.add(halo);
      sprite.userData.haloMaterial = haloMaterial;

      // Shadow tipis agar badge terpisah dari background.
      const shadowMaterial = new THREE.SpriteMaterial({
        map: this.haloTexture,
        color: 0x020617,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        depthTest: false,
      });
      const shadow = new THREE.Sprite(shadowMaterial);
      shadow.scale.set(1.62, 1.62, 1);
      shadow.position.set(0, 0, -0.013);
      shadow.renderOrder = LAYER_ORDER.shadow;
      sprite.add(shadow);
      sprite.userData.shadowMaterial = shadowMaterial;

      // Semua logo mendapat badge terang supaya icon gelap tetap terlihat.
      const backplateMaterial = new THREE.SpriteMaterial({
        map: this.haloTexture,
        color: 0xf8fafc,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        depthTest: false,
      });
      const backplate = new THREE.Sprite(backplateMaterial);
      backplate.scale.set(1.36, 1.36, 1);
      backplate.position.set(0, 0, -0.01);
      backplate.renderOrder = LAYER_ORDER.backplate;
      sprite.add(backplate);
      sprite.userData.backplateMaterial = backplateMaterial;

      const ringMaterial = new THREE.SpriteMaterial({
        map: this.ringTexture,
        color: 0x1d4ed8,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        depthTest: false,
      });
      const ring = new THREE.Sprite(ringMaterial);
      ring.scale.set(1.46, 1.46, 1);
      ring.position.set(0, 0, -0.012);
      ring.renderOrder = LAYER_ORDER.ring;
      sprite.add(ring);
      sprite.userData.ringMaterial = ringMaterial;

      this.sphereGroup.add(sprite);
      this.nodes.push(sprite);
    });

    this.refreshNodeStates();
  }

  clearNodes() {
    if (!this.sphereGroup || !this.nodes.length) return;
    this.nodes.forEach((node) => {
      if (node && node.material && typeof node.material.dispose === "function") {
        node.material.dispose();
      }
      if (node && node.userData && node.userData.haloMaterial) {
        node.userData.haloMaterial.dispose();
      }
      if (node && node.userData && node.userData.backplateMaterial) {
        node.userData.backplateMaterial.dispose();
      }
      if (node && node.userData && node.userData.ringMaterial) {
        node.userData.ringMaterial.dispose();
      }
      if (node && node.userData && node.userData.shadowMaterial) {
        node.userData.shadowMaterial.dispose();
      }
      if (node) this.sphereGroup.remove(node);
    });
    this.nodes = [];
    this.hoveredNode = null;
  }

  setSkills(nextSkills) {
    const safeSkills = Array.isArray(nextSkills) ? [...nextSkills] : [];
    this.skills = safeSkills;
    if (!this.skills.length) {
      this.selectedSkill = null;
      this.emitSkillFocus(null);
      return;
    }

    const selectedStillVisible = this.selectedSkill
      ? this.skills.some((skill) => skill.name === this.selectedSkill.name)
      : false;
    if (!selectedStillVisible) {
      this.selectedSkill = this.skills[0];
    }

    if (!this.sphereGroup) {
      this.emitSkillFocus(this.selectedSkill);
      return;
    }

    this.clearNodes();
    this.createNodes(this.textureMap);
    this.currentRadius = this.getResponsiveRadius();
    if (this.camera) this.camera.position.z = this.currentRadius * 2.5;
    this.emitSkillFocus(this.selectedSkill);
  }

  setSelectedSkill(skill) {
    if (!skill) return;
    this.selectedSkill = skill;
    this.triggerPressEffect(skill);
    this.refreshNodeStates();
    this.emitSkillFocus(skill);
  }

  setupEventListeners() {
    const canvas = this.container.querySelector("#skills-sphere-canvas");
    if (!canvas) return;

    canvas.addEventListener("mousedown", (event) => this.handleMouseDown(event));
    canvas.addEventListener("mousemove", (event) => this.handleMouseMove(event));
    canvas.addEventListener("mouseleave", () => this.handlePointerLeave());
    canvas.addEventListener("click", (event) => this.handlePointerClick(event));
    window.addEventListener("mouseup", () => this.handleMouseUp());
    canvas.addEventListener("touchstart", (event) => this.handleTouchStart(event), {
      passive: false,
    });
    canvas.addEventListener("touchmove", (event) => this.handleTouchMove(event), {
      passive: false,
    });
    window.addEventListener("touchend", (event) => this.handleTouchEnd(event), {
      passive: false,
    });
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

  setMouseFromClient(clientX, clientY) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  pickNodeFromClient(clientX, clientY) {
    if (!this.raycaster || !this.camera || !this.nodes.length) return null;
    this.setMouseFromClient(clientX, clientY);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersections = this.raycaster.intersectObjects(this.nodes, false);
    return intersections.length ? intersections[0].object : null;
  }

  handleMouseDown(event) {
    event.preventDefault();
    this.isDragging = true;
    if (this.canvas) this.canvas.style.cursor = "grabbing";
    this.lastPosition = { x: event.clientX, y: event.clientY };
    this.momentum = { x: 0, y: 0 };
  }

  handleMouseMove(event) {
    this.setMouseFromClient(event.clientX, event.clientY);
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

  handlePointerClick(event) {
    const node = this.pickNodeFromClient(event.clientX, event.clientY);
    const pickedSkill = node && node.userData ? node.userData.skill : null;
    if (!pickedSkill) return;
    this.selectedSkill = pickedSkill;
    this.triggerPressEffect(pickedSkill);
    this.refreshNodeStates();
    this.emitSkillFocus(pickedSkill);
  }

  handlePointerLeave() {
    this.mouse = { x: 2, y: 2 };
    this.hoveredNode = null;
    if (this.canvas) this.canvas.style.cursor = "grab";
    this.refreshNodeStates();
    this.emitSkillFocus(this.selectedSkill);
  }

  handleMouseUp() {
    this.isDragging = false;
    if (this.canvas) {
      this.canvas.style.cursor = this.hoveredNode ? "pointer" : "grab";
    }
  }

  handleTouchStart(event) {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.touchMoved = false;
    this.isDragging = true;
    this.lastPosition = { x: touch.clientX, y: touch.clientY };
    this.momentum = { x: 0, y: 0 };
  }

  handleTouchMove(event) {
    if (event.touches.length !== 1 || !this.sphereGroup) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.setMouseFromClient(touch.clientX, touch.clientY);

    if (!this.isDragging) return;
    const deltaX = touch.clientX - this.lastPosition.x;
    const deltaY = touch.clientY - this.lastPosition.y;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) this.touchMoved = true;
    this.sphereGroup.rotation.y += deltaX * this.dragSensitivity;
    this.sphereGroup.rotation.x += deltaY * this.dragSensitivity;
    this.momentum.x = deltaY * this.dragSensitivity;
    this.momentum.y = deltaX * this.dragSensitivity;
    this.lastPosition = { x: touch.clientX, y: touch.clientY };
    this.lastInteractionTime = Date.now();
  }

  handleTouchEnd(event) {
    if (!this.touchMoved && event.changedTouches && event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const node = this.pickNodeFromClient(touch.clientX, touch.clientY);
      const pickedSkill = node && node.userData ? node.userData.skill : null;
      if (pickedSkill) {
        this.selectedSkill = pickedSkill;
        this.triggerPressEffect(pickedSkill);
        this.emitSkillFocus(pickedSkill);
      }
    }
    this.touchMoved = false;
    this.isDragging = false;
    this.refreshNodeStates();
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

    this.refreshNodeStates();
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

  updateHoverState() {
    if (!this.raycaster || !this.camera || !this.nodes.length || this.isDragging) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersections = this.raycaster.intersectObjects(this.nodes, false);
    const nextHover = intersections.length ? intersections[0].object : null;
    if (this.canvas) this.canvas.style.cursor = nextHover ? "pointer" : "grab";

    if (nextHover !== this.hoveredNode) {
      this.hoveredNode = nextHover;
      this.refreshNodeStates();
    }

    if (this.hoveredNode && this.hoveredNode.userData && this.hoveredNode.userData.skill) {
      this.emitSkillFocus(this.hoveredNode.userData.skill);
      return;
    }
    this.emitSkillFocus(this.selectedSkill);
  }

  refreshNodeStates() {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.nodes.forEach((node) => {
      if (!node || !node.userData) return;
      const skill = node.userData.skill;
      const isSelected = this.selectedSkill ? this.selectedSkill.name === skill.name : false;
      const isHovered = node === this.hoveredNode;
      let pressBoost = 0;
      if (this.pressEffect.skillName && this.pressEffect.skillName === skill.name) {
        const elapsed = now - this.pressEffect.startedAt;
        if (elapsed < this.pressEffect.duration) {
          const progress = elapsed / this.pressEffect.duration;
          pressBoost = Math.sin(progress * Math.PI) * 0.26;
        } else {
          this.pressEffect.skillName = "";
        }
      }
      const scaleMultiplier = (isHovered ? 1.22 : isSelected ? 1.12 : 1) + pressBoost;
      const opacity = isHovered || isSelected ? 1 : 0.92;
      const haloOpacity = (isHovered ? 0.26 : isSelected ? 0.14 : 0) + pressBoost * 0.7;
      const haloScale = 1.85 + pressBoost * 0.7 + (isHovered ? 0.12 : 0);

      node.scale.set(
        node.userData.baseScale * scaleMultiplier,
        node.userData.baseScale * scaleMultiplier,
        1,
      );
      if (node.material) node.material.opacity = opacity;
      if (node.userData.haloMaterial) {
        node.userData.haloMaterial.opacity = Math.min(0.4, haloOpacity);
      }
      const haloSprite = node.children && node.children[0];
      if (haloSprite) haloSprite.scale.set(haloScale, haloScale, 1);
    });
  }

  triggerPressEffect(skill) {
    if (!skill || !skill.name) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.pressEffect.skillName = skill.name;
    this.pressEffect.startedAt = now;
  }

  emitSkillFocus(skill) {
    const targetSkill = skill || null;
    const skillName = targetSkill ? targetSkill.name : "";
    if (skillName === this.lastEmittedSkillName) return;
    this.lastEmittedSkillName = skillName;
    this.onSkillFocus(targetSkill);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    if (!this.isVisible) return;
    this.updateMomentum();
    this.updateBillboards();
    this.updateHoverState();
    this.refreshNodeStates();
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

  const legacyFilterButtons = document.querySelectorAll("[data-skill-filter]");
  const filterSelect = document.querySelector("[data-skill-filter-select]");
  const fallbackGrid = container.querySelector("[data-skills-fallback]");
  const insightTrack = document.querySelector("[data-skill-track]");
  const insightName = document.querySelector("[data-skill-name]");
  const insightDescription = document.querySelector("[data-skill-description]");
  const skillCatalog = document.querySelector("[data-skill-catalog]");
  const allSkills = [...SKILLS_DATA];

  let activeCategory = "all";
  let filteredSkills = filterSkillsByCategory(allSkills, activeCategory);
  let activeSkill = filteredSkills[0] || null;

  const INSIGHT_CATEGORY_CONTEXT = {
    programming:
      "Dasar dari semua aplikasi. Kamu biasanya memilih ini berdasarkan platform yang ingin dibangun.",
    frameworks:
      "Kumpulan kode siap pakai agar kamu tidak perlu membuat roda dari awal.",
    database:
      "Tempat aplikasi menyimpan informasi seperti akun pengguna atau transaksi.",
    tools:
      "Alat yang kamu gunakan setiap hari di depan layar monitor.",
    cloud:
      "Tempat aplikasi kamu hidup agar bisa diakses orang lain di seluruh dunia.",
  };

  const getDetailedInsightDescription = (skill) => {
    if (!skill) return "";
    const context = INSIGHT_CATEGORY_CONTEXT[skill.category] || "";
    return `${skill.description} ${context}`.trim();
  };

  const updateInsight = (skill) => {
    const safeSkill = skill || activeSkill;
    if (!safeSkill) return;

    if (insightTrack) {
      insightTrack.textContent = SKILL_TRACK_LABELS[safeSkill.category] || safeSkill.category;
    }
    if (insightName) insightName.textContent = safeSkill.name;
    if (insightDescription) insightDescription.textContent = getDetailedInsightDescription(safeSkill);
  };

  const renderFallback = () => {
    if (!fallbackGrid) return;
    fallbackGrid.innerHTML = "";
    allSkills.forEach((skill) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "skills-sphere-fallback-item";
      if (activeSkill && activeSkill.name === skill.name) {
        button.classList.add("is-active");
      }
      button.setAttribute(
        "aria-label",
        `${skill.name} (${SKILL_TRACK_LABELS[skill.category] || skill.category})`,
      );
      button.innerHTML = `<img src="${skill.icon}" alt="${skill.name}" loading="lazy" decoding="async">`;
      button.addEventListener("click", () => {
        activeSkill = skill;
        sphere.setSelectedSkill(skill);
        updateInsight(skill);
        renderFallback();
        renderCatalog();
      });
      fallbackGrid.appendChild(button);
    });
  };

  const renderCatalog = () => {
    if (!skillCatalog) return;
    skillCatalog.innerHTML = "";
    filteredSkills.forEach((skill) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "skills-catalog-item";
      const isActive = activeSkill && activeSkill.name === skill.name;
      if (isActive) item.classList.add("is-active");
      item.setAttribute("aria-pressed", isActive ? "true" : "false");
      item.setAttribute("aria-label", `${skill.name} - ${skill.description}`);
      item.innerHTML = `
        <span class="skills-catalog-item-icon">
          <img src="${skill.icon}" alt="${skill.name}" loading="lazy" decoding="async">
        </span>
        <span class="skills-catalog-item-body">
          <span class="skills-catalog-item-name">${skill.name}</span>
        </span>
      `;
      item.addEventListener("click", () => {
        activeSkill = skill;
        sphere.setSelectedSkill(skill);
        updateInsight(skill);
        renderFallback();
        renderCatalog();
      });
      skillCatalog.appendChild(item);
    });
  };

  const updateFilterControls = () => {
    legacyFilterButtons.forEach((button) => {
      const isActive = button.dataset.skillFilter === activeCategory;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    if (filterSelect) filterSelect.value = activeCategory;
  };

  const sphere = new SkillsSphere(container, SKILLS_DATA, {
    onSkillFocus: (skill) => {
      if (!skill) return;
      activeSkill = skill;
      updateInsight(skill);
      renderFallback();
      renderCatalog();
    },
  });

  const applyCategoryFilter = (category) => {
    activeCategory = category;
    filteredSkills = filterSkillsByCategory(allSkills, activeCategory);
    if (!filteredSkills.length) return;

    if (!activeSkill || !filteredSkills.some((skill) => skill.name === activeSkill.name)) {
      activeSkill = filteredSkills[0];
    }

    updateFilterControls();
    updateInsight(activeSkill);
    renderFallback();
    renderCatalog();
    sphere.setSelectedSkill(activeSkill);
  };

  legacyFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.skillFilter;
      if (!category || category === activeCategory) return;
      applyCategoryFilter(category);
    });
  });

  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      const category = filterSelect.value;
      if (!category || category === activeCategory) return;
      applyCategoryFilter(category);
    });
  }

  applyCategoryFilter(activeCategory);
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

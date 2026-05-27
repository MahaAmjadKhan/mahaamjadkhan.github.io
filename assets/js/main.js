(() => {
  const body = document.body;
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const xpFill = document.querySelector(".xp-bar span");
  const cursorLight = document.querySelector(".cursor-light");
  const revealItems = document.querySelectorAll(".reveal");
  const sections = [...document.querySelectorAll("main section[id]")];
  const filterButtons = document.querySelectorAll("[data-filter]");
  const projectCards = document.querySelectorAll(".project-card");
  const tiltCards = document.querySelectorAll(".project-card, .player-card");
  const gameCanvas = document.querySelector("#support-game");
  const gameStart = document.querySelector("#game-start");
  const gameOverlay = document.querySelector("#game-overlay");
  const scoreEl = document.querySelector("#game-score");
  const livesEl = document.querySelector("#game-lives");
  const streakEl = document.querySelector("#game-streak");
  const moveButtons = document.querySelectorAll("[data-move]");

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    xpFill.style.width = `${amount}%`;
  };

  const setActiveNav = () => {
    let current = null;
    sections.forEach((section) => {
      if (window.scrollY + 140 >= section.offsetTop) {
        current = section;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", current && link.getAttribute("href") === `#${current.id}`);
    });
  };

  navToggle?.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.innerHTML = isOpen ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      navToggle?.setAttribute("aria-expanded", "false");
      if (navToggle) {
        navToggle.innerHTML = '<i class="bi bi-list"></i>';
      }
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      projectCards.forEach((card) => {
        const show = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !show);
        card.classList.remove("is-selected");
      });
    });
  });

  projectCards.forEach((card) => {
    const selectCard = () => {
      projectCards.forEach((item) => item.classList.toggle("is-selected", item === card));
    };

    card.addEventListener("click", selectCard);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCard();
      }
    });
  });

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -6}deg) rotateY(${x * 7}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  window.addEventListener("pointermove", (event) => {
    if (!cursorLight) return;
    cursorLight.style.left = `${event.clientX}px`;
    cursorLight.style.top = `${event.clientY}px`;
  }, { passive: true });

  window.addEventListener("scroll", () => {
    updateProgress();
    setActiveNav();
  }, { passive: true });

  const setupSupportGame = () => {
    if (!gameCanvas || !gameStart || !scoreEl || !livesEl || !streakEl) return;

    const ctx = gameCanvas.getContext("2d");
    const keys = new Set();
    const touchMove = { left: false, right: false };
    const player = { x: 360, y: 360, width: 74, height: 24, speed: 360 };
    const state = {
      active: false,
      score: 0,
      lives: 3,
      streak: 0,
      spawnTimer: 0,
      elapsed: 0,
      lastTime: 0,
      objects: []
    };

    const syncCanvasSize = () => {
      const rect = gameCanvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      gameCanvas.width = Math.round(rect.width * ratio);
      gameCanvas.height = Math.round(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      player.y = rect.height - 48;
      player.x = Math.min(player.x, rect.width - player.width);
    };

    const updateHud = () => {
      scoreEl.textContent = state.score;
      livesEl.textContent = state.lives;
      streakEl.textContent = state.streak;
    };

    const resetGame = () => {
      const rect = gameCanvas.getBoundingClientRect();
      state.active = true;
      state.score = 0;
      state.lives = 3;
      state.streak = 0;
      state.spawnTimer = 0;
      state.elapsed = 0;
      state.objects = [];
      player.x = rect.width / 2 - player.width / 2;
      player.y = rect.height - 48;
      gameOverlay?.classList.add("is-hidden");
      updateHud();
    };

    const spawnObject = () => {
      const rect = gameCanvas.getBoundingClientRect();
      const isTicket = Math.random() > Math.min(0.38, 0.18 + state.elapsed / 90);
      const size = isTicket ? 24 : 28;

      state.objects.push({
        type: isTicket ? "ticket" : "error",
        x: Math.random() * Math.max(1, rect.width - size),
        y: -size,
        size,
        speed: 105 + Math.random() * 85 + state.elapsed * 3,
        spin: Math.random() * Math.PI
      });
    };

    const intersects = (item) => (
      item.x < player.x + player.width &&
      item.x + item.size > player.x &&
      item.y < player.y + player.height &&
      item.y + item.size > player.y
    );

    const drawPlayer = () => {
      ctx.save();
      ctx.shadowColor = "#56d8ff";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#56d8ff";
      roundRect(ctx, player.x, player.y, player.width, player.height, 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#10131c";
      ctx.font = "900 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SUPPORT", player.x + player.width / 2, player.y + 16);
      ctx.restore();
    };

    const drawTicket = (item) => {
      ctx.save();
      ctx.translate(item.x + item.size / 2, item.y + item.size / 2);
      ctx.rotate(Math.sin(item.spin) * 0.18);
      ctx.shadowColor = "#8cffb7";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#8cffb7";
      roundRect(ctx, -item.size / 2, -item.size / 2, item.size, item.size * 0.72, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(16, 19, 28, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-item.size * 0.2, 0);
      ctx.lineTo(item.size * 0.2, 0);
      ctx.stroke();
      ctx.restore();
    };

    const drawError = (item) => {
      ctx.save();
      ctx.translate(item.x + item.size / 2, item.y + item.size / 2);
      ctx.rotate(item.spin);
      ctx.shadowColor = "#ff6b6b";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#ff6b6b";
      roundRect(ctx, -item.size / 2, -item.size / 2, item.size, item.size, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#10131c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-7, -7);
      ctx.lineTo(7, 7);
      ctx.moveTo(7, -7);
      ctx.lineTo(-7, 7);
      ctx.stroke();
      ctx.restore();
    };

    const drawArena = (width, height) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(86, 216, 255, 0.08)";
      for (let x = 0; x < width; x += 32) {
        ctx.fillRect(x, 0, 1, height);
      }
      for (let y = 0; y < height; y += 32) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.fillStyle = "rgba(140, 255, 183, 0.08)";
      ctx.fillRect(0, height - 24, width, 3);
    };

    const endGame = () => {
      state.active = false;
      if (gameOverlay) {
        gameOverlay.classList.remove("is-hidden");
        gameOverlay.querySelector("strong").textContent = "Run Complete";
        gameOverlay.querySelector("span").textContent = `Final score: ${state.score}. Restart and beat the queue.`;
        gameStart.textContent = "Restart Run";
      }
    };

    const step = (timestamp) => {
      const rect = gameCanvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000 || 0);
      state.lastTime = timestamp;

      if (state.active) {
        state.elapsed += dt;
        state.spawnTimer -= dt;

        const movingLeft = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || touchMove.left;
        const movingRight = keys.has("ArrowRight") || keys.has("d") || keys.has("D") || touchMove.right;

        if (movingLeft) player.x -= player.speed * dt;
        if (movingRight) player.x += player.speed * dt;
        player.x = Math.max(0, Math.min(width - player.width, player.x));

        if (state.spawnTimer <= 0) {
          spawnObject();
          state.spawnTimer = Math.max(0.36, 0.86 - state.elapsed * 0.018);
        }

        state.objects.forEach((item) => {
          item.y += item.speed * dt;
          item.spin += dt * 5;
        });

        state.objects = state.objects.filter((item) => {
          if (intersects(item)) {
            if (item.type === "ticket") {
              state.score += 10 + Math.min(30, state.streak * 2);
              state.streak += 1;
            } else {
              state.lives -= 1;
              state.streak = 0;
              if (state.lives <= 0) endGame();
            }
            updateHud();
            return false;
          }

          if (item.y > height + item.size) {
            if (item.type === "ticket") {
              state.streak = 0;
              updateHud();
            }
            return false;
          }

          return true;
        });
      }

      drawArena(width, height);
      state.objects.forEach((item) => item.type === "ticket" ? drawTicket(item) : drawError(item));
      drawPlayer();
      requestAnimationFrame(step);
    };

    gameStart.addEventListener("click", resetGame);
    window.addEventListener("resize", syncCanvasSize);
    window.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) {
        if (state.active && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
        }
        keys.add(event.key);
      }
    });
    window.addEventListener("keyup", (event) => keys.delete(event.key));

    moveButtons.forEach((button) => {
      const direction = button.dataset.move;
      const setMove = (value) => {
        touchMove[direction] = value;
      };

      button.addEventListener("pointerdown", () => setMove(true));
      button.addEventListener("pointerup", () => setMove(false));
      button.addEventListener("pointerleave", () => setMove(false));
      button.addEventListener("pointercancel", () => setMove(false));
    });

    syncCanvasSize();
    updateHud();
    requestAnimationFrame(step);
  };

  const roundRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  };

  setupSupportGame();
  updateProgress();
  setActiveNav();
})();

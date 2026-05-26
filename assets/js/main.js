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

  updateProgress();
  setActiveNav();
})();

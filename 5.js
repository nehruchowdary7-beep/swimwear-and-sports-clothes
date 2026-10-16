document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const nav = document.querySelector(".main-nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const homeDropdown = document.querySelector(".nav-home");
  const dropdownToggle = document.querySelector(".nav-dropdown-toggle");
  const themeToggle = document.querySelector(".theme-toggle");
  const directionToggle = document.querySelector(".direction-toggle");
  const toast = document.querySelector(".toast");
  const views = [...document.querySelectorAll("[data-page-view]")];
  const routes = new Set(views.map((view) => view.dataset.pageView));

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };

  const setMenuOpen = (open) => {
    if (!nav || !menuToggle) return;
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };

  menuToggle?.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  const setDropdownOpen = (open) => {
    if (!homeDropdown || !dropdownToggle) return;
    homeDropdown.classList.toggle("is-open", open);
    dropdownToggle.setAttribute("aria-expanded", String(open));
  };

  dropdownToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    setDropdownOpen(dropdownToggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("click", (event) => {
    if (homeDropdown && !homeDropdown.contains(event.target)) setDropdownOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setDropdownOpen(false);
      setMenuOpen(false);
      document.querySelector(".nav-dropdown-toggle")?.focus();
      setCartOpen(false);
    }
  });

  const setActiveNavigation = (route) => {
    document.querySelectorAll("[data-route]").forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle("current", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    const homeIsActive = route === "home" || route === "home2";
    document.querySelector(".nav-home")?.classList.toggle("is-current", homeIsActive);
  };

  const applyCatalogFilters = (params = new URLSearchParams()) => {
    const search = document.querySelector("#productSearch");
    const brandFilter = document.querySelector("#brandFilter");
    const categoryFilter = document.querySelector("#categoryFilter");
    const cards = [...document.querySelectorAll("#catalogGrid .product-card")];
    const resultCount = document.querySelector("#resultCount");
    const emptyResults = document.querySelector(".empty-results");

    if (!cards.length) return;
    if (params.has("brand") && brandFilter) brandFilter.value = params.get("brand");
    if (params.has("category") && categoryFilter) categoryFilter.value = params.get("category");
    if (params.has("q") && search) search.value = params.get("q");

    const query = search?.value.trim().toLowerCase() || "";
    const brand = brandFilter?.value || "";
    const category = categoryFilter?.value || "";
    let visible = 0;
    cards.forEach((card) => {
      const matches = (!query || (card.dataset.search || "").includes(query)) &&
        (!brand || card.dataset.brand === brand) &&
        (!category || card.dataset.category === category);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    if (resultCount) resultCount.textContent = String(visible);
    if (emptyResults) emptyResults.hidden = visible !== 0;
  };

  const activateRoute = (route, params = new URLSearchParams(), anchor = "", shouldScroll = true) => {
    const selected = routes.has(route) ? route : "home";
    views.forEach((view) => {
      const active = view.dataset.pageView === selected;
      view.hidden = !active;
      view.setAttribute("aria-hidden", String(!active));
    });
    setActiveNavigation(selected);
    setMenuOpen(false);
    setDropdownOpen(false);
    applyCatalogFilters(params);

    const productParam = params.get("product");
    if (selected === "contact" && productParam) {
      const topic = document.querySelector("#contactTopic");
      const message = document.querySelector("#contactMessage");
      if (topic) topic.value = "Product question";
      if (message) message.value = `I have a question about ${productParam.replaceAll("-", " ")}.`;
    }

    if (shouldScroll) {
      window.requestAnimationFrame(() => {
        const target = anchor ? document.getElementById(anchor) : null;
        if (target && target.closest("[data-page-view]")?.dataset.pageView === selected) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }
  };

  const parseRouteHash = () => {
    const raw = window.location.hash.slice(1);
    const question = raw.indexOf("?");
    const routePart = question === -1 ? raw : raw.slice(0, question);
    const queryPart = question === -1 ? "" : raw.slice(question + 1);
    const route = routePart.startsWith("page-") ? routePart.slice(5) : "home";
    const params = new URLSearchParams(queryPart);
    const anchor = params.get("section") || (routePart.startsWith("page-") ? "" : routePart);
    params.delete("section");
    return { route, params, anchor };
  };

  const navigate = (route, query = "", anchor = "", push = true) => {
    const params = new URLSearchParams(query);
    if (anchor) params.set("section", anchor);
    const suffix = params.toString();
    const nextHash = `#page-${route}${suffix ? `?${suffix}` : ""}`;
    if (push && window.location.hash !== nextHash) history.pushState(null, "", nextHash);
    activateRoute(route, params, anchor);
  };

  document.addEventListener("click", (event) => {
    const routeLink = event.target.closest("a[data-route]");
    if (routeLink) {
      event.preventDefault();
      navigate(routeLink.dataset.route, routeLink.dataset.routeQuery || "", routeLink.dataset.routeAnchor || "");
      return;
    }

    const anchorLink = event.target.closest('a[href^="#"]');
    if (!anchorLink) return;
    const id = decodeURIComponent(anchorLink.getAttribute("href").slice(1));
    const target = document.getElementById(id);
    const targetView = target?.closest("[data-page-view]");
    if (targetView && targetView.hidden) {
      event.preventDefault();
      navigate(targetView.dataset.pageView, "", id);
    }
  });

  window.addEventListener("popstate", () => {
    const route = parseRouteHash();
    activateRoute(route.route, route.params, route.anchor);
  });
  window.addEventListener("hashchange", () => {
    const route = parseRouteHash();
    activateRoute(route.route, route.params, route.anchor, false);
  });

  const initialRoute = parseRouteHash();
  activateRoute(initialRoute.route, initialRoute.params, initialRoute.anchor, false);

  if (localStorage.getItem("aquafit-theme") === "dark") body.classList.add("dark-mode");
  themeToggle?.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const dark = body.classList.contains("dark-mode");
    localStorage.setItem("aquafit-theme", dark ? "dark" : "light");
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  });

  const savedDirection = localStorage.getItem("aquafit-direction");
  if (savedDirection === "rtl" || savedDirection === "ltr") document.documentElement.dir = savedDirection;
  directionToggle?.addEventListener("click", () => {
    const next = document.documentElement.dir === "rtl" ? "ltr" : "rtl";
    document.documentElement.dir = next;
    localStorage.setItem("aquafit-direction", next);
    directionToggle.setAttribute("aria-label", `Switch to ${next.toUpperCase()} layout`);
  });

  const search = document.querySelector("#productSearch");
  const brandFilter = document.querySelector("#brandFilter");
  const categoryFilter = document.querySelector("#categoryFilter");
  search?.addEventListener("input", () => applyCatalogFilters());
  brandFilter?.addEventListener("change", () => applyCatalogFilters());
  categoryFilter?.addEventListener("change", () => applyCatalogFilters());
  document.querySelector("#clearFilters")?.addEventListener("click", () => {
    if (search) search.value = "";
    if (brandFilter) brandFilter.value = "";
    if (categoryFilter) categoryFilter.value = "";
    applyCatalogFilters();
  });

  document.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest(".favorite-btn");
    if (favoriteButton) {
      const isFavorite = favoriteButton.getAttribute("aria-pressed") !== "true";
      favoriteButton.setAttribute("aria-pressed", String(isFavorite));
      favoriteButton.textContent = isFavorite ? "♥" : "♡";
      showToast(isFavorite ? "Added to your favorites" : "Removed from your favorites");
    }
  });

  const drawer = document.querySelector(".cart-drawer");
  const overlay = document.querySelector(".cart-overlay");
  const cartItems = document.querySelector(".cart-items");
  const cartTotals = document.querySelectorAll(".cart-total");
  const cartCounts = document.querySelectorAll(".cart-count");
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("aquafit-cart") || "[]");
    if (!Array.isArray(cart)) cart = [];
  } catch {
    cart = [];
  }

  const renderCart = () => {
    if (!cartItems) return;
    cartCounts.forEach((count) => { count.textContent = String(cart.length); });
    const total = cart.reduce((sum, product) => sum + Number(product.price || 0), 0);
    cartTotals.forEach((amount) => { amount.textContent = total.toLocaleString("en-IN"); });
    cartItems.replaceChildren();
    if (!cart.length) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "Your bag is ready for something great.";
      cartItems.append(empty);
      return;
    }
    cart.forEach((product, index) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const name = document.createElement("span");
      name.textContent = `${product.name} · ₹${Number(product.price).toLocaleString("en-IN")}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.removeIndex = String(index);
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${product.name} from bag`);
      row.append(name, remove);
      cartItems.append(row);
    });
  };

  function setCartOpen(open) {
    drawer?.classList.toggle("is-open", open);
    drawer?.setAttribute("aria-hidden", String(!open));
    overlay?.classList.toggle("is-open", open);
  }

  document.querySelector(".cart-trigger")?.addEventListener("click", () => setCartOpen(true));
  document.querySelectorAll("[data-cart-close]").forEach((element) => {
    element.addEventListener("click", () => setCartOpen(false));
  });

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest(".add-cart");
    if (addButton) {
      const product = { name: addButton.dataset.name, price: Number(addButton.dataset.price) };
      cart.push(product);
      localStorage.setItem("aquafit-cart", JSON.stringify(cart));
      renderCart();
      showToast(`${product.name} added to your bag`);
    }
    const removeButton = event.target.closest("[data-remove-index]");
    if (removeButton) {
      cart.splice(Number(removeButton.dataset.removeIndex), 1);
      localStorage.setItem("aquafit-cart", JSON.stringify(cart));
      renderCart();
    }
  });

  document.querySelector(".checkout-btn")?.addEventListener("click", () => {
    showToast(cart.length ? "Your bag is ready. Checkout is a demo." : "Your bag is empty.");
  });

  document.querySelectorAll(".newsletter-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = form.querySelector(".newsletter-message");
      if (message) message.textContent = "Thanks for joining the AquaFit community.";
      form.reset();
      showToast("Thanks for subscribing to AquaFit.");
    });
  });

  document.querySelector("#contactForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = event.currentTarget.querySelector(".form-message");
    if (message) message.textContent = "Thanks for reaching out. The AquaFit team will be in touch.";
    event.currentTarget.reset();
    showToast("Your message is ready for the AquaFit team.");
  });

  renderCart();

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((element) => observer.observe(element));
  } else {
    revealItems.forEach((element) => element.classList.add("is-visible"));
  }
});




// BACK TO TOP
        const backTopBtn = document.querySelector(".back-top");
        window.addEventListener("scroll", () => {
            backTopBtn.classList.toggle("show", window.scrollY > 550);
        });
        backTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });


aboutherobanner
const hero = document.getElementById("hero");



ltrBtn.addEventListener("click", () => {
  setDirection("ltr");
});

rtlBtn.addEventListener("click", () => {
  setDirection("rtl");
});

// Default layout: image left, content right
setDirection("ltr");



// const ltrBtn = document.getElementById("ltrBtn");
// const rtlBtn = document.getElementById("rtlBtn");

function setDirection(direction) {
  document.documentElement.setAttribute("dir", direction);

  // Update the document direction and button state.
}

ltrBtn.addEventListener("click", () => {
  setDirection("ltr");
});

rtlBtn.addEventListener("click", () => {
  setDirection("rtl");
});


// productbanner

javascript

function setDirection(direction) {
    document.documentElement.setAttribute("dir", direction);

    ltrBtn.classList.toggle("active", direction === "ltr");
    rtlBtn.classList.toggle("active", direction === "rtl");
}

ltrBtn.addEventListener("click", () => {
    setDirection("ltr");
});

rtlBtn.addEventListener("click", () => {
    setDirection("rtl");
});

// Default layout
setDirection("ltr");



// brandsjs
javascript
function changeDirection(direction) {

    const hero = document.getElementById("hero");

    if (direction === "ltr") {
        hero.style.flexDirection = "row";
        hero.style.direction = "ltr";
    }

    else if (direction === "rtl") {
        hero.style.flexDirection = "row-reverse";
        hero.style.direction = "rtl";
    }
}


// about3
javascript
const about3 = document.getElementById("hero");

function setDirection(direction) {

    if (direction === "rtl") {
        about3.classList.add("rtl");
        about3.style.direction = "rtl";
    } else {
        about3.classList.remove("rtl");
        about3.style.direction = "ltr";
    }

    // Restart animation
    about3.querySelector(".about3-image").style.animation = "none";
    about3.querySelector(".about3-content").style.animation = "none";

    void about3.offsetWidth;

    about3.querySelector(".about3-image").style.animation =
        "imageSlide 1s ease";

    about3.querySelector(".about3-content").style.animation =
        "contentSlide 1s ease";
}




        











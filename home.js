// Hero Section Logic
(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const heroSection = document.getElementById("video-hero");
        // ① Only this element is allowed to animate on scroll
        const videoLayer = document.getElementById("heroVideoLayer");
        const uspCounters = document.querySelectorAll(
            ".usp-count [data-count]",
        );
        let hasCounted = false; // Moved to top to avoid hoisting issues

        if (!heroSection) return;

        // 0. Initialize HLS Video Stream
        const heroVideo = document.getElementById("hero-bg-video");
        if (heroVideo) {
            heroVideo.loop = true;
            heroVideo.muted = true;

            const videoSrc = "videos/hls/playlist.m3u8";
            if (typeof Hls !== "undefined" && Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(videoSrc);
                hls.attachMedia(heroVideo);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    heroVideo
                        .play()
                        .catch((e) => console.log("Autoplay prevented:", e));
                });
            } else if (heroVideo.canPlayType("application/vnd.apple.mpegurl")) {
                // Native HLS support (Safari)
                heroVideo.src = videoSrc;
                heroVideo.addEventListener("loadedmetadata", function () {
                    heroVideo
                        .play()
                        .catch((e) => console.log("Autoplay prevented:", e));
                });
            }
        }

        // 1. Initial Reveal via IntersectionObserver
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Add visible class to trigger CSS transitions
                        entry.target.classList.add("video-hero-visible");
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 },
        ); // Trigger when 10% visible

        revealObserver.observe(heroSection);

        // 1.5 USP Card Reveal — REVERSIBLE
        const uspCard = document.querySelector(".hero-usp-card");
        if (uspCard) {
            let lastScrollY = window.scrollY;
            let ticking = false;

            const updateCardVisibility = () => {
                const scrollY = window.scrollY;
                if (scrollY > 20) {
                    if (!uspCard.classList.contains("usp-card-visible")) {
                        uspCard.classList.add("usp-card-visible");
                        triggerCountUp(uspCounters);
                    }
                } else {
                    if (uspCard.classList.contains("usp-card-visible")) {
                        uspCard.classList.remove("usp-card-visible");
                        // Reset counters for re-animation
                        hasCounted = false;
                        uspCounters.forEach((counter) => {
                            counter.innerText = "0";
                        });
                    }
                }
                ticking = false;
            };

            window.addEventListener(
                "scroll",
                () => {
                    if (!ticking) {
                        window.requestAnimationFrame(updateCardVisibility);
                        ticking = true;
                    }
                },
                { passive: true },
            );

            // Initial check
            updateCardVisibility();
        }

        // 2. Count-Up Animation
        function triggerCountUp(counters) {
            if (hasCounted) return;
            hasCounted = true;

            counters.forEach((counter) => {
                const target = parseInt(counter.getAttribute("data-count"), 10);
                const duration = 2000; // ms
                const start = 0;
                let startTime = null;

                const easeOutQuad = (t) => t * (2 - t);

                const step = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min(
                        (timestamp - startTime) / duration,
                        1,
                    );
                    const easedProgress = easeOutQuad(progress);

                    const current = Math.floor(easedProgress * target);
                    counter.innerText = current.toLocaleString();

                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        counter.innerText = target.toLocaleString();
                    }
                };

                requestAnimationFrame(step);
            });
        }

        // 2.5 Section Reveal Observer for "TMU a World in Itself"
        const revealSections = document.querySelectorAll(".section-reveal");
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("reveal-visible");
                        sectionObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 },
        );

        revealSections.forEach((section) => sectionObserver.observe(section));

        // 3. (Legacy Force Video Playback Removed — now handled by HLS above)

        // No scroll parallax — video is cinematic on its own.
        // Parallax was the root cause of the shadow/gradient drift on all devices.
    });
})();

// Banner Slider Logic
(function () {
    const sliderWrapper = document.getElementById("sliderWrapper");
    if (!sliderWrapper) return;
    let bannerSlides = document.querySelectorAll(".slide");
    const firstBannerClone = bannerSlides[0].cloneNode(true);
    const lastBannerClone =
        bannerSlides[bannerSlides.length - 1].cloneNode(true);
    sliderWrapper.appendChild(firstBannerClone);
    sliderWrapper.insertBefore(lastBannerClone, bannerSlides[0]);

    let bannerIndex = 1;
    const totalBannerSlides = document.querySelectorAll(".slide").length;
    let isBannerMoving = false;

    function updateBanner(animate = true) {
        sliderWrapper.style.transition = animate
            ? "transform 0.8s cubic-bezier(0.7,0,0.3,1)"
            : "none";
        sliderWrapper.style.transform = `translateX(${-bannerIndex * 100}%)`;

        document.querySelectorAll(".slide").forEach((s, i) => {
            if (i === bannerIndex) s.classList.add("active");
            else s.classList.remove("active");
        });
    }

    function changeBannerSlide(dir) {
        if (isBannerMoving) return;
        isBannerMoving = true;
        bannerIndex += dir;
        updateBanner();
    }

    sliderWrapper.addEventListener("transitionend", () => {
        isBannerMoving = false;
        if (bannerIndex === 0) {
            bannerIndex = totalBannerSlides - 2;
            updateBanner(false);
        }
        if (bannerIndex === totalBannerSlides - 1) {
            bannerIndex = 1;
            updateBanner(false);
        }
    });

    setInterval(() => changeBannerSlide(1), 7000);
    updateBanner(false);
})();

// // ─── Alumni Voices — Infinite Horizontal Selector ───────────────────────────
(function () {
    const section = document.getElementById("alumni-voices");
    if (!section) return;

    // ── Data ──────────────────────────────────────────────────────
    const ALUMNI = [
        {
            quote: '"TMU didn\'t just give me a degree; it gave me the wings to fly in the global tech landscape. The innovation-first culture is what sets this university apart."',
            name: "Rahul Sharma",
            role: "Senior Software Engineer \u2014 Google",
            meta: "B.Tech CSE\u00a0\u00b7\u00a0Class of 2018",
        },
        {
            quote: '"Empowerment is at the heart of TMU\'s education. The leadership skills and confidence I gained here have been instrumental in my growth at Microsoft."',
            name: "Priya Gupta",
            role: "Human Resource Manager \u2014 Microsoft",
            meta: "MBA HRM\u00a0\u00b7\u00a0Class of 2016",
        },
        {
            quote: '"The blend of academic rigor and hands-on experience at TMU is world-class. It perfectly prepared me for the dynamic challenges of the data science industry."',
            name: "Aman Verma",
            role: "Lead Data Scientist \u2014 Amazon",
            meta: "MCA\u00a0\u00b7\u00a0Class of 2019",
        },
        {
            quote: '"The creative freedom and mentorship at TMU allowed me to explore the intersection of technology and design. It was the perfect launchpad for my career at Meta."',
            name: "Sneha Reddy",
            role: "Product Designer \u2014 Meta",
            meta: "B.Des\u00a0\u00b7\u00a0Class of 2020",
        },
        {
            quote: "\"TMU's focus on industry readiness and strategic thinking gave me a competitive edge in the financial sector. I'm proud to be an alumnus of such a forward-thinking institution.\"",
            name: "Vikram Singh",
            role: "Executive Director \u2014 Goldman Sachs",
            meta: "MBA\u00a0\u00b7\u00a0Class of 2015",
        },
    ];
    const TOTAL = ALUMNI.length;

    // ── Elements ──────────────────────────────────────────────────
    const track = section.querySelector("#almThumbTrack");
    if (!track) return;
    const imgItems = section.querySelectorAll(".alm-img-item");
    const card = section.querySelector("#almCard");
    const quoteEl = section.querySelector("#almQuote");
    const nameEl = section.querySelector("#almName");
    const roleEl = section.querySelector("#almRole");
    const metaEl = section.querySelector("#almMeta");
    const prevBtn = section.querySelector("#almPrev");
    const nextBtn = section.querySelector("#almNext");

    // Duplicate nodes to create an off-screen buffer for seamless infinite sliding
    const originalChildren = Array.from(track.children);
    originalChildren.forEach((child) => {
        track.appendChild(child.cloneNode(true));
    });

    let current = -1; // Force initialization on mount
    let moving = false;
    let autoTimer = null;

    // ── Staggered Text Animations ─────────────────────────────────
    var textEntries = [
        { el: quoteEl, cls: "alm-quote-enter" },
        { el: nameEl, cls: "alm-name-enter" },
        { el: roleEl, cls: "alm-role-enter" },
        { el: metaEl, cls: "alm-meta-enter" },
    ];

    function animateText(data) {
        textEntries.forEach(function (t) {
            t.el.classList.remove(t.cls);
        });
        quoteEl.textContent = data.quote;
        nameEl.textContent = data.name;
        roleEl.textContent = data.role;
        metaEl.textContent = data.meta;
        void quoteEl.offsetWidth; // force reflow
        textEntries.forEach(function (t) {
            t.el.classList.add(t.cls);
        });
    }

    function updateVisuals(targetIdx) {
        current = ((targetIdx % TOTAL) + TOTAL) % TOTAL;

        // Crossfade image
        imgItems.forEach(function (img, i) {
            if (i === current) img.classList.add("active");
            else img.classList.remove("active");
        });

        // Card slide-up + staggered text
        card.classList.remove("alm-card-enter");
        void card.offsetWidth;
        card.classList.add("alm-card-enter");
        animateText(ALUMNI[current]);
    }

    // ── Infinite DOM Movement (Middle-Centric) ────────────────────────
    // The active avatar is ALWAYS at index 2 (the 3rd element) in the DOM
    function slideNext() {
        if (moving) return;
        moving = true;

        const first = track.firstElementChild;
        const gap = 16; // from CSS gap
        const itemWidth = first.offsetWidth + gap; // 36 + 16 = 52

        // PRE-ANIMATION: Update active classes!
        // The element currently at index 3 will slide into the center position (index 2)
        Array.from(track.children).forEach((el, i) => {
            if (i === 3)
                el.classList.add("active"); // Scales up
            else el.classList.remove("active"); // Scales down
        });

        // Transition track to the left
        track.style.transition =
            "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        track.style.transform = `translateX(-${itemWidth}px)`;

        // Update visuals based on the up-and-coming avatar
        const nextActiveEl = track.children[3];
        const nextIdx = parseInt(nextActiveEl.getAttribute("data-idx"), 10);
        updateVisuals(nextIdx);

        setTimeout(function () {
            // Instantly rearrange DOM and remove transform
            track.style.transition = "none";
            track.appendChild(first);
            track.style.transform = "translateX(0)";
            moving = false;
        }, 400);
    }

    function slidePrev() {
        if (moving) return;
        moving = true;

        const last = track.lastElementChild;
        const gap = 16;
        const itemWidth = last.offsetWidth + gap;

        // Move DOM item first, translate left to hide it instantly
        track.style.transition = "none";
        track.insertBefore(last, track.firstElementChild);
        track.style.transform = `translateX(-${itemWidth}px)`;

        // PRE-ANIMATION: Update active classes on new DOM layout
        // The element now at index 2 is the new active one
        Array.from(track.children).forEach((el, i) => {
            if (i === 2) el.classList.add("active");
            else el.classList.remove("active");
        });

        // Update visuals based on the new front avatar
        const prevActiveEl = track.children[2];
        const prevIdx = parseInt(prevActiveEl.getAttribute("data-idx"), 10);
        updateVisuals(prevIdx);

        // Force reflow and animate smoothly into place
        void track.offsetWidth;
        track.style.transition =
            "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        track.style.transform = "translateX(0)";

        setTimeout(function () {
            moving = false;
        }, 400);
    }

    function jumpTo(targetIdx) {
        if (moving || targetIdx === current) return;

        // Rotate the DOM until the element at index 2 matches our targetIdx
        let targetLoops = 0;
        while (
            parseInt(track.children[2].getAttribute("data-idx"), 10) !==
                targetIdx &&
            targetLoops < 15
        ) {
            track.appendChild(track.firstElementChild);
            targetLoops++;
        }

        Array.from(track.children).forEach((el, i) => {
            if (i === 2) el.classList.add("active");
            else el.classList.remove("active");
        });

        updateVisuals(targetIdx);
    }

    // Delegate click events since there are cloned nodes
    track.addEventListener("click", function (e) {
        const item = e.target.closest(".alm-thumb-item");
        if (item) {
            const idx = parseInt(item.getAttribute("data-idx"), 10);
            jumpTo(idx);
            startAuto();
        }
    });

    // ── Autoplay ──────────────────────────────────────────────────
    function startAuto() {
        stopAuto();
        autoTimer = setInterval(slideNext, 7000);
    }
    function stopAuto() {
        clearInterval(autoTimer);
        autoTimer = null;
    }

    section.addEventListener("mouseenter", stopAuto);
    section.addEventListener("mouseleave", startAuto);
    section.addEventListener("touchstart", stopAuto, { passive: true });
    section.addEventListener("touchend", startAuto, { passive: true });

    // ── Navigation ────────────────────────────────────────────────
    if (prevBtn)
        prevBtn.addEventListener("click", function () {
            slidePrev();
            startAuto();
        });
    if (nextBtn)
        nextBtn.addEventListener("click", function () {
            slideNext();
            startAuto();
        });
    window.jumpToAlumni = function (idx) {
        jumpTo(idx);
        startAuto();
    };

    // ── Swipe ─────────────────────────────────────────────────────
    var touchXStart = 0;
    section.addEventListener(
        "touchstart",
        function (e) {
            touchXStart = e.touches[0].clientX;
        },
        { passive: true },
    );
    section.addEventListener(
        "touchend",
        function (e) {
            var dx = e.changedTouches[0].clientX - touchXStart;
            if (Math.abs(dx) > 50) {
                if (dx < 0) slideNext();
                else slidePrev();
                startAuto();
            }
        },
        { passive: true },
    );

    // ── Initialize ────────────────────────────────────────────────
    var observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) section.classList.add("alm-visible");
            });
        },
        { threshold: 0.2 },
    );
    observer.observe(section);

    // ── Initialization ────────────────────────────────────────────
    setTimeout(function () {
        jumpTo(0);
    }, 50);
    startAuto();
})();

/* YouTube Slider Logic (Infinite, Drag & Timeline) */
(function () {
    const slider = document.getElementById("ytSlider");
    const progressBar = document.getElementById("ytProgress");
    const prevBtn = document.getElementById("ytPrev");
    const nextBtn = document.getElementById("ytNext");
    if (!slider || !progressBar) return;

    // 1. Infinite Clone Setup
    const originalSlides = Array.from(slider.querySelectorAll(".yt-slide"));
    const slideCount = originalSlides.length;
    if (slideCount === 0) return;

    // Clone all slides and append/prepend for infinite loop
    const firstOriginal = originalSlides[0];
    originalSlides.forEach((slide) => {
        // Appending to the end is always in order
        const cloneAfter = slide.cloneNode(true);
        slider.appendChild(cloneAfter);

        // Inserting before the firstOriginal keeps the prepended clones in order!
        const cloneBefore = slide.cloneNode(true);
        slider.insertBefore(cloneBefore, firstOriginal);
    });

    let isDown = false;
    let startX;
    let scrollLeft;
    const slideWidth = 324; // 300px + 24px gap

    function updateProgress() {
        const total = slider.scrollWidth;
        const current = slider.scrollLeft;
        const contentWidth = slideCount * slideWidth;

        // Loop Logic
        if (current <= 0) {
            slider.scrollLeft = contentWidth;
        } else if (current >= contentWidth * 2) {
            slider.scrollLeft = contentWidth;
        }

        // Timeline: Map the position of the "original" set to 0-100%
        let relativeScroll = slider.scrollLeft - contentWidth;
        const progress = (relativeScroll / contentWidth) * 100;
        progressBar.style.width = Math.min(100, Math.max(0, progress)) + "%";
    }

    // Drag Functionality
    slider.addEventListener("mousedown", (e) => {
        isDown = true;
        slider.style.cursor = "grabbing";
        slider.style.scrollSnapType = "none";
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    window.addEventListener("mouseup", () => {
        isDown = false;
        slider.style.cursor = "grab";
        slider.style.scrollSnapType = "x mandatory";
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
    });

    // Arrow Nav Controls
    if (prevBtn) {
        prevBtn.onclick = () =>
            slider.scrollBy({ left: -slideWidth, behavior: "smooth" });
    }
    if (nextBtn) {
        nextBtn.onclick = () =>
            slider.scrollBy({ left: slideWidth, behavior: "smooth" });
    }

    // Initialize position to the "middle" (original) set
    const initPos = slideCount * slideWidth;
    slider.scrollLeft = initPos;

    slider.addEventListener("scroll", updateProgress);
    window.addEventListener("resize", updateProgress);
    setTimeout(updateProgress, 200);
})();

// Video Popup Logic (Modern Version)
window.openVideo = function (id) {
    const modal = document.getElementById("videoModal");
    const player = document.getElementById("ytPlayer");
    if (!modal || !player) return;

    player.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&showinfo=0`;
    modal.classList.add("active");
    modal.style.display = "flex"; // For transition fallback
    document.body.style.overflow = "hidden";
};

window.closeVideo = function () {
    const modal = document.getElementById("videoModal");
    const player = document.getElementById("ytPlayer");
    if (!modal || !player) return;

    modal.classList.remove("active");
    // Clear src after a slight delay to allow closing animation to complete
    setTimeout(() => {
        player.src = "";
        modal.style.display = "none";
    }, 400);
    document.body.style.overflow = "auto";
};

// Gallery & Lightbox
window.toggleGallery = function () {
    const btn = document.getElementById("galleryToggleBtn");
    const hiddenItems = document.querySelectorAll(".gallery-item.hidden");
    const isExpanding = btn.textContent === "Show More";
    hiddenItems.forEach(
        (item) => (item.style.display = isExpanding ? "block" : "none"),
    );
    btn.textContent = isExpanding ? "Show Less" : "Show More";
};
window.openLightbox = function (src, meta) {
    const modal = document.getElementById("lightbox");
    document.getElementById("lightboxImg").src = src;

    // Set download link
    const dl = document.getElementById("lightboxDownload");
    if (dl) dl.href = src;

    // Populate metadata if provided
    if (meta) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || "";
        };
        set("lightboxTitle", meta.title);
        set("lightboxDesc", meta.desc);
        set("lightboxLocation", meta.location);
        set("lightboxDate", meta.date);
        set("lightboxCatDetail", meta.category);
        set("lightboxCategory", meta.category);
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};
window.closeLightbox = function () {
    document.getElementById("lightbox").style.display = "none";
    document.body.style.overflow = "auto";
};

// Blog Progress & Controls
(function () {
    const featuredSlider = document.getElementById("featuredBlogSlider");
    const featuredProgress = document.getElementById("featuredProgress");
    if (featuredSlider && featuredProgress) {
        const update = () => {
            const perc =
                (featuredSlider.scrollLeft /
                    (featuredSlider.scrollWidth - featuredSlider.clientWidth)) *
                100;
            featuredProgress.style.width = perc + "%";
        };
        featuredSlider.addEventListener("scroll", update);
        document.getElementById("featuredPrevB").onclick = () =>
            featuredSlider.scrollBy({
                left: -400,
                behavior: "smooth",
            });
        document.getElementById("featuredNextB").onclick = () =>
            featuredSlider.scrollBy({
                left: 400,
                behavior: "smooth",
            });
        update();
    }
})();

// Notice Search
(function () {
    const search = document.getElementById("noticeSearch");
    const list = document.getElementById("noticeList");
    if (search && list) {
        search.addEventListener("keyup", () => {
            const filter = search.value.toLowerCase();
            const items = list.getElementsByClassName("notice-item");
            let found = false;
            for (let item of items) {
                const text = item.innerText.toLowerCase();
                const match = text.includes(filter);
                item.style.display = match ? "" : "none";
                if (match) found = true;
            }
            let msg = document.getElementById("noNoticesFound");
            if (!found && !msg) {
                msg = document.createElement("div");
                msg.id = "noNoticesFound";
                msg.style.padding = "20px";
                msg.style.textAlign = "center";
                msg.innerHTML = "No notices found matching your search.";
                list.appendChild(msg);
            } else if (found && msg) msg.remove();
        });
    }
})();

// Accordion Logic
(function () {
    document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
        trigger.onclick = () => {
            const item = trigger.parentElement;
            const isActive = item.classList.contains("active");
            document.querySelectorAll(".accordion-item").forEach((i) => {
                i.classList.remove("active");
                i.querySelector(".accordion-content").style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add("active");
                const content = item.querySelector(".accordion-content");
                content.style.maxHeight = content.scrollHeight + 32 + "px";
            }
        };
    });
})();

// Scroll Animations
(function () {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = "1";
                        entry.target.style.transform = "translateY(0)";
                    }, index * 50);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1 },
    );
    document
        .querySelectorAll(
            ".blog-card, .blog-card-featured, .news-card-v2, .notice-item",
        )
        .forEach((el) => {
            el.style.opacity = "0";
            el.style.transform = "translateY(20px)";
            el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
            observer.observe(el);
        });
})();

// Recent News Infinite Auto Carousel (Mobile Only)
(function () {
    const newsRow = document.querySelector(".news-row-v2");
    if (!newsRow) return;

    setInterval(() => {
        // Only run on mobile
        if (window.innerWidth <= 768) {
            const firstCard = newsRow.querySelector(".news-card-v2");
            if (!firstCard) return;

            const gapVal = window.getComputedStyle(newsRow).gap;
            const gap = (gapVal === "normal" ? 0 : parseInt(gapVal, 10)) || 16;
            const scrollAmount = firstCard.offsetWidth + gap;

            // Smooth scroll to next card
            newsRow.scrollBy({
                left: scrollAmount,
                behavior: "smooth",
            });

            // Wait for translation then move element
            setTimeout(() => {
                newsRow.style.scrollBehavior = "auto";
                newsRow.appendChild(firstCard);
                newsRow.scrollLeft -= scrollAmount;
                newsRow.style.scrollBehavior = "";
            }, 600);
        }
    }, 5000);
})();
// Stabilized Universal Infinite Blog Carousel
(function () {
    const grid = document.querySelector(".blog-grid");
    if (!grid) return;

    const originalCards = Array.from(grid.querySelectorAll(".blog-card"));
    const totalCards = originalCards.length;
    if (totalCards === 0) return;

    // Clone the entire set of cards to guarantee exact ordering (prefix, middle, suffix)
    // We use cloneNode to keep original nodes intact so the IntersectionObserver properly triggers their fade-in.
    // Buffer before
    originalCards
        .slice()
        .reverse()
        .forEach((card) => {
            const clone = card.cloneNode(true);
            clone.style.opacity = "1";
            clone.style.transform = "translateY(0)";
            grid.insertBefore(clone, grid.firstChild);
        });

    // Buffer after
    originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.style.opacity = "1";
        clone.style.transform = "translateY(0)";
        grid.appendChild(clone);
    });

    // Update NodeList after HTML changes
    const allCards = grid.querySelectorAll(".blog-card");

    let timer;
    let isDown = false;
    let startX, startScrollLeft;

    const getSetWidth = () => {
        // Width of one full set of cards. We can find this by measuring distance from card 0 to card `totalCards`
        if (allCards.length >= totalCards * 2) {
            return allCards[totalCards].offsetLeft - allCards[0].offsetLeft;
        }
        return grid.scrollWidth / 3;
    };

    const getCardWidth = () => {
        const gap = parseInt(window.getComputedStyle(grid).gap) || 30;
        return allCards[0].offsetWidth + gap;
    };

    const jumpToMiddle = () => {
        grid.style.scrollBehavior = "auto";
        grid.scrollLeft = getSetWidth();
    };

    // Initialize to start of the middle set
    setTimeout(jumpToMiddle, 150);

    const startAuto = () => {
        clearInterval(timer);
        timer = setInterval(() => {
            if (isDown) return;
            grid.style.scrollBehavior = "smooth";
            grid.scrollLeft += getCardWidth();
        }, 5000);
    };

    // Keep the scroll within the middle region
    grid.addEventListener("scroll", () => {
        if (isDown) return;

        const setWidth = getSetWidth();

        // If we scrolled fully into the left buffer
        if (grid.scrollLeft <= 5) {
            grid.style.scrollBehavior = "auto";
            grid.scrollLeft += setWidth;
        }
        // If we scrolled fully through the middle buffer
        else if (grid.scrollLeft >= setWidth * 2 - 5) {
            grid.style.scrollBehavior = "auto";
            grid.scrollLeft -= setWidth;
        }
    });

    // Arrow controls
    const nextBtn = document.getElementById("blogNext");
    const prevBtn = document.getElementById("blogPrev");

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            grid.style.scrollBehavior = "smooth";
            grid.scrollLeft += getCardWidth();
            startAuto();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            grid.style.scrollBehavior = "smooth";
            grid.scrollLeft -= getCardWidth();
            startAuto();
        });
    }

    // Drag-to-scroll controls
    const startDrag = (e) => {
        isDown = true;
        grid.style.cursor = "grabbing";
        grid.style.scrollSnapType = "none";
        grid.style.scrollBehavior = "auto";
        startX = (e.pageX || e.touches[0].pageX) - grid.offsetLeft;
        startScrollLeft = grid.scrollLeft;
        clearInterval(timer);
    };

    const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        grid.style.cursor = "grab";
        grid.style.scrollSnapType = "x mandatory";

        // After drag finishes, bounds check to enforce infinite feel
        const setWidth = getSetWidth();
        if (grid.scrollLeft <= 50) {
            grid.scrollLeft += setWidth;
        } else if (grid.scrollLeft >= setWidth * 2 - 50) {
            grid.scrollLeft -= setWidth;
        }
        startAuto();
    };

    const moveDrag = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = (e.pageX || e.touches[0].pageX) - grid.offsetLeft;
        const walk = (x - startX) * 1.5;
        grid.scrollLeft = startScrollLeft - walk;
    };

    grid.addEventListener("mousedown", startDrag);
    window.addEventListener("mouseup", endDrag);
    grid.addEventListener("mousemove", moveDrag);

    grid.addEventListener("touchstart", startDrag, { passive: false });
    window.addEventListener("touchend", endDrag);
    grid.addEventListener("touchmove", moveDrag, { passive: false });

    grid.style.cursor = "grab";
    startAuto();
})();

// Showcase Infinite Slider with Drag & Lightbox
(function () {
    const track = document.getElementById("showcaseTrack");
    const slider = document.getElementById("showcaseSlider");
    if (!track || !slider) return;

    // Triple clones for infinite feeling
    const originalHTML = track.innerHTML;
    track.innerHTML += originalHTML + originalHTML;

    let scrollPos = 0;
    let speed = 0.4; // Reduced speed as requested
    let isPaused = false;
    let isDragging = false;
    let startX, startScrollPos;
    let dragStartTime;

    function step() {
        if (!isPaused && !isDragging) {
            scrollPos -= speed;
            const firstItem = track.querySelector(".showcase-item");
            if (firstItem) {
                const itemW = firstItem.offsetWidth + 20;
                const totalW = (track.children.length / 3) * itemW;

                if (Math.abs(scrollPos) >= totalW) {
                    scrollPos = 0;
                }
                track.style.transform = `translateX(${scrollPos}px)`;
            }
        }
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    const handleStart = (e) => {
        isDragging = true;
        dragStartTime = Date.now();
        startX = e.pageX || e.touches[0].pageX;
        startScrollPos = scrollPos;
        track.style.transition = "none";
        track.style.cursor = "grabbing";
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        const x = e.pageX || e.touches[0].pageX;
        const walk = x - startX;
        scrollPos = startScrollPos + walk;

        const firstItem = track.querySelector(".showcase-item");
        if (firstItem) {
            const itemW = firstItem.offsetWidth + 20;
            const totalW = (track.children.length / 3) * itemW;

            if (scrollPos > 0) scrollPos = -totalW;
            if (Math.abs(scrollPos) > totalW * 2) scrollPos = -totalW;
        }
        track.style.transform = `translateX(${scrollPos}px)`;
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        track.style.cursor = "grab";

        // Allow simple click to pass through for onclick=""
        const dragDistance = Math.abs(
            (e.pageX ||
                (e.changedTouches ? e.changedTouches[0].pageX : startX)) -
                startX,
        );
        if (dragDistance > 10) {
            // It was a drag, we could prevent default if needed
        }
    };

    slider.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    slider.addEventListener("touchstart", handleStart, {
        passive: true,
    });
    window.addEventListener(
        "touchmove",
        (e) => {
            if (isDragging) e.preventDefault();
            handleMove(e);
        },
        { passive: false },
    );
    window.addEventListener("touchend", handleEnd);

    slider.addEventListener("mouseenter", () => (isPaused = true));
    slider.addEventListener("mouseleave", () => (isPaused = false));

    slider.style.cursor = "grab";
})();

// ─── Cinematic Banner Showcase ───────────────────────────────────────────────
(function () {
    var section = document.getElementById("bannerShowcase");
    if (!section) return;

    var slides = Array.from(section.querySelectorAll(".bsc-slide"));
    var dots = Array.from(section.querySelectorAll(".bsc-dot"));
    var frame = section.querySelector(".bsc-frame");
    var track = section.querySelector(".bsc-track");

    if (!slides.length || !track) return;

    var current = 0;
    var total = slides.length;
    var autoTimer = null;
    var isHover = false;
    var timeStart = 0;
    var timeRemaining = 5000;

    // ── Dynamic height: set track height to match the current banner image ──
    function getFrameWidth() {
        return (
            track.offsetWidth || frame.offsetWidth || window.innerWidth * 0.88
        );
    }

    function setHeightForSlide(idx) {
        var img = slides[idx] && slides[idx].querySelector("img");
        if (!img) return;

        function applyHeight() {
            if (img.naturalWidth && img.naturalHeight) {
                var ratio = img.naturalHeight / img.naturalWidth;
                var newH = Math.round(getFrameWidth() * ratio);
                track.style.height = newH + "px";
            }
        }

        if (img.complete && img.naturalWidth) {
            applyHeight();
        } else {
            img.addEventListener("load", applyHeight, { once: true });
        }
    }

    // Recalculate height on viewport resize
    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            setHeightForSlide(current);
        }, 150);
    });

    // ── Switch to a specific index ─────────────────────────────────────────
    function goTo(idx) {
        // Deactivate current
        slides[current].classList.remove("active");
        dots[current].classList.remove("active");
        dots[current].setAttribute("aria-selected", "false");

        // Wrap index
        current = ((idx % total) + total) % total;

        // Activate next
        slides[current].classList.add("active");
        dots[current].classList.add("active");
        dots[current].setAttribute("aria-selected", "true");

        // Resize track to match the new banner's aspect ratio
        setHeightForSlide(current);

        // Reset remaining time on slide change
        timeRemaining = 5000;
    }

    // ── Auto-advance logic (Tick-based) ────────────────────────────────────
    function startAuto() {
        stopAuto();
        autoTimer = setInterval(function () {
            // Do not decrement if hovered
            if (isHover) return;

            timeRemaining -= 50;
            if (timeRemaining <= 0) {
                goTo(current + 1);
                // timeRemaining is reset to 5000 inside goTo()
            }
        }, 50);
    }
    function stopAuto() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    // ── Dot clicks ────────────────────────────────────────────────────────
    dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
            var idx = parseInt(dot.getAttribute("data-index"), 10);
            goTo(idx);
        });
    });

    // ── Arrow buttons ─────────────────────────────────────────────────────
    var prevBtn = document.getElementById("bscPrev");
    var nextBtn = document.getElementById("bscNext");
    if (prevBtn)
        prevBtn.addEventListener("click", function () {
            goTo(current - 1);
        });
    if (nextBtn)
        nextBtn.addEventListener("click", function () {
            goTo(current + 1);
        });

    // ── Hover pause ───────────────────────────────────────────────────────
    if (frame) {
        frame.addEventListener("mouseenter", function () {
            isHover = true;
            section.classList.add("is-paused");
        });
        frame.addEventListener("mouseleave", function () {
            isHover = false;
            section.classList.remove("is-paused");
            // Force a reflow to wake up Webkit/Safari pseudo-element animations
            void section.offsetWidth;
        });

        // ── Touch functionality for mobile swipe ────────────────────────────
        let touchStartX = 0;
        let touchEndX = 0;

        frame.addEventListener(
            "touchstart",
            function (e) {
                touchStartX = e.changedTouches[0].screenX;
            },
            { passive: true },
        );

        frame.addEventListener(
            "touchend",
            function (e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            },
            { passive: true },
        );

        function handleSwipe() {
            var threshold = 50; // minimum distance to be considered a swipe
            if (touchEndX < touchStartX - threshold) {
                // Swipe left -> Next slide
                goTo(current + 1);
            }
            if (touchEndX > touchStartX + threshold) {
                // Swipe right -> Prev slide
                goTo(current - 1);
            }
        }
    }

    // ── Scroll-reveal with IntersectionObserver ───────────────────────────
    var revealObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    section.classList.add("bsc-visible");
                    revealObserver.unobserve(section);
                    if (!isHover) startAuto();
                }
            });
        },
        { threshold: 0.15 },
    );
    revealObserver.observe(section);

    // ── Initialize first slide as active ─────────────────────────────────
    slides[0].classList.add("active");
    dots[0].classList.add("active");
    dots[0].setAttribute("aria-selected", "true");

    // Set initial height (handles cached and fresh images)
    setHeightForSlide(0);

    // Also pre-load the rest so height snaps instantly when they appear
    slides.forEach(function (slide, i) {
        if (i === 0) return;
        var img = slide.querySelector("img");
        if (img && !img.complete) {
            img.addEventListener(
                "load",
                function () {
                    /* pre-cached */
                },
                { once: true },
            );
        }
    });
})();

// ── Static Testimonial Image Slider ──────────────────────────────────────
(function () {
    const images = document.querySelectorAll(".alm-testimonial-img");
    const prevBtn = document.getElementById("almTestPrev");
    const nextBtn = document.getElementById("almTestNext");
    const dots = document.querySelectorAll(".alm-dot");
    const progressFill = document.getElementById("almProgressFill");

    if (images.length === 0 || !prevBtn || !nextBtn) return;

    const total = images.length;
    let currentIndex = 0;
    let autoTimer = null;

    const updateUI = (index) => {
        // Swap active image
        images.forEach((img, i) => {
            img.classList.toggle("active", i === index);
        });

        // Sync dots — force animation restart by toggling active class
        dots.forEach((dot, i) => {
            dot.classList.remove("active");
            // Trigger reflow so ::before animation restarts cleanly
            void dot.offsetWidth;
            if (i === index) dot.classList.add("active");
        });
    };

    const goTo = (index) => {
        currentIndex = (index + total) % total;
        updateUI(currentIndex);
    };

    const startAuto = () => {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
            goTo(currentIndex + 1);
        }, 5000);
    };

    // Arrow nav
    nextBtn.addEventListener("click", () => { goTo(currentIndex + 1); startAuto(); });
    prevBtn.addEventListener("click", () => { goTo(currentIndex - 1); startAuto(); });

    // Dot nav
    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const idx = parseInt(dot.getAttribute("data-index"), 10);
            goTo(idx);
            startAuto();
        });
    });

    // Init
    updateUI(0);
    startAuto();
})();


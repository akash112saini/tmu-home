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

        // 0. Single video — just loop it
        const heroVideos = document.querySelectorAll(".hero-bg-video");
        if (heroVideos.length === 1) {
            heroVideos[0].loop = true;
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

        // 3. Force Video Playback
        if (heroVideos.length > 0) {
            heroVideos.forEach((video) => {
                // Ensure muted for autoplay
                video.muted = true;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch((error) => {
                        console.log("Autoplay prevented:", error);
                        // Fallback: simple interaction listener if needed
                    });
                }
            });
        }

        // No scroll parallax — video is cinematic on its own.
        // Parallax was the root cause of the shadow/gradient drift on all devices.
    });
})();

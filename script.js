(function () {
    var loader = document.getElementById('loader');
    var loaderBody = document.getElementById('loaderBody');

    var loaderLines = [
        { text: 'BIOS v3.14', delay: 0 },
        { text: 'Booting...', delay: 400 },
        { text: 'Memory: 16384 MB <span class="ok">OK</span>', delay: 500 },
        { text: 'Loading kernel <span class="ok">OK</span>', delay: 500 },
        { text: '', delay: 200 },
        { text: '<span class="accent">$</span> init portfolio', delay: 300 },
        { text: '<span class="green">&#10003;</span> modules loaded', delay: 250 },
        { text: '<span class="green">&#10003;</span> db connected', delay: 250 },
        { text: '<span class="green">&#10003;</span> data fetched', delay: 250 },
        { text: '<span class="green">&#10003;</span> UI rendered', delay: 250 },
        { text: '', delay: 150 },
        { text: '<span class="accent">$</span> <span class="ok">ready</span>', delay: 300 },
    ];

    function parseTokens(html) {
        var tokens = [];
        var i = 0;
        while (i < html.length) {
            if (html[i] === '<') {
                var close = html.indexOf('>', i);
                tokens.push({ type: 'tag', value: html.substring(i, close + 1) });
                i = close + 1;
            } else if (html[i] === '&') {
                var semi = html.indexOf(';', i);
                tokens.push({ type: 'char', value: html.substring(i, semi + 1) });
                i = semi + 1;
            } else {
                tokens.push({ type: 'char', value: html[i] });
                i++;
            }
        }
        return tokens;
    }

    function typeLine(div, html, speed, callback) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var plainText = tmp.textContent;

        if (!plainText.length) {
            div.innerHTML = '&nbsp;';
            if (callback) callback();
            return;
        }

        var tokens = parseTokens(html);
        var charCount = tokens.filter(function (t) { return t.type === 'char'; }).length;
        var shown = 0;

        function buildHtml(count) {
            var result = '';
            var visible = 0;
            var openTags = [];
            for (var j = 0; j < tokens.length && visible < count; j++) {
                if (tokens[j].type === 'tag') {
                    result += tokens[j].value;
                    if (tokens[j].value[1] === '/') {
                        openTags.pop();
                    } else {
                        openTags.push(tokens[j].value.match(/^<([a-z]+)/i)[1]);
                    }
                } else {
                    result += tokens[j].value;
                    visible++;
                }
            }
            for (var k = openTags.length - 1; k >= 0; k--) {
                result += '</' + openTags[k] + '>';
            }
            return result;
        }

        function step() {
            shown++;
            div.innerHTML = buildHtml(shown) + '<span class="loader-caret">&#9608;</span>';
            if (shown < charCount) {
                setTimeout(step, speed);
            } else {
                div.innerHTML = buildHtml(shown);
                if (callback) callback();
            }
        }
        step();
    }

    var totalTime = 0;
    loaderLines.forEach(function (l) { totalTime += l.delay; });

    function runLoader(index) {
        if (index >= loaderLines.length) {
            setTimeout(function () {
                loader.style.transition = 'opacity 0.5s ease';
                loader.style.opacity = '0';
                document.body.style.overflow = '';
                setTimeout(function () {
                    loader.parentNode.removeChild(loader);
                }, 500);
            }, 500);
            return;
        }
        var line = loaderLines[index];
        setTimeout(function () {
            var div = document.createElement('div');
            div.className = 'loader-line';
            div.style.opacity = '1';
            div.style.transform = 'none';
            div.style.animation = 'none';
            loaderBody.appendChild(div);
            loaderBody.scrollTop = loaderBody.scrollHeight;
            typeLine(div, line.text, 30, function () {
                runLoader(index + 1);
            });
        }, line.delay);
    }

    runLoader(0);

    document.body.style.overflow = 'hidden';

    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const canvas = document.getElementById('heroCanvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animFrame;
    let mouseX = 0;
    let mouseY = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.floor((canvas.width * canvas.height) / 12000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: Math.random() * 1.2 + 0.3,
                opacity: Math.random() * 0.3 + 0.05
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.6
        );
        gradient.addColorStop(0, 'rgba(91, 33, 182, 0.04)');
        gradient.addColorStop(0.5, 'rgba(91, 33, 182, 0.015)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(function (p) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const dx = mouseX - p.x;
            const dy = mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let opacity = p.opacity;
            if (dist < 200) {
                opacity = p.opacity + (1 - dist / 200) * 0.15;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(124, 58, 237, ' + opacity + ')';
            ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 80) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(124, 58, 237, ' + (1 - dist / 80) * 0.06 + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        animFrame = requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener('resize', function () {
        resizeCanvas();
        createParticles();
    });

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    var lastScroll = 0;
    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY;
        if (scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    });

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navToggle.classList.remove('active');
            mobileMenu.classList.remove('open');
        });
    });

    var heroFades = document.querySelectorAll('.hero-content .anim-fade');
    setTimeout(function () {
        heroFades.forEach(function (el) {
            var delay = parseInt(el.dataset.delay) || 0;
            setTimeout(function () {
                el.classList.add('visible');
            }, delay);
        });
    }, 300);

    var typedEl = document.getElementById('heroTyped');
    var phrases = [
        'coffee in, clean code out',
        'if it works — ship it, then refactor',
        'automating things since 2021',
        'currently debugging something, probably',
        'git commit -m "fixed it for real this time"',
        'one more migration won\'t hurt... right?',
        'sleeping is just offline debugging',
        'ctrl+c ctrl+v is a valid design pattern',
        'it worked on my machine, I swear',
        'TODO: refactor this later (written 2 years ago)',
        '200 OK is my favorite status code',
        'there are only 2 hard problems: cache invalidation',
        'pip install solution-to-all-problems',
        'my code doesn\'t have bugs, only surprise features',
        'deployed on Friday, pray on Saturday',
        'SELECT * FROM sleep WHERE hours > 6 — 0 rows returned'
    ];
    var phraseIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 60;

    function typeEffect() {
        var current = phrases[phraseIndex];

        if (isDeleting) {
            typedEl.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 30;
        } else {
            typedEl.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 60;
        }

        if (!isDeleting && charIndex === current.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 400;
        }

        setTimeout(typeEffect, typeSpeed);
    }

    setTimeout(typeEffect, 1200);

    var revealElements = document.querySelectorAll('.anim-reveal');
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var delay = 0;
                var siblings = entry.target.parentElement.querySelectorAll('.anim-reveal');
                siblings.forEach(function (sib, i) {
                    if (sib === entry.target) {
                        delay = i * 100;
                    }
                });
                setTimeout(function () {
                    entry.target.classList.add('visible');
                }, delay);
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(function (el) {
        revealObserver.observe(el);
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    var heroSection = document.getElementById('hero');
    var heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                if (!animFrame) drawParticles();
            } else {
                if (animFrame) {
                    cancelAnimationFrame(animFrame);
                    animFrame = null;
                }
            }
        });
    }, { threshold: 0 });

    heroObserver.observe(heroSection);
})();
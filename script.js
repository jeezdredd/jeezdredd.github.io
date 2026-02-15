(function () {
    var loader = document.getElementById('loader');
    var loaderBody = document.getElementById('loaderBody');
    var loaderSeen = sessionStorage.getItem('loaderSeen');

    if (loaderSeen && loader) {
        loader.parentNode.removeChild(loader);
    }

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
                    sessionStorage.setItem('loaderSeen', '1');
                    document.dispatchEvent(new Event('loaderDone'));
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

    if (!loaderSeen && loader) {
        runLoader(0);
        document.body.style.overflow = 'hidden';
    }

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
    var backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY;
        if (scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        if (backToTop) {
            if (scrollY > 600) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
        lastScroll = scrollY;
    });

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

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
        'if it works, ship it, then refactor',
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
        'SELECT * FROM sleep WHERE hours > 6 // 0 rows returned',
        'shipping code & reviewing PRs',
        'rm -rf node_modules && pretend nothing happened',
        'googling stack overflow professionally',
        'pretending to understand regex',
        'counting sheep in O(n) time',
        'dreaming in Python',
        '404 developer not found',
        'async sleep in progress',
        'segfault in dreamland',
        'gone to /dev/null, brb'
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

    var qrModal = document.getElementById('qrModal');
    var qrBackdrop = document.getElementById('qrBackdrop');
    var qrClose = document.getElementById('qrClose');
    var qrCodeEl = document.getElementById('qrCode');
    var qrLoading = document.getElementById('qrLoading');
    var qrLoadingText = document.getElementById('qrLoadingText');
    var qrHint = document.getElementById('qrHint');
    var telegramBtn = document.getElementById('telegramBtn');

    function randomHex(len) {
        var chars = '0123456789abcdef';
        var result = '';
        for (var i = 0; i < len; i++) {
            result += chars[Math.floor(Math.random() * 16)];
        }
        return result;
    }

    function typeLoadingText(text, speed, callback) {
        var i = 0;
        qrLoadingText.textContent = '';
        function step() {
            if (i < text.length) {
                qrLoadingText.textContent += text[i];
                i++;
                setTimeout(step, speed);
            } else if (callback) {
                callback();
            }
        }
        step();
    }

    function showQR() {
        var t = [116,46,109,101,47,99,104,51,99,107,109,52,116,101];
        var base = 'https://' + t.map(function(c){return String.fromCharCode(c);}).join('');
        var link = base;
        var ecLevels = ['L', 'M', 'Q', 'H'];
        var ecLevel = ecLevels[Math.floor(Math.random() * ecLevels.length)];

        var qr = qrcode(0, ecLevel);
        qr.addData(link);
        qr.make();

        qrCodeEl.innerHTML = qr.createSvgTag({
            cellSize: 6,
            margin: 4,
            scalable: true
        });

        var svg = qrCodeEl.querySelector('svg');
        if (svg) {
            svg.style.width = '200px';
            svg.style.height = '200px';
            svg.style.display = 'block';
            var rects = svg.querySelectorAll('rect');
            rects.forEach(function(rect) {
                var fill = rect.getAttribute('fill');
                if (fill === '#000000') {
                    rect.setAttribute('fill', '#c8c8c8');
                } else if (fill === '#ffffff') {
                    rect.setAttribute('fill', '#0d0d0d');
                }
            });
        }

        qrLoading.style.display = 'none';
        qrCodeEl.style.display = 'block';
        qrHint.style.display = 'block';
    }

    function closeQR() {
        qrModal.classList.remove('open');
        setTimeout(function () {
            qrCodeEl.style.display = 'none';
            qrCodeEl.innerHTML = '';
            qrHint.style.display = 'none';
            qrLoading.style.display = 'flex';
            qrLoadingText.textContent = '';
        }, 300);
    }

    if (telegramBtn) {
        telegramBtn.addEventListener('click', function () {
            qrLoading.style.display = 'flex';
            qrCodeEl.style.display = 'none';
            qrHint.style.display = 'none';
            qrLoadingText.textContent = '';
            qrModal.classList.add('open');

            typeLoadingText('Generating one-time QR code...', 35, function () {
                setTimeout(showQR, 400);
            });
        });
    }

    if (qrBackdrop) {
        qrBackdrop.addEventListener('click', closeQR);
    }

    if (qrClose) {
        qrClose.addEventListener('click', closeQR);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && qrModal && qrModal.classList.contains('open')) {
            closeQR();
        }
    });

    heroObserver.observe(heroSection);

    var DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1472589914787811419/FPiYRabYvDOP3Klqj6DrD0fFmFDomc8JKvM8JcNjMQP49n3iMitdaIrLrFVi4XXzHh6D';

    function sendVisitorLog() {
        if (DISCORD_WEBHOOK === 'YOUR_WEBHOOK_URL_HERE') return;
        if (sessionStorage.getItem('visitLogged')) return;
        sessionStorage.setItem('visitLogged', '1');

        var ref = document.referrer;
        if (ref && ref.indexOf(window.location.host) !== -1) ref = '';

        var visitorData = {
            referrer: ref || 'Direct',
            page: window.location.origin + window.location.pathname,
            screen: window.screen.width + 'x' + window.screen.height,
            language: navigator.language,
            platform: navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform,
            mobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Yes' : 'No',
            time: new Date().toISOString()
        };

        fetch('https://ip-api.com/json/?fields=query,country,city,isp,mobile')
            .then(function (r) { return r.json(); })
            .then(function (geo) {
                if (geo && geo.status === 'success') {
                    sendToDiscord(visitorData, {
                        ip: geo.query,
                        city: geo.city,
                        country_name: geo.country,
                        org: geo.isp,
                        mobile: geo.mobile
                    });
                } else {
                    sendToDiscord(visitorData, null);
                }
            })
            .catch(function () {
                sendToDiscord(visitorData, null);
            });
    }

    function sendToDiscord(data, geo) {
        var location = geo ? (geo.city || '?') + ', ' + (geo.country_name || '?') : 'Unknown';
        var ip = geo ? geo.ip : 'Unknown';
        var isp = geo ? (geo.org || 'Unknown') : 'Unknown';

        var desc = [
            '**Page:** ' + data.page,
            '**Referrer:** ' + data.referrer,
            '',
            '**IP:** `' + ip + '`',
            '**Location:** ' + location,
            '**ISP:** ' + isp,
            '',
            '**Screen:** ' + data.screen + ' | **Mobile:** ' + data.mobile,
            '**Platform:** ' + data.platform + ' | **Lang:** ' + data.language
        ].join('\n');

        var payload = {
            embeds: [{
                title: ':bust_in_silhouette: New Visitor',
                description: desc,
                color: 0x7c3aed,
                timestamp: data.time,
                footer: { text: 'Portfolio Analytics' }
            }]
        };

        fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function () {});
    }

    sendVisitorLog();
})();

(function () {
    var statusEl = document.querySelector('.hero-status');
    var dayNightEl = document.getElementById('statusDayNight');
    var timeEl = document.getElementById('statusTime');
    var labelEl = document.getElementById('statusLabel');
    if (!dayNightEl || !timeEl) return;

    var sunSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    var moonSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

    function updateAlmatyTime() {
        var now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
        var h = now.getHours();
        var m = now.getMinutes();
        var timeStr = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
        var isAwake = h >= 8;

        timeEl.textContent = timeStr + ' GMT+5';
        dayNightEl.innerHTML = isAwake ? sunSvg : moonSvg;

        if (isAwake) {
            statusEl.classList.remove('sleeping');
            labelEl.textContent = 'Online';
        } else {
            statusEl.classList.add('sleeping');
            labelEl.textContent = 'AFK';
        }
    }

    updateAlmatyTime();
    setInterval(updateAlmatyTime, 30000);
})();

(function () {
    var toggle = document.getElementById('themeToggle');
    var saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    if (toggle) {
        toggle.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'light' ? 'dark' : 'light';
            if (next === 'dark') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
            localStorage.setItem('theme', next);
        });
    }
})();

(function () {
    var player = document.getElementById('musicPlayer');
    var btn = document.getElementById('musicBtn');
    if (!btn || !player) return;

    var audio = new Audio('ambient.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    var playing = false;

    function startMusic() {
        audio.play().then(function () {
            playing = true;
            player.classList.add('playing');
        }).catch(function () {
            document.addEventListener('click', function once() {
                audio.play().then(function () {
                    playing = true;
                    player.classList.add('playing');
                }).catch(function () {});
                document.removeEventListener('click', once);
            });
        });
    }

    var loaderSeen = sessionStorage.getItem('loaderSeen');
    if (loaderSeen) {
        startMusic();
    } else {
        document.addEventListener('loaderDone', startMusic);
    }

    btn.addEventListener('click', function () {
        if (playing) {
            audio.pause();
            player.classList.remove('playing');
        } else {
            audio.play().catch(function () {});
            player.classList.add('playing');
        }
        playing = !playing;
    });
})();

(function () {
    var canvas = document.getElementById('easterEgg');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var sequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    var pos = 0;
    var active = false;
    var drops = [];
    var cols;
    var animId;

    document.addEventListener('keydown', function (e) {
        if (active) return;
        if (e.keyCode === sequence[pos]) {
            pos++;
            if (pos === sequence.length) {
                pos = 0;
                startMatrix();
            }
        } else {
            pos = 0;
        }
    });

    function startMatrix() {
        active = true;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.classList.add('active');
        canvas.style.pointerEvents = 'auto';

        cols = Math.floor(canvas.width / 16);
        drops = [];
        for (var i = 0; i < cols; i++) {
            drops[i] = Math.random() * -100;
        }

        var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
        var frame = 0;

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#7c3aed';
            ctx.font = '14px monospace';

            for (var i = 0; i < drops.length; i++) {
                var ch = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(ch, i * 16, drops[i] * 16);
                if (drops[i] * 16 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            frame++;
            if (frame < 300) {
                animId = requestAnimationFrame(draw);
            } else {
                canvas.classList.remove('active');
                canvas.style.pointerEvents = 'none';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                active = false;
            }
        }

        draw();

        canvas.addEventListener('click', function once() {
            cancelAnimationFrame(animId);
            canvas.classList.remove('active');
            canvas.style.pointerEvents = 'none';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            active = false;
            canvas.removeEventListener('click', once);
        });
    }
})();


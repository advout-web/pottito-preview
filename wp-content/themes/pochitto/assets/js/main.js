/**
 * Pochitto Lab — main.js
 * ローディング、ヘッダー、全画面メニュー、出現アニメーション、FV のウィンドウ（ドラッグ・タイピング）、
 * GSAP ScrollTrigger によるスクロール連動（ABOUT の文字色、SERVICE の積み重ね、FLOW の線）。
 */
(function () {
	'use strict';

	var doc = document.documentElement;
	var body = document.body;
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var isShot = function () { return doc.classList.contains('is-shot'); };
	var isFront = body.classList.contains('is-front');

	/* ---------- 文字を1文字ずつ span に分ける ---------- */
	function split(el) {
		if (el.dataset.splitDone) return;
		el.dataset.splitDone = '1';
		var i = 0;
		var walk = function (node) {
			Array.prototype.slice.call(node.childNodes).forEach(function (child) {
				if (child.nodeType === 3) {
					var frag = document.createDocumentFragment();
					Array.from(child.textContent).forEach(function (c) {
						if (/\s/.test(c) && c !== ' ') { frag.appendChild(document.createTextNode(c)); return; }
						var s = document.createElement('span');
						s.className = 'ch';
						s.style.setProperty('--i', i++);
						s.textContent = c;
						frag.appendChild(s);
					});
					child.parentNode.replaceChild(frag, child);
				} else if (child.nodeType === 1 && child.tagName !== 'BR') {
					walk(child);
				}
			});
		};
		walk(el);
	}
	document.querySelectorAll('.js-split, .js-keys').forEach(split);

	/* ---------- ローディング ---------- */
	var loader = document.querySelector('.loader');
	var readyDone = false;
	function ready() {
		if (readyDone) return;
		readyDone = true;
		body.classList.add('is-ready');
		if (window.ScrollTrigger) window.ScrollTrigger.refresh();
	}
	function runLoader() {
		if (!loader || isShot()) { if (loader) loader.classList.add('is-gone'); ready(); return; }
		var num = loader.querySelector('.loader__num');
		var t0 = performance.now();
		var minTime = reduce ? 0 : (isFront ? 1500 : 650);
		var loaded = document.readyState === 'complete';
		window.addEventListener('load', function () { loaded = true; });
		var tick = function (now) {
			var p = Math.min(1, (now - t0) / Math.max(minTime, 1));
			var shown = Math.floor((loaded ? p : Math.min(p, 0.9)) * 100);
			if (num) num.textContent = shown;
			if (p < 1 || !loaded) { requestAnimationFrame(tick); return; }
			finish();
		};
		var finish = function () {
			if (reduce) { loader.classList.add('is-gone'); ready(); return; }
			loader.classList.add('is-press');
			setTimeout(function () {
				loader.classList.add('is-out');
				ready();
				setTimeout(function () { loader.classList.add('is-gone'); }, 800);
			}, 520);
		};
		requestAnimationFrame(function () { loader.classList.add('is-go'); });
		requestAnimationFrame(tick);
		// 読み込みが終わらない場合の保険.
		setTimeout(function () { loaded = true; }, 6000);
	}
	runLoader();

	/* ---------- ヘッダー（下スクロールで隠れ、上スクロールで出る） ---------- */
	var header = document.getElementById('site-header');
	var pagetop = document.querySelector('.pagetop');
	var lastY = window.scrollY;
	var onScroll = function () {
		var y = window.scrollY;
		if (header && !body.classList.contains('is-locked')) {
			header.classList.toggle('is-hidden', y > 200 && y > lastY + 2);
			if (y < lastY - 2 || y < 200) header.classList.remove('is-hidden');
		}
		if (pagetop) pagetop.classList.toggle('is-show', y > 600);
		lastY = y;
	};
	window.addEventListener('scroll', onScroll, { passive: true });
	if (pagetop) {
		pagetop.addEventListener('click', function (e) {
			e.preventDefault();
			window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
		});
	}

	/* ---------- 時計（ヘッダー） ---------- */
	var clocks = document.querySelectorAll('.site-header__clock');
	var setClock = function () {
		var d = new Date();
		var t = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
		clocks.forEach(function (c) { c.textContent = t; });
	};
	if (clocks.length) { setClock(); setInterval(setClock, 10000); }

	/* ---------- 全画面メニュー ---------- */
	var menuBtn = document.querySelector('.menu-btn');
	var drawer = document.getElementById('drawer');
	if (menuBtn && drawer) {
		var label = menuBtn.querySelector('.menu-btn__label');
		var setOpen = function (open) {
			menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
			drawer.classList.toggle('is-open', open);
			drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
			body.classList.toggle('is-locked', open);
			if (label) label.textContent = open ? 'とじる' : 'メニュー';
			if (open) { header.classList.remove('is-hidden'); var f = drawer.querySelector('a'); if (f) setTimeout(function () { f.focus(); }, 300); }
		};
		menuBtn.addEventListener('click', function () { setOpen(menuBtn.getAttribute('aria-expanded') !== 'true'); });
		drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setOpen(false); menuBtn.focus(); }
		});
	}

	/* ---------- スクロール出現 ---------- */
	var targets = document.querySelectorAll('.reveal, .reveal-stagger, .js-split');
	if ('IntersectionObserver' in window && !isShot()) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
			});
		}, { rootMargin: '0px 0px -10% 0px' });
		targets.forEach(function (t) { io.observe(t); });
	} else {
		targets.forEach(function (t) { t.classList.add('is-in'); });
	}

	/* ---------- FV：コードのタイピング（くり返し） ---------- */
	document.querySelectorAll('.js-type').forEach(function (el) {
		var text = el.getAttribute('data-text') || '';
		if (reduce || isShot()) { el.textContent = text; return; }
		var i = 0;
		var dir = 1;
		var step = function () {
			i += dir;
			el.textContent = text.slice(0, i);
			var wait = 70 + Math.random() * 60;
			if (i >= text.length) { dir = -1; wait = 2400; }
			else if (i <= 0) { dir = 1; wait = 700; }
			else if (dir < 0) { wait = 22; }
			setTimeout(step, wait);
		};
		setTimeout(step, 1800);
	});

	/* ---------- FV：ウィンドウをドラッグで動かす ---------- */
	var z = 10;
	document.querySelectorAll('.js-drag').forEach(function (win) {
		var sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
		win.addEventListener('pointerdown', function (e) {
			if (e.button !== 0) return;
			dragging = true;
			win.setPointerCapture(e.pointerId);
			win.classList.add('is-dragging');
			win.style.zIndex = ++z;
			sx = e.clientX; sy = e.clientY;
		});
		win.addEventListener('pointermove', function (e) {
			if (!dragging) return;
			var x = ox + e.clientX - sx;
			var y = oy + e.clientY - sy;
			win.style.transform = 'translate(' + x + 'px,' + y + 'px)';
		});
		var end = function (e) {
			if (!dragging) return;
			dragging = false;
			ox += e.clientX - sx; oy += e.clientY - sy;
			win.classList.remove('is-dragging');
		};
		win.addEventListener('pointerup', end);
		win.addEventListener('pointercancel', end);
	});

	/* ---------- 大きなボタン：カーソルに少し吸い寄せられる ---------- */
	if (!reduce && window.matchMedia('(hover: hover)').matches) {
		document.querySelectorAll('.js-magnet').forEach(function (btn) {
			btn.addEventListener('pointermove', function (e) {
				var r = btn.getBoundingClientRect();
				var dx = (e.clientX - r.left - r.width / 2) * 0.18;
				var dy = (e.clientY - r.top - r.height / 2) * 0.18;
				btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
			});
			btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
		});
	}

	/* ---------- GSAP ScrollTrigger ---------- */
	var paint = document.querySelector('.js-paint');
	var flowPath = document.querySelector('.flow__path');
	var paintAll = function () {
		if (paint) paint.querySelectorAll('span').forEach(function (s) { s.classList.add('is-on'); });
		if (flowPath) flowPath.style.setProperty('--draw', 0);
	};
	if (reduce || isShot() || !window.gsap || !window.ScrollTrigger) {
		paintAll();
		return;
	}
	var gsap = window.gsap;
	gsap.registerPlugin(window.ScrollTrigger);

	// ABOUT：スクロールに合わせて1行ずつ文字に色が付く.
	if (paint) {
		var spans = paint.querySelectorAll('span');
		window.ScrollTrigger.create({
			trigger: paint,
			start: 'top 78%',
			end: 'bottom 45%',
			scrub: true,
			onUpdate: function (self) {
				var n = Math.round(self.progress * spans.length);
				spans.forEach(function (s, k) { s.classList.toggle('is-on', k < n); });
			}
		});
	}

	// SERVICE：後ろのカードが少し縮んで奥に下がる.
	var cards = gsap.utils.toArray('.stack__card');
	var mm = gsap.matchMedia();
	mm.add('(min-width: 861px)', function () {
		cards.forEach(function (card, k) {
			var next = cards[k + 1];
			if (!next) return;
			gsap.to(card, {
				scale: 0.93,
				rotate: k % 2 ? 1.2 : -1.2,
				filter: 'brightness(.9)',
				ease: 'none',
				scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 20%', scrub: true }
			});
		});
	});

	// FLOW：線が引かれていく.
	if (flowPath) {
		var proxy = { d: 1 };
		gsap.to(proxy, {
			d: 0,
			ease: 'none',
			scrollTrigger: { trigger: '.flow__wrap', start: 'top 75%', end: 'bottom 70%', scrub: true },
			onUpdate: function () { flowPath.style.setProperty('--draw', proxy.d); }
		});
	}

	// FV：スクロールでウィンドウ群がゆっくり上へ（視差）.
	if (document.querySelector('.fv__stage')) {
		gsap.to('.fv__stage', {
			yPercent: -14,
			ease: 'none',
			scrollTrigger: { trigger: '.fv', start: 'top top', end: 'bottom top', scrub: true }
		});
	}

	window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
})();

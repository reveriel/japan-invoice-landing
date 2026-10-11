/* ==========================================================================
   ラク請求 — Landing Page Scripts
   依存ライブラリなし。すべての機能は失敗しても本体の表示を壊さない。
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ----------------------------------------------------------------------
     1. テーマ切り替え（ライト / ダーク / 自動）
     localStorage は失敗しうる（プライベートモード等）ので必ず try/catch。
     ---------------------------------------------------------------------- */
  var THEME_KEY = 'raku-seikyu-theme';
  var root = document.documentElement;

  function readStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(value) {
    try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* 保存できなくても続行 */ }
  }

  // 初期テーマを適用（FOUC を避けるため head 内のインラインでも可だが、ここで一括処理）
  var saved = readStoredTheme();
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  var themeToggle = $('#themeToggle');

  function isDarkNow() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'dark')  return true;
    if (attr === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function syncThemeButton() {
    if (!themeToggle) return;
    var dark = isDarkNow();
    themeToggle.setAttribute('aria-label', dark ? 'ライトモードに切り替える' : 'ダークモードに切り替える');
    themeToggle.setAttribute('title',      dark ? 'ライトモードに切り替える' : 'ダークモードに切り替える');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = isDarkNow() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      storeTheme(next);
      syncThemeButton();
    });
    syncThemeButton();
  }

  // OS のテーマ変更に追従（手動選択していない場合のみ）
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onSchemeChange = function () {
      if (!readStoredTheme()) syncThemeButton();
    };
    if (mq.addEventListener) mq.addEventListener('change', onSchemeChange);
    else if (mq.addListener) mq.addListener(onSchemeChange);
  }

  /* ----------------------------------------------------------------------
     2. ヘッダー：スクロールで影を付ける
     ---------------------------------------------------------------------- */
  var header = $('#siteHeader');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------------
     3. モバイルナビ
     ---------------------------------------------------------------------- */
  var navToggle = $('#navToggle');
  var mobileNav = $('#mobileNav');

  function closeMobileNav() {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'メニューを開く');
    mobileNav.hidden = true;
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      if (open) {
        closeMobileNav();
      } else {
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'メニューを閉じる');
        mobileNav.hidden = false;
      }
    });

    $$('a', mobileNav).forEach(function (a) {
      a.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileNav();
    });

    // デスクトップ幅に戻ったら閉じる
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) closeMobileNav();
    });
  }

  /* ----------------------------------------------------------------------
     4. スクロール表示アニメーション（控えめに）
     ---------------------------------------------------------------------- */
  var revealTargets = $$('.reveal');
  var reduceMotion = window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showAllReveals() {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (!revealTargets.length) {
    /* 何もしない */
  } else if (reduceMotion || !('IntersectionObserver' in window)) {
    showAllReveals();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // 同じ行のカードが少しずつ遅れて出るように
        var siblings = entry.target.parentElement
          ? Array.prototype.indexOf.call(entry.target.parentElement.children, entry.target)
          : 0;
        var delay = Math.min(Math.max(siblings, 0), 5) * 60;
        setTimeout(function () { entry.target.classList.add('is-visible'); }, delay);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(function (el) { io.observe(el); });

    // フェイルセーフ：何らかの理由で IntersectionObserver が発火しなくても、
    // 3秒後には必ずすべて表示する（内容が消えたままになるのを防ぐ）。
    window.setTimeout(showAllReveals, 3000);
  }

  /* ----------------------------------------------------------------------
     5. FAQ：同時に1つだけ開く（開いているものを閉じてもよい）
     ---------------------------------------------------------------------- */
  var faqItems = $$('.faq-item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item && other.open) other.open = false;
      });
    });
  });

  /* ----------------------------------------------------------------------
     6. 先行登録フォーム
     バックエンドが無いので、入力内容を検証したうえで mailto: を組み立てる。
     本番ではこの submit ハンドラを fetch() に差し替えるだけでよい。
     ---------------------------------------------------------------------- */
  var form   = $('#signupForm');
  var email  = $('#email');
  var status = $('#formStatus');

  // 送信先。実際に運用するときはここを差し替える。
  // ※ 公開前に、このアドレスが実在し受信できることを必ず確認すること。
  var CONTACT_EMAIL = 'contact@reveriel.com';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('is-error', 'is-success');
    if (kind) status.classList.add(kind);
  }

  if (form && email) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var value = email.value.trim();

      if (!value) {
        email.setAttribute('aria-invalid', 'true');
        setStatus('メールアドレスを入力してください。', 'is-error');
        email.focus();
        return;
      }

      if (!EMAIL_RE.test(value)) {
        email.setAttribute('aria-invalid', 'true');
        setStatus('メールアドレスの形式が正しくないようです。ご確認ください。', 'is-error');
        email.focus();
        return;
      }

      email.removeAttribute('aria-invalid');

      var role       = $('#role');
      var invoiceUse = $('#invoiceUser');

      var subject = '【ラク請求】β版の先行登録を希望します';
      var bodyLines = [
        'ラク請求のβ版先行登録を希望します。',
        '',
        'メールアドレス: ' + value,
        'お仕事の種類: ' + (role && role.value ? role.value : '未回答'),
        'インボイス登録事業者: ' + (invoiceUse && invoiceUse.checked ? 'はい' : 'いいえ／未登録'),
        '',
        '―――――――――――――――',
        'このメールはラク請求のランディングページから送信されました。'
      ];

      var mailto = 'mailto:' + CONTACT_EMAIL +
                   '?subject=' + encodeURIComponent(subject) +
                   '&body='    + encodeURIComponent(bodyLines.join('\n'));

      setStatus('ありがとうございます。メールソフトを開きます。送信が難しい場合は ' +
                CONTACT_EMAIL + ' までご連絡ください。', 'is-success');

      // メールソフトが起動しない環境でも登録内容が失われないよう、リンクも残す
      window.location.href = mailto;

      if (status) {
        status.insertAdjacentHTML('beforeend',
          '<br><a href="' + mailto + '">メールソフトが開かない場合はこちらをクリック</a>');
      }
    });

    // 入力し直したらエラー表示を消す
    email.addEventListener('input', function () {
      if (email.getAttribute('aria-invalid') === 'true') {
        email.removeAttribute('aria-invalid');
        setStatus('', null);
      }
    });
  }

  /* ----------------------------------------------------------------------
     7. アンカーリンク：#signup へ飛んだときメール欄にフォーカスを当てる
     ---------------------------------------------------------------------- */
  $$('a[href="#signup"]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (!email) return;
      window.setTimeout(function () {
        // スムーススクロールの完了を待ってからフォーカス
        try { email.focus({ preventScroll: true }); } catch (e) { email.focus(); }
      }, 480);
    });
  });

  /* ----------------------------------------------------------------------
     8. 現在の年をフッターに反映（HTMLに直書きしていてもズレないように）
     ---------------------------------------------------------------------- */
  var copyEl = $('.copy');
  if (copyEl) {
    copyEl.innerHTML = copyEl.innerHTML.replace(/\d{4}/, String(new Date().getFullYear()));
  }

})();

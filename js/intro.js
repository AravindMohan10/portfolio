(function () {
  const KEY = 'dimension-entered';
  const intro = document.getElementById('intro');
  const skip = document.getElementById('intro-skip');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let finished = false;
  const timers = [];

  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function setPhase(cls) {
    if (!intro || finished) return;
    intro.className = 'intro ' + cls;
  }

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);

    document.body.classList.remove('intro-active');
    document.body.classList.add('intro-done');
    sessionStorage.setItem(KEY, '1');
    if (intro) {
      intro.classList.add('is-done');
      setTimeout(function () {
        intro.remove();
      }, 350);
    }
  }

  if (!intro || reduced || sessionStorage.getItem(KEY)) {
    document.body.classList.add('intro-done');
    if (intro) intro.remove();
    return;
  }

  document.body.classList.add('intro-active');
  if (skip) skip.addEventListener('click', finish);

  setPhase('intro--phase-static');
  later(function () { setPhase('intro--phase-shock'); }, 120);
  later(function () { setPhase('intro--phase-split'); }, 320);
  later(function () { setPhase('intro--phase-shock'); }, 480);
  later(function () { setPhase('intro--phase-split'); }, 560);
  later(function () { setPhase('intro--phase-resolve'); }, 720);
  later(function () { setPhase('intro--phase-flash'); }, 880);
  later(finish, 1050);
})();

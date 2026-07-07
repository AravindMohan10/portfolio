(function () {
  const words = ['BAM!', 'POW!', 'THWIP!', 'ZAP!', 'WHAM!', 'ZIP!'];

  document.addEventListener('click', function (e) {
    if (e.target.closest('.intro-skip')) return;

    const word = words[Math.floor(Math.random() * words.length)];
    const el = document.createElement('div');
    el.className = 'impact';
    el.textContent = word;
    el.style.left = e.clientX - 60 + 'px';
    el.style.top = e.clientY - 40 + 'px';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 700);
  });
})();

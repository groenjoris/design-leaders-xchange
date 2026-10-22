  (function () {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var hero = document.querySelector('header.hero > img');
    var bands = Array.prototype.slice.call(document.querySelectorAll('figure.band'));
    var ticking = false;

    function update() {
      ticking = false;
      var vh = innerHeight;
      if (scrollY < vh * 1.5) {
        hero.style.transform = 'translate3d(0,' + (scrollY * 0.25).toFixed(1) + 'px,0)';
      }
      bands.forEach(function (band) {
        var r = band.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        // -1 when the band leaves at the top, 1 when it enters at the bottom
        var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        band.firstElementChild.style.transform = 'translate3d(0,' + (-progress * r.height * 0.1).toFixed(1) + 'px,0)';
      });
    }

    function schedule() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    update();
  })();

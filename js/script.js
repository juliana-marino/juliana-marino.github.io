// ---- Scroll-triggered reveal ----
// Add the "reveal-box" class to any element (image, process step, section)
// and it will fade + slide in the first time it scrolls into view.
const revealTargets = document.querySelectorAll('.reveal-box');

if (revealTargets.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  revealTargets.forEach((element) => revealObserver.observe(element));
}

console.log('Portfolio loaded');

/* ==================================================
   Book flip viewer
   ================================================== */

class BookFlip {
  constructor(element, options) {
    this.el = element;
    this.accent = options.accent || '#E0442A';

    this.el.style.setProperty('--book-accent', this.accent);

    // Optional customization — each falls back to the accent color above
    // if left unset. See bookConfigs below for examples.
    if (options.navHoverColor) {
      this.el.style.setProperty('--book-nav-hover', options.navHoverColor);
    }

    if (options.thumbColor) {
      this.el.style.setProperty('--book-thumb-color', options.thumbColor);
    }

    if (options.thumbImage) {
      this.el.style.setProperty('--book-thumb-image', `url('${options.thumbImage}')`);
    }

    if (options.thumbSize) {
      this.el.style.setProperty('--book-thumb-size', options.thumbSize);
    }

    if (options.thumbRadius) {
      this.el.style.setProperty('--book-thumb-radius', options.thumbRadius);
    }

    const cover = options.cover || {};
    const backCover = options.backCover || {};

    this.leaves = [
      {
        front: cover.outer || null,
        back: cover.inner || null,
        coverEnd: 'front'
      },

      ...options.pages.map((page, index) => ({
        front: page.front || null,
        back: page.back || null,
        pageIndex: index + 1
      })),

      {
        front: backCover.inner || null,
        back: backCover.outer || null,
        coverEnd: 'back'
      }
    ];

    this.current = 0;
    this.animating = false;

    this.build();
    this.render();
    this.bindEvents();
  }

  build() {
    this.el.innerHTML = `
      <div class="book-row">
        <button class="book-nav prev" type="button" aria-label="Página anterior">
          &larr;
        </button>

        <div class="book-stage"></div>

        <button class="book-nav next" type="button" aria-label="Próxima página">
          &rarr;
        </button>
      </div>

      <div class="book-scrubber">
        <button class="book-close" type="button" aria-label="Fechar livro (voltar à capa)" title="Fechar livro">
          &#8676;
        </button>
        <input type="range" class="book-slider" min="0" max="0" value="0" step="1" aria-label="Ir para uma página">
      </div>
    `;

    this.stage = this.el.querySelector('.book-stage');
    this.prevBtn = this.el.querySelector('.prev');
    this.nextBtn = this.el.querySelector('.next');
    this.closeBtn = this.el.querySelector('.book-close');
    this.slider = this.el.querySelector('.book-slider');

    this.cards = this.leaves.map((leaf) => {
      const card = document.createElement('div');
      card.className = 'book-leaf';

      const transparentFront = this.isTransparent(leaf, 'front')
        ? ' book-face-transparent'
        : '';

      const transparentBack = this.isTransparent(leaf, 'back')
        ? ' book-face-transparent'
        : '';

      card.innerHTML = `
        <div class="book-leaf-inner">
          <div class="book-face front${transparentFront}">
            ${this.renderFace(leaf.front, leaf, 'front')}
          </div>

          <div class="book-face back${transparentBack}">
            ${this.renderFace(leaf.back, leaf, 'back')}
          </div>
        </div>
      `;

      this.stage.appendChild(card);
      return card;
    });

    // Now that we know how many leaves there are, the slider can span
    // from the closed cover (0) to the closed back cover (total).
    this.slider.max = String(this.cards.length);
  }

  isTransparent(leaf, side) {
    // Only Raízes faces 9, 10, 11, and 12 are semi-transparent.
    if (this.el.dataset.book !== 'raizes') {
      return false;
    }

    if (!leaf.pageIndex) {
      return false;
    }

    const pageNumber = side === 'front'
      ? leaf.pageIndex * 2 - 1
      : leaf.pageIndex * 2;

    return pageNumber >= 9 && pageNumber <= 12;
  }

  renderFace(url, leaf, side) {
    const metadata = this.faceMeta(leaf, side);

    if (url) {
      return `<img src="${url}" alt="${metadata.alt}" loading="lazy">`;
    }

    return `
      <div class="page-placeholder">
        <span class="ph-icon">[image]</span>
        <span class="ph-label">${metadata.label}</span>
        <span class="ph-hint">${metadata.hint}</span>
      </div>
    `;
  }

  faceMeta(leaf, side) {
    if (leaf.coverEnd === 'front') {
      return side === 'front'
        ? {
            label: 'Capa',
            hint: 'cover.webp',
            alt: 'Capa do livro'
          }
        : {
            label: 'Capa · verso',
            hint: 'cover-verso.webp',
            alt: 'Verso da capa do livro'
          };
    }

    if (leaf.coverEnd === 'back') {
      return side === 'front'
        ? {
            label: 'Contracapa · verso',
            hint: 'back-cover-verso.webp',
            alt: 'Verso da contracapa'
          }
        : {
            label: 'Contracapa',
            hint: 'back-cover.webp',
            alt: 'Contracapa do livro'
          };
    }

    const pageNumber = side === 'front'
      ? leaf.pageIndex * 2 - 1
      : leaf.pageIndex * 2;

    const filename = `page-${String(pageNumber).padStart(2, '0')}.webp`;

    return {
      label: `Página ${pageNumber}`,
      hint: filename,
      alt: `Página ${pageNumber}`
    };
  }

  render() {
    const total = this.cards.length;

    this.cards.forEach((card, index) => {
      const inner = card.querySelector('.book-leaf-inner');
      const flipped = index < this.current;

      inner.style.transform = flipped
        ? 'rotateY(-180deg)'
        : 'rotateY(0deg)';

      const depth = flipped
        ? this.current - 1 - index
        : index - this.current;

      card.style.transform = `
        translateZ(${-depth * 2.5}px)
        rotateZ(${depth * (flipped ? -0.5 : 0.5)}deg)
      `;

      card.style.zIndex = total - depth;
      card.style.opacity = depth > 5 ? 0 : 1;
    });

    this.prevBtn.disabled = this.current === 0;
    this.nextBtn.disabled = this.current >= total;

    if (this.closeBtn) {
      // Already at the cover — nothing to close.
      this.closeBtn.disabled = this.current === 0;
    }

    if (this.slider) {
      this.slider.value = String(this.current);
    }

    const progress = this.el.parentElement.querySelector('[data-progress]');

    if (progress) {
      const label = this.current === 0
        ? 'Capa'
        : this.current >= total
          ? 'Contracapa'
          : `Folha aberta ${this.current} / ${total - 1}`;

      progress.textContent = label;
    }
  }

  next() {
    if (this.animating || this.current >= this.cards.length) {
      return;
    }

    this.animating = true;
    this.current += 1;
    this.render();

    setTimeout(() => {
      this.animating = false;
    }, 700);
  }

  prev() {
    if (this.animating || this.current <= 0) {
      return;
    }

    this.animating = true;
    this.current -= 1;
    this.render();

    setTimeout(() => {
      this.animating = false;
    }, 700);
  }

  // Jump straight to any spread — used by the close-book button and the
  // scrubber slider so you don't have to click through every page.
  goTo(index) {
    const total = this.cards.length;
    const clamped = Math.max(0, Math.min(total, index));

    if (clamped === this.current || this.animating) {
      return;
    }

    this.animating = true;
    this.current = clamped;
    this.render();

    setTimeout(() => {
      this.animating = false;
    }, 700);
  }

  bindEvents() {
    this.nextBtn.addEventListener('click', () => this.next());
    this.prevBtn.addEventListener('click', () => this.prev());

    this.closeBtn.addEventListener('click', () => this.goTo(0));

    this.slider.addEventListener('input', (event) => {
      this.goTo(Number(event.target.value));
    });

    this.stage.addEventListener('click', (event) => {
      const card = event.target.closest('.book-leaf');

      if (!card) {
        return;
      }

      const index = this.cards.indexOf(card);

      if (index === this.current) {
        this.next();
      } else if (index === this.current - 1) {
        this.prev();
      }
    });

    this.el.tabIndex = 0;

    this.el.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.next();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.prev();
      }

      if (event.key === 'Home') {
        event.preventDefault();
        this.goTo(0);
      }

      if (event.key === 'End') {
        event.preventDefault();
        this.goTo(this.cards.length);
      }
    });
  }

  static init(element, options) {
    return new BookFlip(element, options);
  }
}

/* ==================================================
   Sequential page-image configuration

   page-01.webp + page-02.webp = first physical interior leaf
   page-03.webp + page-04.webp = second physical interior leaf
   ================================================== */

function createPageLeaves(folder, firstPage, lastPage) {
  const leaves = [];

  for (let page = firstPage; page <= lastPage; page += 2) {
    const frontNumber = String(page).padStart(2, '0');
    const backNumber = String(page + 1).padStart(2, '0');

    leaves.push({
      front: `../images/work/${folder}/page-${frontNumber}.webp`,
      back: `../images/work/${folder}/page-${backNumber}.webp`
    });
  }

  return leaves;
}

const bookConfigs = {
  metamorfose: {
    accent: '#E0442A',

    // Optional — override just the arrow/close hover color and the
    // slider dragger, independent of the accent above. Delete any line
    // you don't want customized and it falls back to `accent`.
    // navHoverColor: '#111111',
    // thumbColor: '#111111',
    // thumbImage: '../images/work/metamorfose/dragger-icon.png',
    // thumbSize: '20px',
    // thumbRadius: '4px', // e.g. a rounded square instead of a circle

    cover: {
      outer: '../images/work/metamorfose/cover.webp',
      inner: '../images/work/metamorfose/cover-verso.webp'
    },

    backCover: {
      inner: '../images/work/metamorfose/back-cover-verso.webp',
      outer: '../images/work/metamorfose/back-cover.webp'
    },

    // 24 interior faces = 12 physical leaves.
    // 4 cover/back-cover faces + 24 interior faces = 28 total faces.
    pages: createPageLeaves('metamorfose', 1, 24)
  },

  raizes: {
    accent: '#hsl(340, 75%, 52%)',
    navHoverColor: 'hsl(340, 75%, 52%)',
    thumbColor: '#hsl(340, 75%, 52%)',
    // thumbImage: '../images/work/raizes/dragger-icon.png',
    // thumbSize: '20px',
    // thumbRadius: '4px',

    cover: {
      outer: '../images/work/raizes/cover.webp',
      inner: '../images/work/raizes/cover-verso.webp'
    },

    backCover: {
      inner: '../images/work/raizes/back-cover-verso.webp',
      outer: '../images/work/raizes/back-cover.webp'
    },

    // 20 interior faces = 10 physical leaves.
    // 4 cover/back-cover faces + 20 interior faces = 24 total faces.
    pages: createPageLeaves('raizes', 1, 20)
  }
};

/* ---- Initialize every book viewer on the site ---- */

document.querySelectorAll('.book-viewer[data-book]').forEach((element) => {
  const bookName = element.dataset.book;
  const config = bookConfigs[bookName];

  if (config) {
    BookFlip.init(element, config);
  }
});
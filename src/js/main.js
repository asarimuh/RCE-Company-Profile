import '../css/main.css';

const talents = [
  {
    name: 'Bingga',
    role: 'Singer',
    description: 'Penyanyi dengan karakter vokal yang kuat dan penuh energi. Bingga siap menghidupkan setiap momen siaran dengan deretan lagu top charts dan interaksi yang selalu seru.',
    image: 'public/assets/talent-bingga.png'
  },
  {
    name: 'Aiko',
    role: 'Host/Dancer',
    description: 'Performa panggung yang karismatik bertemu dengan keahlian hosting yang natural. Aiko menguasai berbagai genre dance dan memiliki kemampuan storytelling yang mampu memikat audiens dari segala kalangan.',
    image: './assets/talent-aiko.png'
  },
  {
    name: 'Lala',
    role: 'Host/Dancer',
    description: 'Dikenal dengan gerakannya yang lincah dan kepribadian yang ceria, Lala adalah pilihan tepat untuk memeriahkan suasana. Ia ahli dalam menciptakan vibe positif dan menjaga keterlibatan penonton secara konsisten.',
    image: './assets/talent-lala.png'
  },
  {
    name: 'Diandra',
    role: 'Host/Dancer',
    description: 'Seorang multitalenta yang memadukan keanggunan tari dengan gaya komunikasi yang elegan. Diandra sangat mahir dalam membawakan acara dengan transisi yang halus dan profesionalisme yang tinggi.',
    image: './assets/talent-diandra.png'
  }
];

const activeImage = document.querySelector('.current-talent-image-container img');
const activeName = document.querySelector('.active-talent-name');
const activeRole = document.querySelector('.active-talent-role');
const activeDescription = document.querySelector('.active-talent-description');
const talentActiveSection = document.querySelector('.talent-active');
const talentCarousel = document.querySelector('.talent-carousel-container');
const talentRight = document.querySelector('.talent-right');
const talentCardContainer = document.querySelector('.talent-card-container');
const thumbnailItems = Array.from(document.querySelectorAll('.next-talent'));
const revealTargets = Array.from(document.querySelectorAll(
  '.hero-image-left, .hero-image-right, .hero-text, .about-image, .about-text, .service-card, ' +
  '.gallery-item, .blog-card, .collaboration-card, .recruitment-card, .footer-column, .faq-card, .talent-active'
));
let activeIndex = 0;

function updateTalentLayout() {
  if (!talentCarousel || !talentRight || !talentCardContainer) return;

  const shouldSeparate = window.innerWidth < 1120;
  const isSeparated = talentCarousel.parentElement !== talentRight;

  if (shouldSeparate && !isSeparated) {
    talentCardContainer.appendChild(talentCarousel);
  } else if (!shouldSeparate && isSeparated) {
    talentRight.appendChild(talentCarousel);
  }
}

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const target = entry.target;
    target.classList.add('visible');
    observer.unobserve(target);
  });
}, {
  threshold: 0.18,
  rootMargin: '0px 0px -100px 0px',
});

revealTargets.forEach((target) => {
  revealObserver.observe(target);
});

function animateActiveTalent() {
  if (!talentActiveSection) return;
  talentActiveSection.classList.remove('animate');
  void talentActiveSection.offsetWidth;
  talentActiveSection.classList.add('animate');
}

const thumbnailObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const index = thumbnailItems.indexOf(entry.target);
    entry.target.style.animationDelay = `${index * 80}ms`;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, {
  threshold: 0.2,
});

thumbnailItems.forEach((thumbnail) => {
  thumbnailObserver.observe(thumbnail);
});

function getNextIndices(currentIndex) {
  const indices = [];
  for (let i = 1; i <= thumbnailItems.length; i += 1) {
    indices.push((currentIndex + i) % talents.length);
  }
  return indices;
}

function renderTalents(index) {
  activeIndex = index;
  const activeTalent = talents[index];

  if (activeImage) activeImage.src = activeTalent.image;
  if (activeImage) activeImage.alt = `${activeTalent.name} performance`;
  if (activeName) activeName.textContent = activeTalent.name;
  if (activeRole) activeRole.textContent = activeTalent.role;
  if (activeDescription) activeDescription.textContent = activeTalent.description;

  const nextIndices = getNextIndices(index);

  thumbnailItems.forEach((thumbnail, position) => {
    const talent = talents[nextIndices[position]];
    const img = thumbnail.querySelector('img');

    if (img) {
      img.src = talent.image;
      img.alt = `${talent.name} thumbnail`;
    }

    thumbnail.dataset.index = nextIndices[position];
    thumbnail.classList.toggle('selected', false);
  });

  if (thumbnailItems[0]) {
    thumbnailItems[0].classList.add('selected');
  }

  animateActiveTalent();
}

function handleThumbnailClick(event) {
  const target = event.currentTarget;
  const index = Number(target.dataset.index);
  if (!Number.isNaN(index)) {
    renderTalents(index);
  }
}

thumbnailItems.forEach((thumbnail) => {
  thumbnail.addEventListener('click', handleThumbnailClick);
});

renderTalents(activeIndex);
updateTalentLayout();
window.addEventListener('resize', updateTalentLayout);

setInterval(() => {
  const nextIndex = (activeIndex + 1) % talents.length;
  renderTalents(nextIndex);
}, 7000);

const faqCards = Array.from(document.querySelectorAll('.faq-card'));

faqCards.forEach((card) => {
  const header = card.querySelector('.faq-card-header');

  header.addEventListener('click', () => {
    faqCards.forEach((otherCard) => {
      if (otherCard === card) {
        otherCard.classList.toggle('active');
      } else {
        otherCard.classList.remove('active');
      }
    });
  });
});

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

if (faqCards.length > 0) {
  faqCards[0].classList.add('active');
}


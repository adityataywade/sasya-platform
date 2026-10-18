import '@sasya/shared-ui/styles.css';
import { createHeader, createFooter, createMobileMenu } from '@sasya/shared-ui';

const pages = {
  home: {
    title: 'Smartly made, with love.',
    intro: 'Sasya Innovations explores practical robotics and connected systems for a cleaner, more resilient energy future.',
    body: `<section class="section public-intro"><div class="container"><div class="section-heading"><span class="eyebrow">What we are building</span><h2>Useful technology for a changing world.</h2><p class="section-intro">We bring hardware, software, and renewable energy together to make complex work feel simpler.</p></div><div class="grid grid-3">
      <article class="card feature-card"><div class="feature-icon">✦</div><h3>Robotics</h3><p>We are developing the SCR Alpha A1 solar panel cleaning robot as an engineering project in active validation.</p><a class="text-link" href="#/products">See the concept <span>→</span></a></article>
      <article class="card feature-card"><div class="feature-icon">⌁</div><h3>Connected systems</h3><p>Telemetry and operations software are being designed to support responsible field testing and service workflows.</p><a class="text-link" href="#/rnd">Explore our R&D <span>→</span></a></article>
      <article class="card feature-card"><div class="feature-icon">◎</div><h3>Research-led</h3><p>Our work brings embedded electronics, software, and renewable-energy applications together.</p><a class="text-link" href="#/about">Meet Sasya <span>→</span></a></article>
    </div></div></section>
    <section class="section product-feature"><div class="container product-feature-grid"><div><span class="eyebrow">SCR Alpha A1</span><h2>Automation for solar care.</h2><p class="section-intro">A planned solar panel cleaning robot, designed around thoughtful engineering and honest progress. Hardware and communication details remain under R&D validation.</p><a class="btn btn-primary" href="#/products">Explore the product <span class="btn-arrow">↗</span></a></div><div class="product-visual" aria-label="Illustration of the SCR Alpha A1 robot"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="robot-card"><span class="robot-status"><i></i> R&D CONCEPT</span><div class="robot-illustration"><div class="robot-sun"></div><div class="robot-body"><span></span><span></span><span></span></div><div class="robot-wheel wheel-one"></div><div class="robot-wheel wheel-two"></div></div><div class="robot-card-footer"><strong>SCR Alpha A1</strong><span>Solar care, reimagined.</span></div></div></div></div></section>
    <section class="section proof-section"><div class="container proof-grid"><div class="proof-number">01</div><div><span class="eyebrow">Our approach</span><h2>Build carefully. Share honestly.</h2></div><p>Every idea starts as a question, becomes a prototype, and earns its place through testing. We keep the journey visible so useful innovation can move forward with trust.</p></div></section>`
  },
  about: { title:'Curiosity with purpose.', intro:'Sasya Innovations is focused on useful technology, renewable energy, and careful engineering.', body:'<section class="section"><div class="container grid grid-2"><div class="card"><h3>Our direction</h3><p>Build technology that is understandable, maintainable, and grounded in real-world needs.</p></div><div class="card"><h3>Our values</h3><p>Curiosity, honesty about what is known, and respect for the people who use and maintain our systems.</p></div></div></section>' },
  products: { title:'Meet SCR-001', intro:'A solar-panel cleaning robot concept from Sasya Innovations, being shaped through careful research and engineering.', body:`<section class="product-page">
    <section class="product-hero-section"><div class="container product-page-intro"><div><span class="eyebrow">Our first product concept</span><h2>Cleaner panels.<br><em>More possibility.</em></h2><p>SCR-001 is a proposed robotic platform for solar-panel cleaning. We are developing the concept and validating the engineering before making production or performance promises.</p><a class="btn btn-primary" href="#estimate">Configure an estimate <span class="btn-arrow">↓</span></a></div><div class="product-badge"><span class="product-badge-line"></span><strong>SCR<br><b>001</b></strong><small>IN DEVELOPMENT</small></div></div></section>
    <section class="section slider-section"><div class="container"><div class="section-heading-row public-section-heading"><div><span class="eyebrow">See the idea in motion</span><h2>From dusty to ready.</h2></div><div class="slider-controls"><button class="slider-arrow" id="slider-prev" type="button" aria-label="Previous slide">←</button><span id="slider-count">01 / 03</span><button class="slider-arrow" id="slider-next" type="button" aria-label="Next slide">→</button></div></div><div class="product-slider" id="product-slider" aria-live="polite">
      <article class="product-slide is-active" data-slide="0"><div class="slide-art solar-cleaning-scene"><div class="scene-sun"></div><div class="scene-horizon"></div><div class="solar-panel"><div class="panel-grid"></div><div class="dust-layer"></div><div class="clean-lane"></div><div class="panel-glare"></div></div><div class="robot-shadow"></div><div class="cleaning-robot"><span class="robot-sensor"></span><span class="robot-roof"></span><span class="robot-brush"></span><i></i><i></i></div><div class="scene-copy"><small>01 / THE CHALLENGE</small><h3>Dust works against every ray.</h3><p>Watch SCR-001 travel across a solar surface, brushing away the layer that blocks clean energy.</p></div><span class="scene-label label-dirty">DUSTY SURFACE</span><span class="scene-label label-clean">CLEANING PATH</span></div></article>
      <article class="product-slide" data-slide="1"><div class="slide-art solar-cleaning-scene scene-process"><div class="scene-sun"></div><div class="scene-horizon"></div><div class="solar-panel"><div class="panel-grid"></div><div class="dust-layer"></div><div class="clean-lane"></div><div class="panel-glare"></div></div><div class="robot-shadow"></div><div class="cleaning-robot"><span class="robot-sensor"></span><span class="robot-roof"></span><span class="robot-brush"></span><i></i><i></i></div><div class="scene-copy"><small>02 / THE PROCESS</small><h3>A considered path across the panel.</h3><p>Navigation, cleaning, sensing, and safety are being explored as one connected system.</p></div><span class="scene-label label-dirty">BEFORE</span><span class="scene-label label-clean">AFTER</span></div></article>
      <article class="product-slide" data-slide="2"><div class="slide-art solar-cleaning-scene scene-result"><div class="scene-sun"></div><div class="scene-horizon"></div><div class="solar-panel"><div class="panel-grid"></div><div class="dust-layer"></div><div class="clean-lane"></div><div class="panel-glare"></div></div><div class="robot-shadow"></div><div class="cleaning-robot"><span class="robot-sensor"></span><span class="robot-roof"></span><span class="robot-brush"></span><i></i><i></i></div><div class="scene-copy"><small>03 / THE POSSIBILITY</small><h3>Keep clean energy moving.</h3><p>Every clean lane is a step toward more dependable solar infrastructure.</p></div><span class="scene-label label-dirty">DUST + SOILING</span><span class="scene-label label-clean">CLEARER PANEL</span></div></article>
    </div><div class="slider-dots" id="slider-dots"><button class="is-active" data-slide-to="0" aria-label="Show slide 1"></button><button data-slide-to="1" aria-label="Show slide 2"></button><button data-slide-to="2" aria-label="Show slide 3"></button></div></div></section>
    <section class="section process-section"><div class="container"><div class="section-heading"><span class="eyebrow">How it is being shaped</span><h2>A product process built on proof.</h2></div><div class="process-grid"><article><span>01</span><h3>Understand the surface</h3><p>Panel dimensions, layout, angle, and site conditions inform the right configuration.</p></article><article><span>02</span><h3>Configure the robot</h3><p>Choose the operating assumptions and components that fit your solar installation.</p></article><article><span>03</span><h3>Review the estimate</h3><p>Receive a planning estimate, then talk with Sasya before any purchase decision.</p></article></div></div></section>
    <section class="section estimate-section" id="estimate"><div class="container estimate-layout"><div class="estimate-intro"><span class="eyebrow">Plan your configuration</span><h2>Get a starting estimate.</h2><p>Use your solar-panel details to explore a preliminary project estimate. This is not a quote, and final pricing will depend on validated specifications and a site discussion.</p><div class="estimate-note"><span>✦</span><p><strong>Early-stage planning tool</strong><br>SCR-001 is not commercially available yet.</p></div></div><form class="estimate-card" id="estimate-form"><div class="estimate-form-header"><strong>Configure SCR-001</strong><span>INR · estimated</span></div><div class="form-grid"><div class="field"><label for="panel-length">Panel length (m)</label><input id="panel-length" type="number" min="0.5" step="0.1" value="2" required></div><div class="field"><label for="panel-width">Panel width (m)</label><input id="panel-width" type="number" min="0.5" step="0.1" value="1" required></div><div class="field"><label for="panel-count">Number of panels</label><input id="panel-count" type="number" min="1" step="1" value="100" required></div><div class="field"><label for="installation">Installation setting</label><select id="installation"><option value="1">Standard ground / accessible roof</option><option value="1.12">Complex roof access (+12%)</option><option value="1.2">High-angle / specialist access (+20%)</option></select></div><div class="field full"><label for="cleaning-system">Cleaning system</label><select id="cleaning-system"><option value="0">Combined brush + water concept</option><option value="35000">Add water recovery module (+₹35,000)</option><option value="18000">Brush-first configuration (+₹18,000)</option></select></div></div><div class="estimate-total"><span>Preliminary estimate</span><strong id="estimate-total">₹2,85,000</strong><small>Includes concept robot configuration. Excludes tax, delivery, installation, and final engineering changes.</small></div><button class="btn btn-primary" type="submit">Prepare my enquiry <span class="btn-arrow">↗</span></button><div class="notice" id="estimate-status" hidden></div></form></div></section>
  </section>` },
  rnd: { title:'Sasya R&D', intro:'Embedded systems, solar automation, and software are being explored as one connected engineering problem.', body:'<section class="section"><div class="container"><div class="card"><h3>Current focus</h3><p>ESP32-S3 firmware architecture, sensor validation, robot mechanics, telemetry contracts, and operational dashboards.</p></div></div></section>' },
  careers: { title:'Build what matters.', intro:'We welcome interest from people who care about engineering, electronics, software, operations, and renewable energy.', body:'<section class="section"><div class="container card"><h3>Expression of interest</h3><p class="muted">There are no published open positions at this time. Use the contact page to share your area of interest; submission is not delivered until a real service is configured.</p><a class="btn btn-outline" href="#/contact">Contact Sasya</a></div></section>' },
  contact: { title:'Start a conversation.', intro:'Share a business, engineering, or partnership enquiry with the Sasya team.', body:'<section class="section"><div class="container card"><form id="contact-form" class="form-grid"><div class="field"><label for="name">Name or business</label><input id="name" required /></div><div class="field"><label for="email">Email</label><input id="email" type="email" required /></div><div class="field"><label for="type">Enquiry type</label><select id="type"><option>Product enquiry</option><option>Partnership</option><option>Careers</option><option>Other</option></select></div><div class="field full"><label for="message">Message</label><textarea id="message" required></textarea></div><div class="field full"><button class="btn btn-primary" type="submit">Prepare enquiry</button><div id="form-status" class="notice" hidden></div></div></form></div></section>' }
};

function render() {
  const key = location.hash.replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '') || 'home';
  const page = pages[key] || pages.home;
  document.title = `${page.title} — Sasya Innovations`;
  const app = document.querySelector('#app');
  app.className = 'public-site-app';
  app.innerHTML = '';
  app.append(createHeader({
    currentPage:key,
    navItems: [
      { label:'HOME', href:'#/', id:'home' },
      { label:'ABOUT', href:'#/about', id:'about' },
      { label:'PRODUCTS', href:'#/products', id:'products' },
      { label:'SASYA R&D', href:'#/rnd', id:'rnd' },
      { label:'CAREERS', href:'#/careers', id:'careers' },
      { label:'CONTACT', href:'#/contact', id:'contact' }
    ],
    logoHref:'#/'
  }));
  const main = document.createElement('main');
  main.innerHTML = `<section class="hero"><div class="hero-glow hero-glow-one"></div><div class="hero-glow hero-glow-two"></div><div class="container hero-content"><div class="hero-copy"><span class="eyebrow">Sasya Innovations</span><h1>${page.title}</h1><p>${page.intro}</p><div class="actions">${key === 'home' ? '<a class="btn btn-primary" href="#/products">Discover SCR Alpha A1 <span class="btn-arrow">↗</span></a><a class="btn btn-secondary" href="#/contact">Talk to us</a>' : '<a class="btn btn-primary" href="#/contact">Make an enquiry <span class="btn-arrow">↗</span></a>'}</div></div><div class="hero-mark" aria-hidden="true"><div class="hero-mark-ring ring-large"></div><div class="hero-mark-ring ring-small"></div><div class="hero-mark-core"><span></span><span></span><span></span></div><span class="hero-mark-label">IDEAS<br><b>IN MOTION</b></span></div></div></section>${page.body}`;
  const footer = createFooter();
  footer.querySelectorAll('a[href^="/"]').forEach((link) => {
    link.href = `#${link.getAttribute('href')}`;
  });
  app.append(main, footer);
  createMobileMenu();
  const instagram = footer.querySelector('a[aria-label="Instagram"]');
  if (instagram) { instagram.href = 'https://www.instagram.com/aditya_taywade123'; instagram.target = '_blank'; instagram.rel = 'noreferrer'; instagram.title = 'Follow Sasya Innovations on Instagram'; }
  const logo = document.createElement('img');
  logo.src = './assets/sasya.png';
  logo.alt = 'Sasya Innovations';
  logo.className = 'brand-logo-image';
  document.querySelector('#header-logo svg')?.replaceWith(logo.cloneNode());
  footer.querySelector('.footer-logo svg')?.replaceWith(logo);
  setupProductPage();
  document.querySelector('#contact-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#form-status');
    status.hidden = false;
    status.textContent = 'Your enquiry is prepared locally. A delivery service must be configured before it can be sent.';
  });
}
function setupProductPage() {
  const slider = document.querySelector('#product-slider');
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.product-slide')];
  const dots = [...document.querySelectorAll('[data-slide-to]')];
  const count = document.querySelector('#slider-count');
  let current = 0;
  let interval;
  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === current));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === current));
    count.textContent = `0${current + 1} / 0${slides.length}`;
  };
  const restart = () => { clearInterval(interval); interval = setInterval(() => showSlide(current + 1), 6000); };
  document.querySelector('#slider-prev')?.addEventListener('click', () => { showSlide(current - 1); restart(); });
  document.querySelector('#slider-next')?.addEventListener('click', () => { showSlide(current + 1); restart(); });
  dots.forEach((dot) => dot.addEventListener('click', () => { showSlide(Number(dot.dataset.slideTo)); restart(); }));
  slider.addEventListener('mouseenter', () => clearInterval(interval));
  slider.addEventListener('mouseleave', restart);
  restart();
  const estimateForm = document.querySelector('#estimate-form');
  const total = document.querySelector('#estimate-total');
  const inputs = ['panel-length', 'panel-width', 'panel-count', 'installation', 'cleaning-system'].map((id) => document.querySelector(`#${id}`));
  const updateEstimate = () => {
    const length = Number(inputs[0].value) || 0;
    const width = Number(inputs[1].value) || 0;
    const panels = Number(inputs[2].value) || 0;
    const multiplier = Number(inputs[3].value) || 1;
    const module = Number(inputs[4].value) || 0;
    const area = length * width * panels;
    const estimate = Math.max(150000, Math.round((180000 + (area * 420) + module) * multiplier / 1000) * 1000);
    total.textContent = `₹${estimate.toLocaleString('en-IN')}`;
  };
  inputs.forEach((input) => input.addEventListener('input', updateEstimate));
  estimateForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#estimate-status');
    status.hidden = false;
    status.textContent = `Your preliminary estimate is ${total.textContent}. Please contact Sasya Innovations at adityataywade.sasya@gmail.com to discuss the configuration.`;
  });
  updateEstimate();
}
window.addEventListener('hashchange', render);
render();

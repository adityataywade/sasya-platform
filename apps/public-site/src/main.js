import '@sasya/shared-ui/styles.css';
import { createHeader, createFooter, createMobileMenu } from '@sasya/shared-ui';

const pages = {
  home: {
    title: 'Smartly made, with love.',
    intro: 'Sasya Innovations explores practical robotics and connected systems for a cleaner, more resilient energy future.',
    body: `<section class="section"><div class="container grid grid-3">
      <article class="card"><h3>Robotics</h3><p>We are developing the SCR Alpha A1 solar panel cleaning robot as an engineering project in active validation.</p></article>
      <article class="card"><h3>Connected systems</h3><p>Telemetry and operations software are being designed to support responsible field testing and service workflows.</p></article>
      <article class="card"><h3>Research-led</h3><p>Our work brings embedded electronics, software, and renewable-energy applications together.</p></article>
    </div></section>
    <section class="section" style="background:#fff"><div class="container grid grid-2"><div><span class="eyebrow">SCR Alpha A1</span><h2>Automation for solar care.</h2><p class="section-intro">The SCR Alpha A1 is a planned solar panel cleaning robot. Hardware and communication details remain under R&D validation, so capabilities shown here are intentionally described as planned.</p><a class="btn btn-primary" href="/products">Explore the product</a></div><div class="card"><h3>Prototype status</h3><p class="muted">ESP32-S3, sensing, motion, and telemetry architecture are being evaluated. Live device connectivity is not claimed by this website.</p></div></div></section>`
  },
  about: { title:'Curiosity with purpose.', intro:'Sasya Innovations is focused on useful technology, renewable energy, and careful engineering.', body:'<section class="section"><div class="container grid grid-2"><div class="card"><h3>Our direction</h3><p>Build technology that is understandable, maintainable, and grounded in real-world needs.</p></div><div class="card"><h3>Our values</h3><p>Curiosity, honesty about what is known, and respect for the people who use and maintain our systems.</p></div></div></section>' },
  products: { title:'SCR Alpha A1', intro:'A solar panel cleaning robot concept supported by a modular telemetry platform.', body:'<section class="section"><div class="container grid grid-3"><div class="card"><h3>Planned sensing</h3><p>Obstacle, environmental, water-level, and motion sensing are part of the proposed electronics architecture and require validation.</p></div><div class="card"><h3>Proposed connectivity</h3><p>Initial software development supports ESP32 Wi-Fi and Firebase demo integration. LoRa or hybrid transport remains configurable.</p></div><div class="card"><h3>Honest progress</h3><p>Product specifications, field performance, and production readiness are not claimed until confirmed by the engineering team.</p></div></div></section>' },
  rnd: { title:'Sasya R&D', intro:'Embedded systems, solar automation, and software are being explored as one connected engineering problem.', body:'<section class="section"><div class="container"><div class="card"><h3>Current focus</h3><p>ESP32-S3 firmware architecture, sensor validation, robot mechanics, telemetry contracts, and operational dashboards.</p></div></div></section>' },
  careers: { title:'Build what matters.', intro:'We welcome interest from people who care about engineering, electronics, software, operations, and renewable energy.', body:'<section class="section"><div class="container card"><h3>Expression of interest</h3><p class="muted">There are no published open positions at this time. Use the contact page to share your area of interest; submission is not delivered until a real service is configured.</p><a class="btn btn-outline" href="#/contact">Contact Sasya</a></div></section>' },
  contact: { title:'Start a conversation.', intro:'Share a business, engineering, or partnership enquiry with the Sasya team.', body:'<section class="section"><div class="container card"><form id="contact-form" class="form-grid"><div class="field"><label for="name">Name or business</label><input id="name" required /></div><div class="field"><label for="email">Email</label><input id="email" type="email" required /></div><div class="field"><label for="type">Enquiry type</label><select id="type"><option>Product enquiry</option><option>Partnership</option><option>Careers</option><option>Other</option></select></div><div class="field full"><label for="message">Message</label><textarea id="message" required></textarea></div><div class="field full"><button class="btn btn-primary" type="submit">Prepare enquiry</button><div id="form-status" class="notice" hidden></div></div></form></div></section>' }
};

function render() {
  const key = location.hash.replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '') || 'home';
  const page = pages[key] || pages.home;
  document.title = `${page.title} — Sasya Innovations`;
  const app = document.querySelector('#app');
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
  main.innerHTML = `<section class="hero"><div class="container"><span class="eyebrow">Sasya Innovations</span><h1>${page.title}</h1><p>${page.intro}</p><div class="actions">${key === 'home' ? '<a class="btn btn-primary" href="#/products">Discover SCR Alpha A1</a><a class="btn btn-secondary" href="#/contact">Talk to us</a>' : '<a class="btn btn-primary" href="#/contact">Make an enquiry</a>'}</div></div></section>${page.body}`;
  const footer = createFooter();
  footer.querySelectorAll('a[href^="/"]').forEach((link) => {
    link.href = `#${link.getAttribute('href')}`;
  });
  app.append(main, footer);
  createMobileMenu();
  document.querySelector('#contact-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#form-status');
    status.hidden = false;
    status.textContent = 'Your enquiry is prepared locally. A delivery service must be configured before it can be sent.';
  });
}
window.addEventListener('hashchange', render);
render();

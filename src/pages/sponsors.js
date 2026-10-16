import { html } from '../lib/html.js';
import { icon, pageHead } from '../lib/ui.js';
import { getSponsors } from '../lib/data.js';

const GROUPS = [
  ['medical', 'Medical partners'],
  ['apparel', 'Official uniform supplier'],
  ['hotel', 'Member discounts'],
  ['corporate', 'Corporate partners'],
];

export default async function sponsors() {
  const list = await getSponsors();
  return html`
    ${pageHead('Our sponsors', 'These partners help keep registration fees low. Please support the businesses that support us.', 'Corporate partners')}
    <section class="section"><div class="wrap">
      ${GROUPS.map(([cat, title]) => {
        const items = list.filter((s) => s.category === cat);
        if (!items.length) return '';
        return html`<h2 class="month">${title}</h2>
          <div class="sponsor-grid">${items.map((s) => html`
            <article class="sponsor-card">
              ${s.logo_url ? html`<img src="${s.logo_url}" alt="${s.name} logo" loading="lazy">` : html`<div class="sponsor-mono" aria-hidden="true">${s.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3)}</div>`}
              <h3>${s.name}</h3>
              ${s.blurb ? html`<p>${s.blurb}</p>` : ''}
              ${s.promo_code ? html`<p>Discount code: <strong class="code">${s.promo_code}</strong></p>` : ''}
              ${s.url ? html`<a class="link-arrow" href="${s.url}" target="_blank" rel="noopener">Visit website ${icon('arrow')}</a>` : ''}
            </article>`)}
          </div>`;
      })}
      <div class="callout">
        <h2>Become a sponsor</h2>
        <p>Reach hundreds of active seniors and their families across the Omaha metro. Team, field and league sponsorships are available.</p>
        <a class="btn btn-accent" href="#/contact?topic=sponsorship">Talk to us about sponsoring</a>
      </div>
    </div></section>`;
}

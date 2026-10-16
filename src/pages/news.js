import { html, md } from '../lib/html.js';
import { icon, pageHead, empty } from '../lib/ui.js';
import { getPosts, getPost } from '../lib/data.js';
import { fmtDate } from '../lib/format.js';

const longDate = (d) => fmtDate(d, { month: 'long', day: 'numeric', year: 'numeric' });

export async function newsIndex() {
  const posts = await getPosts();
  return html`
    ${pageHead('News & announcements', 'What\'s new around Nebraska Senior Softball.', 'News')}
    <section class="section"><div class="wrap narrow">
      ${posts.length ? posts.map((p) => html`
        <a class="news-row" href="#/news/${p.slug}">
          <span class="muted small">${longDate(p.published_at)}</span>
          <h2>${p.title} ${p.pinned ? html`<span class="pill pill-accent">Pinned</span>` : ''}</h2>
          <p>${p.excerpt}</p>
          <span class="link-arrow">Read more ${icon('arrow')}</span>
        </a>`) : empty('No news yet')}
    </div></section>`;
}

export async function newsPost({ slug }) {
  const post = await getPost(slug);
  if (!post) return html`<div class="wrap section">${empty('Post not found')}</div>`;
  return html`
    ${pageHead(post.title, '', longDate(post.published_at))}
    <section class="section"><div class="wrap narrow prose">
      ${md(post.body)}
      <p><a class="link-arrow" href="#/news">${icon('arrow')} Back to all news</a></p>
    </div></section>`;
}

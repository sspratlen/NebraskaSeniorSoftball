import { html } from '../lib/html.js';
import { icon, pageHead, toast, formData } from '../lib/ui.js';
import { query } from '../lib/router.js';
import { supabase } from '../lib/supabase.js';
import { getLeagues } from '../lib/data.js';
import { sendEmail } from '../lib/email.js';

const TOPICS = [
  ['general', 'General question'],
  ['registration', 'Registration & payment'],
  ['mon-wed', 'Monday/Wednesday Night League'],
  ['tuesday', 'Tuesday Morning League'],
  ['friday', 'Friday Morning League'],
  ['rules', 'Rules & umpires'],
  ['sponsorship', 'Sponsorship'],
  ['website', 'Website feedback'],
];

export default async function contact() {
  const leagues = await getLeagues();
  const pre = query().get('topic') || 'general';
  return {
    html: html`
      ${pageHead('Contact us', 'Questions about a league, registration or sponsoring? We\'re happy to help.', 'Get in touch')}
      <section class="section"><div class="wrap two-col wide-left">
        <form id="contact-form" class="form card">
          <div class="grid-2">
            <label>Your name<input name="name" required autocomplete="name"></label>
            <label>Email<input name="email" type="email" required autocomplete="email"></label>
          </div>
          <label>Topic<select name="topic">${TOPICS.map(([k, v]) => html`<option value="${k}" ${k === pre ? 'selected' : ''}>${v}</option>`)}</select></label>
          <label>Message<textarea name="message" rows="6" required maxlength="5000"></textarea></label>
          <button class="btn btn-accent" type="submit">Send message ${icon('arrow')}</button>
        </form>
        <aside>
          <div class="card">
            <h3>${icon('mail')} League inboxes</h3>
            <ul class="plain">
              ${leagues.map((l) => html`<li><strong>${l.short_name}</strong><br><a href="mailto:${l.contact_email}">${l.contact_email}</a></li>`)}
              <li><strong>Commissioner</strong><br><a href="mailto:commissioner@neseniorsoftball.com">commissioner@neseniorsoftball.com</a></li>
            </ul>
          </div>
          <div class="card">
            <h3>${icon('pin')} Mailing address</h3>
            <p>Nebraska Senior Softball<br>P.O. Box 460631<br>Papillion, NE 68046</p>
          </div>
          <div class="card">
            <h3>Follow along</h3>
            <a class="link-arrow" href="https://www.facebook.com/NESENIORSOFTBALL/" target="_blank" rel="noopener">Facebook ${icon('arrow')}</a>
          </div>
        </aside>
      </div></section>`,
    mount(root) {
      const form = root.querySelector('#contact-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = formData(form);
        const btn = form.querySelector('button');
        btn.disabled = true;
        const id = crypto.randomUUID();
        const { error } = await supabase.from('contact_messages').insert({ id, name: d.name, email: d.email, topic: d.topic, message: d.message });
        btn.disabled = false;
        if (error) { toast(`Couldn't send: ${error.message}`, 'error'); return; }
        sendEmail({ type: 'contact_notification', message_id: id });
        form.reset();
        toast('Thanks! Your message was sent to the board.');
      });
    },
  };
}

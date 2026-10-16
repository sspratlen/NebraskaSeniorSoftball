import { html } from '../lib/html.js';
import { icon, pageHead } from '../lib/ui.js';

// Summary of the NSS Rule Book (effective 2021) and league information pages.
// The full rule book PDF is maintained by the Director of Rules & Umpires.
const SECTIONS = [
  ['Eligibility', [
    'A player must turn at least 50 during the current calendar year to play that year.',
    'New players must show proof of age (driver\'s license or birth certificate) to a member of the Board of Directors.',
    'Please honestly assess your physical ability before registering.',
  ]],
  ['Senior safety rules', [
    'A run-scoring line is used in addition to home plate. The runner must touch the ground on or beyond the scoring line to score.',
    'Sliding into the scoring line is an out, except for accidental falls or avoiding a collision.',
    'A double (safety) first base is used to prevent collisions and injuries.',
    'A turf batting mat and strike-zone mat are used at home plate.',
    'Courtesy base runners are allowed.',
  ]],
  ['Pitching', [
    'The pitch must rise a minimum of 6 feet and no more than 12 feet above the playing field.',
  ]],
  ['Batting & scoring', [
    'All players are in the batting line-up.',
    'A maximum number of runs may be scored per inning (see the current rule book for the limit).',
    'A maximum of two over-the-fence home runs per team per game.',
  ]],
  ['Draft & roster', [
    'Monday/Wednesday: managers select every new and returning player in a draft held the week before the first game.',
    'For 48 hours after the draft, managers may trade up to three newly drafted players with managers who agree.',
    'Friday mornings: the board balances teams by skill; no pre-selected teams are accepted. Teams are re-drafted at mid-season.',
    'Players who register after the deadline become pool players. New late registrants play a minimum of two games as pool players to establish their draft round.',
    'The Director of Player Personnel assigns pool players to fill openings and substitute needs at or below the needed draft round.',
  ]],
  ['Sportsmanship', [
    'We encourage a competitive spirit combined with respect for other players, fans and umpires.',
  ]],
];

export default function rules() {
  return html`
    ${pageHead('League rules', 'NSS plays modified slow pitch rules designed to keep seniors safe and the game fun.', 'Rules & guidelines')}
    <section class="section"><div class="wrap two-col wide-left">
      <div class="rules">
        ${SECTIONS.map(([title, items]) => html`
          <section class="rule-block">
            <h2>${title}</h2>
            <ul>${items.map((i) => html`<li>${i}</li>`)}</ul>
          </section>`)}
      </div>
      <aside>
        <div class="card">
          <h3>Official rule book</h3>
          <p>This page is a summary. The official NSS Rule Book governs all play; where they differ, the rule book wins.</p>
          <p class="muted small">Questions about rules or umpires go to the Director of Rules &amp; Umpires.</p>
          <a class="link-arrow" href="#/contact">Ask a rules question ${icon('arrow')}</a>
        </div>
        <div class="card">
          <h3>Weather</h3>
          <p>Rainouts are made up on designated weather makeup dates shown on the <a href="#/calendar">calendar</a>. Watch your email and this site on game days.</p>
        </div>
      </aside>
    </div></section>`;
}

import { qaById, questionText } from '../../app/ask.js';
import { allChunks, DAY, indexSize, state, t } from '../../app/state.js';
import { CORPUS } from '../../domain/corpus.js';
import { esc, fmtNum, fmtTime } from '../format.js';
import { emptyState, pageHead, topicName } from '../components.js';
import { icon } from '../icons.js';

function chart() {
  const days = 14;
  const buckets = Array.from({ length: days }, () => ({ answered: 0, refused: 0 }));
  const now = Date.now();
  state.history.forEach(entry => {
    const age = Math.floor((now - entry.ts) / DAY);
    if (age < 0 || age >= days) return;
    const bucket = buckets[days - 1 - age];
    if (entry.status === 'abstain') bucket.refused += 1;
    else bucket.answered += 1;
  });

  const width = 680;
  const height = 200;
  const left = 34;
  const bottom = 24;
  const max = Math.max(1, ...buckets.map(bucket => bucket.answered + bucket.refused));
  const barWidth = (width - left) / days;

  const grid = [0, 0.5, 1]
    .map(fraction => {
      const y = height - bottom - fraction * (height - bottom - 12);
      const value = max < 4 ? max * fraction : Math.round(max * fraction);
      return `<line x1="${left}" x2="${width}" y1="${y}" y2="${y}" class="chart-grid"/><text x="0" y="${y + 4}" class="chart-label">${value}</text>`;
    })
    .join('');

  const bars = buckets
    .map((bucket, index) => {
      const x = left + index * barWidth + 6;
      const w = barWidth - 12;
      const answeredHeight = (bucket.answered / max) * (height - bottom - 12);
      const refusedHeight = (bucket.refused / max) * (height - bottom - 12);
      const date = new Date(now - (days - 1 - index) * DAY);
      return `
        <rect x="${x}" y="${height - bottom - answeredHeight}" width="${w}" height="${answeredHeight}" rx="2" class="bar-answered"><title>${bucket.answered} ${esc(t('cov.answered'))}</title></rect>
        <rect x="${x}" y="${height - bottom - answeredHeight - refusedHeight}" width="${w}" height="${refusedHeight}" rx="2" class="bar-refused"><title>${bucket.refused} ${esc(t('cov.refused'))}</title></rect>
        <text x="${x + w / 2}" y="${height - 6}" class="chart-label" text-anchor="middle">${date.getDate()}</text>`;
    })
    .join('');

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(t('cov.chart'))}">${grid}${bars}</svg>`;
}

export function coveragePage() {
  const docs = state.uploads.length + (state.settings.useDemo ? CORPUS.DOCS.length : 0);
  const ready = state.uploads.filter(upload => upload.status === 'processed').length + (state.settings.useDemo ? CORPUS.DOCS.length : 0);
  const total = state.history.length;
  const answered = state.history.filter(entry => entry.status === 'answer').length;
  const refused = total - answered;
  const rate = total ? Math.round((answered / total) * 100) : 0;
  const openGaps = state.gaps.filter(gap => gap.status === 'open').length;
  const feedback = Object.values(state.feedback);
  const helpful = feedback.filter(value => value === 'up').length;
  const times = state.history.map(entry => entry.ms).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : null;

  const topMap = {};
  Object.entries(state.liveTop).forEach(([key, value]) => {
    const label = value.qa && qaById(value.qa) ? questionText(qaById(value.qa)) : value.q;
    if (!label) return;
    topMap[label] = (topMap[label] || 0) + value.n;
  });
  const top = Object.entries(topMap).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const topMax = top.length ? top[0][1] : 1;

  const topics = CORPUS.TOPICS.map(topic => {
    const count = allChunks().filter(chunk => chunk.topic === topic.id).length;
    const gaps = state.gaps.filter(gap => gap.status === 'open' && gap.qa && qaById(gap.qa)?.topic === topic.id).length;
    return { topic, count, gaps, level: count >= 3 ? 'strong' : count >= 1 ? 'partial' : 'missing' };
  });

  return `<div class="page">
    ${pageHead(t('app.description'), t('cov.title'), t('cov.sub'))}

    <section class="stats">
      ${[
        ['cov.docs', docs],
        ['cov.processed', ready],
        ['cov.chunks', fmtNum(indexSize())],
        ['cov.questions', fmtNum(total)],
        ['cov.answerrate', total ? rate + '%' : '—'],
        ['cov.open', openGaps],
      ].map(([key, value]) => `<div class="stat"><b>${typeof value === 'number' ? fmtNum(value) : value}</b><span>${esc(t(key))}</span></div>`).join('')}
    </section>

    <div class="grid-2">
      <section class="panel">
        <header class="panel-head">
          <h2>${esc(t('cov.usage'))}</h2>
          <span class="legend"><i class="swatch answered"></i>${esc(t('cov.answered'))}<i class="swatch refused"></i>${esc(t('cov.refused'))}</span>
        </header>
        <div class="chart-wrap">${chart()}</div>
      </section>

      <section class="panel">
        <header class="panel-head"><h2>${esc(t('cov.quality'))}</h2></header>
        <div class="bd quality">
          ${[['cov.ansrate', total ? rate + '%' : '—', rate], ['cov.refrate', total ? 100 - rate + '%' : '—', 100 - rate]].map(([key, label, percent]) => `
            <div class="meter-row">
              <div class="meter-label"><span>${esc(t(key))}</span><b>${label}</b></div>
              <div class="meter"><i style="width:${percent}%"></i></div>
            </div>`).join('')}
          <div class="kv-line"><span>${esc(t('cov.helpful'))}</span><b>${feedback.length ? helpful + ' / ' + feedback.length : '—'}</b></div>
          <div class="kv-line"><span>${esc(t('cov.median'))}</span><b>${median == null ? '—' : median.toFixed(1) + ' ms'}</b></div>
          <p class="muted tiny">${esc(t('cov.note'))}</p>
        </div>
      </section>
    </div>

    <div class="grid-2">
      <section class="panel">
        <header class="panel-head"><h2>${esc(t('cov.top'))}</h2></header>
        <div class="bd">
          ${top.length
            ? top.map(([label, count]) => `<div class="top-row"><div class="top-label"><span>${esc(label)}</span><b>${count}</b></div><div class="meter"><i style="width:${(count / topMax) * 100}%"></i></div></div>`).join('')
            : `<p class="muted">${esc(t('cov.empty'))}</p>`}
        </div>
      </section>

      <section class="panel">
        <header class="panel-head"><h2>${esc(t('cov.topics'))}</h2></header>
        <div class="bd">
          ${!state.settings.useDemo ? `<p class="muted">${esc(t('cov.topics.off'))}</p>` : topics.map(({ topic, count, level }) => `
            <div class="topic-row">
              <span class="topic-name">${esc(topicName(topic.id))}</span>
              <span class="topic-bar"><i class="level-${level}" style="width:${level === 'strong' ? 100 : level === 'partial' ? 50 : 6}%"></i></span>
              <span class="topic-level level-${level}">${esc(t('cov.' + level))}</span>
            </div>`).join('')}
          <p class="muted tiny">${esc(t('cov.topics.note'))}</p>
        </div>
      </section>
    </div>

    <section class="panel flush">
      <header class="panel-head"><h2>${esc(t('cov.recent'))}</h2></header>
      ${state.history.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>${esc(t('spots.q'))}</th><th>${esc(t('spots.status'))}</th><th class="hide-sm">ms</th><th class="hide-md">${esc(t('spots.date'))}</th></tr></thead>
        <tbody>${state.history.slice(0, 8).map(entry => {
          const label = entry.q || (entry.qa ? questionText(qaById(entry.qa)) : '');
          return `<tr><td>${esc(label)}</td><td>${entry.status === 'abstain' ? `<span class="badge warn">${esc(t('abst.badge'))}</span>` : `<span class="badge ok">${esc(t('cov.answered'))}</span>`}</td><td class="hide-sm muted">${entry.ms}</td><td class="hide-md muted">${esc(fmtTime(entry.ts))}</td></tr>`;
        }).join('')}</tbody>
      </table></div>` : `${emptyState('coverage', t('cov.empty'), t('cov.note'))}`}
    </section>
  </div>`;
}

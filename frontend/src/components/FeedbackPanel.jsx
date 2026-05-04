// Map performance band → colour token
const BAND_COLOR = {
  elite:       '#d4f56a',   // accent green
  proficient:  '#a8d94a',   // slightly muted green
  developing:  '#f5c842',   // amber
  needs_work:  '#ff8c42',   // orange
  critical:    '#ff4d6d',   // red
};

const BAND_ICON = {
  elite:      '✅',
  proficient: '🟢',
  developing: '🟡',
  needs_work: '🟠',
  critical:   '🔴',
};

export default function FeedbackPanel({ feedback }) {
  if (!feedback || feedback.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No specific feedback available.
      </div>
    );
  }

  return (
    <div className="feedback-section">
      <ul className="feedback-list" aria-label="Coach recommendations">
        {feedback.map((item, i) => {
          const color = BAND_COLOR[item.band] ?? '#aab8cc';
          const icon  = BAND_ICON[item.band]  ?? '⚪';
          return (
            <li key={i} className="feedback-item" style={{ color }}>
              <span className="feedback-icon" aria-hidden="true">{icon}</span>
              <span>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
                  {item.label}
                </strong>
                {item.tip}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

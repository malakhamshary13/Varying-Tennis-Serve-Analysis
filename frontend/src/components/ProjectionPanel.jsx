// Backend projections shape (from adaptResponse):
// { clay: [{feature, label, unit, current, projected, delta_pct, direction, priority}, ...],
//   hard: [...] }

const COURT_CONFIG = {
  grass: { label: 'Grass Court', emoji: '🟩', accent: '#4a7c59', accentLight: '#6db88a' },
  clay:  { label: 'Clay Court',  emoji: '🟫', accent: '#c97c40', accentLight: '#e8a060' },
  hard:  { label: 'Hard Court',  emoji: '🟦', accent: '#2563a8', accentLight: '#4a9fd4' },
};

const DIRECTION_ICON = {
  increase: '↑',
  decrease: '↓',
  maintain: '–',
};

const PRIORITY_COLOR = {
  low:      'var(--text-muted)',
  medium:   '#f5c842',
  high:     '#ff8c42',
  critical: '#ff4d6d',
};

export default function ProjectionPanel({ projections, currentCourt }) {
  if (!projections || Object.keys(projections).length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        No projection data available.
      </div>
    );
  }

  return (
    <div className="projection-section">
      <div className="projection-grid">
        {Object.entries(projections).map(([courtKey, featureList]) => {
          const cfg = COURT_CONFIG[courtKey];
          if (!cfg) return null;

          // featureList is an array of projection objects sorted by |delta_pct| desc
          const items = Array.isArray(featureList) ? featureList : [];

          return (
            <div
              key={courtKey}
              className={`proj-card ${courtKey}`}
              aria-label={`${cfg.label} projection`}
            >
              <div className="proj-card-title">
                <span aria-hidden="true">{cfg.emoji}</span>
                {cfg.label} Projection
              </div>

              {items.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No data
                </div>
              ) : (
                items.map((item) => {
                  const dir   = DIRECTION_ICON[item.direction] ?? '–';
                  const color = PRIORITY_COLOR[item.priority]  ?? 'var(--text-muted)';
                  const val   = typeof item.projected === 'number' && item.projected < 1
                    ? item.projected.toFixed(3)
                    : item.projected;

                  return (
                    <div key={item.feature} className="proj-row">
                      <span className="proj-row-label">{item.label}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ color: cfg.accentLight, fontWeight: 600, fontSize: '0.85rem' }}>
                          {val}
                          <span style={{ fontSize: '0.7rem', color: '#4a5568', marginLeft: 2 }}>
                            {item.unit}
                          </span>
                        </span>
                        <span style={{ color, fontSize: '0.8rem', fontWeight: 700 }}>
                          {dir} {Math.abs(item.delta_pct).toFixed(1)}%
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

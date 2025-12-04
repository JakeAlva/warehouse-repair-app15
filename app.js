/* Survey list layout */
.survey-card-shell {
  padding: 1.25rem;
}

.survey-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.survey-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Single survey card */
.survey-card {
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--card-bg, #ffffff);
  border: 1px solid rgba(148, 163, 184, 0.3); /* slate-300-ish */
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
  transition: transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease;
}

body.dark .survey-card {
  background: #020617;
  border-color: rgba(148, 163, 184, 0.4);
}

.survey-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.survey-card.active {
  border-color: #0ea5e9; /* cyan-500 accent */
  box-shadow: 0 0 0 1px rgba(14, 165, 233, 0.4);
}

.survey-title {
  font-weight: 600;
  font-size: 0.98rem;
}

.survey-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.15rem;
}

body.dark .survey-subtitle {
  color: #94a3b8;
}

.survey-meta {
  font-size: 0.78rem;
  color: #6b7280;
  margin-top: 0.35rem;
}

body.dark .survey-meta {
  color: #a1a1aa;
}

.survey-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.7rem;
  justify-content: flex-end;
}

/* Buttons tweak */
.btn.small {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
}

.btn.danger {
  background: #ef4444;
  color: #fff;
}

/* Optional small muted text */
.small {
  font-size: 0.8rem;
}

/* Optional picker style */
.survey-picker {
  min-width: 180px;
  font-size: 0.8rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: inherit;
  color: inherit;
}

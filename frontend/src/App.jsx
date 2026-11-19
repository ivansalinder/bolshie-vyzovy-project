import { useState } from 'react'
import './App.css'

const PACE_BARS = [
  { h: 42, type: 'ok' },
  { h: 55, type: 'ok' },
  { h: 48, type: 'ok' },
  { h: 62, type: 'ok' },
  { h: 50, type: 'ok' },
  { h: 92, type: 'slow' },
  { h: 54, type: 'ok' },
  { h: 45, type: 'ok' },
  { h: 86, type: 'err' },
  { h: 58, type: 'ok' },
  { h: 46, type: 'ok' },
  { h: 52, type: 'ok' },
]

function BrandLogo() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="2.4" rx="1.2" fill="#FFFFFF" />
        <rect x="2" y="7.8" width="9.5" height="2.4" rx="1.2" fill="#E84C22" />
        <rect x="2" y="12.6" width="12" height="2.4" rx="1.2" fill="#FFFFFF" />
      </svg>
    </span>
  )
}

function App() {
  const [screen, setScreen] = useState('intro') // 'intro' | 'register' | 'login'
  const [previewRole, setPreviewRole] = useState('parent')
  const [role, setRole] = useState('parent')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function goToScreen(nextScreen) {
    setScreen(nextScreen)
    setStatus(null)
    setShowPassword(false)
  }

  async function handleRegister(event) {
    event.preventDefault()
    setStatus(null)

    const formData = new FormData(event.target)
    const fullName = `${formData.get('last_name')} ${formData.get('first_name')}`.trim()

    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
      role: role,
      full_name: fullName,
      region: formData.get('region') || null,
    }

    if (role === 'specialist') {
      payload.organization = formData.get('organization') || null
      payload.specialization = formData.get('specialization') || null
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setScreen('login')
        setShowPassword(false)
        setStatus({
          type: 'success',
          text: 'Аккаунт создан. Введите почту и пароль для входа.',
        })
      } else {
        const errorData = await response.json()
        setStatus({
          type: 'error',
          text: errorData.detail || 'Не удалось завершить регистрацию.',
        })
      }
    } catch {
      setStatus({
        type: 'error',
        text: 'Сервер недоступен. Проверьте, запущен ли FastAPI на порту 8000.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setStatus(null)

    const formData = new FormData(event.target)
    const urlEncodedData = new URLSearchParams()
    urlEncodedData.append('username', formData.get('email'))
    urlEncodedData.append('password', formData.get('password'))

    setIsSubmitting(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlEncodedData.toString(),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        setStatus({
          type: 'success',
          text: 'Вход выполнен. JWT-токен сохранён в браузере.',
        })
      } else {
        const errorData = await response.json()
        setStatus({
          type: 'error',
          text: errorData.detail || 'Неверная почта или пароль.',
        })
      }
    } catch {
      setStatus({
        type: 'error',
        text: 'Сервер недоступен. Проверьте, запущен ли FastAPI на порту 8000.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand"
            onClick={() => goToScreen('intro')}
          >
            <BrandLogo />
            <span className="brand-text">ReadCheck</span>
            <span className="brand-version">скрининг v1.0</span>
          </button>

          <nav className="topbar-actions" aria-label="Навигация">
            {screen !== 'intro' && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => goToScreen('intro')}
              >
                О платформе
              </button>
            )}
            {screen !== 'login' && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => goToScreen('login')}
              >
                Войти
              </button>
            )}
            {screen !== 'register' && (
              <button
                type="button"
                className="btn-dark-sm"
                onClick={() => goToScreen('register')}
              >
                Регистрация
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="page-main">
        {/* ==================== 1. ВВОДНЫЙ ЭКРАН ==================== */}
        {screen === 'intro' && (
          <>
            <section className="hero-grid">
              <div className="hero-copy">
                <h1>
                  Цифровой скрининг <span>навыков чтения</span> за 5 минут
                </h1>

                <p className="hero-lead">
                  Фиксируем темп чтения, точность и понимание текста. Родители получают
                  ясный вывод без сложной терминологии, а логопеды и педагоги —
                  детальные метрики и сырые данные сессий.
                </p>

                <div className="hero-cta-row">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => goToScreen('register')}
                  >
                    Регистрация
                    <span aria-hidden="true">→</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => goToScreen('login')}
                  >
                    Войти в кабинет
                  </button>
                </div>

                <div className="hero-meta">
                  <span className="hero-meta-item">
                    <span className="meta-dot" />
                    Кабинеты родителя и специалиста
                  </span>
                  <span className="hero-meta-item">
                    <span className="meta-dot" />
                    Хранение данных в РФ (152-ФЗ)
                  </span>
                </div>
              </div>

              {/* Интерактивный виджет: переключение отчёта прямо на стартовой */}
              <div className="preview-window" aria-label="Пример работы скрининга">
                <div className="preview-bar">
                  <div className="preview-session">
                    <div className="window-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="preview-session-label">
                      сессия #042 · 2 класс
                    </span>
                  </div>

                  <div className="mode-pills" role="tablist" aria-label="Режим отчёта">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={previewRole === 'parent'}
                      className={previewRole === 'parent' ? 'mode-pill active' : 'mode-pill'}
                      onClick={() => setPreviewRole('parent')}
                    >
                      Вид родителя
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={previewRole === 'specialist'}
                      className={previewRole === 'specialist' ? 'mode-pill active' : 'mode-pill'}
                      onClick={() => setPreviewRole('specialist')}
                    >
                      Вид специалиста
                    </button>
                  </div>
                </div>

                <div className="preview-body">
                  <div className="reading-sample">
                    <div className="sample-top">
                      <span>Фрагмент текста · 14 слов</span>
                      <span className="sample-badge">
                        {previewRole === 'parent' ? 'прочитано' : 'разметка таймингов'}
                      </span>
                    </div>

                    <p className="sample-text">
                      Утром рыжий котёнок выбежал во двор и увидел большую{' '}
                      <span className={previewRole === 'specialist' ? 'word-pause' : ''}>
                        блестящую
                      </span>{' '}
                      лужу после{' '}
                      <span className={previewRole === 'specialist' ? 'word-error' : ''}>
                        ночного
                      </span>{' '}
                      дождя.
                    </p>

                    {previewRole === 'specialist' && (
                      <div className="sample-legend">
                        <span className="legend-item">
                          <span className="legend-swatch pause" />
                          пауза 1.4 с (сложная слоговая структура)
                        </span>
                        <span className="legend-item">
                          <span className="legend-swatch error" />
                          замена окончания
                        </span>
                      </div>
                    )}
                  </div>

                  {previewRole === 'parent' ? (
                    <>
                      <div className="parent-verdict">
                        <div className="verdict-head">
                          <span className="verdict-title">Навык в пределах нормы</span>
                          <span className="verdict-pill">2 класс</span>
                        </div>
                        <p>
                          Ребёнок читает уверенно и хорошо улавливает смысл текста.
                          Очная консультация не требуется — можно повторить проверку через
                          четверть.
                        </p>
                      </div>

                      <div className="parent-bars">
                        <div className="mini-stat">
                          <div className="mini-stat-top">
                            <span>Темп чтения</span>
                            <strong>92 сл/мин</strong>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: '82%' }} />
                          </div>
                        </div>

                        <div className="mini-stat">
                          <div className="mini-stat-top">
                            <span>Понимание</span>
                            <strong>88%</strong>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill ok" style={{ width: '88%' }} />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="spec-metrics">
                        <div className="spec-tile">
                          <span className="spec-tile-label">Чистый темп</span>
                          <span className="spec-tile-val">88 WPM</span>
                        </div>
                        <div className="spec-tile">
                          <span className="spec-tile-label">Плотность ошибок</span>
                          <span className="spec-tile-val accent">2.4%</span>
                        </div>
                        <div className="spec-tile">
                          <span className="spec-tile-label">Понимание</span>
                          <span className="spec-tile-val">7 / 8</span>
                        </div>
                      </div>

                      <div className="pace-box">
                        <div className="pace-header">
                          <span>Время чтения по словам (мс)</span>
                          <span className="pace-code">raw_data: JSON</span>
                        </div>
                        <div className="pace-bars" aria-hidden="true">
                          {PACE_BARS.map((bar, idx) => (
                            <div
                              key={idx}
                              className={`pace-bar ${bar.type}`}
                              style={{ height: `${bar.h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Бенто-карточки под Hero */}
            <section className="bento-grid" aria-label="Возможности скрининга">
              <article className="bento-card">
                <div>
                  <span className="bento-tag">методика</span>
                  <h2>Чтение + проверка смысла</h2>
                  <p>
                    Скорость без понимания ничего не значит. Ребёнок читает короткий
                    адаптированный текст и отвечает на вопросы по содержанию.
                  </p>
                </div>
                <div className="bento-footer-line">5–7 минут на одного ученика</div>
              </article>

              <article className="bento-card">
                <div>
                  <span className="bento-tag">2 роли</span>
                  <h2>Разный уровень детализации</h2>
                  <p>
                    Один тест формирует понятную сводку для родителя и профессиональный
                    протокол с динамикой прохождений для специалиста.
                  </p>
                </div>
                <div className="bento-footer-line">parent · specialist</div>
              </article>

              <article className="bento-card dark">
                <div>
                  <span className="bento-tag">аналитика и наука</span>
                  <h2>Сохранение сырых событий</h2>
                  <p>
                    Платформа записывает не только итоговый балл, но и структурированные
                    данные сессии для последующего анализа и публикаций.
                  </p>
                </div>
                <div className="bento-footer-line">PostgreSQL · FastAPI · РФ</div>
              </article>
            </section>
          </>
        )}

        {/* ==================== 2. РЕГИСТРАЦИЯ ==================== */}
        {screen === 'register' && (
          <section className="auth-shell">
            <aside className="auth-panel-dark">
              <div>
                <button
                  type="button"
                  className="back-link"
                  onClick={() => goToScreen('intro')}
                >
                  ← О платформе
                </button>
              </div>

              <div>
                <h1>Создать аккаунт</h1>
                <p>
                  Выберите роль, чтобы система сразу настроила формат отчётов и
                  инструменты личного кабинета.
                </p>
              </div>

              <div className="role-preview-box">
                <span className="role-preview-label">
                  {role === 'parent' ? 'роль: родитель' : 'роль: специалист'}
                </span>
                <ul className="role-preview-list">
                  {role === 'parent' ? (
                    <>
                      <li>Профили детей в одном кабинете</li>
                      <li>Понятный итог по скорости и пониманию</li>
                      <li>История всех пройденных скринингов</li>
                    </>
                  ) : (
                    <>
                      <li>Ведение группы учеников</li>
                      <li>Чистая скорость (WPM) и плотность ошибок</li>
                      <li>Доступ к сырым данным сессий (JSON)</li>
                    </>
                  )}
                </ul>
              </div>
            </aside>

            <div className="auth-panel-form">
              <form key="register-form" onSubmit={handleRegister}>
                <fieldset className="role-fieldset">
                  <legend>Выберите роль</legend>
                  <div className="role-cards">
                    <button
                      type="button"
                      className={
                        role === 'parent' ? 'role-card-btn selected' : 'role-card-btn'
                      }
                      aria-pressed={role === 'parent'}
                      onClick={() => setRole('parent')}
                    >
                      <span className="role-card-title">Родитель</span>
                      <span className="role-card-sub">Домашняя проверка</span>
                    </button>

                    <button
                      type="button"
                      className={
                        role === 'specialist'
                          ? 'role-card-btn selected'
                          : 'role-card-btn'
                      }
                      aria-pressed={role === 'specialist'}
                      onClick={() => setRole('specialist')}
                    >
                      <span className="role-card-title">Специалист</span>
                      <span className="role-card-sub">Логопед / педагог</span>
                    </button>
                  </div>
                </fieldset>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="firstName">Имя</label>
                    <input
                      id="firstName"
                      name="first_name"
                      type="text"
                      placeholder="Анна"
                      autoComplete="given-name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="lastName">Фамилия</label>
                    <input
                      id="lastName"
                      name="last_name"
                      type="text"
                      placeholder="Смирнова"
                      autoComplete="family-name"
                      required
                    />
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="region">Город / регион</label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      placeholder="Например: Москва"
                      autoComplete="address-level2"
                      required
                    />
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="email">Электронная почта</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.ru"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="password">Пароль</label>
                    <div className="input-wrap">
                      <input
                        id="password"
                        name="password"
                        className="with-toggle"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Минимум 8 символов"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        className="pass-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Скрыть' : 'Показать'}
                      </button>
                    </div>
                  </div>

                  {role === 'specialist' && (
                    <>
                      <div className="spec-group-title">Профиль специалиста</div>

                      <div className="form-field full-width">
                        <label htmlFor="specialization">Специализация</label>
                        <input
                          id="specialization"
                          name="specialization"
                          type="text"
                          placeholder="Логопед, дефектолог, учитель начальных классов"
                          required
                        />
                      </div>

                      <div className="form-field full-width">
                        <label htmlFor="organization">Организация</label>
                        <input
                          id="organization"
                          name="organization"
                          type="text"
                          placeholder="Школа, детский сад или логопедический центр"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  className="btn-primary full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
                </button>
              </form>

              {status && (
                <p className={`status-banner ${status.type}`} role="status">
                  {status.text}
                </p>
              )}

              <div className="auth-switch">
                <span>Уже есть аккаунт?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => goToScreen('login')}
                >
                  Войти
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ==================== 3. ВХОД ==================== */}
        {screen === 'login' && (
          <section className="auth-shell">
            <aside className="auth-panel-dark">
              <div>
                <button
                  type="button"
                  className="back-link"
                  onClick={() => goToScreen('intro')}
                >
                  ← О платформе
                </button>
              </div>

              <div>
                <h1>Вход в кабинет</h1>
                <p>
                  Авторизуйтесь, чтобы открыть профили детей, запустить новый скрининг
                  или посмотреть историю прохождений.
                </p>
              </div>

              <div className="role-preview-box">
                <span className="role-preview-label">авторизация: JWT</span>
                <ul className="role-preview-list">
                  <li>Единый вход для родителей и специалистов</li>
                  <li>Роль определяется автоматически по аккаунту</li>
                </ul>
              </div>
            </aside>

            <div className="auth-panel-form">
              <form key="login-form" onSubmit={handleLogin}>
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label htmlFor="loginEmail">Электронная почта</label>
                    <input
                      id="loginEmail"
                      name="email"
                      type="email"
                      placeholder="name@example.ru"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="loginPassword">Пароль</label>
                    <div className="input-wrap">
                      <input
                        id="loginPassword"
                        name="password"
                        className="with-toggle"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Введите пароль"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="pass-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Скрыть' : 'Показать'}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-primary full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Проверяем…' : 'Войти'}
                </button>
              </form>

              {status && (
                <p className={`status-banner ${status.type}`} role="status">
                  {status.text}
                </p>
              )}

              <div className="auth-switch">
                <span>Ещё нет аккаунта?</span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => goToScreen('register')}
                >
                  Регистрация
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="page-footer">
        <div className="footer-inner">
          <span>ReadCheck · прототип платформы скрининга чтения</span>
          <span>Ориентировочная оценка · не заменяет очную диагностику специалиста</span>
        </div>
      </footer>
    </div>
  )
}

export default App
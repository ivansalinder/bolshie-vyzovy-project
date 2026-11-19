import { useEffect, useState } from 'react'
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
  const [user, setUser] = useState(null)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [screenings, setScreenings] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [screeningsLoading, setScreeningsLoading] = useState(false)
  const [showChildForm, setShowChildForm] = useState(false)
  const [childSubmitting, setChildSubmitting] = useState(false)
  const [dashboardMessage, setDashboardMessage] = useState(null)

  const API_URL = 'http://127.0.0.1:8000'

  function goToScreen(nextScreen) {
    setScreen(nextScreen)
    setStatus(null)
    setShowPassword(false)
  }

  async function loadScreenings(childId, accessToken = localStorage.getItem('token')) {
    if (!childId || !accessToken) {
      setScreenings([])
      return
    }

    setScreeningsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/children/${childId}/screenings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Не удалось загрузить историю проверок.')
      }

      const data = await response.json()
      setScreenings(data)
    } catch (error) {
      setScreenings([])
      setDashboardMessage(error.message || 'Не удалось загрузить историю проверок.')
    } finally {
      setScreeningsLoading(false)
    }
  }

  async function loadDashboard(accessToken = localStorage.getItem('token')) {
    if (!accessToken) return

    setDashboardLoading(true)
    setDashboardMessage(null)

    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [userResponse, childrenResponse] = await Promise.all([
        fetch(`${API_URL}/api/users/me`, { headers }),
        fetch(`${API_URL}/api/children`, { headers }),
      ])

      if (userResponse.status === 401 || childrenResponse.status === 401) {
        localStorage.removeItem('token')
        setUser(null)
        setScreen('login')
        setStatus({ type: 'error', text: 'Сессия завершилась. Войдите ещё раз.' })
        return
      }

      if (!userResponse.ok) {
        throw new Error('Не удалось получить данные аккаунта.')
      }
      if (!childrenResponse.ok) {
        throw new Error('Не удалось загрузить список детей.')
      }

      const currentUser = await userResponse.json()
      const childrenData = await childrenResponse.json()

      setUser(currentUser)

      if (currentUser.role !== 'parent') {
        setScreen('specialist')
        return
      }

      setChildren(childrenData)
      setScreen('dashboard')

      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0])
        await loadScreenings(childrenData[0].id, accessToken)
      } else {
        setSelectedChild(null)
        setScreenings([])
      }
    } catch (error) {
      setDashboardMessage(error.message || 'Не удалось открыть личный кабинет.')
      setScreen('dashboard')
    } finally {
      setDashboardLoading(false)
    }
  }

  async function handleAddChild(event) {
    event.preventDefault()
    setDashboardMessage(null)

    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const payload = {
      full_name: String(formData.get('full_name') || '').trim(),
      birth_date: formData.get('birth_date'),
      grade: String(formData.get('grade') || '').trim() || null,
      notes: String(formData.get('notes') || '').trim() || null,
    }

    const accessToken = localStorage.getItem('token')
    if (!accessToken) {
      setDashboardMessage('Войдите в аккаунт, чтобы добавить ребёнка.')
      setScreen('login')
      return
    }

    setChildSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.detail || 'Не удалось добавить профиль ребёнка.')
      }

      setChildren((current) => [...current, result])
      setSelectedChild(result)
      setScreenings([])
      setShowChildForm(false)
      formElement.reset()
      setDashboardMessage('Профиль ребёнка успешно добавлен.')
      await loadScreenings(result.id, accessToken)
    } catch (error) {
      setDashboardMessage(error.message || 'Не удалось добавить профиль ребёнка.')
    } finally {
      setChildSubmitting(false)
    }
  }

  async function selectChild(child) {
    setSelectedChild(child)
    setDashboardMessage(null)
    await loadScreenings(child.id)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setUser(null)
    setChildren([])
    setSelectedChild(null)
    setScreenings([])
    setScreen('intro')
    setStatus(null)
    setDashboardMessage(null)
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      loadDashboard(savedToken)
    }
    // Проверяем сохранённую сессию один раз при открытии приложения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const response = await fetch(`${API_URL}/api/auth/register`, {
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlEncodedData.toString(),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        setStatus(null)
        await loadDashboard(data.access_token)
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
            onClick={() => goToScreen(user?.role === 'parent' ? 'dashboard' : 'intro')}
          >
            <BrandLogo />
            <span className="brand-text">ReadCheck</span>
            <span className="brand-version">скрининг v1.0</span>
          </button>

          <nav className="topbar-actions" aria-label="Навигация">
            {user ? (
              <>
                <span className="topbar-user-name">{user.full_name}</span>
                <button type="button" className="btn-ghost" onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
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
              </>
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

        {/* ==================== 4. КАБИНЕТ РОДИТЕЛЯ ==================== */}
        {screen === 'dashboard' && (
          <section className="dashboard-page">
            <div className="dashboard-heading">
              <div>
                <span className="dashboard-eyebrow">ЛИЧНЫЙ КАБИНЕТ</span>
                <h1>Здравствуйте, {user?.full_name?.split(' ')[1] || user?.full_name || 'родитель'}!</h1>
                <p>Здесь находятся профили детей и история их проверок чтения.</p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowChildForm((value) => !value)}
              >
                {showChildForm ? 'Скрыть форму' : '+ Добавить ребёнка'}
              </button>
            </div>

            {dashboardMessage && (
              <p className="dashboard-message" role="status">{dashboardMessage}</p>
            )}

            {dashboardLoading ? (
              <div className="dashboard-empty">Загружаем личный кабинет…</div>
            ) : (
              <>
                {showChildForm && (
                  <form className="child-form-card" onSubmit={handleAddChild}>
                    <div className="dashboard-card-heading">
                      <div>
                        <span className="dashboard-eyebrow">НОВЫЙ ПРОФИЛЬ</span>
                        <h2>Добавить ребёнка</h2>
                      </div>
                    </div>
                    <div className="child-form-grid">
                      <label className="dashboard-field">
                        <span>Имя и фамилия ребёнка</span>
                        <input name="full_name" type="text" placeholder="Например, Маша Смирнова" required />
                      </label>
                      <label className="dashboard-field">
                        <span>Дата рождения</span>
                        <input name="birth_date" type="date" required />
                      </label>
                      <label className="dashboard-field">
                        <span>Класс</span>
                        <input name="grade" type="text" placeholder="Например, 2 класс" />
                      </label>
                      <label className="dashboard-field child-notes-field">
                        <span>Дополнительная информация (необязательно)</span>
                        <textarea name="notes" rows="2" placeholder="Комментарий для себя" />
                      </label>
                    </div>
                    <div className="child-form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowChildForm(false)}>
                        Отмена
                      </button>
                      <button type="submit" className="btn-primary" disabled={childSubmitting}>
                        {childSubmitting ? 'Сохраняем…' : 'Сохранить профиль'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="dashboard-grid">
                  <section className="dashboard-card children-card">
                    <div className="dashboard-card-heading">
                      <div>
                        <span className="dashboard-eyebrow">СЕМЬЯ</span>
                        <h2>Мои дети</h2>
                      </div>
                      <span className="dashboard-count">{children.length}</span>
                    </div>

                    {children.length === 0 ? (
                      <div className="dashboard-empty">
                        <div className="dashboard-empty-icon">＋</div>
                        <h3>Профилей пока нет</h3>
                        <p>Добавьте профиль ребёнка, чтобы сохранять результаты проверок и следить за динамикой.</p>
                        <button type="button" className="btn-primary" onClick={() => setShowChildForm(true)}>
                          Добавить первого ребёнка
                        </button>
                      </div>
                    ) : (
                      <div className="children-list">
                        {children.map((child) => (
                          <button
                            type="button"
                            key={child.id}
                            className={selectedChild?.id === child.id ? 'child-list-item active' : 'child-list-item'}
                            onClick={() => selectChild(child)}
                          >
                            <span className="child-avatar">{child.full_name?.trim()?.charAt(0)?.toUpperCase() || 'Р'}</span>
                            <span className="child-list-copy">
                              <strong>{child.full_name}</strong>
                              <small>{child.grade || 'Класс не указан'}</small>
                            </span>
                            <span className="child-arrow">›</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="dashboard-card progress-card">
                    <div className="dashboard-card-heading">
                      <div>
                        <span className="dashboard-eyebrow">РЕЗУЛЬТАТЫ</span>
                        <h2>{selectedChild ? selectedChild.full_name : 'Прогресс чтения'}</h2>
                      </div>
                    </div>

                    {!selectedChild ? (
                      <div className="dashboard-empty compact">
                        <p>Выберите профиль ребёнка или добавьте первого ребёнка.</p>
                      </div>
                    ) : screeningsLoading ? (
                      <div className="dashboard-empty compact">Загружаем историю проверок…</div>
                    ) : screenings.length === 0 ? (
                      <div className="dashboard-empty compact">
                        <h3>Пока нет результатов</h3>
                        <p>После прохождения скрининга здесь появятся скорость чтения, понимание текста и история изменений.</p>
                      </div>
                    ) : (
                      <>
                        <div className="progress-summary-grid">
                          <div className="progress-summary-tile">
                            <span>Последняя скорость</span>
                            <strong>{Number(screenings[0].words_per_minute).toFixed(1)} <small>сл/мин</small></strong>
                          </div>
                          <div className="progress-summary-tile">
                            <span>Понимание текста</span>
                            <strong>{Number(screenings[0].comprehension_score).toFixed(1)}<small>%</small></strong>
                          </div>
                        </div>

                        {screenings.length > 1 && (
                          <div className="progress-change-note">
                            Динамика к предыдущей проверке: скорость{' '}
                            <strong>
                              {Number(screenings[0].words_per_minute) - Number(screenings[1].words_per_minute) >= 0 ? '+' : ''}
                              {(Number(screenings[0].words_per_minute) - Number(screenings[1].words_per_minute)).toFixed(1)} сл/мин
                            </strong>, понимание{' '}
                            <strong>
                              {Number(screenings[0].comprehension_score) - Number(screenings[1].comprehension_score) >= 0 ? '+' : ''}
                              {(Number(screenings[0].comprehension_score) - Number(screenings[1].comprehension_score)).toFixed(1)} п.п.
                            </strong>.
                          </div>
                        )}

                        <h3 className="screening-history-title">История проверок</h3>
                        <div className="screening-history-list">
                          {screenings.map((item) => (
                            <article className="screening-history-item" key={item.id}>
                              <div className="screening-date">
                                {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : 'Дата не указана'}
                              </div>
                              <div className="screening-metrics-row">
                                <span><strong>{Number(item.words_per_minute).toFixed(1)}</strong> сл/мин</span>
                                <span><strong>{Number(item.comprehension_score).toFixed(1)}%</strong> понимание</span>
                              </div>
                              <p>{item.parent_summary}</p>
                            </article>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                </div>
              </>
            )}
          </section>
        )}

        {screen === 'specialist' && (
          <section className="dashboard-page">
            <div className="dashboard-card specialist-placeholder">
              <span className="dashboard-eyebrow">ЛИЧНЫЙ КАБИНЕТ</span>
              <h1>Здравствуйте, {user?.full_name || 'специалист'}!</h1>
              <p>Авторизация работает. Кабинет специалиста будет реализован отдельным модулем.</p>
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
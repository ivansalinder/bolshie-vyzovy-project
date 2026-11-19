import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000'
const SCREENING_ENDPOINT = `${API_BASE}/api/screenings`
const CHILDREN_STORAGE_KEY = 'readcheck_children_v1'

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

/* =====================================================================
 * ЗАГЛУШКИ ТЕКСТОВ И ВОПРОСОВ (до получения методички от команды методистов)
 * ===================================================================== */
const MOCK_MODULES = [
  {
    id: 'stub-grade-1-2',
    title: '«Котёнок и лужа»',
    levelLabel: '1–2 класс',
    text: 'Утром рыжий котёнок Тишка выбежал во двор и увидел большую блестящую лужу после ночного дождя. В воде отражались белые облака и ветки старой яблони. Тишка осторожно коснулся лужи лапой. Вода дрогнула, и облака распались на десятки весёлых кругов. Котёнок удивился, отряхнул лапку и побежал звать девочку Машу.',
    questions: [
      {
        id: 'q1',
        prompt: 'Как звали рыжего котёнка?',
        options: ['Тишка', 'Барсик', 'Пушок'],
        correctIndex: 0,
      },
      {
        id: 'q2',
        prompt: 'Что отражалось в луже после дождя?',
        options: [
          'Белые облака и ветки яблони',
          'Крыша дома и птицы',
          'Солнце и деревянный забор',
        ],
        correctIndex: 0,
      },
      {
        id: 'q3',
        prompt: 'Кого котёнок побежал звать во двор?',
        options: ['Девочку Машу', 'Маму-кошку', 'Щенка Шарика'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'stub-grade-3-4',
    title: '«Зимняя метеостанция»',
    levelLabel: '3–4 класс',
    text: 'На краю соснового леса стояла старая метеостанция. Каждое утро дежурный записывал температуру воздуха, направление ветра и высоту снежного покрова. Однажды зимой приборы показали резкое падение давления. Через два часа поднялась сильная метель, и тропинку к станции быстро замело. Зато предупреждение метеорологов помогло жителям соседнего посёлка вовремя отменить дальнюю поездку и подготовиться к непогоде.',
    questions: [
      {
        id: 'q1',
        prompt: 'Где находилась метеостанция?',
        options: [
          'На краю соснового леса',
          'На берегу широкой реки',
          'В центре большого города',
        ],
        correctIndex: 0,
      },
      {
        id: 'q2',
        prompt: 'Что показали приборы за два часа до метели?',
        options: [
          'Резкое падение давления',
          'Сильное потепление',
          'Направление северного ветра',
        ],
        correctIndex: 0,
      },
      {
        id: 'q3',
        prompt: 'Чем помогло предупреждение метеорологов?',
        options: [
          'Жители вовремя отменили дальнюю поездку',
          'Дорогу успели расчистить до снегопада',
          'В посёлке заранее включили отопление',
        ],
        correctIndex: 0,
      },
    ],
  },
]

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const secs = String(totalSeconds % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

function formatBirthDate(dateStr) {
  if (!dateStr) return '—'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

function calculateAge(dateStr) {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

function formatChildCode(id) {
  const digits = String(id).slice(-4).padStart(4, '0')
  return `RC-${digits}`
}

function loadSavedChildren() {
  try {
    const raw = localStorage.getItem(CHILDREN_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function BrandLogo() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6.5C4 5.4 4.9 4.5 6 4.5H11C11.6 4.5 12 4.9 12 5.5V19.5C12 18.7 11.3 18 10.5 18H6C4.9 18 4 17.1 4 16V6.5Z"
          fill="#FFFFFF"
        />
        <path
          d="M20 6.5C20 5.4 19.1 4.5 18 4.5H13C12.4 4.5 12 4.9 12 5.5V19.5C12 18.7 12.7 18 13.5 18H18C19.1 18 20 17.1 20 16V6.5Z"
          fill="#D7F5F1"
        />
      </svg>
    </span>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '')

  // Экраны: 'intro' | 'register' | 'login' | 'cabinet' | 'screening'
  const [screen, setScreen] = useState(() =>
    localStorage.getItem('token') ? 'cabinet' : 'intro'
  )

  const [previewRole, setPreviewRole] = useState('parent')
  const [role, setRole] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Данные кабинета (ChildOut)
  const [childrenList, setChildrenList] = useState(loadSavedChildren)

  // Состояние окна скрининга
  const [activeChild, setActiveChild] = useState(null)
  const [selectedModuleId, setSelectedModuleId] = useState(MOCK_MODULES[0].id)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [testStage, setTestStage] = useState('ready')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [flaggedWords, setFlaggedWords] = useState([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [lastResult, setLastResult] = useState(null)
  const [showRawJson, setShowRawJson] = useState(false)

  useEffect(() => {
    if (screen !== 'screening' || testStage !== 'reading') return
    const intervalId = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [screen, testStage])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function fetchChildren() {
      try {
        const response = await fetch(`${API_BASE}/api/children`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok || cancelled) return
        const data = await response.json()
        if (!Array.isArray(data)) return

        setChildrenList((prev) => {
          const prevById = new Map(prev.map((item) => [item.id, item]))
          const merged = data.map((item) => ({
            id: item.id,
            guardian_id: item.guardian_id,
            full_name: item.full_name,
            birth_date: item.birth_date,
            grade: item.grade || '',
            notes: item.notes || '',
            lastResult: prevById.get(item.id)?.lastResult || null,
          }))
          localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify(merged))
          return merged
        })
      } catch {
        // Остаёмся на локальном кэше
      }
    }

    fetchChildren()
    return () => {
      cancelled = true
    }
  }, [token])

  function persistChildren(nextList) {
    setChildrenList(nextList)
    localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify(nextList))
  }

  function goToScreen(nextScreen) {
    setScreen(nextScreen)
    setStatus(null)
    setShowPassword(false)
    if (nextScreen === 'register') {
      setRole(null)
    }
  }

  function handleSelectRole(chosenRole) {
    setRole(chosenRole)
    setStatus(null)
    setShowPassword(false)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    setToken('')
    setUserEmail('')
    setActiveChild(null)
    goToScreen('intro')
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
      const response = await fetch(`${API_BASE}/api/auth/register`, {
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
          text:
            typeof errorData.detail === 'string'
              ? errorData.detail
              : 'Не удалось завершить регистрацию.',
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
    const emailValue = formData.get('email')
    const urlEncodedData = new URLSearchParams()
    urlEncodedData.append('username', emailValue)
    urlEncodedData.append('password', formData.get('password'))

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlEncodedData.toString(),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('userEmail', emailValue)
        setToken(data.access_token)
        setUserEmail(emailValue)
        setScreen('cabinet')
        setStatus(null)
      } else {
        const errorData = await response.json()
        setStatus({
          type: 'error',
          text:
            typeof errorData.detail === 'string'
              ? errorData.detail
              : 'Неверная почта или пароль.',
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

  async function handleAddChild(event) {
    event.preventDefault()
    setStatus(null)

    const formData = new FormData(event.target)

    const childPayload = {
      full_name: formData.get('full_name').trim(),
      birth_date: formData.get('birth_date'),
      grade: formData.get('grade') || null,
      notes: formData.get('notes').trim() || null,
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(childPayload),
      })

      if (response.ok) {
        const serverChild = await response.json()
        const newChild = {
          id: serverChild.id,
          guardian_id: serverChild.guardian_id,
          full_name: serverChild.full_name,
          birth_date: serverChild.birth_date,
          grade: serverChild.grade || '',
          notes: serverChild.notes || '',
          lastResult: null,
        }
        persistChildren([newChild, ...childrenList])
        setStatus({
          type: 'success',
          text: `Профиль «${newChild.full_name}» создан. Присвоен код: ${formatChildCode(newChild.id)}.`,
        })
        event.target.reset()
        return
      }

      if (response.status === 401) {
        setStatus({
          type: 'error',
          text: 'Сессия истекла. Выйдите и войдите в аккаунт заново.',
        })
        return
      }

      const errorData = await response.json().catch(() => ({}))
      setStatus({
        type: 'error',
        text:
          typeof errorData.detail === 'string'
            ? `Ошибка API: ${errorData.detail}`
            : `Ошибка API (HTTP ${response.status}).`,
      })
    } catch {
      const localChild = {
        id: Date.now(),
        ...childPayload,
        lastResult: null,
      }
      persistChildren([localChild, ...childrenList])
      setStatus({
        type: 'success',
        text: `Профиль «${localChild.full_name}» создан локально. Код: ${formatChildCode(localChild.id)}.`,
      })
      event.target.reset()
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRemoveChild(childId) {
    persistChildren(childrenList.filter((c) => c.id !== childId))
  }

  function openScreeningForChild(child) {
    const defaultMod =
      child.grade === '3 класс' || child.grade === '4 класс' || child.grade === '5+ класс'
        ? MOCK_MODULES[1].id
        : MOCK_MODULES[0].id

    setActiveChild(child)
    setSelectedModuleId(defaultMod)
    setConsentAccepted(false)
    setTestStage('ready')
    setElapsedSeconds(0)
    setFlaggedWords([])
    setCurrentQuestionIdx(0)
    setAnswers({})
    setLastResult(null)
    setShowRawJson(false)
    setScreen('screening')
  }

  const activeModule =
    MOCK_MODULES.find((m) => m.id === selectedModuleId) || MOCK_MODULES[0]
  const moduleWords = activeModule.text.split(/\s+/)

  function startReading() {
    if (!consentAccepted) return
    setElapsedSeconds(0)
    setFlaggedWords([])
    setTestStage('reading')
  }

  function toggleWordFlag(index) {
    setFlaggedWords((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  function finishReading() {
    setCurrentQuestionIdx(0)
    setAnswers({})
    setTestStage('questions')
  }

  function selectAnswer(questionId, optionIdx) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }))
  }

  async function finishScreening() {
    const durationSec = Math.max(elapsedSeconds, 1)
    const totalWords = moduleWords.length
    const errorsCount = flaggedWords.length
    const minutes = durationSec / 60

    const netWpm = Math.max(0, Math.round((totalWords - errorsCount) / minutes))
    const errorRate = Number(((errorsCount / totalWords) * 100).toFixed(1))

    const totalQuestions = activeModule.questions.length
    const correctAnswers = activeModule.questions.filter(
      (q) => answers[q.id] === q.correctIndex
    ).length
    const comprehensionPct = Math.round((correctAnswers / totalQuestions) * 100)

    const rawEventsPayload = {
      child_code: formatChildCode(activeChild.id),
      consent_152fz: true,
      module_id: activeModule.id,
      module_title: activeModule.title,
      flagged_indices: flaggedWords,
      flagged_words: flaggedWords.map((i) => moduleWords[i]),
      answers,
    }

    const submitPayload = {
      child_id: Number(activeChild.id),
      word_Count: totalWords,
      reading_time_seconds: Number(durationSec),
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      errors_made: errorsCount,
      raw_events: rawEventsPayload,
    }

    let serverData = null
    let savedToApi = false

    setIsSubmitting(true)
    try {
      if (token) {
        const response = await fetch(SCREENING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitPayload),
        })
        if (response.ok) {
          serverData = await response.json()
          savedToApi = true
        }
      }
    } catch {
      // Фолбэк на локальный расчёт
    } finally {
      setIsSubmitting(false)
    }

    const displayWpm =
      serverData?.words_per_minute !== undefined
        ? Math.round(serverData.words_per_minute)
        : netWpm

    const displayComprehension =
      serverData?.comprehension_score !== undefined
        ? serverData.comprehension_score <= 1
          ? Math.round(serverData.comprehension_score * 100)
          : Math.round(serverData.comprehension_score)
        : comprehensionPct

    const sessionResult = {
      id: serverData?.id ?? Date.now(),
      moduleId: activeModule.id,
      moduleTitle: activeModule.title,
      completedAt: serverData?.created_at || new Date().toISOString(),
      savedToApi,
      durationSec,
      totalWords,
      errorsCount: serverData?.error_count ?? errorsCount,
      netWpm: displayWpm,
      errorRate,
      correctAnswers,
      totalQuestions,
      comprehensionPct: displayComprehension,
      parentSummary: serverData?.parent_summary || null,
      specialistMetrics: serverData?.specialist_metrics || null,
      rawData: serverData?.raw_data || rawEventsPayload,
    }

    setLastResult(sessionResult)
    setTestStage('result')

    if (activeChild) {
      const updated = childrenList.map((c) =>
        c.id === activeChild.id ? { ...c, lastResult: sessionResult } : c
      )
      persistChildren(updated)
    }
  }

  const currentQuestion = activeModule.questions[currentQuestionIdx]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const completedTestsCount = childrenList.filter((c) => c.lastResult).length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand"
            onClick={() => goToScreen('intro')}
            title="На главную страницу"
          >
            <BrandLogo />
            <span className="brand-text">ReadCheck</span>
          </button>

          <nav className="topbar-actions" aria-label="Навигация">
            {token ? (
              <>
                {userEmail && <span className="user-chip">{userEmail}</span>}
                {screen !== 'cabinet' && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => goToScreen('cabinet')}
                  >
                    В кабинет
                  </button>
                )}
                <button
                  type="button"
                  className="btn-nav-primary"
                  onClick={handleLogout}
                >
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
                    Главная
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
                    className="btn-nav-primary"
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
        {/* ==================== 1. ГЛАВНАЯ СТРАНИЦА ==================== */}
        {screen === 'intro' && (
          <>
            <section className="hero-section">
              <div className="container">
                <div className="hero-grid">
                  <div className="hero-copy">
                    <span className="hero-eyebrow">
                      Платформа скрининга чтения · 1–5 классы
                    </span>

                    <h1>
                      Проверка{' '}
                      <span className="highlight-word">
                        навыков чтения
                        <svg
                          className="highlight-underline"
                          viewBox="0 0 220 12"
                          fill="none"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2 8.5C58 2.5 162 2.5 218 8.5"
                            stroke="#A7E0D9"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>{' '}
                      за 5 минут
                    </h1>

                    <p className="hero-lead">
                      Оцениваем скорость чтения, точность и понимание текста. Родители
                      получают ясный вывод без сложных терминов, а логопеды и педагоги —
                      подробный протокол и динамику по ученикам.
                    </p>

                    <div className="hero-cta-row">
                      {token ? (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => goToScreen('cabinet')}
                        >
                          Перейти в кабинет →
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => goToScreen('register')}
                          >
                            Начать регистрацию →
                          </button>

                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => goToScreen('login')}
                          >
                            Войти в кабинет
                          </button>
                        </>
                      )}
                    </div>

                    <p className="hero-footnote">
                      Бесплатный доступ для семей и специалистов · хранение результатов в
                      обезличенном виде (152-ФЗ)
                    </p>
                  </div>

                  {/* Многослойная карточка-пример отчёта */}
                  <div className="preview-stage" aria-label="Пример отчёта скрининга">
                    <div className="preview-sheet">
                      <div className="preview-ribbon" />
                      <div className="preview-bar">
                        <span className="preview-session-label">
                          Пример отчёта · 2 класс
                        </span>

                        <div className="mode-pills" role="tablist" aria-label="Режим отчёта">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={previewRole === 'parent'}
                            className={previewRole === 'parent' ? 'mode-pill active' : 'mode-pill'}
                            onClick={() => setPreviewRole('parent')}
                          >
                            Для родителя
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={previewRole === 'specialist'}
                            className={previewRole === 'specialist' ? 'mode-pill active' : 'mode-pill'}
                            onClick={() => setPreviewRole('specialist')}
                          >
                            Для специалиста
                          </button>
                        </div>
                      </div>

                      <div className="preview-body">
                        <div className="reading-sample">
                          <div className="sample-top">
                            <span>Фрагмент текста · 14 слов</span>
                            <span>
                              {previewRole === 'parent' ? 'прочитано вслух' : 'отметки по словам'}
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
                                пауза 1.4 с
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
                                Ребёнок читает уверенно и хорошо понимает смысл текста. Очная
                                консультация не требуется — можно повторить проверку через
                                четверть.
                              </p>
                            </div>

                            <div className="parent-bars">
                              <div>
                                <div className="mini-stat-top">
                                  <span>Темп чтения</span>
                                  <strong>92 сл/мин</strong>
                                </div>
                                <div className="bar-track">
                                  <div className="bar-fill" style={{ width: '82%' }} />
                                </div>
                              </div>

                              <div>
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
                                <span className="spec-tile-val">88 сл/мин</span>
                              </div>
                              <div className="spec-tile">
                                <span className="spec-tile-label">Доля ошибок</span>
                                <span className="spec-tile-val accent">2.4%</span>
                              </div>
                              <div className="spec-tile">
                                <span className="spec-tile-label">Понимание</span>
                                <span className="spec-tile-val">7 / 8</span>
                              </div>
                            </div>

                            <div className="pace-box">
                              <div className="pace-header">
                                Распределение пауз по словам
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
                  </div>
                </div>
              </div>
            </section>

            {/* Полноширинная полоса маршрута вместо 4 шаблонных карточек */}
            <section className="journey-band" aria-label="Как проходит скрининг">
              <div className="container">
                <div className="journey-head">
                  <h2>Как проходит скрининг</h2>
                  <span>Четыре простых шага — без стресса для ребёнка</span>
                </div>

                <div className="journey-track">
                  <div className="journey-step">
                    <div className="journey-num">1</div>
                    <h3>Профиль и код</h3>
                    <p>
                      Добавьте ребёнка в кабинете — система сама присвоит ему обезличенный
                      код ученика.
                    </p>
                  </div>

                  <div className="journey-step">
                    <div className="journey-num">2</div>
                    <h3>Чтение текста</h3>
                    <p>
                      Ребёнок читает короткий текст по своему классу, а таймер и отметки
                      фиксируют темп.
                    </p>
                  </div>

                  <div className="journey-step">
                    <div className="journey-num">3</div>
                    <h3>Вопросы по смыслу</h3>
                    <p>
                      Короткие вопросы после текста проверяют, насколько точно ребёнок
                      понял прочитанное.
                    </p>
                  </div>

                  <div className="journey-step">
                    <div className="journey-num">4</div>
                    <h3>Готовый отчёт</h3>
                    <p>
                      Результат сохраняется в профиле: понятный итог для семьи или
                      детальные метрики для специалиста.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ==================== ВНУТРЕННИЕ ЭКРАНЫ ==================== */}
        {screen !== 'intro' && (
          <div className="workspace-section">
            <div className="container">
              {/* ==================== 2А. РЕГИСТРАЦИЯ: ШАГ 1 (ВЫБОР РОЛИ) ==================== */}
              {screen === 'register' && !role && (
                <section className="role-gate">
                  <button
                    type="button"
                    className="back-link"
                    onClick={() => goToScreen('intro')}
                  >
                    ← На главную
                  </button>

                  <div className="role-gate-head">
                    <h1>Выберите тип аккаунта</h1>
                    <p>
                      От выбранной роли зависит состав полей регистрации и формат отчётов
                      после скрининга.
                    </p>
                  </div>

                  <div className="role-gate-grid">
                    <button
                      type="button"
                      className="role-choice-card parent-card"
                      onClick={() => handleSelectRole('parent')}
                    >
                      <div>
                        <h2>Родитель</h2>
                        <p>
                          Для спокойной домашней проверки навыков чтения и понимания
                          текста у ребёнка.
                        </p>
                        <ul className="role-choice-points">
                          <li>Профили детей в одном кабинете</li>
                          <li>Понятный вывод без сложных терминов</li>
                          <li>История прохождений в динамике</li>
                        </ul>
                      </div>
                      <span className="role-choice-cta">Продолжить как родитель →</span>
                    </button>

                    <button
                      type="button"
                      className="role-choice-card specialist-card"
                      onClick={() => handleSelectRole('specialist')}
                    >
                      <div>
                        <h2>Специалист</h2>
                        <p>
                          Для логопедов, дефектологов и педагогов начальных классов при
                          первичной диагностике.
                        </p>
                        <ul className="role-choice-points">
                          <li>Ведение карточек группы учеников</li>
                          <li>Чистая скорость чтения и доля ошибок</li>
                          <li>Детальные данные сессий для анализа</li>
                        </ul>
                      </div>
                      <span className="role-choice-cta">Продолжить как специалист →</span>
                    </button>
                  </div>

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
                </section>
              )}

              {/* ==================== 2Б. РЕГИСТРАЦИЯ: ШАГ 2 (ФОРМА) ==================== */}
              {screen === 'register' && role && (
                <section
                  className={
                    role === 'specialist'
                      ? 'auth-card-clean lilac-top'
                      : 'auth-card-clean'
                  }
                >
                  <div className="auth-top-row">
                    <button
                      type="button"
                      className="back-link"
                      onClick={() => setRole(null)}
                    >
                      ← Изменить роль
                    </button>
                    <span
                      className={
                        role === 'specialist'
                          ? 'role-tag-inline lilac'
                          : 'role-tag-inline'
                      }
                    >
                      {role === 'parent' ? 'Родитель' : 'Специалист'}
                    </span>
                  </div>

                  <h1>
                    {role === 'parent'
                      ? 'Регистрация родителя'
                      : 'Регистрация специалиста'}
                  </h1>
                  <p className="auth-card-sub">
                    Заполните данные для создания личного кабинета — сразу после этого
                    можно добавить ребёнка и запустить тест.
                  </p>

                  <form key={`register-form-${role}`} onSubmit={handleRegister}>
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
                      className={
                        role === 'specialist'
                          ? 'btn-primary lilac full'
                          : 'btn-primary full'
                      }
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
                </section>
              )}

              {/* ==================== 3. ВХОД ==================== */}
              {screen === 'login' && (
                <section className="auth-card-clean">
                  <div className="auth-top-row">
                    <button
                      type="button"
                      className="back-link"
                      onClick={() => goToScreen('intro')}
                    >
                      ← На главную
                    </button>
                  </div>

                  <h1>Вход в кабинет</h1>
                  <p className="auth-card-sub">
                    Авторизуйтесь, чтобы открыть профили детей, запустить новый скрининг
                    или посмотреть историю прохождений.
                  </p>

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
                </section>
              )}

              {/* ==================== 4. КАБИНЕТ ==================== */}
              {screen === 'cabinet' && (
                <>
                  <div className="cabinet-top">
                    <div>
                      <h1>Личный кабинет</h1>
                      <p>Профили детей и запуск скрининга навыков чтения</p>
                    </div>
                    <div className="cabinet-stats-inline">
                      <span>
                        Профилей: <strong>{childrenList.length}</strong>
                      </span>
                      <span>
                        Пройдено тестов: <strong>{completedTestsCount}</strong>
                      </span>
                    </div>
                  </div>

                  <section className="cabinet-layout">
                    <div className="cabinet-form-card">
                      <h2>Добавить ребёнка</h2>
                      <p className="cabinet-sub">
                        После добавления система сама присвоит ребёнку обезличенный код
                        ученика.
                      </p>

                      <form onSubmit={handleAddChild}>
                        <div className="form-grid">
                          <div className="form-field full-width">
                            <label htmlFor="childFullName">Имя ребёнка</label>
                            <input
                              id="childFullName"
                              name="full_name"
                              type="text"
                              placeholder="Например: Николай"
                              required
                            />
                          </div>

                          <div className="form-field">
                            <label htmlFor="childBirthDate">Дата рождения</label>
                            <input
                              id="childBirthDate"
                              name="birth_date"
                              type="date"
                              min="2008-01-01"
                              max="2023-12-31"
                              required
                            />
                          </div>

                          <div className="form-field">
                            <label htmlFor="childGrade">Класс</label>
                            <select id="childGrade" name="grade" defaultValue="2 класс">
                              <option value="Дошкольник">Дошкольник</option>
                              <option value="1 класс">1 класс</option>
                              <option value="2 класс">2 класс</option>
                              <option value="3 класс">3 класс</option>
                              <option value="4 класс">4 класс</option>
                              <option value="5+ класс">5+ класс</option>
                            </select>
                          </div>

                          <div className="form-field full-width">
                            <label htmlFor="childNotes">Примечание (необязательно)</label>
                            <textarea
                              id="childNotes"
                              name="notes"
                              placeholder="Например: занимается с логопедом, билингв"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="btn-primary full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Сохраняем…' : 'Добавить профиль'}
                        </button>
                      </form>

                      {status && (
                        <p className={`status-banner ${status.type}`} role="status">
                          {status.text}
                        </p>
                      )}
                    </div>

                    <div>
                      {childrenList.length === 0 ? (
                        <div className="empty-state">
                          <strong>Пока нет ни одного профиля</strong>
                          <p>
                            Заполните форму слева, чтобы создать карточку ребёнка и
                            получить его обезличенный код.
                          </p>
                        </div>
                      ) : (
                        <div className="children-list">
                          {childrenList.map((child, idx) => {
                            const computedAge = calculateAge(child.birth_date)
                            const initial = (child.full_name || '?')
                              .trim()
                              .charAt(0)
                              .toUpperCase()
                            return (
                              <article
                                key={child.id}
                                className={`reader-ticket tone-${idx % 3}`}
                              >
                                <div className="child-left">
                                  <div className="child-avatar" aria-hidden="true">
                                    {initial}
                                  </div>

                                  <div className="child-info">
                                    <div className="child-top">
                                      <span className="child-name">{child.full_name}</span>
                                      {child.grade && (
                                        <span className="child-grade-pill">
                                          {child.grade}
                                        </span>
                                      )}
                                      <span
                                        className="child-code-pill"
                                        title="Обезличенный код для хранения результатов"
                                      >
                                        {formatChildCode(child.id)}
                                      </span>
                                    </div>
                                    <div className="child-meta">
                                      Дата рождения: {formatBirthDate(child.birth_date)}
                                      {computedAge !== null ? ` (${computedAge} лет)` : ''}
                                      {child.notes ? ` · ${child.notes}` : ''}
                                    </div>

                                    {child.lastResult && (
                                      <div className="child-last-result">
                                        Последний тест: {child.lastResult.netWpm} сл/мин ·
                                        понимание {child.lastResult.comprehensionPct}%
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="child-actions">
                                  <button
                                    type="button"
                                    className="btn-start-test"
                                    onClick={() => openScreeningForChild(child)}
                                  >
                                    Начать скрининг →
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-remove"
                                    onClick={() => handleRemoveChild(child.id)}
                                  >
                                    Удалить
                                  </button>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* ==================== 5. ОКНО ПРОХОЖДЕНИЯ СКРИНИНГА ==================== */}
              {screen === 'screening' && activeChild && (
                <section className="screening-wrap">
                  <div className="screening-topbar">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => goToScreen('cabinet')}
                    >
                      ← Вернуться в кабинет
                    </button>

                    <div className="step-pills" aria-label="Этапы скрининга">
                      <span
                        className={`step-pill ${
                          testStage === 'ready' ? 'active' : 'done'
                        }`}
                      >
                        1. Подготовка
                      </span>
                      <span
                        className={`step-pill ${
                          testStage === 'reading'
                            ? 'active'
                            : testStage === 'questions' || testStage === 'result'
                              ? 'done'
                              : ''
                        }`}
                      >
                        2. Чтение
                      </span>
                      <span
                        className={`step-pill ${
                          testStage === 'questions'
                            ? 'active'
                            : testStage === 'result'
                              ? 'done'
                              : ''
                        }`}
                      >
                        3. Вопросы
                      </span>
                      <span
                        className={`step-pill ${testStage === 'result' ? 'active' : ''}`}
                      >
                        4. Итог
                      </span>
                    </div>
                  </div>

                  <div className="screening-card">
                    {testStage === 'ready' && (
                      <>
                        <div className="screening-head-row">
                          <h1>
                            Скрининг: {activeChild.full_name} (
                            {formatChildCode(activeChild.id)})
                          </h1>
                          <span className="demo-note">Демо-тексты</span>
                        </div>
                        <p className="screening-desc">
                          Выберите текст для чтения, подтвердите согласие и передайте
                          экран ребёнку.
                        </p>

                        <div className="book-picker">
                          {MOCK_MODULES.map((mod) => (
                            <button
                              key={mod.id}
                              type="button"
                              className={
                                selectedModuleId === mod.id
                                  ? 'book-cover selected'
                                  : 'book-cover'
                              }
                              onClick={() => setSelectedModuleId(mod.id)}
                            >
                              <span className="book-cover-level">{mod.levelLabel}</span>
                              <span className="book-cover-title">{mod.title}</span>
                              <span className="book-cover-meta">
                                {mod.text.split(/\s+/).length} слов · {mod.questions.length}{' '}
                                вопроса
                              </span>
                            </button>
                          ))}
                        </div>

                        <p className="prep-guide">
                          <strong>Как проводить:</strong> попросите ребёнка читать в
                          привычном спокойном темпе — после текста будут 3 вопроса по
                          смыслу. Во время чтения вслух можно кликать по словам, где
                          ребёнок запнулся или ошибся.
                        </p>

                        <div
                          className={
                            consentAccepted ? 'consent-row accepted' : 'consent-row'
                          }
                        >
                          <label className="consent-label">
                            <input
                              type="checkbox"
                              checked={consentAccepted}
                              onChange={(e) => setConsentAccepted(e.target.checked)}
                            />
                            <span>
                              <strong>
                                Подтверждаю согласие на обработку персональных данных
                              </strong>{' '}
                              (152-ФЗ). Результаты сохраняются в обезличенном виде под
                              кодом {formatChildCode(activeChild.id)}.
                            </span>
                          </label>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!consentAccepted}
                            onClick={startReading}
                          >
                            Начать чтение →
                          </button>
                        </div>
                      </>
                    )}

                    {testStage === 'reading' && (
                      <>
                        <div className="reading-header">
                          <div>
                            <strong>{activeModule.title}</strong>
                            <div className="reading-hint">
                              Клик по слову отмечает ошибку или длительную паузу
                              (отмечено: {flaggedWords.length})
                            </div>
                          </div>

                          <div className="timer-box" aria-live="polite">
                            <span className="timer-dot" />
                            {formatTime(elapsedSeconds)}
                          </div>
                        </div>

                        <div className="reading-sheet" aria-label="Текст для чтения">
                          {moduleWords.map((word, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={
                                flaggedWords.includes(idx)
                                  ? 'reading-word flagged'
                                  : 'reading-word'
                              }
                              onClick={() => toggleWordFlag(idx)}
                            >
                              {word}
                            </button>
                          ))}
                        </div>

                        <div className="reading-footer">
                          <span className="reading-hint">
                            Всего слов в тексте: {moduleWords.length}
                          </span>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={finishReading}
                          >
                            Чтение завершено — к вопросам →
                          </button>
                        </div>
                      </>
                    )}

                    {testStage === 'questions' && currentQuestion && (
                      <>
                        <div className="question-progress">
                          Вопрос {currentQuestionIdx + 1} из{' '}
                          {activeModule.questions.length}
                        </div>

                        <h2 className="question-title">{currentQuestion.prompt}</h2>

                        <div className="options-stack">
                          {currentQuestion.options.map((optionText, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={
                                currentAnswer === idx
                                  ? 'option-btn selected'
                                  : 'option-btn'
                              }
                              onClick={() => selectAnswer(currentQuestion.id, idx)}
                            >
                              <span className="option-letter">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{optionText}</span>
                            </button>
                          ))}
                        </div>

                        <div className="reading-footer" style={{ marginTop: '26px' }}>
                          {currentQuestionIdx > 0 ? (
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                            >
                              ← Назад
                            </button>
                          ) : (
                            <span />
                          )}

                          {currentQuestionIdx < activeModule.questions.length - 1 ? (
                            <button
                              type="button"
                              className="btn-primary lilac"
                              disabled={currentAnswer === undefined}
                              onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                            >
                              Следующий вопрос →
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={currentAnswer === undefined || isSubmitting}
                              onClick={finishScreening}
                            >
                              {isSubmitting
                                ? 'Сохраняем результат…'
                                : 'Завершить и рассчитать итог'}
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {testStage === 'result' && lastResult && (
                      <>
                        <div className="screening-head-row">
                          <h1>
                            Итоги скрининга · {activeChild.full_name} (
                            {formatChildCode(activeChild.id)})
                          </h1>
                        </div>

                        {lastResult.parentSummary ? (
                          <div className="parent-verdict" style={{ marginTop: '18px' }}>
                            <div className="verdict-head">
                              <span className="verdict-title">Заключение системы</span>
                              {activeChild.grade && (
                                <span className="verdict-pill">{activeChild.grade}</span>
                              )}
                            </div>
                            <p>{lastResult.parentSummary}</p>
                          </div>
                        ) : (
                          <p className="screening-desc">
                            Результат сохранён в карточке ребёнка. Возрастные нормы будут
                            подключены после утверждения методики.
                          </p>
                        )}

                        <div className="result-grid">
                          <div className="result-metric">
                            <span>Темп чтения</span>
                            <strong>{lastResult.netWpm} сл/мин</strong>
                          </div>
                          <div className="result-metric">
                            <span>Время чтения</span>
                            <strong>{formatTime(lastResult.durationSec)}</strong>
                          </div>
                          <div className="result-metric">
                            <span>Ошибки / запинки</span>
                            <strong>
                              {lastResult.errorsCount} ({lastResult.errorRate}%)
                            </strong>
                          </div>
                          <div className="result-metric">
                            <span>Понимание текста</span>
                            <strong>
                              {lastResult.correctAnswers}/{lastResult.totalQuestions} (
                              {lastResult.comprehensionPct}%)
                            </strong>
                          </div>
                        </div>

                        <div className="reading-footer" style={{ marginTop: '24px' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowRawJson((prev) => !prev)}
                          >
                            {showRawJson
                              ? 'Скрыть данные сессии'
                              : 'Показать данные сессии'}
                          </button>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => openScreeningForChild(activeChild)}
                            >
                              Пройти ещё раз
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => goToScreen('cabinet')}
                            >
                              Вернуться в кабинет
                            </button>
                          </div>
                        </div>

                        {showRawJson && (
                          <pre className="json-preview">
                            {JSON.stringify(
                              lastResult.specialistMetrics
                                ? {
                                    specialist_metrics: lastResult.specialistMetrics,
                                    raw_data: lastResult.rawData,
                                  }
                                : lastResult.rawData,
                              null,
                              2
                            )}
                          </pre>
                        )}
                      </>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="page-footer">
        <div className="footer-inner">
          <span>ReadCheck · платформа скрининга навыков чтения</span>
          <span>Ориентировочная оценка · не заменяет очную диагностику специалиста</span>
        </div>
      </footer>
    </div>
  )
}

export default App
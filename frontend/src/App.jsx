import { useEffect, useRef, useState } from 'react'
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
 * ПЕРВИЧНЫЕ СТИМУЛЫ ОТ МЕТОДИЧЕСКОГО ОТДЕЛА («Стимулы — Предложения»)
 * 5 компонентов: Орфография, Фонология, Семантика, Морфология, Синтаксис
 * ===================================================================== */
const SENTENCE_STIMULI = [
  // 1. Орфография
  {
    id: 'ort-1',
    component: 'Орфография',
    sentence: 'Со стола СОБРАЛ соломинки.',
    question: 'Выбери сочетание букв, которое повторяется в предложении:',
    options: ['Со', 'Ос', 'Ур'],
    correctIndex: 0,
  },
  {
    id: 'ort-2',
    component: 'Орфография',
    sentence: 'На парте лежала карта и марка.',
    question: 'Выбери сочетание букв, которое повторяется в предложении:',
    options: ['ар', 'ра', 'лом'],
    correctIndex: 0,
  },
  {
    id: 'ort-3',
    component: 'Орфография',
    sentence: 'В баках росли маки и ползали раки.',
    question: 'Выбери сочетание букв, которое повторяется в предложении:',
    options: ['ро', 'ка', 'ак'],
    correctIndex: 2,
  },

  // 2. Фонология
  {
    id: 'fon-1',
    component: 'Фонология',
    sentence: 'Этот ... очень быстрый.',
    question: 'Выбери наиболее подходящее по смыслу слово:',
    options: ['Конь', 'Кон', 'Стул'],
    correctIndex: 0,
  },
  {
    id: 'fon-2',
    component: 'Фонология',
    sentence: '... медленно плыл по реке.',
    question: 'Выбери наиболее подходящее по смыслу слово:',
    options: ['Плоть', 'Плот', 'Пол'],
    correctIndex: 1,
  },
  {
    id: 'fon-3',
    component: 'Фонология',
    sentence: 'Я был очень ... нашей встрече.',
    question: 'Выбери наиболее подходящее по смыслу слово:',
    options: ['Ряд', 'Рад', 'Род'],
    correctIndex: 1,
  },

  // 3. Семантика
  {
    id: 'sem-1',
    component: 'Семантика',
    sentence: 'Старый пёс спал у ворот.',
    question: 'Кто спал у ворот?',
    options: ['Забор', 'Собака', 'Кошка'],
    correctIndex: 1,
  },
  {
    id: 'sem-2',
    component: 'Семантика',
    sentence: 'На поляне стояла берёза.',
    question: 'Что стояло на поляне?',
    options: ['Пень', 'Дерево', 'Кувшин'],
    correctIndex: 1,
  },
  {
    id: 'sem-3',
    component: 'Семантика',
    sentence: 'Врач осмотрел мальчика.',
    question: 'Кто осмотрел мальчика?',
    options: ['Учитель', 'Доктор', 'Больной'],
    correctIndex: 1,
  },

  // 4. Морфология
  {
    id: 'mor-1',
    component: 'Морфология',
    sentence: 'Мой папа работает лесорубом.',
    question: 'Чем занимается мой папа?',
    options: ['Пилит деревья', 'Ломает ветки', 'Оформляет документы'],
    correctIndex: 0,
  },
  {
    id: 'mor-2',
    component: 'Морфология',
    sentence: 'Наш дедушка — настоящий книголюб.',
    question: 'Что делает дедушка?',
    options: ['Обожает мороженое', 'Продаёт ручки и тетради', 'Много читает'],
    correctIndex: 2,
  },
  {
    id: 'mor-3',
    component: 'Морфология',
    sentence: 'Осенью в парке начался листопад.',
    question: 'Что происходило в парке?',
    options: ['Падали листья', 'Дул ветер', 'Шёл снег'],
    correctIndex: 0,
  },

  // 5. Синтаксис
  {
    id: 'syn-1',
    component: 'Синтаксис',
    sentence: 'Книги, которые подарила мне бабушка на день рождения, ... на полке.',
    question: 'Заполни пропуск подходящим словом:',
    options: ['Лежит', 'Лежат', 'Лежала'],
    correctIndex: 1,
  },
  {
    id: 'syn-2',
    component: 'Синтаксис',
    sentence: 'Мальчик, который вместе с друзьями участвовал в соревнованиях, ... первое место.',
    question: 'Заполни пропуск подходящим словом:',
    options: ['Заняли', 'Занял', 'Заняла'],
    correctIndex: 1,
  },
  {
    id: 'syn-3',
    component: 'Синтаксис',
    sentence: 'Дерево, которое посадили школьники, ... возле школы.',
    question: 'Заполни пропуск подходящим словом:',
    options: ['Выросли', 'Выросло', 'Вырос'],
    correctIndex: 1,
  },
]

const TEST_MODES = [
  {
    id: 'full-15',
    title: 'Полный скрининг предложений',
    levelLabel: 'Методика · 5 компонентов',
    description: '15 заданий · по 3 на каждый компонент',
    items: SENTENCE_STIMULI,
  },
  {
    id: 'express-5',
    title: 'Экспресс-демо (для проверки)',
    levelLabel: 'Быстрый режим · 5 компонентов',
    description: '5 заданий · по 1 на каждый компонент',
    items: [
      SENTENCE_STIMULI[0],
      SENTENCE_STIMULI[3],
      SENTENCE_STIMULI[6],
      SENTENCE_STIMULI[9],
      SENTENCE_STIMULI[12],
    ],
  },
]

const COMPONENT_ADVICE = {
  Орфография: 'Полезны короткие игры на поиск одинаковых слогов и буквосочетаний в словах.',
  Фонология: 'Обратите внимание на различение похожих по звучанию слов (например, плот/плоть, рад/ряд).',
  Семантика: 'Почаще просите ребёнка своими словами пересказывать прочитанное и подбирать синонимы.',
  Морфология: 'Разбирайте вместе состав сложных слов (лесоруб, книголюб, листопад) — это расширяет словарь.',
  Синтаксис: 'Тренируйте согласование слов в длинных предложениях, читая вслух с интонацией.',
}

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
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || 'parent')

  // Экраны: 'intro' | 'register' | 'login' | 'cabinet' | 'screening'
  const [screen, setScreen] = useState(() =>
    localStorage.getItem('token') ? 'cabinet' : 'intro'
  )

  const initialScreenRef = useRef(screen)
  const historyInitializedRef = useRef(false)

  const [previewRole, setPreviewRole] = useState('parent')
  const [role, setRole] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingChildId, setDeletingChildId] = useState(null)

  // Данные кабинета (ChildOut)
  const [childrenList, setChildrenList] = useState(loadSavedChildren)

  // Состояние окна скрининга
  const [activeChild, setActiveChild] = useState(null)
  const [selectedModeId, setSelectedModeId] = useState(TEST_MODES[0].id)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [testStage, setTestStage] = useState('ready') // 'ready' | 'testing' | 'result'
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentItemIdx, setCurrentItemIdx] = useState(0)
  const [itemStartTime, setItemStartTime] = useState(null)
  const [answers, setAnswers] = useState({}) // { [itemId]: optionIdx }
  const [itemTimings, setItemTimings] = useState({}) // { [itemId]: seconds }
  const [lastResult, setLastResult] = useState(null)
  const reportView = userRole === 'specialist' ? 'specialist' : 'parent'
  const [showRawJson, setShowRawJson] = useState(false)
  useEffect(() => {
  if (!historyInitializedRef.current) {
    historyInitializedRef.current = true

    const rootEntry = {
      __readcheck: true,
      screen: initialScreenRef.current,
      root: true,
      guard: false,
    }

    // Начальная запись истории приложения
    window.history.replaceState(
      rootEntry,
      '',
      window.location.href
    )

    // Защитная запись, чтобы не покинуть приложение
    // при нажатии «Назад» на начальном экране
    window.history.pushState(
      { ...rootEntry, guard: true },
      '',
      window.location.href
    )
  }

  function handlePopState(event) {
    const entry = event.state

    if (!entry?.__readcheck || !entry.screen) return

    setScreen(entry.screen)
    setStatus(null)
    setShowPassword(false)

    if (entry.screen === 'register') {
      setRole(null)
    }

    // Не позволяем случайно выйти из ReadCheck
    // при достижении начального экрана
    if (entry.root && !entry.guard) {
      window.history.pushState(
        { ...entry, guard: true },
        '',
        window.location.href
      )
    }
  }

  window.addEventListener('popstate', handlePopState)

  return () => {
    window.removeEventListener('popstate', handlePopState)
  }
}, [])

  useEffect(() => {
    if (screen !== 'screening' || testStage !== 'testing') return
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

  function goToScreen(nextScreen, replaceHistory = false) {
  if (nextScreen !== screen) {
    const historyEntry = {
      __readcheck: true,
      screen: nextScreen,
      root: false,
      guard: false,
    }

    if (replaceHistory) {
      window.history.replaceState(
        historyEntry,
        '',
        window.location.href
      )
    } else {
      window.history.pushState(
        historyEntry,
        '',
        window.location.href
      )
    }
  }

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
    localStorage.removeItem('userRole')
    setToken('')
    setUserEmail('')
    setUserRole('parent')
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
        localStorage.setItem('userRole', role)
        setUserRole(role)
        goToScreen('login')
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
        const profileResponse = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        if (!profileResponse.ok) {
          throw new Error('Не удалось определить роль аккаунта.')
        }
        const profile = await profileResponse.json()
        const authenticatedRole =
          profile.role === 'specialist' ? 'specialist' : 'parent'
        localStorage.setItem('userRole', authenticatedRole)
        setUserRole(authenticatedRole)
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('userEmail', emailValue)
        setToken(data.access_token)
        setUserEmail(emailValue)
        goToScreen('cabinet', true)
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

  async function handleRemoveChild(childId) {
    setStatus(null)
    setDeletingChildId(childId)

    try {
      const response = await fetch(`${API_BASE}/api/children/${childId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        setStatus({
          type: 'error',
          text: 'Сессия истекла. Выйдите и войдите в аккаунт заново.',
        })
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setStatus({
          type: 'error',
          text:
            typeof errorData.detail === 'string'
              ? `Не удалось удалить профиль: ${errorData.detail}`
              : `Не удалось удалить профиль (HTTP ${response.status}).`,
        })
        return
      }

      persistChildren(childrenList.filter((c) => c.id !== childId))
      setStatus({ type: 'success', text: 'Профиль ребёнка удалён.' })
    } catch {
      setStatus({
        type: 'error',
        text: 'Не удалось связаться с сервером. Профиль не удалён.',
      })
    } finally {
      setDeletingChildId(null)
    }
  }

  function openScreeningForChild(child) {
    setActiveChild(child)
    setSelectedModeId(TEST_MODES[0].id)
    setConsentAccepted(false)
    setTestStage('ready')
    setElapsedSeconds(0)
    setCurrentItemIdx(0)
    setAnswers({})
    setItemTimings({})
    setLastResult(null)
    setShowRawJson(false)
    goToScreen('screening')
  }

    function openSavedReportForChild(child) {
    if (!child.lastResult) return

    setActiveChild(child)
    setLastResult(child.lastResult)
    setTestStage('result')
    setSelectedModeId(TEST_MODES[0].id)
    setShowRawJson(false)
    goToScreen('screening')
  }

  const activeMode =
    TEST_MODES.find((m) => m.id === selectedModeId) || TEST_MODES[0]
  const activeItems = activeMode.items
  const currentItem = activeItems[currentItemIdx]
  const currentAnswer = currentItem ? answers[currentItem.id] : undefined

  function startTesting() {
    if (!consentAccepted) return
    setElapsedSeconds(0)
    setCurrentItemIdx(0)
    setAnswers({})
    setItemTimings({})
    setItemStartTime(Date.now())
    setTestStage('testing')
  }

  function recordCurrentItemTime() {
    if (!currentItem || !itemStartTime) return itemTimings
    const spentSec = Number(((Date.now() - itemStartTime) / 1000).toFixed(1))
    const nextTimings = {
      ...itemTimings,
      [currentItem.id]: Number(((itemTimings[currentItem.id] || 0) + spentSec).toFixed(1)),
    }
    setItemTimings(nextTimings)
    return nextTimings
  }

  function handleNextItem() {
    recordCurrentItemTime()
    setCurrentItemIdx((prev) => prev + 1)
    setItemStartTime(Date.now())
  }

  function handlePrevItem() {
    recordCurrentItemTime()
    setCurrentItemIdx((prev) => prev - 1)
    setItemStartTime(Date.now())
  }

  function selectAnswer(itemId, optionIdx) {
    setAnswers((prev) => ({ ...prev, [itemId]: optionIdx }))
  }

  async function finishScreening() {
    const finalTimings = recordCurrentItemTime()
    const totalQuestions = activeItems.length

    // Считаем точное время, количество слов и разбор по каждому заданию
    const itemLog = activeItems.map((item) => {
      const chosenIdx = answers[item.id]
      const isCorrect = chosenIdx === item.correctIndex
      const timeSec = finalTimings[item.id] || 1.0
      return {
        id: item.id,
        component: item.component,
        sentence: item.sentence,
        question: item.question,
        chosenText: chosenIdx !== undefined ? item.options[chosenIdx] : '—',
        correctText: item.options[item.correctIndex],
        isCorrect,
        timeSec,
      }
    })

    const totalWords = activeItems.reduce(
      (sum, item) => sum + item.sentence.split(/\s+/).filter(Boolean).length,
      0
    )
    const summedSec = itemLog.reduce((sum, row) => sum + row.timeSec, 0)
    const durationSec = Math.max(Math.round(summedSec), elapsedSeconds, 1)

    const correctAnswers = itemLog.filter((r) => r.isCorrect).length
    const errorsCount = totalQuestions - correctAnswers
    const comprehensionPct = Math.round((correctAnswers / totalQuestions) * 100)
    const errorRate = Number(((errorsCount / totalQuestions) * 100).toFixed(1))
    const avgTimeSec = Number((durationSec / totalQuestions).toFixed(1))
    const netWpm = Math.max(1, Math.round((totalWords / durationSec) * 60))

    // Группировка по 5 методическим компонентам
    const componentOrder = ['Орфография', 'Фонология', 'Семантика', 'Морфология', 'Синтаксис']
    const componentStats = componentOrder.map((compName) => {
      const rows = itemLog.filter((r) => r.component === compName)
      const total = rows.length
      const correct = rows.filter((r) => r.isCorrect).length
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0
      const avgSec =
        total > 0
          ? Number((rows.reduce((s, r) => s + r.timeSec, 0) / total).toFixed(1))
          : 0
      let level = 'ok'
      let statusLabel = 'Норма'
      if (pct < 50) {
        level = 'err'
        statusLabel = 'Требует поддержки'
      } else if (pct < 80) {
        level = 'warn'
        statusLabel = 'Зона внимания'
      }
      return { component: compName, correct, total, pct, avgSec, level, statusLabel }
    })

    // Генерация подробной обратной связи для родителя
    const strongComps = componentStats.filter((c) => c.pct >= 80).map((c) => c.component)
    const weakComps = componentStats.filter((c) => c.pct < 80)

    let detailedSummary = ''
    if (comprehensionPct >= 85) {
      detailedSummary =
        'Отличный результат! Ребёнок уверенно справляется с предложениями, точно понимает смысл и грамматические связи. Дополнительная коррекция не требуется — достаточно поддерживать регулярное чтение.'
    } else if (comprehensionPct >= 60) {
      detailedSummary =
        'Хороший базовый уровень, но в отдельных компонентах чтения встречаются затруднения. Ниже указаны конкретные направления, которые стоит мягко потренировать дома или обсудить с педагогом.'
    } else {
      detailedSummary =
        'Выявлены заметные трудности при чтении и анализе предложений. Рекомендуется показать подробный протокол логопеду или школьному педагогу для подбора индивидуальных упражнений.'
    }

    const recommendations = weakComps.map(
      (c) => `${c.component} (${c.correct}/${c.total}): ${COMPONENT_ADVICE[c.component]}`
    )

    const rawEventsPayload = {
      child_code: formatChildCode(activeChild.id),
      consent_152fz: true,
      mode_id: activeMode.id,
      avg_time_per_item_sec: avgTimeSec,
      component_stats: componentStats,
      items: itemLog,
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

    const sessionResult = {
      id: serverData?.id ?? Date.now(),
      modeTitle: activeMode.title,
      completedAt: serverData?.created_at || new Date().toISOString(),
      savedToApi,
      durationSec,
      avgTimeSec,
      totalWords,
      errorsCount,
      netWpm,
      errorRate,
      correctAnswers,
      totalQuestions,
      comprehensionPct,
      detailedSummary,
      strongComps,
      recommendations,
      componentStats,
      itemLog,
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

  function handleDownloadPdf() {
    window.print()
  }

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
                    <div className="hero-badge">
                      <span className="hero-badge-dot" />
                      Цифровой скрининг чтения · 1–5 классы
                    </div>

                    <h1>
                      Поможем увидеть, как{' '}
                      <span className="gradient-text">читает ребёнок</span>
                    </h1>

                    <p className="hero-lead">
                      Спокойная 5-минутная проверка 5 ключевых компонентов чтения:
                      орфографии, фонологии, семантики, морфологии и синтаксиса.
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
                            Начать бесплатно →
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

                    <div className="hero-metrics-row">
                      <div className="hero-metric">
                        <strong>5 компонентов</strong>
                        <span>комплексная диагностика</span>
                      </div>
                      <div className="hero-metric">
                        <strong>PDF-отчёт</strong>
                        <span>для семьи и специалиста</span>
                      </div>
                      <div className="hero-metric">
                        <strong>152-ФЗ</strong>
                        <span>обезличенные коды</span>
                      </div>
                    </div>
                  </div>

                  <div className="preview-stage" aria-label="Пример отчёта скрининга">
                    <div className="preview-glow" aria-hidden="true" />

                    <div className="float-chip top-right" aria-hidden="true">
                      <span className="chip-icon teal">✓</span>
                      <span>Точность: 93%</span>
                    </div>

                    <div className="float-chip bottom-left" aria-hidden="true">
                      <span className="chip-icon lilac">#</span>
                      <span>Код ученика: RC-0042</span>
                    </div>

                    <div className="preview-sheet">
                      <div className="preview-bar">
                        <span className="preview-session-label">
                          Интерактивный пример · 2 класс
                        </span>

                        <div className="mode-pills" role="tablist" aria-label="Режим отчёта">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={previewRole === 'parent'}
                            className={previewRole === 'parent' ? 'mode-pill active' : 'mode-pill'}
                            onClick={() => setPreviewRole('parent')}
                          >
                            Родитель
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={previewRole === 'specialist'}
                            className={previewRole === 'specialist' ? 'mode-pill active' : 'mode-pill'}
                            onClick={() => setPreviewRole('specialist')}
                          >
                            Специалист
                          </button>
                        </div>
                      </div>

                      <div className="preview-body">
                        <div className="reading-sample">
                          <div className="sample-top">
                            <span>Пример задания · Синтаксис</span>
                            <span>заполнение пропуска</span>
                          </div>

                          <p className="sample-text">
                            Книги, которые подарила мне бабушка на день рождения,{' '}
                            <span className={previewRole === 'specialist' ? 'word-pause' : ''}>
                              лежат
                            </span>{' '}
                            на полке.
                          </p>
                        </div>

                        {previewRole === 'parent' ? (
                          <>
                            <div className="parent-verdict">
                              <div className="verdict-head">
                                <span className="verdict-title">Навык в пределах нормы</span>
                                <span className="verdict-pill">2 класс</span>
                              </div>
                              <p>
                                Ребёнок уверенно понимает смысл предложений и правильно
                                согласует слова. Рекомендуем повторить проверку через
                                четверть.
                              </p>
                            </div>

                            <div className="parent-bars">
                              <div>
                                <div className="mini-stat-top">
                                  <span>Точность ответов</span>
                                  <strong>93%</strong>
                                </div>
                                <div className="bar-track">
                                  <div className="bar-fill ok" style={{ width: '93%' }} />
                                </div>
                              </div>

                              <div>
                                <div className="mini-stat-top">
                                  <span>Среднее время</span>
                                  <strong>6.2 сек</strong>
                                </div>
                                <div className="bar-track">
                                  <div className="bar-fill" style={{ width: '80%' }} />
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="spec-metrics">
                              <div className="spec-tile">
                                <span className="spec-tile-label">Орфография</span>
                                <span className="spec-tile-val">100%</span>
                              </div>
                              <div className="spec-tile">
                                <span className="spec-tile-label">Фонология</span>
                                <span className="spec-tile-val accent">67%</span>
                              </div>
                              <div className="spec-tile">
                                <span className="spec-tile-label">Синтаксис</span>
                                <span className="spec-tile-val">100%</span>
                              </div>
                            </div>

                            <div className="pace-box">
                              <div className="pace-header">
                                Время реакции по заданиям (сек)
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

            {/* Блок о проекте ReadCheck */}
            <section className="bento-section" aria-label="О проекте ReadCheck">
              <div className="container">
                <div className="section-header">
                  <h2>О проекте ReadCheck</h2>
                  <p>Ранняя оценка навыков чтения для учеников начальной школы</p>
                </div>

                <div className="bento-showcase">
                  <article className="bento-box bento-span-7">
                    <div>
                      <h3>Зачем нужен скрининг чтения?</h3>
                      <p>
                        Навык чтения напрямую влияет на успеваемость по всем школьным
                        предметам. Методика оценивает сразу 5 ключевых компонентов — от
                        зрительного распознавания буквосочетаний до понимания сложных
                        предложений.
                      </p>
                    </div>

                    <div className="pillars-grid">
                      <div className="pillar-item">
                        <strong>Орфография и фонология</strong>
                        <span>Точность распознавания слогов и звуков</span>
                      </div>
                      <div className="pillar-item">
                        <strong>Семантика и морфология</strong>
                        <span>Понимание смысла и состава слов</span>
                      </div>
                      <div className="pillar-item">
                        <strong>Синтаксис</strong>
                        <span>Согласование слов в предложениях</span>
                      </div>
                    </div>
                  </article>

                  <article className="bento-box bento-span-5">
                    <div>
                      <h3>Кому помогает платформа</h3>
                      <p>
                        По итогам тестирования можно сразу скачать готовый PDF-отчёт с
                        рекомендациями для семьи или детальным протоколом для специалиста.
                      </p>
                    </div>
                    <div className="role-compare-pills">
                      <div className="compare-row">
                        <span>Родителям</span>
                        <span className="compare-tag teal">понятные рекомендации</span>
                      </div>
                      <div className="compare-row">
                        <span>Логопедам и педагогам</span>
                        <span className="compare-tag lilac">профиль по 5 шкалам</span>
                      </div>
                    </div>
                  </article>

                  <article className="bento-box bento-span-12">
                    <div className="bento-flow-top">
                      <div>
                        <h3>Как проходит тестирование</h3>
                        <p>
                          Каждому ребёнку автоматически присваивается обезличенный код
                          ученика для безопасного хранения результатов (152-ФЗ).
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-white"
                        onClick={() => goToScreen(token ? 'cabinet' : 'register')}
                      >
                        {token ? 'Открыть кабинет →' : 'Начать регистрацию →'}
                      </button>
                    </div>

                    <div className="flow-pills">
                      <div className="flow-pill">
                        <span>ШАГ 01</span>
                        <strong>Профиль и код</strong>
                      </div>
                      <div className="flow-pill">
                        <span>ШАГ 02</span>
                        <strong>Согласие 152-ФЗ</strong>
                      </div>
                      <div className="flow-pill">
                        <span>ШАГ 03</span>
                        <strong>Задания по 5 шкалам</strong>
                      </div>
                      <div className="flow-pill">
                        <span>ШАГ 04</span>
                        <strong>Отчёт и PDF</strong>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ==================== ВНУТРЕННИЕ ЭКРАНЫ ==================== */}
        {screen !== 'intro' && (
          <div className="workspace-section">
            <div className="container">
              {/* ==================== 2А. РЕГИСТРАЦИЯ: ШАГ 1 ==================== */}
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
                          <li>Понятный вывод и рекомендации в PDF</li>
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
                          <li>Детальный профиль по 5 компонентам</li>
                          <li>Позадачный протокол и выгрузка в PDF</li>
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

              {/* ==================== 2Б. РЕГИСТРАЦИЯ: ШАГ 2 ==================== */}
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

                    <div className="consent-row">
                      <label className="consent-label">
                        <input
                          type="checkbox"
                          name="personal_data_consent"
                          value="accepted"
                          required
                        />
                        <span>
                          Нажимая кнопку «Зарегистрироваться», я подтверждаю{' '}
                          <a
                          href="/personal-data-consent.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--lilac)',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                            }}
                            >
                              согласие на обработку моих персональных данных
                              </a>.
                        </span>
                      </label>
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
                                        Последний скрининг:{' '}
                                        {child.lastResult.correctAnswers}/
                                        {child.lastResult.totalQuestions} (
                                        {child.lastResult.comprehensionPct}%) · ср. время{' '}
                                        {child.lastResult.avgTimeSec} сек
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="child-actions">
  {child.lastResult && (
    <button
      type="button"
      className="btn-start-test"
      onClick={() => openSavedReportForChild(child)}
    >
      Посмотреть отчёт →
    </button>
  )}

  {!child.lastResult && (
  <button
    type="button"
    className="btn-start-test"
    onClick={() => openScreeningForChild(child)}
  >
    Начать скрининг →
  </button>
)}

  <button
    type="button"
    className="btn-remove"
    onClick={() => handleRemoveChild(child.id)}
    disabled={deletingChildId === child.id}
  >
    {deletingChildId === child.id ? 'Удаляем…' : 'Удалить'}
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

              {/* ==================== 5. ОКНО СКРИНИНГА ==================== */}
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
                          testStage === 'testing'
                            ? 'active'
                            : testStage === 'result'
                              ? 'done'
                              : ''
                        }`}
                      >
                        2. Задания
                      </span>
                      <span
                        className={`step-pill ${testStage === 'result' ? 'active' : ''}`}
                      >
                        3. Отчёт и PDF
                      </span>
                    </div>
                  </div>

                  <div className="screening-card">
                    {/* ЭТАП 1: ПОДГОТОВКА */}
                    {testStage === 'ready' && (
                      <>
                        <h1>
                          Скрининг: {activeChild.full_name} (
                          {formatChildCode(activeChild.id)})
                        </h1>
                        <p className="screening-desc">
                          Первичная методика оценки чтения предложений по 5 компонентам:
                          орфография, фонология, семантика, морфология и синтаксис.
                        </p>

                        <div className="book-picker">
                          {TEST_MODES.map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              className={
                                selectedModeId === mode.id
                                  ? 'book-cover selected'
                                  : 'book-cover'
                              }
                              onClick={() => setSelectedModeId(mode.id)}
                            >
                              <span className="book-cover-level">{mode.levelLabel}</span>
                              <span className="book-cover-title">{mode.title}</span>
                              <span className="book-cover-meta">{mode.description}</span>
                            </button>
                          ))}
                        </div>

                        <p className="prep-guide">
                          <strong>Как проводить:</strong> передайте экран ребёнку. В
                          каждом задании нужно прочитать предложение и выбрать один из
                          трёх вариантов ответа. Система автоматически замеряет время и
                          точность по каждому компоненту.
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
                              Добровольное информированное согласие на участие в исследовании.{' '}
                              <a
                              href="/research-consent.html"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--lilac)',
                                fontWeight: 700,
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                                }}
                                >
                                  Ознакомиться с документами
                                  </a>
                            </span>
                          </label>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!consentAccepted}
                            onClick={startTesting}
                          >
                            Начать тестирование →
                          </button>
                        </div>
                      </>
                    )}

                    {/* ЭТАП 2: ПРОХОЖДЕНИЕ ЗАДАНИЙ ПО ПРЕДЛОЖЕНИЯМ */}
                    {testStage === 'testing' && currentItem && (
                      <>
                        <div className="test-progress-bar" aria-hidden="true">
                          <div
                            className="test-progress-fill"
                            style={{
                              width: `${((currentItemIdx + 1) / activeItems.length) * 100}%`,
                            }}
                          />
                        </div>

                        <div className="reading-header">
                          <span className="comp-badge">
                            Задание {currentItemIdx + 1} из {activeItems.length} ·{' '}
                            {currentItem.component}
                          </span>

                          <div className="timer-box" aria-live="polite">
                            <span className="timer-dot" />
                            {formatTime(elapsedSeconds)}
                          </div>
                        </div>

                        <div className="stimulus-sheet">{currentItem.sentence}</div>

                        <p className="question-prompt">{currentItem.question}</p>

                        <div className="options-stack">
                          {currentItem.options.map((optionText, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={
                                currentAnswer === idx
                                  ? 'option-btn selected'
                                  : 'option-btn'
                              }
                              onClick={() => selectAnswer(currentItem.id, idx)}
                            >
                              <span className="option-letter">
                                {['А', 'Б', 'В'][idx]}
                              </span>
                              <span>{optionText}</span>
                            </button>
                          ))}
                        </div>

                        <div className="reading-footer" style={{ marginTop: '26px' }}>
                          {currentItemIdx > 0 ? (
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={handlePrevItem}
                            >
                              ← Назад
                            </button>
                          ) : (
                            <span />
                          )}

                          {currentItemIdx < activeItems.length - 1 ? (
                            <button
                              type="button"
                              className="btn-primary lilac"
                              disabled={currentAnswer === undefined}
                              onClick={handleNextItem}
                            >
                              Следующее задание →
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
                                : 'Завершить и получить отчёт'}
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* ЭТАП 3: ПОДРОБНЫЙ ОТЧЁТ + PDF */}
                    {testStage === 'result' && lastResult && (
                      <>
                        <div className="screening-head-row">
                          <div>
                            <h1>
                              Отчёт скрининга · {activeChild.full_name} (
                              {formatChildCode(activeChild.id)})
                            </h1>
                            <div className="report-meta-line">
                              {lastResult.modeTitle}
                              {activeChild.grade ? ` · ${activeChild.grade}` : ''} ·{' '}
                              {new Date(lastResult.completedAt).toLocaleDateString('ru-RU')}
                            </div>
                          </div>

                          <div className="mode-pills no-print" aria-label="Тип отчёта">
                            <span className="mode-pill active">
                              {userRole === 'specialist'
                                ? 'Протокол специалиста'
                                : 'Отчёт родителя'}
                            </span>
                          </div>
                        </div>

                        {/* Ключевые метрики */}
                        <div className="result-grid">
                          <div className="result-metric">
                            <span>Общая точность</span>
                            <strong>
                              {lastResult.correctAnswers}/{lastResult.totalQuestions} (
                              {lastResult.comprehensionPct}%)
                            </strong>
                          </div>
                          <div className="result-metric">
                            <span>Общее время</span>
                            <strong>{formatTime(lastResult.durationSec)}</strong>
                          </div>
                          <div className="result-metric">
                            <span>Ср. время / задание</span>
                            <strong>{lastResult.avgTimeSec} сек</strong>
                          </div>
                          <div className="result-metric">
                            <span>Темп чтения</span>
                            <strong>{lastResult.netWpm} сл/мин</strong>
                          </div>
                        </div>

                        {/* Заключение */}
                        <div className="parent-verdict" style={{ marginTop: '18px' }}>
                          <div className="verdict-head">
                            <span className="verdict-title">Общее заключение</span>
                            <span className="verdict-pill">
                              {lastResult.comprehensionPct >= 85
                                ? 'Высокий уровень'
                                : lastResult.comprehensionPct >= 60
                                  ? 'Базовый уровень'
                                  : 'Нужна поддержка'}
                            </span>
                          </div>
                          <p>{lastResult.detailedSummary}</p>
                        </div>

                        {/* Профиль по 5 компонентам */}
                        <div className="comp-breakdown">
                          <h3>Результаты по 5 компонентам чтения</h3>
                          <div className="comp-cards">
                            {lastResult.componentStats.map((comp) => (
                              <div key={comp.component} className="comp-card">
                                <div className="comp-card-name">{comp.component}</div>
                                <div className="comp-card-score">
                                  {comp.correct}/{comp.total} ({comp.pct}%)
                                </div>
                                <div className="bar-track">
                                  <div
                                    className={`bar-fill ${comp.level}`}
                                    style={{ width: `${comp.pct}%` }}
                                  />
                                </div>
                                <div className="comp-card-meta">
                                  ср. {comp.avgSec} сек
                                </div>
                                <span className={`status-chip ${comp.level}`}>
                                  {comp.statusLabel}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Рекомендации для родителя */}
                        {reportView === 'parent' && (
                          <div className="feedback-block">
                            <h3>Подробная обратная связь и рекомендации</h3>
                            <ul className="feedback-list">
                              {lastResult.strongComps.length > 0 && (
                                <li>
                                  <strong>Сильные стороны:</strong>{' '}
                                  {lastResult.strongComps.join(', ')} — задания выполнены
                                  уверенно.
                                </li>
                              )}
                              {lastResult.recommendations.length > 0 ? (
                                lastResult.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))
                              ) : (
                                <li>
                                  Все 5 компонентов в норме. Поддерживайте регулярное
                                  чтение интересных ребёнку книг по 15–20 минут в день.
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Подробная таблица по каждому заданию для специалиста */}
                        {reportView === 'specialist' && (
                          <div className="spec-table-wrap">
                            <table className="spec-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Компонент</th>
                                  <th>Предложение</th>
                                  <th>Ответ ребёнка</th>
                                  <th>Эталон</th>
                                  <th>Время</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lastResult.itemLog.map((row, idx) => (
                                  <tr key={row.id}>
                                    <td>{idx + 1}</td>
                                    <td>{row.component}</td>
                                    <td>{row.sentence}</td>
                                    <td className={row.isCorrect ? 'ans-ok' : 'ans-err'}>
                                      {row.chosenText} {row.isCorrect ? '✓' : '✗'}
                                    </td>
                                    <td>{row.correctText}</td>
                                    <td>{row.timeSec} с</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Кнопки действий (скрываются при печати в PDF) */}
                        <div
                          className="reading-footer no-print"
                          style={{ marginTop: '24px' }}
                        >
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-primary lilac"
                              onClick={handleDownloadPdf}
                            >
                              Скачать отчёт в PDF
                            </button>

                            {reportView === 'specialist' && (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowRawJson((prev) => !prev)}
                              >
                                {showRawJson ? 'Скрыть JSON' : 'Показать JSON'}
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                            type="button"
                            className="btn-primary"
                            onClick={() => goToScreen('cabinet')}
                            >
                              В кабинет
                              </button>
                              </div>
                        </div>

                        {showRawJson && reportView === 'specialist' && (
                          <pre className="json-preview no-print">
                            {JSON.stringify(lastResult.rawData, null, 2)}
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
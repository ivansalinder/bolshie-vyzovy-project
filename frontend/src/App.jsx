import { useState } from 'react'
import './App.css'

function App() {
  // Состояния интерфейса
  const [isLoginMode, setIsLoginMode] = useState(false) // false = Регистрация, true = Вход
  const [role, setRole] = useState('parent')
  const [message, setMessage] = useState('')

  // Обработчик регистрации (работает с JSON)
  async function handleRegister(event) {
    event.preventDefault()
    setMessage('')

    if (!role) {
      setMessage('Пожалуйста, выберите роль.')
      return
    }

    const formData = new FormData(event.target)
    
    const fullName = [
      formData.get('last_name'),
      formData.get('first_name'),
    ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ')

    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
      role: role,
      full_name: fullName,
    }

    if (role === 'specialist') {
      payload.organization = formData.get('organization') || null
      payload.specialization = formData.get('specialization') || null
      payload.experience_years = formData.get('experience_years') ? parseInt(formData.get('experience_years')) : null
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setMessage('Аккаунт успешно создан! Теперь вы можете войти.')
        // Сразу переключаем пользователя на форму входа
        setIsLoginMode(true)
      } else {
        const errorData = await response.json()
        setMessage(`Ошибка: ${errorData.detail}`)
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером. Проверьте, запущен ли бэкенд.')
    }
  }

  // Обработчик входа (работает с x-www-form-urlencoded под стандарт FastAPI)
  async function handleLogin(event) {
    event.preventDefault()
    setMessage('')

    const formData = new FormData(event.target)
    
    // FastAPI ожидает поля 'username' и 'password'
    const urlEncodedData = new URLSearchParams()
    urlEncodedData.append('username', formData.get('email'))
    urlEncodedData.append('password', formData.get('password'))

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlEncodedData.toString()
      })

      if (response.ok) {
        const data = await response.json()
        // Сохраняем токен в хранилище браузера
        localStorage.setItem('token', data.access_token)
        setMessage('Вход выполнен успешно! (Токен сохранён)')
      } else {
        const errorData = await response.json()
        setMessage(`Ошибка: ${errorData.detail}`)
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером. Проверьте, запущен ли бэкенд.')
    }
  }

  // Сброс ошибок при переключении между формами
  function toggleMode() {
    setIsLoginMode(!isLoginMode)
    setMessage('')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          ReadCheck
        </div>
      </header>

      <main className="main-content">
        <section className="registration-card">
          
          <p className="form-kicker">
            {isLoginMode ? 'ВХОД В СИСТЕМУ' : 'СОЗДАНИЕ АККАУНТА'}
          </p>

          <h1>{isLoginMode ? 'С возвращением!' : 'Добро пожаловать!'}</h1>

          <p className="form-description">
            {isLoginMode ? 'Введите почту и пароль для доступа к своему кабинету.' : 'Заполните данные для создания аккаунта.'}
          </p>

          {isLoginMode ? (
            /* ================= ФОРМА ВХОДА ================= */
            <form onSubmit={handleLogin}>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="loginEmail">Электронная почта</label>
                  <input
                    id="loginEmail"
                    name="email"
                    type="email"
                    placeholder="example@mail.ru"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="loginPassword">Пароль</label>
                  <input
                    id="loginPassword"
                    name="password"
                    type="password"
                    placeholder="Введите пароль"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button className="submit-button" type="submit">
                Войти
              </button>
            </form>
          ) : (
            /* ============== ФОРМА РЕГИСТРАЦИИ ============== */
            <form onSubmit={handleRegister}>
              <fieldset className="role-fieldset">
                <legend>Роль</legend>
                <div className="role-options">
                  <button
                    type="button"
                    className={role === 'parent' ? 'role-button selected' : 'role-button'}
                    aria-pressed={role === 'parent'}
                    onClick={() => setRole('parent')}
                  >
                    Родитель
                  </button>
                  <button
                    type="button"
                    className={role === 'specialist' ? 'role-button selected' : 'role-button'}
                    aria-pressed={role === 'specialist'}
                    onClick={() => setRole('specialist')}
                  >
                    Специалист
                  </button>
                </div>
              </fieldset>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="firstName">Имя</label>
                  <input id="firstName" name="first_name" type="text" placeholder="Введите имя" autoComplete="given-name" required />
                </div>

                <div className="form-field">
                  <label htmlFor="lastName">Фамилия</label>
                  <input id="lastName" name="last_name" type="text" placeholder="Введите фамилию" autoComplete="family-name" required />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="email">Электронная почта</label>
                  <input id="email" name="email" type="email" placeholder="example@mail.ru" autoComplete="email" required />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="password">Пароль</label>
                  <input id="password" name="password" type="password" placeholder="Не менее 8 символов" autoComplete="new-password" minLength={8} required />
                </div>

                {role === 'specialist' && (
                  <>
                    <div className="form-field full-width">
                      <label htmlFor="specialization">Специализация (обязательно)</label>
                      <input id="specialization" name="specialization" type="text" placeholder="Например: Логопед, Дефектолог" required />
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="organization">Организация</label>
                      <input id="organization" name="organization" type="text" placeholder="Место работы" />
                    </div>

                    <div className="form-field">
                      <label htmlFor="experience">Стаж (лет)</label>
                      <input id="experience" name="experience_years" type="number" min="0" placeholder="Например: 5" />
                    </div>
                  </>
                )}
              </div>

              <button className="submit-button" type="submit">
                Создать аккаунт
              </button>
            </form>
          )}

          {/* Сообщение после отправки */}
          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          {/* Кнопка переключения между Входом и Регистрацией */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '15px', color: '#667085' }}>
            {isLoginMode ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button
              type="button"
              onClick={toggleMode}
              style={{
                color: '#1746b0',
                fontWeight: '600',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                padding: '0',
                fontFamily: 'inherit'
              }}
            >
              {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </div>

        </section>
      </main>
    </div>
  )
}

export default App
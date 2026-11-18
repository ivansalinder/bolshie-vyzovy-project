
import { useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link
} from 'react-router-dom'
import './App.css'

// Страница регистрации
function RegistrationPage() {
  const [role, setRole] = useState('parent')
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    setMessage(
      'Форма регистрации заполнена. Подключение к серверу добавим позже.'
    )
  }

  return (
    <section className="registration-card">
      <p className="form-kicker">СОЗДАНИЕ АККАУНТА</p>

      <h1>Добро пожаловать!</h1>

      <p className="form-description">
        Заполните данные для создания аккаунта.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset className="role-fieldset">
          <legend>Роль</legend>

          <div className="role-options">
            <button
              type="button"
              className={
                role === 'parent'
                  ? 'role-button selected'
                  : 'role-button'
              }
              aria-pressed={role === 'parent'}
              onClick={() => setRole('parent')}
            >
              Родитель
            </button>

            <button
              type="button"
              className={
                role === 'specialist'
                  ? 'role-button selected'
                  : 'role-button'
              }
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
            <input
              id="firstName"
              name="first_name"
              type="text"
              placeholder="Введите имя"
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
              placeholder="Введите фамилию"
              autoComplete="family-name"
              required
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="middleName">Отчество</label>
            <input
              id="middleName"
              name="middle_name"
              type="text"
              placeholder="Введите отчество"
              autoComplete="additional-name"
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="registerEmail">
              Электронная почта
            </label>
            <input
              id="registerEmail"
              name="email"
              type="email"
              placeholder="example@mail.ru"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="registerPassword">Пароль</label>
            <input
              id="registerPassword"
              name="password"
              type="password"
              placeholder="Не менее 8 символов"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="form-field full-width">
            <label htmlFor="phone">Номер телефона</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              autoComplete="tel"
              required
            />
          </div>
        </div>

        <button className="submit-button" type="submit">
          Создать аккаунт
        </button>

        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}
      </form>

      <p className="form-footer">
        Уже есть аккаунт?
        <Link className="text-button" to="/login">
          Войти
        </Link>
      </p>
    </section>
  )
}

// Страница входа
function LoginPage() {
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    setMessage(
      'Форма входа заполнена. Проверку аккаунта подключим позже.'
    )
  }

  return (
    <section className="registration-card">
      <p className="form-kicker">ВОЗВРАЩЕНИЕ В АККАУНТ</p>

      <h1>С возвращением!</h1>

      <p className="form-description">
        Введите почту и пароль, указанные при регистрации.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-grid login-grid">
          <div className="form-field full-width">
            <label htmlFor="loginEmail">
              Электронная почта
            </label>
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

        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}
      </form>

      <p className="form-footer">
        Ещё нет аккаунта?
        <Link className="text-button" to="/register">
          Зарегистрироваться
        </Link>
      </p>
    </section>
  )
}

// Основное приложение и адреса страниц
function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="site-header">
          <div className="brand">НазваниеПлатформы</div>
        </header>

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/register" replace />}
            />

            <Route
              path="/register"
              element={<RegistrationPage />}
            />

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="*"
              element={<Navigate to="/register" replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App


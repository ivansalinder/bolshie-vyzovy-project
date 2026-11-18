import { useState } from 'react'
import './App.css'

function App() {
  // Храним выбранную пользователем роль
  const [role, setRole] = useState('parent')

  // Храним сообщение, которое показываем после отправки формы
  const [message, setMessage] = useState('')

  // Обрабатываем отправку формы
  function handleSubmit(event) {
    event.preventDefault()

    if (!role) {
      setMessage('Пожалуйста, выберите роль.')
      return
    }

    setMessage(
      'Форма заполнена. Подключение регистрации добавим позже.'
    )
  }

  return (
    <div className="app-shell">

      {/* Верхняя часть страницы */}
      <header className="site-header">
        <div className="brand">
          НазваниеПлатформы
        </div>
      </header>

      {/* Основное содержимое */}
      <main className="main-content">

        <section className="registration-card">

          <p className="form-kicker">
            СОЗДАНИЕ АККАУНТА
          </p>

          <h1>Добро пожаловать!</h1>

          <p className="form-description">
            Заполните данные для создания аккаунта.
          </p>

          <form onSubmit={handleSubmit}>

            {/* Выбор роли */}
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

            {/* Поля с личными данными */}
            <div className="form-grid">

              <div className="form-field">
                <label htmlFor="firstName">
                  Имя
                </label>

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
                <label htmlFor="lastName">
                  Фамилия
                </label>

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
                <label htmlFor="middleName">
                  Отчество
                </label>

                <input
                  id="middleName"
                  name="middle_name"
                  type="text"
                  placeholder="Введите отчество"
                  autoComplete="additional-name"
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="email">
                  Электронная почта
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@mail.ru"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="password">
                  Пароль
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Не менее 8 символов"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="phone">
                  Номер телефона
                </label>

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

            {/* Кнопка регистрации */}
            <button
              className="submit-button"
              type="submit"
            >
              Создать аккаунт
            </button>

            {/* Сообщение после отправки */}
            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

          </form>

        </section>

      </main>

    </div>
  )
}

export default App
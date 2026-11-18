import { useState } from 'react'
import './App.css'

function App() {
  // Храним выбранную пользователем роль
  const [role, setRole] = useState('parent')

  // Храним сообщение, которое показываем после отправки формы
  const [message, setMessage] = useState('')

  // Обрабатываем отправку формы и шлём данные на бэкенд
  async function handleSubmit(event) {
    event.preventDefault()

    if (!role) {
      setMessage('Пожалуйста, выберите роль.')
      return
    }

    const formData = new FormData(event.target)
    
    // Склеиваем ФИО для соответствия бэкенду (full_name)
    const fullName = `${formData.get('last_name')} ${formData.get('first_name')} ${formData.get('middle_name')}`.trim()

    // Собираем JSON по контракту бэкенда
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
      role: role,
      full_name: fullName,
    }

    // Если специалист, добавляем его специфичные поля
    if (role === 'specialist') {
      payload.organization = formData.get('organization') || null
      payload.specialization = formData.get('specialization') || null
      payload.experience_years = formData.get('experience_years') ? parseInt(formData.get('experience_years')) : null
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setMessage('Аккаунт успешно создан! Данные сохранены в базе.')
      } else {
        const errorData = await response.json()
        // Выводим ошибку от FastAPI (например, "Email уже зарегистрирован")
        setMessage(`Ошибка: ${errorData.detail}`)
      }
    } catch (error) {
      setMessage('Ошибка соединения с сервером. Проверьте, запущен ли бэкенд.')
    }
  }

  return (
    <div className="app-shell">

      {/* Верхняя часть страницы */}
      <header className="site-header">
        <div className="brand">
          ReadCheck
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

              {/* Поле телефона отключено, так как его нет в БД бэкенда */}
              {/*
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
              */}

              {/* Динамические поля для специалиста */}
              {role === 'specialist' && (
                <>
                  <div className="form-field full-width">
                    <label htmlFor="specialization">Специализация (обязательно)</label>
                    <input
                      id="specialization"
                      name="specialization"
                      type="text"
                      placeholder="Например: Логопед, Дефектолог"
                      required
                    />
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="organization">Организация</label>
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      placeholder="Место работы"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="experience">Стаж (лет)</label>
                    <input
                      id="experience"
                      name="experience_years"
                      type="number"
                      min="0"
                      placeholder="Например: 5"
                    />
                  </div>
                </>
              )}

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
document.addEventListener('DOMContentLoaded', async () => {
  const passwordInputs = document.querySelectorAll('.js-password');
  const submitBtn = document.getElementById('resetPasswordBtn');
  const message = document.getElementById('message');
  const statusHint = document.getElementById('resetStatusHint');

  if (!submitBtn || !message || passwordInputs.length < 2 || !window.supabase) return;

  function setMessage(text, ok) {
    message.textContent = text || '';
    message.className = 'auth__message';
    if (!text) return;
    message.classList.add(ok ? 'auth__message--success' : 'auth__message--error');
  }

  function clearErrors() {
    passwordInputs.forEach((input) => input.classList.remove('auth__input--error'));
  }

  let supabaseClient = null;

  try {
    const cfgRes = await fetch('/api/auth/config');
    const cfg = await cfgRes.json().catch(() => null);
    if (!cfgRes.ok || !cfg?.success || !cfg.url || !cfg.anonKey) {
      setMessage('Не удалось инициализировать восстановление пароля', false);
      submitBtn.disabled = true;
      return;
    }

    supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hashParams.get('error_description')) {
      setMessage(decodeURIComponent(hashParams.get('error_description')), false);
      submitBtn.disabled = true;
      return;
    }

    const { data } = await supabaseClient.auth.getSession();
    if (!data?.session) {
      if (statusHint) {
        statusHint.textContent = 'Откройте эту страницу только по ссылке из письма Supabase.';
      }
      setMessage('Сессия восстановления не найдена. Откройте ссылку из письма ещё раз.', false);
      submitBtn.disabled = true;
      return;
    }

    if (statusHint) {
      statusHint.textContent = 'Ссылка подтверждена. Теперь можно задать новый пароль.';
    }
  } catch (e) {
    console.error('reset-password init error:', e);
    setMessage('Ошибка инициализации страницы', false);
    submitBtn.disabled = true;
    return;
  }

  submitBtn.addEventListener('click', async () => {
    clearErrors();
    setMessage('', false);

    const password = passwordInputs[0].value;
    const repeat = passwordInputs[1].value;

    if (password.length < 6) {
      passwordInputs[0].classList.add('auth__input--error');
      setMessage('Пароль должен содержать минимум 6 символов', false);
      return;
    }

    if (password !== repeat) {
      passwordInputs.forEach((input) => input.classList.add('auth__input--error'));
      setMessage('Пароли не совпадают', false);
      return;
    }

    submitBtn.disabled = true;
    try {
      const { error } = await supabaseClient.auth.updateUser({ password });
      if (error) {
        setMessage(error.message || 'Не удалось обновить пароль', false);
        return;
      }

      setMessage('Пароль успешно обновлён', true);
      await supabaseClient.auth.signOut().catch(() => {});
      setTimeout(() => {
        window.location.href = '/auth.html';
      }, 1200);
    } catch (e) {
      console.error('reset-password submit error:', e);
      setMessage('Ошибка соединения с сервером', false);
    } finally {
      submitBtn.disabled = false;
    }
  });
});

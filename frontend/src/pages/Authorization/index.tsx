import React, { useState, type SyntheticEvent } from 'react';
import { Flex, Box, Text, TextField, Button, Link } from '@radix-ui/themes';
import './AuthPage.less';

const AuthPage: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    console.log('Попытка входа:', { login, password });
  };

  return (
    <Flex className="auth-page" align="center" justify="center">
      <Box className="auth-card">
        <Flex className="auth-header" direction="column" align="center">
          <Text className="auth-title" size="6" weight="bold">
            RoboCode
          </Text>
          <Text className="auth-subtitle" size="2" color="gray">
            Вход в систему
          </Text>
        </Flex>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Flex className="form-content" direction="column" gap="4">
            <Flex className="form-group" direction="column">
              <Text className="form-label" size="2" weight="medium">
                Логин
              </Text>
              <TextField.Root
                className="form-input"
                variant="soft"
                placeholder="Введите логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </Flex>

            <Flex className="form-group" direction="column" gap="2">
              <Text className="form-label" size="2" weight="medium">
                Пароль
              </Text>
              <TextField.Root
                className="form-input"
                type="password"
                variant="soft"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Flex>

            <Flex className="forgot-password-wrapper" justify="end">
              <Link className="forgot-link" size="2" color="blue" href="#">
                Забыли пароль?
              </Link>
            </Flex>

            <Button
              className="submit-btn"
              type="submit"
              color="blue"
              size="3"
            >
              Войти
            </Button>
          </Flex>
        </form>

        <Flex className="auth-footer" justify="center" gap="1">
          <Text size="2" color="gray">
            Нет аккаунта?
          </Text>
          <Link className="register-link" size="2" color="blue" href="#">
            Зарегистрироваться
          </Link>
        </Flex>
      </Box>
    </Flex>
  );
};

export default AuthPage;

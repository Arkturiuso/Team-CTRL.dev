import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Box, Text, Link } from '@radix-ui/themes';

import { ROUTES } from '../../routes';
import { AuthForm, type AuthFormData } from '../../widgets/AuthForm';
import { loginUser } from './api';

import './AuthPage.less';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: AuthFormData) => {
  setIsLoading(true);
  setError(null);

  try {
      const response = await loginUser(formData);

      if (response.data?.tokens?.accessToken) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
      }
      if (response.data?.tokens?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      }
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      navigate('/user/levels');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла непредвиденная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex className="auth-page" align="center" justify="center">
      <Box className="auth-card" style={{ width: '100%', maxWidth: '400px' }}>
        <Flex className="auth-header" direction="column" align="center" mb="4">
          <Text className="auth-title" size="6" weight="bold">
            RoboCode
          </Text>
          <Text className="auth-subtitle" size="2" color="gray">
            Вход в систему
          </Text>
        </Flex>

        {error && (
          <Flex justify="center" width="100%" mb="4">
            <Text color="red" size="2" align="center" style={{ whiteSpace: 'pre-line' }}>
              {error}
            </Text>
          </Flex>
        )}

        <AuthForm onSubmit={handleSubmit} isLoading={isLoading} />

        <Flex className="auth-footer" justify="center" gap="1" mt="4">
          <Text size="2" color="gray">
            Нет аккаунта?
          </Text>
          <Link className="register-link" size="2" color="blue" href={ROUTES.AUTH.REGISTER}>
            Зарегистрироваться
          </Link>
        </Flex>
      </Box>
    </Flex>
  );
};

export default AuthPage;

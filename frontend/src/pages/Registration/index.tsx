import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Box, Text, Link } from '@radix-ui/themes';

import { ROUTES } from '../../routes';
import { RegisterForm } from '../../widgets/RegisterForm';
import { registerUser, type RegisterRequest } from './api';

import './RegisterPage.less';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser(formData);
      navigate(ROUTES.AUTH.LOGIN);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла непредвиденная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex className="register-page" align="center" justify="center">
      <Box className="register-card" style={{ width: '100%', maxWidth: '400px' }}>
        <Flex className="register-header" direction="column" align="center" mb="4">
          <Text className="register-title" size="6" weight="bold">
            RoboCode
          </Text>
          <Text className="register-subtitle" size="2" color="gray">
            Создание аккаунта
          </Text>
        </Flex>

        {error && (
          <Flex justify="center" width="100%" mb="4">
            <Text color="red" size="2" align="center" style={{ whiteSpace: 'pre-line' }}>
              {error}
            </Text>
          </Flex>
        )}

        <RegisterForm onSubmit={handleSubmit} isLoading={isLoading} />

        <Flex className="register-footer" justify="center" gap="1" mt="4">
          <Text size="2" color="gray">
            Уже есть аккаунт?
          </Text>
          <Link className="register-link" size="2" color="blue" href={ROUTES.AUTH.LOGIN}>
            Войти
          </Link>
        </Flex>
      </Box>
    </Flex>
  );
};

export default RegisterPage;

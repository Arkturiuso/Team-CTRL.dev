import { Flex, Box, Text, Link } from '@radix-ui/themes';
import { AuthForm } from '../../widgets/AuthForm';
import { ROUTES } from '../../routes';

import './AuthPage.less';

const AuthPage: React.FC = () => {
  const handleSubmit = () => {
    // TODO Fetch request
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

        <AuthForm onSubmit={handleSubmit}/>

        <Flex className="auth-footer" justify="center" gap="1">
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

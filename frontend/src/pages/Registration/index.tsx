import { Flex, Box, Text, Link } from '@radix-ui/themes';
import { ROUTES } from '../../routes';
import { RegisterForm } from '../../widgets/RegisterForm';

import './RegisterPage.less';

const RegisterPage: React.FC = () => {
  const handleSubmit = () => {
    // TODO Fetch request
  };

  return (
    <Flex className="register-page" align="center" justify="center">
      <Box className="register-card">
        <Flex className="register-header" direction="column" align="center">
          <Text className="register-title" size="6" weight="bold">
            RoboCode
          </Text>
          <Text className="register-subtitle" size="2" color="gray">
            Создание аккаунта
          </Text>
        </Flex>

        <RegisterForm onSubmit={handleSubmit}/>

        <Flex className="register-footer" justify="center" gap="1">
          <Text size="2" color="gray">
            Нет аккаунта?
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

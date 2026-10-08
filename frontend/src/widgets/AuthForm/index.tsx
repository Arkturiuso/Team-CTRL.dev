import { Button, Flex, Link } from "@radix-ui/themes";
import { InputField } from "../../shared/InputField";
import type { FC } from "react";

interface AuthFormProps {
  onSubmit: () => void;
}

export const AuthForm: FC<AuthFormProps> = ({ onSubmit }) => (
  <form className="auth-form" onSubmit={onSubmit}>
          <Flex className="form-content" direction="column" gap="4">
            <InputField label='Логин' placeholder='Введите логин' type='text'/>
            <InputField label='Пароль' placeholder='Введите пароль' type='password'/>

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
)

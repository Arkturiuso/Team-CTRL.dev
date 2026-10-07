import { Button, Flex, Link } from "@radix-ui/themes";
import { InputField } from "../../shared/InputField";
import type { FC } from "react";

interface RegisterFormProps {
  onSubmit: () => void;
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSubmit }) => (
  <form className="register-form" onSubmit={onSubmit}>
          <Flex className="form-content" direction="column" gap="4">
            <InputField label='Логин' placeholder='Введите логин' type='text'/>
            <InputField label='Пароль' placeholder='Введите пароль' type='password'/>
            <InputField label='Повторите пароль' placeholder='Введите пароль' type='password'/>

            <Flex className="forgot-password-wrapper" justify="end">
              <Link className="forgot-link" size="2" color="blue" href="#">
                Уже есть аккаунт?
              </Link>
            </Flex>

            <Button
              className="submit-btn"
              type="submit"
              color="blue"
              size="3"
            >
              Зарегистрироваться
            </Button>
          </Flex>
        </form>
)

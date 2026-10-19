import { useState } from "react";
import { Button, Flex, Link, Text } from "@radix-ui/themes";
import { InputField } from "../../shared/InputField";
import { ROUTES } from "../../routes";
import type { FC } from "react";
import type { RegisterRequest } from "../../pages/Registration/api";

interface RegisterFormProps {
  onSubmit: (data: RegisterRequest) => void | Promise<void>;
  isLoading?: boolean;
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSubmit, isLoading = false }) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError("Пароли не совпадают");
      return;
    }

    if (!login || !password) {
      setValidationError("Заполните все обязательные поля");
      return;
    }

    const formData: RegisterRequest = { login, password };
    onSubmit(formData);
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <Flex className="form-content" direction="column" gap="4">

        {validationError && (
          <Text color="red" size="2" align="center">
            {validationError}
          </Text>
        )}

        <InputField
          label="Логин"
          placeholder="Введите логин"
          type="text"
          value={login}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
          disabled={isLoading}
        />

        <InputField
          label="Пароль"
          placeholder="Введите пароль"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          disabled={isLoading}
        />

        <InputField
          label="Повторите пароль"
          placeholder="Введите пароль еще раз"
          type="password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />

        <Flex className="forgot-password-wrapper" justify="end">
          <Link className="forgot-link" size="2" color="blue" href={ROUTES.AUTH.LOGIN}>
            Уже есть аккаунт? Войти
          </Link>
        </Flex>

        <Button
          className="submit-btn"
          type="submit"
          color="blue"
          size="3"
          disabled={isLoading}
        >
          {isLoading ? "Регистрация..." : "Зарегистрироваться"}
        </Button>
      </Flex>
    </form>
  );
};

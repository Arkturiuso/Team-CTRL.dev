import { useState } from "react";
import { Button, Flex, Link } from "@radix-ui/themes";
import { InputField } from "../../shared/InputField";
import type { FC } from "react";

export interface AuthFormData {
  login: string;
  password: string;
}

interface AuthFormProps {
  onSubmit: (data: AuthFormData) => void | Promise<void>;
  isLoading?: boolean;
}

export const AuthForm: FC<AuthFormProps> = ({ onSubmit, isLoading = false }) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ login, password });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Flex className="form-content" direction="column" gap="4">
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
          disabled={isLoading}
        >
          {isLoading ? "Вход..." : "Войти"}
        </Button>
      </Flex>
    </form>
  );
};

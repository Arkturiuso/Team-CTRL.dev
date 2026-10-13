import { Flex, Text, TextField } from "@radix-ui/themes";
import type { FC, ChangeEvent } from "react";
import './InputField.less';

type InputFieldType = 'password' | 'text';

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  type: InputFieldType;
  value?: string;     
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const InputField: FC<InputFieldProps> = ({
  label,
  placeholder,
  type,
  value = '',
  onChange,
  disabled = false
}) => {
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="medium" className="text-field">
        {label}
      </Text>
      <TextField.Root
        className='input-field'
        variant="soft"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </Flex>
  );
}

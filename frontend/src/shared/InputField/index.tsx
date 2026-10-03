import { Flex, Text, TextField } from "@radix-ui/themes";
import { useState, type FC } from "react";
import './InputField.less';

type InputFieldType = 'password' | 'text'

interface InputFieldProps {
  label?: string;
  placeholder?: string;
  type: InputFieldType;
}

export const InputField: FC<InputFieldProps> = ({ label, placeholder, type }) => {
  const [text, setText] = useState<string>('');

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
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </Flex>
  )
}

// Сервер отдаёт время без смещения (наивный UTC): дописываем Z,
// иначе браузер примет строку за локальное время.
export const parseServerDate = (value: string): Date => {
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
};

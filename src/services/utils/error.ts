import axios from 'axios';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const readField = (value: unknown, key: string): unknown => {
  if (!isRecord(value)) return undefined;
  return value[key];
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    const fromData =
      readString(data) ||
      readString(readField(data, 'message')) ||
      readString(readField(data, 'error')) ||
      readString(readField(data, 'detail'));

    if (fromData) return fromData;
    if (readString(error.message)) return error.message;
  }

  if (error instanceof Error && readString(error.message)) return error.message;
  const raw = readString(error);
  if (raw) return raw;
  return fallback;
};

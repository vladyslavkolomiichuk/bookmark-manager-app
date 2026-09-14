import type { FieldSource } from '../generate/prisma/enums.js';

type DeriveSource = Extract<
  FieldSource,
  'NONE' | 'USER'
>;

type DeriveOutput = {
  value: string;
  source: DeriveSource;
};

export const deriveField = (
  value: string | undefined
): DeriveOutput => {
  if (value && value.length > 0) {
    return {
      value,
      source: 'USER',
    };
  }

  return {
    value: '',
    source: 'NONE',
  };
};

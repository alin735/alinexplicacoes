'use client';

import { useEffect } from 'react';

type FormField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isFormField(value: EventTarget | null): value is FormField {
  return (
    value instanceof HTMLInputElement ||
    value instanceof HTMLTextAreaElement ||
    value instanceof HTMLSelectElement
  );
}

function getPtValidationMessage(field: FormField): string {
  const { validity } = field;

  if (validity.valueMissing) {
    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      return 'Seleciona esta opção para continuar.';
    }
    if (field instanceof HTMLSelectElement) {
      return 'Seleciona uma opção.';
    }
    return 'Preenche este campo.';
  }

  if (validity.typeMismatch) {
    if (field instanceof HTMLInputElement && field.type === 'email') {
      return 'Introduz um endereço de email válido.';
    }
    if (field instanceof HTMLInputElement && field.type === 'url') {
      return 'Introduz um URL válido.';
    }
    return 'O valor introduzido não é válido.';
  }

  if (validity.tooShort) {
    const minLength =
      field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
        ? field.minLength
        : 0;
    return `Usa pelo menos ${minLength} caracteres.`;
  }

  if (validity.tooLong) {
    const maxLength =
      field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
        ? field.maxLength
        : 0;
    return `Usa no máximo ${maxLength} caracteres.`;
  }

  if (validity.patternMismatch) {
    return 'O formato introduzido não é válido.';
  }

  if (validity.rangeUnderflow) {
    const minValue =
      field instanceof HTMLInputElement && field.min
        ? field.min
        : 'o valor mínimo';
    return `O valor deve ser igual ou superior a ${minValue}.`;
  }

  if (validity.rangeOverflow) {
    const maxValue =
      field instanceof HTMLInputElement && field.max
        ? field.max
        : 'o valor máximo';
    return `O valor deve ser igual ou inferior a ${maxValue}.`;
  }

  if (validity.stepMismatch) {
    return 'Seleciona um valor válido.';
  }

  if (validity.badInput) {
    return 'Introduz um valor válido.';
  }

  return 'Corrige este campo para continuar.';
}

export default function FormValidationPt() {
  useEffect(() => {
    const handleInvalid = (event: Event) => {
      if (!isFormField(event.target)) return;
      event.target.setCustomValidity(getPtValidationMessage(event.target));
    };

    const clearCustomValidity = (event: Event) => {
      if (!isFormField(event.target)) return;
      event.target.setCustomValidity('');
    };

    document.addEventListener('invalid', handleInvalid, true);
    document.addEventListener('input', clearCustomValidity, true);
    document.addEventListener('change', clearCustomValidity, true);

    return () => {
      document.removeEventListener('invalid', handleInvalid, true);
      document.removeEventListener('input', clearCustomValidity, true);
      document.removeEventListener('change', clearCustomValidity, true);
    };
  }, []);

  return null;
}

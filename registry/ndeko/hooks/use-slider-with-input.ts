'use client';

import { useCallback, useState, type ChangeEvent } from 'react';

export type SliderWithInputOptions = {
  minValue?: number;
  maxValue?: number;
  initialValue?: number[];
  defaultValue?: number[];
};

type SliderValue = number | readonly number[];

const DECIMAL_DRAFT = /^-?\d*\.?\d*$/;

function valuesOf(value: SliderValue) {
  if (typeof value === 'number') {
    return [value];
  }
  return [...value];
}

function textsOf(values: readonly number[]) {
  return values.map(String);
}

function replaceAt<Item>(items: readonly Item[], index: number, item: Item) {
  const nextItems = [...items];
  nextItems[index] = item;
  return nextItems;
}

function isEmptyDraft(rawValue: string) {
  const isBlank = rawValue === '';
  const isLoneMinus = rawValue === '-';
  return isBlank || isLoneMinus;
}

function numberOf(rawValue: string) {
  if (isEmptyDraft(rawValue)) {
    return 0;
  }
  return parseFloat(rawValue);
}

function clamp(value: number, min: number, max: number) {
  const atLeastMin = Math.max(min, value);
  return Math.min(max, atLeastMin);
}

function keepBetweenNeighbours(
  value: number,
  index: number,
  values: readonly number[]
) {
  const lowerNeighbour = values[index - 1];
  const upperNeighbour = values[index + 1];
  let allowedValue = value;
  if (lowerNeighbour !== undefined) {
    allowedValue = Math.max(allowedValue, lowerNeighbour);
  }
  if (upperNeighbour !== undefined) {
    allowedValue = Math.min(allowedValue, upperNeighbour);
  }
  return allowedValue;
}

export function useSliderWithInput({
  minValue = 0,
  maxValue = 100,
  initialValue = [minValue],
  defaultValue = [minValue],
}: SliderWithInputOptions) {
  const [sliderValue, setSliderValue] = useState(initialValue);
  const [inputValues, setInputValues] = useState(() => textsOf(initialValue));

  const hasSameLength = sliderValue.length === defaultValue.length;
  const isAtDefault = sliderValue.every(
    (value, index) => value === defaultValue[index]
  );
  const showReset = hasSameLength && !isAtDefault;

  const validateAndUpdateValue = useCallback(
    (rawValue: string, index: number) => {
      const typedValue = numberOf(rawValue);

      if (Number.isNaN(typedValue)) {
        const currentText = String(sliderValue[index]);
        const restoredTexts = replaceAt(inputValues, index, currentText);
        setInputValues(restoredTexts);
        return;
      }

      const valueInRange = clamp(typedValue, minValue, maxValue);
      const allowedValue = keepBetweenNeighbours(
        valueInRange,
        index,
        sliderValue
      );
      const allowedText = String(allowedValue);
      const nextValues = replaceAt(sliderValue, index, allowedValue);
      const nextTexts = replaceAt(inputValues, index, allowedText);
      setSliderValue(nextValues);
      setInputValues(nextTexts);
    },
    [sliderValue, inputValues, minValue, maxValue]
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, index: number) => {
      const draft = event.currentTarget.value;
      const isDecimalDraft = DECIMAL_DRAFT.test(draft);
      if (!isDecimalDraft) {
        return;
      }
      const nextTexts = replaceAt(inputValues, index, draft);
      setInputValues(nextTexts);
    },
    [inputValues]
  );

  const handleSliderChange = useCallback((value: SliderValue) => {
    const nextValues = valuesOf(value);
    const nextTexts = textsOf(nextValues);
    setSliderValue(nextValues);
    setInputValues(nextTexts);
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultTexts = textsOf(defaultValue);
    setSliderValue(defaultValue);
    setInputValues(defaultTexts);
  }, [defaultValue]);

  return {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    resetToDefault,
    showReset,
  };
}

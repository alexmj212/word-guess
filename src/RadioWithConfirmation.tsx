import { RadioGroup } from "@headlessui/react";
import { useConfirmationModalContext } from "./ConfirmationDialogContext";

type RadioWithConfirmationType = {
  keys: string[];
  selectedValue: string;
  onChange: Function;
};

export const RadioWithConfirmation = ({keys, selectedValue, onChange}: RadioWithConfirmationType) => {
  const modalContext = useConfirmationModalContext();

  const handleOnClick = async (value: string) => {
    const results = await modalContext?.showConfirmation();
    results && onChange(value);
  };

  return (
    <RadioGroup value={selectedValue} onChange={(value) => handleOnClick(value)}>
      {keys.map((difficultyOption) => (
        <RadioGroup.Option key={difficultyOption} value={difficultyOption}>
          {({ checked }) => (
            <div className="check-group">
              <div className={`check-radio ${checked ? "bg-blue-400" : "bg-white"}`}></div>
              <span className="check-label">{difficultyOption}</span>
            </div>
          )}
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
};

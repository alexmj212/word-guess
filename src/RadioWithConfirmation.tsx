import { RadioGroup } from "@headlessui/react";
import { useConfirmationModalContext } from "./ConfirmationDialogContext";

type RadioWithConfirmationType = {
  keys: string[];
  selectedValue: string;
  keyDescription?: { [key: string]: string };
  onChange: (...args: any[]) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export const RadioWithConfirmation = ({
  keys,
  selectedValue,
  keyDescription,
  onChange,
}: RadioWithConfirmationType) => {
  const modalContext = useConfirmationModalContext();

  const handleOnClick = async (value: string) => {
    const results = await modalContext?.showConfirmation();
    results && onChange(value);
  };

  return (
    <RadioGroup
      value={selectedValue}
      onChange={(value) => handleOnClick(value)}
    >
      {keys.map((option) => (
        <RadioGroup.Option key={option} value={option}>
          {({ checked }) => (
            <div className="check-group">
              <div
                className={`check-radio ${
                  checked ? "bg-blue-400" : "bg-white"
                }`}
              ></div>
              <div className="check-label">
                <span className="check-label-name">{option}</span>
                {keyDescription && (
                  <span className="check-label-description">
                    {keyDescription[option]}
                  </span>
                )}
              </div>
            </div>
          )}
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
};

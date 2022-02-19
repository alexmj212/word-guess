import * as React from "react";
import { useConfirmationModalContext } from "./ConfirmationDialogContext";

type ButtonWithConfirmationType = {
  onClick: () => void;
  disabled?: boolean;
  className: string;
  children?: React.ReactNode;
};

export const ButtonWithConfirmation = ({
  children,
  className,
  onClick,
  disabled,
}: ButtonWithConfirmationType) => {
  const modalContext = useConfirmationModalContext();

  const handleOnClick = async () => {
    const results = await modalContext?.showConfirmation();
    results && onClick();
  };

  return (
    <button className={className} onClick={handleOnClick} disabled={disabled}>
      {children}
    </button>
  );
};

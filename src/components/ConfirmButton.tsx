import { useState } from 'react';
import { Button } from './Button';

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}

/** Two-step button for destructive actions: first click arms it, second click confirms. */
export function ConfirmButton({ label, confirmLabel, onConfirm, disabled }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  const handleClick = () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    onConfirm();
  };

  return (
    <Button variant="danger" disabled={disabled} onClick={handleClick} onBlur={() => setArmed(false)}>
      {armed ? confirmLabel : label}
    </Button>
  );
}

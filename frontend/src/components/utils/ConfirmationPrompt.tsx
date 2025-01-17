'use client';
import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  useConfirmation,
  useConfirmationActions,
} from '@/lib/stores/useConfirmationStore';
import { useUtilActions } from '@/lib/stores/useUtilStore';

export default function ConfirmationPrompt() {
  const confirmation = useConfirmation();
  const { resetConfirmation } = useConfirmationActions();
  const { setIsPromptOpen } = useUtilActions();

  function handleConfirmation() {
    confirmation.handleAction(confirmation.args);
    resetConfirmation();
  }

  useEffect(() => {
    setIsPromptOpen(confirmation.required);
  }, [confirmation.required]);

  return (
    <Dialog
      fullWidth
      maxWidth='xs'
      PaperProps={{
        sx: {
          bgcolor: '#A4B5C6',
        },
      }}
      open={confirmation.required}
      onClose={resetConfirmation}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          handleConfirmation();
        }
      }}
    >
      <DialogTitle>{confirmation.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{confirmation.description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={resetConfirmation}>No</Button>
        <Button onClick={handleConfirmation}>Yes</Button>
      </DialogActions>
    </Dialog>
  );
}

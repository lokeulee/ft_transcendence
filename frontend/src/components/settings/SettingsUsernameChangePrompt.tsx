'use client';
import { useEffect, useState } from 'react';
import InputField from '../utils/InputField';
import callAPI from '@/lib/callAPI';
import { useCurrentUser, useUserActions } from '@/lib/stores/useUserStore';
import {
  useDialogActions,
  useDialogTriggers,
} from '@/lib/stores/useDialogStore';
import { useNotificationActions } from '@/lib/stores/useNotificationStore';

export default function SettingsUsernameChangePrompt() {
  const currentUser = useCurrentUser();
  const { changeCurrentUsername } = useUserActions();
  const { resetDialog, resetTriggers } = useDialogActions();
  const { actionClicked, backClicked } = useDialogTriggers();
  const { displayNotification } = useNotificationActions();
  const [newUsername, setNewUsername] = useState('');

  async function handleUsernameChange(): Promise<void> {
    if (newUsername.length > 16) {
      throw 'Username cannot be more than 16 characters long';
    }
    await callAPI('PATCH', 'users', {
      id: currentUser.id,
      username: newUsername,
    });
    changeCurrentUsername(newUsername);
    displayNotification('success', 'Username changed, refreshing...');
    location.reload();
  }

  async function handleAction(): Promise<void> {
    handleUsernameChange()
      .then(resetDialog)
      .catch((error) => {
        resetTriggers();
        displayNotification('error', error);
      });
  }

  useEffect(() => {
    if (actionClicked) {
      handleAction();
    }
    if (backClicked) {
      resetDialog();
    }
  }, [actionClicked, backClicked]);

  return (
    <InputField
      label='Username'
      value={newUsername}
      onChange={setNewUsername}
      onSubmit={handleAction}
    />
  );
}

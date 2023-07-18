'use client';
import { ChannelMemberList } from '@/components/channel-member/ChannelMemberList';
import { ChannelList } from '@/components/channel/ChannelList';
import FriendList from '@/components/friend/FriendList';
import { useFriendActions } from '@/lib/stores/useFriendStore';
import {
  useFriendSocket,
  useSocketActions,
  useUserSocket,
} from '@/lib/stores/useSocketStore';
import { useCurrentUser, useUserActions } from '@/lib/stores/useUserStore';
import { useEffect } from 'react';
import ConfirmationPrompt from './utils/ConfirmationPrompt';
import NotificationBar from './utils/NotificationBar';
import {
  useConfirmation,
  useConfirmationActions,
} from '@/lib/stores/useConfirmationStore';
import {
  useNotification,
  useNotificationActions,
} from '@/lib/stores/useNotificationStore';

export default function Cyberpong() {
  const currentUser = useCurrentUser();
  const userSocket = useUserSocket();
  const friendSocket = useFriendSocket();
  const { initSockets, resetSockets } = useSocketActions();
  const { setupUserSocketEvents } = useUserActions();
  const { setupFriendSocketEvents } = useFriendActions();
  const confirmation = useConfirmation();
  const { resetConfirmation } = useConfirmationActions();
  const notification = useNotification();
  const { resetNotification, setupNotificationSocketEvents } =
    useNotificationActions();

  useEffect(() => {
    initSockets(currentUser.id);

    return () => {
      resetSockets();
    };
  }, []);

  useEffect(() => {
    if (userSocket) {
      setupUserSocketEvents(userSocket);
    }
  }, [userSocket]);

  useEffect(() => {
    if (friendSocket) {
      setupFriendSocketEvents(friendSocket);
      setupNotificationSocketEvents(friendSocket);
    }
  }, [friendSocket]);

  return (
    <>
      <ChannelList></ChannelList>
      <ChannelMemberList></ChannelMemberList>
      {/* <FriendList></FriendList> */}
      {/* <h1>Cyberpong™</h1> */}
      <ConfirmationPrompt
        open={confirmation.required}
        onCloseHandler={resetConfirmation}
        promptTitle={confirmation.title}
        promptDescription={confirmation.description}
        handleAction={() => {
          confirmation.handleAction(confirmation.arg);
          resetConfirmation();
        }}
      />
      <NotificationBar
        display={notification.display}
        level={notification.level}
        message={notification.message}
        onCloseHandler={resetNotification}
      />
    </>
  );
}

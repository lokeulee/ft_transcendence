'use client';
import { TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import callAPI from '@/lib/callAPI';
import emitToSocket from '@/lib/emitToSocket';
import { useCurrentUser, useUserActions } from '@/lib/stores/useUserStore';
import {
  useChannelActions,
  useSelectedChannel,
  useSelectedChannelMuted,
} from '@/lib/stores/useChannelStore';
import { useSelectedFriend } from '@/lib/stores/useFriendStore';
import { useCurrentSocialTab } from '@/lib/stores/useUtilStore';
import { useChannelMemberActions } from '@/lib/stores/useChannelMemberStore';
import { useChatActions, useMessagesSent } from '@/lib/stores/useChatStore';
import { useChannelSocket } from '@/lib/stores/useSocketStore';
import { MessageType } from '@/types/MessageTypes';
import { ChannelType } from '@/types/ChannelTypes';
import { useAchievementActions } from '@/lib/stores/useAchievementStore';
import { useNotificationActions } from '@/lib/stores/useNotificationStore';

export default function ChatBar() {
  const currentUser = useCurrentUser();
  const selectedChannel = useSelectedChannel();
  const selectedChannelMuted = useSelectedChannelMuted();
  const selectedFriend = useSelectedFriend();
  const currentSocialTab = useCurrentSocialTab();
  const channelSocket = useChannelSocket();
  const messagesSent = useMessagesSent();
  const { changeCurrentUserAvatar } = useUserActions();
  const { getChannelMember } = useChannelMemberActions();
  const { addMessage } = useChatActions();
  const { updateRecentChannelActivity } = useChannelActions();
  const [unsentMessages, setUnsentMessages] = useState<string[]>([]);
  const { handleAchievementsEarned } = useAchievementActions();
  const { displayNotification } = useNotificationActions();
  const [typingTimeoutID, setTypingTimeoutID] = useState<
    NodeJS.Timeout | undefined
  >();
  const chatBar = useRef<HTMLInputElement | null>(null);

  function handleInputChange(input: string): void {
    if (selectedChannel) {
      if (!typingTimeoutID) {
        emitToSocket(
          channelSocket,
          'startTyping',
          getChannelMember(currentUser.id, selectedChannel.id),
        );
      }
      clearTimeout(typingTimeoutID);
      setTypingTimeoutID(
        setTimeout(() => {
          emitToSocket(
            channelSocket,
            'stopTyping',
            getChannelMember(currentUser.id, selectedChannel.id),
          );
          setTypingTimeoutID(undefined);
        }, 2000),
      );
      if (input.length < 256) {
        setUnsentMessages((unsentMessages) => {
          unsentMessages[selectedChannel.id] = input;
          return unsentMessages;
        });
      }
    } else {
      console.log('FATAL ERROR: NO CHANNEL IS SELECTED');
    }
  }

  function handleKeyDown(key: string): void {
    if (selectedChannel) {
      if (key === 'Enter' && unsentMessages[selectedChannel.id]) {
        emitToSocket(
          channelSocket,
          'stopTyping',
          getChannelMember(currentUser.id, selectedChannel.id),
        );
        clearTimeout(typingTimeoutID);
        setTypingTimeoutID(undefined);
        sendMessage();
      }
    } else {
      console.log('FATAL ERROR: NO CHANNEL IS SELECTED');
    }
  }

  async function sendMessage(): Promise<void> {
    if (selectedChannel) {
      const newMessage = await callAPI('POST', 'messages', {
        channel_id: selectedChannel.id,
        user_id: currentUser.id,
        content: unsentMessages[selectedChannel.id],
        type: MessageType.TEXT,
      }).then((res) => res.body);

      if (newMessage) {
        setUnsentMessages((unsentMessages) => {
          const updatedUnsentMessages = [...unsentMessages];

          updatedUnsentMessages[selectedChannel.id] = '';
          return updatedUnsentMessages;
        });
        addMessage(newMessage);
        if (messagesSent[selectedChannel.id] === 19) {
          handleAchievementsEarned(currentUser.id, 5, displayNotification);
        }
        if (newMessage.content === 'Dingo Lingo') {
          handleAchievementsEarned(
            currentUser.id,
            14,
            displayNotification,
          ).then((achievementEarned) => {
            if (!achievementEarned) {
              changeCurrentUserAvatar(
                'https://cdn.discordapp.com/attachments/845369395231326219/1149002607193501746/IMG-20191207-WA0001.jpg',
              );
            }
          });
        }
        updateRecentChannelActivity(selectedChannel.id);
        emitToSocket(channelSocket, 'newMessage', newMessage);
      } else {
        console.log('FATAL ERROR: FAILED TO SEND MESSAGE IN BACKEND');
      }
    } else {
      console.log('FATAL ERROR: NO CHANNEL IS SELECTED');
    }
  }

  useEffect(() => {
    if (chatBar.current) {
      chatBar.current.focus();
    }
  }, [selectedChannel]);

  return (
    <TextField
      sx={{
        background: '#4CC9F075',
      }}
      InputLabelProps={{
        sx: {
          '&.Mui-focused': {
            color: 'black',
          },
        },
      }}
      fullWidth
      autoFocus
      inputRef={chatBar}
      autoComplete='off'
      disabled={selectedChannel === undefined || selectedChannelMuted}
      onChange={(event) => handleInputChange(event.target.value)}
      onKeyDown={(event) => handleKeyDown(event.key)}
      value={
        selectedChannel && unsentMessages[selectedChannel.id]
          ? unsentMessages[selectedChannel.id]
          : ''
      }
      label={
        selectedChannelMuted
          ? 'Unable to message, you have been muted'
          : selectedChannel
            ? 'Message ' +
            (selectedChannel.type === ChannelType.DIRECT
              ? selectedFriend?.incoming_friend.username
              : selectedChannel.name)
            : `Select a ${currentSocialTab.toLowerCase()} to start messaging`
      }
      variant='filled'
    />
  );
}

'use client';
import { Stack, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import ChatDisplay from './ChatDisplay';
import { useCurrentSocialTab } from '@/lib/stores/useUtilStore';
import { useSelectedChannel } from '@/lib/stores/useChannelStore';
import { useMessages } from '@/lib/stores/useChatStore';
import { useFriendChecks } from '@/lib/stores/useFriendStore';

export default function ChatList() {
  const currentSocialTab = useCurrentSocialTab();
  const selectedChannel = useSelectedChannel();
  const messages = useMessages();
  const { isFriendBlocked } = useFriendChecks();
  const chatStack = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const chatStackElement = chatStack.current;

    if (chatStackElement) {
      chatStackElement.scrollTop = chatStackElement.scrollHeight;
    }
  }, [selectedChannel, messages]);

  return (
    <Stack
      sx={{ overflow: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}
      height='100%'
      padding='10px'
      spacing={1}
      ref={chatStack}
    >
      {selectedChannel ? (
        messages
          .filter(
            (message) =>
              message.channel.id === selectedChannel.id &&
              !isFriendBlocked(message.user.id),
          )
          .map((message, index) => (
            <ChatDisplay key={index} message={message} />
          ))
      ) : (
        <Typography
          sx={{
            opacity: '50%',
          }}
          variant='h5'
          color='#DDDDDD'
          align='center'
          marginTop='26vh'
        >
          Select a {currentSocialTab.toLowerCase()} to view messages
        </Typography>
      )}
    </Stack>
  );
}

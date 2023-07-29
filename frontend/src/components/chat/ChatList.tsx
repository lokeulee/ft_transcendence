'use client';
import { Stack, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import ChatDisplay from './ChatDisplay';
import { useSelectedChannel } from '@/lib/stores/useChannelStore';
import { useMessages } from '@/lib/stores/useChatStore';

export default function ChatList() {
  const selectedChannel = useSelectedChannel();
  const messages = useMessages();
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
          .filter((message) => message.channel.id === selectedChannel.id)
          .map((message, index) => (
            <ChatDisplay
              key={index}
              content={message.content}
              type={message.type}
              dateOfCreation={message.date_of_creation}
              senderName={message.user.username}
            />
          ))
      ) : (
        <Typography
          sx={{
            opacity: '50%',
          }}
          variant='h5'
          align='center'
          marginTop='26vh'
        >
          Select a channel to view messages
        </Typography>
      )}
    </Stack>
  );
}

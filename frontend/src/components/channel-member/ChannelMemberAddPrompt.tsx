'use client';
import { Friend } from '@/types/FriendTypes';
import { useState } from 'react';
import FriendDisplay from './ChannelMemberFriendDisplay';
import { useChannelMembers } from '@/lib/stores/useChannelMemberStore';
import { useFriends } from '@/lib/stores/useFriendStore';
import { useDialog, useDialogActions } from '@/lib/stores/useDialogStore';
import { Button, Stack } from '@mui/material';

interface ChannelMemberAddPromptProps {
  addUser: (...args: any) => Promise<string>;
  channelHash: string;
}

export function ChannelMemberAddPrompt({
  addUser,
  channelHash,
}: ChannelMemberAddPromptProps) {
  const channelMembers = useChannelMembers();
  const friends = useFriends();
  const [selectedFriend, setSelectedFriend] = useState<Friend | undefined>();
  const [friendSearch, setFriendSearch] = useState('');
  const { setDialogPrompt, resetDialog } = useDialogActions();

  async function handleAddMemberAction(): Promise<void> {
    if (selectedFriend === undefined) {
      throw "Friend doesn't exist";
    }
    const friendToJoin = friends.find(
      (friend) => friend.id === selectedFriend.id,
    );

    if (!friendToJoin) {
      throw 'Invalid friend name!';
    }
    addUser(friendToJoin.incoming_friend.id, channelHash);
  }

  return (
    <Button
      onClick={() =>
        setDialogPrompt(
          true,
          'Add members',
          'Add your friends to the channel',
          'Cancel',
          resetDialog,
          'Add channel member',
          handleAddMemberAction,
          <Stack maxHeight={200} overflow='auto' spacing={1} sx={{ p: 1 }}>
            {friends.length > 0 &&
              friends
                .filter((friend) =>
                  channelMembers.every((member) => {
                    return member.user.id !== friend.incoming_friend.id;
                  }),
                )
                .map((friend: Friend, index: number) => (
                  <FriendDisplay
                    key={index}
                    selected={selectedFriend?.incoming_friend.id ?? 0}
                    selectCurrent={() => {
                      setFriendSearch(friend.incoming_friend.username);
                      setSelectedFriend(friend);
                    }}
                    friend={friend}
                  ></FriendDisplay>
                ))}
          </Stack>,
        )
      }
    >
      Add Channel Members
    </Button>
  );
}

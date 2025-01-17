import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import callAPI from '../callAPI';
import {
  ChannelMemberRole,
  ChannelMemberStatus,
  ChannelMember,
} from '@/types/ChannelMemberTypes';

interface ChannelMemberStore {
  data: {
    channelMembers: ChannelMember[];
  };
  actions: {
    getChannelMemberData: () => void;
    getMembersOfChannel: (channelID: number) => void;
    getChannelMember: (
      userID: number,
      channelID: number,
    ) => ChannelMember | undefined;
    getChannelOwner: (channelID: number) => ChannelMember | undefined;
    addChannelMember: (channelMember: ChannelMember) => void;
    kickChannelMember: (memberID: number) => void;
    deleteChannelMember: (userID: number) => void;
    deleteChannelMembers: (channelID: number) => void;
    changeChannelMemberRole: (
      memberID: number,
      newRole: ChannelMemberRole,
    ) => void;
    changeChannelMemberStatus: (
      memberID: number,
      newStatus: ChannelMemberStatus,
      mutedUntil?: string,
    ) => void;
    setupChannelMemberSocketEvents: (
      channelSocket: Socket,
      currentUserID: number,
    ) => void;
    setupChannelMemberUserSocketEvents: (userSocket: Socket) => void;
  };
  checks: {
    isChannelOwner: (userID: number, channelID: number) => boolean;
    isChannelAdmin: (userID: number, channelID: number) => boolean;
    isMemberBanned: (userID: number, channelID: number) => boolean;
    isMemberMuted: (userID: number, channelID: number) => boolean;
    isMessageDeletable: (
      currentMemberID: number,
      messageSenderID: number,
      channelID: number,
    ) => boolean;
  };
}

type StoreSetter = (
  helper: (state: ChannelMemberStore) => Partial<ChannelMemberStore>,
) => void;

type StoreGetter = () => ChannelMemberStore;

async function getChannelMemberData(set: StoreSetter): Promise<void> {
  const channelMembersData = await callAPI(
    'GET',
    'channel-members?search_type=ALL',
  ).then((res) => res.body);
  set(({ data }) => ({
    data: { ...data, channelMembers: channelMembersData },
  }));
}

async function getMembersOfChannel(
  set: StoreSetter,
  channelID: number,
): Promise<void> {
  const membersData = await callAPI(
    'GET',
    `channel-members?search_type=CHANNEL&search_number=${channelID}`,
  ).then((res) => res.body);

  set(({ data }) => ({
    data: {
      ...data,
      channelMembers: [...data.channelMembers, ...membersData],
    },
  }));
}

function getChannelMember(
  get: StoreGetter,
  userID: number,
  channelID: number,
): ChannelMember | undefined {
  return get().data.channelMembers.find(
    (member) => member.user.id === userID && member.channel.id === channelID,
  );
}

function getChannelOwner(
  get: StoreGetter,
  channelID: number,
): ChannelMember | undefined {
  return get().data.channelMembers.find(
    (member) =>
      member.channel.id === channelID &&
      member.role === ChannelMemberRole.OWNER,
  );
}

function addChannelMember(
  set: StoreSetter,
  channelMember: ChannelMember,
): void {
  set(({ data }) => ({
    data: {
      ...data,
      channelMembers: [...data.channelMembers, channelMember],
    },
  }));
}

function kickChannelMember(set: StoreSetter, memberID: number): void {
  set(({ data }) => ({
    data: {
      ...data,
      channelMembers: data.channelMembers.filter(
        (member) => member.id !== memberID,
      ),
    },
  }));
}

function deleteChannelMember(set: StoreSetter, userID: number): void {
  set(({ data }) => ({
    data: {
      ...data,
      channelMembers: data.channelMembers.filter(
        (member) => member.user.id !== userID,
      ),
    },
  }));
}

function deleteChannelMembers(set: StoreSetter, channelID: number): void {
  set(({ data }) => ({
    data: {
      ...data,
      channelMembers: data.channelMembers.filter(
        (member) => member.channel.id !== channelID,
      ),
    },
  }));
}

function changeChannelMemberRole(
  set: StoreSetter,
  memberID: number,
  newRole: ChannelMemberRole,
): void {
  set(({ data }) => ({
    data: {
      ...data,
      channelMembers: data.channelMembers.map((member) => {
        if (member.id === memberID) {
          member.role = newRole;
        }
        return member;
      }),
    },
  }));
}

function changeChannelMemberStatus(
  set: StoreSetter,
  memberID: number,
  newStatus: ChannelMemberStatus,
  mutedUntil?: string,
): void {
  set(({ data }) => ({
    data: {
      ...data,
      channelMembers: data.channelMembers.map((member) => {
        if (member.id === memberID) {
          member.status = newStatus;
          if (newStatus === ChannelMemberStatus.MUTED && mutedUntil) {
            member.muted_until = mutedUntil;
          }
          if (newStatus === ChannelMemberStatus.DEFAULT) {
            member.muted_until = '';
          }
        }
        return member;
      }),
    },
  }));
}

function setupChannelMemberSocketEvents(
  set: StoreSetter,
  channelSocket: Socket,
  currentUserID: number,
): void {
  channelSocket.on(
    'newMember',
    ({ newMember }: { newMember: ChannelMember }) => {
      if (newMember.user.id === currentUserID) {
        deleteChannelMembers(set, newMember.channel.id);
        getMembersOfChannel(set, newMember.channel.id);
      } else {
        addChannelMember(set, newMember);
      }
    },
  );
  channelSocket.on('kickMember', (member: ChannelMember) => {
    if (member.user.id === currentUserID) {
      deleteChannelMembers(set, member.channel.id);
    }
    kickChannelMember(set, member.id);
  });
  channelSocket.on(
    'changeRole',
    ({ memberID, newRole }: { memberID: number; newRole: ChannelMemberRole }) =>
      changeChannelMemberRole(set, memberID, newRole),
  );
  channelSocket.on(
    'changeStatus',
    ({
      memberID,
      newStatus,
      mutedUntil,
    }: {
      memberID: number;
      newStatus: ChannelMemberStatus;
      mutedUntil: string | undefined;
    }) => changeChannelMemberStatus(set, memberID, newStatus, mutedUntil),
  );
}

function setupChannelMemberUserSocketEvents(
  set: StoreSetter,
  userSocket: Socket,
): void {
  userSocket.on('deleteAccount', (userID: number) =>
    deleteChannelMember(set, userID),
  );
}

function isChannelOwner(
  get: StoreGetter,
  userID: number,
  channelID: number,
): boolean {
  return get().data.channelMembers.some(
    (member) =>
      member.user.id === userID &&
      member.channel.id === channelID &&
      member.role === ChannelMemberRole.OWNER,
  );
}

function isChannelAdmin(
  get: StoreGetter,
  userID: number,
  channelID: number,
): boolean {
  return get().data.channelMembers.some(
    (member) =>
      member.user.id === userID &&
      member.channel.id === channelID &&
      member.role === ChannelMemberRole.ADMIN,
  );
}

function isMemberBanned(
  get: StoreGetter,
  userID: number,
  channelID: number,
): boolean {
  return get().data.channelMembers.some(
    (member) =>
      member.user.id === userID &&
      member.channel.id === channelID &&
      member.status === ChannelMemberStatus.BANNED,
  );
}

function isMemberMuted(
  get: StoreGetter,
  userID: number,
  channelID: number,
): boolean {
  return get().data.channelMembers.some(
    (member) =>
      member.user.id === userID &&
      member.channel.id === channelID &&
      member.status === ChannelMemberStatus.MUTED,
  );
}

function isMessageDeletable(
  get: StoreGetter,
  currentMemberID: number,
  messageSenderID: number,
  channelID: number,
): boolean {
  const currentMember = getChannelMember(get, currentMemberID, channelID);
  const messageSender = getChannelMember(get, messageSenderID, channelID);

  if (!currentMember || !messageSender) {
    return false;
  }
  if (currentMember.id === messageSender.id) {
    return true;
  }
  if (currentMember.role === ChannelMemberRole.MEMBER) {
    return false;
  } else if (
    currentMember.role === ChannelMemberRole.ADMIN &&
    (messageSender.role === ChannelMemberRole.OWNER ||
      messageSender.role === ChannelMemberRole.ADMIN)
  ) {
    return false;
  }
  return true;
}

const useChannelMemberStore = create<ChannelMemberStore>()((set, get) => ({
  data: {
    channelMembers: [],
  },
  actions: {
    getChannelMemberData: () => getChannelMemberData(set),
    getMembersOfChannel: (channelID) => getMembersOfChannel(set, channelID),
    getChannelMember: (userID, channelID) =>
      getChannelMember(get, userID, channelID),
    getChannelOwner: (channelID) => getChannelOwner(get, channelID),
    addChannelMember: (channelMember) => addChannelMember(set, channelMember),
    kickChannelMember: (memberID) => kickChannelMember(set, memberID),
    deleteChannelMember: (userID) => deleteChannelMember(set, userID),
    deleteChannelMembers: (channelID) => deleteChannelMembers(set, channelID),
    changeChannelMemberRole: (memberID, newRole) =>
      changeChannelMemberRole(set, memberID, newRole),
    changeChannelMemberStatus: (memberID, newStatus, mutedUntil) =>
      changeChannelMemberStatus(set, memberID, newStatus, mutedUntil),
    setupChannelMemberSocketEvents: (channelSocket, currentUserID) =>
      setupChannelMemberSocketEvents(set, channelSocket, currentUserID),
    setupChannelMemberUserSocketEvents: (userSocket) =>
      setupChannelMemberUserSocketEvents(set, userSocket),
  },
  checks: {
    isChannelOwner: (userID, channelID) =>
      isChannelOwner(get, userID, channelID),
    isChannelAdmin: (userID, channelID) =>
      isChannelAdmin(get, userID, channelID),
    isMemberBanned: (userID, channelID) =>
      isMemberBanned(get, userID, channelID),
    isMemberMuted: (userID, channelID) => isMemberMuted(get, userID, channelID),
    isMessageDeletable: (currentMemberID, messageSenderID, channelID) =>
      isMessageDeletable(get, currentMemberID, messageSenderID, channelID),
  },
}));

export const useChannelMembers = () =>
  useChannelMemberStore((state) => state.data.channelMembers);
export const useChannelMemberActions = () =>
  useChannelMemberStore((state) => state.actions);
export const useChannelMemberChecks = () =>
  useChannelMemberStore((state) => state.checks);

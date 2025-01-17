import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChannelMember } from 'src/channel-member/entities/channel-member.entity';
import { Message } from 'src/message/entities/message.entity';

export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
  DIRECT = 'DIRECT',
}

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: ChannelType.PUBLIC })
  type: ChannelType;

  @Column({ default: null })
  hash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  date_of_creation: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  last_updated: Date;

  @OneToMany(() => ChannelMember, (channelMember) => channelMember.channel)
  channelMembers: ChannelMember[];

  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];
}

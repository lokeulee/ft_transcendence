import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum FriendStatus {
  Friend = 'friend',
  Invited = 'invited',
  Pending = 'pending',
  Blocked = 'blocked',
  Accept = 'accept',
  Deny = 'deny',
}

@Entity()
export class Friend {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.outgoingFriendships, {
    eager: true,
  })
  outgoingFriend: User;

  @ManyToOne(() => User, (user) => user.incomingFriendships, {
    eager: true,
  })
  incomingFriend: User;

  @Column()
  status: FriendStatus;
}

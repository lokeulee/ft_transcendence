import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateFriendDto } from './dto/create-friend.dto';
import { Friend, FriendStatus } from './entities/friend.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(friendDto: CreateFriendDto): Promise<void> {
    const [outgoingUser, incomingUser] = await Promise.all([
      this.userRepository.findOneBy({
        id: friendDto.outgoing_id,
      }),
      this.userRepository.findOneBy({
        id: friendDto.incoming_id,
      }),
    ]);

    let newOutgoingFriendship = this.friendRepository.create({
      outgoing_friend: outgoingUser,
      incoming_friend: incomingUser,
      status: FriendStatus.Invited,
    });

    let newIncomingFriendship = this.friendRepository.create({
      outgoing_friend: incomingUser,
      incoming_friend: outgoingUser,
      status: FriendStatus.Pending,
    });

    await this.friendRepository.save([
      newOutgoingFriendship,
      newIncomingFriendship,
    ]);
  }

  async findAll() {
    return await this.friendRepository.find();
  }

  async findOne(id: number): Promise<Friend | null> {
    return await this.friendRepository.findOneBy({ id });
  }

  async findFriendships(
    outgoing_id: number,
    incoming_id: number,
  ): Promise<Friend[] | Friend | null> {
    if (incoming_id === 0) {
      return this.findFriendsOfUser(outgoing_id);
    } else {
      return this.findExactMatch(outgoing_id, incoming_id);
    }
  }

  async findFriendsOfUser(outgoing_id: number): Promise<Friend[] | null> {
    return await this.friendRepository.findBy({
      outgoing_friend: { id: outgoing_id },
    });
  }

  async findExactMatch(
    outgoing_id: number,
    incoming_id: number,
  ): Promise<Friend | null> {
    return await this.friendRepository.findOneBy({
      outgoing_friend: { id: outgoing_id },
      incoming_friend: { id: incoming_id },
    });
  }

  async update(friendDto: CreateFriendDto) {
    const friendship = await this.findExactMatch(
      friendDto.outgoing_id,
      friendDto.incoming_id,
    );
    if (friendship.status === FriendStatus.Pending) {
      this.updateFriendRequest(friendDto);
    } else if (friendship.status == FriendStatus.Friend) {
      if (friendDto.status === FriendStatus.Blocked)
        await this.friendRepository.update(friendship.id, {
          status: friendDto.status,
        });
    }
  }

  async updateFriendRequest(friendDto: CreateFriendDto) {
    if (friendDto.status === FriendStatus.Accept) {
      Promise.all([
        this.friendRepository.update(
          {
            outgoing_friend: { id: friendDto.outgoing_id },
            incoming_friend: { id: friendDto.incoming_id },
          },
          { status: FriendStatus.Friend },
        ),
        this.friendRepository.update(
          {
            outgoing_friend: { id: friendDto.incoming_id },
            incoming_friend: { id: friendDto.outgoing_id },
          },
          { status: FriendStatus.Friend },
        ),
      ]);
    } else if (friendDto.status === FriendStatus.Deny)
      await this.deleteRelationship(
        friendDto.outgoing_id,
        friendDto.incoming_id,
      );
  }

  async remove(id: number) {
    return await this.friendRepository.delete(id);
  }

  async deleteRelationship(
    outgoing_id: number,
    incoming_id: number,
  ): Promise<void> {
    Promise.all([
      this.friendRepository.delete({
        outgoing_friend: { id: outgoing_id },
        incoming_friend: { id: incoming_id },
      }),
      this.friendRepository.delete({
        outgoing_friend: { id: incoming_id },
        incoming_friend: { id: outgoing_id },
      }),
    ]);
  }
}

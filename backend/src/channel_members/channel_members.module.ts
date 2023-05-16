import { Module } from '@nestjs/common';
import { ChannelMembersService } from './channel_members.service';
import { ChannelMembersController } from './channel_members.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelMember } from './entities/channel_member.entity';
import { Channel } from 'src/channels/entities/channel.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelMember, Channel, User])],
  controllers: [ChannelMembersController],
  providers: [ChannelMembersService],
})
export class ChannelMembersModule {}
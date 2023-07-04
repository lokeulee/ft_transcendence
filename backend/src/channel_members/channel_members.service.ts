import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChannelMemberDto } from './dto/create-channel_member.dto';
import { UpdateChannelMemberDto } from './dto/update-channel_member.dto';
import { ChannelMember } from './entities/channel_member.entity';
import { ChannelService } from 'src/channel/channel.service';

@Injectable()
export class ChannelMembersService {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMembersRepository: Repository<ChannelMember>,

    @Inject(ChannelService)
    private readonly channelService: ChannelService,
  ) {}

  async create(
    createChannelMemberDto: CreateChannelMemberDto,
  ): Promise<ChannelMember | null> {
    if (createChannelMemberDto.pass) {
      const authorized = await this.channelService.authorize(
        createChannelMemberDto.channel_id,
        createChannelMemberDto.pass,
      );

      if (!authorized) {
        return null;
      }
    }

    const newChannelMember = this.channelMembersRepository.create({
      channel: {
        id: createChannelMemberDto.channel_id,
      },
      user: {
        id: createChannelMemberDto.user_id,
      },
      role: createChannelMemberDto.role,
    });
    return await this.channelMembersRepository.save(newChannelMember);
  }

  async findAll(): Promise<ChannelMember[]> {
    return await this.channelMembersRepository.find();
  }

  async findOne(id: number): Promise<ChannelMember | null> {
    return await this.channelMembersRepository.findOneBy({ id });
  }

  async getMembers(channel_id: number): Promise<ChannelMember[]> {
    return await this.channelMembersRepository.find({
      relations: {
        user: true,
      },
      where: {
        channel: { id: channel_id },
      },
    });
  }

  async getChannels(user_id: number): Promise<ChannelMember[]> {
    return await this.channelMembersRepository.find({
      relations: {
        channel: true,
      },
      where: {
        user: { id: user_id },
      },
    });
  }

  async update(
    id: number,
    updateChannelMemberDto: UpdateChannelMemberDto,
  ): Promise<void> {
    await this.channelMembersRepository.update(id, updateChannelMemberDto);
  }

  async remove(id: number): Promise<void> {
    await this.channelMembersRepository.delete(id);
  }
}

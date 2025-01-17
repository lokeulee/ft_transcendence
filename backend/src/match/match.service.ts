import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { RemoveMatchDto } from './dto/remove.match.dto';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,

    @Inject(UserService)
    private readonly userService: UserService,
  ) {}

  async create(matchDto: CreateMatchDto): Promise<Match> {
    const playerOneFound = await this.userService.findOne(
      matchDto.p1_id,
      false,
    );
    const playerTwoFound = await this.userService.findOne(
      matchDto.p2_id,
      false,
    );

    if (
      matchDto.winner_id !== playerOneFound.id &&
      matchDto.winner_id !== playerTwoFound.id
    ) {
      throw new EntityNotFoundError(User, 'winner_id = ' + matchDto.winner_id);
    }

    return await this.matchRepository.save({
      winner_id: matchDto.winner_id,
      p1_score: matchDto.p1_score,
      p2_score: matchDto.p2_score,
      p1_class_id: matchDto.p1_class_id,
      p2_class_id: matchDto.p2_class_id,
      player_one: playerOneFound,
      player_two: playerTwoFound,
    });
  }

  async findAll(): Promise<Match[]> {
    return await this.matchRepository.find();
  }

  async findOne(id: number): Promise<Match | null> {
    const found = await this.matchRepository.findOneBy({ id });

    if (!found) {
      throw new EntityNotFoundError(Match, 'id = ' + id);
    }
    return found;
  }

  async findOneWithBothPlayers(
    playerOneID: number,
    playerTwoID: number,
  ): Promise<Match> {
    const playerOneFound = await this.userService.findOne(playerOneID, false);
    const playerTwoFound = await this.userService.findOne(playerTwoID, false);

    const matches = await this.matchRepository.find({
      where: [
        {
          player_one: { id: playerOneFound.id },
          player_two: { id: playerTwoFound.id },
        },
        {
          player_one: { id: playerTwoFound.id },
          player_two: { id: playerOneFound.id },
        },
      ],
    });

    return matches[matches.length - 1];
  }

  async findAllWithPlayer(playerID: number): Promise<Match[]> {
    const playerFound = await this.userService.findOne(playerID, false);

    return await this.matchRepository.find({
      where: [
        { player_one: { id: playerFound.id } },
        { player_two: { id: playerFound.id } },
      ],
    });
  }

  async findAllWithWinner(playerID: number): Promise<Match[]> {
    const playerFound = await this.userService.findOne(playerID, false);

    return await this.matchRepository.find({
      where: { winner_id: playerFound.id },
    });
  }

  async findAllWithBothPlayers(
    playerOneID: number,
    playerTwoID: number,
  ): Promise<Match[]> {
    const playerOneFound = await this.userService.findOne(playerOneID, false);
    const playerTwoFound = await this.userService.findOne(playerTwoID, false);

    return await this.matchRepository.find({
      where: [
        {
          player_one: { id: playerOneFound.id },
          player_two: { id: playerTwoFound.id },
        },
        {
          player_one: { id: playerTwoFound.id },
          player_two: { id: playerOneFound.id },
        },
      ],
    });
  }

  async remove(matchDto: RemoveMatchDto): Promise<void> {
    await this.matchRepository.delete(matchDto.id);
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { MatchHistoryModule } from './match_history/match_history.module';
import { AchievementsModule } from './achievements/achievements.module';

@Module({
  imports: [DatabaseModule, UsersModule, MatchHistoryModule, AchievementsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

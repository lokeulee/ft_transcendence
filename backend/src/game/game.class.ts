import { Server } from 'socket.io';
import { MatchInfo } from './game.service';
import { CreateMatchDto } from 'src/match/dto/create-match.dto';

interface Coor {
  x: number;
  y: number;
}

class RectObj {
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    player?: number,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = 1;
    this.velocityY = 1;
    this.player = player;
  }

  left() {
    return this.x - this.width / 2;
  }

  right() {
    return this.x + this.width / 2;
  }

  top() {
    return this.y - this.height / 2;
  }

  bottom() {
    return this.y + this.height / 2;
  }

  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  player: number;
}

export class GameClass {
  matchHandler: (matchDto: CreateMatchDto) => void;
  socketHandler: (roomid: string, message: string, data: any) => void;
  windowSize: Coor;
  direction: Coor;
  Ball: RectObj;
  Paddle1: RectObj;
  Paddle2: RectObj;
  velocity: number;
  score: { player1: number; player2: number };
  matchinfo: MatchInfo;
  server: Server;
  intervalID: NodeJS.Timer = null;
  ServingPaddle: Number = 1;
  refreshMilisec: number = 16;
  loaded: { player1: boolean; player2: boolean } = {
    player1: false,
    player2: false,
  };
  started: boolean = false;

  constructor(
    matchinfo: MatchInfo,
    socketHandler: (roomid: string, message: string, data: any) => void,
    matchHandler: (matchDto: CreateMatchDto) => void,
  ) {
    this.windowSize = {
      x: 1920,
      y: 1080,
    };
    this.direction = {
      x: 0,
      y: 0,
    };

    this.velocity = 15;
    this.score = {
      player1: 0,
      player2: 0,
    };
    this.Paddle1 = new RectObj(
      this.windowSize.x * 0.05,
      this.windowSize.y / 2,
      20,
      160,
      1,
    );
    this.Paddle2 = new RectObj(
      this.windowSize.x * 0.95,
      this.windowSize.y / 2,
      20,
      160,
      2,
    );

    this.Ball = new RectObj(
      10 + (this.Paddle1.right() + 30),
      this.windowSize.y / 2,
      60,
      60,
    );
    this.matchinfo = matchinfo;
    this.socketHandler = socketHandler;
    this.matchHandler = matchHandler;
  }

  gameStart(player: number) {
    if (!this.started && this.loaded.player1 && this.loaded.player2) {
      if (player === this.ServingPaddle) {
        this.direction = {
          x: (this.Ball.x - this.windowSize.x / 2) / this.windowSize.x,
          y: (this.windowSize.y / 2 - this.Ball.y) / this.windowSize.y,
        };
        console.log(this.direction);
        this.started = true;
      }
    }
  }
  gameReset() {
    switch (this.ServingPaddle) {
      case 2:
        this.Ball.x = this.Paddle2.left() - this.Ball.width / 2 - 10;
        break;
      default:
        this.Ball.x = 10 + (this.Paddle1.right() + this.Ball.width / 2);
        break;
    }

    this.started = false;
    this.Ball.y = this.windowSize.y / 2;
    this.Paddle1.y = this.windowSize.y / 2;
    this.Paddle2.y = this.windowSize.y / 2;
    this.direction = {
      x: 0,
      y: 0,
    };
  }

  gamePaddleConstruct(
    paddle1size: { width: number; height: number },
    paddle2size: { width: number; height: number },
  ) {
    this.Paddle1 = new RectObj(
      15,
      this.windowSize.y / 2,
      paddle1size.width,
      paddle1size.height,
    );
    this.Paddle2 = new RectObj(
      this.windowSize.x - 15,
      this.windowSize.y / 2,
      paddle2size.width,
      paddle2size.height,
    );
    console.log(paddle1size.width, paddle2size.width);
  }

  gameRefresh() {
    this.Ball.x += this.direction.x * this.velocity;
    this.Ball.y += this.direction.y * this.velocity;
    if (this.Ball.top() <= 0 || this.Ball.bottom() >= this.windowSize.y)
      this.direction.y *= -1;
    if (this.Ball.right() < 0) {
      this.gameHandleVictory(2);
    }
    if (this.Ball.left() > this.windowSize.x) {
      this.gameHandleVictory(1);
    }
    if (
      (this.gameCollision(this.Ball, this.Paddle1) && this.direction.x < 0) ||
      (this.gameCollision(this.Ball, this.Paddle2) && this.direction.x > 0)
    ) {
      this.direction.x *= -1;
    }
    this.socketHandler(this.matchinfo.roomid, 'game', {
      ball: {
        x: this.Ball.x,
        y: this.Ball.y,
      },
      balldirection: {
        x: this.direction.x,
        y: this.direction.y,
      },
      timestamp: Date.now(),
      paddle1: { x: this.Paddle1.x, y: this.Paddle1.y },
      paddle2: { x: this.Paddle2.x, y: this.Paddle2.y },
      score: this.score,
    });
  }

  gameUpdate() {
    this.intervalID = setInterval(() => {
      this.gameRefresh();
    }, 16);
  }

  gameHandleVictory(player: number) {
    this.score[`player${player}`]++;
    if (this.score[`player${player}`] >= 3) {
      this.socketHandler(this.matchinfo.roomid, 'victory', player);

      this.matchHandler({
        p1_id: this.matchinfo.player1,
        p2_id: this.matchinfo.player2,
        winner_id: this.matchinfo[`player${player}`],
        p1_score: this.score.player1,
        p2_score: this.score.player2,
        p1_skills: '1231',
        p2_skills: '1231',
      });
    }
    this.ServingPaddle = player;
    console.log(
      'Player 1: ',
      this.score.player1,
      ' | Player 2: ',
      this.score.player2,
    );
    this.gameReset();
    this.socketHandler(this.matchinfo.roomid, 'reset', player);
    this.loaded = { player1: false, player2: false };
  }

  stickEffect(paddle: RectObj) {
    if (this.started === false && paddle.player === this.ServingPaddle)
      this.Ball.y = paddle.y;
  }

  gameSetPosition(x: number, y: number) {
    this.Ball.x = x;
    this.Ball.y = y;
  }

  gameSetPaddlePosition(player: number, direction: number) {
    if (this.loaded.player1 && this.loaded.player2) {
      switch (player) {
        case 1:
          if (direction > 0) this.gameMovePaddle(this.Paddle1, 10);
          else if (direction < 0) this.gameMovePaddle(this.Paddle1, -10);
          break;

        case 2:
          if (direction > 0) this.gameMovePaddle(this.Paddle2, 10);
          else if (direction < 0) this.gameMovePaddle(this.Paddle2, -10);
          break;
        default:
          break;
      }
    }
  }

  gameSetLoaded(player: number, loaded: boolean) {
    this.loaded[`player${player}`] = loaded;
  }
  gameSetPaddleStop(player: number) {
    if (player === 1) this.Paddle1.velocityY = 1;
    if (player === 2) this.Paddle2.velocityY = 1;
  }

  gameMovePaddle(obj: RectObj, dir: number) {
    if (obj.top() + dir >= 0 && obj.bottom() + dir <= this.windowSize.y) {
      obj.y += dir;
      this.stickEffect(obj);
    } else if (dir > 0) obj.y = this.windowSize.y - obj.height / 2;
    else if (dir < 0) obj.y = obj.height / 2;
  }

  gameCollision(obj1: RectObj, obj2: RectObj) {
    return (
      obj1.left() <= obj2.right() &&
      obj1.right() >= obj2.left() &&
      obj1.top() <= obj2.bottom() &&
      obj1.bottom() >= obj2.top()
    );
  }
}
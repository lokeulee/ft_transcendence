import { Server } from 'socket.io';
import { MatchInfo } from './game.service';
import { Match } from 'src/match/entities/match.entity';
import { CreateMatchDto } from 'src/match/dto/create-match.dto';

interface Coor {
  x: number;
  y: number;
}

class Player {
  classID: number;
  paddleSize: number;
  paddleSpeed: number;
  paddleInverted: number;
  ballSpeed: number;
  timeFactor: number;
  cooldown: number;
  inCooldown: boolean;
  lastUsed: number;
  activeSkill: (player: number) => boolean | null = null;

  constructor() {
    this.paddleSize = 160;
    this.paddleSpeed = 1;
    this.paddleInverted = 1;
    this.ballSpeed = 1;
    this.timeFactor = 1;
    this.inCooldown = false;
    this.cooldown = 0;
    this.classID = 0;
  }

  setClass(classes: number, activeSkill?: (player: number) => boolean) {
    this.activeSkill = activeSkill;
    switch (classes) {
      case 1:
        {
          this.paddleSize = 192;
          this.cooldown = 20;
        }
        break;
      case 2:
        {
          this.paddleSpeed = 1.2;
          this.cooldown = 15;
        }
        break;
      case 3:
        {
          this.ballSpeed = 1.2;
          this.cooldown = 25;
        }
        break;
      default:
        break;
    }
    this.classID = classes;
  }

  resetCooldown() {
    this.lastUsed = 0;
    this.inCooldown = false;
  }
  checkCooldown() {
    if (this.inCooldown === false) return false;
    const timeDiff = (Date.now() - this.lastUsed) / 1000;
    if (this.cooldown === 0 || timeDiff > this.cooldown) {
      this.inCooldown = false;
      return true;
    }
  }
  setCooldown() {
    this.lastUsed = Date.now();
    this.inCooldown = true;
  }
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
    this.velocity = 0;
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
  velocity: number;
  player: number;
}

export class GameClass {
  matchHandler: (matchDto: CreateMatchDto) => Promise<Match>;
  socketHandler: (room_id: string, message: string, data: any) => void;
  timeFactor = 1;
  windowSize: Coor;
  direction: Coor;
  ball: RectObj;
  baseSpeed = 30;
  playerClass: { player1: Player; player2: Player };
  paddleClass: { paddle1: RectObj; paddle2: RectObj };
  velocity: number;
  score: { player1: number; player2: number };
  matchinfo: MatchInfo;
  server: Server;
  intervalID: NodeJS.Timer = null;
  ServingPaddle = 1;
  refreshMilisec = 16;
  loaded: { player1: boolean; player2: boolean } = {
    player1: false,
    player2: false,
  };
  started = false;
  slowed = false;
  isSucked = false;

  constructor(
    matchinfo: MatchInfo,
    socketHandler: (room_id: string, message: string, data: any) => void,
    matchHandler: (matchDto: CreateMatchDto) => Promise<Match>,
  ) {
    this.windowSize = {
      x: 1920,
      y: 1080,
    };
    this.direction = {
      x: 0,
      y: 0,
    };
    this.playerClass = { player1: new Player(), player2: new Player() };
    this.velocity = this.baseSpeed * this.playerClass.player1.ballSpeed;
    this.score = {
      player1: 0,
      player2: 0,
    };
    this.paddleClass = {
      paddle1: new RectObj(
        this.windowSize.x * 0.05,
        this.windowSize.y / 2,
        20,
        160,
        1,
      ),
      paddle2: new RectObj(
        this.windowSize.x * 0.95,
        this.windowSize.y / 2,
        20,
        160,
        2,
      ),
    };

    this.ball = new RectObj(
      10 + (this.paddleClass.paddle1.right() + 30),
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
          x: (this.ball.x - this.windowSize.x / 2) / this.windowSize.x,
          y: (this.windowSize.y / 2 - this.ball.y) / this.windowSize.y,
        };
        this.started = true;
        this.velocity =
          this.playerClass[`player${player}`].ballSpeed * this.baseSpeed;
      }
    }
  }
  gameReset() {
    this.baseSpeed = 30;
    switch (this.ServingPaddle) {
      case 2:
        this.ball.x =
          this.paddleClass.paddle2.left() - this.ball.width / 2 - 10;
        this.velocity = this.playerClass.player2.ballSpeed * this.baseSpeed;
        break;
      default:
        this.ball.x =
          10 + (this.paddleClass.paddle1.right() + this.ball.width / 2);
        this.velocity = this.playerClass.player1.ballSpeed * this.baseSpeed;
        break;
    }

    this.playerClass.player1.resetCooldown();
    this.playerClass.player2.resetCooldown();
    this.playerClass.player1.paddleInverted = 1;
    this.playerClass.player2.paddleInverted = 1;
    this.playerClass.player1.timeFactor = 1;
    this.playerClass.player2.timeFactor = 1;
    this.socketHandler(this.matchinfo.room_id, 'skillOn', 1);
    this.socketHandler(this.matchinfo.room_id, 'skillOn', 2);
    this.started = false;
    this.ball.y = this.windowSize.y / 2;
    this.paddleClass.paddle1.y = this.windowSize.y / 2;
    this.paddleClass.paddle2.y = this.windowSize.y / 2;
    this.paddleClass.paddle1.velocity = 0;
    this.paddleClass.paddle2.velocity = 0;
    this.direction = {
      x: 0,
      y: 0,
    };
  }

  gamePaddleConstruct(
    paddle1size: { width: number; height: number },
    paddle2size: { width: number; height: number },
  ) {
    this.paddleClass.paddle1 = new RectObj(
      15,
      this.windowSize.y / 2,
      paddle1size.width,
      paddle1size.height,
    );
    this.paddleClass.paddle2 = new RectObj(
      this.windowSize.x - 15,
      this.windowSize.y / 2,
      paddle2size.width,
      paddle2size.height,
    );
  }

  gameRefresh() {
    this.ball.x += this.direction.x * this.velocity * this.timeFactor;
    this.ball.y += this.direction.y * this.velocity * this.timeFactor;
    if (this.ball.top() <= 0 || this.ball.bottom() >= this.windowSize.y)
      this.direction.y *= -1;
    if (this.ball.right() < 0) {
      this.gameHandleVictory(2);
    }
    if (this.ball.left() > this.windowSize.x) {
      this.gameHandleVictory(1);
    }
    if (
      this.gameCollision(this.ball, this.paddleClass.paddle1) &&
      this.direction.x < 0
    ) {
      this.direction.x *= -1;
      this.direction.y += this.paddleClass.paddle1.velocity;
      this.baseSpeed += this.baseSpeed < 60 ? 5 : 0;
      this.velocity = this.playerClass.player1.ballSpeed * this.baseSpeed;
    }
    if (
      this.gameCollision(this.ball, this.paddleClass.paddle2) &&
      this.direction.x > 0
    ) {
      this.direction.x *= -1;
      this.direction.y += this.paddleClass.paddle2.velocity;
      this.baseSpeed += this.baseSpeed < 60 ? 5 : 0;
      this.velocity = this.playerClass.player2.ballSpeed * this.baseSpeed;
    }
    this.paddleClass.paddle1.velocity = 0;
    this.paddleClass.paddle2.velocity = 0;
    if (this.playerClass.player1.checkCooldown())
      this.socketHandler(this.matchinfo.room_id, 'skillOn', 1);
    if (this.playerClass.player2.checkCooldown())
      this.socketHandler(this.matchinfo.room_id, 'skillOn', 2);
    this.socketHandler(this.matchinfo.room_id, 'game', {
      ball: {
        x: this.ball.x,
        y: this.ball.y,
      },
      balldirection: {
        x: this.direction.x,
        y: this.direction.y,
      },
      timestamp: Date.now(),
      paddle1: { x: this.paddleClass.paddle1.x, y: this.paddleClass.paddle1.y },
      paddle2: { x: this.paddleClass.paddle2.x, y: this.paddleClass.paddle2.y },
      score: this.score,
      paddlesize: {
        paddle1: {
          width: this.paddleClass.paddle1.width,
          height: this.paddleClass.paddle1.height,
        },
        paddle2: {
          width: this.paddleClass.paddle2.width,
          height: this.paddleClass.paddle2.height,
        },
      },
    });
  }

  gameUpdate() {
    this.intervalID = setInterval(() => {
      this.gameRefresh();
    }, 16);
  }

  gameHandleVictory(player: number) {
    this.score[`player${player}`]++;
    if (this.score[`player${player}`] >= 11) {
      this.matchHandler({
        p1_id: this.matchinfo.player1,
        p2_id: this.matchinfo.player2,
        winner_id: this.matchinfo[`player${player}`],
        p1_score: this.score.player1,
        p2_score: this.score.player2,
        p1_class_id: this.playerClass.player1.classID,
        p2_class_id: this.playerClass.player2.classID,
      }).then((newMatch) =>
        this.socketHandler(this.matchinfo.room_id, 'victory', newMatch),
      );
      clearInterval(this.intervalID);
    }
    this.ServingPaddle = player;
    this.gameReset();
    this.socketHandler(this.matchinfo.room_id, 'reset', player);
    this.loaded = { player1: false, player2: false };
  }

  stickEffect(paddle: RectObj) {
    if (this.started === false && paddle.player === this.ServingPaddle)
      this.ball.y = paddle.y;
  }

  gameSetPosition(x: number, y: number) {
    this.ball.x = x;
    this.ball.y = y;
  }

  gameSetPaddlePosition(player: number, direction: number) {
    if (this.loaded.player1 && this.loaded.player2) {
      this.gameMovePaddle(
        this.paddleClass[`paddle${player}`],
        15 *
          direction *
          this.playerClass[`player${player}`].timeFactor *
          this.playerClass[`player${player}`].paddleSpeed *
          this.playerClass[`player${player}`].paddleInverted,
      );
    }
  }

  activeTeleportBall = (player: number) => {
    if (
      (this.direction.x > 0 &&
        this.ball.x > this.paddleClass.paddle1.x + this.windowSize.x * 0.06) ||
      (this.direction.x < 0 &&
        this.ball.x < this.paddleClass.paddle2.x - this.windowSize.x * 0.06)
    ) {
      this.ball.x -=
        this.direction.x > 0
          ? this.windowSize.x * 0.1
          : this.windowSize.x * -0.1;
    }
    this.ball.y = this.paddleClass[`paddle${player}`].y;
    return true;
  };

  activeSlowTime = (player: number) => {
    if (!this.slowed) {
      this.timeFactor = 0.7;
      this.playerClass[`player${player === 1 ? 2 : 1}`].timeFactor = 0.4;
      this.slowed = true;
      setTimeout(() => {
        this.timeFactor = 1;
        this.playerClass[`player${player === 1 ? 2 : 1}`].timeFactor = 1;
        this.slowed = false;
      }, 3000);

      return true;
    }
    return false;
  };

  activeInvertPaddle = (player: number) => {
    let opponent: number;

    switch (player) {
      case 1:
        opponent = 2;
        break;

      case 2:
        opponent = 1;
        break;
      default:
        break;
    }
    if (this.playerClass[`player${opponent}`].paddleSpeed > 0) {
      this.playerClass[`player${opponent}`].paddleInverted = -1;
      const timer = setTimeout(() => {
        this.playerClass[`player${opponent}`].paddleInverted = 1;
        clearTimeout(timer);
      }, 3000);
      return true;
    }
    return false;
  };

  gameSetClass(player: number, classes: number) {
    switch (classes) {
      case 1:
        this.playerClass[`player${player}`].setClass(
          classes,
          this.activeTeleportBall,
        );
        break;
      case 2:
        this.playerClass[`player${player}`].setClass(
          classes,
          this.activeSlowTime,
        );
        break;
      case 3:
        this.playerClass[`player${player}`].setClass(
          classes,
          this.activeInvertPaddle,
        );
        break;
      default:
        this.playerClass[`player${player}`].setClass(classes, null);
        break;
    }
    this.paddleClass[`paddle${player}`].height =
      this.playerClass[`player${player}`].paddleSize;
  }

  gameActiveSkill(player: number) {
    if (
      this.started &&
      this.playerClass[`player${player}`].activeSkill &&
      !this.playerClass[`player${player}`].inCooldown
    ) {
      if (this.playerClass[`player${player}`].activeSkill(player)) {
        this.socketHandler(this.matchinfo.room_id, 'skillOff', player);
        this.playerClass[`player${player}`].setCooldown();
      }
    }
  }
  gameSetLoaded(player: number, loaded: boolean) {
    this.loaded[`player${player}`] = loaded;
  }

  gameMovePaddle(obj: RectObj, dir: number) {
    if (obj.top() + dir >= 0 && obj.bottom() + dir <= this.windowSize.y) {
      obj.y += dir;
      this.stickEffect(obj);
      obj.velocity = dir > 0 ? 0.1 : -0.1;
      if (this.gameCollisionTopBottom(obj, this.ball)) this.direction.y *= -1;
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

  gameCollisionTopBottom(obj1: RectObj, obj2: RectObj) {
    return (
      obj1.left() === obj2.right() &&
      obj1.right() === obj2.left() &&
      obj1.top() <= obj2.bottom() &&
      obj1.bottom() >= obj2.top()
    );
  }

  gameClear() {
    clearInterval(this.intervalID);
  }
}

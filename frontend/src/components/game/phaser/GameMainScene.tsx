import { Socket } from 'socket.io-client';
import { GameData, MatchInfo } from '@/types/GameTypes';

export default class GameMainScene extends Phaser.Scene {
  private ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  private paddle1:
    | Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    | undefined;
  private paddle2:
    | Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    | undefined;
  private p1name: string;
  private p2name: string;
  private p1scoretext: Phaser.GameObjects.BitmapText | undefined;
  private p2scoretext: Phaser.GameObjects.BitmapText | undefined;
  private p1frame: Phaser.GameObjects.Image | undefined;
  private p2frame: Phaser.GameObjects.Image | undefined;
  private score: { player1: number; player2: number };
  private windowsize: { width: number; height: number };
  private Socket: Socket | null;
  private prevDirectionX: number | undefined;
  private prevDirectionY: number | undefined;
  private streak: { player: number; streak: number } = { player: 0, streak: 0 };
  private streakEffect:
    | Phaser.GameObjects.Particles.ParticleEmitter
    | undefined;
  private laserSoundEffect:
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound
    | undefined;
  private arcadeSoundEffect:
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound
    | undefined;
  private outofboundEffect:
    | Phaser.GameObjects.Particles.ParticleEmitter
    | undefined;
  private goalEffectToggle = false;
  private keyloop: () => void;
  private prediction: () => GameData;
  private victoryHandler: () => boolean;

  private musicEnabled: boolean;
  private soundEffectsEnabled: boolean;

  private loaded = false;

  constructor(
    gameSocket: Socket | null,
    keyloop: () => void,
    prediction: () => GameData,
    victoryHandler: () => boolean,
    matchInfo: MatchInfo | null,
    musicEnabled: boolean,
    soundEffectsEnabled: boolean,
  ) {
    super({ key: 'MainScene' });
    this.Socket = gameSocket;
    this.keyloop = keyloop;
    this.prediction = prediction;
    this.victoryHandler = victoryHandler;
    this.score = { player1: 0, player2: 0 };
    this.windowsize = { width: 0, height: 0 };
    this.p1name = matchInfo ? matchInfo.player1.nickname : '';
    this.p2name = matchInfo ? matchInfo.player2.nickname : '';
    this.musicEnabled = musicEnabled;
    this.soundEffectsEnabled = soundEffectsEnabled;
  }

  preload() {
    this.load.audio('laser', '/assets/audios/collision.ogg');
    this.load.audio('arcade', '/assets/audios/arcade.ogg');
    this.load.audio('banger', '/assets/audios/bgm1.mp3');
    this.load.video('background', '/assets/videos/background1.mp4', true);
    this.load.multiatlas(
      'ballsprite',
      '/assets/textures/ballsprite.json',
      'assets/textures',
    );
    this.load.image('red', '/assets/textures/neonpurple.png');
    this.load.image('flame3', '/assets/textures/flame_03.png');
    this.load.image('bubble', '/assets/textures/bubble.png');
    this.load.bitmapFont(
      'font',
      '/assets/fonts/scorefont_0.png',
      '/assets/fonts/scorefont.fnt',
    );
    this.load.image('paddle1', '/assets/textures/redpaddle.png');
    this.load.image('paddle2', '/assets/textures/bluepaddle.png');
    this.load.image('glowframe', '/assets/textures/namebox.png');
  }

  create() {
    const data = this.prediction();

    this.windowsize = {
      width: Number(this.game.config.width),
      height: Number(this.game.config.height),
    };
    const videoSprite = this.add.video(
      this.windowsize.width * 0.5,
      this.windowsize.height * 0.5,
      'background',
    );

    this.scale.displaySize.setAspectRatio(
      window.innerWidth / window.innerHeight,
    );
    videoSprite.setScale(
      this.windowsize.width / 1920,
      this.windowsize.height / 1080,
    );
    videoSprite.play(true);
    if (this.musicEnabled) {
      const music = this.sound.add('banger', { loop: true }).setVolume(0.5);
      music.play();
    }
    this.p1scoretext = this.add
      .bitmapText(
        this.windowsize.width * 0.47,
        this.windowsize.height * 0.05,
        'font',
        '00',
        64,
      )
      .setOrigin(0.5)
      .setTint(0xff5f1f);

    this.p2scoretext = this.add
      .bitmapText(
        this.windowsize.width * 0.53,
        this.windowsize.height * 0.05,
        'font',
        '00',
        64,
      )
      .setOrigin(0.5)
      .setTint(0xff5f1f);

    const dx = this.prevDirectionX !== undefined ? this.prevDirectionX : 0;
    const dy = this.prevDirectionY !== undefined ? this.prevDirectionY : 0;

    const particles = this.add.particles(0, 0, 'red', {
      quantity: 20,
      speed: { min: -100, max: 100 },
      accelerationY: 1000 * dy,
      accelerationX: 1000 * dx,
      scale: { start: 1, end: 0.1 },
      lifespan: { min: 300, max: 1000 },
      blendMode: 'ADD',
      frequency: 150,
      followOffset: { x: 0, y: 0 },
      rotate: { min: -180, max: 180 },
    });

    this.p1frame = this.add
      .image(
        this.windowsize.width * 0.33,
        this.windowsize.height * 0.055,
        'glowframe',
      )
      .setOrigin(0.5, 0.5)
      .setDisplaySize(
        this.windowsize.width * 0.2,
        this.windowsize.height * 0.1,
      );

    this.p2frame = this.add
      .image(
        this.windowsize.width * 0.67,
        this.windowsize.height * 0.055,
        'glowframe',
      )
      .setOrigin(0.5, 0.5)
      .setDisplaySize(this.windowsize.width * 0.2, this.windowsize.height * 0.1)
      .setFlipX(true);

    const textstyle = {
      fontFamily: 'cyberthrone',
      fontSize: 48,
      fontweight: 1700,
      color: '#d3d3d3',
      backgroundColor: 'transparent',
      align: 'center',
      stroke: '#18191A',
      strokeThickness: 5,
    };

    this.add
      .text(
        this.p1frame.x,
        this.p1frame.y,
        this.trimName(this.p1name),
        textstyle,
      )
      .setOrigin(0.5, 0.5);

    this.add
      .text(
        this.p2frame.x,
        this.p2frame.y,
        this.trimName(this.p2name),
        textstyle,
      )
      .setOrigin(0.5, 0.5);

    this.laserSoundEffect = this.sound.add('laser');
    this.arcadeSoundEffect = this.sound.add('arcade');
    this.ball = this.physics.add
      .sprite(
        this.windowsize.width * 0.5,
        this.windowsize.height * 0.5,
        'ballsprite',
        '1.png',
      )
      .setScale(1.5, 1.5);
    particles.startFollow(this.ball);
    this.paddle1 = this.physics.add
      .sprite(
        this.windowsize.width * 0.05,
        this.windowsize.height * 0.5,
        'paddle1',
      )
      .setOrigin(0.5, 0.5)
      .setDisplaySize(
        data.paddlesize.paddle1.width,
        data.paddlesize.paddle1.height,
      );

    this.paddle2 = this.physics.add
      .sprite(
        this.windowsize.width * 0.95,
        this.windowsize.height * 0.5,
        'paddle2',
      )
      .setOrigin(0.5, 0.5)
      .setDisplaySize(
        data.paddlesize.paddle2.width,
        data.paddlesize.paddle2.height,
      );

    const redglow = this.paddle1.preFX?.addGlow(0xff4444, 0, 0, false, 0.1, 3);
    const blueglow = this.paddle2.preFX?.addGlow(
      0x34646ff,
      0,
      0,
      false,
      0.1,
      3,
    );

    this.tweens.add({
      targets: blueglow,
      outerStrength: 2,
      yoyo: true,
      loop: -1,
      ease: 'sine.inout',
    });
    this.tweens.add({
      targets: redglow,
      outerStrength: 2,
      yoyo: true,
      loop: -1,
      ease: 'sine.inout',
    });

    const frames = this.anims.generateFrameNames('ballsprite', {
      start: 1,
      end: 215,
      zeroPad: 0,
      suffix: '.png',
    });

    this.anims.create({
      key: 'ballPulse',
      frames: frames,
      frameRate: 60,
      repeat: -1,
    });

    this.ball.anims.play('ballPulse', true);

    this.outofboundEffect = this.add.particles(0, 0, 'bubble', {
      quantity: 10,
      speed: 400,
      scale: { start: 0.5, end: 0 },
      lifespan: 1000,
      blendMode: 'ADD',
      frequency: 200,
      followOffset: { x: 0, y: 0 },
      angle: { min: 0, max: 360 },
      emitting: false,
    });

    this.streakEffect = this.add.particles(0, 0, 'flame3', {
      quantity: 10,
      speed: { min: 100, max: 200 },
      accelerationY: 1000 * dy,
      accelerationX: 1000 * dx,
      scale: { start: 1, end: 0.1 },
      lifespan: { min: 300, max: 1000 },
      blendMode: 'ADD',
      frequency: 300,
      followOffset: { x: 0, y: 0 },
      rotate: { min: -180, max: 180 },
    });

    this.streakEffect.stop();

    this.outofboundEffect.startFollow(this.ball);

    this.Socket?.on('reset', () => {
      if (this.loaded && this.soundEffectsEnabled && this.arcadeSoundEffect) {
        this.arcadeSoundEffect.play();
      }
      this.goalEffectToggle = true;
    });

    this.Socket?.on('skillOn', (player: number) => {
      switch (player) {
        case 1:
          this.p1frame?.setAlpha(1);
          break;
        case 2:
          this.p2frame?.setAlpha(1);
          break;
        default:
          break;
      }
    });
    this.Socket?.on('skillOff', (player: number) => {
      switch (player) {
        case 1:
          this.p1frame?.setAlpha(0.5);
          break;
        case 2:
          this.p2frame?.setAlpha(0.5);
          break;
        default:
          break;
      }
    });

    this.Socket?.emit('load', true);
    this.loaded = true;
  }

  trimName(name: string) {
    if (!name) return '';
    if (name.length >= 16) return (name.substring(0, 9) + '..').toUpperCase();
    else return name.toUpperCase();
  }

  handleCollision1 = () => {
    if (!this.paddle1) return;
    if (this.soundEffectsEnabled && this.laserSoundEffect) {
      this.laserSoundEffect.play();
    }
    const paddlebloom1 = this.paddle1.postFX.addBloom(0xffffff, 0.8, 0.8, 1, 3);
    this.time.addEvent({
      delay: 150,
      callback: () => {
        this.paddle1?.postFX.remove(paddlebloom1);
        paddlebloom1.destroy();
      },
    });
  };
  handleCollision2 = () => {
    {
      if (!this.paddle2) return;
      if (this.soundEffectsEnabled && this.laserSoundEffect) {
        this.laserSoundEffect.play();
      }
      const paddlebloom2 = this.paddle2.postFX.addBloom(
        0xffffff,
        0.8,
        0.8,
        1,
        3,
      );
      this.time.addEvent({
        delay: 150,
        callback: () => {
          this.paddle2?.postFX.remove(paddlebloom2);
          paddlebloom2.destroy();
        },
      });
    }
  };
  scoreNumber = (score: number) => {
    if (score < 10) return '0' + score;
    else return `${score}`;
  };

  updatePosition = () => {
    const data = this.prediction();
    if (this.goalEffectToggle) {
      this.triggerOutofBoundEffect();
      return;
    }
    if (data && !this.goalEffectToggle) {
      if (this.ball) {
        this.ball.x = data.ball.x;
        this.ball.y = data.ball.y;
      }
      if (this.paddle1) this.paddle1.y = data.paddle1.y;
      if (this.paddle2) this.paddle2.y = data.paddle2.y;
      if (this.prevDirectionX) {
        if (this.prevDirectionX < 0 && data.balldirection.x > 0)
          this.handleCollision1();
        else if (this.prevDirectionX > 0 && data.balldirection.x < 0)
          this.handleCollision2();
      }
      this.prevDirectionX = data.balldirection.x;
      this.prevDirectionY = data.balldirection.y;
      this.score = data.score;
    }
    if (this.goalEffectToggle) this.triggerOutofBoundEffect();
  };

  updateScore = () => {
    this.updatePlayerScore(this.p1scoretext, this.score.player1, 1);
    this.updatePlayerScore(this.p2scoretext, this.score.player2, 2);
  };

  updateStreak = (player: number) => {
    if (this.streak.player === player) {
      this.streak.streak++;
      if (this.streak.streak > 1) {
        switch (player) {
          case 1:
            {
              if (this.p1scoretext)
                this.streakEffect?.startFollow(this.p1scoretext);
              this.streakEffect?.start();
            }
            break;

          case 2:
            {
              if (this.p2scoretext)
                this.streakEffect?.startFollow(this.p2scoretext);
              this.streakEffect?.start();
            }
            break;
          default:
            break;
        }
      }
    } else {
      this.streakEffect?.stop();
      this.streak = { player: player, streak: 1 };
    }
  };
  updatePlayerScore = (
    scoreText: Phaser.GameObjects.BitmapText | undefined,
    playerScore: number,
    player: number,
  ) => {
    if (scoreText) {
      const score = this.scoreNumber(playerScore);
      if (scoreText.text !== score) {
        this.updateStreak(player);
        const barrel = scoreText.preFX?.addBarrel(2);
        scoreText.setText(score);
        setTimeout(() => {
          if (barrel) {
            scoreText.preFX?.remove(barrel);
            barrel.destroy();
          }
        }, 1000);
      }
    }
  };

  triggerOutofBoundEffect = () => {
    if (this.outofboundEffect) this.outofboundEffect.explode(1);

    this.cameras.main.shake(50, 0.005);
    const timer = setTimeout(() => {
      this.goalEffectToggle = false;
      this.Socket?.emit('load', true);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  };

  victoryEffect() {
    {
      if (this.ball) {
        const cameraX = Phaser.Math.Clamp(
          this.ball.x,
          this.windowsize.width / (2 * 1.2),
          this.windowsize.width - this.windowsize.width / (2 * 1.2),
        );
        const cameraY = Phaser.Math.Clamp(
          this.ball.y,
          this.windowsize.height / (2 * 1.2),
          this.windowsize.height - this.windowsize.height / (2 * 1.2),
        );
        this.cameras.main.zoomTo(1.2, 500);
        this.cameras.main.pan(cameraX, cameraY, 500);
      }
      this.time.timeScale = 0.5;
    }
  }
  updateEffect() {
    if (this.victoryHandler()) this.victoryEffect();
  }
  update() {
    this.keyloop();
    this.updatePosition();
    this.updateScore();
    this.updateEffect();
  }
}

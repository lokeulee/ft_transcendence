'use client';
import Phaser, { Game } from 'phaser';
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Socket } from 'socket.io-client';
import GameMainScene from './scenes/GameMainScene';
import GameReadyScene from './scenes/GameReadyScene';
import GameMatchFoundScene from './scenes/GameMatchFoundScene';
import { useGameSocket } from '@/lib/stores/useSocketStore';

interface GameRenderProps {
  setGameReady: Dispatch<SetStateAction<boolean>>;
  setSkillState: Dispatch<SetStateAction<boolean[]>>;
}

export default function GameRender({
  setGameReady,
  setSkillState,
}: GameRenderProps) {
  const score = {
    player1: 0,
    player2: 0,
  };

  // const ball = useRef<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>();
  // const paddle1 = useRef<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>();
  // const paddle2 = useRef<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>();

  const gameSocket = useGameSocket();

  if (!gameSocket) {
    return;
  }

  const mainGame = new GameMainScene(gameSocket);
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [
        new GameMatchFoundScene(),
        new GameReadyScene(gameSocket),
        mainGame,
      ],
    };

    const gameSession = new Phaser.Game(config);

    return () => {
      gameSession.destroy(true, true);
    };
  }, []);

  // useEffect(() => {
  //   gameSocket.on(
  //     'game',
  //     (data: {
  //       ball: { x: number; y: number };
  //       paddle1: { x: number; y: number };
  //       paddle2: { x: number; y: number };
  //       score: { player1: number; player2: number };
  //     }) => {
  //       // GameCoordinateProps = ball;
  //       if (ball.current) {
  //         ball.current.x = data.ball.x;
  //         ball.current.y = data.ball.y;
  //       }
  //       if (paddle1.current) paddle1.current.y = data.paddle1.y;
  //       if (paddle2.current) paddle2.current.y = data.paddle2.y;
  //       // score.player1 = data.score.player1;
  //       // score.player2 = data.score.player2;
  //     },
  //   );

  //   function setKeyStateFalse(event: KeyboardEvent) {
  //     keyState[event.key] = false;
  //   }

  //   function setKeyStateTrue(event: KeyboardEvent) {
  //     keyState[event.key] = true;
  //   }
  //   window.addEventListener('keyup', setKeyStateFalse, true);

  //   window.addEventListener('keydown', setKeyStateTrue, true);
  //   return () => {
  //     gameSocket.off('game');
  //     window.removeEventListener('keyup', setKeyStateFalse);
  //     window.removeEventListener('keydown', setKeyStateTrue);
  //   };
  // }, []);

  // function preload(this: Phaser.Scene) {
  //   const game = this;
  //   game.load.multiatlas('ballsprite', '/ball/ballsprite.json', 'ball');
  //   game.load.image('red', '/ball/bubble.png');
  //   game.load.image('test', '/ball/test3.png');
  //   game.load.image('paddle1', '/ball/paddle1.png');
  //   game.load.image('paddle2', '/ball/paddle2.png');
  // }

  // function create(this: Phaser.Scene) {
  //   const game = this;
  //   const particles = game.add.particles(0, 0, 'test', {
  //     speed: { min: -100, max: 100 },
  //     scale: { start: 0.01, end: 0 },
  //     lifespan: 2000,
  //     blendMode: 'ADD',

  //     followOffset: { x: 0, y: 0 },
  //     rotate: { min: -180, max: 180 },
  //   });

  //   particles.setFrequency(50, 1);
  //   ball.current = game.physics.add.sprite(400, 300, 'ballsprite', '0.png');
  //   // if (!ball) return;
  //   particles.startFollow(ball.current);
  //   const gameState = game.add.text(400, 50, '', { align: 'center' });
  //   gameState.setOrigin(0.5);
  //   paddle1.current = game.physics.add.sprite(15, 300, 'paddle1');
  //   paddle2.current = game.physics.add.sprite(785, 300, 'paddle2');

  //   // const paddle1 = game.add.graphics();
  //   // const paddle1 = useRef<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>();
  //   // const paddle2 = useRef<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>();

  //   game.physics.add.collider(ball.current, paddle1.current, handleCollision1);
  //   game.physics.add.collider(ball.current, paddle2.current, handleCollision2);
  //   function handleCollision1() {
  //     if (!paddle1.current) return;
  //     const paddlebloom1 = paddle1.current.postFX.addBloom(
  //       0xffffff,
  //       0.8,
  //       0.8,
  //       1,
  //       3,
  //     );
  //     // const effect = paddle1.current.postFX.addDisplacement('red', paddle1.current.x + paddle1.current.width / 2, ball.current.y)
  //     game.time.addEvent({
  //       delay: 150,
  //       callback: () => {
  //         paddle1.current?.postFX.remove(paddlebloom1);
  //         paddlebloom1.destroy();
  //       },
  //     });
  //   }
  //   function handleCollision2() {
  //     if (!paddle2.current) return;
  //     const paddlebloom2 = paddle2.current.postFX.addBloom(
  //       0xffffff,
  //       0.8,
  //       0.8,
  //       1,
  //       3,
  //     );
  //     // const effect = paddle1.current.postFX.addDisplacement('red', paddle1.current.x + paddle1.current.width / 2, ball.current.y)
  //     game.time.addEvent({
  //       delay: 150,
  //       callback: () => {
  //         paddle2.current?.postFX.remove(paddlebloom2);
  //         paddlebloom2.destroy();
  //       },
  //     });
  //   }

  //   const frames = game.anims.generateFrameNames('ballsprite', {
  //     start: 0,
  //     end: 215,
  //     zeroPad: 0,
  //     suffix: '.png',
  //   });

  //   game.anims.create({
  //     key: 'ballPulse',
  //     frames: frames,
  //     frameRate: 60,
  //     repeat: -1,
  //   });

  //   ball.current.anims.play('ballPulse', true);

  //   // useEffect(() => {
  //   //   gameSocket.on(
  //   //     'game',
  //   //     (data: {
  //   //       ball: { x: number; y: number };
  //   //       paddle1: { x: number; y: number };
  //   //       paddle2: { x: number; y: number };
  //   //       score: { player1: number; player2: number };
  //   //     }) => {

  //   //   },
  //   // );

  //   //   return () => {
  //   //     gameSocket.off('game');
  //   //   };
  //   // }, []);
  // }

  // const keyLoop = () => {
  //   if (keyState['w']) {
  //     gameSocket.emit('Player', 'w');
  //   }
  //   if (keyState['s']) {
  //     gameSocket.emit('Player', 's');
  //   }
  // };

  // function update(this: Phaser.Scene) {
  //   keyLoop();
  // }

  return null;
}
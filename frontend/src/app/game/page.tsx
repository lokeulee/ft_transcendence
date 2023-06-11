'use client';

import startGame from '@/components/game';
import { useEffect, useState } from 'react';
import Pong from '../../components/pong';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export default function Game() {
  // const [session, setSession] = useState(useSession());
  const { data: session } = useSession();
  const gameSocket = io('http://localhost:4242/gateway/game', {
    query: {
      user_id: session?.user?.id,
    }, autoConnect: false,
  });

  const Start = () => {
    const matchSocket = io('http://localhost:4242/gateway/matchmaking', {
      query: {
        user_id: session?.user?.id,
      },
    });
    matchSocket.on('match',(data: number) => {
      gameSocket.connect(),
      gameSocket.emit('join', data);
    });
  };

   // console.log(session);
  // // session.data?.user;

  // useEffect(() => {}, []);

  // const resetGame = () => {
  //   gameSocket.emit('Reset');
  // };

  // const stopGame = () => {
  //   gameSocket.emit('Stop');
  // };

  // const InitGame = () => {
  //   gameSocket.emit('initialize');
  // };

  return (
    <div>
      <button onClick={Start}>triggerOn</button>
      {/* <button onClick={resetGame}>Reset</button>
      <button onClick={stopGame}>Stop</button>
      <button onClick={InitGame}>Init</button> */}
    </div>
  );
}

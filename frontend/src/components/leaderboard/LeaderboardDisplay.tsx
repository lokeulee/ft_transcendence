'use client';
import { useEffect, useRef } from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { useProfileActions } from '@/lib/stores/useProfileStore';
import { useGameActions } from '@/lib/stores/useGameStore';
import { Statistic } from '@/types/StatisticTypes';

interface LeaderboardDisplayProps {
  rank: number;
  statistic: Statistic;
  isCurrentUser: boolean;
}

export default function LeaderboardDisplay({
  rank,
  statistic,
  isCurrentUser,
}: LeaderboardDisplayProps) {
  const leaderboardDisplay = useRef<HTMLDivElement | null>(null);
  const { getFavoritePath } = useProfileActions();
  const { getPathName } = useGameActions();

  useEffect(() => {
    let scrollTimeoutID: NodeJS.Timeout;

    if (isCurrentUser) {
      scrollTimeoutID = setTimeout(() => {
        const leaderboardDisplayElement = leaderboardDisplay.current;

        if (leaderboardDisplayElement) {
          leaderboardDisplayElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 1000);
    }

    return () => {
      clearTimeout(scrollTimeoutID);
    };
  }, []);

  const statsToDisplay = [
    { minWidth: '2.5vw', name: 'Wins', stat: `${statistic.wins}` },
    {
      minWidth: '4vw',
      name: 'Win Rate',
      stat: `${
        Math.round(
          (statistic.wins / (statistic.wins + statistic.losses) || 0) * 1000,
        ) / 10
      }%`,
    },
    {
      minWidth: '7vw',
      name: 'Highest Winstreak',
      stat: `${statistic.highest_winstreak}`,
    },
    {
      minWidth: '5.5vw',
      name: 'Favorite Path',
      stat: `${getPathName(getFavoritePath(statistic))}`,
    },
  ];

  return (
    <Box
      width='100%'
      height='7.85vh'
      boxSizing='border-box'
      display='flex'
      justifyContent='space-between'
      alignItems='center'
      padding='1vw'
      border={`${isCurrentUser ? 'dashed' : 'solid'} 2px black`}
      borderRadius='10px'
      bgcolor='#a291d290'
      ref={leaderboardDisplay}
    >
      <Box
        display='flex'
        justifyContent='flex-start'
        alignItems='center'
        gap='1vw'
      >
        <Typography variant='h6'>{`#${rank + 1}`}</Typography>
        <Avatar
          src={statistic.user.avatar_url}
          sx={{ border: 'solid 1px black' }}
        />
        <Typography variant='h6'>{statistic.user.username}</Typography>
      </Box>
      <Box
        width='30vw'
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        gap='1vw'
      >
        {statsToDisplay.map((statToDisplay, index) => (
          <Box key={index} minWidth={statToDisplay.minWidth}>
            <Typography variant='body2'>{statToDisplay.name}</Typography>
            <Typography variant='h5'>{statToDisplay.stat}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
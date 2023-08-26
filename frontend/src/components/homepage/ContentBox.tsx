'use client';
import { Box, Drawer } from '@mui/material';
import ChatBox from '../chat/ChatBox';
import { useEffect, useState } from 'react';
import { useCurrentView } from '@/lib/stores/useUtilStore';
import { View } from '@/types/UtilTypes';
import ProfileBox from '../profile/ProfileBox';
import GameMenu from '../game/GameMenu';
import GameRender from '../game/GameRender';
import GameLoadingScreen from '../game/GameLoadingScreen';
import GameReady from '../game/GameReady';

export default function ContentBox() {
  const currentView = useCurrentView();
  const [localView, setLocalView] = useState<View | false>(false);
  const [open, setOpen] = useState(false);
  const [toggleTimeoutID, setToggleTimeoutID] = useState<
    NodeJS.Timeout | undefined
  >();

  const [drawerStyles, setDrawerStyles] = useState({
    width: '60vw',
    height: '70vh',
    left: '20vw',
    bottom: '15vh',
    border: 'solid 5px #363636',
    borderRadius: '15px',
    background: '#3A0CA375',
  });
  useEffect(() => {
    clearTimeout(toggleTimeoutID);
    if (currentView) {
      if (open) {
        setOpen(false);
        setToggleTimeoutID(
          setTimeout(() => {
            setLocalView(currentView);
            setOpen(true);
          }, 1250),
        );
      } else {
        setLocalView(currentView);
        setOpen(true);
      }
    } else {
      setOpen(false);
    }
    const newStyles = localView === (View.PHASER || View.LOADING)
    ? { width: '70vw', height: '80vh', left: '15vw', bottom: '5vh'}
    : { width: '60vw', height: '70vh', left: '20vw',
    bottom: '15vh'};
  setDrawerStyles((prevStyles) => ({ ...prevStyles, ...newStyles }))
  }, [currentView, localView]);

  return (
    <Drawer
      PaperProps={{
        sx: drawerStyles,
      }}
      variant='persistent'
      anchor='bottom'
      transitionDuration={1000}
      open={open}
    >
      {localView === View.CHAT && <ChatBox />}
      {localView === View.PROFILE && <ProfileBox />}
      {localView === View.GAME && <GameMenu />}
      {localView === View.LOADING && <GameReady />}
      {localView === View.PHASER && (
          <GameRender />
      )}
    </Drawer>
  );
}

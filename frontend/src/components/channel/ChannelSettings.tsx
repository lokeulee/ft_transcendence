import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from '@mui/icons-material/Settings';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import EditIcon from '@mui/icons-material/Edit';
import BrushIcon from '@mui/icons-material/Brush';
import { IconButton, ListItemIcon, MenuList, Paper } from '@mui/material';
import { useState } from 'react';
import { ChannelMembers } from '@/types/ChannelMemberTypes';
import ChannelNameChangePrompt from './ChannelNameChangePrompt';
import ChannelTypeChangePrompt from './ChannelTypeChangePrompt';
import { ChannelMemberUnbanPrompt } from '../channel-member/ChannelMemberUnbanPrompt';
import { Channel } from '@/types/ChannelTypes';

interface ChannelSettingsProps {
  channelMember: ChannelMembers[];
  channel: Channel | undefined;
  selectedchannelID: number;
  handleAction: (...args: any) => Promise<void>;
  handleNameChange: (...args: any) => Promise<void>;
  handleTypeChange: (...args: any) => Promise<void>;
}

export default function ChannelSettings({
  channelMember,
  channel,
  selectedchannelID,
  handleAction,
  handleNameChange,
  handleTypeChange,
}: ChannelSettingsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        id='demo-positioned-button'
        aria-controls={open ? 'demo-positioned-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <SettingsIcon></SettingsIcon>
      </IconButton>
      <Menu
        id='demo-positioned-menu'
        aria-labelledby='demo-positioned-button'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ width: 320, maxWidth: '100%' }}>
          <MenuList>
            <MenuItem>
              <ListItemIcon>
                <SentimentVeryDissatisfiedIcon />
              </ListItemIcon>
              <ChannelMemberUnbanPrompt
                channelMembers={channelMember}
                handleAction={handleAction}
              ></ChannelMemberUnbanPrompt>
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ChannelNameChangePrompt
                channelID={selectedchannelID}
                handleAction={handleNameChange}
              ></ChannelNameChangePrompt>
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <BrushIcon />
              </ListItemIcon>
              <ChannelTypeChangePrompt
                channel={channel}
                handleAction={handleTypeChange}
              ></ChannelTypeChangePrompt>
            </MenuItem>
          </MenuList>
        </Paper>
      </Menu>
    </div>
  );
}

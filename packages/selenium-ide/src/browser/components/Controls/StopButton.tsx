import StopIcon from '@mui/icons-material/Stop'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import React, { FC } from 'react'
import baseControlProps from './BaseProps'
import languageMap from 'browser/I18N/keys'
import { FormattedMessage } from 'react-intl'

const StopButton: FC = () => (
  <Tooltip
    title={<FormattedMessage id={languageMap.testCore.stop} />}
    aria-label="stop"
  >
    <IconButton
      {...baseControlProps}
      onClick={() => {window.sideAPI.playback.stop();window.sideAPI.recorder.stop();}}
    >
      <StopIcon />
    </IconButton>
  </Tooltip>
)

export default StopButton

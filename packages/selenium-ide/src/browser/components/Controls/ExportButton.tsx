import React, { FC } from 'react'
import Tooltip from '@mui/material/Tooltip'
import baseControlProps from './BaseProps'
import IconButton from '@mui/material/IconButton'
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const ExportButton: FC = () => (
    <Tooltip title="Export to RTS" aria-label="Export">
      <IconButton
        {...baseControlProps}
        onClick={  function () {
            window.sideAPI.projects.getActive().then(function(project) {
               window.ws.send(JSON.stringify({'payload' : project, 'type': 'data'}));                
            })

            // send to web socket.
          }}
      >
        <ExitToAppIcon />
      </IconButton>
    </Tooltip>
  )

  export default ExportButton

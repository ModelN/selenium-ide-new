import RecordIcon from '@mui/icons-material/FiberManualRecord'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import React, { FC, useContext } from 'react'
import baseControlProps from './BaseProps'
import { FormattedMessage } from 'react-intl'
import languageMap from 'browser/I18N/keys'
import { context as activetestIDContext } from 'browser/contexts/active-test'

const RecordButton: FC = () => {
  const { activeTestID } = useContext(activetestIDContext)  
  return (
  <Tooltip
    title={<FormattedMessage id={languageMap.testCore.record} />}
    aria-label="record"
  >
    <IconButton
      {...baseControlProps}
      data-record
      onClick={function(){window.sideAPI.state.setActiveTest(activeTestID);
        window.sideAPI.recorder.start()} }
    >
      <RecordIcon color="error" />
    </IconButton>
  </Tooltip>
)

}

export default RecordButton

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import React from 'react'
import {TESTS_TAB } from 'browser/enums/tab'
import languageMap from 'browser/I18N/keys'
import { SIDEMainProps } from '../types'
import { FormattedMessage } from 'react-intl'

/**********顶部菜单栏tab*************/
function a11yProps(index: number) {
  return {
    'aria-controls': `tabpanel-${index}`,
    id: `tab-${index}`,
  }
}

const AppBarTabs: React.FC<Pick<SIDEMainProps, 'setTab' | 'tab'>> = ({
  setTab,
  tab,
}) => (
  <Tabs
    aria-label="Selenium IDE workflows"
    className="not-draggable"
    indicatorColor="secondary"
    onChange={(_e, v) => setTab(v)}
    textColor="inherit"
    value={tab}
  >
    <Tab
      label={<FormattedMessage id={languageMap.mainMenu.tests} />}
      {...a11yProps(TESTS_TAB)}
    />    
  </Tabs>
)

export default AppBarTabs

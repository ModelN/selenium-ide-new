import React from 'react'
import TabPanel from '../Tab/Panel'
import { PROJECT_TAB, TESTS_TAB } from '../../enums/tab'
import ProjectTab from '../../windows/ProjectEditor/tabs/Project/ProjectTab'
import TestsTab from '../../windows/ProjectEditor/tabs/Tests/TestsTab'
import { SIDEMainProps } from '../types'

const SIDEMain: React.FC<Pick<SIDEMainProps, 'setTab' | 'tab'>> = ({
  setTab,
  tab,
}) => (
  <>
    <TabPanel index={TESTS_TAB} value={0}>
      <TestsTab />
    </TabPanel>    
    <TabPanel index={PROJECT_TAB} value={tab}>
      <ProjectTab setTab={setTab} tab={tab} />
    </TabPanel>
  </>
)

export default SIDEMain

import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

const largeTabsStyle = `
  .large-tabs {
    font-size: 1.2rem;
  }
`;

export const LargeTabs = ({ children, ...props }) => (
  <div className="large-tabs-wrapper" style={{largeTabsStyle}}>
    <Tabs {...props} className="large-tabs">
      {children}
    </Tabs>
  </div>
);

export const LargeTabItem = TabItem;
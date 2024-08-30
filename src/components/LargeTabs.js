import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

const largeTabsStyle = `
  .large-tabs {
    font-size: 1.2rem;
  }
  .large-tabs .tabs__item {
    padding: 0.75rem 1.5rem;
  }
`;

export const LargeTabs = ({ children, ...props }) => (
  <div className="large-tabs-wrapper">
    <style>{largeTabsStyle}</style>
    <Tabs {...props} className="large-tabs">
      {children}
    </Tabs>
  </div>
);

export const LargeTabItem = TabItem;
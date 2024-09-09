// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import {LargeTabs, LargeTabItem} from '@site/src/components/LargeTabs';
import { CardLink, IndexCardLink, IndexCardLarge, HtmlToReactNode, NarrowCardLink } from '@site/src/components/CardComponents';
import { BrowserWindow, IframeWindow } from '@site/src/components/BrowserWindow';

export default {
  // Re-use the default mapping
  ...MDXComponents,

  Tabs,
  TabItem,

  BrowserWindow,
  IframeWindow,
  CardLink,
  IndexCardLink,
  IndexCardLarge,
  HtmlToReactNode,
  NarrowCardLink,
  LargeTabItem,
  LargeTabs,
};
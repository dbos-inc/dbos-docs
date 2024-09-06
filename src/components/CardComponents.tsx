/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';

import Heading from '@theme/Heading';
import styles from './styles.module.css';


function CardContainer({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): JSX.Element {
  if (href != "") {
    return (
      <Link
        href={href}
        className={clsx('card', styles.cardContainer)}>
        {children}
      </Link>
    );
  } else {
    return (
      <Link className={clsx('card', styles.cardContainer)}>
        {children}
      </Link>
    );
  }
}

// For example apps
function CardLayout({
  href,
  icon,
  title,
  language,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  language: string;
  description: string;
}): JSX.Element {
  let languageIcon = '';
  switch (language) {
    case 'python':
      languageIcon = 'img/python-logo-only.svg';
      break;
    case 'typescript':
      languageIcon = 'img/typescript-logo.svg';
      break;
  }
  return (
    <CardContainer href={href}>
      {icon && <div className={styles.cardIcon}>{icon}</div>}
      <Heading
        as="h4"
        className={clsx(styles.cardTitle)}
        title={title}>
        {title}
        {languageIcon && <img src={languageIcon} className={styles.cardLogo}/>}
      </Heading>
      {description && (
        <p
          // className={clsx('text--truncate', styles.cardDescription)}
          className={styles.cardDescription}
          title={description}>
          {description}
        </p>
      )}
    </CardContainer>
  );
}

export function CardLink({label, href, description, index, icon, language}: {label: string, href: string, description: string, index: string, icon: ReactNode, language: string}): JSX.Element {
  return (
    <article key={Number(index)} className="col col--6 margin-bottom--lg">
      <CardLayout
        href={href}
        icon={icon}
        title={label}
        language={language}
        description={description}
      />
    </article>
  );
}

// For Index Page
function IndexCardLayout({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
}): JSX.Element {
  return (
    <CardContainer href={href}>
      <div className={styles.indexCardBox}>
        <div className={styles.indexCardIcon} style={{width: '80px'}}>
          <div style={{display: 'flex', justifyContent: 'center', paddingTop: '1.2rem', height: '100%'}}>{icon}</div>
        </div>
        <div style={{width: '100%'}}>
          <Heading
            as="h4"
            className={styles.indexCardTitle}
            title={title}>
            {title}
          </Heading>
          {description && (
            <div
              // className={clsx('text--truncate', styles.cardDescription)}
              className={styles.indexCardDescription}
              title={title}>
              {description}
            </div>
          )}
        </div>
      </div>
    </CardContainer>
  );
}

export function IndexCardLink ({icon, label, href, description, index}: {title: string, label: string, href: string, description: ReactNode, index: string, icon: ReactNode}): JSX.Element {
  return (
    <article key={Number(index)} className="col col--6 margin-bottom--lg">
      <IndexCardLayout
        href={href}
        icon={icon}
        title={label}
        description={description}
      />
    </article>
  );
}

function IndexCardLargeLayout({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
}): JSX.Element {
  return (
    <CardContainer href={href}>
      <div className={styles.indexCardBox}>
        <div className={styles.indexCardIcon} style={{width: '150px'}}>
          <div style={{display: 'flex', justifyContent: 'center', padding: '15%', height: '100%'}}>{icon}</div>
        </div>
        <div style={{width: '100%'}}>
          <p
            className={styles.indexCardLargeTitle}
            title={title}>
            {title}
          </p>
          {description && (
            <p
              // className={clsx('text--truncate', styles.cardDescription)}
              className={styles.indexCardDescription}
              title={title}>
              {description}
            </p>
          )}
        </div>
      </div>
    </CardContainer>
  );
}

export function IndexCardLarge ({icon, label, href, description, index}: {title: string, label: string, href: string, description: ReactNode, index: string, icon: ReactNode}): JSX.Element {
  return (
    <article key={Number(index)} className="col margin-bottom--lg">
      <IndexCardLargeLayout
        href={href}
        icon={icon}
        title={label}
        description={description}
      />
    </article>
  );
}

export function HtmlToReactNode({ htmlString }) {
  return <span dangerouslySetInnerHTML={{ __html: htmlString }} />;
}

export function NarrowCardLink({label, href, description, index, icon, language}: {label: string, href: string, description: string, index: string, icon: ReactNode, language: string}): JSX.Element {
  return (
    <article key={Number(index)} className="col col--4 margin-bottom--lg">
      <CardLayout
        href={href}
        icon={icon}
        title={label}
        language={language}
        description={description}
      />
    </article>
  );
}
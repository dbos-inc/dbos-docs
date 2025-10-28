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
  if (href !== "") {
    return (
      <Link
        href={href}
        className={clsx('card', styles.cardContainer)}>
        {children}
      </Link>
    );
  } else {
    return (
      <div className={clsx('card', styles.cardContainer)}>
        {children}
      </div>
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
  hrefByLanguage,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  language: string | string[];
  description: string;
  hrefByLanguage?: {[lang:string]: string};
}): JSX.Element {
  const languages = Array.isArray(language) ? language : [language];

  const items = languages
    .map((lang) => {
      const iconSrc =
        lang === "python" ? "img/python-logo-only.svg" :
        lang === "typescript" ? "img/typescript-logo.svg" :
        lang === "go" ? "img/go-logo.svg" :
        lang === "java" ? "img/java-logo.svg" : "";
      if (!iconSrc) return null;
      return {
        lang,
        iconSrc,
        href: hrefByLanguage?.[lang] ?? href.replace(/^([^/]+)/, lang), // swap language segment if patterned
      };
    })
    .filter(Boolean) as { lang: string; iconSrc: string; href: string }[];

  return (
      <CardContainer href={items.length <= 1 ? href : ""}>
        {icon && items.length <= 1 && <div className={styles.cardIcon}>{icon}</div>}
        {icon && items.length > 1 && <Link href={href}><div className={styles.cardIcon}>{icon}</div></Link>}
        <Heading
          as="h4"
          className={clsx(styles.cardTitle)}
          title={title}
          >
          {items.length > 1 && <Link href={href}>{title}</Link>}
          {items.length <= 1 && <div>{title}</div>}
          {items.length === 1 && (
            <img src={items[0].iconSrc} alt={`${items[0].lang} logo`} className={styles.cardLogo}/>
          )}
          {items.length > 1 && (
            <div className={styles.cardLogos}>
              {items.map((item, index) => (
                <Link key={index}
                  href={item.href || href}
                >
                  <img alt={`${item.lang} logo`} src={item.iconSrc}/>
                </Link>
              ))}
            </div>
          )}
        </Heading>
        {description && items.length <= 1 && (
          <p
            className={styles.cardDescription}
            title={description}
          >
            {description}
          </p>
        )}
        {description && items.length > 1 && (
          <Link href={href}>
            <p
              className={styles.cardDescription}
              title={description}
            >
              {description}
            </p>
          </Link>
        )}
      </CardContainer>
    );
}

export function CardLink({label, href, description, index, icon, language, hrefByLanguage}: {
  label: string,
  href: string,
  description: string,
  index: string,
  icon: ReactNode,
  language: string | string[],
  hrefByLanguage?: {[lang:string]: string};
}): JSX.Element
{
  return (
    <article key={Number(index)} className="col col--6 margin-bottom--lg">
      <CardLayout
        href={href}
        icon={icon}
        title={label}
        language={language}
        description={description}
        hrefByLanguage={hrefByLanguage}
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
          {(typeof description == "string") && (
              <Heading
              as="h4"
              className={styles.indexCardTitle}
              title={title}>
              {title}
            </Heading>
            )
          }
          {(typeof description != "string") && (
              <Heading
              as="h4"
              className={styles.indexCardTitleLogo}
              title={title}>
              {title}
            </Heading>
            )
          }
          {description && (typeof description == "string") && (
            <p
              className={styles.indexCardDescription}
              title={title}>
              {description}
            </p>
          )}
          {description && (typeof description != "string") && (
            <p
              // className={clsx('text--truncate', styles.cardDescription)}
              className={styles.indexCardDescriptionLogo}
              title={title}>
              {description}
            </p>
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

export function NarrowCardLink({label, href, description, index, icon, language}: {label: string, href: string, description: string, index: string, icon: ReactNode, language: string | string[]}): JSX.Element {
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
import { useState } from 'react';
import Gallery from './Gallery';
import Playground from './Playground';
import styles from './App.module.css';

const GITHUB_URL = 'https://github.com/dpawlikowski/css-paint-worklet-kit';
const NPM_URL = 'https://npmjs.com/package/css-paint-worklet-kit';

type Tab = 'gallery' | 'playground';

export default function App() {
  const [tab, setTab] = useState<Tab>('gallery');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            <span>css-paint-worklet-kit</span>
          </div>
          <nav className={styles.nav}>
            <button
              className={`${styles.tab} ${tab === 'gallery' ? styles.active : ''}`}
              onClick={() => setTab('gallery')}
            >
              Gallery
            </button>
            <button
              className={`${styles.tab} ${tab === 'playground' ? styles.active : ''}`}
              onClick={() => setTab('playground')}
            >
              Playground
            </button>
          </nav>
          <div className={styles.links}>
            <a className={styles.iconLink} href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </a>
            <a className={styles.npm} href={NPM_URL} target="_blank" rel="noreferrer">
              npm
            </a>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {tab === 'gallery' ? <Gallery /> : <Playground />}
      </main>
    </div>
  );
}

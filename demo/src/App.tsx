import { useState } from 'react';
import Gallery from './Gallery';
import Playground from './Playground';
import styles from './App.module.css';

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
          <a
            className={styles.npm}
            href="https://npmjs.com/package/css-paint-worklet-kit"
            target="_blank"
            rel="noreferrer"
          >
            npm
          </a>
        </div>
      </header>

      <main className={styles.main}>
        {tab === 'gallery' ? <Gallery /> : <Playground />}
      </main>
    </div>
  );
}

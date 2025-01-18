import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2 className={styles.title}>
          Streamline, Learn, and Create a Virtual<br />
          You with One Click
        </h2>
        <p className={styles.subtitle}>
          Collect learning materials in one site, share and discuss with your students without burnout
        </p>
        
        <button className={styles.downloadButton}>
          Download Plugin
        </button>

        <div className={styles.demoImage}>
          <Image
            src="/demo-interface.png"
            alt="Platform interface demonstration"
            width={800}
            height={400}
            priority
          />
        </div>
      </main>
    </div>
  );
}
